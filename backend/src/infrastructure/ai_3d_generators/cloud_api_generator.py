from __future__ import annotations

from pathlib import Path

from src.domain.interfaces.three_d_generator import I3DGeneratorProvider


class TripoOrMeshyApiAdapter(I3DGeneratorProvider):
    """Generic injectable REST adapter for a managed image-to-3D provider.

    A project deployment supplies the provider endpoint and API key.  Keeping
    that provider-specific wire protocol here prevents it leaking into use cases.
    """

    def __init__(self, endpoint: str, api_key: str, timeout_seconds: int = 180) -> None:
        self._endpoint = endpoint
        self._api_key = api_key
        self._timeout = timeout_seconds

    def generate_mesh(self, images: dict[str, Path], output_path: Path) -> Path:
        import requests

        files = {f"images[{angle}]": (path.name, path.read_bytes(), "image/png") for angle, path in images.items()}
        response = requests.post(
            self._endpoint,
            files=files,
            headers={"Authorization": f"Bearer {self._api_key}"},
            timeout=self._timeout,
        )
        response.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(response.content)
        return output_path
