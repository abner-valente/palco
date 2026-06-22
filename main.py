"""Palco de Papeis - prototipo local em Pygame.

Controles:
  - Arrastar com o botao esquerdo: mover peca/base, ou pegar uma nova
    peca/base da paleta lateral.
  - Scroll do mouse sobre a paleta: rola a coluna de pecas ou de bases
    (tambem da para arrastar a barra de rolagem na borda da coluna).
  - Clique com botao direito numa peca: entra em modo de conexao,
    clique em outra peca para ligar (ou ESC para cancelar).
  - Clique com botao direito numa base ja no palco: remove a base.
  - Arrastar uma peca/base para o icone de lixeira: remove o item.
  - Del (ou Backspace) com o mouse sobre uma peca/base: remove o item
    (e as conexoes ligadas a ele, se for peca).
  - Tecla L com o mouse sobre uma peca: abre digitacao de rotulo
    (Enter confirma, ESC cancela).
  - Ctrl+S ou botao "Salvar": salva a sessao em sessao.json.
  - Ctrl+L carrega a sessao salva.
  - A janela e redimensionavel; o palco se ajusta ao espaco disponivel.
"""
import json
import sys
from typing import cast

import pygame

import assets
from pieces import Piece, Base, Connection, SIZE_PX, BASE_COLORS, RESIZE_STEP

INITIAL_SIZE = (1280, 800)
MIN_SIZE = (700, 500)

PALETTE_COL_WIDTH = 140
PALETTE_TOTAL_WIDTH = PALETTE_COL_WIDTH * 2
STAGE_MARGIN = 40

BG_COLOR = (15, 12, 18)
PALETTE_BG = (28, 24, 32)
DIVIDER_COLOR = (60, 55, 65)
STAGE_COLORS = [(94, 62, 38), (110, 74, 46), (128, 88, 56), (148, 104, 68)]
SAVE_FILE = "sessao.json"

ZOOM_MIN = 0.5
ZOOM_MAX = 2.5
ZOOM_DEFAULT = 1.0
ZOOM_STEP = 0.1

SLIDER_WIDTH = 160
SLIDER_HEIGHT = 6
SLIDER_MARGIN = 18
SLIDER_HANDLE_RADIUS = 8
ZOOM_BUTTON_SIZE = 22

PIECE_SHAPES_SIZES = [
    ("cubo", "P"), ("cubo", "M"), ("cubo", "G"),
    ("cilindro", "P"), ("cilindro", "M"), ("cilindro", "G"),
    ("prisma", "P"), ("prisma", "M"), ("prisma", "G"),
]

PALETTE_ITEM_STEP = 100
PALETTE_ITEM_TOP = 50
PALETTE_BOTTOM_PAD = 40
SCROLLBAR_WIDTH = 5
SCROLL_WHEEL_STEP = 40

SAVE_BUTTON_RECT = pygame.Rect(0, 0, 120, 32)  # posicao real definida em save_button_rect()

TRASH_SIZE = 48


def build_palette_items():
    """Modelos de peca (coluna 1) e de base (coluna 2) da paleta lateral.

    Cada item e um molde: arrastar da paleta cria uma copia no palco, o
    item original continua disponivel para ser usado de novo quantas
    vezes for preciso.
    """
    piece_items = [("piece", shape, size) for shape, size in PIECE_SHAPES_SIZES]
    base_items = [("base", color_name, None) for color_name in BASE_COLORS]
    return piece_items, base_items


def column_content_height(items):
    return PALETTE_ITEM_TOP + PALETTE_ITEM_STEP * len(items) + PALETTE_BOTTOM_PAD


def column_max_scroll(items, height):
    return max(0, column_content_height(items) - height)


def column_positions(items, col_center_x, scroll):
    return [(col_center_x, PALETTE_ITEM_TOP + i * PALETTE_ITEM_STEP - scroll) for i in range(len(items))]


def scrollbar_thumb_rect(col_left, col_width, height, items, scroll):
    content_height = column_content_height(items)
    if content_height <= height:
        return None
    track_x = col_left + col_width - SCROLLBAR_WIDTH - 3
    thumb_h = max(24, int(height * height / content_height))
    max_scroll = column_max_scroll(items, height)
    t = scroll / max_scroll if max_scroll > 0 else 0
    thumb_y = int(t * (height - thumb_h))
    return pygame.Rect(track_x, thumb_y, SCROLLBAR_WIDTH, thumb_h)


