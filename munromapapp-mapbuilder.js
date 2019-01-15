"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.MapBuilder = {

    ReIndexNodes: function () {
        var that = window.MunroMapApp;
        window.MunroMapApp.logger.debug("Reindexing nodes...");
        that.Loading.Start("w/V5cYVmV0i8rI5Mgora7w==", "Reindexing Nodes");

        var newbaseid = that
            .munroMap
            .nodes
            .reduce(function (a, b, i) {
                return Math.max(a.id || a, b.id || b);
            }, -1) + 1;
        function replaceArrayValue(arr, oldval, newval) {
            var arrindex = arr.indexOf(oldval)
            if (arrindex > -1) {
                arr.splice(arrindex, 1);
            }
            arr.push(newval);
        }
        that
            .munroMap
            .nodes
            .forEach(function (node, index) {
                node.oldid = node.id;
                node.id = newbaseid + index + 1;
                that
                    .munroMap
                    .nodes
                    .forEach(function (othernode, index) {
                        othernode
                            .links
                            .slice()
                            .forEach(function (link) {
                                if (link === node.oldid) {
                                    replaceArrayValue(othernode.links, link, node.id);
                                }
                            });
                    });
            });
        that
            .munroMap
            .nodes
            .forEach(function (node, index) {
                node.id = node.id - newbaseid;
                if (node.oldid !== node.id) {
                    window.MunroMapApp.logger.debug("Reindexing has occurred - please re-export to json");
                } else {
                    delete node.oldid;
                }
                node
                    .links
                    .slice()
                    .forEach(function (link) {
                        replaceArrayValue(node.links, link, link - newbaseid);
                    });
            });

        that.Loading.Stop("w/V5cYVmV0i8rI5Mgora7w==", "Reindexed Nodes");
    },

    Build: function (canvas) {
        return new Promise(function (resolve) {
            var that = window.MunroMapApp;

            that.Loading.Start("YJiUjnrMe0yAEep9MXDw0g==", "Creating Map");

            that.munroMap.roads = [];
            that.munroMap.legend = [];

            function setInitialNodeLevel(node, horizon, level) {
                var changes = false;
                if (node.links.indexOf(node.id) > -1) {
                    throw "Node is linked to itself: " + node.name;
                }
                if (!node.level) {
                    node.level = 1;
                }
                node
                    .links
                    .forEach(function (link) {
                        var target = that.SelfHelp.linkSelf.FindTarget(that.munroMap.nodes, link);
                        if (!target.level) target.level = 1;
                        if (node.horizon === target.horizon) {
                            while (level + 1 > node.level || target.level > node.level) {
                                node.level++;
                                changes = true;
                            }
                            changes = setInitialNodeLevel(target, horizon, level++);
                        }
                    });
                return changes;
            }

            var changes = true;
            while (changes) {
                window.MunroMapApp.logger.debug("Setting initial node levels...", clone(that.munroMap));
                changes = false;
                that
                    .munroMap
                    .nodes
                    .forEach(function (node) {
                        var horizon = that.SelfHelp.initiativeSelf.getHorizonDetails(that.munroMap.horizons, node);
                        changes = setInitialNodeLevel(node, horizon, 1);
                    });
            }

            var changes = true;
            while (changes) {
                window.MunroMapApp.logger.debug("Refactoring horizon levels...", clone(that.munroMap));
                changes = false;
                that
                    .munroMap
                    .horizons
                    .forEach(function (horizon, i) {
                        that
                            .munroMap
                            .nodes
                            .filter(function (v) {
                                return v.horizon === horizon.id;
                            })
                            .forEach(function (node) {
                                if (!horizon.levels) horizon.levels = 1;
                                if (node.levelBump) node.level += node.levelBump; // bumps can be negative
                                if (node.level > horizon.levels) horizon.levels = node.level;
                                if (node.level < 1) {
                                    window.MunroMapApp.logger.debug("Refactoring node levels above zero...", clone(that.munroMap));
                                    var bumpedAmt = Math.abs(1 - node.level);
                                    node.level = 1;
                                    horizon.levels += bumpedAmt; // And all other nodes in horizon must move up one?? 
                                    that
                                        .munroMap
                                        .nodes
                                        .forEach(function (othernode, j) {
                                            if (node.id != othernode.id && othernode.horizon === horizon.id) {
                                                othernode.level += bumpedAmt;
                                            }
                                        });
                                    changes = setInitialNodeLevel(node, horizon, 1);
                                }
                            });
                    });
            }

            var milestoneErrors = [];
            var changes = true;
            while (changes) {
                changes = false;
                window.MunroMapApp.logger.debug("Refactoring node levels...", clone(that.munroMap));
                that
                    .munroMap
                    .nodes
                    .forEach(function (n) {
                        var node = n;
                        var maxTargetLevel = node
                            .links
                            .reduce(function (currentMax, nodeid, i) {
                                var bnode = that.SelfHelp.linkSelf.FindTarget(that.munroMap.nodes, nodeid);
                                var blevel = (bnode ? bnode.level : 1);
                                if (!bnode || node.horizon !== bnode.horizon) {
                                    blevel = 1;
                                }
                                return Math.max(currentMax, blevel);
                            }, 1);
                        while (node.level - 1 > maxTargetLevel && node.level > 1) {
                            node.level--;
                            changes = true;
                        }
                        node
                            .links
                            .forEach(function (link) {
                                var target = that.SelfHelp.linkSelf.FindTarget(that.munroMap.nodes, link);
                                if (target.type === "milestone") {
                                    if (milestoneErrors.filter(function (v) {
                                        return v.source.id === node.id && v.target.id === target.id;
                                    }).length === 0) {
                                        milestoneErrors.push({ source: node, target: target });
                                    }
                                }
                                if (node.horizon === target.horizon) {
                                    if (node.level === target.level) {
                                        target.level--;
                                        changes = true;
                                    }
                                }
                            });
                    });
            }
            if (milestoneErrors.length > 0) {
                window.MunroMapApp.logger.warn("The following nodes are linked to a milestone, this is not best practice.", milestoneErrors);
            }

            var levelsCount = that
                .munroMap
                .horizons
                .reduce(function (a, b, i) {
                    return (a.levels || a) + (b.levels || 1);
                });

                window.MunroMapApp.logger.debug("Total no. levels: " + levelsCount + " over " + that.munroMap.horizons.length + " horizons", clone(that.munroMap));

            var h = Math.round(Math.abs((canvas.height - (that.munroMap.horizons.length * canvas.margin.top)) / levelsCount));
            var prevHorizonY = 0 - h - canvas.margin.top;

            // build horizons
            that
                .munroMap
                .horizons
                .forEach(function (horizon, i) {
                    var initiativeCount = that
                        .munroMap
                        .nodes
                        .filter(function (v) {
                            return v.horizon === horizon.id;
                        })
                        .length;
                    horizon = Object.assign(horizon, {
                        initiativeCount: initiativeCount,
                        counter: 0,
                        margin: canvas.margin.top,
                        height: h * horizon.levels,
                        x: 0,
                        y: prevHorizonY + h + canvas.margin.top
                    });
                    prevHorizonY += horizon.height + canvas.margin.top;
                    window.MunroMapApp.logger.debug("Horizon: " + horizon.name, "Horizon levels: " + horizon.levels, "Y: " + horizon.y, "Height: " + horizon.height, clone(that.munroMap));
                });

            that
                .munroMap
                .nodes
                .forEach(function (node) {
                    var horizon = that.SelfHelp.initiativeSelf.getHorizonDetails(that.munroMap.horizons, node);
                    node = Object.assign(node, {
                        x: (canvas.width / (horizon.initiativeCount + 1)) * ++horizon.counter,
                        y: horizon.y + (horizon.height * ((horizon.levels + 1 - node.level) / (horizon.levels + 1))),
                        height: h * 2 / 3,
                        width: h * 2 / 3,
                    });
                });

            // build roads
            that
                .munroMap
                .nodes
                .forEach(function (node) {
                    var weight = 0;
                    switch (node.size = (node.size || "M").toUpperCase()) {
                        case "XS":
                            weight = 1;
                            break;
                        case "S":
                            weight = 2;
                            break;
                        case "M":
                            weight = 3;
                            break;
                        case "L":
                            weight = 5;
                            break;
                        case "XL":
                            weight = 7;
                            break;
                        default:
                            weight = 0;
                    }

                    node = Object.assign(node, {
                        weight: weight
                    });

                    if (node.links.indexOf(node.id) > -1)
                        throw "Node is linked to itself: " + node.name;

                    node
                        .links
                        .forEach(function (link) {
                            var target = that.SelfHelp.linkSelf.FindTarget(that.munroMap.nodes, link);
                            var type = (node.type === "milestone" ? "milestone" : "path");
                            that
                                .munroMap
                                .roads
                                .push({
                                    id: that.munroMap.roads.length + 1,
                                    type: type,
                                    source: {
                                        id: node.id,
                                        name: node.name,
                                        x: node.x,
                                        y: node.y + (h / that.munroMap.horizons.length)
                                    },
                                    target: {
                                        id: target.id,
                                        name: target.name,
                                        x: target.x,
                                        y: target.y - (h / that.munroMap.horizons.length)
                                    }
                                });
                        });
                });

            function findAndPush(name, text) {
                if (that.munroMap.nodes.filter(function (d, i) {
                    return d.type === name;
                }).length > 0) {
                    that
                        .munroMap
                        .legend
                        .push({ name: text, category: name, type: name })
                }
            }

            // build legend
            findAndPush("milestone", "Milestone");
            findAndPush("decisionpoint", "Decision Point");
            findAndPush("endpoint", "End Point");
            var atleastonecompleted = false;
            that
                .munroMap
                .nodes
                .forEach(function (node) {
                    if (node.category) {
                        if (that.munroMap.legend.filter(function (d, i) {
                            return d.category === node.category;
                        }).length === 0) {
                            that
                                .munroMap
                                .legend
                                .push({ name: node.category, category: node.category, type: 'initiative' });
                        }
                    }
                    if (node.completed) {
                        atleastonecompleted = true;
                    }
                });

            if (atleastonecompleted) {
                if (that.munroMap.legend.filter(function (d, i) {
                    return d.category === 'completed';
                }).length === 0) {
                    that
                        .munroMap
                        .legend
                        .push({ name: 'Done', category: 'completed', type: 'checkmark' });
                }
            }

            that.Loading.Stop("YJiUjnrMe0yAEep9MXDw0g==");

            resolve();
        });
    }
}