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
mv phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin
```

## Set up the PhantomJS service

```bash
cd /usr/local/lib
wget https://gist.githubusercontent.com/ultimagriever/72fcb3e4446460638d65aecd2fbee98c/raw/2bce772ec376ad585f19ba7b22f585f9520ed37a/phantom.sh
chmod +x phantom.sh
ln -s /usr/local/lib/phantom.sh /usr/local/bin/phantom
cd /etc/systemd/system
wget https://gist.githubusercontent.com/ultimagriever/72fcb3e4446460638d65aecd2fbee98c/raw/2bce772ec376ad585f19ba7b22f585f9520ed37a/phantom.service
```

### Usage

    service phantom start
    service phantom stop
    service phantom restart

## URL Parameters (*required)

* **time*** - Date &amp; time when your countdown will end [e.g. 2016-06-24T20:35]
* **frames** - number of frames (also number of seconds) the countdown will run before looping [defaults to 30]
* **width** - width in pixels [defaults to 200]
* **height** - height in pixels [defaults to 200]
* **bg** - hex colour code for the background [defaults to 000000]
* **color** - hex colour code for the text [defaults to ffffff]
* **name** - filename used for the generated gif [defaults to 'default']
* **font** - font family used on gif text (select from available fonts under `.fonts`)

## Versions

Tested with and designed for:

* node 6.2.1
