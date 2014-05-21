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
        slice = [].slice,
        extendConfig = function (target) {
            util.each(slice.call(arguments, 1), function (obj) {
                util.each(obj, function (val, key) {
                    target[key] = (key === "paths") ? util.extend({}, target[key], val) : val;
                }, { keys: true });
            });

            return target;
        },
        get = function (obj, prop) {
            return obj[prop];
        },
        undef,
        util = {
            each: function (obj, callback, options) {
                var key,
                    length;

                if (!obj) {
                    return;
                }

                options = options || {};

                if (("length" in obj) && !options.keys) {
                    for (key = 0, length = obj.length; key < length; key += 1) { // Keep JSLint happy with "+= 1"
                        if (callback.call(obj[key], obj[key], key, obj) === false) {
                            break;
                        }
                    }
                } else {
                    for (key in obj) {
                        if (hasOwn.call(obj, key)) {
                            if (callback.call(obj[key], obj[key], key, obj) === false) {
                                break;
                            }
                        }
                    }
                }
            },

            extend: function (target) {
                util.each(slice.call(arguments, 1), function (obj) {
                    util.each(obj, function (val, key) {
                        target[key] = val;
                    }, { keys: true });
                });

                return target;
            },

            getType: function (obj) {
                return {}.toString.call(obj).match(/\[object ([\s\S]*)\]/)[1];
            },

            global: global,

            isArray: function (str) {
                return util.getType(str) === "Array";
            },

            isFunction: function (str) {
                return util.getType(str) === "Function";
            },

            isPlainObject: function (obj) {
                return util.getType(obj) === "Object" && !util.isUndefined(obj);
            },

            isString: function (str) {
                return typeof str === "string" || util.getType(str) === "String";
            },

            isUndefined: function (obj) {
                return obj === undef;
            }
        },
        Funnel = (function () {
            function Funnel() {
                this.doneCallbacks = [];
                this.pending = 0;
            }
            util.extend(Funnel.prototype, {
                add: function (callback) {
                    var funnel = this;

                    funnel.pending += 1;

                    return function () {
                        var result = callback.apply(this, arguments);

                        funnel.pending -= 1;
                        if (funnel.pending === 0) {
                            util.each(funnel.doneCallbacks, function (callback) {
                                callback();
                            });
                        }

                        return result;
                    };
                },

                done: function (callback) {
                    if (this.pending === 0) {
                        callback();
                    } else {
                        this.doneCallbacks.push(callback);
                    }
                }
            });

            return Funnel;
        }()),
        Module = (function () {
            var UNDEFINED = 1,
                TRANSPORTING = 2,
                DEFINED = 3,
                FILTERING = 4,
                FILTERED = 5,
                DEFERRED = 6,
                LOADING = 7,
                LOADED = 8;

            function Module(loader, config, id, value) {
                var module = this;
                this.config = {};
                this.dependencies = [];
                this.dependencyIDs = null;
                this.factory = null;
                this.id = id || null;
                this.loader = loader;
                this.mode = value ? LOADED : UNDEFINED;
                this.requesterQueue = [];
                this.whenLoaded = null;
                this.commonJSModule = {
                    defer: function () {
                        module.mode = DEFERRED;
                        return function (value) {
                            module.whenLoaded(value);
                        };
                    },
                    exports: value
                };

                this.extendConfig(config);
            }
            util.extend(Module.prototype, {
                define: function (config, dependencyIDs, factory) {
                    var module = this;

                    module.extendConfig(config);

                    module.dependencyIDs = dependencyIDs;
                    module.factory = factory;
                    module.mode = DEFINED;
                },

                extendConfig: function () {
                    var baseID,
                        module = this;

                    extendConfig.apply(null, [module.config].concat(slice.call(arguments)));

                    // Process relative path mappings - if module ID is null, use base directory
                    baseID = (module.id || "").replace(/(^|\/)[^\/]*$/, "$1") || "/";

                    if (/^\.\.?\//.test(baseID)) {
                        baseID = "/" + baseID;
                    }

                    util.each(get(module.config, "paths"), function (path, index, paths) {
                        if (/^\.\.?\//.test(path)) {
                            paths[index] = baseID + path;
                        }
                    });
                },

                getDependencies: function () {
                    return this.dependencies;
                },

                getValue: function () {
                    var module = this;

                    return module.commonJSModule.exports;
                },

                isDeferred: function () {
                    return this.mode === DEFERRED;
                },

                isDefined: function () {
                    return this.mode >= DEFINED;
                },

                isLoaded: function () {
                    return this.mode === LOADED;
                },

                load: function (callback) {
                    var loader = this.loader,
                        module = this;

                    function load(dependencyValues, value, callback) {
                        module.mode = LOADED;

                        if (!util.isUndefined(value)) {
                            module.commonJSModule.exports = value;
                        }

                        util.each(module.requesterQueue, function (callback) {
                            callback(module.getValue());
                        });
                        module.requesterQueue.length = 0;

                        if (callback) {
                            callback(module.getValue());
                        }
                    }

                    function getModuleValue(dependencyValues, factory, callback) {
                        var value;

                        module.whenLoaded = function (value) {
                            module.whenLoaded = null;
                            load(dependencyValues, value, callback);
                        };

                        value = util.isFunction(factory) ?
                                factory.apply(global, dependencyValues) :
                                factory;

                        if (!module.isDeferred() && !module.isLoaded()) {
                            module.whenLoaded = null;
                            load(dependencyValues, value, callback);
                        }
                    }

                    function filter(dependencyValues, callback) {
                        var factoryFilter = get(module.config, "factoryFilter");

                        factoryFilter({
                            callback: function (factory) {
                                getModuleValue(dependencyValues, factory, callback);
                            },
                            dependencyValues: dependencyValues,
                            factory: module.factory,
                            id: module.id,
                            loader: loader
                        });
                    }

                    function loadDependencies(callback) {
                        var funnel = new Funnel(),
                            dependencyValues = [];

                        module.mode = LOADING;

                        util.each(module.dependencies, function (dependency, index) {
                            dependency.load(funnel.add(function (value) {
                                // These may load in any order, so don't just .push() them
                                dependencyValues[index] = value;
                            }));
                        });

                        funnel.done(function () {
                            filter(dependencyValues, callback);
                        });
                    }

                    function resolveDependencies(callback) {
                        var idFilter,
                            funnel = new Funnel();

                        idFilter = get(module.config, "idFilter");

                        util.extend(module.commonJSModule, {
                            config: module.config,
                            id: module.id,
                            uri: module.id
                        });

                        util.each(module.dependencyIDs, function (dependencyID, dependencyIndex) {
                            if (!loader.getModule(dependencyID)) {
                                dependencyID = loader.resolveDependencyID(dependencyID, module.id, get(module.config, "paths"), get(module.config, "exclude"));
                            }

                            if (dependencyID === "require") {
                                module.dependencies[dependencyIndex] = new Module(loader, module.config, null, function (arg1, arg2, arg3, arg4) {
                                    var args = loader.parseArgs(arg1, arg2, arg3, arg4),
                                        config = extendConfig({}, module.config, args.config);
                                    return loader.require(config, args.id || module.id, args.dependencyIDs, args.factory);
                                });
                            } else if (dependencyID === "exports") {
                                if (util.isUndefined(module.commonJSModule.exports)) {
                                    module.commonJSModule.exports = {};
                                }
                                module.dependencies[dependencyIndex] = new Module(loader, module.config, null, module.commonJSModule.exports);
                            } else if (dependencyID === "module") {
                                if (util.isUndefined(module.commonJSModule.exports)) {
                                    module.commonJSModule.exports = {};
                                }
                                module.dependencies[dependencyIndex] = new Module(loader, module.config, null, module.commonJSModule);
                            } else {
                                idFilter(dependencyID, funnel.add(function (dependencyID) {
                                    var dependency = loader.getModule(dependencyID);

                                    if (dependency) {
                                        dependency.extendConfig(module.config);
                                    } else {
                                        dependency = loader.createModule(dependencyID, module.config);
                                    }

                                    module.dependencies[dependencyIndex] = dependency;
                                }));
                            }
                        });

                        module.mode = FILTERING;

                        funnel.done(function () {
                            module.mode = FILTERED;
                            loadDependencies(callback);
                        });
                    }

                    function completeDefine(define) {
                        if (!define) {
                            define = {
                                config: {},
                                dependencyIDs: [],
                                factory: undef
                            };
                        }

                        module.define(define.config, define.dependencyIDs, define.factory);
                        resolveDependencies();
                    }

                    if (module.mode === UNDEFINED) {
                        if (callback) {
                            module.requesterQueue.push(callback);
                        }
                        module.mode = TRANSPORTING;

                        get(module.config, "transport")(completeDefine, module);
                    } else if (module.mode === TRANSPORTING || module.mode === LOADING) {
                        if (callback) {
                            module.requesterQueue.push(callback);
                        }
                    } else if (module.mode === DEFINED) {
                        resolveDependencies(callback);
                    } else if (module.mode === LOADED) {
                        if (callback) {
                            callback(module.getValue());
                        }
                    }
                }
            });

            return Module;
        }()),
        Modular = (function () {
            function Modular() {
                this.config = {
                    "baseUrl": "",
                    "defineAnonymous": function (args) {},
                    "exclude": /(?!)/,
                    "factoryFilter": function (args) {
                        args.callback(args.factory);
                    },
                    "idFilter": function (id, callback) {
                        callback(id);
                    },
                    "transport": function (callback, module) {}
                };
                this.modules = {};

                // Expose Modular class itself to dependents
                this.define("Modular", function () {
                    return Modular;
                });

                // Expose this instance of Modular to its dependents
                this.define("modular", this);
            }
            util.extend(Modular.prototype, {
                configure: function (config) {
                    if (config) {
                        extendConfig(this.config, config);
                    } else {
                        return this.config;
                    }
                },

                createDefiner: function () {
                    var loader = this;

                    function define(arg1, arg2, arg3, arg4) {
                        return loader.define(arg1, arg2, arg3, arg4);
                    }

                    // Publish support for the AMD pattern
                    util.extend(define, {
                        "amd": {
                            "jQuery": true
                        }
                    });

                    return define;
                },

                createModule: function (id, config) {
                    var module = new Module(this, config, id);

                    this.modules[id] = module;

                    return module;
                },

                createRequirer: function () {
                    var loader = this;

                    function require(arg1, arg2, arg3, arg4) {
                        return loader.require(arg1, arg2, arg3, arg4);
                    }

                    util.extend(require, {
                        config: function (config) {
                            return loader.configure(config);
                        }
                    });

                    return require;
                },

                define: function (arg1, arg2, arg3, arg4) {
                    var args = this.parseArgs(arg1, arg2, arg3, arg4),
                        id = args.id,
                        module;

                    if (id === null) {
                        get(extendConfig({}, this.config, args.config), "defineAnonymous")(args);
                    } else {
                        module = this.getModule(id);
                        if (module) {
                            if (module.isDefined()) {
                                throw new Error("Module '" + id + "' has already been defined");
                            }
                        } else {
                            module = this.createModule(id, extendConfig({}, this.config, args.config));
                        }

                        module.define(args.config, args.dependencyIDs, args.factory);
                    }
                },

                getModule: function (id) {
                    return this.modules[id];
                },

                parseArgs: function (arg1, arg2, arg3, arg4) {
                    var config = null,
                        id = null,
                        dependencyIDs = null,
                        factory = undef;

                    if (util.isPlainObject(arg1)) {
                        config = arg1;
                    } else if (util.isString(arg1)) {
                        id = arg1;
                    } else if (util.isArray(arg1)) {
                        dependencyIDs = arg1;
                    } else if (util.isFunction(arg1)) {
                        factory = arg1;
                    }

                    if (util.isString(arg2)) {
                        id = arg2;
                    } else if (util.isArray(arg2)) {
                        dependencyIDs = arg2;
                    } else if (util.isFunction(arg2) || util.isPlainObject(arg2)) {
                        factory = arg2;
                    }

                    if (util.isArray(arg3)) {
                        dependencyIDs = arg3;
                    } else if (util.isFunction(arg3) || util.isPlainObject(arg3)) {
                        factory = arg3;
                    }

                    if (util.isFunction(arg4)) {
                        factory = arg4;
                    }

                    // Special case: only an object passed - use as factory
                    if (config && !id && !dependencyIDs && !factory) {
                        factory = config;
                        config = null;
                    }

                    // Special case: only an array passed - use as factory
                    if (!config && dependencyIDs && !id && !factory) {
                        factory = dependencyIDs;
                        dependencyIDs = null;
                    }

                    return {
                        config: config || {},
                        id: id,
                        dependencyIDs: dependencyIDs || [],
                        factory: factory
                    };
                },

                resolveDependencyID: function (id, dependentID, mappings, exclude) {
                    var previousID;

                    if (!util.isString(id)) {
                        throw new Error("Invalid dependency id");
                    }

                    if (exclude && exclude.test(id)) {
                        return id;
                    }

                    if (/^\.\.?\//.test(id) && dependentID) {
                        id = dependentID.replace(/[^\/]+$/, "") + id;
                    } else {
                        id = id.replace(/^\//, "");

                        if (mappings && !/^\.\.?\//.test(id)) {
                            id = (function () {
                                var terms = id.split("/"),
                                    portion,
                                    index;

                                function getMapping(id) {
                                    return mappings[id] || mappings["/" + id];
                                }

                                if (getMapping(id)) {
                                    return getMapping(id);
                                }

                                for (index = terms.length - 1; index >= 0; index -= 1) {
                                    portion = terms.slice(0, index).join("/");
                                    if (getMapping(portion) || getMapping(portion + "/")) {
                                        return (getMapping(portion) || getMapping(portion + "/")).replace(/\/$/, "") + "/" + terms.slice(index).join("/");
                                    }
                                }
                                return id;
                            }());
                        }
                    }

                    id = id.replace(/^\//, "");

                    // Resolve parent-directory terms in id
                    while (previousID !== id) {
                        previousID = id;
                        id = id.replace(/(\/|^)(?!\.\.)[^\/]*\/\.\.\//, "$1");
                    }

                    id = id.replace(/(^|\/)(\.?\/)+/g, "$1"); // Resolve same-directory terms

                    return id;
                },

                require: function (arg1, arg2, arg3, arg4) {
                    var args = this.parseArgs(arg1, arg2, arg3, arg4),
                        id = args.id,
                        module;

                    if (args.id && args.dependencyIDs.length === 0 && !args.factory) {
                        module = this.getModule(args.id);

                        if (!module || (!module.isLoaded() && module.getDependencies().length > 0)) {
                            throw new Error("Module '" + args.id + "' has not yet loaded");
                        }

                        module.load();

                        return module.getValue();
                    } else {
                        module = new Module(this, this.config, id);

                        module.define(args.config, args.dependencyIDs, args.factory);
                        module.load();
                    }
                },

                util: util
            });

            return Modular;
        }()),
        modular;

    // Modular is loaded as an AMD module
    if (global.define) {
        if (global.define.amd) {
            global.define(function () {
                return Modular;
            });
        }
    // Modular is loaded standalone
    } else {
        modular = new Modular();
        global.define = modular.createDefiner();
        global.require = modular.createRequirer();
    }
}(this));
