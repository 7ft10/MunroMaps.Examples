"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.Loading = {
    _setup: false,
    LoadingStack: [],
    Start: function (id, text) {
        if (!this._setup) {
            this._setUpLoadingEvents();
            this._setup = true;
        }
        window.dispatchEvent(new CustomEvent("MunroMap:LoadingStart", {
            detail: {
                id: id,
                text: text
            }
        }));
    },
    Stop: function (id, text) {
        window.dispatchEvent(new CustomEvent("MunroMap:LoadingComplete", {
            detail: {
                id: id,
                text: text
            }
        }));
    },
    _setUpLoadingEvents: function () {
        var that = window.MunroMapApp.Loading;
        d3
            .select('.app')
            .append('aside')
            .attr('id', 'loading-overlay')
            .attr('class', 'loading')
            .style('opacity', 0)
            .html('<div class="spinner"></div><span id="loading-text"></span>')

        that.LoadingStack = [];
        window.addEventListener('MunroMap:LoadingStart', function (e) {
            if (e.detail && e.detail.id) {
                that
                    .LoadingStack
                    .push(e.detail.id.toUpperCase());
                var text = "Loading...";
                if (e.detail && e.detail.text) {
                    text = "Loading " + e.detail.text + "...";
                }
                setTimeout(function () {
                    d3
                        .select('#loading-overlay')
                        .style('display', 'block')
                        .style('opacity', 1)
                        .select("#loading-text")
                        .html(text);
                }, 1);
            } else {
                window.MunroMapApp.logger.warn('MunroMap:LoadingStart does not have an ID.')
            }
            e.returnValue = '';
        }, false);
        window.addEventListener('MunroMap:LoadingComplete', function (e) {
            if (e.detail && e.detail.id) {
                var index = that
                    .LoadingStack
                    .indexOf(e.detail.id.toUpperCase());
                if (index > -1) {
                    that
                        .LoadingStack
                        .splice(index, 1);
                } else {
                    window.MunroMapApp.logger.warn('MunroMap:LoadingComplete ID has not been registered. Removing loading...');
                    that.LoadingStack = [];
                }
                var text = "Loaded";
                if (e.detail && e.detail.text) {
                    text = "Loaded " + e.detail.text + "...";
                }
                if (that.LoadingStack.length === 0) {
                    text = "Completed Loading."
                }
                d3
                    .select('#loading-overlay')
                    .style('display', 'block')
                    .style('opacity', 1)
                    .select("#loading-text")
                    .html(text);
                setTimeout(function () {
                    if (that.LoadingStack.length === 0) {
                        d3
                            .select('#loading-overlay')
                            .transition()
                            .duration(300)
                            .style('opacity', 0)
                            .style("display", "none");
                    }
                }, (5 - (that.LoadingStack.length % 5)) * 100);
            } else {
                window.MunroMapApp.logger.warn('MunroMap:LoadingComplete does not have an ID.');
            }
            e.returnValue = '';
        }, false);
        window.addEventListener("unload", function (e) {
            that.Loading.Start("qeX2Rlfur0S8uduhNkHO5Q==");
            setTimeout(function () {
                that.Loading.Stop("qeX2Rlfur0S8uduhNkHO5Q==");
            }, 100);
            e.returnValue = '';
        });
    }
}