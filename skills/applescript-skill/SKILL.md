---
name: applescript
description: Build, review, and run macOS AppleScript or JavaScript for Automation (JXA) safely. Use for osascript workflows, Finder/System Events/App automation, scripting dictionaries, UI automation, shell-command bridging, and hardened AppleScript execution with input validation, blocked operations, timeouts, and auditability.
---

# AppleScript

Use this skill when the user needs macOS automation through AppleScript, JXA, `osascript`, `osacompile`, `sdef`, Finder, System Events, or scriptable application dictionaries.

## Safety Rules

AppleScript can control apps, read files, invoke shell commands, and request elevated privileges. Treat generated or executed scripts as high-risk automation.

- Prefer deterministic templates with validated parameters over executing user-provided script text.
- Never use `with administrator privileges` unless the user explicitly requests it and the surrounding task truly requires escalation.
- Do not automate password managers, Keychain Access, financial apps, security settings, or destructive system preferences.
- Avoid `do shell script`; when it is necessary, allowlist the command and quote every user-controlled argument with AppleScript `quoted form of`.
- Block obvious destructive or exfiltration patterns: `sudo`, `rm -rf`, `curl | sh`, `wget | sh`, writes into `/etc`, credential scraping, and network upload commands.
- Use timeouts for every execution path. Prefer a short default such as 10-30 seconds.
- Log or report what app/script action will run before execution when the action affects files, app state, system settings, messages, email, browser tabs, or external services.

For threat modeling and concrete blocked patterns, read [references/security.md](references/security.md).

## Workflow

1. Identify the target app and whether it is scriptable. Use `sdef /Applications/App.app` or the app's Script Editor dictionary when needed.
2. Choose AppleScript for classic app automation and System Events UI scripting; choose JXA when JavaScript data handling or Objective-C bridge access makes the script clearer.
3. Build a minimal script that performs one task. Batch related operations in one `tell` block when possible.
4. Validate inputs before interpolation. Escape AppleScript strings and use `quoted form of` for shell arguments.
5. Execute through `osascript` with captured stdout/stderr and timeout handling.
6. Verify the result with a harmless read-back action when possible.

## Execution

Use direct commands for one-off safe local checks:

```bash
osascript -e 'return "hello"'
osascript -e 'tell application "Finder" to get name of startup disk'
osascript -l JavaScript -e 'Application("Finder").name()'
```

For repeated or user-facing automation, prefer the bundled runner:

```bash
python3 scripts/run_osascript.py --timeout 10 --script 'return "hello"'
python3 scripts/run_osascript.py --language JavaScript --script 'Application("Finder").name()'
```

Read [references/execution-patterns.md](references/execution-patterns.md) when adding AppleScript support to an app, CLI, test suite, or agent tool.

## Script Patterns

AppleScript:

```applescript
tell application "Finder"
    set selectedItems to selection as alias list
    return selectedItems
end tell
```

JXA:

```javascript
const finder = Application("Finder");
finder.activate();
finder.name();
```

System Events UI scripting:

```applescript
tell application "System Events"
    tell process "Safari"
        click menu item "New Window" of menu "File" of menu bar 1
    end tell
end tell
```

For Finder, browser, clipboard, window, and app examples, read [references/automation-recipes.md](references/automation-recipes.md).

## Implementation Guidance

- Write tests for blocked patterns, timeout behavior, and expected stdout/stderr handling before wiring automation into product code.
- Use `subprocess.run([...], shell=False, capture_output=True, text=True, timeout=...)` from Python.
- Keep script source in templates or `.applescript` files; compile stable scripts with `osacompile` only when reuse or startup time matters.
- Return only the data needed; filter inside the script instead of dumping all process/window properties.
- Minimize app activation. Prefer direct app dictionaries or background System Events interactions where practical.
- Surface macOS permission failures clearly. UI scripting may require Accessibility permission for the controlling process, and app automation may require Automation permission.

## References

- [references/security.md](references/security.md): threat model, blocked operations, injection examples.
- [references/execution-patterns.md](references/execution-patterns.md): Python/JXA runners, timeouts, templates, tests.
- [references/automation-recipes.md](references/automation-recipes.md): practical AppleScript and JXA examples.
