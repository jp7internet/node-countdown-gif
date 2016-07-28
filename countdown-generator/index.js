const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const moment = require('moment');
const request = require('request');
const os = require('os');
const tmpDir = os.tmpdir();

module.exports = {
    init: function (time, width = 200, height = 200, color = "000000", bg = "FFFFFF", name = "test", frames = 30, font = "monospace", message = "That's all folks!", mode = "M", showDays = true, millis = false, cb) {

        var procs = os.cpus().length;

        this.millis = millis === 'true';

        if (this.millis) { // If milliseconds are set to true, then multiply number of frames by frame rate specified in our .env
            frames *= process.env.FRAME_RATE;
        }

        // Round procs down to maximum divisor
        for (var i = procs; i > 0; i--) {
            if (frames % i === 0) {
                procs = i;
                break;
            }
        }

        // Declare object-scope variables
        this.frames = frames;
        this.partialFrames = this.frames / procs;
        this.showDays = showDays === 'true';
        this.multiplier = this.millis ? process.env.FRAME_RATE : 1;
        this.delay = 1000 / this.multiplier;

        let diff = this.timeDiff(time, message);

        var dates = this.getDates(diff);

        // Set request body
        var contents = {
            dates: dates,
            color: "#" + color,
            bg: "#" + bg,
            width: width,
            height: height,
            fontSize: Math.floor(width / 12),
            fontFamily: font,
            divWidth: Math.floor(width / dates[0].length), // All arrays in dates have the same length
            port: process.env.PORT || 3000 
        };

        // Start encoding
        console.log("Using %d servers.", procs);

        var start = Date.now();
        var promises = [];

        for (var i = 0; i < procs; i++) {
            promises.push(this.encode(i, contents));
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
    getDates: function(time) {

        var dates = [];

        // set minimum and maximum millisecond threshold
        let min = 1 + (this.delay * (this.multiplier - 1));
        let max = this.delay * this.multiplier;
        if (typeof time === 'object') {

            for (var i = 0; i < this.frames; i++) {

                var dateString = [];

                let days = Math.floor(time.asDays());
                let hours = Math.floor(time.asHours() - (days * 24));
                let minutes = Math.floor(time.asMinutes()) - (days * 24 * 60) - (hours * 60);
                let seconds = Math.floor(time.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);

                if (!this.showDays) {
                    hours += days * 24;
                    days = 0;
                }

                if (days > 0) {
                    dateString.push(this.pad(days, '0', 2));
                }

                dateString.push(this.pad(hours, '0', 2));
                dateString.push(this.pad(minutes, '0', 2));
                dateString.push(this.pad(seconds, '0', 2));

                if (this.millis) {
                    let milliseconds = this.clamp(Math.floor(Math.random() * (max - min + 1)) + min, 0, 999); // Must be less than 1000

                    min -= this.delay;
                    max -= this.delay;

                    dateString.push(this.pad(milliseconds, '0', 3));
                }

                if (this.millis) {
                    if (i !== 0 && i % this.multiplier === 0) {
                        // Reset millisecond thresholds
                        min = 1 + (this.delay * (this.multiplier - 1));
                        max = this.delay * this.multiplier;

                        // Subtract 1 second from timediff
                        time.subtract(1, 'seconds');
                    }
                }
                else {
                    time.subtract(1, 'seconds');
                }

                dates.push(dateString);
            }

        } else {
            dates.push(time);
        }

        return dates;
    },
    getFormat: function(mode) {
        var modes = {
            S: ["D", "H", "M", "S"],
            M: ["Dias", "Horas", "Min.", "Seg."],
            L: ["Dias", "Horas", "Minutos", "Segundos"]
        };

        if (!this.showDays) {

        }
    },
    pad: function(str, char, len) {
        str = str + '';
        char = char || '0';

        return str.length >= len ? str : char.repeat(len - str.length) + str;
    },
    clamp: function(n, min, max) {
        return Math.max(min, Math.min(n, max));
    },
    encode: function(index, contents) {
        var offset = 1 + (this.partialFrames * index);
        var limit = this.partialFrames + (this.partialFrames * index);

        var port = 4000 + (index + 1);

        let requestBody = Object.assign({}, contents);

        if (requestBody.dates.length > 1) {
            requestBody.dates = contents.dates.slice(offset - 1, limit);
        }

        requestBody.offset = offset;
        requestBody.limit = limit;

        var options = {
            uri: 'http://localhost:' + port + '?offset=' + offset + '&limit=' + limit,
            method: "POST",
            body: requestBody,
            json: true
        };

        let imageMagickDelay = 100;

        if (this.millis) {
            imageMagickDelay /= process.env.FRAME_RATE;
        }

        return new Promise((resolve, reject) => {
            request(options, function(response) {

                var cmd = "convert -delay " + imageMagickDelay + " " + tmpDir + "/outputserver" + port + "{" + offset + ".." + limit + "}.bmp " + tmpDir + "/animation_" + port + ".gif";
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