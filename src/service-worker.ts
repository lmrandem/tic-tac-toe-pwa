/// <reference lib="WebWorker" />

import xImg from './assets/x.svg';
import oImg from './assets/o.svg';

export type {};
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'v1';

interface RequestWithFallback {
  request: Request;
  fallbackUrl: string;
}

const addResourcesToCache = async (resources: string[]) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
};

const putInCache = async (req: Request, res: Response) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(req, res);
};

const cacheFirst = async ({ request, fallbackUrl }: RequestWithFallback) => {
  try {
    console.log('cache first');
    const res = await caches.match(request);
    if (res) {
      console.log('cache response');
      return res;
    }
    console.log('server data');
    const networkRes = await fetch(request);
    putInCache(request, networkRes.clone());
    return networkRes;
  } catch (err) {
    const fallbackRes = await caches.match(fallbackUrl);
    if (fallbackRes) {
      return fallbackRes;
    }
    return new Response('<h1>Resource not found</h1>', {
      status: 408,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
};

/*
const serverFirst = async (request: Request) => {
  console.log('server first');
  const res = await fetch(request);
  console.log(res);
  if (res) {
    console.log('server response');
    return res;
  }
  console.log('cache response');
  const cacheRes = await caches.match(request);
  if (cacheRes) {
    return cacheRes;
  }
  return new Response('<h1>Resource not found</h1>', {
    status: 408,
    headers: {
      'Content-Type': 'text/html',
    },
  });
};
*/

self.addEventListener('install', (e) => {
  e.waitUntil(
    addResourcesToCache([
      '/',
      '/favicon.ico',
      '/icon-192.png',
      '/icon-512.png',
      '/bundle.js',
      '/index.html',
      '/styles.css',
      '/manifest.json',
      xImg as string,
      oImg as string,
    ]),
  );
});

self.addEventListener('fetch', async (e) => {
  e.respondWith(cacheFirst({ request: e.request, fallbackUrl: '/' }));
  console.log();
});
