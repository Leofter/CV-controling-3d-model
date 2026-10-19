from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class I3DGeneratorProvider(ABC):
    @abstractmethod
    def generate_mesh(self, images: dict[str, Path], output_path: Path) -> Path:
        """Generate a mesh at output_path from normalized multi-angle images."""
