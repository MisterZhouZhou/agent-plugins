#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PLUGIN_ROOT))

from lib.memory_store import initialize_task  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initialize project and task memory without managing the task plan."
    )
    parser.add_argument("topic", help="Memory topic; converted to a safe task slug")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Project root")
    parser.add_argument(
        "--task-source",
        default="conversation",
        help="Authoritative planning artifact or 'conversation'",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        paths = initialize_task(args.root, args.topic, args.task_source)
    except (OSError, RuntimeError, UnicodeError, ValueError) as exc:
        print(f"memory-with-files: {exc}", file=sys.stderr)
        return 1

    print(paths.task_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
