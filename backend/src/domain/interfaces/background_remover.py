from __future__ import annotations

from abc import ABC, abstractmethod

from PIL import Image


class IBackgroundRemover(ABC):
    @abstractmethod
    def remove(self, image: Image.Image) -> Image.Image:
        """Return the subject isolated in an RGBA image."""
