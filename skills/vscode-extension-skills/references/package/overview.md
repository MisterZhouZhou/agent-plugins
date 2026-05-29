# 打包与发布

## 何时读取

当用户要生成 `.vsix`、本地安装扩展、准备分享或发布 VS Code 扩展时读取本文件。

## 推荐命令

优先使用项目本地依赖或 `npx`，避免强依赖全局安装：

```bash
npx @vscode/vsce package
```

如果项目已经使用旧命令或全局工具，也可能看到：

```bash
vsce package
```

打包成功后会生成类似 `my-extension-0.0.1.vsix` 的文件。

## 发布前检查

- `package.json` 有合法的 `publisher` 字段；本地测试可用 `"local"`。
- `name`、`displayName`、`description`、`version` 填写合理。
- `engines.vscode` 版本范围符合实际 API 使用。
- `README.md` 存在且内容不是模板占位。
- `CHANGELOG.md` 已更新，或确认发布流程不要求。
- `LICENSE` 合规，尤其是要发布到 Marketplace 时。
- `repository`、`bugs`、`homepage` 等元信息按项目需要填写。
- 没有把 token、私钥、测试数据、绝对本机路径打进包里。
- 编译、lint、测试通过。

## 本地安装

CLI 安装：

```bash
code --install-extension my-extension-0.0.1.vsix
```

GUI 安装：

```text
Extensions 视图 -> 更多操作 (...) -> Install from VSIX...
```

## 常见问题

- 缺少 `publisher`：补充 `package.json` 的 `"publisher"`。
- README 仍是模板：更新后再打包。
- 编译产物缺失：先运行 `npm run compile` 或检查 `main` 指向。
- 版本重复：发布前递增 `version`。
- 包体过大：检查 `.vscodeignore`，排除源码映射、测试快照、临时文件、大型资产。

## 验证建议

1. 运行编译和测试。
2. 运行 `npx @vscode/vsce package`。
3. 用 `code --install-extension <file>.vsix` 安装到本机。
4. 重载 VS Code，验证命令、菜单、Webview、配置项等关键路径。
