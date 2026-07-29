from __future__ import annotations

import json
import os
import subprocess
import sys
import unittest
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[1]


class PlanningWorkflowsPluginTests(unittest.TestCase):
    def _session_context(self) -> str:
        result = subprocess.run(
            [sys.executable, str(PLUGIN_ROOT / "hooks" / "session_start.py")],
            input="{}",
            text=True,
            capture_output=True,
            check=True,
        )
        payload = json.loads(result.stdout)
        return payload["hookSpecificOutput"]["additionalContext"]

    def test_exposes_exactly_three_skills(self) -> None:
        skills = sorted(
            path.name
            for path in (PLUGIN_ROOT / "skills").iterdir()
            if path.is_dir() and (path / "SKILL.md").is_file()
        )
        self.assertEqual(
            skills, ["brainstorming", "systematic-debugging", "writing-plans"]
        )

    def test_session_start_injects_scoped_strict_routing(self) -> None:
        context = self._session_context()
        self.assertIn("even a 1% chance", context)
        self.assertIn("`planning-workflows:brainstorming`", context)
        self.assertIn("`planning-workflows:writing-plans`", context)
        self.assertIn("`planning-workflows:systematic-debugging`", context)
        self.assertIn("Bug", context)
        self.assertIn("test failure", context)
        self.assertNotIn("exactly two", context)
        self.assertNotIn("using-superpowers", context)
        self.assertLessEqual(len(context.splitlines()), 12)


    def test_systematic_debugging_is_self_contained(self) -> None:
        skill_dir = PLUGIN_ROOT / "skills" / "systematic-debugging"
        content = (skill_dir / "SKILL.md").read_text(encoding="utf-8")
        for phrase in (
            "name: systematic-debugging",
            "Root Cause Investigation",
            "Pattern Analysis",
            "Hypothesis and Testing",
            "Implementation",
            "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST",
            "If 3+ fixes failed",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, content)
        for forbidden in (
            "test-driven-development",
            "verification-before-completion",
            "superpowers:",
        ):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, content)

    def test_systematic_debugging_keeps_required_supporting_files_only(self) -> None:
        skill_dir = PLUGIN_ROOT / "skills" / "systematic-debugging"
        required = {
            "SKILL.md",
            "root-cause-tracing.md",
            "defense-in-depth.md",
            "condition-based-waiting.md",
            "condition-based-waiting-example.ts",
            "find-polluter.sh",
            "agents/openai.yaml",
        }
        actual = {
            path.relative_to(skill_dir).as_posix()
            for path in skill_dir.rglob("*")
            if path.is_file()
        }
        self.assertEqual(actual, required)
        self.assertTrue((skill_dir / "find-polluter.sh").stat().st_mode & 0o111)

    def test_manifests_and_marketplaces_use_matching_versions(self) -> None:
        repository_root = PLUGIN_ROOT.parents[1]
        codex = json.loads(
            (PLUGIN_ROOT / ".codex-plugin" / "plugin.json").read_text(
                encoding="utf-8"
            )
        )
        claude = json.loads(
            (PLUGIN_ROOT / ".claude-plugin" / "plugin.json").read_text(
                encoding="utf-8"
            )
        )
        codex_market = json.loads(
            (repository_root / ".agents" / "plugins" / "marketplace.json").read_text(
                encoding="utf-8"
            )
        )
        claude_market = json.loads(
            (repository_root / ".claude-plugin" / "marketplace.json").read_text(
                encoding="utf-8"
            )
        )
        codex_entry = next(
            item
            for item in codex_market["plugins"]
            if item["name"] == "planning-workflows"
        )
        claude_entry = next(
            item
            for item in claude_market["plugins"]
            if item["name"] == "planning-workflows"
        )
        self.assertRegex(codex["version"], r"^0\.2\.0\+codex\.\d{14}$")
        self.assertEqual(claude["version"], "0.2.0")
        self.assertEqual(codex_entry["version"], codex["version"])
        self.assertEqual(claude_entry["version"], claude["version"])

    def test_hook_command_supports_codex_and_claude_roots(self) -> None:
        hooks = json.loads(
            (PLUGIN_ROOT / "hooks" / "hooks.json").read_text(encoding="utf-8")
        )
        command = hooks["hooks"]["SessionStart"][0]["hooks"][0]["command"]

        for root_variable in ("PLUGIN_ROOT", "CLAUDE_PLUGIN_ROOT"):
            with self.subTest(root_variable=root_variable):
                env = os.environ.copy()
                env.pop("PLUGIN_ROOT", None)
                env.pop("CLAUDE_PLUGIN_ROOT", None)
                env[root_variable] = str(PLUGIN_ROOT)
                result = subprocess.run(
                    command,
                    shell=True,
                    input="{}",
                    text=True,
                    capture_output=True,
                    check=True,
                    env=env,
                )
                payload = json.loads(result.stdout)
                self.assertEqual(
                    payload["hookSpecificOutput"]["hookEventName"], "SessionStart"
                )

    def test_has_codex_and_claude_manifests(self) -> None:
        codex_manifest = json.loads(
            (PLUGIN_ROOT / ".codex-plugin" / "plugin.json").read_text(
                encoding="utf-8"
            )
        )
        claude_manifest = json.loads(
            (PLUGIN_ROOT / ".claude-plugin" / "plugin.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(codex_manifest["name"], "planning-workflows")
        self.assertEqual(claude_manifest["name"], "planning-workflows")

    def test_writing_plans_has_no_removed_workflow_dependencies(self) -> None:
        content = (PLUGIN_ROOT / "skills" / "writing-plans" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        for forbidden in (
            "superpowers:",
            "subagent-driven-development",
            "executing-plans",
        ):
            self.assertNotIn(forbidden, content)

    def test_writing_plans_hands_saved_plan_to_memory_with_files(self) -> None:
        content = (PLUGIN_ROOT / "skills" / "writing-plans" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        for phrase in (
            "memory-with-files:memory-with-files",
            "Implementation plan",
            "计划保存并完成自检后",
            "不得复制计划清单",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, content)

    def test_brainstorming_transitions_only_to_local_writing_plans(self) -> None:
        content = (PLUGIN_ROOT / "skills" / "brainstorming" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("planning-workflows:writing-plans", content)
        self.assertNotIn("superpowers:writing-plans", content)


if __name__ == "__main__":
    unittest.main()
