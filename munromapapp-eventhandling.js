"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.Events = {
    _setup: false,

    _wireEvent: function (elem, name, func) {
        if (elem instanceof Array) {
            for (var index = 0, len = elem.length; index < len; ++index) {
                var e = elem[index];
                if (e.addEventListener) {
                    e.addEventListener(name, func);
                } else if (document.attachEvent) {
                    e.attachEvent(name, func);
                }
            }
        } else {
            if (elem.addEventListener) {
                elem.addEventListener(name, func);
            } else if (document.attachEvent) {
                elem.attachEvent(name, func);
            }
        }
    },

    _errorHandler: function (e) {
        window.dispatchEvent(new CustomEvent("MunroMap:ApplicationError", {
            detail: {
                errors: e
            }
        }));
        window.MunroMapApp.logger.error(e);
    },

    _wordViewerEventHandler: function (e) {
        var target = e.target || e.srcElement;
        if (target.tagName && target.tagName.toUpperCase() === 'A') {
            var role = target.getAttribute('role');
            if (role && role.toUpperCase() === "WORDVIEWER") {
                var filelocation = target.getAttribute('href');
                var wordviewer = "https://view.officeapps.live.com/op/embed.aspx?src=";
                var url = wordviewer + encodeURI("http:" + document.URL.substr(document.URL.indexOf('/'), document.URL.lastIndexOf('/') - document.URL.indexOf('/') + 1) + filelocation);
                var w = window.open(url, "WORDVIEWER", null, true);
                e.preventDefault();
            }
        }
    },

    Start: function () {
        var that = window.MunroMapApp;
        if (this._setup) {
            return;
        }

        this._wireEvent([window, document], 'error', that.Events._errorHandler);
        this._wireEvent(document, 'click', that.Events._wordViewerEventHandler);

        this._setup = true;
    }
}

window.MunroMapApp.Events.Start();