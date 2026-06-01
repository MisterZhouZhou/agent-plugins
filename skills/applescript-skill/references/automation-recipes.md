# Automation Recipes

## Finder Selection

```applescript
tell application "Finder"
    set selectedItems to selection as alias list
    return selectedItems
end tell
```

JXA:

```javascript
Application("Finder").selection().map(item => item.url());
```

## Clipboard

```applescript
set the clipboard to "Copied from AppleScript"
return the clipboard
```

JXA:

```javascript
const app = Application.currentApplication();
app.includeStandardAdditions = true;
app.setTheClipboardTo("Copied from JXA");
app.theClipboard();
```

## Current App

```applescript
tell application "System Events"
    return name of first process whose frontmost is true
end tell
```

## Window Bounds

```applescript
tell application "System Events"
    tell process "Finder"
        set position of window 1 to {80, 80}
        set size of window 1 to {1200, 800}
    end tell
end tell
```

## Safari URL

```applescript
tell application "Safari"
    if (count of windows) is 0 then return ""
    return URL of current tab of front window
end tell
```

JXA:

```javascript
const safari = Application("Safari");
safari.windows.length ? safari.windows[0].currentTab.url() : "";
```

## Google Chrome URL

```applescript
tell application "Google Chrome"
    if (count of windows) is 0 then return ""
    return URL of active tab of front window
end tell
```

## Notes Search

```applescript
tell application "Notes"
    set matches to notes whose name contains "meeting"
    set noteNames to {}
    repeat with n in matches
        set end of noteNames to name of n
    end repeat
    return noteNames
end tell
```

## Mail Draft Only

Create drafts instead of sending messages automatically:

```applescript
tell application "Mail"
    set newMessage to make new outgoing message with properties {subject:"Subject", content:"Body", visible:true}
    tell newMessage
        make new to recipient at end of to recipients with properties {address:"person@example.com"}
    end tell
    activate
end tell
```

## Dialogs

```applescript
display dialog "Continue?" buttons {"Cancel", "OK"} default button "OK" cancel button "Cancel"
```

## File Paths

Convert POSIX paths explicitly:

```applescript
set posixPath to "/Users/example/Desktop/file.txt"
set macFile to POSIX file posixPath
tell application "Finder" to reveal macFile
```

## UI Scripting Notes

UI scripting is brittle. Prefer app dictionaries when available. When UI scripting is necessary:

- Bring the app to front only once.
- Check process and window existence before clicking.
- Use names, roles, and menu paths instead of coordinates.
- Expect failures after localization changes or app updates.
