# AppleScript Security

## Threat Model

AppleScript risk is high because it can control GUI apps, inspect user data, run shell commands, and request elevated privileges.

Protect:

- System integrity: avoid destructive commands and privileged changes.
- User data: avoid broad file reads, credential stores, browser profiles, chats, mail, and financial apps.
- Application state: avoid unexpected sends, deletes, purchases, posts, or preference changes.

## Blocked By Default

Block or require explicit user confirmation for scripts that contain:

- `with administrator privileges`
- `sudo`
- `rm -rf`, `rm -r /`, recursive deletes, or destructive wildcard deletes
- `curl ... | sh`, `wget ... | sh`, `bash <(...)`, downloaded code execution
- writes to `/etc`, `/System`, `/Library/LaunchDaemons`, shell startup files, or security-sensitive locations
- attempts to read Keychain, password managers, browser credential stores, SSH keys, tokens, or cookies
- automation of Keychain Access, 1Password, password managers, financial apps, or security settings
- keystroke automation involving passwords, two-factor codes, payment forms, or irreversible actions

Example detector:

```python
import re

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
        pattern for pattern in DANGEROUS_PATTERNS
        if re.search(pattern, script, re.IGNORECASE | re.DOTALL)
    ]
```

## Injection Prevention

Do not interpolate untrusted text directly into AppleScript source:

```applescript
-- Unsafe
set fileName to userInput
do shell script "cat " & fileName
```

Use `quoted form of` for shell arguments:

```applescript
set fileName to userInput
do shell script "cat " & quoted form of fileName
```

When generating AppleScript from another language, escape AppleScript string literals:

```python
def applescript_string(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'
```

Prefer structured templates:

```python
def activate_app_script(app_name: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9 ._+-]+", app_name):
        raise ValueError("Invalid app name")
    return f'tell application {applescript_string(app_name)} to activate'
```

## Shell Command Policy

If `do shell script` is needed:

- Use a command allowlist.
- Reject shell metacharacters in command names.
- Quote arguments with `quoted form of`.
- Avoid network commands unless the task explicitly needs them.
- Never pipe downloaded content into a shell.

Example allowlist:

```python
ALLOWED_SHELL_COMMANDS = {
    "pwd": {"max_args": 0},
    "date": {"max_args": 5},
    "whoami": {"max_args": 0},
    "ls": {"max_args": 5, "blocked_flags": ["-R"]},
    "cat": {"max_args": 1},
    "open": {"max_args": 3},
}
```

## Permissions

macOS may prompt for:

- Automation permission when one app controls another.
- Accessibility permission for UI scripting through System Events.
- Screen Recording permission for some window or screen inspection workflows.

Do not try to bypass these prompts. Explain the required permission and let the user grant it manually.
