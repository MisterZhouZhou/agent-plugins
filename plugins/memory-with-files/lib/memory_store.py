#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Mapping


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = PLUGIN_ROOT / "skills" / "memory-with-files" / "assets" / "templates"
ACTIVE_NAME = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9._-]*$")
STATUS_PATTERN = re.compile(r"(?m)^- Status: `(?P<status>[^`]+)`\s*$")
TASK_FILES = ("memory.md", "findings.md", "handoff.md")


@dataclass(frozen=True)
class MemoryPaths:
    root: Path
    memory_root: Path
    project_dir: Path
    tasks_dir: Path
    active_file: Path
    slug: str | None = None
    task_dir: Path | None = None

    @property
    def project_memory(self) -> Path:
        return self.project_dir / "memory.md"

    @property
    def project_findings(self) -> Path:
        return self.project_dir / "findings.md"

    @property
    def task_memory(self) -> Path:
        if self.task_dir is None:
            raise ValueError("task path is not available")
        return self.task_dir / "memory.md"

    @property
    def task_findings(self) -> Path:
        if self.task_dir is None:
            raise ValueError("task path is not available")
        return self.task_dir / "findings.md"

    @property
    def task_handoff(self) -> Path:
        if self.task_dir is None:
            raise ValueError("task path is not available")
        return self.task_dir / "handoff.md"


def is_disabled(env: Mapping[str, str] | None = None) -> bool:
    source = os.environ if env is None else env
    return source.get("MEMORY_WITH_FILES_DISABLED") == "1"


def _assert_enabled() -> None:
    if is_disabled():
        raise RuntimeError("memory-with-files is disabled by MEMORY_WITH_FILES_DISABLED=1")


def normalize_root(root: Path) -> Path:
    resolved = root.expanduser().resolve()
    if resolved.exists() and not resolved.is_dir():
        raise ValueError(f"project root is not a directory: {resolved}")
    return resolved


def project_paths(root: Path) -> MemoryPaths:
    resolved = normalize_root(root)
    memory_root = resolved / ".memory"
    return MemoryPaths(
        root=resolved,
        memory_root=memory_root,
        project_dir=memory_root / "project",
        tasks_dir=memory_root / "tasks",
        active_file=memory_root / ".active_memory",
    )


def discover_project_root(start: Path) -> Path:
    resolved = normalize_root(start)
    for candidate in (resolved, *resolved.parents):
        if (candidate / ".memory").is_dir() or (candidate / ".git").exists():
            return candidate
    return resolved


def _validate_slug(slug: str) -> str:
    if not ACTIVE_NAME.fullmatch(slug) or slug in {".", ".."}:
        raise ValueError(f"invalid memory slug: {slug!r}")
    return slug


def task_paths(root: Path, slug: str, *, legacy: bool = False) -> MemoryPaths:
    base = project_paths(root)
    valid_slug = _validate_slug(slug)
    task_dir = (base.memory_root if legacy else base.tasks_dir) / valid_slug
    resolved_task = task_dir.resolve()
    allowed_root = (base.memory_root if legacy else base.tasks_dir).resolve()
    try:
        resolved_task.relative_to(allowed_root)
    except ValueError as exc:
        raise ValueError(f"task path escapes memory root: {slug!r}") from exc
    return replace(base, slug=valid_slug, task_dir=resolved_task)


def slugify(value: str) -> str:
    normalized = value.strip()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    if slug:
        return slug[:64]
    if normalized:
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:8]
        return f"memory-{digest}"
    return ""


def _render_template(name: str, **values: str) -> str:
    text = (TEMPLATE_DIR / name).read_text(encoding="utf-8")
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", value)
    return text


def _write_if_missing(path: Path, content: str) -> None:
    if not path.exists():
        path.write_text(content, encoding="utf-8")


def _upgrade_task_metadata(path: Path, *, slug: str, task_source: str) -> None:
    text = path.read_text(encoding="utf-8")
    if STATUS_PATTERN.search(text):
        return
    metadata = (
        f"- Slug: `{slug}`\n"
        "- Status: `active`\n"
        f"- Task source: `{task_source}`\n\n"
    )
    lines = text.splitlines(keepends=True)
    if lines and lines[0].lstrip().startswith("# "):
        updated = lines[0] + "\n" + metadata + "".join(lines[1:])
    else:
        updated = metadata + text
    path.write_text(updated, encoding="utf-8")


