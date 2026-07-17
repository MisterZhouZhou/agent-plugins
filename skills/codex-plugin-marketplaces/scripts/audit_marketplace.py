#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shlex
import sys
from pathlib import Path
from typing import Any


MARKETPLACE_RELATIVE_PATH = Path(".agents/plugins/marketplace.json")
INSTALLATION_POLICIES = {"NOT_AVAILABLE", "AVAILABLE", "INSTALLED_BY_DEFAULT"}
AUTHENTICATION_POLICIES = {"ON_INSTALL", "ON_USE"}
PLUGIN_RELATIVE_PATH = re.compile(
    r"^(?:\./|\.\\)?(?:hooks|scripts|skills|assets|\.codex-plugin)(?:/|\\)"
)


def load_object(path: Path, label: str, errors: list[str]) -> dict[str, Any] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing {label}: {path}")
        return None
    except OSError as exc:
        errors.append(f"unable to read {label}: {exc}")
        return None
    except json.JSONDecodeError as exc:
        errors.append(f"invalid JSON in {label}: {exc}")
        return None
    if not isinstance(payload, dict):
        errors.append(f"{label} must contain a JSON object")
        return None
    return payload


def non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def references_plugin_relative_path(command: str) -> bool:
    try:
        tokens = shlex.split(command, posix=True)
    except ValueError:
        tokens = command.split()
    return any(PLUGIN_RELATIVE_PATH.match(token.strip('"\'')) for token in tokens)


def validate_hooks(plugin_root: Path, errors: list[str]) -> None:
    hooks_path = plugin_root / "hooks" / "hooks.json"
    if not hooks_path.exists():
        return
    hooks_payload = load_object(hooks_path, "hooks/hooks.json", errors)
    if hooks_payload is None:
        return
    hooks = hooks_payload.get("hooks")
    if not isinstance(hooks, dict):
        errors.append(f"{hooks_path}: field `hooks` must be an object")
        return

    for event, groups in hooks.items():
        if not isinstance(groups, list):
            errors.append(f"{hooks_path}: hook event `{event}` must contain an array")
            continue
        for group_index, group in enumerate(groups):
            hook_items = group.get("hooks") if isinstance(group, dict) else None
            if not isinstance(hook_items, list):
                errors.append(
                    f"{hooks_path}: `{event}` group {group_index} must contain a hooks array"
                )
                continue
            for hook_index, hook in enumerate(hook_items):
                if not isinstance(hook, dict) or hook.get("type") != "command":
                    continue
                command = hook.get("command")
                if not non_empty_string(command):
                    errors.append(
                        f"{hooks_path}: `{event}` command {hook_index} must be non-empty"
                    )
                elif references_plugin_relative_path(command) and "${PLUGIN_ROOT}" not in command:
                    errors.append(
                        f"{hooks_path}: `{event}` command {hook_index} references plugin files "
                        "and must use PLUGIN_ROOT"
                    )
                command_windows = hook.get("commandWindows")
                if command_windows is not None:
                    if not non_empty_string(command_windows):
                        errors.append(
                            f"{hooks_path}: `{event}` Windows command {hook_index} "
                            "must be non-empty"
                        )
                    elif (
                        references_plugin_relative_path(command_windows)
                        and "%PLUGIN_ROOT%" not in command_windows
                    ):
                        errors.append(
                            f"{hooks_path}: `{event}` Windows command {hook_index} "
                            "references plugin files and must use PLUGIN_ROOT"
                        )


def validate_entry(
    root: Path,
    entry: Any,
    index: int,
    seen_names: set[str],
    errors: list[str],
) -> None:
    prefix = f"plugins[{index}]"
    if not isinstance(entry, dict):
        errors.append(f"{prefix} must be an object")
        return

    name = entry.get("name")
    if not non_empty_string(name):
        errors.append(f"{prefix}.name must be a non-empty string")
        return
    assert isinstance(name, str)
    if name in seen_names:
        errors.append(f"duplicate marketplace plugin name: {name}")
    seen_names.add(name)

    source = entry.get("source")
    if not isinstance(source, dict):
        errors.append(f"{prefix}.source must be an object")
        return
    if source.get("source") != "local":
        errors.append(
            f"{prefix}.source.source must be `local`; Git belongs to marketplace "
            "registration, not an individual plugin source"
        )
        return
    raw_path = source.get("path")
    if not non_empty_string(raw_path) or not raw_path.startswith("./"):
        errors.append(f"{prefix}.source.path must be a repository-relative `./...` path")
        return

    plugin_root = (root / raw_path).resolve()
    try:
        plugin_root.relative_to(root)
    except ValueError:
        errors.append(f"{prefix}.source.path escapes the marketplace repository")
        return
    if plugin_root.name != name:
        errors.append(
            f"{prefix}.source.path directory `{plugin_root.name}` does not match "
            f"marketplace entry `{name}`"
        )

    manifest_path = plugin_root / ".codex-plugin" / "plugin.json"
    manifest = load_object(manifest_path, "plugin manifest", errors)
    if manifest is not None and manifest.get("name") != name:
        errors.append(
            f"{manifest_path}: manifest name `{manifest.get('name')}` does not match "
            f"marketplace entry `{name}`"
        )

    policy = entry.get("policy")
    if not isinstance(policy, dict):
        errors.append(f"{prefix}.policy must be an object")
    else:
        if policy.get("installation") not in INSTALLATION_POLICIES:
            errors.append(f"{prefix}.policy.installation is invalid")
        if policy.get("authentication") not in AUTHENTICATION_POLICIES:
            errors.append(f"{prefix}.policy.authentication is invalid")
    if not non_empty_string(entry.get("category")):
        errors.append(f"{prefix}.category must be a non-empty string")

    if plugin_root.is_dir():
        validate_hooks(plugin_root, errors)


def audit(root: Path) -> tuple[list[str], int]:
    errors: list[str] = []
    marketplace_path = root / MARKETPLACE_RELATIVE_PATH
    marketplace = load_object(marketplace_path, "marketplace", errors)
    if marketplace is None:
        return errors, 0

    if not non_empty_string(marketplace.get("name")):
        errors.append("marketplace.name must be a non-empty string")
    interface = marketplace.get("interface")
    if not isinstance(interface, dict) or not non_empty_string(interface.get("displayName")):
        errors.append("marketplace.interface.displayName must be a non-empty string")
    plugins = marketplace.get("plugins")
    if not isinstance(plugins, list):
        errors.append("marketplace.plugins must be an array")
        return errors, 0

    seen_names: set[str] = set()
    for index, entry in enumerate(plugins):
        validate_entry(root, entry, index, seen_names, errors)
    return errors, len(plugins)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read-only audit for a Codex plugin marketplace repository."
    )
    parser.add_argument("root", nargs="?", default=".", help="Marketplace repository root")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.root).expanduser().resolve()
    errors, plugin_count = audit(root)
    if errors:
        print("Codex marketplace audit failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Codex marketplace audit passed: {plugin_count} plugin(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
