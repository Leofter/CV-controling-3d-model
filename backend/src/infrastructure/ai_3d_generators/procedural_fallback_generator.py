"""A deterministic offline generator used while a production model provider is absent."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
import trimesh

from src.domain.interfaces.three_d_generator import I3DGeneratorProvider


class ProceduralFallbackGenerator(I3DGeneratorProvider):
    """Build a coloured organic proxy so every image-to-3D request completes.

    It is intentionally a development fallback, not a photogrammetry substitute.
    The adapter shares the exact contract used by InstantMesh/TripoSR/API adapters.
    """

    def generate_mesh(self, images: dict[str, Path], output_path: Path) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        colour = self._representative_colour(next(iter(images.values())))
        # A slightly elongated, tapered mesh reads better as a fruit/plant proxy
        # than a perfect sphere and remains ideal for gesture/pivot tests.
        mesh = trimesh.creation.icosphere(subdivisions=4, radius=1.0)
        vertices = mesh.vertices.copy()
        vertices[:, 1] *= 1.16
        vertices[:, 0] *= 0.88
        vertices[:, 2] *= 0.88
        mesh.vertices = vertices
        mesh.visual.vertex_colors = np.tile(np.array([*colour, 255], dtype=np.uint8), (len(mesh.vertices), 1))
        mesh.export(output_path, file_type="glb")
        return output_path

    @staticmethod
    def _representative_colour(image_path: Path) -> tuple[int, int, int]:
        image = Image.open(image_path).convert("RGBA").resize((64, 64))
        values = np.asarray(image)
        visible = values[values[:, :, 3] > 15, :3]
        if visible.size == 0:
            return (102, 140, 68)
        median = np.median(visible, axis=0).astype(int)
        return tuple(int(channel) for channel in median)
