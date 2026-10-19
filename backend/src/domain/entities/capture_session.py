from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


REQUIRED_ANGLE = "front"
VALID_ANGLES = frozenset({"front", "right", "back", "left", "top"})


@dataclass(frozen=True)
class MultiAngleImageSet:
    """Validated physical capture supplied to the image-to-3D use case."""

    images: dict[str, Path]

    def __post_init__(self) -> None:
        if REQUIRED_ANGLE not in self.images:
            raise ValueError("A frontal image is required to generate a 3D model.")
        unknown = set(self.images).difference(VALID_ANGLES)
        if unknown:
            raise ValueError(f"Unsupported capture angles: {', '.join(sorted(unknown))}")
        if any(not path.exists() for path in self.images.values()):
            raise ValueError("One or more captured images no longer exist.")
