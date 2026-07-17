#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ACTIVE_NAME = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9._-]*$")
MAX_FILE_CHARS = 16_000


def load_payload() -> dict[str, Any]:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError, UnicodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def project_root(payload: dict[str, Any]) -> Path:
    cwd = payload.get("cwd")
    if isinstance(cwd, str) and cwd.strip():
        return Path(cwd).expanduser().resolve()
    return Path.cwd().resolve()


def resolve_active_memory(root: Path) -> tuple[str, Path] | None:
    memory_root = root / ".memory"
    active_file = memory_root / ".active_memory"
    try:
        active = active_file.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError):
        return None

    if not ACTIVE_NAME.fullmatch(active) or active in {".", ".."}:
        return None

    memory_dir = (memory_root / active).resolve()
    try:
        memory_dir.relative_to(memory_root.resolve())
    except ValueError:
        return None

    if not memory_dir.is_dir():
        return None
    if not (memory_dir / "memory.md").is_file():
        return None
    if not (memory_dir / "handoff.md").is_file():
        return None
    return active, memory_dir


def read_context(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return ""
    if len(text) <= MAX_FILE_CHARS:
        return text.rstrip()
    return text[:MAX_FILE_CHARS].rstrip() + "\n\n[truncated by memory hook]"


def emit(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=True) + "\n")


def session_start(active: str, memory_dir: Path) -> None:
    memory = read_context(memory_dir / "memory.md")
    handoff = read_context(memory_dir / "handoff.md")
    if not memory or not handoff:
        return

    context = (
        f"[memory-with-files] Active memory: {active}\n"
        "Use the following durable project context before continuing. "
        "The referenced Superpowers/OpenSpec artifact remains authoritative for tasks and status.\n\n"
        "=== BEGIN memory.md ===\n"
        f"{memory}\n"
        "=== END memory.md ===\n\n"
        "=== BEGIN handoff.md ===\n"
        f"{handoff}\n"
        "=== END handoff.md ==="
    )
    emit(
        {
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "additionalContext": context,
            }
        }
    )


def pre_compact(active: str, memory_dir: Path) -> None:
    relative_handoff = memory_dir.name + "/handoff.md"
    emit(
        {
            "continue": True,
            "systemMessage": (
                f"[memory-with-files] Before compaction, refresh .memory/{relative_handoff} "
                f"for active memory '{active}' with durable state and the exact resume point. "
                "Do not copy task status, phases, or checklists from Superpowers/OpenSpec."
            ),
        }
    )


def main() -> int:
    event = sys.argv[1] if len(sys.argv) > 1 else ""
    payload = load_payload()
    resolved = resolve_active_memory(project_root(payload))
    if resolved is None:
        return 0

    active, memory_dir = resolved
    if event == "session-start":
        session_start(active, memory_dir)
    elif event == "pre-compact":
        pre_compact(active, memory_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
