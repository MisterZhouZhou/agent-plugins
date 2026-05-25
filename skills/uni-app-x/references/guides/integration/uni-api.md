# Uni API Integration

These examples combine `uni.*` APIs with typed UVue state.

## Request with loading state

```vue
<script setup lang="uts">
const loading = ref<boolean>(false)
const message = ref<string>("")

const fetchData = (): void => {
  loading.value = true
  uni.request({
    url: "https://api.example.com/data",
    method: "GET",
    success: (res) => {
      message.value = "Loaded"
      console.log(res.data)
    },
    fail: (err) => {
      message.value = "Failed"
      console.error(err)
    },
    complete: () => {
      loading.value = false
    }
  })
}
</script>
```

## Storage-backed form

```vue
<script setup lang="uts">
type Profile = {
  username: string
}

const profile = ref<Profile>({
  username: ""
})

onLoad(() => {
  const saved = uni.getStorageSync("profile")
  if (saved != null) {
    profile.value = saved as Profile
  }
})

const saveProfile = (): void => {
  uni.setStorageSync("profile", profile.value)
  uni.showToast({ title: "Saved", icon: "success" })
}
</script>
```

## Image selection and upload

```uts
const chooseAndUpload = (): void => {
  uni.chooseImage({
    count: 1,
    success: (chooseRes) => {
      if (chooseRes.tempFilePaths.length > 0) {
        const filePath = chooseRes.tempFilePaths[0]
        uni.uploadFile({
          url: "https://api.example.com/upload",
          filePath,
          name: "file",
          success: () => {
            uni.showToast({ title: "Uploaded", icon: "success" })
          }
        })
      }
    }
  })
}
```

## Location

```uts
type LocationState = {
  longitude: number
  latitude: number
}

const location = ref<LocationState | null>(null)

const getLocation = (): void => {
  uni.getLocation({
    type: "gcj02",
    success: (res) => {
      location.value = {
        longitude: res.longitude,
        latitude: res.latitude
      }
    }
  })
}
```

## Checklist

- Keep loading/error/success states explicit.
- Cast storage and request data before assigning to typed state.
- Check array length before reading file paths.
- Configure platform permissions for location, camera, album, or file access.
- Use platform-specific APIs only inside matching conditional blocks.
