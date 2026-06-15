from __future__ import annotations

from pathlib import Path

from osint_cd.collectors.base import BaseCollector
from osint_cd.models import EvidenceRecord, Target, utc_now_iso
from osint_cd.text import (
    extract_hashtags,
    extract_links,
    extract_mentions,
    html_to_visible_text,
    match_keywords,
    sha256_text,
    top_terms,
)


class PublicWebCollector(BaseCollector):
    adapter_name = "public_web"

    def collect(self, target: Target) -> EvidenceRecord:
        if not target.url:
            raise ValueError("PublicWebCollector requires target.url")

        final_url, title, html = self.browser.render(target.url)
        text = html_to_visible_text(html)
        screenshot_path = None
        if self.screenshot_dir:
            safe_name = sha256_text(final_url)[:16] + ".png"
            screenshot_path = str(Path(self.screenshot_dir) / safe_name)
            self.browser.screenshot(screenshot_path)

        return EvidenceRecord(
            run_id=self.run_id,
            source=target.source or "web",
            source_url=target.url,
            final_url=final_url,
            title=title,
            adapter=self.adapter_name,
            captured_at=utc_now_iso(),
            content_hash=sha256_text(text),
            matched_keywords=match_keywords(text, target.keywords),
            hashtags=extract_hashtags(text),
            mentions=extract_mentions(text),
            links=extract_links(html, final_url),
            visible_text=text,
            screenshot_path=screenshot_path,
            municipio=target.municipio,
            provincia=target.provincia,
            actor=target.actor,
            metadata={"top_terms": top_terms(text)},
        )
