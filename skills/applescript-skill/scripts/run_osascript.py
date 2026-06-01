#!/usr/bin/env python3
"""Small hardened osascript runner for AppleScript and JXA."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys


DANGEROUS_PATTERNS = [
    r"with\s+administrator\s+privileges",
    r"\bsudo\b",
    r"\brm\s+-r[f]?\b",
    r"\b(curl|wget)\b.*\|\s*(sh|bash|zsh)",
    r">\s*/etc/",
    r"\b(Keychain Access|1Password)\b",
    r"keystroke.*(password|passcode|2fa|otp)",
]


def find_blocked_patterns(script: str) -> list[str]:
    return [
        pattern
        for pattern in DANGEROUS_PATTERNS
        if re.search(pattern, script, re.IGNORECASE | re.DOTALL)
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run AppleScript/JXA with basic guardrails.")
    parser.add_argument("--script", help="Script source to execute.")
    parser.add_argument("--file", help="Path to script source file.")
    parser.add_argument("--timeout", type=float, default=10.0, help="Execution timeout in seconds.")
    parser.add_argument(
        "--language",
        choices=["AppleScript", "JavaScript"],
        default="AppleScript",
        help="osascript language.",
    )
    parser.add_argument(
        "--allow-dangerous",
        action="store_true",
        help="Bypass pattern checks. Use only after explicit user approval.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if bool(args.script) == bool(args.file):
        print("Provide exactly one of --script or --file.", file=sys.stderr)
        return 2

    script = args.script
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            script = f.read()

    assert script is not None
    blocked = find_blocked_patterns(script)
    if blocked and not args.allow_dangerous:
        print("Blocked dangerous AppleScript/JXA patterns:", file=sys.stderr)
        for pattern in blocked:
            print(f"- {pattern}", file=sys.stderr)
        return 3

    command = ["osascript"]
    if args.language == "JavaScript":
        command.extend(["-l", "JavaScript"])
    command.extend(["-e", script])

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=args.timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        print(f"osascript timed out after {args.timeout:g}s", file=sys.stderr)
        return 124

    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    if result.stderr:
        print(result.stderr, file=sys.stderr, end="" if result.stderr.endswith("\n") else "\n")
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
