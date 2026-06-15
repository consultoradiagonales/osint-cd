from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from osint_cd.models import utc_now_iso


@dataclass(slots=True)
class GitHubFinding:
    name: str
    full_name: str
    html_url: str
    clone_url: str | None
    description: str | None
    language: str | None
    stars: int | None
    forks: int | None
    license: str | None
    pushed_at: str | None
    topics: list[str] = field(default_factory=list)
    score: float | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class SkillMatch:
    name: str
    category: str
    reason: str
    activation_hint: str
    priority: int = 5

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class LLMTaskPacket:
    request: str
    run_id: str
    created_at: str
    intent: str
    github_queries: list[str]
    skill_matches: list[SkillMatch]
    github_findings: list[GitHubFinding]
    recommended_pipeline: list[str]
    next_actions: list[str]
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["skill_matches"] = [item.to_dict() for item in self.skill_matches]
        data["github_findings"] = [item.to_dict() for item in self.github_findings]
        return data


def new_packet(
    request: str,
    run_id: str,
    intent: str,
    github_queries: list[str],
    skill_matches: list[SkillMatch],
    github_findings: list[GitHubFinding],
    recommended_pipeline: list[str],
    next_actions: list[str],
    notes: list[str] | None = None,
) -> LLMTaskPacket:
    return LLMTaskPacket(
        request=request,
        run_id=run_id,
        created_at=utc_now_iso(),
        intent=intent,
        github_queries=github_queries,
        skill_matches=skill_matches,
        github_findings=github_findings,
        recommended_pipeline=recommended_pipeline,
        next_actions=next_actions,
        notes=notes or [],
    )
