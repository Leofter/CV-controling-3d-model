from __future__ import annotations

from io import BytesIO

from PIL import Image

from src.domain.interfaces.background_remover import IBackgroundRemover


class RembgBackgroundRemover(IBackgroundRemover):
    """Rembg adapter that gracefully preserves input when ONNX is unavailable."""

    def remove(self, image: Image.Image) -> Image.Image:
        rgba = image.convert("RGBA")
        # Preserve a deliberately transparent capture rather than segmenting it again.
        if rgba.getchannel("A").getextrema()[0] < 250:
            return rgba
        try:
            from rembg import remove  # Starts ONNX only for an actual generation request.

            result = remove(rgba)
            return Image.open(BytesIO(result)).convert("RGBA") if isinstance(result, bytes) else result.convert("RGBA")
        except Exception:
            # The fallback generator can still produce a useful interactive proxy.
            return rgba
