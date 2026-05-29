## When to use this reference

Use this reference whenever the user wants to:

- Implement async/await, `Task`, task cancellation, `@MainActor`, actors, or Combine.
- Build networking with `URLSession`, REST APIs, `Codable`, auth headers, retries, pagination, uploads, or downloads.
- Fix UI update warnings, race conditions, duplicate requests, cancellation bugs, or networking error handling.

## How to use this reference

1. Keep UI-facing observable state on the main actor.
2. Separate endpoint construction, transport, decoding, and domain mapping.
3. Model expected failures with typed errors where useful.
4. Handle cancellation separately from user-visible failures.
5. Avoid doing network calls directly inside SwiftUI `body` or UIKit layout callbacks.

## Async ViewModel pattern

```swift
@MainActor
final class ProfileViewModel: ObservableObject {
    @Published private(set) var profile: Profile?
    @Published private(set) var isLoading = false
    @Published var alertMessage: String?

    private let api: ProfileAPI

    init(api: ProfileAPI = URLSessionProfileAPI()) {
        self.api = api
    }

    func loadProfile() async {
        isLoading = true
        defer { isLoading = false }

        do {
            profile = try await api.fetchProfile()
        } catch is CancellationError {
            return
        } catch {
            alertMessage = "Unable to load profile."
        }
    }
}
```

## URLSession service pattern

```swift
protocol ProfileAPI {
    func fetchProfile() async throws -> Profile
}

struct URLSessionProfileAPI: ProfileAPI {
    private let session: URLSession
    private let baseURL: URL

    init(session: URLSession = .shared, baseURL: URL = URL(string: "https://api.example.com")!) {
        self.session = session
        self.baseURL = baseURL
    }

    func fetchProfile() async throws -> Profile {
        var request = URLRequest(url: baseURL.appending(path: "profile"))
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.httpStatus(httpResponse.statusCode)
        }

        return try JSONDecoder.api.decode(Profile.self, from: data)
    }
}

enum APIError: Error {
    case invalidResponse
    case httpStatus(Int)
}
```

## Combine

- Use Combine when the project already uses publishers or when a stream model fits the feature.
- Bridge to async/await carefully; avoid mixing both styles in one flow without a clear boundary.
- Store cancellables on the owning object and release them with that lifecycle.
- Receive UI updates on the main queue/main actor.

## Cancellation and reentrancy

- Store tasks when the user can trigger repeated loads; cancel the previous task if only the latest result should win.
- Check `Task.isCancelled` or call `try Task.checkCancellation()` inside long-running work.
- Treat `CancellationError` as silent unless the product explicitly wants cancellation feedback.

## Decoding and dates

- Configure `JSONDecoder` date strategies in one shared factory/extension when APIs are consistent.
- Keep API DTOs separate from domain models when server fields are unstable or awkward.
- Avoid force-unwrapping URLs or decoded fields in production paths.

## Verification

- Test success, non-2xx response, invalid JSON, timeout/offline, cancellation, and auth failure.
- For UI flows, verify duplicate taps and leaving the screen during a request.
