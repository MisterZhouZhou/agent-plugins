from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PLUGIN_ROOT))


class MemoryStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def store(self):
        from lib import memory_store

        return memory_store

    def test_initialize_creates_project_and_task_layout(self) -> None:
        paths = self.store().initialize_task(
            self.root, "Login Module", "docs/planning/specs/login.md"
        )

        self.assertEqual(paths.slug, "login-module")
        self.assertTrue((self.root / ".memory/project/memory.md").is_file())
        self.assertTrue((self.root / ".memory/project/findings.md").is_file())
        self.assertTrue((self.root / ".memory/tasks/login-module/handoff.md").is_file())
        self.assertEqual(
            (self.root / ".memory/.active_memory").read_text(encoding="utf-8").strip(),
            "login-module",
        )
        task_memory = (self.root / ".memory/tasks/login-module/memory.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("- Status: `active`", task_memory)
        self.assertIn("- Task source: `docs/planning/specs/login.md`", task_memory)

    def test_initialize_is_idempotent_and_does_not_overwrite_content(self) -> None:
        self.store().initialize_task(self.root, "Login Module", "conversation")
        memory = self.root / ".memory/tasks/login-module/memory.md"
        memory.write_text("manual content\n", encoding="utf-8")

        self.store().initialize_task(self.root, "Login Module", "new-source")

        self.assertEqual(memory.read_text(encoding="utf-8"), "manual content\n")

    def test_unicode_topic_gets_stable_hashed_slug(self) -> None:
        store = self.store()
        self.assertEqual(store.slugify("登录模块"), store.slugify("登录模块"))
        self.assertRegex(store.slugify("登录模块"), r"^memory-[0-9a-f]{8}$")

    def test_legacy_task_moves_under_tasks_and_preserves_content(self) -> None:
        legacy = self.root / ".memory/login-module"
        legacy.mkdir(parents=True)
        (legacy / "memory.md").write_text("legacy memory", encoding="utf-8")
        (legacy / "findings.md").write_text("legacy findings", encoding="utf-8")
        (legacy / "handoff.md").write_text("legacy handoff", encoding="utf-8")

        moved = self.store().migrate_legacy_tasks(self.root)

        target = self.root / ".memory/tasks/login-module"
        self.assertEqual(moved, [(legacy.resolve(), target.resolve())])
        self.assertFalse(legacy.exists())
        self.assertEqual((target / "findings.md").read_text(encoding="utf-8"), "legacy findings")

    def test_initializing_migrated_legacy_task_adds_status_without_losing_content(self) -> None:
        legacy = self.root / ".memory/login-module"
        legacy.mkdir(parents=True)
        (legacy / "memory.md").write_text("legacy decision marker\n", encoding="utf-8")
        (legacy / "handoff.md").write_text("legacy handoff marker\n", encoding="utf-8")

        paths = self.store().initialize_task(
            self.root, "Login Module", "docs/planning/plans/login.md"
        )

        content = paths.task_memory.read_text(encoding="utf-8")
        self.assertIn("legacy decision marker", content)
        self.assertIn("- Status: `active`", content)
        self.assertEqual(self.store().resolve_active_task(self.root), paths)

    def test_existing_new_task_is_never_overwritten_by_legacy_task(self) -> None:
        legacy = self.root / ".memory/login-module"
        legacy.mkdir(parents=True)
        for name in ("memory.md", "handoff.md"):
            (legacy / name).write_text("legacy", encoding="utf-8")
        target = self.root / ".memory/tasks/login-module"
        target.mkdir(parents=True)
        (target / "memory.md").write_text("new", encoding="utf-8")

        self.assertEqual(self.store().migrate_legacy_tasks(self.root), [])
        self.assertTrue(legacy.is_dir())
        self.assertEqual((target / "memory.md").read_text(encoding="utf-8"), "new")

    def test_completed_task_is_not_resolved_as_active(self) -> None:
        store = self.store()
        paths = store.initialize_task(self.root, "Login Module", "conversation")
        store.complete_task(self.root)

        self.assertIsNone(store.resolve_active_task(self.root))
        self.assertIn("- Status: `completed`", paths.task_memory.read_text(encoding="utf-8"))

    def test_complete_marks_status_and_clears_matching_pointer(self) -> None:
        store = self.store()
        paths = store.initialize_task(self.root, "Login Module", "conversation")

        completed = store.complete_task(self.root)

        self.assertEqual(completed.slug, "login-module")
        self.assertFalse((self.root / ".memory/.active_memory").exists())
        self.assertIn("- Status: `completed`", paths.task_memory.read_text(encoding="utf-8"))
        self.assertTrue(paths.task_dir.is_dir())

    def test_complete_does_not_clear_a_different_active_pointer(self) -> None:
        store = self.store()
        first = store.initialize_task(self.root, "First Task", "conversation")
        store.initialize_task(self.root, "Second Task", "conversation")

        store.complete_task(self.root, first.slug)

        self.assertEqual(
            (self.root / ".memory/.active_memory").read_text(encoding="utf-8").strip(),
            "second-task",
        )

    def test_disabled_environment_rejects_write_operations(self) -> None:
        store = self.store()
        old_value = os.environ.get("MEMORY_WITH_FILES_DISABLED")
        self.addCleanup(
            lambda: os.environ.pop("MEMORY_WITH_FILES_DISABLED", None)
            if old_value is None
            else os.environ.__setitem__("MEMORY_WITH_FILES_DISABLED", old_value)
        )
        os.environ["MEMORY_WITH_FILES_DISABLED"] = "1"

        with self.assertRaisesRegex(RuntimeError, "disabled"):
            store.initialize_task(self.root, "Login Module", "conversation")
        self.assertFalse((self.root / ".memory").exists())


if __name__ == "__main__":
    unittest.main()
