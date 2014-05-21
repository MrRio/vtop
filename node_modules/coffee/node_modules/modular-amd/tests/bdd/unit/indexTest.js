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
    "js/util"
], function (
    chai,
    sinon,
    util
) {
    "use strict";

    var expect = chai.expect;

    describe("Node index.js", function () {
        var dirname,
            fs,
            global,
            loadModule,
            MockFunction,
            mockModularCode,
            modular,
            module,
            process,
            require;

        beforeEach(function (done) {
            global = {};

            util.get("/index.js", {cache: false}).then(function (js) {
                loadModule = function () {
                    /*jshint evil:true */
                    new Function("__dirname, Function, module, process, require", js).call(global, dirname, MockFunction, module, process, require);
                };
                done();
            });
        });

        util.each([
            {
                node: true,
                dirname: "/a/node/package",
                baseUrl: "/a/current/working/directory"
            },
            {
                node: false,
                dirname: "/another/node/package",
                baseUrl: "/a/second/current/working/directory"
            }
        ], function (scenario) {
            describe("when the environment is" + (scenario.node ? "": " not") + " Node", function () {
                beforeEach(function () {
                    if (scenario.node) {
                        dirname = scenario.dirname;
                        fs = {
                            readFile: sinon.stub(),
                            readFileSync: sinon.stub(),
                            realpathSync: sinon.stub()
                        };
                        module = {};
                        require = sinon.stub();

                        require.withArgs("fs").returns(fs);
                        mockModularCode = {};
                        fs.readFileSync.withArgs(scenario.dirname + "/js/Modular.js").returns(mockModularCode);

                        modular = {
                            configure: sinon.spy(),
                            createDefiner: sinon.stub(),
                            createRequirer: sinon.stub()
                        };

                        MockFunction = function (arg) {
                            if (arg === mockModularCode) {
                                this.call = function (global) {
                                    global.require = sinon.stub().withArgs("modular").returns(modular);
                                };
                            } else {
                                return function () {};
                            }
                        };

                        process = {
                            cwd: sinon.stub().returns(scenario.baseUrl)
                        };
                    }
                });

                it("should not throw an error", function () {
                    expect(loadModule).to.not.throw();
                });

                describe("when it does not error", function () {
                    beforeEach(function () {
                        loadModule();
                    });

                    if (scenario.node) {
                        it("should export the Modular instance as module.exports", function () {
                            expect(module.exports).to.equal(modular);
                        });

                        describe("when configuring the Modular instance", function () {
                            it("should call Modular.configure(...)", function () {
                                expect(modular.configure).to.have.been.calledOnce;
                            });

                            it("should set the 'baseUrl' option correctly", function () {
                                expect(modular.configure).to.have.been.calledWith(sinon.match.hasOwn("baseUrl", scenario.baseUrl));
                            });

                            describe("with the 'transport' and 'defineAnonymous' options", function () {
                                var config,
                                    defineAnonymous,
                                    transport;

                                beforeEach(function () {
                                    config = modular.configure.getCall(0).args[0];
                                    defineAnonymous = config.defineAnonymous;
                                    transport = config.transport;
                                });

                                describe("when requesting an undefined module through the transport", function () {
                                    var callback,
                                        module;

                                    beforeEach(function () {
                                        callback = sinon.spy();
                                        module = {
                                            config: util.extend({}, config)
                                        };
                                    });

                                    util.each([
                                        {id: "mod/ule", path: "/path/to/mod/ule", async: true},
                                        {id: "a/module", path: "/path/to/a/module", async: false},
                                        {id: "mod/ded", path: "/path/to/mod/ded", async: true}
                                    ], function (fixture) {
                                        describe("when the module's id is '" + fixture.id + "' and the require is " + (fixture.async ? "" : "not ") + "async", function () {
                                            beforeEach(function () {
                                                module.config.async = fixture.async;
                                                module.config.baseUrl = scenario.baseUrl;
                                                module.id = fixture.id;

                                                fs.realpathSync.withArgs(scenario.baseUrl + "/" + fixture.id + ".js").returns(fixture.path);

                                                if (!fixture.async) {
                                                    fs.readFileSync.returns("");
                                                }

                                                transport(callback, module);
                                            });

                                            if (fixture.async) {
                                                it("should read the file asynchronously", function () {
                                                    expect(fs.readFile).to.have.been.calledWith(fixture.path);
                                                });
                                            } else {
                                                it("should read the file synchronously", function () {
                                                    expect(fs.readFileSync).to.have.been.calledWith(fixture.path);
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });
    });
});
