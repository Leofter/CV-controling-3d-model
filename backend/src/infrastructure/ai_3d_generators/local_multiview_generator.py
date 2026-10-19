"""Extension seam for an on-premise PyTorch image-to-3D model."""

from __future__ import annotations

from pathlib import Path
from typing import Callable

from src.domain.interfaces.three_d_generator import I3DGeneratorProvider


class LocalMultiViewGeneratorAdapter(I3DGeneratorProvider):
    """Delegates to a configured InstantMesh, TripoSR or Hunyuan3D runner.

    Inject ``runner`` from an infrastructure bootstrap; use cases never depend
    on a particular CUDA/PyTorch implementation.
    """

    def __init__(self, runner: Callable[[dict[str, Path], Path], Path] | None = None) -> None:
        self._runner = runner

    def generate_mesh(self, images: dict[str, Path], output_path: Path) -> Path:
        if self._runner is None:
            raise RuntimeError(
                "No local image-to-3D runner is configured. Set EAGRO_GENERATOR=procedural "
                "for offline development or inject an InstantMesh/TripoSR runner."
            )
        return self._runner(images, output_path)
