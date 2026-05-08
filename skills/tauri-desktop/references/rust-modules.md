# Rust 桌面端项目目录结构规范

## 标准模块划分

### 1. commands/ - Tauri Commands
存放所有与前端交互的命令。

```rust
// commands/mod.rs
pub mod example;

pub use example::*;
```

```rust
// commands/example.rs
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[command]
pub async fn get_system_info() -> Result<Response, AppError> {
    let sys = sysinfo::System::new_all();
    Ok(Response {
        success: true,
        data: Some(serde_json::json!({
            "hostname": sys.host_name(),
            "os": sys.os_version(),
            "内核": sys.kernel_version(),
        })),
        error: None,
    })
}
```

### 2. models/ - 数据模型
定义应用中使用的所有数据结构。

```rust
// models/mod.rs
pub mod user;
pub mod config;
```

```rust
// models/user.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub created_at: i64,
}
```

### 3. modules/ - 业务逻辑
按功能域划分业务逻辑模块。

```rust
// modules/mod.rs
pub mod auth;
pub mod database;
```

### 4. utils/ - 工具函数
通用的辅助函数。

```rust
// utils/mod.rs
pub mod helpers;
pub mod crypto;
```

```rust
// utils/helpers.rs
use std::path::PathBuf;

pub fn get_app_data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("your-app-name")
}

pub fn ensure_dir_exists(path: &PathBuf) -> std::io::Result<()> {
    if !path.exists() {
        std::fs::create_dir_all(path)?;
    }
    Ok(())
}
```

### 5. error.rs - 统一错误处理

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Network error: {0}")]
    Request(#[from] reqwest::Error),

    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Internal error: {0}")]
    Internal(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

## 前端调用 Rust Commands

```typescript
// src/lib/tauri.ts
import { invoke } from "@tauri-apps/api/core";

interface Response<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function getSystemInfo() {
  const response = await invoke<Response>("get_system_info");
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}
```

## 事件系统

```rust
// Rust 端发送事件
app.emit("event-name", serde_json::json!({"key": "value"})).unwrap();

// 前端监听事件
import { listen } from "@tauri-apps/api/event";

listen("event-name", (event) => {
  console.log("Received event:", event.payload);
});
```