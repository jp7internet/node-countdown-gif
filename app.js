'use strict';

// server
const express = require('express');
const app = express();
const path = require('path');
const os = require('os');
const tmpDir = os.tmpdir();

const publicDir = __dirname + '/public/';

const env = require('dotenv');

const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

env.config({ silent: true });

// canvas generator
const CountdownGenerator = require('./countdown-generator');

app.use(express.static(publicDir));
app.use(express.static(tmpDir));

// root
app.get('/', function (req, res) {
    res.sendFile(publicDir + 'index.html');
});

// serve the gif to a browser
app.get('/serve', function (req, res) {
    let {time, width, height, color, bg, name, frames, font, message, mode, showDays, millis} = req.query;

    if(!time){
        throw Error('Time parameter is required.');
    }

    CountdownGenerator.init(time, width, height, color, bg, name, frames, font, message, mode, showDays, millis, () => {
        // let filePath = tmpDir + name + '.gif';
        // res.sendFile(filePath);
        console.log('Callback');

        let filePath = tmpDir + '/' + name + '.gif';

        let delay = 100;

        if (millis === 'true') {
            delay /= process.env.FRAME_RATE;
        }

        exec('convert -delay ' + delay + ' ' + tmpDir + '/animation*.gif ' + filePath, (error, stdout, stderr) => {
            if (error) {
                console.error('exec error:', error);
                return;
            }

            console.log('stdout:', stdout);
            console.log('stderr:', stderr);

            res.sendFile(filePath);
            execSync('rm ' + tmpDir + '/output*.bmp');
            execSync('rm ' + tmpDir + '/animation*.gif');
        });
    });
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

module.exports = app;
