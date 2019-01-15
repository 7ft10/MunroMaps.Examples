"use strict";

var CACHE_NAME = 'munro-map-v1';

self.logger = {
    _doit: (method, args) => {
        if (args.length === 1 && (typeof args[0] == 'string' || args[0] instanceof String))
            console[method].apply(console, ['%c [Service Worker] %c' + args[0], 'color: green;', 'color: black;']);
        else if (args.length === 1)
            console[method].apply(console, ['%c [Service Worker] %c', 'color: green;', 'color: black;', args]);
        else
            console[method].apply(console, ['%c [Service Worker] %c' + args[0], 'color: green;', 'color: black;', args.slice(1)]);
    },
    log: function () {
        this._doit('log', Array.prototype.slice.call(arguments));
    },
    info: function () {
        this._doit('info', Array.prototype.slice.call(arguments));
    },
    debug: function () {
        this._doit('debug', Array.prototype.slice.call(arguments));
    },
    error: function () {
        this._doit('error', Array.prototype.slice.call(arguments));
    },
    warn: function () {
        this._doit('warn', Array.prototype.slice.call(arguments));
    }
}

function clientPostMessage(client, message) {
    return new Promise((resolve, reject) => {
        var channel = new MessageChannel();
        channel.port1.onmessage = event => {
            if (event.data.error) {
                return reject(event.data.error);
            }
            return resolve(event.data);
        };
        client.postMessage(message, [channel.port2]);
    });
}

function flatten(arr) {
    return arr.reduce((flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', event => {
    var cacheKeeplist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(keyList => {     // delete old caches 
            return Promise.all(keyList.map(key => {
                if (cacheKeeplist.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
            .then(() => self.clients.claim())  // Become available to all pages
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                self.logger.debug('Fetched from cache ', event.request.url);
                return response;
            }
            return fetch(event.request).then(response => {
                var cloner = response.clone();
                if (response.status === 404) {
                    return caches.match('/404.html');
                }
                self.logger.warn('Fetched from network', event.request.url);
                caches.open(CACHE_NAME)
                    .then(cache => {
                        return;
                        var url = new URL(event.request.url);
                        if (url.pathname.indexOf('index.html') > -1) return;
                        if (url.protocol === 'https:' || url.protocol === 'http:') {
                            cache.put(event.request, cloner);
                            return true;
                        }
                        return false;
                    })
                    .then(success => {
                        if (success) self.logger.debug('Cached', event.request.url);
                    })
                    .catch(err => {
                        self.logger.error(err);
                    })
                return response;
            });
        }).catch(() => {
            return caches.match('../offline.html');
        })
    );
});

self.addEventListener('push', event => {
    event.waitUntil(messageHandlers.push(event));
});

self.addEventListener('notificationclick', event => {
    self.logger.debug('Notification click Received.');
    if (event.action) {
        self.logger.debug("User clicked notification: " + event.action);
    }
    event.notification.close();
    if (event.notification.data) {
        if (event.notification.data.url) {
            event.waitUntil(clients.openWindow(event.notification.data.url));
        }
    }
});

self.addEventListener('message', event => {
    if (event.ports[0]) {
        if (!messageHandlers[event.data.action]) {
            event.ports[0].postMessage({ error: event.data.action + " action not found" });
        }
        event.waitUntil(messageHandlers[event.data.action](event)
            .then(response => {
                event.ports[0].postMessage(response);
            })
            .catch(err => {
                try {
                    event.ports[0].postMessage({ error: err, originalevent: event });
                } catch (err2) {
                    self.logger.error('Post Message Failed', err2, { error: err, originalevent: event });
                }
            })
        );
    }
});

var messageHandlers = [];
messageHandlers["push"] = event => {
    return new Promise((resolve, reject) => {
        var data;
        try {
            data = event.data.json();
        } catch {
            data = event.data;
        }
        if (!data) {
            reject({ error: "event.data not defined" });
            return;
        }
        actions.showNotication(data).then(() => {
            resolve({ action: 'push', success: true });
        }).catch(err => {
            reject(err);
        });
    });
};
messageHandlers["forceCache"] = event => {
    return new Promise((resolve, reject) => {
        if (!event.data.urls) reject({ error: "event.data.urls not defined" });
        if (event.data.urls.length === 0) reject({ error: "event.data.urls is empty" });
        caches.open(CACHE_NAME)
            .then(cache => {
                cache.keys().then(function (keys) {
                    keys = keys.map(k => k.url);
                    var notalreadyincacheurls = event.data.urls.filter(function (i) { return keys.indexOf(i) < 0; });
                    if (notalreadyincacheurls.length > 0) {
                        cache.addAll(notalreadyincacheurls).then(() => {
                            self.logger.debug('Forced Cached', notalreadyincacheurls);
                            resolve({ action: 'forceCache', success: true });
                        })
                    } else {
                        self.logger.debug('Forced Cached: everything already in cache');
                        resolve({ action: 'forceCache', success: true });
                    }
                });
            })
    });
};

var actions = [];
actions['getCacheURls'] = () => {
    return new Promise((resolve, reject) => {
        clients.matchAll().then(clients => {
            var q = [];
            clients.forEach(client => {
                q.push(clientPostMessage(client, "require_cache_urls"));
            });
            Promise.all(q).then(values => {
                var urls = flatten(values);
                resolve(urls);
            }).catch(err => {
                reject(err);
            })
        })
    });
};
actions["showNotication"] = notificationOptions => {
    const title = 'Munro Maps';
    const options = Object.assign({
        icon: '../logo-blue-192x192.png',
        badge: '../logo-blue-192x192.png',
    }, notificationOptions);
    return self.registration.showNotification(title, options);
};