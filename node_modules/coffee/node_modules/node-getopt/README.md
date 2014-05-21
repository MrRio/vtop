node-getopt
===========
Featured command line parser.

Basic Usage
-----------

**Parse Commandline**

code: oneline.js

    // node-getopt oneline example.
    opt = require('node-getopt').create([
      ['s' , ''                    , 'short option.'],
      [''  , 'long'                , 'long option.'],
      ['S' , 'short-with-arg=ARG'  , 'option with argument'],
      ['L' , 'long-with-arg=ARG'   , 'long option with argument'],
      [''  , 'color[=COLOR]'       , 'COLOR is optional'],
      ['m' , 'multi-with-arg=ARG+' , 'multiple option with argument'],
      [''  , 'no-comment'],
      ['h' , 'help'                , 'display this help'],
      ['v' , 'version'             , 'show version']
    ])              // create Getopt instance
    .bindHelp()     // bind option 'help' to default action
    .parseSystem(); // parse command line

    console.info(opt);

`$ node oneline.js  foo -s --long-with-arg bar -m a -m b -- --others`

    { argv: [ 'foo', '--others' ],
      options:
       { s: true,
         'long-with-arg': 'bar',
         'multi-with-arg': [ 'a', 'b' ] } }

`$ node oneline.js -h`

    Usage: node oneline.js

      -s                         short option.
          --long                 long option.
      -S, --short-with-arg=ARG   option with argument
      -L, --long-with-arg=ARG    long option with argument
          --color[=COLOR]        COLOR is optional
      -m, --multi-with-arg=ARG+  multiple option with argument
          --no-comment
      -h, --help                 display this help
      -v, --version              show version

code: simple.js

    // examples/simple.js
    // argv parse
    Getopt = require('node-getopt');

    // Getopt arguments options
    //   '=':   has argument
    //   '[=]': has argument but optional
    //   '+':   multiple option supported
    getopt = new Getopt([
      ['s'],
      ['S' , '='],
      [''  , 'long-with-arg=ARG'],
      ['m' , '=+'],
      [''  , 'color[=COLOR]'],
      ['h' , 'help']
    ]).bindHelp();

    // process.argv needs slice(2) for it starts with 'node' and 'script name'
    // parseSystem is alias  of parse(process.argv.slice(2))
    // opt = getopt.parseSystem();
    opt = getopt.parse(process.argv.slice(2));
    console.info(opt);

`$ node simple.js foo -s --long-with-arg bar -m a -m b -- --others`

    { argv: [ 'foo', '--others' ],
      options: { s: true, 'long-with-arg': 'bar', m: [ 'a', 'b' ] } }

**Work with help**

code: help.js

    // examples/help.js
    // Works with help
    Getopt = require('node-getopt');

    getopt = new Getopt([
      ['s' , ''                    , 'short option.'],
      [''  , 'long'                , 'long option.'],
      ['S' , 'short-with-arg=ARG'  , 'option with argument'],
      ['L' , 'long-with-arg=ARG'   , 'long option with argument'],
      [''  , 'color[=COLOR]'       , 'COLOR is optional'],
      ['m' , 'multi-with-arg=ARG+' , 'multiple option with argument'],
      [''  , 'no-comment'],
      ['h' , 'help'                , 'display this help']
    ]);

    // Use custom help template instead of default help
    // [[OPTIONS]] is the placeholder for options list
    getopt.setHelp(
      "Usage: node help.js [OPTION]\n" +
      "node-getopt help demo.\n" +
      "\n" +
      "[[OPTIONS]]\n" +
      "\n" +
      "Installation: npm install node-getopt\n" +
      "Respository:  https://github.com/jiangmiao/node-getopt"
    );

    getopt.showHelp();

`$ node examples/help.js`

    Usage: node help.js [OPTION]
    node-getopt help demo.

      -s                         short option.
          --long                 long option.
      -S, --short-with-arg=ARG   option with argument
      -L, --long-with-arg=ARG    long option with argument
          --color[=COLOR]        COLOR is optional
      -m, --multi-with-arg=ARG+  multiple option with argument
          --no-comment
      -h, --help                 display this help

    Installation: npm install node-getopt
    Respository:  https://github.com/jiangmiao/node-getopt

Features
--------

short option name

    $ node simple.js -s
    { argv: [], options: { short: true } }

    $ node simple.js -S foo
    { argv: [], options: { 'short-with-arg': 'foo' } }

long option name

    $ node simple.js --long
    { argv: [], options: { long: true } }

    $ node simple.js --long-with-arg foo
    { argv: [], options: { 'long-with-arg': 'foo' } }

argument required

    $ node simple.js --long-with-arg
    ERROR: option long-with-arg need argument

    $ node simple.js --long-with-arg foo
    { argv: [], options: { 'long-with-arg': 'foo' } }

    $ node simple.js --long-with-arg=foo
    { argv: [], options: { 'long-with-arg': 'foo' } }

optional argument

    $ node simple.js --color
    { argv: [], options: { color: '' } }

    $ node simple.js --color=foo
    { argv: [], options: { color: 'foo' } }

    $ node simple.js --color foo
    { argv: [ 'foo' ], options: { color: '' }

chain option

    $ node simple.js -slS foo
    { argv: [],
      options: { short: true, long: true, 'short-with-arg': 'foo' } }


multi option supported

    $ node simple.js -m a -m b -m c
    { argv: [], options: { 'multi-with-arg': [ 'a', 'b', 'c' ] } }

text argv supported

    $ node simple.js foo -m a bar -m b baz -m c
    { argv: [ 'foo', 'bar', 'baz' ],
      options: { 'multi-with-arg': [ 'a', 'b', 'c' ] } }

keep text after --

    $ node simple.js -s -- -s
    { argv: [ '-s' ], options: { short: true } }

References
----------

    require('node-getopt') returns class Getopt

Getopt Methods:

    constructor(Array options)
        options is a set of option. each option contains 3 fields.
        [short_name, long_name_with_definition, comment]
        Definition:
            * '=ARG':   has argument
            * '[=ARG]': has argument but optional
            * '+':      multiple option supported

            ARG can be replaced by any word.

    Object parse(Array argv)
        parse argv

        Returns: {argv: '...', options: {...}}

    Object parseSystem()
        alias of parse(process.argv.slice(2))


    Getopt setHelp(String helpTemplate)
        Set help template. the placeholders will be replaced by getopt.

        Placeholders:
            * [[OPTIONS]] - The options list

        Returns: String

    String getHelp()
        Get the help generated.

    Getopt showHelp()
        console.info(getopt.getHelp());

    Getopt bindHelp([String HELP])
        set help template to HELP if HELP is not empty.
        bind 'help' option to default action, show help and exit with 0.

    Getpot on(String optionName, Function<Array argv, Object options> action)
        after parsing, trigger the action if optionName is found.
        the 'this' in action will be the instance of Getopt.

    Getopt error(Function<Error e> callback)
        when parse failed callback will be trigger. default is display error message and exit with 1.

Getopt Static Methods:

    create(Array options)
        equals new Getopt(options)

Others:

    default help template:

        "Usage: node #{process.argv[1].match(/(?:.*[\/\\])?(.*)$/)[1]}\n\n[[OPTIONS]]\n"

Remarks
-------

    v0.2.* is NOT compatible with v0.1.*
