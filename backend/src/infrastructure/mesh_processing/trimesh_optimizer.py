from __future__ import annotations

from pathlib import Path

import numpy as np
import trimesh

from src.domain.interfaces.mesh_optimizer import IMeshOptimizer


class TrimeshOptimizer(IMeshOptimizer):
    """Normalizes user/generated models to the scene origin and unit diameter."""

    def optimize(self, input_path: Path, output_path: Path) -> Path:
        if input_path.suffix.lower() not in {".glb", ".gltf", ".obj", ".ply", ".stl"}:
            raise ValueError("Supported mesh formats: .glb, .gltf, .obj, .ply and .stl.")
        loaded = trimesh.load(input_path, force="scene", process=False)
        scene = loaded if isinstance(loaded, trimesh.Scene) else trimesh.Scene(loaded)
        mesh = scene.dump(concatenate=True)
        if mesh.is_empty or len(mesh.vertices) == 0:
            raise ValueError("The supplied 3D file does not contain a renderable mesh.")

        bounds = mesh.bounds
        center = (bounds[0] + bounds[1]) / 2
        mesh.apply_translation(-center)
        extent = float(np.max(bounds[1] - bounds[0]))
        if extent <= 1e-8:
            raise ValueError("The supplied mesh has no usable size.")
        # Unit diameter makes a natural default in Three.js while preserving proportions.
        mesh.apply_scale(2.0 / extent)
        mesh.remove_unreferenced_vertices()
        # trimesh 4.12 renamed the mutating cleanup helpers.  Supporting both
        # forms keeps this adapter valid for current and LTS-style environments.
        if hasattr(mesh, "remove_duplicate_faces"):
            mesh.remove_duplicate_faces()
        else:
            mesh.update_faces(mesh.unique_faces())
        if hasattr(mesh, "remove_degenerate_faces"):
            mesh.remove_degenerate_faces()
        else:
            mesh.update_faces(mesh.nondegenerate_faces())
        mesh.remove_unreferenced_vertices()

        output_path.parent.mkdir(parents=True, exist_ok=True)
        mesh.export(output_path, file_type="glb")
        return output_path
