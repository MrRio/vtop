#!/bin/sh
':' //; # This line below fixes xterm color bug on Mac - https://github.com/MrRio/vtop/issues/2
':' //; if [[ $TERM == "xterm-color" && "$OSTYPE" == "darwin"* ]]; then export TERM=xterm-256color; fi
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

require('../app.js');