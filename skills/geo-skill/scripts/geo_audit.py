#!/usr/bin/env python3
"""Lightweight GEO audit for public URLs.

The script uses only Python's standard library so it can run inside a skill
without dependency setup. It reports access, metadata, robots.txt, sitemap,
structured-data, and content signals that matter for AI search visibility.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (compatible; GeoSkillAudit/1.0; "
    "+https://example.com/geo-skill)"
)

BOT_TOKENS = [
    "Googlebot",
    "OAI-SearchBot",
    "GPTBot",
    "ChatGPT-User",
    "PerplexityBot",
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "Google-Extended",
    "*",
]


@dataclass
class FetchResult:
    url: str
    status: int | None
    headers: dict[str, str] = field(default_factory=dict)
    body: str = ""
    error: str | None = None


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self._in_title = False
        self.h1: list[str] = []
        self._in_h1 = False
        self.current_h1: list[str] = []
        self.meta: dict[str, str] = {}
        self.links: list[dict[str, str]] = []
        self.jsonld: list[str] = []
        self._script_type = ""
        self._in_jsonld = False
        self._jsonld_parts: list[str] = []
        self.visible_text_parts: list[str] = []
        self._skip_text = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {k.lower(): v or "" for k, v in attrs}
        tag = tag.lower()

        if tag in {"script", "style", "noscript"}:
            self._skip_text += 1

        if tag == "title":
            self._in_title = True
        elif tag == "h1":
            self._in_h1 = True
            self.current_h1 = []
        elif tag == "meta":
            key = (attrs_dict.get("name") or attrs_dict.get("property") or "").lower()
            content = attrs_dict.get("content", "")
            if key and content:
                self.meta[key] = content.strip()
        elif tag == "link":
            rel = attrs_dict.get("rel", "").lower()
            href = attrs_dict.get("href", "")
            if rel or href:
                self.links.append({"rel": rel, "href": href})
        elif tag == "script":
            self._script_type = attrs_dict.get("type", "").lower()
            if self._script_type == "application/ld+json":
                self._in_jsonld = True
                self._jsonld_parts = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript"} and self._skip_text:
            self._skip_text -= 1
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False
            text = clean_text(" ".join(self.current_h1))
            if text:
                self.h1.append(text)
        elif tag == "script" and self._in_jsonld:
            self.jsonld.append("".join(self._jsonld_parts).strip())
            self._in_jsonld = False
            self._jsonld_parts = []

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._in_h1:
            self.current_h1.append(data)
        if self._in_jsonld:
            self._jsonld_parts.append(data)
        if not self._skip_text:
            text = clean_text(data)
            if text:
                self.visible_text_parts.append(text)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def fetch(url: str, user_agent: str = DEFAULT_USER_AGENT, limit: int = 2_000_000) -> FetchResult:
    request = Request(url, headers={"User-Agent": user_agent, "Accept": "text/html,*/*"})
    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read(limit)
            charset = response.headers.get_content_charset() or "utf-8"
            body = raw.decode(charset, errors="replace")
            return FetchResult(
                url=response.geturl(),
                status=response.status,
                headers={k.lower(): v for k, v in response.headers.items()},
                body=body,
            )
    except HTTPError as exc:
        body = exc.read(limit).decode("utf-8", errors="replace")
        return FetchResult(
            url=url,
            status=exc.code,
            headers={k.lower(): v for k, v in exc.headers.items()},
            body=body,
            error=f"HTTP {exc.code}",
        )
    except URLError as exc:
        return FetchResult(url=url, status=None, error=str(exc.reason))
    except Exception as exc:  # noqa: BLE001 - CLI should report any fetch failure.
        return FetchResult(url=url, status=None, error=str(exc))


def site_root(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/"


def parse_robots(robots_text: str) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {}
    current_agents: list[str] = []
    seen_rule_in_group = False
    for raw_line in robots_text.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue
        key, value = [part.strip() for part in line.split(":", 1)]
        key = key.lower()
        if key == "user-agent":
            if seen_rule_in_group:
                current_agents = []
                seen_rule_in_group = False
            agent = value
            current_agents.append(agent)
            groups.setdefault(agent.lower(), [])
        elif key == "disallow" and current_agents:
            seen_rule_in_group = True
            for agent in current_agents:
                groups.setdefault(agent.lower(), []).append(value)
        elif current_agents and key in {"allow", "crawl-delay", "sitemap"}:
            seen_rule_in_group = True
    return groups


def robots_decision(groups: dict[str, list[str]], token: str) -> str:
    rules = groups.get(token.lower())
    if rules is None and token != "*":
        rules = groups.get("*")
    if not rules:
        return "未发现阻止规则"
    if "/" in rules:
        return "可能全站阻止"
    nonempty = [rule for rule in rules if rule]
    if nonempty:
        return "存在部分阻止规则: " + ", ".join(nonempty[:4])
    return "未发现阻止规则"


def jsonld_types(jsonld_blocks: Iterable[str]) -> list[str]:
    types: set[str] = set()
    for block in jsonld_blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        collect_types(data, types)
    return sorted(types)


def collect_types(value: object, types: set[str]) -> None:
    if isinstance(value, dict):
        type_value = value.get("@type")
        if isinstance(type_value, str):
            types.add(type_value)
        elif isinstance(type_value, list):
            types.update(str(item) for item in type_value)
        for child in value.values():
            collect_types(child, types)
    elif isinstance(value, list):
        for item in value:
            collect_types(item, types)


def analyze_content(text: str) -> dict[str, object]:
    words = re.findall(r"\b[\w'-]+\b", text)
    stats_count = len(re.findall(r"(?<!\w)(?:\d+[,.]?\d*%?|\$\d+[,.]?\d*|\d{4})(?!\w)", text))
    questions = len(re.findall(r"\?", text)) + len(re.findall(r"(?:^|\n)\s*(?:what|why|how|when|where|who|which|can|should|is|are)\b", text, re.I))
    quote_marks = text.count('"') + text.count("'")
    return {
        "word_count": len(words),
        "specific_numbers": stats_count,
        "question_like_sections": questions,
        "quote_mark_count": quote_marks,
        "has_updated_date": bool(re.search(r"(updated|last modified|最近更新|更新时间|发布日期|published)", text, re.I)),
        "has_author_signal": bool(re.search(r"(author|by\s+[A-Z][a-z]+|作者|撰写|编辑|reviewed by)", text, re.I)),
    }


def audit_url(url: str) -> dict[str, object]:
    if not urlparse(url).scheme:
        url = "https://" + url

    page = fetch(url)
    root = site_root(url)
    robots = fetch(urljoin(root, "robots.txt"))
    sitemap = fetch(urljoin(root, "sitemap.xml"))

    parser = PageParser()
    if page.body:
        parser.feed(page.body)

    canonical = ""
    for link in parser.links:
        if "canonical" in link.get("rel", ""):
            canonical = link.get("href", "")
            break

    robots_groups = parse_robots(robots.body) if robots.status == 200 else {}
    text = clean_text(" ".join(parser.visible_text_parts))

    return {
        "url": url,
        "final_url": page.url,
        "status": page.status,
        "error": page.error,
        "title": clean_text(parser.title),
        "meta_description": parser.meta.get("description", ""),
        "meta_robots": parser.meta.get("robots", ""),
        "canonical": canonical,
        "h1": parser.h1,
        "jsonld_types": jsonld_types(parser.jsonld),
        "content_signals": analyze_content(text),
        "robots_status": robots.status,
        "robots_decisions": {token: robots_decision(robots_groups, token) for token in BOT_TOKENS},
        "sitemap_xml_status": sitemap.status,
        "sitemaps_in_robots": re.findall(r"(?im)^sitemap:\s*(\S+)", robots.body or ""),
        "warnings": build_warnings(page, parser, robots, sitemap, text),
    }


def build_warnings(
    page: FetchResult,
    parser: PageParser,
    robots: FetchResult,
    sitemap: FetchResult,
    text: str,
) -> list[str]:
    warnings: list[str] = []
    if page.status != 200:
        warnings.append("页面不是 200 状态，AI/搜索系统可能无法稳定抓取。")
    robots_meta = parser.meta.get("robots", "").lower()
    if "noindex" in robots_meta:
        warnings.append("发现 noindex；该页不适合作为 AI 搜索可见性目标页。")
    if "nosnippet" in robots_meta or "max-snippet:0" in robots_meta:
        warnings.append("发现 nosnippet 或 max-snippet:0；这会限制摘要/AI 特性可用内容。")
    if not clean_text(parser.title):
        warnings.append("缺少 title。")
    if not parser.meta.get("description"):
        warnings.append("缺少 meta description。")
    if not parser.h1:
        warnings.append("缺少 H1。")
    if not parser.jsonld:
        warnings.append("未发现 JSON-LD 结构化数据。")
    if len(text.split()) < 300:
        warnings.append("可见文本偏少；页面可能缺少足够上下文供 AI 答案引用。")
    if robots.status != 200:
        warnings.append("robots.txt 不可用或非 200。")
    if sitemap.status != 200:
        warnings.append("默认 /sitemap.xml 不可用；若使用其他 sitemap，请在 robots.txt 声明。")
    return warnings


def render_markdown(result: dict[str, object]) -> str:
    lines: list[str] = []
    lines.append(f"# GEO Audit: {result['url']}")
    lines.append("")
    lines.append(f"- Final URL: {result['final_url']}")
    lines.append(f"- HTTP status: {result['status']}")
    lines.append(f"- Title: {result['title'] or '缺失'}")
    lines.append(f"- Meta description: {result['meta_description'] or '缺失'}")
    lines.append(f"- Meta robots: {result['meta_robots'] or '未设置'}")
    lines.append(f"- Canonical: {result['canonical'] or '缺失'}")
    h1 = result["h1"] or []
    lines.append(f"- H1: {', '.join(h1) if h1 else '缺失'}")
    json_types = result["jsonld_types"] or []
    lines.append(f"- JSON-LD types: {', '.join(json_types) if json_types else '未发现'}")
    lines.append(f"- robots.txt status: {result['robots_status']}")
    lines.append(f"- /sitemap.xml status: {result['sitemap_xml_status']}")
    lines.append("")
    lines.append("## Bot Access Signals")
    for token, decision in result["robots_decisions"].items():
        lines.append(f"- {token}: {decision}")
    lines.append("")
    lines.append("## Content Signals")
    for key, value in result["content_signals"].items():
        lines.append(f"- {key}: {value}")
    warnings = result["warnings"]
    lines.append("")
    lines.append("## Warnings")
    if warnings:
        for warning in warnings:
            lines.append(f"- {warning}")
    else:
        lines.append("- 未发现明显基础问题。")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a lightweight GEO audit for URLs.")
    parser.add_argument("urls", nargs="+", help="URL(s) to audit")
    parser.add_argument("--json", action="store_true", help="Output JSON instead of Markdown")
    args = parser.parse_args()

    results = [audit_url(url) for url in args.urls]
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for index, result in enumerate(results):
            if index:
                print("\n---\n")
            print(render_markdown(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
