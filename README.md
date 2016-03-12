![Promotional Image](https://github.com/resamsel/cube-timer/raw/master/assets/images/promotional-tile-440x280.png "Promotional Image")

# Rubik's Cube Timer

[![Dependency Status](https://david-dm.org/resamsel/cube-timer.svg?style=flat)](https://david-dm.org/resamsel/cube-timer)
[![devDependency Status](https://david-dm.org/resamsel/cube-timer/dev-status.svg?style=flat)](https://david-dm.org/resamsel/cube-timer#info=devDependencies)

The Rubik's Cube Timer allows you to record and manage your cube records. It's
features and design is strongly influenced by [Cube
Timer](http://www.cubetimer.com/), but uses a more modern design.

The [Rubik's Cube Timer](https://chrome.google.com/webstore/detail/rubiks-cube-timer/oldnpmfiikmplicapjoijjkigkonkamb)
chrome app allows you to install and use the timer locally.

![Screenshot](https://github.com/resamsel/cube-timer/raw/master/assets/screenshots/screenshot-1.png "Screenshot")

## Development

Cube Timer uses [Grunt](http://gruntjs.com/) as build system, which must be
installed using npm. Node.js packages the command npm, so it needs to be
installed as well. On Mac you could use [Homebrew](http://brew.sh/) to do that.

```
brew install nodejs
npm install -g grunt grunt-cli
```

As soon as `grunt` is available as command the build can be initialised.

```
npm install
```

### Building

The *dist* task creates a distribution directory **dist** which contains the
entry point index.html and all relevant resources. The dist directory can also
be used as the Apache DocumentRoot.

```
grunt dist
```

### Watching

Any change within the src directory must be followed by a `grunt dist` to
reflect the changes into the dist directory. To avoid doing this manually,
Grunt offers the watch task: it watches a set of files for changes and invokes
the given tasks after a change has been identified.

```
grunt watch
```

### Packaging

The dist task creates a zip file in the dist directory. That file can then be
published in the chrome web store.

```
grunt dist
```

### Caveats

The Google API only works when the app is delivered from http://localhost/. To
use it, use a webserver that delivers the content of the dist directory.

## Sources

* Countdown sound: [Beep](http://soundbible.com/1251-Beep.html)
* Start sound: [Censor Beep](http://soundbible.com/838-Censor-Beep.html)
* Icon: [Rubik Cube icon](http://www.iconspedia.com/icon/rubik-cube-1165-.html)
