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

    describe("Named modules", function () {
        var loader;

        beforeEach(function () {
            loader = new Modular();

            loader.define("classes/Animal", function () {
                function Animal(species) {
                    this.species = species || null;
                }

                Animal.prototype.getSpecies = function () {
                    return this.species;
                };

                return Animal;
            });

            loader.define("classes/Human", [
                "classes/Animal"
            ], function (
                Animal
            ) {
                function Human() {
                    Animal.call(this, "Human");
                }

                Human.prototype = Object.create(Animal.prototype);

                return Human;
            });
        });

        it("should resolve paths beginning with './' relative to current directory", function (done) {
            loader.require("classes/World", [
                "./Animal"
            ], function (
                Animal
            ) {
                expect(new Animal().getSpecies()).to.equal(null);

                done();
            });
        });

        it("should resolve paths beginning with '../' relative to parent directory", function (done) {
            loader.require("classes/World", [
                "../classes/Animal"
            ], function (
                Animal
            ) {
                expect(new Animal().getSpecies()).to.equal(null);

                done();
            });
        });

        it("should resolve paths beginning with '/' relative to root", function (done) {
            loader.define("util", function () {
                return {};
            });

            loader.require("classes/Parser/English", [
                "/util"
            ], function (
                util
            ) {
                expect(util).to.eql({});

                done();
            });
        });

        it("should resolve paths not beginning with '.' or '/' relative to root", function (done) {
            loader.require("classes/Parser/English", [
                "classes/Human"
            ], function (
                Human
            ) {
                expect(new Human().getSpecies()).to.equal("Human");

                done();
            });
        });

        describe("require(...)", function () {
            it("should allow no dependencies to be specified", function (done) {
                loader.require(function () {
                    done();
                });
            });

            it("should allow itself to be named (only useful for requires outside define(...)s or data-main)", function (done) {
                loader.require("i-am-the-one-and-only", function () {
                    done();
                });
            });

            describe("config", function () {
                var require;

                beforeEach(function () {
                    require = loader.createRequirer();
                });

                it("should affect the global config", function () {
                    require.config({
                        awesomeOption: "yes"
                    });

                    expect(require.config()).to.have.property("awesomeOption");
                });
            });
        });

        describe("define(...)", function () {
            it("should support marvellously named modules", function (done) {
                loader.define("annie's-marvellous-module", function () {
                    return {
                        welcome: "to the jungle"
                    };
                });

                loader.require(["annie's-marvellous-module"], function (greeting) {
                    expect(greeting).to.eql({
                        welcome: "to the jungle"
                    });

                    done();
                });
            });
        });

        describe("nested require(...)", function () {
            it("should resolve paths relative to enclosing module", function (done) {
                loader.define("into/the/Matrix", function () {
                    function Matrix() {}

                    return Matrix;
                });

                loader.require("into/the/somewhere", [
                    "require"
                ], function (
                    require
                ) {
                    require([
                        "./Matrix"
                    ], function (
                        Matrix
                    ) {
                        done();
                    });
                });
            });
        });
    });
});
