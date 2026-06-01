# Execution Patterns

## Python Runner

Use `shell=False`, pass script source as an argument, capture output, and enforce a timeout:

```python
import subprocess

def run_applescript(script: str, timeout: int = 10) -> tuple[str, str]:
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    return result.stdout.strip(), result.stderr.strip()
```

JXA:

```python
def run_jxa(script: str, timeout: int = 10) -> tuple[str, str]:
    result = subprocess.run(
        ["osascript", "-l", "JavaScript", "-e", script],
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    return result.stdout.strip(), result.stderr.strip()
```

## Async Runner

```python
import asyncio

async def run_osascript_async(script: str, timeout: int = 10) -> tuple[str, str]:
    proc = await asyncio.create_subprocess_exec(
        "osascript", "-e", script,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    return stdout.decode().strip(), stderr.decode().strip()
```

## Template Builder

```python
import re

def applescript_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'

def tell_app(app_name: str, commands: list[str]) -> str:
    if not re.fullmatch(r"[A-Za-z0-9 ._+-]+", app_name):
        raise ValueError("Invalid application name")
    body = "\n    ".join(commands)
    return f"tell application {applescript_string(app_name)}\n    {body}\nend tell"
```

## Tests

Cover security and runtime behavior:

```python
import pytest

def test_simple_script_execution(runner):
    stdout, stderr = runner.run('return "hello"')
    assert stdout == "hello"
    assert stderr == ""

def test_blocks_privilege_escalation(runner):
    with pytest.raises(ValueError):
        runner.run('do shell script "id" with administrator privileges')

def test_timeout(runner):
    with pytest.raises(TimeoutError):
        runner.run("delay 10", timeout=1)
```

## Compiled Scripts

Compile stable scripts only when reuse matters:

```bash
osacompile -o build/my-script.scpt scripts/my-script.applescript
osascript build/my-script.scpt
```

Avoid compiling dynamically generated scripts because it can hide the reviewed source from later readers.

## Scripting Dictionary

Check whether an app exposes a dictionary:

```bash
sdef /Applications/Finder.app | head
sdef /Applications/Safari.app > safari.sdef
```

If `sdef` fails or returns no useful terms, use System Events UI scripting only when the user accepts the Accessibility permission requirement and the UI is stable enough.
