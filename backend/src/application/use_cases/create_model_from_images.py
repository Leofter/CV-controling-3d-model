from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from src.domain.entities.agro_model import AgroModel3D, ModelCategory
from src.domain.entities.capture_session import MultiAngleImageSet
from src.domain.interfaces.image_preprocessor import IImagePreprocessor
from src.domain.interfaces.mesh_optimizer import IMeshOptimizer
from src.domain.interfaces.model_repository import IModelRepository
from src.domain.interfaces.three_d_generator import I3DGeneratorProvider
from src.application.use_cases.upload_glb_model import name_to_safe_stem


class Generate3DFromImagesUseCase:
    def __init__(
        self,
        preprocessor: IImagePreprocessor,
        generator: I3DGeneratorProvider,
        optimizer: IMeshOptimizer,
        repository: IModelRepository,
        work_directory: Path,
    ) -> None:
        self._preprocessor = preprocessor
        self._generator = generator
        self._optimizer = optimizer
        self._repository = repository
        self._work_directory = work_directory

    def execute(self, *, captures: MultiAngleImageSet, name: str, category: ModelCategory) -> AgroModel3D:
        job_directory = self._work_directory / f"job-{uuid4().hex}"
        try:
            normalized = self._preprocessor.preprocess(captures.images, job_directory / "normalized")
            generated_mesh = self._generator.generate_mesh(normalized, job_directory / "generated.glb")
            stem = f"{name_to_safe_stem(name)}-{uuid4().hex[:8]}"
            model = AgroModel3D.create(
                name=name,
                category=category,
                file_name=f"{stem}.glb",
                source="image-ai",
                thumbnail_name=f"{stem}.svg",
            )
            optimized_path = self._repository.model_output_path(model.id)
            self._optimizer.optimize(generated_mesh, optimized_path)
            return self._repository.save(model, optimized_path)
        finally:
            shutil.rmtree(job_directory, ignore_errors=True)
