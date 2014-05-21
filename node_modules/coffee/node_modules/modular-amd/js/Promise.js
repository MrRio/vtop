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
define([
    "modular"
], function (
    modular
) {
    "use strict";

    var PENDING = 0,
        REJECTED = 1,
        RESOLVED = 2,
        util = modular.util;

    function Promise() {
        this.mode = PENDING;
        this.thens = [];
        this.value = null;
    }

    util.extend(Promise.prototype, {
        reject: function (exception) {
            var promise = this;

            if (promise.mode === PENDING) {
                promise.mode = REJECTED;
                promise.value = exception;

                util.each(promise.thens, function (callbacks) {
                    if (callbacks.onReject) {
                        callbacks.onReject(exception);
                    }
                });
            }

            return promise;
        },

        resolve: function (result) {
            var promise = this;

            if (promise.mode === PENDING) {
                promise.mode = RESOLVED;
                promise.value = result;

                util.each(promise.thens, function (callbacks) {
                    if (callbacks.onResolve) {
                        callbacks.onResolve(result);
                    }
                });
            }

            return promise;
        },

        then: function (onResolve, onReject) {
            var promise = this;

            if (promise.mode === PENDING) {
                promise.thens.push({
                    onReject: onReject,
                    onResolve: onResolve
                });
            } else if (promise.mode === REJECTED) {
                if (onReject) {
                    onReject(promise.value);
                }
            } else if (promise.mode === RESOLVED) {
                if (onResolve) {
                    onResolve(promise.value);
                }
            }

            return promise;
        }
    });

    return Promise;
});
