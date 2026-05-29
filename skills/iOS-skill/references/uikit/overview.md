## When to use this reference

Use this reference whenever the user wants to:

- Build or maintain UIKit screens, view controllers, table views, collection views, navigation flows, or storyboards.
- Fix Auto Layout, safe area, cell reuse, lifecycle, delegate, or memory issues.
- Embed SwiftUI in UIKit or UIKit in SwiftUI.
- Keep older iOS apps consistent without rewriting them into SwiftUI.

## How to use this reference

1. Identify whether the project uses storyboards/xibs, programmatic UIKit, coordinators, MVC, MVVM, VIPER, or another pattern.
2. Follow existing layout and navigation conventions.
3. Keep view controller responsibilities bounded: UI wiring and lifecycle in the controller, business logic in services/ViewModels.
4. Check memory ownership for closures, delegates, timers, notifications, and async tasks.

## Core patterns

### View controller with async loading

```swift
final class ItemsViewController: UIViewController {
    private let viewModel: ItemsViewModel
    private var loadTask: Task<Void, Never>?

    init(viewModel: ItemsViewModel = ItemsViewModel()) {
        self.viewModel = viewModel
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Items"
        configureViews()
        loadTask = Task { [weak self] in
            await self?.viewModel.load()
            await self?.reloadUI()
        }
    }

    deinit {
        loadTask?.cancel()
    }

    @MainActor
    private func reloadUI() {
        // Update table/collection view snapshots here.
    }
}
```

### Pushing detail screens

```swift
let detailViewController = DetailViewController(item: selectedItem)
navigationController?.pushViewController(detailViewController, animated: true)
```

## Auto Layout checklist

- Set `translatesAutoresizingMaskIntoConstraints = false` for programmatic views.
- Pin to `view.safeAreaLayoutGuide` unless full-bleed content is intended.
- Avoid ambiguous constraints and conflicting priorities.
- Use stack views for simple vertical/horizontal composition.
- Account for dynamic type and long localized strings.

## Table and collection views

- Reset reused cell state in `prepareForReuse`.
- Move image loading/cancellation into a well-owned layer.
- Prefer diffable data source when the project already uses it or the list has frequent incremental updates.
- Keep data source snapshots derived from state, not manually patched in multiple places.

## Lifecycle and memory

- Use `[weak self]` in escaping closures owned by long-lived services, timers, notification callbacks, or async tasks.
- Remove observers if using APIs that do not auto-remove.
- Cancel work in `deinit`, `viewWillDisappear`, or task-specific lifecycle points when appropriate.
- Avoid retaining view controllers from coordinators, delegates, or closures by accident.

## SwiftUI interoperability

- Embed SwiftUI with `UIHostingController(rootView:)`.
- Pass dependencies explicitly rather than reaching through global state.
- Use representable wrappers for UIKit controls that SwiftUI does not provide.

## Verification

- Run affected flows in simulator.
- Check rotation or size class changes if layout is adaptive.
- Use the memory graph or Instruments when fixing suspected leaks.
