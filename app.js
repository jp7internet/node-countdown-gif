'use strict';

// server
const express = require('express');
const app = express();
const path = require('path');
const os = require('os');
const tmpDir = os.tmpdir();
const mu = require('mu2');
const bodyParser = require('body-parser');
const moment = require('moment');
const slug = require('slug');

const publicDir = __dirname + '/public/';

const env = require('dotenv');

env.config({ silent: true });

// canvas generator
const CountdownGenerator = require('./countdown-generator');

app.use(express.static(publicDir));
app.use(express.static(tmpDir));
app.use(bodyParser.json());

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
        console.log('Callback');
        let filePath = tmpDir + '/' + slug(name, '_') + '.gif';

        res.sendFile(filePath);
    });
});

app.get('/preview', function(req, res) {
    let {time, width, height, color, bg, name, frames, font, message, mode, showDays, millis} = req.query;

    mu.root = publicDir + '/templates';

    if (app.settings.env === 'development') {
        mu.clearCache();
    }

    CountdownGenerator.initPreview(time, width, height, 
        color, bg, name, frames, font, message, mode, 
        showDays, millis, data => {
            let stream = mu.compileAndRender('countdown.mustache', data);

            stream.pipe(res);
        });
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

module.exports = app;
