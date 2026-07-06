#!/usr/bin/env python3

import argparse
import json
import os
import re
import sys
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional, Tuple
from urllib import error, parse, request


DEFAULT_API_BASE = "https://www.yuque.com/api/v2"
DEFAULT_USER_AGENT = "AI-Data-Extractor"
YUQUE_URL_RE = re.compile(
    r"^https?://(?:[^/]+\.)?yuque\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+)/(?P<doc>[^/?#]+)"
)


class MarkdownSanitizer(HTMLParser):
    BLOCK_TAGS = {"body", "div", "section", "article", "p", "blockquote"}
    STRONG_TAGS = {"strong", "b"}
    EMPHASIS_TAGS = {"em", "i"}
    IGNORE_TAGS = {"style", "script"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.output = []
        self.ignore_depth = 0
        self.link_stack = []
        self.in_pre = 0

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs_map = dict(attrs)

        if tag in self.IGNORE_TAGS:
            self.ignore_depth += 1
            return
        if self.ignore_depth:
            return

        if tag in self.BLOCK_TAGS:
            self.output.append("\n")
            return
        if tag == "br":
            self.output.append("\n")
            return
        if tag in self.STRONG_TAGS:
            self.output.append("**")
            return
        if tag in self.EMPHASIS_TAGS:
            self.output.append("*")
            return
        if tag == "code" and not self.in_pre:
            self.output.append("`")
            return
        if tag == "pre":
            self.in_pre += 1
            self.output.append("\n```\n")
            return
        if tag in {"ul", "ol"}:
            self.output.append("\n")
            return
        if tag == "li":
            self.output.append("- ")
            return
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            level = int(tag[1])
            self.output.append("\n" + "#" * level + " ")
            return
        if tag == "a":
            href = attrs_map.get("href", "").strip()
            self.link_stack.append(href)
            self.output.append("[")
            return
        if tag == "img":
            alt = attrs_map.get("alt", "").strip()
            src = attrs_map.get("src", "").strip()
            if src:
                self.output.append(f"![{alt}]({src})")
            return
        if tag == "table":
            self.output.append("\n")
            return
        if tag == "tr":
            self.output.append("| ")
            return

    def handle_endtag(self, tag):
        tag = tag.lower()

        if tag in self.IGNORE_TAGS:
            if self.ignore_depth:
                self.ignore_depth -= 1
            return
        if self.ignore_depth:
            return

        if tag in self.BLOCK_TAGS or tag in {"li", "table", "tr"}:
            self.output.append("\n")
            return
        if tag in self.STRONG_TAGS:
            self.output.append("**")
            return
        if tag in self.EMPHASIS_TAGS:
            self.output.append("*")
            return
        if tag == "code" and not self.in_pre:
            self.output.append("`")
            return
        if tag == "pre":
            if self.in_pre:
                self.in_pre -= 1
            self.output.append("\n```\n")
            return
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.output.append("\n")
            return
        if tag == "a":
            href = self.link_stack.pop() if self.link_stack else ""
            self.output.append(f"]({href})" if href else "]")
            return
        if tag in {"td", "th"}:
            self.output.append(" | ")
            return

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in {"br", "img"}:
            self.handle_endtag(tag)

    def handle_data(self, data):
        if self.ignore_depth:
            return
        self.output.append(data)

    def get_markdown(self) -> str:
        return "".join(self.output)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch Yuque content with the Yuque API and normalize it to Markdown."
    )
    parser.add_argument("--url", help="Yuque document URL.")
    parser.add_argument(
        "--repo-namespace",
        help="Yuque repo namespace in the format owner/repo.",
    )
    parser.add_argument("--doc-slug", help="Yuque document slug.")
    parser.add_argument("--token", help="Yuque token. Defaults to YUQUE_TOKEN.")
    parser.add_argument(
        "--api-base",
        default=DEFAULT_API_BASE,
        help=f"Yuque API base. Defaults to {DEFAULT_API_BASE}.",
    )
    parser.add_argument(
        "--user-agent",
        default=DEFAULT_USER_AGENT,
        help=f"User-Agent header. Defaults to {DEFAULT_USER_AGENT}.",
    )
    parser.add_argument(
        "--output",
        help="Write normalized Markdown to this file. Defaults to stdout.",
    )
    parser.add_argument(
        "--output-dir",
        help="When --output is not provided, save the file into this directory with an auto-generated name.",
    )
    parser.add_argument(
        "--output-label",
        default="原文档",
        help="Suffix label used in the auto-generated file name. Defaults to 原文档.",
    )
    return parser.parse_args()


def parse_yuque_url(url: str) -> Optional[Tuple[str, str]]:
    match = YUQUE_URL_RE.match(url.strip())
    if not match:
        return None
    repo_namespace = f"{match.group('owner')}/{match.group('repo')}"
    doc_slug = match.group("doc")
    return repo_namespace, doc_slug


