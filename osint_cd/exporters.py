from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Iterable


def _as_dict(item: Any) -> dict[str, Any]:
    if hasattr(item, "to_dict"):
        return item.to_dict()
    if isinstance(item, dict):
        return item
    raise TypeError(f"Unsupported export item: {type(item)!r}")


def write_json(path: str | Path, items: Iterable[Any]) -> Path:
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = [_as_dict(item) for item in items]
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


def write_jsonl(path: str | Path, items: Iterable[Any]) -> Path:
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as fh:
        for item in items:
            fh.write(json.dumps(_as_dict(item), ensure_ascii=False) + "\n")
    return out


def write_csv(path: str | Path, items: Iterable[Any]) -> Path:
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = [_as_dict(item) for item in items]
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with out.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            flattened = {
                key: json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else value
                for key, value in row.items()
            }
            writer.writerow(flattened)
    return out


def write_output(path: str | Path, items: Iterable[Any], fmt: str | None = None) -> Path:
    out = Path(path)
    selected = (fmt or out.suffix.lstrip(".") or "json").lower()
    if selected == "json":
        return write_json(out, items)
    if selected == "jsonl":
        return write_jsonl(out, items)
    if selected == "csv":
        return write_csv(out, items)
    raise ValueError(f"Unsupported output format: {selected}")
