var webserver = require('webserver');
var server = webserver.create();
var system = require('system');

var tmpDir = system.env['TMPDIR'];
var port = system.args[1];

var service = server.listen(port, function(request, response) {
    // var qsresults = request.url.match(/\d+/g);
    // var offset = parseInt(qsresults[0]);
    // var limit = parseInt(qsresults[1]);

    var body = JSON.parse(request.post);

    var start = performance.now();
    var output = tmpDir + 'outputserver'+port;
    
    console.log('Abrindo');
    var page = require('webpage').create();
    page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36';
    page.viewportSize = { width: body.width, height: body.height };

    page.open('http://localhost:' + body.port + '/templates/countdown.html', function (status) {
        console.log(status);
        
        if (status !== 'success') {
            console.log(status);
            console.log(
              "Error opening url \"" + page.resourceErrorObj.url + "\": " +
              page.resourceErrorObj.errorString
            );
            console.log('Unable to load the address!');
        } else {
            function rasterize(i) {
              console.log('Renderizando: ' +output+i+'.bmp');
              page.render(output+i+'.bmp');
            }

            page.evaluate(function(body) {
                var element = document.getElementById('teste');

                element.style["width"] = body.width + "px";
                element.style["height"] = body.height + "px";
                element.style["font-family"] = body.fontFamily;
                element.style["font-size"] = body.fontSize;
                element.style["color"] = body.color;
                element.style["background-color"] = body.bg;
                element.style["line-height"] = body.height + "px";
            }, body);
            
            var j = 0;
            for (var i = body.offset;i <= body.limit;i++) {
                var date = body.dates[j++].join(":");

                page.evaluate(function(date) {
                    document.getElementById('teste').innerHTML = date;
                }, date);  

                // next step
                rasterize(i);
            }
            
            response.statusCode = 200;
            response.write((performance.now() - start) + " milliseconds.");
            response.close();
        }
    }); 
});

console.log('Listenning');