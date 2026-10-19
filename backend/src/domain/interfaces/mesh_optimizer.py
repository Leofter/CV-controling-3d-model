from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class IMeshOptimizer(ABC):
    @abstractmethod
    def optimize(self, input_path: Path, output_path: Path) -> Path:
        """Center the pivot, normalize size and write a binary GLB."""
