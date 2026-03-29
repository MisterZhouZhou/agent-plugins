#!/usr/bin/env python3
"""Yuque knowledge-base search helper."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "https://www.yuque.com/api/v2"


class YuqueAPIError(RuntimeError):
    """Raised when Yuque API returns an error."""


@dataclass
class DocIdentity:
    namespace: str
    slug: str
    strategy: str


def build_headers(token: str) -> dict[str, str]:
    return {
        "X-Auth-Token": token,
        "Accept": "application/json",
        "User-Agent": "yuque-kb-search-skill/1.0",
    }


def api_get(
    base_url: str,
    token: str,
    path: str,
    params: dict[str, Any] | None = None,
) -> Any:
    url = f"{base_url.rstrip('/')}{path}"
    if params:
        filtered = {key: value for key, value in params.items() if value is not None}
        url = f"{url}?{urlencode(filtered)}"

    request = Request(url=url, headers=build_headers(token), method="GET")
    try:
        with urlopen(request) as response:
            return json.load(response)
    except HTTPError as exc:
        payload = exc.read().decode("utf-8", errors="replace")
        raise YuqueAPIError(f"HTTP {exc.code}: {payload}") from exc
    except URLError as exc:
        raise YuqueAPIError(f"Network error: {exc.reason}") from exc


def require_token(explicit_token: str | None) -> str:
    token = explicit_token or os.environ.get("YUQUE_TOKEN")
    if token:
        return token
    raise YuqueAPIError(
        "Missing token. Pass --token or set the YUQUE_TOKEN environment variable."
    )


def extract_items(payload: Any) -> list[Any]:
    data = payload.get("data", payload) if isinstance(payload, dict) else payload
    if data is None:
        return []
    if isinstance(data, list):
        return data
    return [data]


def compact_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def nested_get(obj: Any, *path: str) -> Any:
    current = obj
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def parse_doc_url(url: str | None) -> tuple[str | None, str | None]:
    if not url:
        return None, None
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 3:
        return None, None
    namespace = "/".join(parts[:2])
    slug = parts[2]
    return namespace, slug


def infer_namespace(item: dict[str, Any]) -> str | None:
    candidates = [
        compact_text(item.get("namespace")),
        compact_text(nested_get(item, "book", "namespace")),
        compact_text(nested_get(item, "repo", "namespace")),
        compact_text(nested_get(item, "doc", "namespace")),
    ]
    for candidate in candidates:
        if candidate:
            return candidate
    url = compact_text(item.get("url")) or compact_text(nested_get(item, "doc", "url"))
    namespace, _ = parse_doc_url(url)
    return namespace


def infer_slug(item: dict[str, Any]) -> str | None:
    candidates = [
        compact_text(item.get("slug")),
        compact_text(nested_get(item, "doc", "slug")),
        compact_text(nested_get(item, "target", "slug")),
    ]
    for candidate in candidates:
        if candidate:
            return candidate
    url = compact_text(item.get("url")) or compact_text(nested_get(item, "doc", "url"))
    _, slug = parse_doc_url(url)
    return slug


def normalize_search_item(item: dict[str, Any], rank: int) -> dict[str, Any]:
    namespace = infer_namespace(item)
    slug = infer_slug(item)
    return {
        "rank": rank,
        "title": compact_text(item.get("title"))
        or compact_text(nested_get(item, "doc", "title")),
        "summary": compact_text(item.get("summary"))
        or compact_text(item.get("description")),
        "url": compact_text(item.get("url"))
        or compact_text(nested_get(item, "doc", "url")),
        "namespace": namespace,
        "slug": slug,
        "id": item.get("id") or nested_get(item, "doc", "id"),
    }


def normalize_doc_item(item: dict[str, Any]) -> dict[str, Any]:
    body = (
        item.get("body")
        or item.get("body_draft")
        or item.get("markdown")
        or item.get("content")
        or nested_get(item, "data", "body")
    )
    url = compact_text(item.get("url"))
    namespace = compact_text(item.get("namespace"))
    slug = compact_text(item.get("slug"))
    if (not namespace or not slug) and url:
        parsed_namespace, parsed_slug = parse_doc_url(url)
        namespace = namespace or parsed_namespace
        slug = slug or parsed_slug

    return {
        "id": item.get("id"),
        "title": compact_text(item.get("title")),
        "description": compact_text(item.get("description")),
        "url": url,
        "namespace": namespace,
        "slug": slug,
        "body": body,
    }


def normalize_title(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[\W_]+", "", value.lower())


def score_title_match(target: str | None, candidate: str | None) -> int:
    target_norm = normalize_title(target)
    candidate_norm = normalize_title(candidate)
    if not target_norm or not candidate_norm:
        return -1
    if target_norm == candidate_norm:
        return 100
    if candidate_norm.startswith(target_norm) or target_norm.startswith(candidate_norm):
        return 90
    if target_norm in candidate_norm or candidate_norm in target_norm:
        return 75

    overlap = set(target_norm) & set(candidate_norm)
    if not overlap:
        return 0
    return int((len(overlap) / max(len(set(target_norm)), 1)) * 60)


def encode_namespace(namespace: str) -> str:
    return "/".join(quote(part, safe="") for part in namespace.split("/"))


def encode_slug(slug: str) -> str:
    return quote(slug, safe="")


def search(
    base_url: str,
    token: str,
    query: str,
    item_type: str | None,
    scope: str | None,
    top_k: int,
) -> dict[str, Any]:
    payload = api_get(
        base_url,
        token,
        "/search",
        {"q": query, "type": item_type, "scope": scope},
    )
    items = extract_items(payload)
    results = [normalize_search_item(item, index + 1) for index, item in enumerate(items[:top_k])]
    return {"query": query, "count": len(results), "results": results}


def list_docs(base_url: str, token: str, namespace: str) -> list[dict[str, Any]]:
    payload = api_get(base_url, token, f"/repos/{encode_namespace(namespace)}/docs")
    return [normalize_doc_item(item) for item in extract_items(payload)]


def read_doc(
    base_url: str,
    token: str,
    namespace: str,
    slug: str,
    raw: bool,
) -> dict[str, Any]:
    payload = api_get(
        base_url,
        token,
        f"/repos/{encode_namespace(namespace)}/docs/{encode_slug(slug)}",
        {"raw": 1 if raw else None},
    )
    items = extract_items(payload)
    doc = normalize_doc_item(items[0] if items else {})
    doc["namespace"] = doc.get("namespace") or namespace
    doc["slug"] = doc.get("slug") or slug
    return doc


def resolve_doc_identity(
    base_url: str,
    token: str,
    item: dict[str, Any],
    cache: dict[str, list[dict[str, Any]]],
) -> DocIdentity | None:
    namespace = item.get("namespace")
    slug = item.get("slug")
    if namespace and slug:
        return DocIdentity(namespace=namespace, slug=slug, strategy="search-result")

    url = item.get("url")
    parsed_namespace, parsed_slug = parse_doc_url(url)
    if parsed_namespace and parsed_slug:
        return DocIdentity(namespace=parsed_namespace, slug=parsed_slug, strategy="url")

    title = item.get("title")
    if not namespace or not title:
        return None

    if namespace not in cache:
        cache[namespace] = list_docs(base_url, token, namespace)

    candidates = cache[namespace]
    best = max(
        candidates,
        key=lambda candidate: score_title_match(title, candidate.get("title")),
        default=None,
    )
    if not best:
        return None

    score = score_title_match(title, best.get("title"))
    best_slug = best.get("slug")
    if score < 70 or not best_slug:
        return None
    return DocIdentity(namespace=namespace, slug=best_slug, strategy="title-match")


def truncate_text(value: Any, max_chars: int) -> tuple[Any, bool]:
    if not isinstance(value, str) or max_chars <= 0 or len(value) <= max_chars:
        return value, False
    return value[:max_chars], True


def run_rag(
    base_url: str,
    token: str,
    query: str,
    item_type: str | None,
    scope: str | None,
    top_k: int,
    raw: bool,
    max_content_chars: int,
) -> dict[str, Any]:
    search_result = search(base_url, token, query, item_type, scope, top_k)
    cache: dict[str, list[dict[str, Any]]] = {}
    enriched_results: list[dict[str, Any]] = []

    for item in search_result["results"]:
        enriched = dict(item)
        identity = resolve_doc_identity(base_url, token, item, cache)
        if not identity:
            enriched["doc_error"] = "Unable to resolve namespace/slug for this result."
            enriched_results.append(enriched)
            continue

        enriched["namespace"] = identity.namespace
        enriched["slug"] = identity.slug
        enriched["resolve_strategy"] = identity.strategy

        try:
            doc = read_doc(base_url, token, identity.namespace, identity.slug, raw=raw)
            content, truncated = truncate_text(doc.get("body"), max_content_chars)
            enriched["doc_title"] = doc.get("title") or item.get("title")
            enriched["doc_url"] = doc.get("url") or item.get("url")
            enriched["content"] = content
            enriched["content_truncated"] = truncated
        except YuqueAPIError as exc:
            enriched["doc_error"] = str(exc)

        enriched_results.append(enriched)

    return {"query": query, "count": len(enriched_results), "results": enriched_results}


def parse_read_target(args: argparse.Namespace) -> tuple[str, str]:
    if args.url:
        namespace, slug = parse_doc_url(args.url)
        if namespace and slug:
            return namespace, slug
        raise YuqueAPIError(f"Unable to parse namespace/slug from url: {args.url}")

    if args.namespace and args.slug:
        return args.namespace, args.slug

    raise YuqueAPIError("Provide either --url or both --namespace and --slug.")


def print_json(payload: Any) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Search and read Yuque knowledge-base docs.")
    parser.add_argument("--token", help="Yuque access token. Defaults to YUQUE_TOKEN.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Yuque API base URL.")

    subparsers = parser.add_subparsers(dest="command", required=True)

    search_parser = subparsers.add_parser("search", help="Run full-text search.")
    search_parser.add_argument("query", help="Search query.")
    search_parser.add_argument("--type", default="doc", choices=["doc", "repo", "art"])
    search_parser.add_argument("--scope")
    search_parser.add_argument("--top-k", type=int, default=5)

    list_parser = subparsers.add_parser("list-docs", help="List docs under a repository namespace.")
    list_parser.add_argument("namespace", help="Repository namespace such as org/repo.")

    read_parser = subparsers.add_parser("read", help="Read a specific document.")
    read_parser.add_argument("--namespace")
    read_parser.add_argument("--slug")
    read_parser.add_argument("--url")
    read_parser.add_argument("--raw", action="store_true", help="Request raw Markdown content.")
    read_parser.add_argument(
        "--max-content-chars",
        type=int,
        default=0,
        help="Truncate returned body to this length. 0 means no truncation.",
    )

    rag_parser = subparsers.add_parser("rag", help="Search first, then fetch matched document bodies.")
    rag_parser.add_argument("query", help="Search query.")
    rag_parser.add_argument("--type", default="doc", choices=["doc", "repo", "art"])
    rag_parser.add_argument("--scope")
    rag_parser.add_argument("--top-k", type=int, default=3)
    rag_parser.add_argument("--raw", action="store_true", help="Request raw Markdown content.")
    rag_parser.add_argument(
        "--max-content-chars",
        type=int,
        default=5000,
        help="Truncate each fetched document body to this length. 0 means no truncation.",
    )

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        token = require_token(args.token)
        if args.command == "search":
            result = search(args.base_url, token, args.query, args.type, args.scope, args.top_k)
        elif args.command == "list-docs":
            result = {
                "namespace": args.namespace,
                "count": 0,
                "results": [],
            }
            docs = list_docs(args.base_url, token, args.namespace)
            result["count"] = len(docs)
            result["results"] = docs
        elif args.command == "read":
            namespace, slug = parse_read_target(args)
            result = read_doc(args.base_url, token, namespace, slug, raw=args.raw)
            content, truncated = truncate_text(result.get("body"), args.max_content_chars)
            result["body"] = content
            result["content_truncated"] = truncated
        elif args.command == "rag":
            result = run_rag(
                args.base_url,
                token,
                args.query,
                args.type,
                args.scope,
                args.top_k,
                args.raw,
                args.max_content_chars,
            )
        else:
            raise YuqueAPIError(f"Unsupported command: {args.command}")
    except YuqueAPIError as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    print_json(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
