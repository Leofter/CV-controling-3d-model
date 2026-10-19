from __future__ import annotations

import json
import shutil
from html import escape
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from src.domain.entities.agro_model import AgroModel3D, ModelCategory
from src.domain.interfaces.model_repository import IModelRepository


class LocalStorageModelRepository(IModelRepository):
    """Filesystem repository with one metadata manifest per public model."""

    def __init__(self, storage_root: Path) -> None:
        self._root = storage_root
        self._models = storage_root / "models"
        self._metadata = storage_root / "metadata"
        self._temporary = storage_root / "temp_uploads"
        for directory in (self._models, self._metadata, self._temporary, storage_root / "thumbnails"):
            directory.mkdir(parents=True, exist_ok=True)

    def list_models(self) -> list[AgroModel3D]:
        models: list[AgroModel3D] = []
        for manifest in self._metadata.glob("*.json"):
            try:
                raw = json.loads(manifest.read_text(encoding="utf-8"))
                if (self._models / raw["file_name"]).is_file():
                    raw["category"] = ModelCategory(raw["category"])
                    raw["created_at"] = datetime.fromisoformat(raw["created_at"])
                    models.append(AgroModel3D(**raw))
            except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError):
                continue
        return sorted(models, key=lambda item: item.created_at, reverse=True)

    def model_output_path(self, model_id: str) -> Path:
        return self._temporary / f"normalized-{model_id}.glb"

    def save(self, model: AgroModel3D, source_path: Path) -> AgroModel3D:
        destination = self._models / model.file_name
        # copy2, then replace, ensures the public catalog never exposes a half-write.
        staging = destination.with_suffix(".partial")
        shutil.copy2(source_path, staging)
        staging.replace(destination)
        self._manifest_path(model.id).write_text(
            json.dumps(_to_json_dict(model), ensure_ascii=False, indent=2), encoding="utf-8"
        )
        if model.thumbnail_name:
            self._write_thumbnail(model)
        if source_path.parent == self._temporary:
            source_path.unlink(missing_ok=True)
        return model

    def _manifest_path(self, model_id: str) -> Path:
        return self._metadata / f"{model_id}.json"

    def _write_thumbnail(self, model: AgroModel3D) -> None:
        """A dependable generated thumbnail until an image renderer is configured."""
        palette = {
            ModelCategory.FRUIT: ("#e07a3f", "🍊"),
            ModelCategory.PLANT: ("#3d8953", "🌿"),
            ModelCategory.SEED: ("#a77442", "◉"),
            ModelCategory.SEEDLING: ("#609f5a", "🌱"),
            ModelCategory.MACHINERY: ("#597890", "⚙"),
            ModelCategory.OTHER: ("#72805a", "◈"),
        }
        color, icon = palette[model.category]
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360">
<rect width="600" height="360" fill="#edf1e9"/><circle cx="300" cy="164" r="110" fill="{color}" opacity=".14"/>
<text x="300" y="205" text-anchor="middle" font-size="130">{icon}</text>
<text x="300" y="317" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#253323">{escape(model.name[:32])}</text>
</svg>'''
        (self._root / "thumbnails" / model.thumbnail_name).write_text(svg, encoding="utf-8")


def _to_json_dict(model: AgroModel3D) -> dict[str, str | None]:
    serialized = asdict(model)
    serialized["category"] = model.category.value
    serialized["created_at"] = model.created_at.isoformat()
    return serialized
