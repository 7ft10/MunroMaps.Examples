var qs = (function(a) {
  if (a == "") return {};
  var b = {};
  for (var i = 0; i < a.length; ++i)
  {
      var p=a[i].split('=', 2);
      if (p.length == 1)
          b[p[0]] = "";
      else
          b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
})(window.location.search.substr(1).split('&'));

;(function () {
  function setUpBoxResizing () {
    function resizeFirstBox (to) {
      $('.handler')
        .parent('.wrapper')
        .find('.box:first')
        .css('width', to)
        .css('flexGrow', 0)
    }
    var isHandlerDragging = false
    $(document).on('mousedown', function (e) {
      isHandlerDragging = e.target === $('.handler')[0]
    })
      .on('mouseup', function (e) {
        isHandlerDragging = false
      })
      .on('mousemove', function (e) {
        if (!isHandlerDragging)
          return false
        resizeFirstBox((e.clientX - $('.handler').parent('.wrapper').offset().left - 8) + 'px')
      })
    resizeFirstBox('0%')
  }

  function convertSVGTo (svg, type) {
    if (typeof window.XMLSerializer != 'undefined') {
      var svgData = (new XMLSerializer()).serializeToString(svg)
    } else if (typeof svg.xml != 'undefined') {
      var svgData = svg.xml
    }
    if (!svgData.match(/^ < svg[^ > ] + xmlns = "http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgData = svgData.replace(/^ < svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    if (!svgData.match(/^ < svg[^ > ] + "http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      svgData = svgData.replace(/^ < svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
    }
    svgData = '<?xml version="1.0" standalone="no"?>\r\n' + svgData
    switch (type) {
      case 'PNG':
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))

      case 'SVG':
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
    }
  }

  function setUpExportToSVG () {
    $('#exportToSVG')
      .on('click', function () {
        var svg = $('#graph > svg')[0]
        var a = document.createElement('a')
        a.download = 'munromap.svg'
        a.href = convertSVGTo(svg, 'SVG')
        a.click()
      })
  }

  function setUpExportToPNG () {
    $('#exportToPNG')
      .on('click', function () {
        var svg = $('#graph > svg')[0]
        var img = document.createElement('img')
        img.setAttribute('src', convertSVGTo(svg, 'PNG'))
        img.onload = function () {
          var canvas = document.createElement('canvas')
          var svgSize = svg.getBoundingClientRect()
          canvas.width = svgSize.width
          canvas.height = svgSize.height
          var ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          var imgsrc = canvas.toDataURL('image/png')
          var a = document.createElement('a')
          a.download = 'munromap.png'
          a.href = imgsrc
          a.click()
        }
      })
  }

  function createHeader () {
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttributeNS(null, 'x', 10)
    text.setAttributeNS(null, 'y', 40)
    text.appendChild(document.createTextNode($('#title').text()))
    return text;    
  }

  function fixGraphAfterRender (svgCode, bindFunctions) {
    $('#dgraph').remove()
    $('#graph')
      .html(svgCode)        
      .css('max-width', '')
    var viewport = $('#graph')
      .attr('viewbox')
      .split(' ')
    $('#graph, #graph > svg').css('height', viewport[3] * 1.1).css('width', viewport[2] * 1.1)
    $('svg circle').attr('r', '40') // standardize all the circle sizes 
    $('svg polygon').attr('points', '-20,20 130,20 130,-40 -20,-40 0,-10') // standardize all the milestones 
    $('#graph > svg')
      .append(createHeader())

    $('text[text()=legend]').text("What a legend");

    var newSvg = $("#graph").html();
    $("#graph").html("").html(newSvg); // refresh the svg
  }

  function initializeMap () {
    var config = {
      // logLevel: 1,
      startOnLoad: true,
      theme: 'neutral',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    }

    $.get('munro.css', function (munroCss) {
      mermaid.initialize($.extend(config, {themeCSS: munroCss}))
      function onchange () {
        $('#graph > *, #dgraph').remove()
        mermaid.render('graph', $('#definition').text().trim().replace(/\\n/g, '<br/>'), fixGraphAfterRender)
      }
      function onstylechange () {
        var additionalStyle = $('#additionalStyle').text()
        if (additionalStyle && additionalStyle.length > 0) {
          $('#graph > *, #dgraph').remove()
          mermaid.initialize($.extend(config, {
            themeCSS: munroCss + ' ' + additionalStyle
          }))
        }
        onchange()
      }

      var file = qs["file"];
      if (!file) file = 'Example1/example1'
      //var file = 'WMCoachingPlan/version_0_1'
      $('#definition, #title').on('input', onchange)
      $('#definition').load(file + '.map', onchange)
      $('#additionalStyle')
        .on('input', onstylechange)
        .load(file + '.css', onstylechange)
    })
  }

  $(document)
    .ready(function () {
      setUpBoxResizing()
      initializeMap()
      setUpExportToPNG()
      setUpExportToSVG()
    })
})()