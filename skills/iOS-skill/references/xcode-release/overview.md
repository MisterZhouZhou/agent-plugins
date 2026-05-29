## When to use this reference

Use this reference whenever the user wants to:

- Configure Xcode projects, schemes, targets, build settings, Swift Package Manager, CocoaPods, or project generation.
- Fix signing, provisioning, capabilities, entitlements, bundle identifiers, or Info.plist issues.
- Archive, upload to TestFlight, prepare App Store submission, or automate builds with `xcodebuild`.

## Project inspection

Check these files and settings first:

- `.xcodeproj` or `.xcworkspace`
- `Package.swift`
- `Podfile`
- `project.yml` or other generator config
- target deployment version
- bundle identifier
- signing team and provisioning profile
- `Info.plist`
- `.entitlements`
- build configurations and schemes

## Signing and capabilities

- Bundle ID must match the App Store Connect app and provisioning profile.
- Capabilities must match entitlements and Apple Developer portal settings.
- Push Notifications, Associated Domains, Background Modes, Keychain Sharing, App Groups, HealthKit, Sign in with Apple, and iCloud often require both Xcode and portal configuration.
- Automatic signing is usually fine for local development; CI and release builds may need explicit profiles.

## Info.plist and privacy

- Add usage descriptions before requesting protected resources such as camera, photo library, microphone, location, contacts, calendars, Bluetooth, health, motion, or local network.
- Keep display name, URL schemes, associated domains, supported orientations, background modes, and app transport security settings intentional.
- For modern App Store submissions, check required privacy manifests for SDKs and data collection declarations.

## Build and test commands

Prefer project-specific scripts when present. Otherwise use patterns like:

```bash
xcodebuild \
  -scheme AppName \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build
```

```bash
xcodebuild \
  -scheme AppName \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  test
```

For Swift packages:

```bash
swift test
```

## Archive and TestFlight

1. Increment build number before upload.
2. Select the release scheme and correct signing configuration.
3. Archive with Xcode Organizer or `xcodebuild archive`.
4. Validate and upload through Organizer, `xcodebuild -exportArchive`, or CI tooling.
5. Complete TestFlight export compliance, beta review details, and tester groups.

## Common failure areas

- Mismatched bundle ID, team, or provisioning profile.
- Capability enabled in code but missing from entitlements or portal.
- Missing privacy usage string.
- Framework embedded incorrectly.
- Build number not incremented.
- Simulator-only architecture in a release build.
- Inconsistent package resolution or stale derived data.

## Verification

- Run a clean build for the intended scheme.
- Test on a real device for signing, push, associated domains, camera, location, Keychain, and background behavior.
- For release work, verify archive validation before considering the task complete.
