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
    "require",
    "js/util",
    "vendor/sinon/sinon",
    "js/Promise"
], function (
    chai,
    require,
    rootUtil,
    sinon,
    Promise
) {
    "use strict";

    var expect = chai.expect;

    describe("Util", function () {
        var global,
            modular,
            util;

        beforeEach(function () {
            global = {};
            modular = require("modular");
            util = new rootUtil.constructor(global);
        });

        it("should inherit from modular.util", function () {
            expect(Object.getPrototypeOf(util.constructor.prototype)).to.equal(modular.util);
        });

        describe("from()", function () {
            rootUtil.each([
                {from: 0, to: 0},
                {from: 1, to: 0},
                {from: 0, to: 3},
                {from: 4, to: 7}
            ], function (scenario) {
                var timesToCall = scenario.to - scenario.from + 1;

                describe("when 'from' is '" + scenario.from + " and 'to' is '" + scenario.to + "'", function () {
                    var callback;

                    beforeEach(function () {
                        callback = sinon.spy();
                        util.from(scenario.from).to(scenario.to, callback);
                    });

                    it("should call 'callback' " + timesToCall + " time(s)", function () {
                        expect(callback.callCount).to.equal(timesToCall);
                    });

                    rootUtil.from(1).to(timesToCall, function (callNumber, callIndex) {
                        describe("when the callback is called for time #" + callNumber, function () {
                            it("should pass the correct 'number' to the callback", function () {
                                expect(callback.getCall(callIndex).args[0]).to.equal(scenario.from + callIndex);
                            });

                            it("should pass the correct 'index' to the callback", function () {
                                expect(callback.getCall(callIndex).args[1]).to.equal(callIndex);
                            });
                        });
                    });
                });
            });
        });

        describe("global", function () {
            it("should return the global object", function () {
                expect(util.global).to.equal(global);
            });
        });

        describe("get()", function () {
            it("should return a Promise", function () {
                expect(util.get()).to.be.an.instanceOf(Promise);
            });
        });
    });
});
