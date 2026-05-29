## When to use this reference

Use this reference whenever the user wants to:

- Add or debug permissions, push notifications, background modes, deep links, Universal Links, widgets, App Intents, share extensions, or associated domains.
- Improve accessibility, privacy, localization, or platform integration.
- Work with camera, photo library, location, contacts, calendars, Bluetooth, HealthKit, StoreKit, or Sign in with Apple.

## Permission workflow

1. Add the required `Info.plist` usage description.
2. Check current authorization status before requesting.
3. Request authorization at the moment of user intent.
4. Handle denied, restricted, limited, provisional, and unavailable states.
5. Provide a settings path when permission is denied and the feature cannot continue.
6. Verify on a real device for hardware-sensitive capabilities.

## Push notifications

- Configure Push Notifications capability and App ID in the developer portal.
- Request notification authorization with clear product timing.
- Register for remote notifications only after authorization flow decisions are clear.
- Keep APNs environment, bundle ID, entitlements, and server token/certificate setup aligned.
- Test foreground, background, terminated, and tapped-notification paths.

## Background work

- Use Background Modes only for legitimate supported cases.
- For scheduled work, prefer `BGTaskScheduler` where appropriate.
- Keep background tasks short, cancellable, and resilient.
- Test on device; simulator behavior is limited.

## Deep links and Universal Links

- URL schemes are app-local and configured in Info.plist.
- Universal Links require Associated Domains entitlement and a valid `apple-app-site-association` file.
- Parse links into route/domain commands rather than directly manipulating UI from the app delegate.
- Test cold start, warm start, and already-open app paths.

## Widgets and App Intents

- Share data through App Groups when the extension and app need common storage.
- Keep widget timelines lightweight and deterministic.
- Avoid relying on app-only runtime state inside extensions.
- App Intents should have clear parameters, validation, and user-facing summaries.

## Accessibility and localization

- Support VoiceOver labels, hints, traits, and focus order for custom controls.
- Support Dynamic Type unless the app has a strongly justified exception.
- Keep color contrast usable in light and dark modes.
- Avoid concatenated localized strings; use format strings and pluralization where needed.

## Privacy

- Collect the minimum data needed.
- Keep permission prompts tied to user intent.
- Avoid logging PII, tokens, location, health, or contact data.
- Check App Store privacy nutrition labels and privacy manifests for SDK-related changes.

## Verification

- Test permission flows from fresh install, denied state, limited state where applicable, and settings changes.
- Test capabilities on a real device when hardware, APNs, background execution, associated domains, Keychain, or entitlements are involved.