def ensure_project_memory(root: Path) -> MemoryPaths:
    _assert_enabled()
    paths = project_paths(root)
    paths.project_dir.mkdir(parents=True, exist_ok=True)
    paths.tasks_dir.mkdir(parents=True, exist_ok=True)
    _write_if_missing(
        paths.project_memory,
        _render_template("project-memory.md"),
    )
    _write_if_missing(
        paths.project_findings,
        _render_template("project-findings.md"),
    )
    return paths


def migrate_legacy_tasks(root: Path) -> list[tuple[Path, Path]]:
    _assert_enabled()
    paths = project_paths(root)
    if not paths.memory_root.is_dir():
        return []
    paths.tasks_dir.mkdir(parents=True, exist_ok=True)
    moved: list[tuple[Path, Path]] = []
    for candidate in sorted(paths.memory_root.iterdir(), key=lambda item: item.name):
        if (
            not candidate.is_dir()
            or candidate.name in {"project", "tasks"}
            or candidate.name.startswith(".")
            or not ACTIVE_NAME.fullmatch(candidate.name)
            or not (candidate / "memory.md").is_file()
            or not (candidate / "handoff.md").is_file()
        ):
            continue
        target = paths.tasks_dir / candidate.name
        if target.exists():
            continue
        original = candidate
        candidate.replace(target)
        moved.append((original, target))
    return moved


def task_status(memory_file: Path) -> str | None:
    try:
        text = memory_file.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return None
    match = STATUS_PATTERN.search(text)
    return match.group("status") if match else None


def _existing_task_paths(root: Path, slug: str) -> MemoryPaths | None:
    modern = task_paths(root, slug)
    if modern.task_dir is not None and modern.task_dir.is_dir():
        return modern
    legacy = task_paths(root, slug, legacy=True)
    if legacy.task_dir is not None and legacy.task_dir.is_dir():
        return legacy
    return None


def initialize_task(root: Path, topic: str, task_source: str) -> MemoryPaths:
    _assert_enabled()
    slug = slugify(topic)
    if not slug:
        raise ValueError("topic must not be empty")
    ensure_project_memory(root)
    migrated = migrate_legacy_tasks(root)
    paths = task_paths(root, slug)
    if paths.task_dir is None:
        raise ValueError("task directory is unavailable")
    if paths.task_dir.exists() and task_status(paths.task_memory) == "completed":
        raise ValueError(f"task '{slug}' is completed; choose a new topic to reactivate work")
    paths.task_dir.mkdir(parents=True, exist_ok=True)
    replacements = {
        "TOPIC": topic.strip(),
        "SLUG": slug,
        "TASK_SOURCE": task_source.strip() or "conversation",
    }
    for name in TASK_FILES:
        _write_if_missing(paths.task_dir / name, _render_template(name, **replacements))
    if any(target.resolve() == paths.task_dir.resolve() for _, target in migrated):
        _upgrade_task_metadata(
            paths.task_memory,
            slug=slug,
            task_source=replacements["TASK_SOURCE"],
        )
    paths.active_file.write_text(f"{slug}\n", encoding="utf-8")
    return paths


def read_active_slug(root: Path) -> str | None:
    active_file = project_paths(root).active_file
    try:
        slug = active_file.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError):
        return None
    try:
        return _validate_slug(slug)
    except ValueError:
        return None


def resolve_active_task(root: Path) -> MemoryPaths | None:
    if is_disabled():
        return None
    slug = read_active_slug(root)
    if slug is None:
        return None
    paths = _existing_task_paths(root, slug)
    if paths is None or paths.task_dir is None:
        return None
    if not paths.task_memory.is_file() or not paths.task_handoff.is_file():
        return None
    status = task_status(paths.task_memory)
    if status == "completed":
        return None
    if status not in {None, "active"}:
        return None
    return paths


def complete_task(root: Path, slug: str | None = None) -> MemoryPaths:
    _assert_enabled()
    selected = slug or read_active_slug(root)
    if not selected:
        raise ValueError("no active memory task")
    paths = _existing_task_paths(root, _validate_slug(selected))
    if paths is None or paths.task_dir is None:
        raise ValueError(f"memory task not found: {selected}")
    text = paths.task_memory.read_text(encoding="utf-8")
    match = STATUS_PATTERN.search(text)
    if match is None or match.group("status") != "active":
        raise ValueError(f"memory task is not active: {selected}")
    updated = text[: match.start()] + "- Status: `completed`" + text[match.end() :]
    paths.task_memory.write_text(updated, encoding="utf-8")
    if read_active_slug(root) == selected:
        try:
            paths.active_file.unlink()
        except FileNotFoundError:
            pass
    return paths
