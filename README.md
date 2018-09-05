vtop
=========

[![Greenkeeper badge](https://badges.greenkeeper.io/MrRio/vtop.svg)](https://greenkeeper.io/) [![Build Status](https://travis-ci.org/MrRio/vtop.svg?branch=master)](https://travis-ci.org/MrRio/vtop)

A graphical activity monitor for the command line.

![](https://raw.githubusercontent.com/MrRio/vtop/master/docs/example.gif)

How to install
---

If you haven't already got Node.js, then [go get it](http://nodejs.org/).

```
npm install -g vtop
```

If you're on macOS, or get an error about file permissions, you may need to do ```sudo npm install -g vtop```. Don't do this if you're using [nvm](https://github.com/creationix/nvm).

Running
---

This is pretty simple too.

```
vtop
```

If you *really* like vtop, but your finger muscle memory means you keep typing 'top' then why not add an alias to ~/.bashrc.

```
alias top="vtop"
alias oldtop="/usr/bin/top"
```

Keyboard shortcuts
---

* Press 'u' to update to the latest version of vtop.
* Arrow up or k to move up the process list.
* Arrow down or j to move down.
* Arrow left or h to zoom the graphs in.
* Arrow right or l to zoom the graphs out.
* g to go to the top of the process list.
* G to move to the end of the list.
* dd to kill all the processes in that group

Mouse control
---

If your terminal supports mouse events (like iTerm) then
you can click on the items in the process list. As well as
use the scroll wheel. You can disable mouse control with
the `vtop --no-mouse` option.

FAQs
----

### How does it work?

It uses [drawille](https://github.com/madbence/node-drawille) to draw CPU and Memory charts with Unicode braille characters, helping you visualize spikes. We also group processes with the same name together.

### I think the CPU % is coming out wrong.

We calculate the CPU percentage as a total of your overall system power. 100% is all cores and HyperThreads maxed out. This is different to how Apple Activity monitor works.

### Can I change the color scheme?

Sure, just do:

```
vtop --theme wizard
```

This loads the theme file in themes/ with the same name. Make your own and send me a Pull Request :)

You could add this to your aliases if you'd like to use it always.

```
alias vtop="vtop --theme brew"
```

### What about measuring server req/s, log entries, etc etc?

Yeah that's on the list :) Feel free to send a pull request though. Check out the sensors/ folder.

### What license is this under?

MIT – do what you like with it :)

### Contributing 

Get stuck in – click the fork button, then clone to your local machine. Use the [GitHub Desktop client](https://desktop.github.com/) if you don't know Git. Tinker with the code then run this from the command line:

```
./bin/vtop.js
```

When you push it'll run the Standard JS checker http://standardjs.com/. If you run 'npm test' in your own terminal too, this runs in Travis, your PR will fail the test if this command fails.

[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


