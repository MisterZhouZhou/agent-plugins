## When to use this reference

Use this reference whenever the user wants to:

- Store app data with SwiftData, Core Data, UserDefaults, Keychain, files, SQLite wrappers, or caches.
- Add migrations, model changes, seed data, import/export, offline support, or local search.
- Decide which persistence mechanism is appropriate for a feature.

## Storage selection

- Use `UserDefaults` for small, non-sensitive preferences and feature flags.
- Use Keychain for credentials, tokens, and sensitive small values.
- Use SwiftData for modern SwiftUI-first object persistence when deployment targets support it.
- Use Core Data for established apps, complex object graphs, migrations, background contexts, or broad OS support.
- Use files for documents, images, blobs, and export/import flows.
- Use URLCache or a dedicated cache for repeatable network responses.

## SwiftData pattern

```swift
@Model
final class Note {
    var title: String
    var createdAt: Date

    init(title: String, createdAt: Date = .now) {
        self.title = title
        self.createdAt = createdAt
    }
}

struct NotesView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Note.createdAt, order: .reverse) private var notes: [Note]

    var body: some View {
        List(notes) { note in
            Text(note.title)
        }
        .toolbar {
            Button("Add") {
                modelContext.insert(Note(title: "New Note"))
            }
        }
    }
}
```

## Core Data pattern

- Keep the persistent container setup centralized.
- Use background contexts for heavy imports or sync.
- Merge changes back to the view context intentionally.
- Treat model changes as migrations; do not casually edit entity names or delete attributes in shipped apps.
- Keep generated managed object subclasses consistent with project style.

## UserDefaults

```swift
struct SettingsStore {
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var hasCompletedOnboarding: Bool {
        get { defaults.bool(forKey: "hasCompletedOnboarding") }
        set { defaults.set(newValue, forKey: "hasCompletedOnboarding") }
    }
}
```

## Keychain

- Use a well-tested wrapper or existing project helper if present.
- Set accessibility level intentionally, for example after first unlock or when unlocked.
- Never log secrets.
- Plan token deletion on logout and account removal.

## Migration checklist

- Identify whether data has shipped to users.
- Add lightweight migration where possible; create explicit mapping when needed.
- Test migration from the last released schema, not only from the current development schema.
- Back up or recover gracefully when migration fails.

## Verification

- Test fresh install, upgrade, logout/delete account, offline launch, and corrupted/missing data paths.
- For SwiftData/Core Data, test writes, reads, deletes, and schema changes on simulator and ideally a real device.
