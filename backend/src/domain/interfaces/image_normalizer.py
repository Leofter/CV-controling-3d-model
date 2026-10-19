from __future__ import annotations

from abc import ABC, abstractmethod

from PIL import Image


class IImageNormalizer(ABC):
    @abstractmethod
    def normalize(self, image: Image.Image) -> Image.Image:
        """Crop, centre, normalize and return a model-ready image."""
