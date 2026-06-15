from __future__ import annotations

import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from importlib import import_module
from pathlib import Path
from typing import Any

from osint_cd.models import utc_now_iso


@dataclass(slots=True)
class SocialAnalyzerConfig:
    timeout: int = 10
    filter: str = "good"
    profiles: str = "detected"
    metadata: bool = False
    extract: bool = False
    top: int | None = None
    websites: list[str] | None = None
    prefer_import: bool = True
    python_bin: str = sys.executable
    vendor_path: str | None = None


@dataclass(slots=True)
class SocialAnalyzerProfile:
    run_id: str
    username_query: str
    source: str
    profile_url: str
    rate: int | float | None
    status: str
    title: str | None
    text: str | None
    metadata: list[dict[str, Any]]
    extracted: list[dict[str, Any]]
    captured_at: str
    raw: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class SocialAnalyzerAdapter:
    """External adapter for qeeqbox/social-analyzer.

    The AGPL upstream code is not copied into osint-cd core. Use the package installed
    in the environment, or point vendor_path to a local checkout of qeeqbox/social-analyzer.
    """

    upstream_repo = "https://github.com/qeeqbox/social-analyzer"

    def __init__(self, config: SocialAnalyzerConfig | None = None) -> None:
        self.config = config or SocialAnalyzerConfig()
        if self.config.vendor_path:
            vendor = str(Path(self.config.vendor_path).resolve())
            if vendor not in sys.path:
                sys.path.insert(0, vendor)

    def run(self, usernames: str | list[str], run_id: str) -> list[SocialAnalyzerProfile]:
        username_arg = ",".join(usernames) if isinstance(usernames, list) else usernames
        raw = self._run_import(username_arg) if self.config.prefer_import else None
        if raw is None:
            raw = self._run_subprocess(username_arg)
        return self._normalize(raw, username_arg, run_id)

    def _run_import(self, username_arg: str) -> Any | None:
        try:
            module = import_module("social-analyzer")
            analyzer = module.SocialAnalyzer(silent=True)
            kwargs: dict[str, Any] = {
                "username": username_arg,
                "silent": True,
                "output": "json",
                "filter": self.config.filter,
                "metadata": self.config.metadata,
                "extract": self.config.extract,
                "timeout": self.config.timeout,
                "profiles": self.config.profiles,
            }
            if self.config.top is not None:
                kwargs["top"] = self.config.top
            if self.config.websites:
                kwargs["websites"] = " ".join(self.config.websites)
            return analyzer.run_as_object(**kwargs)
        except Exception:
            return None

    def _run_subprocess(self, username_arg: str) -> Any:
        cmd = [
            self.config.python_bin,
            "-m",
            "social-analyzer",
            "--username",
            username_arg,
            "--output",
            "json",
            "--filter",
            self.config.filter,
            "--profiles",
            self.config.profiles,
            "--timeout",
            str(self.config.timeout),
            "--silent",
        ]
        if self.config.metadata:
            cmd.append("--metadata")
        if self.config.extract:
            cmd.append("--extract")
        if self.config.top is not None:
            cmd.extend(["--top", str(self.config.top)])
        if self.config.websites:
            cmd.extend(["--websites", " ".join(self.config.websites)])

        completed = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if completed.returncode != 0:
            raise RuntimeError(
                "social-analyzer failed with exit code "
                f"{completed.returncode}: {completed.stderr.strip()}"
            )
        stdout = completed.stdout.strip()
        return json.loads(stdout) if stdout else []

    def _normalize(self, raw: Any, username_arg: str, run_id: str) -> list[SocialAnalyzerProfile]:
        rows = self._extract_rows(raw)
        captured_at = utc_now_iso()
        normalized: list[SocialAnalyzerProfile] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            url = str(row.get("link") or row.get("url") or row.get("profile") or "")
            source = str(row.get("site") or row.get("website") or row.get("platform") or "unknown")
            status = str(row.get("status") or row.get("profile") or row.get("detected") or "unknown")
            normalized.append(
                SocialAnalyzerProfile(
                    run_id=run_id,
                    username_query=username_arg,
                    source=source,
                    profile_url=url,
                    rate=row.get("rate"),
                    status=status,
                    title=row.get("title"),
                    text=row.get("text"),
                    metadata=row.get("metadata") if isinstance(row.get("metadata"), list) else [],
                    extracted=row.get("extracted") if isinstance(row.get("extracted"), list) else [],
                    captured_at=captured_at,
                    raw=row,
                )
            )
        return normalized

    def _extract_rows(self, raw: Any) -> list[Any]:
        if raw is None:
            return []
        if isinstance(raw, list):
            return raw
        if isinstance(raw, dict):
            for key in ("detected", "profiles", "results", "custom", "data"):
                value = raw.get(key)
                if isinstance(value, list):
                    return value
            return [raw]
        if isinstance(raw, str):
            try:
                return self._extract_rows(json.loads(raw))
            except json.JSONDecodeError:
                return []
        return []
