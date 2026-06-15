from __future__ import annotations

from abc import ABC, abstractmethod

from osint_cd.browser import BraveBrowser
from osint_cd.models import EvidenceRecord, Target


class BaseCollector(ABC):
    adapter_name = "base"

    def __init__(self, browser: BraveBrowser, run_id: str, screenshot_dir: str | None = None) -> None:
        self.browser = browser
        self.run_id = run_id
        self.screenshot_dir = screenshot_dir

    @abstractmethod
    def collect(self, target: Target) -> EvidenceRecord:
        raise NotImplementedError
