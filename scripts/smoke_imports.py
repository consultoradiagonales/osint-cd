from __future__ import annotations

from osint_cd.browser import BraveBrowser, BrowserConfig
from osint_cd.collectors.registry import get_collector
from osint_cd.exporters import write_output
from osint_cd.integrations.social_analyzer import SocialAnalyzerAdapter, SocialAnalyzerConfig
from osint_cd.models import Target


def main() -> int:
    assert BrowserConfig()
    assert BraveBrowser
    assert get_collector("public_web")
    assert Target(source="web", url="https://example.com")
    assert write_output
    assert SocialAnalyzerConfig()
    assert SocialAnalyzerAdapter
    print("OK imports")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
