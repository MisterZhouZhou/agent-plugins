from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
INIT_SCRIPT = PLUGIN_ROOT / "skills/memory-with-files/scripts/init_memory.py"
COMPLETE_SCRIPT = PLUGIN_ROOT / "skills/memory-with-files/scripts/complete_memory.py"


class MemoryCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def run_script(
        self, script: Path, *args: str, env: dict[str, str] | None = None
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(script), *args],
            text=True,
            capture_output=True,
            env=env,
        )

    def test_init_cli_creates_new_layout_and_prints_task_dir(self) -> None:
        result = self.run_script(
            INIT_SCRIPT,
            "Login Module",
            "--root",
            str(self.root),
            "--task-source",
            "docs/planning/specs/login.md",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        expected = self.root.resolve() / ".memory/tasks/login-module"
        self.assertEqual(Path(result.stdout.strip()), expected)
        self.assertTrue((expected / "memory.md").is_file())

    def test_init_cli_migrates_matching_legacy_task(self) -> None:
        legacy = self.root / ".memory/login-module"
        legacy.mkdir(parents=True)
        (legacy / "memory.md").write_text("legacy", encoding="utf-8")
        (legacy / "handoff.md").write_text("legacy", encoding="utf-8")
        result = self.run_script(
            INIT_SCRIPT, "Login Module", "--root", str(self.root)
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(legacy.exists())
        migrated = (self.root / ".memory/tasks/login-module/memory.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("legacy", migrated)
        self.assertIn("- Status: `active`", migrated)

    def test_init_cli_refuses_to_reactivate_completed_task(self) -> None:
        first = self.run_script(INIT_SCRIPT, "Login Module", "--root", str(self.root))
        self.assertEqual(first.returncode, 0, first.stderr)
        completed = self.run_script(COMPLETE_SCRIPT, "--root", str(self.root))
        self.assertEqual(completed.returncode, 0, completed.stderr)

        second = self.run_script(INIT_SCRIPT, "Login Module", "--root", str(self.root))
        self.assertEqual(second.returncode, 1)
        self.assertIn("completed", second.stderr)

    def test_complete_cli_uses_active_slug_when_omitted(self) -> None:
        self.run_script(INIT_SCRIPT, "Login Module", "--root", str(self.root))
        result = self.run_script(COMPLETE_SCRIPT, "--root", str(self.root))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(result.stdout.strip().endswith(".memory/tasks/login-module"))
        self.assertFalse((self.root / ".memory/.active_memory").exists())

    def test_complete_cli_keeps_completed_directory(self) -> None:
        self.run_script(INIT_SCRIPT, "Login Module", "--root", str(self.root))
        result = self.run_script(COMPLETE_SCRIPT, "--root", str(self.root))
        self.assertEqual(result.returncode, 0, result.stderr)
        task_dir = self.root / ".memory/tasks/login-module"
        self.assertTrue(task_dir.is_dir())
        self.assertIn(
            "- Status: `completed`",
            (task_dir / "memory.md").read_text(encoding="utf-8"),
        )

    def test_both_clis_refuse_writes_when_disabled(self) -> None:
        env = os.environ.copy()
        env["MEMORY_WITH_FILES_DISABLED"] = "1"
        initialized = self.run_script(
            INIT_SCRIPT, "Login Module", "--root", str(self.root), env=env
        )
        completed = self.run_script(
            COMPLETE_SCRIPT, "--root", str(self.root), "--slug", "login-module", env=env
        )
        self.assertEqual(initialized.returncode, 1)
        self.assertEqual(completed.returncode, 1)
        self.assertIn("memory-with-files:", initialized.stderr)
        self.assertIn("memory-with-files:", completed.stderr)
        self.assertFalse((self.root / ".memory").exists())


if __name__ == "__main__":
    unittest.main()
