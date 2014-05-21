/*
 * Modular - JavaScript AMD Framework
 * Copyright 2013 Dan Phillimore (asmblah)
 * http://asmblah.github.com/modular/
 *
 * Implements the AMD specification - see https://github.com/amdjs/amdjs-api/wiki/AMD
 *
 * Released under the MIT license
 * https://github.com/asmblah/modular/raw/master/MIT-LICENSE.txt
 */

/*global require, mocha */
require({
    paths: {
        "js": "/../../js",
        "vendor": "/../../vendor"
    }
}, [
    "require",
    "vendor/chai/chai",
    "modular",
    "vendor/sinon/sinon",
    "vendor/sinon-chai/lib/sinon-chai"
], function (
    require,
    chai,
    modular,
    sinon,
    sinonChai
) {
    "use strict";

    mocha.setup({
        "ui": "bdd",
        "reporter": mocha.reporters.HTML,
        "globals": ["_gaq", "jQuery*", "setTimeout", "setInterval", "clearTimeout", "clearInterval", "top"]
    });

    chai.use(sinonChai);

    sinon.match.contains = function (element) {
        return sinon.match(function (array) {
            return modular.util.isArray(array) && array.indexOf(element) > -1;
        }, "\"" + element + "\" in array");
    };

    require({
        cache: false
    }, [
        "./acceptance/CommonJS/ExportsTest",
        "./acceptance/CommonJS/ModuleTest",
        "./acceptance/CommonJS/RequireTest",
        "./acceptance/DefineRequireTest",
        "./acceptance/SampleProgramTest",
        "./integration/NamedModuleTest",
        "./unit/js/Modular/UtilTest",
        "./unit/js/ModularTest",
        "./unit/js/PromiseTest",
        "./unit/js/UtilTest",
        "./unit/indexTest",
        "./unit/modularTest"
    ], function () {
        mocha.run();
    });
});