def compute_stage_layout(width, height):
    """Calcula centro e raios do palco para caber no espaco livre (fora da paleta)."""
    available_w = width - PALETTE_TOTAL_WIDTH - STAGE_MARGIN * 2
    available_h = height - STAGE_MARGIN * 2
    available_w = max(available_w, 100)
    available_h = max(available_h, 100)

    base_radius = min(available_w / 2, available_h / 1.1) * 0.95
    radii = tuple(base_radius * ratio for ratio in (1.0, 0.833, 0.667, 0.5))

    cx = PALETTE_TOTAL_WIDTH + STAGE_MARGIN + available_w / 2
    cy = STAGE_MARGIN + available_h / 2
    return (cx, cy), radii


def draw_stage(surface, center, radii, width, height, zoom):
    stage_image = assets.get_stage_image()
    clip_rect = pygame.Rect(PALETTE_TOTAL_WIDTH, 0, max(0, width - PALETTE_TOTAL_WIDTH), height)
    previous_clip = surface.get_clip()
    surface.set_clip(clip_rect)
    try:
        if stage_image is not None:
            available_w = width - PALETTE_TOTAL_WIDTH - STAGE_MARGIN * 2
            available_h = height - STAGE_MARGIN * 2
            base_scale = min(available_w / stage_image.get_width(), available_h / stage_image.get_height())
            scale = base_scale * zoom
            target_size = (
                max(1, int(stage_image.get_width() * scale)),
                max(1, int(stage_image.get_height() * scale)),
            )
            scaled = cast(pygame.Surface, assets.get_stage_image_scaled(target_size))
            cx, cy = center
            rect = scaled.get_rect(center=(int(cx), int(cy)))
            surface.blit(scaled, rect)
            return

        cx, cy = center
        for radius, color in zip(radii, STAGE_COLORS):
            r = radius * zoom
            rect = pygame.Rect(cx - r, cy - r * 0.55, r * 2, int(r * 1.1))
            pygame.draw.ellipse(surface, color, rect)
            pygame.draw.ellipse(surface, (40, 25, 15), rect, width=2)
    finally:
        surface.set_clip(previous_clip)


def slider_layout(width, height):
    """Retorna o retangulo da barra de zoom e dos botoes -/+ no canto inferior direito do palco."""
    bar_x = width - SLIDER_WIDTH - SLIDER_MARGIN - ZOOM_BUTTON_SIZE - 6
    bar_y = height - SLIDER_MARGIN - SLIDER_HEIGHT // 2 - 30
    bar_rect = pygame.Rect(bar_x, bar_y, SLIDER_WIDTH, SLIDER_HEIGHT)
    minus_rect = pygame.Rect(bar_x - ZOOM_BUTTON_SIZE - 6, bar_y - ZOOM_BUTTON_SIZE // 2 + SLIDER_HEIGHT // 2,
                              ZOOM_BUTTON_SIZE, ZOOM_BUTTON_SIZE)
    plus_rect = pygame.Rect(bar_x + SLIDER_WIDTH + 6, bar_y - ZOOM_BUTTON_SIZE // 2 + SLIDER_HEIGHT // 2,
                             ZOOM_BUTTON_SIZE, ZOOM_BUTTON_SIZE)
    return bar_rect, minus_rect, plus_rect


def zoom_to_handle_x(bar_rect, zoom):
    t = (zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)
    return bar_rect.x + t * bar_rect.width


def handle_x_to_zoom(bar_rect, x):
    t = (x - bar_rect.x) / bar_rect.width
    t = max(0.0, min(1.0, t))
    return ZOOM_MIN + t * (ZOOM_MAX - ZOOM_MIN)


