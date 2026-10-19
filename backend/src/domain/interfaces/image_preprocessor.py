from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class IImagePreprocessor(ABC):
    @abstractmethod
    def preprocess(self, images: dict[str, Path], output_directory: Path) -> dict[str, Path]:
        """Remove background and normalize each image, returning its new path."""
