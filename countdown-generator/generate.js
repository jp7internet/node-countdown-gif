var webserver = require('webserver');
var server = webserver.create();
var system = require('system');

var tmpDir = system.env['TMPDIR'];
var port = system.args[1];

var service = server.listen(port, function(request, response) {
    var qsresults = request.url.match(/\d+/g);
    var offset = parseInt(qsresults[0]);
    var limit = parseInt(qsresults[1]);

    var start = performance.now();
    var output = tmpDir + 'outputserver'+port;
    
    console.log('Abrindo');
    var page = require('webpage').create();
    page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36';
    page.viewportSize = { width: 720, height: 300 };
    
    page.open('http://localhost:3000/templates/countdown.html', function (status) {
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
            
            for (var i = offset;i <= limit;i++) {
                page.evaluate(function(i) {
                    document.getElementById('teste').innerHTML = '14:32:'+i;
                }, i);  
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