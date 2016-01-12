# Rubik's Cube Timer

The Rubik's Cube Timer allows you to record and manage your cube records. It's features and design is strongly influenced by [Cube Timer](http://www.cubetimer.com/), but uses a more modern design.

## Development

Cube Timer uses [Grunt](http://gruntjs.com/) as build system, which must be installed using npm. Node.js packages the command npm, so it needs to be installed as well. On Mac you could use [Homebrew](http://brew.sh/) to do that. At last we need [Bower](http://bower.io/) to load additional requirements.

```
brew install nodejs
npm install -g grunt-cli bower
```

As soon as `bower` and `grunt` are available as commands the build can be initialised.

```
bower install
grunt
```

### Building

The *dist* task creates a distribution directory **dist** which contains the entry point index.html and all relevant resources. The dist directory can also be used as the Apache DocumentRoot.

```
grunt dist
```

### Watching

Any change within the src directory must be followed by a `grunt dist` to reflect the changes into the dist directory. To avoid doing this manually, Grunt offers the watch task: it watches a set of files for changes and invokes the given tasks after a change has been identified.

```
grunt watch
```

## Sources

* Countdown sound: [Beep](http://soundbible.com/1251-Beep.html)
* Start sound: [Censor Beep](http://soundbible.com/838-Censor-Beep.html)
* Icon: [Rubik Cube icon](http://www.iconspedia.com/icon/rubik-cube-1165-.html)
