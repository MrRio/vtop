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

/*global beforeEach, define, describe, it */
define([
    "vendor/chai/chai",
    "Modular"
], function (
    chai,
    Modular
) {
    "use strict";

    var expect = chai.expect;

    describe("CommonJS module", function () {
        var loader;

        beforeEach(function () {
            loader = new Modular();
        });

        it("should make a 'module' object available via the 'module' named dependency", function (done) {
            loader.require([
                "module"
            ], function (
                module
            ) {
                expect(module).to.be.an("object");
                done();
            });
        });

        it("should make the module's id available as an 'id' property", function (done) {
            loader.require("where/is/the/love", [
                "module"
            ], function (
                module
            ) {
                expect(module.id).to.equal("where/is/the/love");
                done();
            });
        });

        describe("module factory return value overriding module.exports", function () {
            describe("when module.exports is unmodified", function () {
                it("should use null as the module's value when its factory returns null", function (done) {
                    var value;

                    loader.define("amp/er/sand", [
                        "module"
                    ], function (
                        module
                    ) {
                        value = null;

                        return value;
                    });

                    loader.require([
                        "amp/er/sand"
                    ], function (
                        ampersand
                    ) {
                        expect(ampersand).to.equal(value);
                        done();
                    });
                });

                it("should use 7 as the module's value when its factory returns 7", function (done) {
                    var value;

                    loader.define("amp/er/sand", [
                        "module"
                    ], function (
                        module
                    ) {
                        value = 7;

                        return value;
                    });

                    loader.require([
                        "amp/er/sand"
                    ], function (
                        ampersand
                    ) {
                        expect(ampersand).to.equal(value);
                        done();
                    });
                });

                it("should use the specified object as the module's value when its factory returns an object", function (done) {
                    var value;

                    loader.define("amp/er/sand", [
                        "module"
                    ], function (
                        module
                    ) {
                        value = {};

                        return value;
                    });

                    loader.require([
                        "amp/er/sand"
                    ], function (
                        ampersand
                    ) {
                        expect(ampersand).to.equal(value);
                        done();
                    });
                });
            });
        });

        describe("module.exports", function () {
            it("should use module.exports as the module value", function (done) {
                var moduleValue;

                loader.define("module/dot/exports", [
                    "module"
                ], function (
                    module
                ) {
                    moduleValue = module.exports;
                });

                loader.require([
                    "module/dot/exports"
                ], function (
                    moduleDotExports
                ) {
                    expect(moduleDotExports).to.equal(moduleValue);
                    done();
                });
            });

            it("should make the same object returned by named dependency 'exports' available via module.exports", function (done) {
                loader.require([
                    "exports",
                    "module"
                ], function (
                    exports,
                    module
                ) {
                    expect(module.exports).to.equal(exports);
                    done();
                });
            });

            describe("when overwriting", function () {
                it("should use the new module.exports value as the module value", function (done) {
                    var exports = {};

                    loader.define("the/overwritten", [
                        "module"
                    ], function (
                        module
                    ) {
                        module.exports = exports;
                    });

                    loader.require([
                        "the/overwritten"
                    ], function (
                        overwritten
                    ) {
                        expect(overwritten).to.equal(exports);
                        done();
                    });
                });
            });
        });
    });
});
