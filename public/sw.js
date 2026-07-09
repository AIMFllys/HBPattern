/**
 * Service Worker — 湖北纹案文化展示平台
 *
 * 策略：network-first（HTML 导航请求）/ stale-while-revalidate（静态资源）
 * 不再使用 cache-first，避免把 SSR 错误页 / loading 骨架永久缓存导致"白屏自锁"。
 *
 * 版本号升级到 v2 用于强制清掉 v1 阶段可能已缓存的坏响应。
 */
const CACHE_NAME = 'hbpattern-v2'
const STATIC_CACHE = [
  '/',
  '/gallery',
  '/map',
  '/manifest.json',
]

// 仅缓存 GET 请求且同源
self.addEventListener('install', (event) => {
  event.waitUntil(
    // 用 Promise.allSettled 而非 cache.addAll：单个 URL 失败不会让整个 install reject
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(STATIC_CACHE.map((url) => cache.add(url)))
      self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        // 删除所有旧版本缓存（v1 等）
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  const isNavigation =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html')

  if (isNavigation) {
    // HTML 导航请求：network-first
    // 网络成功且 2xx 才写缓存，避免把 5xx / 错误页缓存住导致永久白屏
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status >= 200 && response.status < 400) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() =>
          // 网络完全失败时才回退到缓存（离线场景）
          caches.match(event.request).then((cached) => cached || caches.match('/'))
        )
    )
    return
  }

  // 静态资源：stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})
