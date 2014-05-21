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

(function (global) {
    "use strict";

    var hasOwn = {}.hasOwnProperty,
        get = function (obj, prop) {
            return obj[prop];
        };

    function each(obj, callback) {
        var key,
            length;

        if (!obj || !("length" in obj)) {
            return;
        }

        for (key = 0, length = obj.length; key < length; key += 1) { // Keep JSLint happy with "+= 1"
            if (callback.call(obj[key], obj[key], key) === false) {
                break;
            }
        }
    }

    function error(msg) {
        if (global.console) {
            global.console.error(msg);
        }
    }

    (function () {
        var isBrowser = global.document;

        if (isBrowser) {
            (function (document) {
                var anonymousDefine,
                    callbacks = {},
                    defineAnonymous = function (args) {
                        anonymousDefine = args;
                    },
                    head = document.getElementsByTagName("head")[0],
                    modularURI,
                    scripts = document.scripts,
                    useInteractiveScript = hasOwn.call(document, "uniqueID");

                function getBase(path) {
                    return path.replace(/\?[^?]+$/, "").replace(/\/?[^\/]+$/, "");
                }

                function load(script, args) {
                    var callback = callbacks[script.uniqueID];
                    if (callback) {
                        delete callbacks[script.uniqueID];
                        callback(args);
                    }
                }

                function loadScript(uri, onSuccess, onFail, options) {
                    var charset = get(options, "charset"),
                        script = document.createElement("script");

                    if (charset) {
                        script.charset = charset;
                    }

                    if (useInteractiveScript) {
                        callbacks[script.uniqueID] = onSuccess;

                        script.onreadystatechange = function () {
                            if (script.readyState === "loaded") {
                                load(script, null);
                            }
                        };
                    } else {
                        script.onload = function () {
                            // Clear anonymousDefine to ensure it is not reused
                            // when the next module doesn't perform anonymous define(...)
                            var args = anonymousDefine;
                            anonymousDefine = null;
                            onSuccess(args);

                            head.removeChild(script);
                        };

                        script.onerror = function () {
                            head.removeChild(script);

                            onFail();
                        };
                    }

                    script.src = uri;
                    head.insertBefore(script, head.firstChild);
                }

                function makePath(baseURI, id) {
                    if (/\?/.test(id)) {
                        return id;
                    }

                    if (!/^(https?:)?\/\//.test(id)) {
                        id = (baseURI ? baseURI.replace(/\/$/, "") + "/" : "") + id;
                    }

                    return id.replace(/\.js$/, "") + ".js";
                }

                if (useInteractiveScript) {
                    defineAnonymous = function (args) {
                        each(scripts, function (script) {
                            if (script.readyState === "interactive") {
                                load(script, args);
                                return false;
                            }
                        });
                    };
                }

                function loadMain() {
                    each(scripts, function (script) {
                        var main = script.getAttribute("data-main");

                        if (main) {
                            script.removeAttribute("data-main");
                            global.require(".", [main]);
                            return false;
                        }
                    });
                }

                function registerTransports(modular) {
                    modular.configure({
                        // TODO: Tests to ensure baseURI is respected (eg. when <base /> tag is on page)
                        "baseUrl": getBase(document.baseURI || global.location.pathname),
                        "charset": "utf-8",
                        "defineAnonymous": defineAnonymous,
                        "exclude": /^(https?:)?\/\//,
                        "paths": {
                            "Modular": modularURI
                        },
                        "transport": function (callback, module) {
                            var uri = makePath(get(module.config, "baseUrl"), module.id);

                            if (get(module.config, "cache") === false) {
                                uri += "?__r=" + Math.random();
                            }

                            loadScript(uri, callback, function () {
                                /*jshint quotmark: false */
                                var msg = 'Failed to load module "' + module.id + '"',
                                    dependentInfos = [];

                                each(modular.modules, function (dependent) {
                                    each(dependent.getDependencies(), function (dependency) {
                                        if (dependency.id === module.id) {
                                            dependentInfos.push(dependent.id + (function () {
                                                var dependencyIDs = [];

                                                each(dependent.getDependencies(), function (dependency) {
                                                    dependencyIDs.push(dependency.id);
                                                });

                                                return dependencyIDs.length > 0 ? "\n  dependencies:\n    - " + dependencyIDs.join("\n    - ") : "";
                                            }()));
                                        }
                                    });
                                });

                                if (dependentInfos.length) {
                                    msg += " for:\n- " + dependentInfos.join("\n- ");
                                }

                                error(msg);
                            }, module.config);
                        }
                    });
                }

                // Don't override an existing AMD loader: instead, register the Modular instance
                if (!global.define) {
                    (function (currentScript) {
                        modularURI = getBase(currentScript.src);
                        loadScript(modularURI + "/js/Modular.js", function () {
                            global.require([
                                "modular"
                            ], function (
                                modular
                            ) {
                                registerTransports(modular);

                                if (document.readyState === "interactive") {
                                    loadMain();
                                } else {
                                    if (global.addEventListener) {
                                        global.addEventListener("DOMContentLoaded", loadMain);
                                    } else {
                                        (function check() {
                                            try {
                                                document.documentElement.doScroll("left");
                                            } catch (error) {
                                                global.setTimeout(check);
                                                return;
                                            }

                                            loadMain();
                                        }());
                                    }
                                }
                            });
                        }, function () {
                            error("Could not load AMD loader js/Modular.js");
                        }, {});
                    }(scripts[scripts.length - 1]));
                }
            }(global.document));
        }
    }());
}(this));
