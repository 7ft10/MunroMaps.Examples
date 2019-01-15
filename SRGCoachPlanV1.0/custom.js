"use strict";

function customEventHandlers() {
    d3.select("#exportPNG").on("click", window.MunroMapApp.Export.toPNG);

    var flyout = d3.select("section.flyout");

    var typingTimer = null;
    function refresh() {
        window.location.hash = "";
        window
            .location
            .replace("#");
        if (typeof window.history.replaceState == 'function') {
            history.replaceState({}, '', window.location.href.slice(0, -1));
        }
        clearTimeout(typingTimer);
        typingTimer = setTimeout(function () {
            try {
                var newMap = JSON.parse(flyout.select("#jsonEditor").html().replace(/&amp;/gi, "&"));
                var copy = window.MunroMapApp.Export.toJSONObject();
                if (JSON.stringify(newMap).replace(/&amp;/gi, "&") != JSON.stringify(copy).replace(/&amp;/gi, "&")) {
                    window.MunroMapApp.start({
                        map: newMap,
                        reindexNodes: flyout.select("#jsonEditorReindex").property("checked")
                    });
                } else {
                    window.MunroMapApp.logger.log("No fundamental changes");
                }
                flyout.select(".errorsPanel").html("").style("display", "none");
            } catch (e) {
                handleValidationError(e);
            }
        }, 2000);
    }
    document.execCommand("defaultParagraphSeparator", false, "div");

    flyout.select("#jsonEditor").on('blur keyup paste input change', refresh);
    flyout.select("#jsonEditorReindex").on("change", refresh);
    flyout.select("#jsonEditorExportButton").on("click", window.MunroMapApp.Export.toJSON);
    d3.selectAll("#editJSON, #jsonEditorCloseButton").on("click", function () {
        d3.select(".errorsPanel").html("").style("display", "none");
        flyout.classed("flyoutExpanded", !flyout.classed("flyoutExpanded"));
    });
}

var _lastErrorMessage;
function handleValidationError(errorMessage) {
    window.location.hash = "validationerror";
    window.MunroMapApp.logger.error(errorMessage);
    if (_lastErrorMessage != errorMessage) {
        _lastErrorMessage = errorMessage;
        errorMessage = flyout.select(".errorsPanel").html() + _lastErrorMessage + "<br/>";
    }
    if (!flyout.classed("flyoutExpanded")) {
        flyout.classed("flyoutExpanded", true);
    }
    flyout.select(".errorsPanel").html(errorMessage).style("display", "block");
}

window.addEventListener('MunroMap:ValidationError', function (e) {
    if (e.detail && e.detail.errors) {
        for (var i = 0; i < e.detail.errors.length; i++) {
            var err = e.detail.errors[i];
            delete e.detail.errors[i].data;
            delete e.detail.errors[i].parentSchema;
            handleValidationError("Failed Validation: " + err.dataPath + " " + err.message);
        }
        d3.select(".app").html("Validation error: <pre>" + JSON.stringify(e.detail.errors, null, "\t") + "</pre>");
    }
});
window.addEventListener('MunroMap:ApplicationError', function (e) {
    if (e.detail && e.detail.errors) {
        window.location.hash = "error";
        d3.select(".app").html("Application error: <pre>" + JSON.stringify(e.detail.errors, Object.getOwnPropertyNames(e.detail.errors), "\t") + "</pre><p><a href='#' onclick='return window.location.reload(true);'>Refresh</a>");
    }
});
window.addEventListener('MunroMap:NewMapArrived', function (e) {
    if (e.detail && e.detail.map) {
        d3.select("#jsonEditor").html(JSON.stringify(e.detail.map, null, 4))
    }
});