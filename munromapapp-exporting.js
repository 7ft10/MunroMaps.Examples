"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.Export = {

    ScaleFactor: 3.5,

    toJSONObject: function () {
        var that = window.MunroMapApp;
        if (!that.munroMap) return {};
        var copy = JSON.parse(JSON.stringify(that.munroMap));

        delete copy.roads;
        delete copy.legend;
        copy
            .horizons
            .forEach(function (horizon, i) {
                delete horizon.levels;
                delete horizon.initiativeCount;
                delete horizon.counter;
                delete horizon.margin;
                delete horizon.height;
                delete horizon.x;
                delete horizon.y;
            });
        copy
            .nodes
            .forEach(function (node, i) {
                delete node.y;
                delete node.x;
                delete node.width;
                delete node.height;
                delete node.level;
                delete node.weight;
                delete node.horizonDetails;
                if (node.detailsUrl) {
                    delete node.details;
                }
            });

        return copy;
    },

    toJSON: function () {
        var that = window.MunroMapApp;

        var copy = that.Export.toJSONObject();

        var x = window.open().document;
        x.open("about:blank", "_json");
        x.write("<pre>" + JSON.stringify(copy, null, '\t') + "</pre>");
        x.close();
    },

    toPNG: function () {
        var that = window.MunroMapApp;
        var scale = that.Export.ScaleFactor || 3.5;
        that.Export._downloadSvg(d3.select(".app > * > svg").node(), "MunroMap.png", scale);
    },

    _copyStylesInline: function (destinationNode, sourceNode) {
        var that = window.MunroMapApp;
        var containerElements = ["svg", "g"];
        for (var cd = 0; cd < destinationNode.childNodes.length; cd++) {
            var child = destinationNode.childNodes[cd];
            if (containerElements.indexOf(child.tagName) != -1) {
                that.Export._copyStylesInline(child, sourceNode.childNodes[cd]);
                continue;
            }
            var style = sourceNode.childNodes[cd].currentStyle || window.getComputedStyle(sourceNode.childNodes[cd]);
            if (style == "undefined" || style == null) continue;
            for (var st = 0; st < style.length; st++) {
                child.style.setProperty(style[st], style.getPropertyValue(style[st]));
            }
        }
    },

    _triggerDownload: function (imgURI, fileName) {
        var a = document.createElement("a");
        a.setAttribute("download", fileName);
        a.setAttribute("href", imgURI);
        a.setAttribute("target", '_blank');
        a.dispatchEvent(new MouseEvent("click", {
            view: window,
            bubbles: false,
            cancelable: true
        }));
    },

    _downloadSvg: function (svg, fileName, scale) {
        var that = window.MunroMapApp;
        scale = scale || 1;
        var bbox = svg.getBBox();
        var copy = svg.cloneNode(true);

        that.Export._copyStylesInline(copy, svg);

        var canvas = document.createElement("canvas");
        canvas.width = bbox.width * scale;
        canvas.height = bbox.height * scale;

        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, bbox.width, bbox.height);
        ctx.scale(scale, scale);

        var DOMURL = window.URL || window.webkitURL || window;

        var data = (new XMLSerializer()).serializeToString(copy);
        var svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
        var url = DOMURL.createObjectURL(svgBlob);

        var thatsWindow = window;

        var img = new Image();
        img.onload = function () {
            try {
                ctx.drawImage(img, 0, 0);
                DOMURL.revokeObjectURL(url);
                if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
                    var blob = canvas.msToBlob();
                    navigator.msSaveOrOpenBlob(blob, fileName);
                }
                else {
                    var imgURI = canvas
                        .toDataURL("image/png")
                        .replace("image/png", "image/octet-stream");
                    that.Export._triggerDownload(imgURI, fileName);
                }
                d3.select(canvas).html('');
            }
            catch (e) {
                var event = new ErrorEvent("error", {
                    message: "Failed to create image - try reducing the scale. Disregard any downloaded files. Original error: " + e.message,
                    stack: e.stack || '',
                    code: e.code || 0,
                    name: e.name || 'General Error'
                });
                if (document.createEvent) {
                    thatsWindow.dispatchEvent(event);
                } else {
                    thatsWindow.fireEvent("on" + event.eventType, event);
                }
            }
        };
        img.src = url;
    }
}