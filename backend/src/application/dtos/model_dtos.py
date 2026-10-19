from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from src.domain.entities.agro_model import AgroModel3D, ModelCategory


class ModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: ModelCategory
    source: str
    created_at: datetime
    model_url: str
    thumbnail_url: Optional[str] = None

    @classmethod
    def from_entity(cls, model: AgroModel3D) -> "ModelResponse":
        return cls(
            id=model.id,
            name=model.name,
            category=model.category,
            source=model.source,
            created_at=model.created_at,
            model_url=f"/storage/models/{model.file_name}",
            thumbnail_url=(f"/storage/thumbnails/{model.thumbnail_name}" if model.thumbnail_name else None),
        )


class GenerationRequestMetadata(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: ModelCategory = ModelCategory.OTHER
