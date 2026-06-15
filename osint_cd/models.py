from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@dataclass(slots=True)
class Target:
    source: str
    url: str | None = None
    query: str | None = None
    adapter: str = "public_web"
    keywords: list[str] = field(default_factory=list)
    municipio: str | None = None
    provincia: str | None = None
    actor: str | None = None
    tags: list[str] = field(default_factory=list)


@dataclass(slots=True)
class EvidenceRecord:
    run_id: str
    source: str
    source_url: str
    final_url: str
    title: str
    adapter: str
    captured_at: str
    content_hash: str
    matched_keywords: list[str]
    hashtags: list[str]
    mentions: list[str]
    links: list[str]
    visible_text: str
    screenshot_path: str | None = None
    municipio: str | None = None
    provincia: str | None = None
    actor: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
