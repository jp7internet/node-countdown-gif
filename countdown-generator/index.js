'use strict';

const fs = require('fs');
const path = require('path');
const GIFEncoder = require('gifencoder');
const Canvas = require('canvas');
const moment = require('moment');

module.exports = {
    /**
     * Initialise the GIF generation
     * @param {string} time
     * @param {number} width
     * @param {number} height
     * @param {string} color
     * @param {string} bg
     * @param {string} name
     * @param {number} frames
     * @param {requestCallback} cb - The callback that is run once complete.
     */
    pad: function(str, char, length) {
        char = char || '0';
        str = String(str);

        return str.length >= length ? str : char.repeat(length - str.length) + str;
    },
    init: function(time, width=200, height=200, color='ffffff', bg='000000', name='default', frames=30, font='Courier New', message = 'Promoção Encerrada!', mode = 'L', showDays = true, showMillis = false, cb){
        console.log(process.env.FRAME_COUNT);

        // Set some sensible upper / lower bounds
        this.width = this.clamp(width, 150, 1000);
        this.height = this.clamp(height, 150, 1000);
        this.frames = this.clamp(frames, 1, 90);
        
        this.bg = '#' + bg;
        this.textColor = '#' + color;
        this.name = name;
        
        // loop optimisations
        this.halfWidth = Number(this.width / 2);
        this.halfHeight = Number(this.height / 2);

        this.quarterWidth = Math.floor(Number(this.width / 4));
        this.quarterHeight = Math.floor(Number(this.height / 4));
        
        this.encoder = new GIFEncoder(this.width, this.height);
        this.canvas = new Canvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d');

        this.fontFamily = font;

        this.message = message;
        this.mode = mode;

        this.showDays = showDays === 'true';
        this.showMillis = showMillis === 'true';
        
        // calculate the time difference (if any)
        let timeResult = this.time(time);
        
        // start the gif encoder
        this.encode(timeResult, cb);
    },
    /**
     * Limit a value between a min / max
     * @link http://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
     * @param number - input number
     * @param min - minimum value number can have
     * @param max - maximum value number can have
     * @returns {number}
     */
    clamp: function(number, min, max){
        return Math.max(min, Math.min(number, max));
    },
    /**
     * Calculate the diffeence between timeString and current time
     * @param {string} timeString
     * @returns {string|Object} - return either the date passed string, or a valid moment duration object
     */
    time: function (timeString) {
        // grab the current and target time
        let target = moment(timeString);
        let current = moment();
        
        // difference between the 2 (in ms)
        let difference = target.diff(current);
        
        // either the date has passed, or we have a difference
        if(difference <= 0){
            return this.message;
        } else {
            // duration of the difference
            return moment.duration(difference);
        }
    },
    /**
     * Encode the GIF with the information provided by the time function
     * @param {string|Object} timeResult - either the date passed string, or a valid moment duration object
     * @param {requestCallback} cb - the callback to be run once complete
     */
    encode: function(timeResult, cb){
        let enc = this.encoder;
        let ctx = this.ctx;
        let tmpDir = process.cwd() + '/tmp/';

        // create the tmp directory if it doesn't exist
        if (!fs.existsSync(tmpDir)){
            fs.mkdirSync(tmpDir);
        }
        
        let filePath = tmpDir + this.name + '.gif';
        
        // pipe the image to the filesystem to be written
        let imageStream = enc
                .createReadStream()
                    .pipe(fs.createWriteStream(filePath));
        // once finised, generate or serve
        imageStream.on('finish', () => {
            // only execute callback if it is a function
            typeof cb === 'function' && cb();
        });
        
        // estimate the font size based on the provided width
        let fontSize = Math.floor(this.width / 12) + 'px';
        let fontFamily = this.fontFamily; // monospace works slightly better
        
        // set the font style
        ctx.font = [fontSize, fontFamily].join(' ');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let mult = this.showMillis ? process.env.FRAME_COUNT : 1;
        let delay = 1000 / mult;

        // start encoding gif with following settings
        enc.start();
        enc.setRepeat(0);
        enc.setDelay(delay);
        enc.setQuality(10);

        // if we have a moment duration object
        let min = 1 + (delay * (mult - 1));
        let max = delay * mult;
        if(typeof timeResult === 'object'){
            for(let i = 0; i < this.frames * mult; i++){
                // declare string array
                let string = [];

                let days = Math.floor(timeResult.asDays());
                let hours = Math.floor(timeResult.asHours() - (days * 24));
                let minutes = Math.floor(timeResult.asMinutes()) - (days * 24 * 60) - (hours * 60);
                let seconds = Math.floor(timeResult.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);

                // make sure we have at least 2 characters in the string
                days = (days.toString().length == 1) ? '0' + days : days;
                hours = (hours.toString().length == 1) ? '0' + hours : hours;
                minutes = (minutes.toString().length == 1) ? '0' + minutes : minutes;
                seconds = (seconds.toString().length == 1) ? '0' + seconds : seconds;
                
                // build the date string
                string = [days, hours, minutes, seconds];

                var sub = {
                    S: ['D', 'H', 'M', 'S'],
                    M: ['Dias', 'Horas', 'Min.', 'Seg.'],
                    L: ['Dias', 'Horas', 'Minutos', 'Segundos']
                };


                // if this.showDays === false, convert days into hours
                if (!this.showDays) {   
                    hours = this.pad(String(parseInt(hours) + (days * 24)), "0", 2);

                    string.shift();
                    string[0] = hours;

                    for (var key in sub) {
                        sub[key].shift();
                    }
                }

                // if this.showMillis, calculate milliseconds and append
                if (this.showMillis) {
                    let milliseconds = this.clamp(Math.floor(Math.random() * (max - min + 1)) + min, 0, 999); // Must be less than 1000
                    min -= delay;
                    max -= delay;

                    sub["S"].push('ms');
                    sub["M"].push('Mil.');
                    sub["L"].push('Milissegundos');

                    string.push(this.pad(milliseconds, '0', 3));
                }
                
                // paint BG
                ctx.fillStyle = this.bg;
                ctx.fillRect(0, 0, this.width, this.height);

                // Include days/hours/minutes/seconds text
                var block = (this.width / string.length) / 2;
                for (var j = 0; j < string.length; j++) {
                    ctx.font = [fontSize, fontFamily].join(' ');
                    // paint text
                    ctx.fillStyle = this.textColor;
                    ctx.fillText(string[j], block, this.halfHeight + this.quarterHeight / 2);

                    // colons - insert if not last element
                    if (j < string.length - 1) { 
                        ctx.textAlign = 'right';
                        ctx.fillText(":", (this.width / string.length) * (j + 1), this.halfHeight + this.quarterHeight / 2);
                        ctx.textAlign = 'center';
                    }

                    // subtitle text
                    ctx.font = [(Math.floor(this.width / 24) + 'px'), fontFamily].join(' ');
                    // ctx.fontFamily = null;
                    ctx.fillStyle = this.textColor;
                    ctx.fillText(sub[this.mode][j], block, this.quarterHeight);
                    block += (this.width / string.length);
                }
                
                // add finalised frame to the gif
                enc.addFrame(ctx);
                
                // remove a second for the next loop
                if (i % mult === 0 && i != 0) {
                    min = 1 + (delay * (mult - 1));
                    max = delay * mult;
                    timeResult.subtract(1, 'seconds');
                }
            }
        } else {
            // Date has passed so only using a string
            
            // BG
            ctx.fillStyle = this.bg;
            ctx.fillRect(0, 0, this.width, this.height);
            
            // Text
            ctx.fillStyle = this.textColor;
            ctx.fillText(timeResult, this.halfWidth, this.halfHeight);
            enc.addFrame(ctx);
        }
        
        // finish the gif
        enc.finish();
    }
};
