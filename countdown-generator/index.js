const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const moment = require('moment');
const request = require('request');
const os = require('os');
const tmpDir = os.tmpdir();

module.exports = {
    init: function (time, width = 200, height = 200, color = "000000", bg = "FFFFFF", name = "test", frames = 120, font = "monospace", message = "That's all folks!", mode = "M", showDays = true, millis = false, cb) {

        let diff = this.timeDiff(time, message);

        var procs = os.cpus().length;

        // Round procs down to maximum divisor
        for (var i = procs; i > 0; i--) {
            if (frames % i === 0) {
                procs = i;
                break;
            }
        }

        // Declare object-scope variables
        this.partialFrames = frames / procs;

        console.log("Using %d servers.", procs);

        var start = Date.now();
        var promises = [];

        for (var i = 0; i < procs; i++) {
            promises.push(this.encode(i));
        }

        Promise.all(promises).then(function() {
            console.log('Generated animations in %d milliseconds.', Date.now() - start);
            typeof cb === 'function' && cb();
        })
    },
    timeDiff: function (dateString, message) {
        let target = moment(dateString);
        let current = moment();

        let difference = target.diff(current);

        if (difference <= 0) {
            return message;
        }

        return moment.duration(difference);
    },
    encode: function(index) {
        var offset = 1 + (this.partialFrames * index);
        var limit = this.partialFrames + (this.partialFrames * index);

        var port = 4000 + (index + 1);

        var options = {
            uri: 'http://localhost:' + port  + "?offset=" + offset + "&limit=" + limit
        };

        return new Promise((resolve, reject) => {
            request(options, function(response) {

                var cmd = "convert -delay 100 " + tmpDir + "/outputserver" + port + "{" + offset + ".." + limit + "}.bmp " + tmpDir + "/animation_" + port + ".gif";
                console.log(cmd);

                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        reject('exec error:' + error.Error);
                    }

                    resolve('Generated ' + tmpDir + '/animation_' + port + '.gif');
                });
            });
        });
    }
}