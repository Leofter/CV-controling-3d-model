"""Image preprocessing adapter with graceful local-development fallbacks."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from src.domain.interfaces.background_remover import IBackgroundRemover
from src.domain.interfaces.image_normalizer import IImageNormalizer
from src.domain.interfaces.image_preprocessor import IImagePreprocessor
from src.infrastructure.cv_preprocessing.opencv_normalizer import OpenCVImageNormalizer
from src.infrastructure.cv_preprocessing.rembg_remover import RembgBackgroundRemover


class RembgOpenCVPreprocessor(IImagePreprocessor):
    """Isolate the subject, crop alpha bounds and put it on a square RGBA canvas.

    rembg and OpenCV are optional at runtime.  This is intentional: first-start
    remains usable on CPUs where ONNX providers are not installed.  If rembg is
    unavailable, a supplied alpha channel is respected and opaque input is kept.
    """

    def __init__(
        self,
        canvas_size: int = 1024,
        padding_ratio: float = 0.10,
        background_remover: IBackgroundRemover | None = None,
        normalizer: IImageNormalizer | None = None,
    ) -> None:
        self._background_remover = background_remover or RembgBackgroundRemover()
        self._normalizer = normalizer or OpenCVImageNormalizer(canvas_size, padding_ratio)

    def preprocess(self, images: dict[str, Path], output_directory: Path) -> dict[str, Path]:
        output_directory.mkdir(parents=True, exist_ok=True)
        return {angle: self._preprocess_one(path, output_directory / f"{angle}.png") for angle, path in images.items()}

    def _preprocess_one(self, input_path: Path, output_path: Path) -> Path:
        source = Image.open(input_path).convert("RGBA")
        normalized = self._normalizer.normalize(self._background_remover.remove(source))
        normalized.save(output_path, "PNG", optimize=True)
        return output_path
