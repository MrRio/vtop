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

/*global define */
define({
    "paths": {
        "js": "./"
    }
}, [
    "modular",
    "js/Promise"
], function (
    modular,
    Promise
) {
    "use strict";

    var util = modular.util,
        inheritFrom = Object.create || function (from) {
            function F() {}
            F.prototype = from;
            return new F();
        };

    function Util(global) {
        this.global = global;
    }

    Util.prototype = inheritFrom(util);
    Util.prototype.constructor = Util;

    util.extend(Util.prototype, {
        from: function (from) {
            return {
                to: function (to, callback) {
                    var number;

                    for (number = from; number <= to; number += 1) {
                        callback(number, number - from);
                    }
                }
            };
        },

        get: function (uri, options) {
            var util = this,
                global = util.global,
                promise = new Promise(),
                xhr = global.XMLHttpRequest ? new global.XMLHttpRequest() :
                        global.ActiveXObject ? new global.ActiveXObject("Microsoft.XMLHTTP") : null;

            options = options || {};

            if (!xhr) {
                return promise.reject(new Error("Util.get() :: XHR not available"));
            }

            if (options.cache === false) {
                uri += (uri.indexOf("?") > -1 ? "&" : "?") + "__r=" + Math.random();
            }

            xhr.open("GET", "../../" + uri, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    promise.resolve(xhr.responseText);
                }
            };

            try {
                xhr.send();
            } catch (exception) {
                return promise.reject(exception);
            }

            return promise;
        }
    });

    return new Util(util.global);
});
