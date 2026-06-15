from __future__ import annotations

import hashlib
import re
from collections import Counter
from urllib.parse import urljoin

from bs4 import BeautifulSoup

HASHTAG_RE = re.compile(r"(?<!\w)#([\wáéíóúÁÉÍÓÚñÑ_]{2,80})", re.UNICODE)
MENTION_RE = re.compile(r"(?<!\w)@([\w._]{2,80})", re.UNICODE)


def html_to_visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript", "svg", "canvas"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    return normalize_spaces(text)


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def sha256_text(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8", errors="ignore")).hexdigest()


def extract_links(html: str, base_url: str, max_links: int = 250) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    links: list[str] = []
    seen: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = urljoin(base_url, anchor.get("href", "")).split("#", 1)[0]
        if href.startswith(("http://", "https://")) and href not in seen:
            links.append(href)
            seen.add(href)
        if len(links) >= max_links:
            break
    return links


def extract_hashtags(text: str, limit: int = 100) -> list[str]:
    values = [f"#{m.group(1)}" for m in HASHTAG_RE.finditer(text or "")]
    return [tag for tag, _ in Counter(values).most_common(limit)]


def extract_mentions(text: str, limit: int = 100) -> list[str]:
    values = [f"@{m.group(1)}" for m in MENTION_RE.finditer(text or "")]
    return [mention for mention, _ in Counter(values).most_common(limit)]


def match_keywords(text: str, keywords: list[str]) -> list[str]:
    lowered = (text or "").lower()
    return [kw for kw in keywords if kw and kw.lower() in lowered]


def top_terms(text: str, limit: int = 30) -> list[dict[str, int | str]]:
    stop = {
        "para", "como", "con", "del", "las", "los", "una", "por", "que", "más", "este",
        "esta", "son", "sus", "sin", "sobre", "entre", "desde", "hasta", "the", "and", "for",
        "you", "your", "not", "all", "www", "http", "https",
    }
    words = re.findall(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]{4,}", text.lower())
    counts = Counter(w for w in words if w not in stop)
    return [{"term": term, "count": count} for term, count in counts.most_common(limit)]
