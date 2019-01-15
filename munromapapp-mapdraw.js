"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.MapDraw = {

    CreateCanvas: function (main) {
        var rect = main
            .node()
            .getBoundingClientRect();
        var canvas = {
            outerwidth: rect.width - rect.left - (rect.right - rect.width),
            outerheight: rect.height,
            margin: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        };
        return Object.assign(canvas, {
            width: canvas.outerwidth - canvas.margin.left - canvas.margin.right,
            height: canvas.outerheight - canvas.margin.top - canvas.margin.bottom
        });
    },

    Draw: function (container, canvas, additionalDefs) {

        var that = window.MunroMapApp;

        that.Loading.Start("ZLIW/N5yE0qKrjThnAW0ow==", "Drawing SVG");

        container.style("height", canvas.height);

        var svgW = container
            .append("div")
            .classed("svg", true)
            .append("svg")
            .classed("svg-content-responsive", true)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + canvas.outerwidth + " " + canvas.outerheight)
            .attr("width", canvas.outerwidth)
            .attr("height", canvas.outerheight)

        var modal = container
            .append('aside')
            .attr('id', 'modal-dialog')
            .attr('class', 'modal')
            .style('opacity', 0)

        var defs = svgW.append("defs")

        defs
            .append("marker")
            .attr("id", "arrow")
            .attr("class", "arrowHead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")

        defs
            .append("symbol")
            .attr("id", "milestoneSymbol")
            .attr("viewBox", "-30 -30 60 60")
            .append("path")
            .attr("d", function (d) {
                return d3
                    .symbol()
                    .type(d3.symbolCross)
                    .size(1500)();
            })

        defs
            .append("symbol")
            .attr("id", "decisionpointSymbol")
            .attr("viewBox", "-30 -30 60 60")
            .append("path")
            .attr("d", function (d) {
                return d3
                    .symbol()
                    .type(d3.symbolDiamond)
                    .size(1500)();
            })

        defs
            .append("symbol")
            .attr("id", "initiativeSymbol")
            .attr("viewBox", "-30 -30 60 60")
            .append("path")
            .attr("d", function (d) {
                return d3
                    .symbol()
                    .type(d3.symbolCircle)
                    .size(1500)();
            })

        defs
            .append("symbol")
            .attr("id", "endpointSymbol")
            .attr("viewBox", "-30 -30 60 60")
            .append("path")
            .attr("d", function (d) {
                return d3
                    .symbol()
                    .type(d3.symbolStar)
                    .size(1500)();
            })

        defs
            .node()
            .innerHTML += additionalDefs

        var svg = svgW
            .append("g")
            .attr("transform", "translate(" + canvas.margin.left + "," + canvas.margin.top + ")");

        var horizonsSVG = svg
            .append("g")
            .classed('horizons', true)
            .selectAll('rect.horizon')
            .data(that.munroMap.horizons)
            .enter()
            .append('g')
            .attr('id', function (d) {
                return "horizon_" + d.id;
            })
            .classed('horizon', true)
            .attr("transform", that.SelfHelp.self.TranslateToXY)
            .attr('name', that.SelfHelp.self.Name)

        var horizonRectSVG = horizonsSVG
            .append("rect")
            .classed("horizonRect", true)
            .attr('x', 0)
            .attr('y', 0)
            .attr("width", canvas.width + canvas.margin.right)
            .attr("height", that.SelfHelp.self.Height)

        var horizonTextSVG = horizonsSVG
            .append("text")
            .text(that.SelfHelp.self.Name)
            .classed("horizonText", true)
            .attr("dx", 5)
            .attr("dy", 20)

        var nowRectSVG = svg
            .selectAll(".horizon")
            .last()
            .select("rect")
            .attr('width', ((canvas.width * (2 / 3)) - canvas.margin.right))

        var nowHorizonData = that.munroMap.horizons[that.munroMap.horizons.length - 1]
        var legendWidth = Math.floor(canvas.width * (1 / 3) / that.munroMap.legend.length);

        var legendSVG = svg
            .append("g")
            .classed('legends', true)
            .selectAll('rect.legend')
            .data(that.munroMap.legend)
            .enter()
            .append('g')
            .attr('id', function (d) {
                return "legend_" + (that.munroMap.legend.indexOf(d) + 1);
            })
            .attr('data-category', that.SelfHelp.initiativeSelf.Category)
            .attr('transform', function (d) {
                var x = ((canvas.width * (2 / 3)) - canvas.margin.right) + ((that.munroMap.legend.indexOf(d)) * legendWidth) + canvas.margin.right;
                return 'translate(' + x + ',' + (nowHorizonData.y + nowHorizonData.height * 1 / 3) + ')';
            })
            .classed('legend', true)
            .on("click", function (d) {
                this
                    .classList
                    .toggle("highlight-selected");
                d3
                    .selectAll("[data-category], [data-completed]")
                    .call(function (a) {
                        a
                            .nodes()
                            .forEach(function (node) {
                                var highlighton = false;
                                if (d.category === 'completed') {
                                    if ((node.attributes['data-completed'] && node.attributes['data-completed'].value === "true") ||
                                        (node.attributes['data-category'] && node.attributes['data-category'].value === d.category)) {
                                        highlighton = true;
                                    }
                                } else if (node.attributes['data-category'] && node.attributes['data-category'].value === d.category) {
                                    highlighton = true;
                                }
                                if (highlighton) {
                                    node
                                        .classList
                                        .toggle("highlight");
                                } else {
                                    node
                                        .classList
                                        .remove("highlight");
                                    node
                                        .classList
                                        .remove("highlight-selected");
                                }
                            });
                    })
            })

        var legendSymbolSVG = legendSVG
            .append('use')
            .attr("xlink:href", function (d) {
                return '#' + d.type + 'Symbol';
            })
            .attr("y", 0)
            .attr("x", 0)
            .attr("height", nowHorizonData.height * 2 / 3)
            .attr("width", legendWidth - canvas.margin.right)

        var legendTextSVG = legendSVG
            .append("text")
            .text(that.SelfHelp.self.Name)
            .classed("legendText", true)
            .attr("dy", that.SelfHelp.self.MiddledText)
            .call(that.SelfHelp.self.Wrap, legendWidth * 3 / 4)
            .selectAll("tspan")
            .attr("x", (legendWidth / 2) - canvas.margin.right / 2)

        var roadsSVG = svg
            .append("g")
            .classed('roads', true)
            .selectAll('path.road')
            .data(that.munroMap.roads)
            .enter()
            .append('path')
            .attr('id', function (d) {
                return "road_" + d.id;
            })
            .classed('road', true)
            .attr('class', that.SelfHelp.self.Class)
            .attr('source', that.SelfHelp.self.SourceName)
            .attr('target', that.SelfHelp.self.TargetName)
            .attr('d', that.SelfHelp.self.CurvedPath)
            .on("mouseover", that.SelfHelp.roadSelf.OnMouseOver)
            .on("mouseout", that.SelfHelp.roadSelf.OnMouseOut)

        var nodesSVG = svg
            .append("g")
            .classed('nodes', true)
            .selectAll('node')
            .data(that.munroMap.nodes)
            .enter()
            .append('g')
            .attr('id', function (d) {
                return "node_" + d.id;
            })
            .attr('data-node-id', that.SelfHelp.self.Id)
            .classed('node', true)
            .attr("class", that.SelfHelp.self.Class)
            .attr("data-horizon", that.SelfHelp.initiativeSelf.Horizon)
            .attr("data-category", function (d) {
                return d.category || d.type;
            })
            .attr("data-completed", function (d) {
                return d.completed;
            })
            .attr("transform", that.SelfHelp.self.TranslateToXY)
            .attr('name', that.SelfHelp.self.Name)
            .on("mouseover", that.SelfHelp.initiativeSelf.OnMouseOver)
            .on("mouseout", that.SelfHelp.initiativeSelf.OnMouseOut)
            .on("click", function (d) {
                that.ModalDialog.modalSelf.Show(that.munroMap, d);
            })

        var symbolsSVG = nodesSVG
            .append('use')
            .attr("xlink:href", that.SelfHelp.initiativeSelf.Symbol)
            .attr("width", that.SelfHelp.self.Width)
            .attr("height", that.SelfHelp.self.Height)
            .attr("transform", that.SelfHelp.initiativeSelf.TranslateToXY)
            .attr("class", that.SelfHelp.initiativeSelf.SymbolClass)
            .attr("data-category", that.SelfHelp.initiativeSelf.Category)
            .attr("data-completed", function (d) {
                return d.completed;
            })
            .attr("data-size", that.SelfHelp.initiativeSelf.Size)
            .attr("data-level", that.SelfHelp.initiativeSelf.Level)

        function drawCheckMarkIfCompleted(elem) {
            var parent = d3.select(this.parentNode);
            if (elem.completed === true && elem.id == parent.attr('data-node-id')) {
                parent
                    .append('use')
                    .attr('xlink:href', '#checkmarkSymbol')
                    .attr("width", that.SelfHelp.self.Width)
                    .attr("height", that.SelfHelp.self.Height)
                    .attr("transform", that.SelfHelp.initiativeSelf.TranslateToXY)
                    .classed("checkmark", true)
            }
        }

        var nodeTextSVG = nodesSVG
            .append("text")
            .text(that.SelfHelp.self.Name)
            .classed("nodeText", true)
            .attr("dx", that.SelfHelp.self.CenteredText)
            .attr("dy", that.SelfHelp.self.MiddledText)
            .call(that.SelfHelp.self.Wrap, 120)
            .call(function (elems) {
                elems.each(drawCheckMarkIfCompleted);
            })

        that.Loading.Stop("ZLIW/N5yE0qKrjThnAW0ow==");
    }
}