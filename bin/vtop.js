#!/bin/sh
':' //; # This line below fixes xterm color bug on Mac - https://github.com/MrRio/vtop/issues/2
':' //; export TERM=xterm-256color
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"
'use strict'
require('../app.js');
