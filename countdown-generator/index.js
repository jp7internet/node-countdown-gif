const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const moment = require('moment');
const request = require('request');

module.exports = {
    init: function (time, width = 200, height = 200, color = "000000", bg = "FFFFFF", name = "test", frames = 30, font = "monospace", message = "That's all folks!", mode = "M", showDays = true, millis = false, cb) {

        let diff = this.timeDiff(time, message);

        var children = millis ? process.env.FRAME_COUNT : 1;

        var start = Date.now();
        for (var i = 0; i < children; i++) {
            this.encode(i, children, cb, start);
        }
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
    encode: function(index, children, cb, start) {
        var offset = 1 + (30 * index);
        var limit = 30 + (30 * index);

        var options = {
            uri: 'http://localhost:400' + (index + 1) + "?offset=" + offset + "&limit=" + limit
        };

        request(options, function(response) {

            var cmd = "convert -delay 100 tmp/outputserver400" + (index + 1) + "{" + offset + ".." + limit + "}.bmp tmp/animation_400" + (index + 1) + ".gif";
            console.log(cmd);

            exec(cmd, (error, stdout, stderr) => {
                console.log('Generated tmp/animation_400' + (index + 1) + '.gif');

                if (index === children - 1) { // Last request responded
                    typeof cb === 'function' && cb();
                    console.log(Date.now() - start, ' milliseconds to generate PNGs.');
                }
            });
        });
    }
}