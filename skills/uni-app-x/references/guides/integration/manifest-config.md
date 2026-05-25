# Manifest Configuration

`manifest.json` stores app identity, versioning, uni-app x marker, and per-platform build settings.

## Basic configuration

```json
{
  "name": "my-uni-app-x",
  "appid": "__UNI__XXXXXX",
  "description": "",
  "versionName": "1.0.0",
  "versionCode": "100",
  "uni-app-x": {}
}
```

## H5/Web configuration

```json
{
  "h5": {
    "router": {
      "mode": "hash",
      "base": "/"
    },
    "devServer": {
      "https": false,
      "port": 8080
    }
  }
}
```

Use `hash` mode unless the deployment server is configured to rewrite history routes.

## WeChat Mini Program configuration

```json
{
  "mp-weixin": {
    "appid": "your-appid",
    "setting": {
      "urlCheck": false,
      "minified": true,
      "postcss": true
    }
  }
}
```

## Other Mini Program targets

```json
{
  "mp-alipay": {},
  "mp-baidu": {},
  "mp-toutiao": {},
  "mp-qq": {}
}
```

Only add targets the project actually builds and tests.

## App and native resources

uni-app x App projects often use native resource/config files alongside `manifest.json`:

```text
AndroidManifest.xml
Info.plist
nativeResources/
├─android/
└─ios/
harmonyConfig/
```

Keep permissions and native resources platform-specific. Do not copy classic `app-plus` snippets blindly into uni-app x without checking current project conventions.

## Version checklist

- `versionName` is user-visible.
- `versionCode` is monotonically increasing for stores.
- AppID values are correct for each Mini Program target.
- Web router mode matches server deployment.
- Native permissions are present only when needed.
