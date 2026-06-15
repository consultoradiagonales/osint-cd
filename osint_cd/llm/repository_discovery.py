from __future__ import annotations

from typing import Any

from osint_cd.llm.schemas import GitHubFinding


BASE_TERMS = {
    "osint": ["osint", "recon", "intelligence", "investigation"],
    "socmint": ["socmint", "social analyzer", "username search", "profile finder"],
    "scraping": ["scraper", "crawler", "selenium", "playwright", "puppeteer"],
    "visual": ["dashboard", "flourish", "charts", "map"],
    "politico": ["election", "political", "campaign", "sentiment"],
}


def build_repository_queries(request: str, max_queries: int = 6) -> list[str]:
    text = request.lower()
    selected: list[str] = []
    for key, terms in BASE_TERMS.items():
        if key in text or any(term in text for term in terms):
            selected.extend(terms[:3])
    if not selected:
        selected = ["osint", "social analyzer", "selenium scraper", "username search"]

    important_words = [
        word.strip(".,;:()[]{}\"'")
        for word in request.split()
        if len(word.strip(".,;:()[]{}\"'")) >= 5
    ][:6]

    queries: list[str] = []
    for term in selected:
        suffix = " ".join(important_words[:3])
        query = f"{term} {suffix}".strip()
        if query not in queries:
            queries.append(query)
        if len(queries) >= max_queries:
            break
    return queries


def normalize_repository_result(item: dict[str, Any]) -> GitHubFinding:
    full_name = str(
        item.get("repository_full_name")
        or item.get("full_name")
        or item.get("nameWithOwner")
        or ""
    )
    name = str(item.get("name") or full_name.rsplit("/", 1)[-1])
    url = str(item.get("html_url") or item.get("url") or f"https://github.com/{full_name}")
    clone_url = item.get("clone_url") or (f"https://github.com/{full_name}.git" if full_name else None)
    language = item.get("language") or item.get("primaryLanguage")
    if isinstance(language, dict):
        language = language.get("name")
    license_value = item.get("license") or item.get("licenseInfo")
    if isinstance(license_value, dict):
        license_value = license_value.get("spdx_id") or license_value.get("spdxId") or license_value.get("name")
    return GitHubFinding(
        name=name,
        full_name=full_name,
        html_url=url,
        clone_url=clone_url,
        description=item.get("description"),
        language=language,
        stars=item.get("stargazers_count") or item.get("stargazersCount"),
        forks=item.get("forks_count") or item.get("forksCount"),
        license=license_value,
        pushed_at=item.get("pushed_at") or item.get("pushedAt"),
        topics=item.get("topics") or [],
        score=item.get("score"),
    )


def normalize_repository_results(items: list[dict[str, Any]]) -> list[GitHubFinding]:
    findings: list[GitHubFinding] = []
    seen: set[str] = set()
    for item in items:
        finding = normalize_repository_result(item)
        key = finding.full_name or finding.html_url
        if key in seen:
            continue
        seen.add(key)
        findings.append(finding)
    return findings
