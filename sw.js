/* 博浩英语 CET-6 · Service Worker（PWA 安装 / 离线壳 / 静态缓存） 创始人：文博浩 */
"use strict";
var CACHE = "bohao-cet6-v3.0";
var CORE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/css/style.css",
  "/assets/css/ext.css",
  "/assets/js/core.js",
  "/assets/js/home.js",
  "/assets/js/vocab.js",
  "/assets/js/listening.js",
  "/assets/js/reading.js",
  "/assets/js/writing.js",
  "/assets/js/translation.js",
  "/assets/js/exam.js",
  "/assets/js/dashboard.js",
  "/assets/js/admin.js",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/apple-touch-icon.png"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf("/api/") === 0) return; // 数据一律走网络，保持实时
  // 页面导航：网络优先，失败回退缓存（离线可用壳）
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put("/index.html", copy); });
      return res;
    }).catch(function () { return caches.match("/index.html"); }));
    return;
  }
  // 静态资源：缓存优先 + 后台更新（stale-while-revalidate）
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && res.status === 200) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});