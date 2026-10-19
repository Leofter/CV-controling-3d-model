"""Business entities for assets that can be manipulated in the e-Agro studio."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from uuid import uuid4


class ModelCategory(str, Enum):
    FRUIT = "fruit"
    PLANT = "plant"
    SEED = "seed"
    SEEDLING = "seedling"
    MACHINERY = "machinery"
    OTHER = "other"


@dataclass(frozen=True)
class AgroModel3D:
    id: str
    name: str
    category: ModelCategory
    file_name: str
    source: str
    created_at: datetime
    thumbnail_name: str | None = None

    @classmethod
    def create(
        cls,
        *,
        name: str,
        category: ModelCategory,
        file_name: str,
        source: str,
        thumbnail_name: str | None = None,
    ) -> "AgroModel3D":
        return cls(
            id=str(uuid4()),
            name=name.strip(),
            category=category,
            file_name=file_name,
            source=source,
            created_at=datetime.now(timezone.utc),
            thumbnail_name=thumbnail_name,
        )

    @property
    def file_path_hint(self) -> Path:
        """A filename-only Path; the repository owns the storage root."""
        return Path(self.file_name)
