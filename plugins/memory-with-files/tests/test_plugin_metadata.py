from __future__ import annotations

import json
import unittest
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PLUGIN_ROOT.parents[1]


class MemoryPluginMetadataTests(unittest.TestCase):
    def test_has_matching_codex_and_claude_manifests(self) -> None:
        codex = json.loads(
            (PLUGIN_ROOT / ".codex-plugin/plugin.json").read_text(encoding="utf-8")
        )
        claude = json.loads(
            (PLUGIN_ROOT / ".claude-plugin/plugin.json").read_text(encoding="utf-8")
        )
        self.assertEqual(codex["name"], "memory-with-files")
        self.assertEqual(claude["name"], "memory-with-files")
        self.assertRegex(codex["version"], r"^0\.2\.0(?:\+codex\.[a-z0-9-]+)?$")
        self.assertEqual(claude["version"], "0.2.0")
        self.assertEqual(codex["skills"], "./skills/")

    def test_claude_marketplace_exposes_memory_plugin(self) -> None:
        marketplace = json.loads(
            (REPO_ROOT / ".claude-plugin/marketplace.json").read_text(encoding="utf-8")
        )
        entries = {entry["name"]: entry for entry in marketplace["plugins"]}
        self.assertIn("memory-with-files", entries)
        self.assertEqual(
            entries["memory-with-files"]["source"], "./plugins/memory-with-files"
        )

    def test_readme_documents_new_layout_lifecycle_and_installation(self) -> None:
        readme = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
        for phrase in (
            ".memory/tasks/<slug>",
            "精简恢复摘要",
            "MEMORY_WITH_FILES_DISABLED=1",
            "codex plugin add memory-with-files@codex-agent-plugins",
            "/plugin install memory-with-files@claude-agent-plugins",
            "planning-workflows",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, readme)
        memory_section = readme.split("### memory-with-files", 1)[1].split(
            "### planning-workflows", 1
        )[0]
        self.assertNotIn("`Stop`", memory_section)


if __name__ == "__main__":
    unittest.main()
