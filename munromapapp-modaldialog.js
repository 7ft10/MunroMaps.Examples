"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.showDialog = function (nodeid) {
    var that = window.MunroMapApp;
    var node = that
        .munroMap
        .nodes
        .filter(function (n) {
            return n.id === Number.parseInt(nodeid);
        })[0];

    if (!node) {
        var error = "Node with id:'" + nodeid + "' not found.";
        window.dispatchEvent(new CustomEvent("MunroMap:ApplicationError", {
            detail: {
                errors: error
            }
        }));
        window.MunroMapApp.logger.error(error);
        return;
    }

    window.MunroMapApp.ModalDialog.modalSelf.Hide();
    window.MunroMapApp.ModalDialog.modalSelf.Show(that.munroMap, node);
}

window.MunroMapApp.ModalDialog = {

    modalSelf: {

        Show: function (map, node) {
            try {
                var d = JSON.parse(JSON.stringify(node));
                setTimeout(function () {
                    window.location.hash = node.id;
                }, 500);
                var skeleton = d3
                    .select("#modal-template-" + d.type)
                    .node();
                if (!skeleton) {
                    throw "No template for this type registered: " + d.type;
                }
                var diag = window.MunroMapApp.container.select('#modal-dialog');
                diag
                    .html(skeleton.firstChild.data)
                    .template()
                    .render(Object.assign(d, {
                        predecessors: window.MunroMapApp.SelfHelp.initiativeSelf.getPredecessors(map.nodes, d),
                        successors: window.MunroMapApp.SelfHelp.initiativeSelf.getSuccessors(map.nodes, d),
                        horizonDetails: window.MunroMapApp.SelfHelp.initiativeSelf.getHorizonDetails(map.horizons, d)
                    }));

                var dataHTML = diag.select('[data-html]')
                if (dataHTML && dataHTML.size && dataHTML.size() > 0) {
                    dataHTML
                        .call(function (elem) {
                            elem
                                .node()
                                .innerHTML = unescape(elem.attr("data-html"))
                            elem.attr("data-html", null);
                            var scripts = elem
                                .node()
                                .getElementsByTagName('script');
                            for (var ix = 0; ix < scripts.length; ix++) {
                                eval(scripts[ix].text);
                            }
                        })
                }
                diag
                    .style('display', 'block')
                    .transition()
                    .duration(300)
                    .style('opacity', 1)

                diag
                    .select('.modal-close')
                    .on("click", window.MunroMapApp.ModalDialog.modalSelf.Hide)

            } catch (e) {
                window.dispatchEvent(new CustomEvent("MunroMap:ApplicationError", {
                    detail: {
                        errors: e
                    }
                }));
                window.MunroMapApp.logger.error(e);
                window.MunroMapApp.ModalDialog.modalSelf.Hide();
            }
        },

        Hide: function (d) {
            var app = window.MunroMapApp;
            window.location.hash = "";
            window
                .location
                .replace("#");
            if (typeof window.history.replaceState == 'function') {
                history.replaceState({}, '', window.location.href.slice(0, -1));
            }
            if (app.container.select("#modal-dialog").node() && app.container.select("#modal-dialog").node().__d3t7tn__) {
                app.container
                    .select("#modal-dialog")
                    .node()
                    .__d3t7tn__ = null;
            }
            app.container
                .select('#modal-dialog')
                .attr('data-d3t7b', null)
                .attr('data-d3t7s', null)
                .html('')
                .transition()
                .duration(300)
                .style('opacity', 0)
                .transition()
                .duration(1)
                .style('display', 'none')
        }
    },
}