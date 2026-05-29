## When to use this reference

Use this reference whenever the user wants to:

- Add or fix XCTest unit tests, async tests, ViewModel tests, service tests, UI tests, or CI commands.
- Make SwiftUI and UIKit code more testable.
- Verify networking, persistence, navigation, permissions, or release-sensitive behavior.

## Test selection

- Use unit tests for pure logic, ViewModels, serializers, networking services with mock transports, and persistence helpers.
- Use integration tests for Core Data/SwiftData stacks, key services, and multi-layer flows.
- Use XCUITest for critical user journeys, navigation, forms, login, purchase, and regression-prone UI.
- Use previews for fast visual iteration, but do not treat previews as a substitute for tests.

## Async XCTest pattern

```swift
func testLoadItemsPublishesItems() async throws {
    let api = MockItemAPI(result: .success([Item(id: "1", name: "First")]))
    let viewModel = await ItemsViewModel(api: api)

    await viewModel.load()

    let items = await viewModel.items
    XCTAssertEqual(items.map(\.name), ["First"])
}
```

## Mocking network services

- Depend on protocols or injected clients rather than hard-coded `URLSession.shared`.
- For URLSession-level tests, use a custom `URLProtocol` when the project already has that pattern.
- Assert request method, path, headers, body, status handling, decoding, and error mapping.

## SwiftUI and ViewModel testing

- Keep most logic in ViewModels, reducers, or services so it can be unit tested.
- Test loading, success, empty, error, cancellation, and retry states.
- Use accessibility identifiers for UI tests when text is not stable.

## XCUITest checklist

- Disable animations only if the project already does so for UI tests.
- Seed deterministic test data.
- Use stable accessibility identifiers.
- Avoid sleeps; wait for elements with expectations or timeouts.
- Cover key happy paths and at least one important failure path.

## CI considerations

- Use a fixed simulator destination.
- Keep scheme sharing enabled for CI.
- Cache package dependencies only when the CI setup already supports it safely.
- Record logs or result bundles when failures are hard to diagnose.

## Verification

- Run the narrowest relevant test first.
- Run broader suite or build when touching shared services, persistence, navigation, or project settings.
