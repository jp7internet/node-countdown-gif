var webserver = require('webserver');
var server = webserver.create();
var system = require('system');

var port = system.args[1];

var service = server.listen(port, function(request, response) {

    var payload = JSON.parse(request.post);

    var start = performance.now();
    var output = payload.path + '/' + 'frame_' + port;

    console.log('Abrindo');
    var page = require('webpage').create();
    page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36';
    page.viewportSize = { width: payload.width, height: payload.height };

    page.open('about:blank', function (status) {
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
              console.log('Renderizando: ' + output + '_' + i + '.bmp');
              page.render(output+ '_' + i + '.bmp');
            }

            function pad(str, char, len) {
                str = str + '';

                return str.length >= len ? str : new Array(len - str.length + 1).join(char) + str;
            }

            for (var i = 0; i < payload.dates.length; i++) {

                page.evaluate(function(date) {
                    document.write(date);
                    document.close();
                }, payload.dates[i]);  

                // next step
                rasterize(pad(i, '0', 3));
            }
            
            response.statusCode = 200;
            response.write((performance.now() - start) + " milliseconds.");
            response.close();
        }
    }); 
});

console.log('Listening on port ' + port);