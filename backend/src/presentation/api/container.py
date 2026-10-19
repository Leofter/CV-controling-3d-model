"""Composition root: infrastructure is selected here, never in a controller."""

from __future__ import annotations

import os
from pathlib import Path

from src.application.use_cases.create_model_from_images import Generate3DFromImagesUseCase
from src.application.use_cases.list_models import ListModelsUseCase
from src.application.use_cases.upload_glb_model import UploadCustom3DModelUseCase
from src.infrastructure.ai_3d_generators.cloud_api_generator import TripoOrMeshyApiAdapter
from src.infrastructure.ai_3d_generators.local_multiview_generator import LocalMultiViewGeneratorAdapter
from src.infrastructure.ai_3d_generators.procedural_fallback_generator import ProceduralFallbackGenerator
from src.infrastructure.cv_preprocessing.rembg_opencv_preprocessor import RembgOpenCVPreprocessor
from src.infrastructure.mesh_processing.trimesh_optimizer import TrimeshOptimizer
from src.infrastructure.repositories.local_storage_repository import LocalStorageModelRepository


class ApplicationContainer:
    def __init__(self, storage_root: Path) -> None:
        repository = LocalStorageModelRepository(storage_root)
        optimizer = TrimeshOptimizer()
        generator = self._generator_from_environment()
        self.list_models = ListModelsUseCase(repository)
        self.upload_model = UploadCustom3DModelUseCase(repository, optimizer)
        self.generate_from_images = Generate3DFromImagesUseCase(
            RembgOpenCVPreprocessor(), generator, optimizer, repository, storage_root / "temp_uploads"
        )

    @staticmethod
    def _generator_from_environment():
        provider = os.getenv("EAGRO_GENERATOR", "procedural").lower()
        if provider == "cloud":
            endpoint, key = os.getenv("EAGRO_3D_API_URL"), os.getenv("EAGRO_3D_API_KEY")
            if not endpoint or not key:
                raise RuntimeError("Cloud generator requires EAGRO_3D_API_URL and EAGRO_3D_API_KEY.")
            return TripoOrMeshyApiAdapter(endpoint, key)
        if provider == "local":
            return LocalMultiViewGeneratorAdapter()
        return ProceduralFallbackGenerator()
