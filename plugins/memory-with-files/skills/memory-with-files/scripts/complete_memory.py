#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PLUGIN_ROOT))

from lib.memory_store import complete_task  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mark a project-local memory task completed and clear its active pointer."
    )
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Project root")
    parser.add_argument("--slug", help="Task slug; defaults to .memory/.active_memory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        paths = complete_task(args.root, args.slug)
    except (OSError, RuntimeError, UnicodeError, ValueError) as exc:
        print(f"memory-with-files: {exc}", file=sys.stderr)
        return 1

    print(paths.task_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
