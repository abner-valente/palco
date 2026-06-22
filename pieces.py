"""Modelos das peças (cubos/cilindros) e bases do Palco de Papéis."""
import math
import pygame

import assets

WOOD_LIGHT = (222, 184, 135)
WOOD_DARK = (139, 101, 60)
OUTLINE = (60, 40, 20)

SIZE_PX = {
    "P": 28,
    "M": 40,
    "G": 56,
}

MIN_RADIUS = 14
MAX_RADIUS = 100
RESIZE_STEP = 3


class Piece:
    """Uma peça (cubo ou cilindro) que pode ser arrastada e redimensionada pelo palco."""

    def __init__(self, shape: str, size: str, x: float, y: float, piece_id: int):
        self.shape = shape  # "cubo", "cilindro" ou "prisma"
        self.size = size  # "P", "M", "G" (tamanho de origem, so para referencia)
        self.x = x
        self.y = y
        self.id = piece_id
        self.label = ""  # nome opcional da persona representada
        self.dragging = False
        self.drag_offset = (0, 0)
        self._radius = SIZE_PX[size]

    @property
    def radius(self) -> int:
        return self._radius

    def resize(self, delta: int):
        self._radius = max(MIN_RADIUS, min(MAX_RADIUS, self._radius + delta))

    def set_radius(self, radius: int):
        self._radius = max(MIN_RADIUS, min(MAX_RADIUS, radius))

    def contains(self, px: float, py: float) -> bool:
        return math.hypot(px - self.x, py - self.y) <= self.radius

    def draw(self, surface: pygame.Surface, font: pygame.font.Font):
        r = self.radius
        rect = pygame.Rect(self.x - r, self.y - r, r * 2, r * 2)
        image = assets.get_piece_image(self.shape, self.size, (r * 2, r * 2))
        if image is not None:
            surface.blit(image, rect)
        elif self.shape == "cubo":
            pygame.draw.rect(surface, WOOD_LIGHT, rect, border_radius=4)
            pygame.draw.rect(surface, OUTLINE, rect, width=2, border_radius=4)
        elif self.shape == "prisma":
            narrow_rect = pygame.Rect(self.x - r * 0.6, self.y - r, r * 1.2, r * 2)
            pygame.draw.rect(surface, WOOD_DARK, narrow_rect, border_radius=3)
            pygame.draw.rect(surface, OUTLINE, narrow_rect, width=2, border_radius=3)
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

    MIN_RADIUS = 16
    MAX_RADIUS = 80

    def __init__(self, color_name: str, x: float, y: float, base_id: int, radius: int = 34):
        self.color_name = color_name
        self.x = x
        self.y = y
        self.id = base_id
        self.radius = radius
        self.dragging = False
        self.drag_offset = (0, 0)

    def resize(self, delta: int):
        self.radius = max(self.MIN_RADIUS, min(self.MAX_RADIUS, self.radius + delta))

    def contains(self, px: float, py: float) -> bool:
        return math.hypot(px - self.x, py - self.y) <= self.radius

    def draw(self, surface: pygame.Surface):
        rect = pygame.Rect(self.x - self.radius, self.y - self.radius * 0.5, self.radius * 2, self.radius)
        image = assets.get_base_image(self.color_name, (rect.width, rect.height))
        if image is not None:
            surface.blit(image, rect)
            return
        color = BASE_COLORS.get(self.color_name, (150, 150, 150))
        pygame.draw.ellipse(surface, color, rect)
        pygame.draw.ellipse(surface, OUTLINE, rect, width=2)


class Connection:
    """Linha de ligação entre duas peças."""

    def __init__(self, piece_a: Piece, piece_b: Piece):
        self.piece_a = piece_a
        self.piece_b = piece_b

    def involves(self, piece: Piece) -> bool:
        return piece is self.piece_a or piece is self.piece_b

    def distance_to(self, px: float, py: float) -> float:
        """Distancia do ponto (px, py) ao segmento de reta da conexao."""
        ax, ay = self.piece_a.x, self.piece_a.y
        bx, by = self.piece_b.x, self.piece_b.y
        dx, dy = bx - ax, by - ay
        length_sq = dx * dx + dy * dy
        if length_sq == 0:
            return math.hypot(px - ax, py - ay)
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / length_sq))
        proj_x, proj_y = ax + t * dx, ay + t * dy
        return math.hypot(px - proj_x, py - proj_y)

    def draw(self, surface: pygame.Surface, selected: bool = False):
        color = (255, 220, 60) if selected else (240, 240, 240)
        width = 4 if selected else 2
        pygame.draw.line(
            surface, color,
            (self.piece_a.x, self.piece_a.y), (self.piece_b.x, self.piece_b.y),
            width=width
        )
