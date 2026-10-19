from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from src.domain.entities.agro_model import AgroModel3D


class IModelRepository(ABC):
    @abstractmethod
    def list_models(self) -> list[AgroModel3D]: ...

    @abstractmethod
    def model_output_path(self, model_id: str) -> Path: ...

    @abstractmethod
    def save(self, model: AgroModel3D, source_path: Path) -> AgroModel3D: ...
