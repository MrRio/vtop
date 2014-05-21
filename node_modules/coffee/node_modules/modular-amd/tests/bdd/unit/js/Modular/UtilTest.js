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
    "Modular"
], function (
    chai,
    sinon,
    Modular
) {
    "use strict";

    var expect = chai.expect;

    describe("Modular.Util", function () {
        var loader;

        beforeEach(function () {
            loader = new Modular();
        });

        describe("each()", function () {
            describe("for an array", function () {
                describe("with one element", function () {
                    it("should call callback once", function () {
                        var callback = sinon.spy();

                        loader.util.each([7], callback);

                        expect(callback).to.have.been.calledOnce;
                    });

                    it("should use the element value as thisObj when calling callback", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each([value], callback);

                        expect(callback).to.have.been.calledOn(value);
                    });

                    it("should pass element ([<value>], [<index>]) to callback", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each([value], callback);

                        expect(callback).to.have.been.calledWith(value, 0);
                    });
                });

                describe("with two elements", function () {
                    it("should call callback twice", function () {
                        var callback = sinon.spy();

                        loader.util.each([7, 5], callback);

                        expect(callback).to.have.been.calledTwice;
                    });

                    it("should use first element's value as thisObj when calling callback for first element", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each([value, {}], callback);

                        expect(callback).to.have.been.calledOn(value);
                    });

                    it("should use second element's value as thisObj when calling callback for second element", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each([{}, value], callback);

                        expect(callback).to.have.been.calledOn(value);
                    });

                    it("should pass first element's ([<value>], [<index>]) to callback when calling for first element", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each([value, {}], callback);

                        expect(callback).to.have.been.calledWith(value, 0);
                    });

                    it("should pass second element's ([<value>], [<index>]) to callback when calling for second element", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each([{}, value], callback);

                        expect(callback).to.have.been.calledWith(value, 1);
                    });
                });
            });

            describe("for an object", function () {
                describe("with one property", function () {
                    it("should call callback once", function () {
                        var callback = sinon.spy();

                        loader.util.each({ prop: 2 }, callback);

                        expect(callback).to.have.been.calledOnce;
                    });

                    it("should use the property value as thisObj when calling callback", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each({ prop: value }, callback);

                        expect(callback).to.have.been.calledOn(value);
                    });

                    it("should pass property ([<value>], [<key>]) to callback", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each({ prop: value }, callback);

                        expect(callback).to.have.been.calledWith(value, "prop");
                    });
                });

                describe("with two properties", function () {
                    it("should call callback twice", function () {
                        var callback = sinon.spy();

                        loader.util.each({ prop1: 8, prop2: 3 }, callback);

                        expect(callback).to.have.been.calledTwice;
                    });

                    it("should use first property's value as thisObj when calling callback for first property", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each({ prop1: value, prop2: {} }, callback);

                        expect(callback).to.have.been.calledOn(value);
                    });

                    it("should use second property's value as thisObj when calling callback for second property", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each({ prop1: {}, prop2: value }, callback);

                        expect(callback).to.have.been.calledOn(value);
                    });

                    it("should pass first property's ([<value>], [<key>]) to callback when calling for first property", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each({ prop1: value, prop2: {} }, callback);

                        expect(callback).to.have.been.calledWith(value, "prop1");
                    });

                    it("should pass second property's ([<value>], [<key>]) to callback when calling for second property", function () {
                        var callback = sinon.spy(),
                            value = {};

                        loader.util.each({ prop1: {}, prop2: value }, callback);

                        expect(callback).to.have.been.calledWith(value, "prop2");
                    });
                });
            });

            describe("for an object with a \"length\" property", function () {
                it("should only call callback once if <object>.length = 1 and <object>[0] is defined", function () {
                    var callback = sinon.spy();

                    loader.util.each({ 0: "the great pretender", length: 1 }, callback);

                    expect(callback).to.be.calledOnce;
                });

                it("should call callback twice if <object>.length = 2 and <object>[0] and <object>[1] are defined", function () {
                    var callback = sinon.spy();

                    loader.util.each({ 0: "the great", 1: "pretender", length: 2 }, callback);

                    expect(callback).to.be.calledTwice;
                });

                it("should call callback twice if options.keys is set", function () {
                    var callback = sinon.spy();

                    loader.util.each({ 0: "the great pretender", length: 1 }, callback, { keys: true });

                    expect(callback).to.be.calledTwice;
                });
            });
        });

        describe("extend()", function () {
            it("should return the target object", function () {
                var target = {};

                expect(loader.util.extend(target)).to.equal(target);
            });

            it("should extend the target object with the first source argument provided", function () {
                var target = {},
                    source = { prop: 7 };

                loader.util.extend(target, source);

                expect(target.prop).to.equal(7);
            });

            it("should extend the target object with the second source argument provided", function () {
                var target = {},
                    source = { prop: 7 };

                loader.util.extend(target, {}, source);

                expect(target.prop).to.equal(7);
            });

            it("should extend the target object with both source arguments provided", function () {
                var target = {},
                    source1 = { prop1: 2 },
                    source2 = { prop2: 8 };

                loader.util.extend(target, source1, source2);

                expect(target).to.deep.equal({
                    prop1: 2,
                    prop2: 8
                });
            });

            it("should extend the target object even if the source object contains a \"length\" property", function () {
                var target = {},
                    source = { length: 10 };

                loader.util.extend(target, source);

                expect(target.length).to.equal(10);
            });
        });
    });
});
