/* ========================================
   sw.js - Service Worker
   实现离线缓存，支持 PWA 离线使用
   ======================================== */

const CACHE_NAME = 'sound-practice-v2';

// 需要缓存的文件列表
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
];

// 安装：预缓存所有关键资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] 缓存关键资源');
            return cache.addAll(urlsToCache);
        })
    );
    // 立即激活，不等待旧 SW
    self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => {
                    console.log('[SW] 删除旧缓存:', name);
                    return caches.delete(name);
                })
            );
        })
    );
    // 立即控制所有页面
    self.clients.claim();
});

// 请求拦截：缓存优先策略
self.addEventListener('fetch', event => {
    // 仅处理 GET 请求
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 缓存命中：直接返回
            if (cachedResponse) {
                return cachedResponse;
            }
            // 缓存未命中：发起网络请求并缓存
            return fetch(event.request).then(response => {
                // 不缓存非成功响应
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                // 克隆响应（因为 response 只能被读取一次）
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // 网络请求失败且无缓存时，返回离线提示页面
                // 由于所有资源已预缓存，这种情况很少发生
                return new Response('离线状态，资源不可用', { status: 503 });
            });
        })
    );
});
