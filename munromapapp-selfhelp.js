"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.SelfHelp = {

    self: {

        Id: function (d) {
            return d.id;
        },

        Name: function (d) {
            return d.name;
        },

        X: function (d) {
            return d.x;
        },

        Y: function (d) {
            return d.y;
        },

        Height: function (d) {
            return d.height;
        },

        Width: function (d) {
            return d.width;
        },

        Radius: function (d) {
            return d.r;
        },

        Class: function (d) {
            var prefix = d3
                .select(this)
                .attr("class");
            if (!prefix || prefix.length === 0)
                prefix = "";
            else
                prefix += " ";
            return prefix + d.type;
        },

        Colour: function (d) {
            return d.data && d.data.colour || "blue";
        },

        CurvedPath: function (d) {
            return d3
                .linkVertical()
                .x(window.MunroMapApp.SelfHelp.self.X)
                .y(window.MunroMapApp.SelfHelp.self.Y)({
                    source: {
                        x: d.source.x,
                        y: d.source.y
                    },
                    target: {
                        x: d.target.x,
                        y: d.target.y
                    }
                });
        },

        TranslateToXY: function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        },

        CenteredText: function (d) {
            if (this.node)
                return 0 - (this.node().getComputedTextLength() / 2);
            return 0 - (this.getComputedTextLength() / 2);
        },

        MiddledText: function (d) {
            var bb = this.getBBox();
            return bb.height - (bb.height / 3 * 2);
        },

        SourceName: function (d) {
            return "node_" + d.source.id;
        },

        SourceX: function (d) {
            return d.source.x;
        },

        SourceY: function (d) {
            return d.source.y;
        },

        TargetName: function (d) {
            return "node_" + d.target.id;
        },

        TargetX: function (d) {
            return d.target.x;
        },

        TargetY: function (d) {
            return d.target.y;
        },

        Wrap: function (text, width) {
            text
                .each(function () {
                    var text = d3.select(this),
                        words = text
                            .text()
                            .split(/\s+/)
                            .reverse(),
                        word,
                        line = [],
                        lineNumber = 0,
                        y = text.attr("y"),
                        dy = parseFloat(text.attr("dy")),
                        tspan = text
                            .text("")
                            .append("tspan")
                            .attr("x", 0)
                            .attr("y", y)
                            .attr("dy", dy)
                            .attr("dx", window.MunroMapApp.SelfHelp.self.CenteredText.call(text, word))
                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" ").trim())
                        if (tspan.node().getComputedTextLength() > width) {
                            if (line.length === 1) {
                                tspan.attr("dx", window.MunroMapApp.SelfHelp.self.CenteredText.call(tspan, word))
                                if (words.length === 0) {
                                    tspan.attr("dy", window.MunroMapApp.SelfHelp.self.MiddledText.call(text.node(), word))
                                }
                                continue;
                            }
                            line.pop();
                            // need to set the text to then get computed length
                            (tspan.text(line.join(" ").trim())).attr("dx", window.MunroMapApp.SelfHelp.self.CenteredText.call(tspan, word))
                            line = [word];
                            tspan = text
                                .append("tspan")
                                .text(word)
                                .attr("x", 0)
                                .attr("y", dy)
                            tspan
                                .attr("dx", window.MunroMapApp.SelfHelp.self.CenteredText.call(tspan, word))
                                .attr("dy", (++lineNumber * 2.5) * dy)
                        } else {
                            tspan.attr("dx", window.MunroMapApp.SelfHelp.self.CenteredText.call(tspan, word))
                        }
                    }
                });
        }
    },

    initiativeSelf: {

        Horizon: function (d) {
            return d.horizon;
        },

        Category: function (d) {
            return d.category;
        },

        Size: function (d) {
            return d
                .size
                .toLowerCase();
        },

        Level: function (d) {
            return d.level;
        },

        Symbol: function (d) {
            return "#" + d
                .type
                .toLowerCase() + "Symbol";
        },

        SymbolClass: function (d) {
            var prefix = d3
                .select(this)
                .attr("class");
            if (!prefix || prefix.length === 0)
                prefix = "";
            else
                prefix += " ";
            return prefix + d
                .type
                .toLowerCase() + " symbol";
        },

        TranslateToXY: function (d) {
            return "translate(" + (0 - (d.width / 2)) + "," + (0 - (d.height / 2)) + ")";
        },

        OnMouseOver: function (d) {
            d
                .links
                .forEach(function (link) {
                    window.MunroMapApp.container
                        .selectAll(".road[source='node_" + d.id + "'][target='node_" + link + "']")
                        .classed("hover", true);
                });
            window.MunroMapApp.container
                .selectAll(".road[target='node_" + d.id + "']")
                .classed("hover", true);
        },

        OnMouseOut: function (d) {
            d
                .links
                .forEach(function (link) {
                    window.MunroMapApp.container
                        .selectAll(".road[source='node_" + d.id + "'][target='node_" + link + "']")
                        .classed("hover", false);
                });
            window.MunroMapApp.container
                .selectAll(".road[target='node_" + d.id + "']")
                .classed("hover", false);
        },

        getPredecessors: function (nodes, initiative) {
            var predecessors = [];
            initiative
                .links
                .forEach(function (link) {
                    predecessors = predecessors.concat(nodes.filter(function (i) {
                        return i.id === link;
                    }))
                })
            return predecessors || [];
        },

        getSuccessors: function (nodes, initiative) {
            var successors = nodes.filter(function (i) {
                return i
                    .links
                    .indexOf(initiative.id) > -1;
            });
            return successors || [];
        },

        getHorizonDetails: function (horizons, initiative) {
            var horizon = horizons.filter(function (h) {
                return h.id === initiative.horizon;
            }).pop();
            if (!horizon)
                throw "No horizon set, or horizon does not exist, for initiative: " + initiative.name;
            return horizon;
        }
    },

    roadSelf: {
        OnMouseOver: function (d) {
            d3
                .select(this)
                .classed("hover", true);
        },

        OnMouseOut: function (d) {
            d3
                .select(this)
                .classed("hover", false);
        }
    },

    linkSelf: {
        FindTarget: function (nodes, link) {
            var target = nodes.filter(function (d) {
                return d.id === link;
            }).pop();
            if (!target) {
                throw "Invalid link:" + link + " in nodes: " + nodes;
            }
            return target;
        }
    },
}