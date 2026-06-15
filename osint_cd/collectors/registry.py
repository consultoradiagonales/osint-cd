from __future__ import annotations

from osint_cd.collectors.base import BaseCollector
from osint_cd.collectors.public_web import PublicWebCollector
from osint_cd.collectors.query_template import QueryTemplateCollector

ADAPTERS: dict[str, type[BaseCollector]] = {
    "public_web": PublicWebCollector,
    "query_template": QueryTemplateCollector,
}


def get_collector(name: str) -> type[BaseCollector]:
    if name not in ADAPTERS:
        allowed = ", ".join(sorted(ADAPTERS))
        raise ValueError(f"Unknown adapter: {name}. Allowed: {allowed}")
    return ADAPTERS[name]
