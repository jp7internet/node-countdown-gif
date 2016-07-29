# Gif countdown generator

The very simple app I have created allows you to generate a countdown timer animated gif depending on the URL parameters you provide. [View demo](https://date-gif.herokuapp.com/).

## Requirements

* PhantomJS
* Node.js
* ImageMagick

```bash
# Utils
apt install -y htop imagemagick
# Node.js
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt install -y nodejs
npm install -g pm2
# PhantomJS
apt install -y fontconfig ttf-mscorefonts-installer 
cd /tmp
wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
tar -jxvf phantomjs-2.1.1-linux-x86_64.tar.bz2
cd phantomjs-2.1.1-linux-x86_64
mv ? /usr/local/bin
```

## URL Parameters (*required)

* **time*** - Date &amp; time when your countdown will end [e.g. 2016-06-24T20:35]
* **frames** - number of frames (also number of seconds) the countdown will run before looping [defaults to 30]
* **width** - width in pixels [defaults to 200]
* **height** - height in pixels [defaults to 200]
* **bg** - hex colour code for the background [defaults to 000000]
* **color** - hex colour code for the text [defaults to ffffff]
* **name** - filename used for the generated gif [defaults to 'default']
* **font** - font family used on gif text (select from available fonts under `.fonts`)
            
## Generate Examples

These trigger a download. Change the URL from `/generate` to `/serve` when used in an image tag.

* **Basic**: [/generate?time=2018-09-24T20:35](https://date-gif.herokuapp.com/generate?time=2018-09-24T20:35&name=ex1)
* **Custom dimensions**: [/generate?time=2018-09-24T20:35&width=300&height=150](https://date-gif.herokuapp.com/generate?time=2018-09-24T20:35&width=300&height=150&name=ex2)
* **Custom colours**: [/generate?time=2018-09-24T20:35&bg=028900&color=adff00](https://date-gif.herokuapp.com/generate?time=2018-09-24T20:35&bg=028900&color=adff00&name=ex3)
* **Custom name & frames**: [/generate?time=2018-09-24T20:35&name=awesome-gif&frames=20](https://date-gif.herokuapp.com/generate?time=2018-09-24T20:35&name=awesome-gif&frames=20)

## Versions

Tested with and designed for:

* node 6.0.0
* cairo 1.8.6
