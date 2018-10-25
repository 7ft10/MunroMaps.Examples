$(document).ready(function() {   
    var isHandlerDragging = false;
    $(document).on('mousedown', function(e) {
        if (e.target === $('.handler')[0]) {
            isHandlerDragging = true;
        }
    }).on('mouseup', function(e) {
        isHandlerDragging = false;
    }).on('mousemove', function(e) {
        if (!isHandlerDragging) {
            return false;
        }
        var wrapper = $('.handler').parent('.wrapper');
        wrapper.find('.box:first').css("width", (e.clientX - wrapper.offset().left - 8) + 'px').css("flexGrow", 0);
    });
    $('.handler').parent('.wrapper').find('.box:first').css("width", '35%').css("flexGrow", 0);

    $("#exportToPNG").on("click", function() {
        var svg = $("#graph > svg")[0];
        if (typeof window.XMLSerializer != "undefined") {
            var svgData = (new XMLSerializer()).serializeToString(svg);
        } else if (typeof svg.xml != "undefined") {
            var svgData = svg.xml;
        }

        var img = document.createElement("img");
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));
        img.onload = function() {
            var canvas = document.createElement("canvas");
            var svgSize = svg.getBoundingClientRect();
            canvas.width = svgSize.width;
            canvas.height = svgSize.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var imgsrc = canvas.toDataURL("image/png");
            var a = document.createElement("a");
            a.download = "munromap.png";
            a.href = imgsrc;
            a.click();
        };
    });
    $.get("munro.css", function(munroCss) {               
        mermaid.initialize({
            startOnLoad: true,
            theme: "neutral",
            themeCSS: munroCss,
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: "basis"
            }
        });        
        function onchange() {
            $("#graph > *, #dgraph").remove();
            mermaid.render('graph', $("#definition").text().trim(), function(svgCode, bindFunctions){
                $("#graph").html(svgCode).css("max-width", "");
                var viewport = $("#graph").attr("viewbox").split(" ");
                $("#graph, #definition").css("height", viewport[3]).css("width", viewport[2]);
            });
        }
        $("#definition").on("input", onchange).load("example1.map", onchange);
    });
});