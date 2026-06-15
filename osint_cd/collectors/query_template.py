from __future__ import annotations

from urllib.parse import quote_plus

from osint_cd.collectors.public_web import PublicWebCollector
from osint_cd.models import Target


class QueryTemplateCollector(PublicWebCollector):
    """Builds a public URL from a template and then delegates to PublicWebCollector.

    Template examples are intentionally configurable from the target URL field:
    - https://example.com/search?q={query}
    - https://example.com/tags/{query}
    """

    adapter_name = "query_template"

    def collect(self, target: Target):  # type: ignore[no-untyped-def]
        if not target.url:
            raise ValueError("QueryTemplateCollector requires target.url template")
        if "{query}" in target.url:
            if not target.query:
                raise ValueError("Target url contains {query}, but target.query is empty")
            target = Target(
                source=target.source,
                url=target.url.replace("{query}", quote_plus(target.query.strip().lstrip("#"))),
                query=target.query,
                adapter=self.adapter_name,
                keywords=target.keywords or [target.query],
                municipio=target.municipio,
                provincia=target.provincia,
                actor=target.actor,
                tags=target.tags,
            )
        record = super().collect(target)
        record.adapter = self.adapter_name
        record.metadata["query"] = target.query
        return record
