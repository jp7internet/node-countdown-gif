const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const moment = require('moment');
const request = require('request');
const Mustache = require('mustache');
const fs = require('fs');
const os = require('os');
const tmpDir = os.tmpdir();
const slug = require('slug');

module.exports = {
    init: function (time, width = 200, height = 200, color = "000000", bg = "FFFFFF", name = "test", frames = 30, font = "monospace", message = "Promoção Encerrada!", mode = "M", showDays = true, millis = false, cb) {

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
        this.mode = mode;
        this.width = width;
        this.height = height;
        this.fontFamily = font;
        this.color = color;
        this.bg = bg;
        this.name = name;


        diff = this.timeDiff(time, message);

        var dates = this.getDatesHTML(this.getDates(diff));
        // Set request body
        var contents = {
            dates: dates,
            width: this.width,
            height: this.height
        };

        // Start encoding
        console.log("Using %d servers.", procs);

        var start = Date.now();
        var promises = [];

        if (contents.dates.length === 1) {
            promises.push(this.encode(0, contents));
        } else {
            for (var i = 0; i < procs; i++) {
                promises.push(this.encode(i, contents));
            }
        }

        Promise.all(promises).then(function() {
            console.log('Generated animations in %d milliseconds.', Date.now() - start);

            let delay = 100;

            if (this.millis) {
                delay /= process.env.FRAME_RATE;
            }

            let filePath = tmpDir + '/' + slug(this.name, '_') + '.gif';

            console.log(filePath);

            exec('convert -delay ' + delay + ' ' + tmpDir + '/animation*.gif ' + filePath, (error, stdout, stderr) => {
                if (error) {
                    console.error('exec error:', error);
                    return;
                }

                console.log('stdout:', stdout);
                console.log('stderr:', stderr);
                

                typeof cb === 'function' && cb();

                execSync('rm ' + tmpDir + '/output*.bmp');
                execSync('rm ' + tmpDir + '/animation*.gif');
            });
        }.bind(this))
    },
    initPreview: function (time, width = 200, height = 200, color = "000000", bg = "FFFFFF", name = "test", frames = 30, font = "monospace", message = "Promoção Encerrada!", mode = "M", showDays = true, millis = false, cb) {
        
        this.showDays = showDays === 'true';
        this.millis = millis === 'true';

        var diff = this.timeDiff(time, message);

        var core = {
            "width": width + "px",
            "height": height + "px",
            "fontFamily": font,
            "fontSize": "5vw",
            "color": "#" + color,
            "bg": "#" + bg,
            "divFontSize": "2.5vw"
        };

        var format = this.getFormat(mode);

        var dates = [];

        if (typeof diff === 'object') {
            
            let days = Math.floor(diff.asDays());
            let hours = Math.floor(diff.asHours()) - (days * 24);
            let minutes = Math.floor(diff.asMinutes()) - (days * 24 * 60) - (hours * 60);
            let seconds = Math.floor(diff.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);


            if (this.showDays) {
                dates.push({ text: this.pad(days, '0', 2) });
            } else {
                days = 0;
                hours = Math.floor(diff.asHours());
            }

            dates.push({ text: this.pad(hours, '0', 2) });
            dates.push({ text: this.pad(minutes, '0', 2) });
            dates.push({ text: this.pad(seconds, '0', 2) });

            if (this.millis) {
                let milliseconds = Math.floor(Math.random() * 999);

                dates.push({ text: this.pad(milliseconds, '0', 3) });
            }

            var data = Object.assign({
                "divWidth": Math.floor(width / dates.length) + "px",
                "format": format,
                "dates": dates
            }, core);
        }
        else {
            var data = Object.assign({ end: diff, divWidth: "100%" }, core);
        }

        cb(data);

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
    getDatesHTML: function(dates) {
        var datesHTML = [];

        var format = this.getFormat(this.mode);

        var template = fs.readFileSync('public/templates/countdown.mustache', "utf8");

        var core = {
            "width": this.width + "px",
            "height": this.height + "px",
            "fontFamily": this.fontFamily,
            "fontSize": "5vw",
            "color": "#" + this.color,
            "bg": "#" + this.bg,
            "divFontSize": "2.5vw"
        }

        if (dates.length > 1) {
            for (var i = 0; i < dates.length; i++) {
                var data = Object.assign({
                    "divWidth": Math.floor(this.width / dates[i].length) + "px",
                    "format": format,
                    "dates" : dates[i]
                }, core);

                datesHTML.push(Mustache.render(template, data));
            }
        } else {
            var data = Object.assign({
                "divWidth": "100%"
            }, dates[0], core);

            datesHTML.push(Mustache.render(template, data));
        }

        return datesHTML;
    },
    getDates: function(time) {

        var dates = [];

        // set minimum and maximum millisecond threshold
        let min = 1 + (this.delay * (this.multiplier - 1));
        let max = this.delay * this.multiplier;
        if (typeof time === 'object') {

            for (var i = 0; i < this.frames; i++) {

                var dateObjects = [];

                let days = Math.floor(time.asDays());
                let hours = Math.floor(time.asHours() - (days * 24));
                let minutes = Math.floor(time.asMinutes()) - (days * 24 * 60) - (hours * 60);
                let seconds = Math.floor(time.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);

                if (!this.showDays) {
                    hours += days * 24;
                    days = 0;
                }

                if (days > 0) {
                    dateObjects.push({ text: this.pad(days, '0', 2) });
                }

                dateObjects.push({ text: this.pad(hours, '0', 2) });
                dateObjects.push({ text: this.pad(minutes, '0', 2) });
                dateObjects.push({ text: this.pad(seconds, '0', 2) });

                if (this.millis) {
                    let milliseconds = this.clamp(Math.floor(Math.random() * (max - min + 1)) + min, 0, 999); // Must be less than 1000

                    min -= this.delay;
                    max -= this.delay;

                    dateObjects.push({ text: this.pad(milliseconds, '0', 3) });
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

                dates.push(dateObjects);
            }

        } else {
            dates.push({ end: time });
        }

        return dates;
    },
    getFormat: function(mode) {
        var modes = {
            S: [
                { text: "D" },
                { text: "H" }, 
                { text: "M" }, 
                { text: "S" }
            ],
            M: [
                { text: "Dias" },
                { text: "Horas" },
                { text: "Min." },
                { text: "Seg." }
            ],
            L: [
                { text: "Dias" },
                { text: "Horas" },
                { text: "Minutos" },
                { text: "Segundos" }
            ]
        };

        if (!this.showDays) {
            for (key in modes) {
                modes[key].shift();
            }
        }

        if (this.millis) {
            modes["S"].push({ text: "ms" });
            modes["M"].push({ text: "Mil." });
            modes["L"].push({ text: "Milissegundos" });
        }

        return modes[mode];
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

        var options = {
            uri: 'http://localhost:' + port,
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

                var cmd = "convert -delay " + imageMagickDelay + " " + tmpDir + "/outputserver" + port + "*.bmp " + tmpDir + "/animation_" + port + ".gif";
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