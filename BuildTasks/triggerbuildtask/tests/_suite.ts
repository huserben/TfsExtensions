import * as path from "path";
import * as assert from "assert";
import * as ttm from "vsts-task-lib/mock-test";

describe("TriggerBuildTaskTests", function (): void {
    before(() => {
        // todo
    });

    after(() => {
        // todo
    });

    it("should trigger build via tfs rest service for defined build when using default configuration", (done: MochaDone) => {
        //this.timeout(1000);

        let tp : string = path.join(__dirname, "input", "defaultConfigurationCallsTfsRestService.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        // act
        tr.run();

        // assert
        assert(tr.succeeded, "should have succeeded.");
    });

    it("should fail if definition is in current Team Project is not set", (done: MochaDone) => {
        this.timeout(1000);
        let tp : string = path.join(__dirname, "input", "currentTeamProjectMustBeSet.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        // act
        tr.run();

        // assert
        assert(!tr.succeeded, "should have failed");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "Should have one error");

        done();
    });

    it("should fail if build definition to trigger is not set", (done: MochaDone) => {
        this.timeout(1000);
        let tp : string = path.join(__dirname, "input", "buildDefinitionToTriggerMustBeSet.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        // act
        tr.run();

        // assert
        assert(!tr.succeeded, "should have failed");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "Should have one error");

        done();
    });
});
