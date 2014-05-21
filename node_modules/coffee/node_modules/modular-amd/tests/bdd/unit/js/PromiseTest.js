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
    "vendor/sinon/sinon",
    "js/util",
    "js/Promise"
], function (
    chai,
    sinon,
    util,
    Promise
) {
    "use strict";

    var expect = chai.expect;

    describe("Promise", function () {
        var failureCallback,
            promise,
            successCallback;

        beforeEach(function () {
            promise = new Promise();
            failureCallback = sinon.spy();
            successCallback = sinon.spy();
        });

        describe("reject()", function () {
            util.each([
                {successCallbacks: 0, failureCallbacks: 0},
                {successCallbacks: 0, failureCallbacks: 1},
                {successCallbacks: 2, failureCallbacks: 2}
            ], function (scenario) {
                describe("when there are " + scenario.successCallbacks + " success callbacks and " + scenario.failureCallbacks + " failure callbacks", function () {
                    function attachCallbacks() {
                        util.from(1).to(scenario.successCallbacks, function () {
                            promise.then(successCallback);
                        });

                        util.from(1).to(scenario.failureCallbacks, function () {
                            promise.then(null, failureCallback);
                        });
                    }

                    describe("when the Promise is still pending", function () {
                        beforeEach(function () {
                            attachCallbacks();
                            promise.reject();
                        });

                        it("should not trigger any success callbacks", function () {
                            expect(successCallback).to.not.have.been.called;
                        });

                        it("should trigger all failure callbacks", function () {
                            expect(failureCallback.callCount).to.equal(scenario.failureCallbacks);
                        });
                    });

                    util.each({"rejected": "reject", "resolved": "resolve"}, function (method, description) {
                        describe("when the Promise has already been " + description, function () {
                            beforeEach(function () {
                                promise[method]();
                                attachCallbacks();
                                successCallback.reset();
                                failureCallback.reset();
                                promise.reject();
                            });

                            it("should not trigger any success callbacks", function () {
                                expect(successCallback).to.not.have.been.called;
                            });

                            it("should not trigger any failure callbacks", function () {
                                expect(failureCallback).to.not.have.been.called;
                            });
                        });
                    });
                });
            });
        });

        describe("resolve()", function () {
            util.each([
                {successCallbacks: 0, failureCallbacks: 0},
                {successCallbacks: 0, failureCallbacks: 1},
                {successCallbacks: 2, failureCallbacks: 2}
            ], function (scenario) {
                describe("when there are " + scenario.successCallbacks + " success callbacks and " + scenario.failureCallbacks + " failure callbacks", function () {
                    function attachCallbacks() {
                        util.from(1).to(scenario.successCallbacks, function () {
                            promise.then(successCallback);
                        });

                        util.from(1).to(scenario.failureCallbacks, function () {
                            promise.then(null, failureCallback);
                        });
                    }

                    util.each({"rejected": "reject", "resolved": "resolve"}, function (method, description) {
                        describe("when the Promise has already been " + description, function () {
                            beforeEach(function () {
                                promise[method]();
                                attachCallbacks();
                                successCallback.reset();
                                failureCallback.reset();
                                promise.resolve();
                            });

                            it("should not trigger any success callbacks", function () {
                                expect(successCallback).to.not.have.been.called;
                            });

                            it("should not trigger any failure callbacks", function () {
                                expect(failureCallback).to.not.have.been.called;
                            });
                        });
                    });
                });
            });
        });

        describe("then()", function () {

        });
    });
});
