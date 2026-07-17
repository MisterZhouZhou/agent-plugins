#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = SKILL_DIR / "assets" / "templates"
MEMORY_FILES = ("memory.md", "findings.md", "handoff.md")


def slugify(value: str) -> str:
    normalized = value.strip()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    if slug:
        return slug[:64]
    if normalized:
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:8]
        return f"memory-{digest}"
    return ""


def render_template(name: str, *, topic: str, task_source: str) -> str:
    template = (TEMPLATE_DIR / name).read_text(encoding="utf-8")
    return template.replace("{{TOPIC}}", topic).replace(
        "{{TASK_SOURCE}}", task_source or "conversation"
    )


def initialize(root: Path, topic: str, task_source: str) -> Path:
    slug = slugify(topic)
    if not slug:
        raise ValueError("topic must not be empty")

    memory_root = root.resolve() / ".memory"
    memory_dir = memory_root / slug
    memory_dir.mkdir(parents=True, exist_ok=True)

    for name in MEMORY_FILES:
        target = memory_dir / name
        if not target.exists():
            target.write_text(
                render_template(name, topic=topic, task_source=task_source),
                encoding="utf-8",
            )

    (memory_root / ".active_memory").write_text(f"{slug}\n", encoding="utf-8")
    return memory_dir


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initialize a memory-only file bundle without task planning."
    )
    parser.add_argument("topic", help="Memory topic; converted to an ASCII slug")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Project root")
    parser.add_argument(
        "--task-source",
        default="conversation",
        help="Authoritative external task artifact or 'conversation'",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        memory_dir = initialize(args.root, args.topic, args.task_source)
    except (OSError, ValueError) as exc:
        print(f"memory-with-files: {exc}", file=sys.stderr)
        return 1

    print(memory_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