def resolve_document_identity(args: argparse.Namespace) -> Tuple[str, str]:
    repo_namespace = args.repo_namespace
    doc_slug = args.doc_slug

    if args.url:
        parsed = parse_yuque_url(args.url)
        if parsed:
            repo_namespace = repo_namespace or parsed[0]
            doc_slug = doc_slug or parsed[1]

    if not repo_namespace or not doc_slug:
        raise SystemExit(
            "Missing Yuque document identity. Provide --url or both --repo-namespace and --doc-slug."
        )

    if "/" not in repo_namespace:
        raise SystemExit("Invalid --repo-namespace. Expected the format owner/repo.")

    return repo_namespace, doc_slug


def resolve_token(args: argparse.Namespace) -> str:
    token = args.token or os.environ.get("YUQUE_TOKEN")
    if not token:
        raise SystemExit("Missing Yuque token. Provide --token or set YUQUE_TOKEN.")
    return token


def fetch_yuque_document(
    api_base: str,
    repo_namespace: str,
    doc_slug: str,
    token: str,
    user_agent: str,
):
    repo_path = "/".join(parse.quote(part, safe="") for part in repo_namespace.split("/", 1))
    doc_path = parse.quote(doc_slug, safe="")
    endpoint = f"{api_base.rstrip('/')}/repos/{repo_path}/docs/{doc_path}?raw=1"
    req = request.Request(
        endpoint,
        headers={
            "X-Auth-Token": token,
            "User-Agent": user_agent,
        },
        method="GET",
    )

    try:
        with request.urlopen(req) as response:
            payload = response.read().decode("utf-8")
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        if exc.code == 404:
            raise SystemExit(
                "Yuque API returned 404. Check token permissions, repo namespace, doc slug, and User-Agent.\n"
                f"Response: {body}"
            ) from exc
        raise SystemExit(
            f"Yuque API request failed with status {exc.code}.\nResponse: {body}"
        ) from exc
    except error.URLError as exc:
        raise SystemExit(f"Failed to connect to Yuque API: {exc}") from exc

    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Yuque API returned invalid JSON: {exc}") from exc

    return data.get("data") or {}


def cleanup_markdown(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)

    sanitizer = MarkdownSanitizer()
    sanitizer.feed(text)
    sanitizer.close()
    normalized = sanitizer.get_markdown()
    normalized = unescape(normalized)

    lines = [line.rstrip() for line in normalized.split("\n")]
    compact_lines = []
    blank_count = 0

    for line in lines:
        if line.strip():
            compact_lines.append(line)
            blank_count = 0
        else:
            blank_count += 1
            if blank_count <= 1:
                compact_lines.append("")

    normalized = "\n".join(compact_lines)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    # Remove empty markdown links without stripping markdown images like ![](url).
    normalized = re.sub(r"(?<!!)\[\]\([^)]+\)", "", normalized)
    return normalized.strip() + "\n"


def prepend_title(title: str, body: str) -> str:
    title = (title or "").strip()
    if not title:
        return body

    first_non_empty = ""
    for line in body.splitlines():
        stripped = line.strip()
        if stripped:
            first_non_empty = stripped
            break

    expected_heading = f"# {title}"
    if first_non_empty == expected_heading:
        return body
    return f"{expected_heading}\n\n{body.lstrip()}"


def sanitize_filename(value: str) -> str:
    value = re.sub(r'[\\/:*?"<>|]+', "-", value.strip())
    value = re.sub(r"\s+", " ", value)
    value = value.strip(" .")
    return value or "未命名文档"


def build_output_path(title: str, output_dir: str, output_label: str) -> Path:
    safe_title = sanitize_filename(title or "未命名文档")
    safe_label = sanitize_filename(output_label or "原文档")
    return Path(output_dir) / f"{safe_title}-{safe_label}.md"


def write_output(
    content: str,
    output_path: Optional[str],
    output_dir: Optional[str],
    output_label: str,
    title: str,
) -> None:
    if not output_path:
        if output_dir:
            path = build_output_path(title=title, output_dir=output_dir, output_label=output_label)
        else:
            sys.stdout.write(content)
            return
    else:
        path = Path(output_path)

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"Saved normalized Markdown to {path}", file=sys.stderr)


def main() -> None:
    args = parse_args()
    repo_namespace, doc_slug = resolve_document_identity(args)
    token = resolve_token(args)
    data = fetch_yuque_document(
        api_base=args.api_base,
        repo_namespace=repo_namespace,
        doc_slug=doc_slug,
        token=token,
        user_agent=args.user_agent,
    )

    title = (data.get("title") or "").strip()
    body = data.get("body")
    if not isinstance(body, str) or not body.strip():
        raise SystemExit("Yuque API returned an empty document body.")

    normalized_body = cleanup_markdown(body)
    content = prepend_title(title, normalized_body)
    write_output(
        content=content,
        output_path=args.output,
        output_dir=args.output_dir,
        output_label=args.output_label,
        title=title,
    )


if __name__ == "__main__":
    main()
