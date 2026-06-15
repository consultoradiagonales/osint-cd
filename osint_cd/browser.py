from __future__ import annotations

import os
import platform
from dataclasses import dataclass
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait


@dataclass(slots=True)
class BrowserConfig:
    headless: bool = True
    brave_path: str | None = None
    user_data_dir: str | None = None
    timeout: int = 30
    window_size: str = "1365,1400"
    lang: str = "es-AR"


class BraveBrowser:
    """Thin Brave/Selenium renderer.

    This class intentionally behaves like a normal browser renderer: it loads public URLs,
    waits for the DOM to finish loading and returns page HTML/text to the collectors.
    """

    def __init__(self, config: BrowserConfig | None = None) -> None:
        self.config = config or BrowserConfig()
        self.driver: webdriver.Chrome | None = None

    def __enter__(self) -> "BraveBrowser":
        self.start()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # type: ignore[no-untyped-def]
        self.close()

    def start(self) -> webdriver.Chrome:
        if self.driver:
            return self.driver

        options = Options()
        brave_binary = self.config.brave_path or self._detect_brave_binary()
        if brave_binary:
            options.binary_location = brave_binary

        if self.config.headless:
            options.add_argument("--headless=new")
        options.add_argument(f"--window-size={self.config.window_size}")
        options.add_argument(f"--lang={self.config.lang}")
        options.add_argument("--disable-notifications")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--no-sandbox")

        if self.config.user_data_dir:
            Path(self.config.user_data_dir).mkdir(parents=True, exist_ok=True)
            options.add_argument(f"--user-data-dir={self.config.user_data_dir}")

        self.driver = webdriver.Chrome(service=Service(), options=options)
        self.driver.set_page_load_timeout(self.config.timeout)
        return self.driver

    def render(self, url: str) -> tuple[str, str, str]:
        driver = self.start()
        driver.get(url)
        WebDriverWait(driver, self.config.timeout).until(
            lambda d: d.execute_script("return document.readyState") in {"interactive", "complete"}
        )
        title = driver.title or ""
        html = driver.page_source or ""
        final_url = driver.current_url or url
        return final_url, title, html

    def screenshot(self, path: str) -> str:
        driver = self.start()
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        driver.save_screenshot(path)
        return path

    def close(self) -> None:
        if self.driver:
            self.driver.quit()
            self.driver = None

    @staticmethod
    def _detect_brave_binary() -> str | None:
        explicit = os.getenv("BRAVE_PATH")
        if explicit and Path(explicit).exists():
            return explicit

        system = platform.system().lower()
        candidates: list[str]
        if "windows" in system:
            candidates = [
                r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
                r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
            ]
        elif "darwin" in system:
            candidates = ["/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"]
        else:
            candidates = [
                "/usr/bin/brave-browser",
                "/usr/bin/brave",
                "/snap/bin/brave",
                "/opt/brave.com/brave/brave-browser",
                "/usr/bin/chromium-browser",
                "/usr/bin/google-chrome",
            ]
        for candidate in candidates:
            if Path(candidate).exists():
                return candidate
        return None
