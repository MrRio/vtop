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
    "vendor/chai/chai",
    "Modular"
], function (
    chai,
    Modular
) {
    "use strict";

    var expect = chai.expect,
        undef;

    describe("Sample Modular programs", function () {
        var loader;

        beforeEach(function () {
            loader = new Modular();
        });

        it("should execute sample program 1", function (done) {
            var HumanClass = null;

            loader.define("program/Human", function () {
                function Human() {}

                HumanClass = Human;

                return Human;
            });

            loader.require([
                "program/Human"
            ], function (
                Human
            ) {
                expect(Human).to.equal(HumanClass);
                done();
            });
        });

        it("should execute sample CommonJS require emulation with filter", function (done) {
            var OozeClass = null;

            loader.configure({
                "factoryFilter": function (args) {
                    var dependencyIDs,
                        source;

                    if (args.dependencyValues.length > 0 || args.factory.length !== 1) {
                        args.callback(args.factory);
                        return;
                    }

                    dependencyIDs = [];
                    source = args.factory.toString();

                    source.replace(/require\s*\(\s*(?:"([^"]*)"|'([^']*)')\s*\)/, function (all, doubleQuoted, singleQuoted) {
                        dependencyIDs.push(doubleQuoted !== undef ? doubleQuoted : singleQuoted);
                    });

                    args.loader.require(args.id, ["require"].concat(dependencyIDs), function (require) {
                        args.dependencyValues[0] = require;
                        args.callback(args.factory);
                    });
                }
            });

            loader.define("program/Ooze", function () {
                function Ooze() {}

                OozeClass = Ooze;

                return Ooze;
            });

            loader.require(function (require) {
                var Ooze = require("program/Ooze");

                expect(Ooze).to.equal(OozeClass);
                done();
            });
        });
    });
});
