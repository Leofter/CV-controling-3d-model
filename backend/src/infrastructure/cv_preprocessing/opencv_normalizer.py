from __future__ import annotations

import numpy as np
from PIL import Image, ImageEnhance

from src.domain.interfaces.image_normalizer import IImageNormalizer


class OpenCVImageNormalizer(IImageNormalizer):
    """Places the opaque subject in a square, colour-normalized RGBA canvas."""

    def __init__(self, canvas_size: int = 1024, padding_ratio: float = 0.10) -> None:
        self._canvas_size = canvas_size
        self._padding_ratio = padding_ratio

    def normalize(self, image: Image.Image) -> Image.Image:
        subject = image.convert("RGBA")
        alpha = np.asarray(subject.getchannel("A"))
        non_empty = np.argwhere(alpha > 8)
        if non_empty.size:
            top, left = non_empty.min(axis=0)
            bottom, right = non_empty.max(axis=0) + 1
            subject = subject.crop((int(left), int(top), int(right), int(bottom)))

        subject = self._normalize_contrast(subject)
        max_content = int(self._canvas_size * (1 - self._padding_ratio * 2))
        subject.thumbnail((max_content, max_content), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (self._canvas_size, self._canvas_size), (0, 0, 0, 0))
        canvas.alpha_composite(subject, ((self._canvas_size - subject.width) // 2, (self._canvas_size - subject.height) // 2))
        return canvas

    @staticmethod
    def _normalize_contrast(image: Image.Image) -> Image.Image:
        """CLAHE via OpenCV, with Pillow's contrast enhancer as portable fallback."""
        try:
            import cv2

            rgba = np.asarray(image)
            rgb = rgba[:, :, :3]
            lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
            lab[:, :, 0] = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8)).apply(lab[:, :, 0])
            normalized = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            return Image.fromarray(np.dstack((normalized, rgba[:, :, 3])), "RGBA")
        except Exception:
            return ImageEnhance.Contrast(image).enhance(1.06)