def draw_zoom_slider(surface, font, width, height, zoom):
    bar_rect, minus_rect, plus_rect = slider_layout(width, height)

    pygame.draw.rect(surface, (60, 55, 65), bar_rect, border_radius=3)
    handle_x = zoom_to_handle_x(bar_rect, zoom)
    handle_center = (int(handle_x), bar_rect.centery)
    pygame.draw.circle(surface, (220, 200, 160), handle_center, SLIDER_HANDLE_RADIUS)
    pygame.draw.circle(surface, (60, 40, 20), handle_center, SLIDER_HANDLE_RADIUS, width=2)

    for rect, label in ((minus_rect, "-"), (plus_rect, "+")):
        pygame.draw.rect(surface, (60, 55, 65), rect, border_radius=4)
        pygame.draw.rect(surface, (120, 110, 125), rect, width=1, border_radius=4)
        text = font.render(label, True, (220, 220, 220))
        surface.blit(text, (rect.centerx - text.get_width() // 2, rect.centery - text.get_height() // 2))

    zoom_label = font.render(f"Zoom palco: {int(zoom * 100)}%", True, (180, 180, 180))
    surface.blit(zoom_label, (bar_rect.x, bar_rect.y - 18))


def save_button_rect(width):
    return pygame.Rect(width - 140, 14, 120, 32)


def draw_save_button(surface, font, width):
    rect = save_button_rect(width)
    pygame.draw.rect(surface, (45, 95, 60), rect, border_radius=6)
    pygame.draw.rect(surface, (90, 160, 110), rect, width=1, border_radius=6)
    text = font.render("Salvar (Ctrl+S)", True, (235, 245, 235))
    surface.blit(text, (rect.centerx - text.get_width() // 2, rect.centery - text.get_height() // 2))


def trash_rect(width, height):
    x = PALETTE_TOTAL_WIDTH + STAGE_MARGIN // 2
    y = height - TRASH_SIZE - STAGE_MARGIN // 2
    return pygame.Rect(x, y, TRASH_SIZE, TRASH_SIZE)


def draw_trash(surface, width, height, highlighted):
    rect = trash_rect(width, height)
    bg_color = (120, 40, 40) if highlighted else (55, 45, 48)
    border_color = (230, 90, 90) if highlighted else (110, 95, 100)
    pygame.draw.rect(surface, bg_color, rect, border_radius=8)
    pygame.draw.rect(surface, border_color, rect, width=2, border_radius=8)

    icon_color = (240, 220, 220) if highlighted else (190, 175, 180)
    cx, cy = rect.center
    body_w, body_h = rect.width * 0.5, rect.height * 0.42
    body_rect = pygame.Rect(cx - body_w / 2, cy - body_h / 2 + 4, body_w, body_h)
    pygame.draw.rect(surface, icon_color, body_rect, width=2, border_radius=3)

    lid_y = body_rect.top - 2
    pygame.draw.line(surface, icon_color, (body_rect.left - 4, lid_y), (body_rect.right + 4, lid_y), width=2)
    pygame.draw.line(surface, icon_color, (cx - 5, lid_y - 6), (cx + 5, lid_y - 6), width=2)
    pygame.draw.line(surface, icon_color, (cx - 5, lid_y - 6), (cx - 5, lid_y), width=2)
    pygame.draw.line(surface, icon_color, (cx + 5, lid_y - 6), (cx + 5, lid_y), width=2)

    for dx in (-body_w * 0.2, 0, body_w * 0.2):
        pygame.draw.line(
            surface, icon_color,
            (cx + dx, body_rect.top + 4), (cx + dx, body_rect.bottom - 4),
            width=1,
        )


def draw_palette(surface, font, height, piece_items, piece_pos, base_items, base_pos, piece_scroll, base_scroll):
    pygame.draw.rect(surface, PALETTE_BG, pygame.Rect(0, 0, PALETTE_TOTAL_WIDTH, height))

    previous_clip = surface.get_clip()

    surface.set_clip(pygame.Rect(0, 0, PALETTE_COL_WIDTH, height))
    for item, (x, y) in zip(piece_items, piece_pos):
        _, shape, size = item
        r = SIZE_PX[size] * 0.7
        rect = pygame.Rect(x - r, y - r, r * 2, r * 2)
        image = assets.get_piece_image(shape, size, (rect.width, rect.height))
        if image is not None:
            surface.blit(image, rect)
        elif shape == "cubo":
            pygame.draw.rect(surface, (222, 184, 135), rect, border_radius=4)
            pygame.draw.rect(surface, (60, 40, 20), rect, width=2, border_radius=4)
        elif shape == "prisma":
            narrow_rect = pygame.Rect(x - r * 0.6, y - r, r * 1.2, r * 2)
            pygame.draw.rect(surface, (139, 101, 60), narrow_rect, border_radius=3)
            pygame.draw.rect(surface, (60, 40, 20), narrow_rect, width=2, border_radius=3)
        else:
            pygame.draw.ellipse(surface, (222, 184, 135), rect)
            pygame.draw.ellipse(surface, (60, 40, 20), rect, width=2)
        label = font.render(f"{shape[:3]} {size}", True, (200, 200, 200))
        surface.blit(label, (x - label.get_width() // 2, y + r + 4))
    surface.set_clip(previous_clip)

    surface.set_clip(pygame.Rect(PALETTE_COL_WIDTH, 0, PALETTE_COL_WIDTH, height))
    for item, (x, y) in zip(base_items, base_pos):
        _, color_name, _ = item
        r = 18
        rect = pygame.Rect(x - r, y - r * 0.5, r * 2, r)
        image = assets.get_base_image(color_name, (rect.width, rect.height))
        if image is not None:
            surface.blit(image, rect)
        else:
            color = BASE_COLORS[color_name]
            pygame.draw.ellipse(surface, color, rect)
            pygame.draw.ellipse(surface, (60, 40, 20), rect, width=2)
    surface.set_clip(previous_clip)

    pygame.draw.line(surface, DIVIDER_COLOR, (PALETTE_COL_WIDTH, 0), (PALETTE_COL_WIDTH, height), width=1)
    pygame.draw.line(surface, DIVIDER_COLOR, (PALETTE_TOTAL_WIDTH, 0), (PALETTE_TOTAL_WIDTH, height), width=2)

    piece_thumb = scrollbar_thumb_rect(0, PALETTE_COL_WIDTH, height, piece_items, piece_scroll)
    if piece_thumb is not None:
        pygame.draw.rect(surface, (110, 100, 115), piece_thumb, border_radius=3)
    base_thumb = scrollbar_thumb_rect(PALETTE_COL_WIDTH, PALETTE_COL_WIDTH, height, base_items, base_scroll)
    if base_thumb is not None:
        pygame.draw.rect(surface, (110, 100, 115), base_thumb, border_radius=3)


def main():
    pygame.init()
    width, height = INITIAL_SIZE
    screen = pygame.display.set_mode((width, height), pygame.RESIZABLE)
    pygame.display.set_caption("Palco de Papeis - prototipo")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("arial", 14)
    piece_label_font = pygame.font.SysFont("arial", 14, bold=True)
    label_font = pygame.font.SysFont("arial", 13, bold=True)

    piece_items, base_items = build_palette_items()

    pieces: list[Piece] = []
    bases: list[Base] = []
    connections: list[Connection] = []
    next_id = 0

    dragging_new_item = None  # item da paleta sendo arrastado (ainda nao colocado)
    dragging_obj = None  # Piece ou Base ja no palco sendo movido
    connect_source: Piece | None = None
    editing_label: Piece | None = None
    label_buffer = ""
    selected_connection: Connection | None = None
    CONNECTION_CLICK_THRESHOLD = 9
    zoom_level = ZOOM_DEFAULT
    dragging_slider = False
    piece_scroll = 0
    base_scroll = 0
    dragging_scrollbar = None  # "piece" ou "base"

    def new_id():
        nonlocal next_id
        next_id += 1
        return next_id

    def find_piece_at(pos):
        for piece in reversed(pieces):
            if piece.contains(*pos):
                return piece
        return None

    def find_connection_at(pos):
        best = None
        best_dist = CONNECTION_CLICK_THRESHOLD
        for conn in connections:
            dist = conn.distance_to(*pos)
            if dist <= best_dist:
                best = conn
                best_dist = dist
        return best

    def find_base_at(pos):
        for base in reversed(bases):
            if base.contains(*pos):
                return base
        return None

    def remove_piece(piece):
        pieces.remove(piece)
        connections[:] = [c for c in connections if not c.involves(piece)]

    def delete_dragged_object(obj):
        nonlocal connect_source
        if isinstance(obj, Piece):
            if connect_source is obj:
                connect_source = None
            remove_piece(obj)
        elif isinstance(obj, Base):
            bases.remove(obj)

    def save_session():
        data = {
            "pieces": [
                {
                    "id": p.id, "shape": p.shape, "size": p.size, "x": p.x, "y": p.y,
                    "label": p.label, "radius": p.radius,
                }
                for p in pieces
            ],
            "bases": [
                {"id": b.id, "color": b.color_name, "x": b.x, "y": b.y, "radius": b.radius}
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
            if "radius" in pd:
                piece.set_radius(pd["radius"])
            pieces.append(piece)
            id_map[pd["id"]] = piece
            max_id = max(max_id, pd["id"])
        for bd in data.get("bases", []):
            base = Base(bd["color"], bd["x"], bd["y"], bd["id"], radius=bd.get("radius", 34))
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
        piece_max_scroll = column_max_scroll(piece_items, height)
        base_max_scroll = column_max_scroll(base_items, height)
        piece_scroll = max(0, min(piece_scroll, piece_max_scroll))
        base_scroll = max(0, min(base_scroll, base_max_scroll))
        piece_pos = column_positions(piece_items, PALETTE_COL_WIDTH // 2, piece_scroll)
        base_pos = column_positions(base_items, PALETTE_COL_WIDTH + PALETTE_COL_WIDTH // 2, base_scroll)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.VIDEORESIZE:
                width = max(event.w, MIN_SIZE[0])
                height = max(event.h, MIN_SIZE[1])
                screen = pygame.display.set_mode((width, height), pygame.RESIZABLE)

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
                    if selected_connection is not None:
                        connections.remove(selected_connection)
                        selected_connection = None
                    else:
                        pos = pygame.mouse.get_pos()
                        piece = find_piece_at(pos)
                        base = find_base_at(pos)
                        if piece is not None:
                            delete_dragged_object(piece)
                        elif base is not None:
                            delete_dragged_object(base)

            elif event.type == pygame.MOUSEBUTTONDOWN and editing_label is None:
                pos = event.pos
                if event.button == 1:
                    bar_rect, minus_rect, plus_rect = slider_layout(width, height)
                    handle_x = zoom_to_handle_x(bar_rect, zoom_level)
                    handle_hit = pygame.Rect(0, 0, SLIDER_HANDLE_RADIUS * 2, SLIDER_HANDLE_RADIUS * 2)
                    handle_hit.center = (int(handle_x), bar_rect.centery)

                    piece_thumb = scrollbar_thumb_rect(0, PALETTE_COL_WIDTH, height, piece_items, piece_scroll)
                    base_thumb = scrollbar_thumb_rect(PALETTE_COL_WIDTH, PALETTE_COL_WIDTH, height, base_items, base_scroll)

                    if save_button_rect(width).collidepoint(pos):
                        save_session()
                    elif minus_rect.collidepoint(pos):
                        zoom_level = max(ZOOM_MIN, zoom_level - ZOOM_STEP)
                    elif plus_rect.collidepoint(pos):
                        zoom_level = min(ZOOM_MAX, zoom_level + ZOOM_STEP)
                    elif handle_hit.collidepoint(pos) or bar_rect.inflate(0, 12).collidepoint(pos):
                        dragging_slider = True
                        zoom_level = handle_x_to_zoom(bar_rect, pos[0])
                    elif piece_thumb is not None and piece_thumb.inflate(6, 0).collidepoint(pos):
                        dragging_scrollbar = "piece"
                    elif base_thumb is not None and base_thumb.inflate(6, 0).collidepoint(pos):
                        dragging_scrollbar = "base"
                    elif pos[0] < PALETTE_TOTAL_WIDTH:
                        items = piece_items if pos[0] < PALETTE_COL_WIDTH else base_items
                        positions = piece_pos if pos[0] < PALETTE_COL_WIDTH else base_pos
                        for item, ipos in zip(items, positions):
                            dx, dy = pos[0] - ipos[0], pos[1] - ipos[1]
                            if dx * dx + dy * dy <= 30 * 30:
                                dragging_new_item = item
                                break
                    else:
                        base = find_base_at(pos)
                        piece = find_piece_at(pos)
                        if piece is not None:
                            dragging_obj = piece
                            selected_connection = None
                        elif base is not None:
                            dragging_obj = base
                            selected_connection = None
                        else:
                            selected_connection = find_connection_at(pos)

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
                    if pos[0] >= PALETTE_TOTAL_WIDTH:
                        kind = dragging_new_item[0]
                        if kind == "piece":
                            _, shape, size = dragging_new_item
                            pieces.append(Piece(shape, cast(str, size), pos[0], pos[1], new_id()))
                        else:
                            _, color_name, _ = dragging_new_item
                            bases.append(Base(color_name, pos[0], pos[1], new_id()))
                    dragging_new_item = None
                if dragging_obj is not None and trash_rect(width, height).collidepoint(event.pos):
                    delete_dragged_object(dragging_obj)
                dragging_obj = None
                dragging_slider = False
                dragging_scrollbar = None

            elif event.type == pygame.MOUSEMOTION:
                if dragging_slider:
                    bar_rect, _, _ = slider_layout(width, height)
                    zoom_level = handle_x_to_zoom(bar_rect, event.pos[0])
                if dragging_scrollbar == "piece":
                    content_height = column_content_height(piece_items)
                    if content_height > height:
                        piece_scroll += event.rel[1] * content_height / height
                elif dragging_scrollbar == "base":
                    content_height = column_content_height(base_items)
                    if content_height > height:
                        base_scroll += event.rel[1] * content_height / height
                if dragging_obj is not None:
                    dragging_obj.x, dragging_obj.y = event.pos

            elif event.type == pygame.MOUSEWHEEL and editing_label is None:
                pos = pygame.mouse.get_pos()
                if pos[0] < PALETTE_COL_WIDTH:
                    piece_scroll -= event.y * SCROLL_WHEEL_STEP
                elif pos[0] < PALETTE_TOTAL_WIDTH:
                    base_scroll -= event.y * SCROLL_WHEEL_STEP
                else:
                    piece = find_piece_at(pos)
                    if piece is not None:
                        piece.resize(event.y * RESIZE_STEP)
                    else:
                        base = find_base_at(pos)
                        if base is not None:
                            base.resize(event.y * RESIZE_STEP)

        keys = pygame.key.get_pressed()
        if editing_label is None and keys[pygame.K_l]:
            pos = pygame.mouse.get_pos()
            piece = find_piece_at(pos)
            if piece is not None:
                editing_label = piece
                label_buffer = piece.label

        stage_center, stage_radii = compute_stage_layout(width, height)

        screen.fill(BG_COLOR)
        draw_stage(screen, stage_center, stage_radii, width, height, zoom_level)
        for base in bases:
            base.draw(screen)
        for conn in connections:
            conn.draw(screen, selected=(conn is selected_connection))
        for piece in pieces:
            piece.draw(screen, piece_label_font)
        if connect_source is not None:
            pygame.draw.circle(screen, (255, 255, 0), (int(connect_source.x), int(connect_source.y)),
                                connect_source.radius + 6, width=2)

        trash_highlighted = dragging_obj is not None and trash_rect(width, height).collidepoint(pygame.mouse.get_pos())
        draw_trash(screen, width, height, trash_highlighted)

        draw_palette(screen, font, height, piece_items, piece_pos, base_items, base_pos, piece_scroll, base_scroll)
        draw_zoom_slider(screen, font, width, height, zoom_level)
        draw_save_button(screen, font, width)

        if dragging_new_item is not None:
            mx, my = pygame.mouse.get_pos()
            kind = dragging_new_item[0]
            if kind == "piece":
                _, shape, size = dragging_new_item
                ghost = Piece(shape, cast(str, size), mx, my, -1)
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
            "Arraste da paleta | Scroll: redimensionar peca/base ou rolar paleta | Arraste p/ lixeira: remover | "
            "Botao direito em peca: conectar | Clique numa linha: selecionar | Del: remover | "
            "L: rotular | Ctrl+S salvar | Ctrl+L carregar"
        )
        help_surf = font.render(help_text, True, (180, 180, 180))
        screen.blit(help_surf, (PALETTE_TOTAL_WIDTH + 10, height - 24))

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
