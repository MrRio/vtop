// examples/simple.js
// argv parse
Getopt = require('..');

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
