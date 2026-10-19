from __future__ import annotations

from pathlib import Path

from src.domain.entities.agro_model import AgroModel3D, ModelCategory
from src.domain.interfaces.mesh_optimizer import IMeshOptimizer
from src.domain.interfaces.model_repository import IModelRepository


class UploadCustom3DModelUseCase:
    def __init__(self, repository: IModelRepository, optimizer: IMeshOptimizer) -> None:
        self._repository = repository
        self._optimizer = optimizer

    def execute(self, *, source_file: Path, name: str, category: ModelCategory) -> AgroModel3D:
        stem = f"{name_to_safe_stem(name)}-{__import__('uuid').uuid4().hex[:8]}"
        model = AgroModel3D.create(
            name=name,
            category=category,
            file_name=f"{stem}.glb",
            source="upload",
            thumbnail_name=f"{stem}.svg",
        )
        optimized_path = self._repository.model_output_path(model.id)
        self._optimizer.optimize(source_file, optimized_path)
        # `save` copies atomically to the public filename and persists its manifest.
        return self._repository.save(model, optimized_path)


def name_to_safe_stem(name: str) -> str:
    cleaned = "".join(character.lower() if character.isalnum() else "-" for character in name.strip())
    return "-".join(filter(None, cleaned.split("-")))[:60] or "agro-model"
