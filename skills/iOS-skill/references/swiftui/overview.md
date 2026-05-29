## When to use this reference

Use this reference whenever the user wants to:

- Build or modify SwiftUI screens, components, lists, forms, sheets, alerts, toolbars, or navigation.
- Decide between `@State`, `@Binding`, `@StateObject`, `@ObservedObject`, `@EnvironmentObject`, `@Observable`, and `@Environment`.
- Connect SwiftUI views to async loading, ViewModels, previews, UIKit wrappers, or platform services.
- Fix layout issues involving safe areas, dynamic type, dark mode, accessibility, or adaptive size classes.

## How to use this reference

1. Identify the minimum iOS version and current state model before choosing modern APIs.
2. Follow the app's existing architecture. If the app already uses MVVM, keep view logic in the View and side effects in the ViewModel/service layer.
3. Keep SwiftUI `body` declarative and side-effect free. Use `.task`, `.onChange`, commands, ViewModel methods, or injected services for work.
4. Provide previews with deterministic sample data when changing reusable views.

## Core patterns

### Basic screen with navigation and loading

```swift
struct ItemsView: View {
    @StateObject private var viewModel = ItemsViewModel()

    var body: some View {
        NavigationStack {
            List(viewModel.items) { item in
                NavigationLink(value: item) {
                    ItemRow(item: item)
                }
            }
            .navigationTitle("Items")
            .navigationDestination(for: Item.self) { item in
                ItemDetailView(item: item)
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
            .task {
                await viewModel.load()
            }
        }
    }
}
```

### MainActor ViewModel

```swift
@MainActor
final class ItemsViewModel: ObservableObject {
    @Published private(set) var items: [Item] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let service: ItemService

    init(service: ItemService = URLSessionItemService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            items = try await service.fetchItems()
        } catch is CancellationError {
            return
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

## State selection

- Use `@State` for view-local value state owned by the view.
- Use `@Binding` when a child view edits state owned by a parent.
- Use `@StateObject` when a view creates and owns an `ObservableObject`.
- Use `@ObservedObject` when ownership lives outside the view.
- Use `@EnvironmentObject` sparingly for app-wide objects already injected high in the hierarchy.
- Use `@Environment` for system values or custom dependencies that should flow through the view tree.
- Use `@Observable` when the project targets modern Swift/OS versions and already uses Observation.

## Navigation

- Prefer `NavigationStack` for modern SwiftUI navigation.
- Use `NavigationSplitView` for iPad/macOS-style master-detail interfaces.
- Model navigation with values when routes map cleanly to domain objects or route enums.
- Avoid hidden `NavigationLink` workarounds unless supporting old deployment targets.

## Layout and accessibility checklist

- Respect safe areas and keyboard avoidance.
- Test dynamic type with long localized strings.
- Provide `accessibilityLabel`, `accessibilityHint`, and traits for custom controls.
- Keep tappable targets near or above 44x44 pt.
- Check light/dark mode contrast.
- Avoid fixed heights unless the design truly requires them.

## UIKit interoperability

- Wrap UIKit controls with `UIViewRepresentable` or `UIViewControllerRepresentable`.
- Keep coordinator objects small and focused on delegate bridging.
- If embedding SwiftUI in UIKit, use `UIHostingController` and keep ownership/lifecycle clear.

## Verification

- Build previews after changing reusable views.
- Run the app on at least one simulator size relevant to the UI.
- For async screens, verify loading, success, empty, error, and cancellation paths.
