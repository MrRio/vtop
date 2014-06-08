vtop
=========

A graphical activity monitor for the command line. Written in node.js.

![](docs/example.gif)

How to install
---

If you haven't already got Node.js, then [go get it](http://nodejs.org/).

```
npm install -g vtop
```

Running
---

This is pretty simple too.

```
vtop
```

FAQs
----

### How does it work?

It uses Unicode braille characters to draw CPU and Memory charts, helping you visualize spikes. We also group processes with the same name together.

### I think the CPU % is coming out wrong.

We calculate the CPU percentage as a total of your overall system power. 100% is all cores and HyperThreads maxed out. This is different to how Apple Activity monitor works.

### I think you should change CPU percentage to how Apple's Activity Monitor works.

No I like it this way. Feel free to submit a PR with it as a config option though.

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

