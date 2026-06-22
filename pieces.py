"""Modelos das peças (cubos/cilindros) e bases do Palco de Papéis."""
import math
import pygame

WOOD_LIGHT = (222, 184, 135)
WOOD_DARK = (139, 101, 60)
OUTLINE = (60, 40, 20)

SIZE_PX = {
    "P": 28,
    "M": 40,
    "G": 56,
}


class Piece:
    """Uma peça (cubo ou cilindro) que pode ser arrastada pelo palco."""

    def __init__(self, shape: str, size: str, x: float, y: float, piece_id: int):
        self.shape = shape  # "cubo" ou "cilindro"
        self.size = size  # "P", "M", "G"
        self.x = x
        self.y = y
        self.id = piece_id
        self.label = ""  # nome opcional da persona representada
        self.dragging = False
        self.drag_offset = (0, 0)

    @property
    def radius(self) -> int:
        return SIZE_PX[self.size]

    def contains(self, px: float, py: float) -> bool:
        return math.hypot(px - self.x, py - self.y) <= self.radius

    def draw(self, surface: pygame.Surface, font: pygame.font.Font):
        r = self.radius
        rect = pygame.Rect(self.x - r, self.y - r, r * 2, r * 2)
        if self.shape == "cubo":
            pygame.draw.rect(surface, WOOD_LIGHT, rect, border_radius=4)
            pygame.draw.rect(surface, OUTLINE, rect, width=2, border_radius=4)
        else:
            pygame.draw.ellipse(surface, WOOD_LIGHT, rect)
            pygame.draw.ellipse(surface, OUTLINE, rect, width=2)

        if self.label:
            text = font.render(self.label, True, (20, 20, 20))
            surface.blit(text, (self.x - text.get_width() // 2, self.y - text.get_height() // 2))


BASE_COLORS = {
    "vermelho": (200, 40, 40),
    "verde": (40, 160, 60),
    "azul": (40, 70, 200),
    "amarelo": (230, 200, 40),
    "laranja": (230, 130, 40),
    "rosa": (230, 60, 150),
    "preto": (25, 25, 25),
    "branco": (240, 240, 240),
}


class Base:
    """Um círculo colorido posicionado embaixo de uma peça para indicar significado."""

    def __init__(self, color_name: str, x: float, y: float, base_id: int, radius: int = 34):
        self.color_name = color_name
        self.x = x
        self.y = y
        self.id = base_id
        self.radius = radius
        self.dragging = False
        self.drag_offset = (0, 0)

    def contains(self, px: float, py: float) -> bool:
        return math.hypot(px - self.x, py - self.y) <= self.radius

    def draw(self, surface: pygame.Surface):
        color = BASE_COLORS.get(self.color_name, (150, 150, 150))
        pygame.draw.ellipse(
            surface, color,
            pygame.Rect(self.x - self.radius, self.y - self.radius * 0.5, self.radius * 2, self.radius)
        )
        pygame.draw.ellipse(
            surface, OUTLINE,
            pygame.Rect(self.x - self.radius, self.y - self.radius * 0.5, self.radius * 2, self.radius),
            width=2
        )


class Connection:
    """Linha de ligação entre duas peças."""

    def __init__(self, piece_a: Piece, piece_b: Piece):
        self.piece_a = piece_a
        self.piece_b = piece_b

    def involves(self, piece: Piece) -> bool:
        return piece is self.piece_a or piece is self.piece_b

    def draw(self, surface: pygame.Surface):
        pygame.draw.line(
            surface, (240, 240, 240),
            (self.piece_a.x, self.piece_a.y), (self.piece_b.x, self.piece_b.y),
            width=2
        )
