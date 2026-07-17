from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
AUDITOR = SKILL_ROOT / "scripts" / "audit_marketplace.py"


class AuditMarketplaceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def write_json(self, relative_path: str, payload: object) -> Path:
        path = self.repo / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        return path

    def create_plugin(self, name: str = "demo-plugin") -> None:
        self.write_json(
            f"plugins/{name}/.codex-plugin/plugin.json",
            {
                "name": name,
                "version": "0.1.0",
                "description": "Demo plugin",
                "author": {"name": "Local developer"},
                "interface": {
                    "displayName": "Demo Plugin",
                    "shortDescription": "Demo plugin for tests.",
                    "longDescription": "A complete plugin used by marketplace audit tests.",
                    "developerName": "Local developer",
                    "category": "Productivity",
                    "capabilities": [],
                    "defaultPrompt": "Use the demo plugin.",
                },
            },
        )

    def create_marketplace(self, source: object | None = None) -> None:
        self.write_json(
            ".agents/plugins/marketplace.json",
            {
                "name": "demo-marketplace",
                "interface": {"displayName": "Demo Marketplace"},
                "plugins": [
                    {
                        "name": "demo-plugin",
                        "source": source
                        or {
                            "source": "local",
                            "path": "./plugins/demo-plugin",
                        },
                        "policy": {
                            "installation": "AVAILABLE",
                            "authentication": "ON_INSTALL",
                        },
                        "category": "Productivity",
                    }
                ],
            },
        )

    def run_audit(self) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["python3", str(AUDITOR), str(self.repo)],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_accepts_complete_repository_marketplace(self) -> None:
        self.create_plugin()
        self.create_marketplace()

        result = self.run_audit()

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("1 plugin(s)", result.stdout)

    def test_rejects_git_url_inside_plugin_source(self) -> None:
        self.create_plugin()
        self.create_marketplace(
            {"source": "git", "url": "https://github.com/owner/repo.git"}
        )

        result = self.run_audit()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Git belongs to marketplace registration", result.stderr)

    def test_rejects_manifest_name_that_differs_from_entry(self) -> None:
        self.create_plugin()
        manifest_path = (
            self.repo / "plugins/demo-plugin/.codex-plugin/plugin.json"
        )
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["name"] = "other-plugin"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        self.create_marketplace()

        result = self.run_audit()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("does not match marketplace entry", result.stderr)

    def test_rejects_hook_command_without_plugin_root(self) -> None:
        self.create_plugin()
        self.create_marketplace()
        self.write_json(
            "plugins/demo-plugin/hooks/hooks.json",
            {
                "hooks": {
                    "SessionStart": [
                        {
                            "matcher": "startup",
                            "hooks": [
                                {
                                    "type": "command",
                                    "command": "python3 hooks/start.py",
                                }
                            ],
                        }
                    ]
                }
            },
        )

        result = self.run_audit()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("PLUGIN_ROOT", result.stderr)

    def test_accepts_hook_command_that_does_not_reference_plugin_files(self) -> None:
        self.create_plugin()
        self.create_marketplace()
        self.write_json(
            "plugins/demo-plugin/hooks/hooks.json",
            {
                "hooks": {
                    "Stop": [
                        {
                            "matcher": "*",
                            "hooks": [
                                {
                                    "type": "command",
                                    "command": "agent-notify codex-stop",
                                }
                            ],
                        }
                    ]
                }
            },
        )

        result = self.run_audit()

        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
