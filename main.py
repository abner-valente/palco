"""Palco de Papeis - prototipo local em Pygame.

Controles:
  - Arrastar com o botao esquerdo: mover peca/base, ou pegar uma nova
    peca/base da paleta lateral.
  - Clique com botao direito numa peca: entra em modo de conexao,
    clique em outra peca para ligar (ou ESC para cancelar).
  - Clique com botao direito numa peca/base ja no palco: remove o item
    (e as conexoes ligadas a ele).
  - Tecla L com uma peca selecionada (clique simples) abre digitacao
    de rotulo (Enter confirma, ESC cancela).
  - Ctrl+S salva a sessao em sessao.json, Ctrl+L carrega.
"""
import json
import sys

import pygame

from pieces import Piece, Base, Connection, SIZE_PX, BASE_COLORS

WIDTH, HEIGHT = 1280, 800
STAGE_CENTER = (WIDTH // 2, HEIGHT // 2 + 40)
STAGE_RADII = (360, 300, 240, 180)
PALETTE_WIDTH = 170

BG_COLOR = (15, 12, 18)
STAGE_COLORS = [(94, 62, 38), (110, 74, 46), (128, 88, 56), (148, 104, 68)]
SAVE_FILE = "sessao.json"


def build_palette_items():
    """Define os modelos de peca/base disponiveis na paleta lateral.

    Cada item e um molde: arrastar da paleta cria uma copia no palco, o
    item original continua disponivel para ser usado de novo quantas
    vezes for preciso.
    """
    items = []
    for shape in ("cubo", "cilindro"):
        for size in ("P", "M", "G"):
            items.append(("piece", shape, size))
    for color_name in BASE_COLORS:
        items.append(("base", color_name, None))
    return items


def palette_positions(items):
    """Calcula a posicao (x, y) de cada item na paleta lateral, com rolagem simples por coluna."""
    positions = []
    x = PALETTE_WIDTH // 2
    y = 50
    step = 100
    for item in items:
        positions.append((x, y))
        y += step
        if y > HEIGHT - 50:
            y = 50
            x += PALETTE_WIDTH
    return positions


def draw_stage(surface):
    cx, cy = STAGE_CENTER
    for radius, color in zip(STAGE_RADII, STAGE_COLORS):
        pygame.draw.ellipse(
            surface, color,
            pygame.Rect(cx - radius, cy - radius * 0.55, radius * 2, int(radius * 1.1))
        )
        pygame.draw.ellipse(
            surface, (40, 25, 15),
            pygame.Rect(cx - radius, cy - radius * 0.55, radius * 2, int(radius * 1.1)),
            width=2
        )


def draw_palette(surface, font, items, positions):
    pygame.draw.rect(surface, (28, 24, 32), pygame.Rect(0, 0, PALETTE_WIDTH * 2, HEIGHT))
    for item, (x, y) in zip(items, positions):
        kind = item[0]
        if kind == "piece":
            _, shape, size = item
            r = SIZE_PX[size] * 0.7
            rect = pygame.Rect(x - r, y - r, r * 2, r * 2)
            if shape == "cubo":
                pygame.draw.rect(surface, (222, 184, 135), rect, border_radius=4)
                pygame.draw.rect(surface, (60, 40, 20), rect, width=2, border_radius=4)
            else:
                pygame.draw.ellipse(surface, (222, 184, 135), rect)
                pygame.draw.ellipse(surface, (60, 40, 20), rect, width=2)
            label = font.render(f"{shape[:3]} {size}", True, (200, 200, 200))
            surface.blit(label, (x - label.get_width() // 2, y + r + 4))
        else:
            _, color_name, _ = item
            color = BASE_COLORS[color_name]
            r = 18
            pygame.draw.ellipse(surface, color, pygame.Rect(x - r, y - r * 0.5, r * 2, r))
            pygame.draw.ellipse(surface, (60, 40, 20), pygame.Rect(x - r, y - r * 0.5, r * 2, r), width=2)


def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Palco de Papeis - prototipo")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("arial", 14)
    label_font = pygame.font.SysFont("arial", 13, bold=True)

    palette_items = build_palette_items()
    palette_pos = palette_positions(palette_items)

    pieces: list[Piece] = []
    bases: list[Base] = []
    connections: list[Connection] = []
    next_id = 0

    dragging_new_item = None  # item da paleta sendo arrastado (ainda nao colocado)
    dragging_obj = None  # Piece ou Base ja no palco sendo movido
    connect_source: Piece | None = None
    editing_label: Piece | None = None
    label_buffer = ""

    def new_id():
        nonlocal next_id
        next_id += 1
        return next_id

    def find_piece_at(pos):
        for piece in reversed(pieces):
            if piece.contains(*pos):
                return piece
        return None

    def find_base_at(pos):
        for base in reversed(bases):
            if base.contains(*pos):
                return base
        return None

    def remove_piece(piece):
        pieces.remove(piece)
        connections[:] = [c for c in connections if not c.involves(piece)]

    def save_session():
        data = {
            "pieces": [
                {"id": p.id, "shape": p.shape, "size": p.size, "x": p.x, "y": p.y, "label": p.label}
                for p in pieces
            ],
            "bases": [
                {"id": b.id, "color": b.color_name, "x": b.x, "y": b.y}
                for b in bases
            ],
            "connections": [
                {"a": c.piece_a.id, "b": c.piece_b.id} for c in connections
            ],
        }
        with open(SAVE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Sessao salva em {SAVE_FILE}")

    def load_session():
        nonlocal next_id
        try:
            with open(SAVE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            print("Nenhuma sessao salva encontrada.")
            return
        pieces.clear()
        bases.clear()
        connections.clear()
        id_map = {}
        max_id = 0
        for pd in data.get("pieces", []):
            piece = Piece(pd["shape"], pd["size"], pd["x"], pd["y"], pd["id"])
            piece.label = pd.get("label", "")
            pieces.append(piece)
            id_map[pd["id"]] = piece
            max_id = max(max_id, pd["id"])
        for bd in data.get("bases", []):
            base = Base(bd["color"], bd["x"], bd["y"], bd["id"])
            bases.append(base)
            max_id = max(max_id, bd["id"])
        for cd in data.get("connections", []):
            a = id_map.get(cd["a"])
            b = id_map.get(cd["b"])
            if a and b:
                connections.append(Connection(a, b))
        next_id = max_id
        print(f"Sessao carregada de {SAVE_FILE}")

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.KEYDOWN:
                if editing_label is not None:
                    if event.key == pygame.K_RETURN:
                        editing_label.label = label_buffer
                        editing_label = None
                        label_buffer = ""
                    elif event.key == pygame.K_ESCAPE:
                        editing_label = None
                        label_buffer = ""
                    elif event.key == pygame.K_BACKSPACE:
                        label_buffer = label_buffer[:-1]
                    else:
                        if event.unicode and len(label_buffer) < 18:
                            label_buffer += event.unicode
                elif event.key == pygame.K_ESCAPE:
                    connect_source = None
                elif event.mod & pygame.KMOD_CTRL and event.key == pygame.K_s:
                    save_session()
                elif event.mod & pygame.KMOD_CTRL and event.key == pygame.K_l:
                    load_session()
                elif event.key in (pygame.K_DELETE, pygame.K_BACKSPACE):
                    pos = pygame.mouse.get_pos()
                    piece = find_piece_at(pos)
                    base = find_base_at(pos)
                    if piece is not None:
                        if connect_source is piece:
                            connect_source = None
                        remove_piece(piece)
                    elif base is not None:
                        bases.remove(base)

            elif event.type == pygame.MOUSEBUTTONDOWN and editing_label is None:
                pos = event.pos
                if event.button == 1:
                    if pos[0] < PALETTE_WIDTH * 2:
                        for item, ipos in zip(palette_items, palette_pos):
                            dx, dy = pos[0] - ipos[0], pos[1] - ipos[1]
                            if dx * dx + dy * dy <= 30 * 30:
                                dragging_new_item = item
                                break
                    else:
                        base = find_base_at(pos)
                        piece = find_piece_at(pos)
                        if piece is not None:
                            dragging_obj = piece
                        elif base is not None:
                            dragging_obj = base

                elif event.button == 3:
                    piece = find_piece_at(pos)
                    if piece is not None:
                        if connect_source is None:
                            connect_source = piece
                        elif connect_source is piece:
                            connect_source = None
                        else:
                            connections.append(Connection(connect_source, piece))
                            connect_source = None
                    else:
                        base = find_base_at(pos)
                        if base is not None:
                            bases.remove(base)

            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                if dragging_new_item is not None:
                    pos = event.pos
                    if pos[0] >= PALETTE_WIDTH * 2:
                        kind = dragging_new_item[0]
                        if kind == "piece":
                            _, shape, size = dragging_new_item
                            pieces.append(Piece(shape, size, pos[0], pos[1], new_id()))
                        else:
                            _, color_name, _ = dragging_new_item
                            bases.append(Base(color_name, pos[0], pos[1], new_id()))
                    dragging_new_item = None
                dragging_obj = None

            elif event.type == pygame.MOUSEMOTION:
                if dragging_obj is not None:
                    dragging_obj.x, dragging_obj.y = event.pos

            elif event.type == pygame.KEYDOWN:
                pass

        keys = pygame.key.get_pressed()
        if editing_label is None and keys[pygame.K_l]:
            pos = pygame.mouse.get_pos()
            piece = find_piece_at(pos)
            if piece is not None:
                editing_label = piece
                label_buffer = piece.label

        screen.fill(BG_COLOR)
        draw_stage(screen)
        for base in bases:
            base.draw(screen)
        for conn in connections:
            conn.draw(screen)
        for piece in pieces:
            piece.draw(screen, font)
        if connect_source is not None:
            pygame.draw.circle(screen, (255, 255, 0), (int(connect_source.x), int(connect_source.y)),
                                connect_source.radius + 6, width=2)

        draw_palette(screen, font, palette_items, palette_pos)

        if dragging_new_item is not None:
            mx, my = pygame.mouse.get_pos()
            kind = dragging_new_item[0]
            if kind == "piece":
                _, shape, size = dragging_new_item
                ghost = Piece(shape, size, mx, my, -1)
                ghost.draw(screen, font)
            else:
                _, color_name, _ = dragging_new_item
                ghost = Base(color_name, mx, my, -1)
                ghost.draw(screen)

        if editing_label is not None:
            box = pygame.Rect(editing_label.x - 60, editing_label.y - editing_label.radius - 28, 120, 22)
            pygame.draw.rect(screen, (250, 250, 250), box)
            pygame.draw.rect(screen, (0, 0, 0), box, width=1)
            text = label_font.render(label_buffer or "|", True, (0, 0, 0))
            screen.blit(text, (box.x + 4, box.y + 3))

        help_text = (
            "Arraste da paleta | Botao direito: conectar/remover base | "
            "Del sobre peca/base: remover | L: rotular | Ctrl+S salvar | Ctrl+L carregar"
        )
        help_surf = font.render(help_text, True, (180, 180, 180))
        screen.blit(help_surf, (PALETTE_WIDTH * 2 + 10, HEIGHT - 24))

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
