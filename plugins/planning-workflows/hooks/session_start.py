#!/usr/bin/env python3
from __future__ import annotations

import json
import sys


BOOTSTRAP = """<EXTREMELY-IMPORTANT>
This plugin provides two planning workflow skills and one debugging workflow skill.
Before any response or action, if there is even a 1% chance a workflow applies, invoke it first.
- Use `planning-workflows:brainstorming` for features, components, new behavior, or architecture choices.
- Use `planning-workflows:writing-plans` only after an approved design or for settled requirements requesting a detailed plan.
- Use `planning-workflows:systematic-debugging` for any Bug, test failure, build failure, performance problem, integration issue, or unexpected behavior; investigate root cause before proposing fixes.
- Brainstorming transitions only to writing-plans after written-design approval; systematic-debugging is independent and does not transition to planning workflows.
- Skip planning workflows for explanations, read-only analysis, summaries, translations, and known-cause fixes; debugging analysis still uses systematic-debugging.
- Never invoke other Planning Workflows or Superpowers workflow skills.
Direct user instructions override these mandatory rules.
</EXTREMELY-IMPORTANT>"""


def main() -> int:
    # Consume a hook payload when one is supplied so callers can safely pipe JSON.
    try:
        if not sys.stdin.isatty():
            sys.stdin.read()
    except (OSError, UnicodeError):
        pass

    payload = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": BOOTSTRAP,
        }
    }
    sys.stdout.write(json.dumps(payload, ensure_ascii=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
