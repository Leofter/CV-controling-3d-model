from __future__ import annotations

import shutil
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from src.application.dtos.model_dtos import ModelResponse
from src.domain.entities.agro_model import ModelCategory
from src.domain.entities.capture_session import MultiAngleImageSet
from src.presentation.api.container import ApplicationContainer


router = APIRouter(prefix="/api/models", tags=["models"])
_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_STORAGE_ROOT = _BACKEND_ROOT / "storage"
container = ApplicationContainer(_STORAGE_ROOT)


@router.get("", response_model=list[ModelResponse])
def list_models() -> list[ModelResponse]:
    return [ModelResponse.from_entity(model) for model in container.list_models.execute()]


@router.post("/upload-3d", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def upload_3d_model(
    file: UploadFile = File(...),
    name: str = Form(...),
    category: ModelCategory = Form(ModelCategory.OTHER),
) -> ModelResponse:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in {".glb", ".gltf"}:
        raise HTTPException(status_code=422, detail="Envie um arquivo .glb ou .gltf.")
    if not name.strip():
        raise HTTPException(status_code=422, detail="O nome do modelo é obrigatório.")
    incoming = _STORAGE_ROOT / "temp_uploads" / f"upload-{uuid4().hex}{extension}"
    try:
        await _persist_upload(file, incoming)
        model = container.upload_model.execute(source_file=incoming, name=name, category=category)
        return ModelResponse.from_entity(model)
    except (ValueError, OSError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        incoming.unlink(missing_ok=True)


@router.post("/generate-from-images", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def generate_from_images(
    name: str = Form(...),
    category: ModelCategory = Form(ModelCategory.OTHER),
    front: UploadFile = File(...),
    right: Optional[UploadFile] = File(None),
    back: Optional[UploadFile] = File(None),
    left: Optional[UploadFile] = File(None),
    top: Optional[UploadFile] = File(None),
) -> ModelResponse:
    if not name.strip():
        raise HTTPException(status_code=422, detail="O nome do modelo é obrigatório.")
    files = {"front": front, "right": right, "back": back, "left": left, "top": top}
    provided = {angle: image for angle, image in files.items() if image is not None}
    if invalid := [image.filename for image in provided.values() if not _is_image(image)]:
        raise HTTPException(status_code=422, detail=f"Arquivos de imagem inválidos: {', '.join(invalid)}")

    request_directory = _STORAGE_ROOT / "temp_uploads" / f"request-{uuid4().hex}"
    try:
        captures: dict[str, Path] = {}
        for angle, image in provided.items():
            destination = request_directory / f"{angle}{_image_extension(image)}"
            await _persist_upload(image, destination)
            captures[angle] = destination
        model = container.generate_from_images.execute(
            captures=MultiAngleImageSet(captures), name=name, category=category
        )
        return ModelResponse.from_entity(model)
    except (ValueError, OSError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        shutil.rmtree(request_directory, ignore_errors=True)


async def _persist_upload(upload: UploadFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as stream:
        while chunk := await upload.read(1024 * 1024):
            stream.write(chunk)
    await upload.close()


def _is_image(file: UploadFile) -> bool:
    return Path(file.filename or "").suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}


def _image_extension(file: UploadFile) -> str:
    return Path(file.filename or "").suffix.lower() or ".png"
