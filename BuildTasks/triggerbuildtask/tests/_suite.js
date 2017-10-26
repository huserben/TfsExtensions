"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const assert = require("assert");
const ttm = require("vsts-task-lib/mock-test");
describe("TriggerBuildTaskTests", function () {
    before(() => {
        // todo
    });
    after(() => {
        // todo
    });
    it("should trigger build via tfs rest service for defined build when using default configuration", (done) => {
        //this.timeout(1000);
        let tp = path.join(__dirname, "input", "defaultConfigurationCallsTfsRestService.js");
        let tr = new ttm.MockTestRunner(tp);
        // act
        tr.run();
        // assert
        assert(tr.succeeded, "should have succeeded.");
    });
    it("should fail if definition is in current Team Project is not set", (done) => {
        this.timeout(1000);
        let tp = path.join(__dirname, "input", "currentTeamProjectMustBeSet.js");
        let tr = new ttm.MockTestRunner(tp);
        // act
        tr.run();
        // assert
        assert(!tr.succeeded, "should have failed");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "Should have one error");
        done();
    });
    it("should fail if build definition to trigger is not set", (done) => {
        this.timeout(1000);
        let tp = path.join(__dirname, "input", "buildDefinitionToTriggerMustBeSet.js");
        let tr = new ttm.MockTestRunner(tp);
        // act
        tr.run();
        // assert
        assert(!tr.succeeded, "should have failed");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "Should have one error");
        done();
    });
});
