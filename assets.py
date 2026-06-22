"""Carregamento e cache de imagens (pecas, bases e palco).

Se um arquivo esperado nao existir, as funcoes retornam None e quem
chamou cai de volta no desenho vetorial (retangulos/elipses), entao o
programa funciona mesmo sem nenhuma imagem.

Para pecas, aceita tanto um arquivo por tamanho (cubo_p.png, cubo_m.png,
cubo_g.png) quanto um unico arquivo generico por forma (cubo.png), usado
para todos os tamanhos se os especificos nao existirem.
"""
import os

import pygame

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
PIECES_DIR = os.path.join(ASSETS_DIR, "pieces")
STAGE_DIR = os.path.join(ASSETS_DIR, "stage")

_raw_cache: dict[str, pygame.Surface] = {}
_scaled_cache: dict[tuple[str, int, int], pygame.Surface] = {}


def _load_raw(path: str) -> pygame.Surface | None:
    if path in _raw_cache:
        return _raw_cache[path]
    if not os.path.isfile(path):
        return None
    image = pygame.image.load(path).convert_alpha()
    _raw_cache[path] = image
    return image


def get_piece_image(shape: str, size: str, target_size: tuple[int, int]) -> pygame.Surface | None:
    """Retorna a imagem da peca ja escalada para target_size, ou None se nao houver arquivo.

    Tenta primeiro um arquivo especifico do tamanho (ex: cubo_p.png) e cai
    para o arquivo generico da forma (ex: cubo.png) se o especifico nao existir.
    """
    specific_path = os.path.join(PIECES_DIR, f"{shape}_{size.lower()}.png")
    if os.path.isfile(specific_path):
        return _get_scaled_fit(specific_path, target_size)
    generic_path = os.path.join(PIECES_DIR, f"{shape}.png")
    return _get_scaled_fit(generic_path, target_size)


def get_base_image(color_name: str, target_size: tuple[int, int]) -> pygame.Surface | None:
    """Retorna a imagem da base colorida ja escalada, ou None se nao houver arquivo."""
    path = os.path.join(PIECES_DIR, f"base_{color_name}.png")
    return _get_scaled_fit(path, target_size)


def get_stage_image() -> pygame.Surface | None:
    """Retorna a imagem original (sem escala) do fundo do palco, ou None se nao houver arquivo."""
    path = os.path.join(STAGE_DIR, "palco.png")
    return _load_raw(path)


def get_stage_image_scaled(target_size: tuple[int, int]) -> pygame.Surface | None:
    """Retorna a imagem do palco esticada para target_size exatamente (sem preservar proporcao)."""
    path = os.path.join(STAGE_DIR, "palco.png")
    return _get_scaled_stretch(path, target_size)


def _get_scaled_stretch(path: str, target_size: tuple[int, int]) -> pygame.Surface | None:
    target_size = (max(1, target_size[0]), max(1, target_size[1]))
    cache_key = (path, *target_size)
    if cache_key in _scaled_cache:
        return _scaled_cache[cache_key]
    raw = _load_raw(path)
    if raw is None:
        return None
    scaled = pygame.transform.smoothscale(raw, target_size)
    _scaled_cache[cache_key] = scaled
    return scaled


def _get_scaled_fit(path: str, target_size: tuple[int, int]) -> pygame.Surface | None:
    """Escala a imagem preservando a proporcao e centraliza num canvas transparente do tamanho pedido."""
    target_w, target_h = max(1, target_size[0]), max(1, target_size[1])
    cache_key = (path, target_w, target_h)
    if cache_key in _scaled_cache:
        return _scaled_cache[cache_key]
    raw = _load_raw(path)
    if raw is None:
        return None

    raw_w, raw_h = raw.get_size()
    scale = min(target_w / raw_w, target_h / raw_h)
    scaled_w, scaled_h = max(1, int(raw_w * scale)), max(1, int(raw_h * scale))
    scaled = pygame.transform.smoothscale(raw, (scaled_w, scaled_h))

    canvas = pygame.Surface((target_w, target_h), pygame.SRCALPHA)
    offset = ((target_w - scaled_w) // 2, (target_h - scaled_h) // 2)
    canvas.blit(scaled, offset)

    _scaled_cache[cache_key] = canvas
    return canvas
