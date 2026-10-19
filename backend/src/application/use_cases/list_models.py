from src.domain.entities.agro_model import AgroModel3D
from src.domain.interfaces.model_repository import IModelRepository


class ListModelsUseCase:
    def __init__(self, repository: IModelRepository) -> None:
        self._repository = repository

    def execute(self) -> list[AgroModel3D]:
        return self._repository.list_models()
