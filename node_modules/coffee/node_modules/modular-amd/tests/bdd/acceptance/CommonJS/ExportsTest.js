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

    var expect = chai.expect;

    describe("CommonJS exports", function () {
        var loader;

        beforeEach(function () {
            loader = new Modular();
        });

        it("should make an 'exports' object available via the 'exports' named dependency", function (done) {
            loader.require([
                "exports"
            ], function (
                exports
            ) {
                expect(exports).to.be.an("object");
                done();
            });
        });

        it("should use the 'exports' object as the module value", function (done) {
            var otherModuleExports;

            loader.define("module/using/exports", [
                "exports"
            ], function (
                exports
            ) {
                otherModuleExports = exports;
            });

            loader.require([
                "module/using/exports"
            ], function (
                otherModule
            ) {
                expect(otherModule).to.equal(otherModuleExports);
                done();
            });
        });
    });
});
