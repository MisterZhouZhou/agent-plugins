# UTS Language

UTS is a TypeScript-like strongly typed language that compiles to platform-native or platform-specific targets:

- Kotlin for Android
- Swift for iOS plugin implementations
- ArkTS for HarmonyOS
- JavaScript for Web and Mini Programs

## Variable declaration

```uts
let str: string = "hello"
const num: number = 42
let nullable: string | null = null
```

All variables must be initialized. Use `null` for absent values.

## Functions

```uts
function test(score: number): boolean {
  return score >= 60
}

function add(x: string, y: string): void {
  console.log(x + " " + y)
}
```

## Critical differences from TypeScript

### No undefined

```uts
// Wrong
let value: string | undefined

// Correct
let value: string | null = null
```

Use `== null` / `!= null`, not `undefined` checks.

### Boolean conditions are required

```uts
// Wrong
if (str) {}
if (arr.length) {}

// Correct
if (str != null) {}
if (arr.length > 0) {}
```

### Nominal typing

UTS is nominal rather than structurally typed. Types must match by name, not only by object shape. Avoid TypeScript-style duck typing.

### Avoid unhandled any

`any` is a platform-adapted type. Cast before use when the target type is known.

```uts
let value = raw as string
```

### Typed arrays

```uts
let ids: number[] = [1, 2, 3]
let names: string[] = ["a", "b"]
```

## Platform-specific code

Keep native imports inside matching conditional compilation blocks.

```uts
// #ifdef APP-ANDROID
import Build from 'android.os.Build'
console.log(Build.MODEL)
// #endif

// #ifdef APP-IOS
import { UIDevice } from 'UIKit'
// #endif

// #ifdef WEB
console.log("web only")
// #endif

// #ifdef MP-WEIXIN
console.log("wechat mini program only")
// #endif
```

## Native API calls

```uts
// #ifdef APP-ANDROID
import Build from 'android.os.Build'

function getAndroidModel(): string {
  return Build.MODEL
}
// #endif
```

## Code quality checklist

- Declare function parameter and return types.
- Initialize every variable.
- Use `null` instead of `undefined`.
- Write explicit boolean expressions.
- Keep platform-only imports guarded by conditional compilation.
- Cast values at boundaries where `any` or external API data enters typed code.
