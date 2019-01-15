"use strict";

function clone(o) {
    return JSON.parse(JSON.stringify(o));
}

window.MunroMapApp = new (function () {

    this.applicationServerPublicKey = 'BKmZlu0ctROKVsOkmdJbXr_ksmqvIXe6y595GVNYdPvpYpXsrJBygTIT_G63PT3llY0IUo3sXd_X1RkV9XEpNb4';

    this.logger = {
        _doit: function (method, args) {
            if (args.length === 1 && (typeof args[0] == 'string' || args[0] instanceof String))
                console[method].apply(console, ['%c [MunroMaps] %c' + args[0], 'color: blue;', 'color: black;']);
            else if (args.length === 1)
                console[method].apply(console, ['%c [MunroMaps] %c', 'color: blue;', 'color: black;', args]);
            else
                console[method].apply(console, ['%c [MunroMaps] %c' + args[0], 'color: blue;', 'color: black;', args.slice(1)]);
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

    var script = document.currentScript;
    var fullUrl = script.src;
    this.scriptFolder = fullUrl.substr(0, fullUrl.lastIndexOf('/') + 1);
    this.requires_startup = [
        this.scriptFolder + "munromapapp-loading.js",
    ];
    this.requires_serviceworkers = [
        this.scriptFolder + "munromapapp-serviceworkerregister.js"
    ];
    this.requires = this.requires_serviceworkers.concat(this.requires_startup).concat([
        this.scriptFolder + "munromapapp-exporting.js",
        this.scriptFolder + "munromapapp-eventhandling.js",
        this.scriptFolder + "munromapapp-schemavalidator.js",
        this.scriptFolder + "munromapapp-mapdraw.js",
        this.scriptFolder + "munromapapp-selfhelp.js",
        this.scriptFolder + "munromapapp-modaldialog.js",
        this.scriptFolder + "munromapapp-mapbuilder.js"
    ]);
    this.requires_and_resources = this.requires.concat([
        this.scriptFolder + "munromapapp.css",
        this.scriptFolder + "munromapapp-schema.json",
        this.scriptFolder + "munromapapp.js",
        this.scriptFolder + "manifest.json",
        this.scriptFolder + "logo-white.png",
        this.scriptFolder + "logo-white-192x192.png",
        this.scriptFolder + "logo-white-512x512.png",
        this.scriptFolder + "logo-blue-192x192.png",
        this.scriptFolder + "favicon.ico"
    ]);

    function d3Extentions() {
        d3.selection.prototype.last = function () {
            return d3.select(this.nodes()[this.size() - 1]);
        };
    }

    function checkWindowHash() {
        var that = window.MunroMapApp;
        if (window.location.hash && isNaN(window.location.hash.replace("#", "")) === false) {
            var id = Number.parseInt(window.location.hash.replace("#", ""));
            var nodes = that
                .munroMap
                .nodes
                .filter(function (i) {
                    return i.id === id;
                });
            if (nodes.length === 1) {
                var node = nodes[0];
                that.Loading.Start("724I/q0IpUalobbIVsJ1Cg==", "dialog for " + node.name);
                var check = setInterval(function () {
                    if (that.Loading.LoadingStack.length === 1) {
                        setTimeout(function () {
                            that.ModalDialog.modalSelf.Show(that.munroMap, node);
                            that.Loading.Stop("724I/q0IpUalobbIVsJ1Cg==");
                        }, 500);
                        clearInterval(check);
                        check = false;
                    }
                }, 500);
            }
        } else {
            window.location.replace("#");
            if (typeof window.history.replaceState == 'function') {
                history.replaceState({}, '', window.location.href.slice(0, -1));
            }
        }
    }

    function downloadNodeDetails() {
        var that = window.MunroMapApp;
        var q = [];
        that
            .munroMap
            .nodes
            .forEach(function (node) {
                if (node.detailsUrl && node.details) {
                    window.MunroMapApp.logger.warn("Cannot have both details and detailsUrl - url will be used.", clone(node), clone(that.munroMap));
                }
                if (node.detailsUrl && node.detailsUrl.length > 0) {
                    q.push(new Promise(function (resolve) {
                        that.Loading.Start(node.detailsUrl, node.detailsUrl);
                        d3
                            .text(node.detailsUrl)
                            .then(function (loadedDetails) {
                                window.MunroMapApp.logger.debug("Loaded details for '" + node.name + "' from " + node.detailsUrl);
                                node.details = escape(loadedDetails);
                                that.Loading.Stop(node.detailsUrl, node.detailsUrl);
                                resolve();
                            })
                            .catch(function (error) {
                                reject(error);
                            });
                    }));
                } else if (node.details instanceof Array) {
                    node.details = escape(node.details.join("<br />"));
                }
            });

        return q;
    }

    function getAdditionalSVGSymbols() {
        var that = window.MunroMapApp;
        // return d3.xml(that.scriptFolder + "app-assests.svg").then(function(value) { return
        // value.getElementById("additionalDefs").innerHTML; });
        return new Promise(function (resolve) {
            resolve(`
                    <defs id="additionalDefs">
                        <symbol id="goalSymbol" viewBox="0 -200 200 200">
                            <path transform="scale(0.016,-0.016)" d="M5600 9490 l0 -2220 -81 -132 c-45 -73 -270 -436 -501 -806 -230 -370 -513 -826 -630 -1015 -116 -188 -364 -587 -551 -887 -187 -300 -485 -779 -662 -1065 -177 -286 -493 -794 -702 -1130 -209 -335 -463 -745 -565 -910 -102 -165 -301 -486 -442 -713 -142 -228 -256 -416 -253 -418 2 -2 2140 -3 4750 -2 l4747 3 -196 315 c-108 173 -340 549 -517 835 -176 286 -478 774 -670 1085 -193 311 -497 804 -677 1095 -587 953 -1238 2001 -1533 2470 -159 253 -406 646 -548 872 l-259 413 2 657 3 658 1639 5 1638 5 -218 245 c-120 135 -362 409 -539 610 -177 201 -385 437 -464 525 -78 88 -140 165 -139 171 3 12 408 474 1028 1174 174 195 319 361 323 368 7 9 -398 12 -1987 12 l-1996 0 0 -2220z m2389 1473 c-18 -21 -181 -206 -363 -411 -182 -206 -335 -380 -340 -387 -7 -9 79 -112 304 -366 424 -478 430 -485 430 -492 0 -4 -384 -6 -852 -5 l-853 3 -3 848 -2 847 856 0 856 0 -33 -37z m-1692 -5003 c176 -283 387 -623 468 -755 81 -132 263 -424 403 -649 141 -226 255 -415 255 -421 0 -6 -81 -130 -180 -276 -99 -145 -230 -340 -293 -433 -111 -167 -113 -169 -130 -149 -83 104 -866 1023 -870 1023 -3 0 -203 -234 -444 -521 -241 -286 -439 -519 -440 -517 -2 2 -134 197 -294 435 l-292 431 162 259 c89 142 322 517 518 833 755 1217 794 1280 806 1267 6 -7 155 -244 331 -527z"/>
                        </symbol>
                        <symbol id="nowSymbol" viewBox="1000 -1400 1000 1500">
                            <path transform="scale(0.57,-0.57)" d="M3504 1933 c-140 -240 -525 -675 -805 -911 -110 -93 -129 -130 -40 -80 296 167 526 334 773 561 l98 89 47 -53 c220 -249 467 -455 669 -558 43 -23 84 -41 90 -41 5 0 32 -14 58 -31 27 -16 50 -29 52 -27 1 2 -33 32 -76 66 -239 193 -583 611 -805 979 l-32 54 -29 -48z m100 -203 c154 -228 365 -477 518 -611 99 -87 116 -112 29 -44 -150 118 -377 344 -540 538 -40 48 -75 87 -78 87 -3 0 -68 -61 -145 -135 -125 -122 -369 -335 -382 -335 -3 0 40 44 96 98 123 118 288 308 366 419 31 45 60 82 63 82 3 1 36 -44 73 -99z M3220 1964 c-14 -1 -126 -8 -250 -14 -124 -6 -279 -15 -345 -20 -66 -5 -185 -14 -265 -20 -80 -5 -221 -17 -315 -25 -93 -9 -209 -18 -257 -22 l-87 -6 -53 -71 c-68 -93 -308 -332 -428 -427 -106 -84 -223 -166 -318 -224 -34 -21 -61 -40 -58 -42 4 -5 178 86 261 137 214 131 430 313 570 481 l64 75 278 22 c153 13 341 29 418 37 77 8 208 21 290 30 267 27 717 84 724 90 5 5 -185 4 -229 -1z M3512 814 l-2 -370 -67 -13 c-281 -53 -389 -76 -643 -138 -275 -67 -278 -76 -16 -43 211 26 336 46 581 91 275 51 336 64 605 131 91 22 172 45 180 50 18 11 -81 5 -230 -16 -58 -8 -128 -17 -157 -21 l-52 -7 -30 48 c-39 60 -65 131 -96 254 -25 97 -61 291 -68 365 -2 22 -4 -127 -5 -331z M811 1046 c5 -5 372 -57 529 -75 341 -40 1188 -85 1165 -63 -10 9 -65 19 -280 48 -283 37 -497 57 -860 79 -226 14 -564 20 -554 11z M796 804 c-4 -93 -8 -211 -9 -263 l-2 -94 30 -9 c35 -10 490 -115 555 -128 25 -5 122 -25 215 -45 200 -42 616 -119 753 -140 53 -8 113 -17 132 -21 19 -4 32 -4 29 0 -12 13 -434 124 -744 195 -49 12 -108 26 -130 31 -109 26 -510 110 -620 131 -163 30 -165 30 -165 47 0 78 -24 440 -30 451 -4 8 -11 -62 -14 -155z M4206 753 c-6 -149 -12 -213 -20 -213 -8 0 -8 -2 0 -8 6 -4 9 -23 6 -44 -3 -29 -9 -38 -23 -38 -10 0 -54 -7 -96 -15 -43 -8 -161 -31 -263 -49 -323 -60 -801 -156 -973 -195 -23 -6 -85 -20 -137 -31 -52 -12 -103 -23 -112 -26 -16 -5 -18 3 -18 78 0 46 -5 207 -12 358 -12 251 -13 267 -20 185 -7 -82 -27 -686 -23 -693 7 -10 1103 212 1535 311 l185 42 -4 205 c-6 334 -15 384 -25 133z M2400 814 c-52 -30 -193 -105 -313 -167 -120 -61 -214 -113 -209 -115 23 -7 377 165 501 245 162 105 174 125 21 37z"/>
                        </symbol>
                        <symbol id="tshirtSymbol" viewBox="0 0 500 500">
                            <path d="M19.1529,121.429C19.1529,146.985,55.3254,175.149,78.0873,175.149C89.2055,175.149,89.6984,171.808,89.6984,207.062C89.6984,341.856,55.6289,399.845,55.6289,426.344C55.6289,438.699,59.0436,449.743,65.2007,452.087C71.0362,454.348,82.5936,459.149,86.4872,459.149C112.311,459.149,131.238,474.211,215.685,474.211C219.582,474.211,223.212,474.179,226.494,474.13C310.386,475.561,250.461,477.054,346.329,477.054C389.153,477.054,393.195,476.237,407.994,469.976C415.044,466.993,418.538,464.24,427.447,454.649C438.165,433.336,441.858,413.847,441.858,394.817C441.858,366.574,433.724,339.341,428.343,308.649C427.745,305.899,426.914,294.649,426.497,283.649C422.274,244.176,408.147,215.316,399.455,177.823C397.843,166.61,399.192,163.103,402.338,163.103C407.376,163.103,417.33,170.915,429.891,170.915C432.948,170.915,436.161,170.452,439.494,169.301C454.733,151.299,469.745,126.799,469.745,104.054C469.745,82.0831,453.581,51.7847,387.494,49.1268C359.168,47.7265,330.675,43.4055,302.212,43.4055C262.256,43.4055,252.266,51.1494,252.266,51.1494C251.188,51.1494,240.829,60.8746,223.083,60.8746C197.285,60.8746,182.451,43.3418,171.487,43.3418C159.29,43.3418,153.225,45.9344,140.994,47.0421C98.1705,58.1003,58.2297,78.4017,23.2443,105.051C20.4036,110.733,19.1529,116.207,19.1529,121.429Z M28.3681,121.436C28.3681,118.563,29.2495,115.747,31.2443,113.051C66.1983,87.6761,106.763,65.1255,148.994,55.0408C160.935,53.9575,164.864,52.5415,168.832,52.5415C169.327,52.5415,190.705,64.1494,193.83,64.1494C195.938,64.1494,217.012,74.5567,227.652,71.9295C247.554,70.9356,257.065,59.1494,260.266,59.1494C260.266,59.1494,269.393,51.7133,305.901,51.7133C330.413,51.7133,355.048,55.4191,379.494,57.1268C399.09,57.9149,421.697,60.8844,442.091,74.6022C454.829,84.5533,460.207,96.3587,460.207,108.763C460.207,138.574,432.737,162.952,424.176,162.952C419.431,162.952,414.586,159.297,406.661,151.899C405.602,149.516,394.596,151.198,392.562,154.054C391.155,156.03,390.355,163.709,390.355,171.579C390.355,207.643,419.211,243.8,418.497,291.649C420.259,338.107,432.768,353.388,432.768,394.547C432.768,412.335,429.333,429.83,419.447,446.649C411.457,455.251,406.854,461.713,383.946,467.043C378.045,468.417,348.371,469.231,323.079,469.231C305.262,469.231,289.62,468.827,285.994,467.93C283.794,467.386,260.619,466.576,234.494,466.13C197.686,465.502,185.23,464.962,179.156,463.734C151.449,458.607,122.002,458.144,94.4872,451.149C86.9977,450.406,80.2684,446.347,73.2007,444.087C67.1996,441.803,64.0729,435.773,64.0729,427.891C64.0729,419.33,96.3895,327.247,96.4928,256.534C96.4911,227.679,98.0413,222.87,98.0413,208.442C98.0413,193.841,97.0906,173.352,95.8745,167.899C95.2326,165.022,87.534,163.658,85.9943,166.149C85.2505,167.353,77.2867,167.491,75.9443,166.323C64.6555,160.577,28.3681,139.865,28.3681,121.436Z" />
                        </symbol>
                        <symbol id="checkmarkSymbol" viewBox="0 0 30 30">
                            <path d="M22.553,7.684c-4.756,3.671-8.641,7.934-11.881,12.924c-0.938-1.259-1.843-2.539-2.837-3.756C6.433,15.13,4.027,17.592,5.419,19.3c1.465,1.795,2.737,3.734,4.202,5.529c0.717,0.88,2.161,0.538,2.685-0.35c3.175-5.379,7.04-9.999,11.973-13.806C26.007,9.339,24.307,6.33,22.553,7.684z"/>
                        </symbol>
                    </defs>
                `)
        });
    }

    function getTemplates() {
        var q = [];
        d3
            .selectAll("script[type='text/template']")
            .each(function () {
                var that = d3.select(this);
                q.push(new Promise(function (resolve) {
                    d3.text(that.attr('src')).then(function (template) {
                        that.html(template);
                        resolve("Loaded template: " + that.attr("src"));
                        window.MunroMapApp.logger.debug("Loaded template: " + that.attr("src"));
                    });
                }));
            });
        return q;
    }

    function loadStylesheet() {
        return new Promise(function (resolve, reject) {
            try {
                var link = document.createElement("link");
                link.type = "text/css";
                link.rel = "stylesheet";
                link.href = '../munromapapp.css';
                document.getElementsByTagName("head")[0].appendChild(link);
                resolve();
            } catch (error) {
                reject(error);
            }
        })
    }

    function ApplicationInitiation(options) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.SchemaValidator.ValidateMap(options.map)
                .then(function (passedValidation) {
                    if (!passedValidation) {
                        that.munroMap = null;
                        reject("Validation has failed")
                        return;
                    }

                    that.munroMap = options.map;
                    if (!options.reindexNodes) {
                        window.MunroMapApp.logger.info("Reindexing disabled - to enable set start options { reindexNodes : true }");
                    } else {
                        that.MapBuilder.ReIndexNodes();
                    }
                })
                .then(function () {
                    Promise
                        .all(downloadNodeDetails())
                        .then(function () {
                            that.container = d3.select(".app").html(''); // refresh the app area
                            var canvas = that.MapDraw.CreateCanvas(that.container);
                            that.MapBuilder.Build(canvas).then(function () {
                                getAdditionalSVGSymbols()
                                    .then(function (additionalDefs) {
                                        that.MapDraw.Draw(that.container, canvas, additionalDefs);
                                        Promise.all(getTemplates()).then(function () {
                                            checkWindowHash();
                                        });
                                    });
                            });
                        }).then(function () {
                            resolve();
                            window.dispatchEvent(new CustomEvent("MunroMap:NewMapArrived", {
                                detail: {
                                    map: that.munroMap
                                }
                            }));
                        })
                })
        });
    }

    this.Start = function (options) {
        var that = this;

        if (!requirejs) {
            throw "requirejs not loaded. MunroMaps requires requirejs to be loaded.";
        }
        if (!d3) {
            throw "d3 not loaded. MunroMaps requires d3 to be loaded.";
        }

        return new Promise(function (resolve, reject) {
            d3Extentions();
            loadStylesheet();
            requirejs(that.requires_serviceworkers.concat(that.requires_startup), function () {
                that.Loading.Start("SyvhFrVglU+wa0SLKoEUMg==", "Munro Map");
                window.ServiceWorkerRegister.Start()
                    .then(function () {
                        requirejs(that.requires, function () {
                            ApplicationInitiation.apply(that, [options])
                                .then(function () {
                                    resolve();
                                })
                                .finally(function () {
                                    that.Loading.Stop("SyvhFrVglU+wa0SLKoEUMg==");
                                })
                                .catch(function (error) {
                                    reject();
                                    window.dispatchEvent(new CustomEvent("MunroMap:ApplicationError", {
                                        detail: {
                                            errors: error
                                        }
                                    }));
                                    window.MunroMapApp.logger.error(error);
                                });
                        })
                    })
                    .catch(function(error) {
                        reject(error);
                    });
                })
        });
    };

    return this;
});