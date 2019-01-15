"use strict";

window.ServiceWorkerRegister = {
    logger: {
        _doit: function (method, args) {
            if (args.length === 1 && (typeof args[0] == 'string' || args[0] instanceof String))
                console[method].apply(console, ['%c [Service Register] %c' + args[0], 'color: darkgreen;', 'color: black;']);
            else if (args.length === 1)
                console[method].apply(console, ['%c [Service Register] %c', 'color: darkgreen;', 'color: black;', args]);
            else
                console[method].apply(console, ['%c [Service Register] %c' + args[0], 'color: darkgreen;', 'color: black;', args.slice(1)]);
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
    },

    urlB64ToUint8Array: function (base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    _forceCaching: function (registration) {
        window.MunroMapApp.Loading.Start("t9Rv+PxxekWwiJycY4/7VQ==", "Caching required files");
        return new Promise((resolve, reject) => {
            ServiceWorkerRegister.postToServiceWorker({
                action: "forceCache",
                urls: window.MunroMapApp.requires_and_resources
            })
                .then(() => resolve(registration))
                .catch(error => reject(error))
        }).then(registration => {
            window.MunroMapApp.Loading.Stop("t9Rv+PxxekWwiJycY4/7VQ==");
            return registration;
        });
    },

    _waitForServiceWorkerToBeActivated: function (registration) {
        window.MunroMapApp.Loading.Start("TuD8oYS9nUCmr9L6v3j1SQ==", "Starting Service Workers");
        return new Promise((resolve, reject) => {
            var serviceWorker;
            if (registration.installing) {
                serviceWorker = registration.installing;
            } else if (registration.waiting) {
                serviceWorker = registration.waiting;
            } else if (registration.active) {
                serviceWorker = registration.active;
            } else {
                reject();
            }
            if (serviceWorker) {
                serviceWorker.addEventListener('statechange', function (e) {
                    if (e.target.state === 'activated') {
                        resolve(registration);
                    }
                });
                if (serviceWorker.state === 'activated') {
                    resolve(registration);
                }
            }
        }).then(registration => {
            window.MunroMapApp.Loading.Stop("TuD8oYS9nUCmr9L6v3j1SQ==");
            return registration;
        });
    },

    wireNotificationListeners: () => {
        window.addEventListener("MunroMap:NotificationRequired", event => {
            ServiceWorkerRegister.postToServiceWorker({ action: "push", data: { body: event.detail.message } })
                .then(response => {
                    if (response.error) {
                        window.ServiceWorkerRegister.logger.error(response.error);
                        return;
                    }
                    window.ServiceWorkerRegister.logger.log(response);
                })
                .catch(err => {
                    window.ServiceWorkerRegister.logger.error(err);
                })
        });
    },

    wireEvents: () => {
        navigator.serviceWorker.addEventListener('message', event => {
            switch (event.data) {
                case "require_cache_urls":
                    return event.ports[0].postMessage(window.MunroMapApp.requires);
                default:
                    console.log(event.data);
            }
        });
    },

    postToServiceWorker: (data) => {
        return new Promise((resolve, reject) => {
            var msg_chan = new MessageChannel();
            msg_chan.port1.onmessage = event => {
                if (event.data.error) {
                    reject(event.data.error);
                } else {
                    resolve(event.data);
                }
                return Promise.resolve();
            };
            new Promise(r => {
                if (navigator.serviceWorker.controller) return r();
                navigator.serviceWorker.addEventListener('controllerchange', e => r());
            }).then(function () {
                navigator.serviceWorker.controller.postMessage(data, [msg_chan.port2]);
            })
        });
    },

    initializeUI: function (registration) {
        var that = this;
        return new Promise((resolve, reject) => {
            that.wireEvents();
            registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: window.ServiceWorkerRegister.urlB64ToUint8Array(window.MunroMapApp.applicationServerPublicKey)
            }).then(function (subscription) {
                that.wireNotificationListeners();
                window.ServiceWorkerRegister.logger.debug('User is subscribed. Notifications wired', subscription);
                console.log(JSON.stringify(subscription));
                resolve();
            }).catch(function (err) {
                window.ServiceWorkerRegister.logger.error('Failed to subscribe the user: ', err);
                reject(err);
            })
        });
    },

    Start: function () {
        var that = this;
        return new Promise((resolve, reject) => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                window.ServiceWorkerRegister.logger.log('Service Worker and Push is supported');

                navigator.serviceWorker.register('../munromapapp-pushmanagerworker.js')
                    .then(registration => {
                        return that._waitForServiceWorkerToBeActivated(registration)
                            .then(registration => {
                                window.ServiceWorkerRegister.logger.debug('Push Manager Service Worker Registered: ', registration);
                                return that._forceCaching(registration)
                                    .then(registration => {
                                        window.ServiceWorkerRegister.logger.debug('Push Manager Service Worker Initializing Client Side: ', registration);
                                        return ServiceWorkerRegister.initializeUI(registration)
                                            .then(() => resolve());
                                    })
                            })
                    })
                    .catch(error => {
                        window.ServiceWorkerRegister.logger.error('Push Manager Service Worker Error: ', error);
                        reject();
                    });
            } else {
                window.ServiceWorkerRegister.logger.warn('Push messaging is not supported');
                resolve('Push messaging is not supported'); // continue loading with reduced functionality
            }
        });
    }
}