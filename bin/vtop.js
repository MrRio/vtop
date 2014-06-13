#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

require('../app.js');