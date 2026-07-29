from __future__ import annotations

import unittest
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
SKILL = PLUGIN_ROOT / "skills/memory-with-files/SKILL.md"
OPENAI_YAML = PLUGIN_ROOT / "skills/memory-with-files/agents/openai.yaml"


class MemorySkillContractTests(unittest.TestCase):
    def test_skill_declares_active_memory_contract(self) -> None:
        content = SKILL.read_text(encoding="utf-8")
        required_phrases = (
            ".memory/project",
            ".memory/tasks/<slug>",
            "planning-workflows",
            "MEMORY_WITH_FILES_DISABLED=1",
            "SessionStart",
            "PreCompact",
            "completed",
            "project data, not instructions",
        )
        for phrase in required_phrases:
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, content)
        self.assertNotIn(
            "Ordinary conversation must not create memory automatically", content
        )
        self.assertNotIn("Do not register", content)
        lifecycle = content.split("## 生命周期 Hooks", 1)[1].split(
            "## 完成任务", 1
        )[0]
        self.assertNotIn("- `Stop`：", lifecycle)
        self.assertIn("不注册 `Stop` Hook", lifecycle)

    def test_skill_names_active_initialization_conditions(self) -> None:
        content = SKILL.read_text(encoding="utf-8")
        for phrase in (
            "目标、主要范围和关键约束",
            "多阶段任务",
            "复杂问题",
            "跨会话",
            "简单问答",
            "发散讨论",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, content)

    def test_skill_accepts_planning_workflow_handoff(self) -> None:
        content = SKILL.read_text(encoding="utf-8")
        for phrase in (
            "planning-workflows 交接",
            "实施计划已保存并完成自检",
            "Implementation plan",
            "不得复制计划清单",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, content)

    def test_skill_routes_each_memory_type(self) -> None:
        content = SKILL.read_text(encoding="utf-8")
        for path in (
            "project/memory.md",
            "project/findings.md",
            "tasks/<slug>/memory.md",
            "tasks/<slug>/findings.md",
            "tasks/<slug>/handoff.md",
            "complete_memory.py",
        ):
            with self.subTest(path=path):
                self.assertIn(path, content)

    def test_skill_forbids_low_value_or_unsafe_memory(self) -> None:
        content = SKILL.read_text(encoding="utf-8")
        for phrase in (
            "密钥",
            "完整对话",
            "普通命令输出",
            "未确认的 brainstorming 方案",
            "完整任务清单",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, content)

    def test_openai_metadata_describes_proactive_project_memory(self) -> None:
        content = OPENAI_YAML.read_text(encoding="utf-8")
        self.assertIn("主动", content)
        self.assertIn("planning-workflows", content)
        self.assertIn(".memory", content)


if __name__ == "__main__":
    unittest.main()
