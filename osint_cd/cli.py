from __future__ import annotations

import argparse
from pathlib import Path
from uuid import uuid4

from osint_cd.browser import BraveBrowser, BrowserConfig
from osint_cd.collectors.registry import get_collector
from osint_cd.exporters import write_output
from osint_cd.integrations.social_analyzer import SocialAnalyzerAdapter, SocialAnalyzerConfig
from osint_cd.models import Target


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="osint-cd", description="Motor OSINT-CD")
    sub = parser.add_subparsers(dest="command", required=True)

    render = sub.add_parser("render", help="Renderiza una URL pública con Brave/Selenium")
    render.add_argument("--url", required=True)
    render.add_argument("--source", default="web")
    render.add_argument("--adapter", default="public_web", choices=["public_web", "query_template"])
    render.add_argument("--query")
    render.add_argument("--keyword", action="append", default=[])
    render.add_argument("--output", required=True)
    render.add_argument("--format", choices=["json", "jsonl", "csv"])
    render.add_argument("--screenshots-dir")
    render.add_argument("--no-headless", action="store_true")
    render.add_argument("--brave-path")
    render.add_argument("--user-data-dir")

    social = sub.add_parser("social-analyzer", help="Ejecuta qeeqbox/social-analyzer y normaliza salida")
    social.add_argument("--username", required=True, nargs="+", help="Uno o más usernames")
    social.add_argument("--output", required=True)
    social.add_argument("--format", choices=["json", "jsonl", "csv"])
    social.add_argument("--timeout", type=int, default=10)
    social.add_argument("--filter", default="good")
    social.add_argument("--profiles", default="detected")
    social.add_argument("--metadata", action="store_true")
    social.add_argument("--extract", action="store_true")
    social.add_argument("--top", type=int)
    social.add_argument("--website", action="append", default=[])
    social.add_argument("--vendor-path", default="vendor/social-analyzer")
    social.add_argument("--subprocess", action="store_true")

    return parser


def run_render(args: argparse.Namespace) -> Path:
    run_id = str(uuid4())
    config = BrowserConfig(
        headless=not args.no_headless,
        brave_path=args.brave_path,
        user_data_dir=args.user_data_dir,
    )
    target = Target(
        source=args.source,
        url=args.url,
        query=args.query,
        adapter=args.adapter,
        keywords=args.keyword,
    )
    with BraveBrowser(config) as browser:
        collector_cls = get_collector(args.adapter)
        collector = collector_cls(browser, run_id, screenshot_dir=args.screenshots_dir)
        record = collector.collect(target)
    return write_output(args.output, [record], args.format)


def run_social_analyzer(args: argparse.Namespace) -> Path:
    run_id = str(uuid4())
    vendor_path = args.vendor_path if args.vendor_path and Path(args.vendor_path).exists() else None
    config = SocialAnalyzerConfig(
        timeout=args.timeout,
        filter=args.filter,
        profiles=args.profiles,
        metadata=args.metadata,
        extract=args.extract,
        top=args.top,
        websites=args.website or None,
        prefer_import=not args.subprocess,
        vendor_path=vendor_path,
    )
    adapter = SocialAnalyzerAdapter(config)
    results = adapter.run(args.username, run_id)
    return write_output(args.output, results, args.format)


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "render":
        output = run_render(args)
    elif args.command == "social-analyzer":
        output = run_social_analyzer(args)
    else:
        parser.error("Comando desconocido")
        return 2
    print(f"OK -> {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
