"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const assert = require("assert");
const tr = require("../taskrunner");
const taskConstants = require("../taskconstants");
const tfsConstants = require("../tfsconstants");
const TypeMoq = require("typemoq");
describe("Task Runner Tests", function () {
    let subject;
    let tfsRestServiceMock;
    let tasklibraryMock;
    let generalFunctionsMock;
    let consoleLogSpy;
    let consoleWarnSpy;
    let consoleErrorSpy;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        tfsRestServiceMock = TypeMoq.Mock.ofType();
        tasklibraryMock = TypeMoq.Mock.ofType();
        generalFunctionsMock = TypeMoq.Mock.ofType();
        generalFunctionsMock.setup(gf => gf.trimValue(TypeMoq.It.isAnyString()))
            .returns(val => val);
        generalFunctionsMock.setup(gf => gf.trimValues(TypeMoq.It.isAny()))
            .returns(val => val);
        consoleLogSpy = sinon.spy(console, "log");
        consoleWarnSpy = sinon.spy(console, "warn");
        consoleErrorSpy = sinon.spy(console, "error");
        subject = new tr.TaskRunner(tfsRestServiceMock.object, tasklibraryMock.object, generalFunctionsMock.object);
        this.timeout(1000);
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        consoleLogSpy.restore();
        consoleWarnSpy.restore();
        consoleErrorSpy.restore();
    }));
    /* -------------------------------------------------------------------------
     *  Tests for reading Inputs
     * ------------------------------------------------------------------------- */
    it("should get input 'definition is in current team project' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'tfs server' correct", () => __awaiter(this, void 0, void 0, function* () {
        const tfsServerInput = "http://bla.blub";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => tfsServerInput);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.ServerUrlInput, false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(tfsServerInput), TypeMoq.Times.once());
    }));
    it("should get input 'build definitions to trigger' correct", () => __awaiter(this, void 0, void 0, function* () {
        var buildDefinitionsToTrigger = [
            "definition1, definition2"
        ];
        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => buildDefinitionsToTrigger);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValues(buildDefinitionsToTrigger), TypeMoq.Times.once());
    }));
    it("should get input 'ignore ssl certificae errors' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'queue build for user that triggered build' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.QueueBuildForUserInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'use same source version' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.UseSameSourceVersionInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'use same branch' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.UseSameBranchInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'branche to use' correct", () => __awaiter(this, void 0, void 0, function* () {
        const branchToUse = "MyBranch";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.BranchToUseInput, false))
            .returns(() => branchToUse);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.BranchToUseInput, false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(branchToUse), TypeMoq.Times.once());
    }));
    it("should get input 'wait for queued builds to finish' correct", () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'wait for queued builds to finish refresh time' correct", () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => "42");
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'fail task if build not successful' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true), TypeMoq.Times.once());
    }));
    it("should NOT get input 'download build artifacts' if 'fail task if build not successful' was false", () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => false);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DownloadBuildArtifacts, true), TypeMoq.Times.never());
    }));
    it("should get input 'download build artifacts' if 'fail task if build not successful' was true", () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DownloadBuildArtifacts, true), TypeMoq.Times.once());
    }));
    it("should get input 'drop directory' correct", () => __awaiter(this, void 0, void 0, function* () {
        const dropDirectory = "C:/wahtever/is/here/temp";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.DropDirectory, false))
            .returns(() => dropDirectory);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.DropDirectory, false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(dropDirectory), TypeMoq.Times.once());
    }));
    it("should get input 'store in variable' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'demands' correct", () => __awaiter(this, void 0, void 0, function* () {
        var demands = [
            "demand1, demand 2"
        ];
        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => demands);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValues(demands), TypeMoq.Times.once());
    }));
    it("should get input 'build Queue' correct", () => __awaiter(this, void 0, void 0, function* () {
        const buildQueue = "Build Queue";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.QueueID, false))
            .returns(() => buildQueue);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.QueueID, false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(buildQueue), TypeMoq.Times.once());
    }));
    it("should get input 'build parameters' correct", () => __awaiter(this, void 0, void 0, function* () {
        const buildParameters = "Whatever Paremeters we might have here...";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.BuildParametersInput, false))
            .returns(() => buildParameters);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.BuildParametersInput, false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(buildParameters), TypeMoq.Times.once());
    }));
    it("should get input 'authentication method' correct", () => __awaiter(this, void 0, void 0, function* () {
        const authenticationMethod = "Basic";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.AuthenticationMethodInput, true))
            .returns(() => authenticationMethod);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.AuthenticationMethodInput, true), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(authenticationMethod), TypeMoq.Times.never());
    }));
    it("should get input 'username' correct", () => __awaiter(this, void 0, void 0, function* () {
        const username = "donald";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.UsernameInput, false))
            .returns(() => username);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.UsernameInput, false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(username), TypeMoq.Times.never());
    }));
    it("should get input 'password' correct", () => __awaiter(this, void 0, void 0, function* () {
        const password = "P4s5W0rd";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.PasswordInput, false))
            .returns(() => password);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.PasswordInput, false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValue(password), TypeMoq.Times.never());
    }));
    it("should get input 'enable build in queue condition' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'include current build definition' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, false), TypeMoq.Times.once());
    }));
    it("should get input 'blocking builds' correct", () => __awaiter(this, void 0, void 0, function* () {
        var blockingBuilds = [
            "Build1, BuildDefinition 2"
        ];
        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", false))
            .returns(() => blockingBuilds);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValues(blockingBuilds), TypeMoq.Times.once());
    }));
    it("should get input 'depnedent on successfull build condition' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'dependent builds ' correct", () => __awaiter(this, void 0, void 0, function* () {
        var dependentBuilds = [
            "Build1, BuildDefinition 2"
        ];
        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false))
            .returns(() => dependentBuilds);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValues(dependentBuilds), TypeMoq.Times.once());
    }));
    it("should get input 'depnedent on failed build condition' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, true), TypeMoq.Times.once());
    }));
    it("should get input 'dependent failing builds ' correct", () => __awaiter(this, void 0, void 0, function* () {
        var dependentFailingBuilds = [
            "Build1, BuildDefinition 2"
        ];
        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false))
            .returns(() => dependentFailingBuilds);
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false), TypeMoq.Times.once());
        generalFunctionsMock.verify((gf) => gf.trimValues(dependentFailingBuilds), TypeMoq.Times.once());
    }));
    /* -------------------------------------------------------------------------
     *  Tests for parsing Inputs
     * ------------------------------------------------------------------------- */
    it("should initialize tfs rest service with read inputs", () => __awaiter(this, void 0, void 0, function* () {
        var tfsServer = "https://MyServer";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should read tfs server from environment variable when definition is in current project", () => __awaiter(this, void 0, void 0, function* () {
        const teamFoundationCollection = "https://myUrl.com/";
        const teamProject = "MyProject";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);
        process.env[tfsConstants.TeamFoundationCollectionUri] = teamFoundationCollection;
        process.env[tfsConstants.TeamProject] = teamProject;
        var expectedTfsAddress = `${teamFoundationCollection}${teamProject}`;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should use OAuth method if default credentials authentication is used", () => __awaiter(this, void 0, void 0, function* () {
        var authenticationMethod = tfsConstants.AuthenticationMethodDefaultCredentials;
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        var tfsServer = "https://MyServer";
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(tfsConstants.AuthenticationMethodOAuthToken, username, TypeMoq.It.isAny(), tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should try to fetch OAuth access token when using OAuth method and not having set a password", () => __awaiter(this, void 0, void 0, function* () {
        var tfsServer = "https://MyServer";
        var expectedOAuthToken = "fadsljlakdfsj12093ui1203";
        setupRestServiceConfiguration(tfsConstants.AuthenticationMethodOAuthToken, "", "", tfsServer, true);
        process.env[tfsConstants.OAuthAccessToken] = expectedOAuthToken;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(tfsConstants.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, true), TypeMoq.Times.once());
    }));
    it("should trigger build for all build definitions when no conditions are specified", () => __awaiter(this, void 0, void 0, function* () {
        var buildDefinition1 = "build1";
        var buildDefinition2 = "build2";
        var buildsToTrigger = [buildDefinition1, buildDefinition2];
        setupBuildConfiguration(buildsToTrigger);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(buildDefinition1, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        tfsRestServiceMock.verify(srv => srv.triggerBuild(buildDefinition2, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
    }));
    it("should NOT write queued build id to variable if not specified", () => __awaiter(this, void 0, void 0, function* () {
        const TriggeredBuildID = "1337";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => false);
        tfsRestServiceMock.setup(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return TriggeredBuildID; }));
        yield subject.run();
        tasklibraryMock.verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, TriggeredBuildID), TypeMoq.Times.never());
        assert(consoleLogSpy.neverCalledWith(`Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`));
    }));
    it("should write queued build id to variable if specified", () => __awaiter(this, void 0, void 0, function* () {
        const TriggeredBuildID = "1337";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);
        tfsRestServiceMock.setup(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return TriggeredBuildID; }));
        yield subject.run();
        tasklibraryMock.verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, TriggeredBuildID), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`));
    }));
    it("should concatenate queued build id if previous value is available", () => __awaiter(this, void 0, void 0, function* () {
        const TriggeredBuildID = "1337";
        const PreviousValue = "42";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => PreviousValue);
        setupBuildIdForTriggeredBuild("build", TriggeredBuildID);
        yield subject.run();
        tasklibraryMock
            .verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, `${PreviousValue},${TriggeredBuildID}`), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Following value is already stored in the variable: '${PreviousValue}'`));
    }));
    it("should write queued build id's comma separated to variable if specified", () => __awaiter(this, void 0, void 0, function* () {
        const TriggeredBuildID1 = "1337";
        const TriggeredBuildID2 = "42";
        setupBuildConfiguration(["build1", "build2"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);
        setupBuildIdForTriggeredBuild("build1", TriggeredBuildID1);
        setupBuildIdForTriggeredBuild("build2", TriggeredBuildID2);
        yield subject.run();
        tasklibraryMock
            .verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, `${TriggeredBuildID1},${TriggeredBuildID2}`), TypeMoq.Times.once());
    }));
    it("should NOT wait for build to finish if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.waitForBuildsToFinish([BuildID], true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.waitForBuildsToFinish([BuildID], true), TypeMoq.Times.never());
    }));
    it("should wait for build to finish if configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.waitForBuildsToFinish([BuildID], true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.waitForBuildsToFinish([BuildID], true), TypeMoq.Times.once());
    }));
    it("should wait and sleep for configured time while builds are not finished", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.waitForBuildsToFinish([BuildID], true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return false; }));
        tfsRestServiceMock.setup(srv => srv.waitForBuildsToFinish([BuildID], true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        yield subject.run();
        generalFunctionsMock.verify(gf => gf.sleep(WaitTime * 1000), TypeMoq.Times.once());
    }));
    it("should NOT download artifacts for build after completion if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        const DropDirectory = "C:/Whereever";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DownloadBuildArtifacts, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.DropDirectory, false))
            .returns(() => DropDirectory);
        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.waitForBuildsToFinish([BuildID], true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.never());
    }));
    it("should download artifacts for build after completion if configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        const DropDirectory = "C:/Whereever";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DownloadBuildArtifacts, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.DropDirectory, false))
            .returns(() => DropDirectory);
        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.waitForBuildsToFinish([BuildID], true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.once());
    }));
    it("should trigger build for user that trigger original build if configured", () => __awaiter(this, void 0, void 0, function* () {
        const UserName = "Buildy McBuildFace";
        const UserID = "12";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.QueueBuildForUserInput, true))
            .returns(() => true);
        var expectedRequestBody = `requestedFor: { id: \"${UserID}\"}`;
        process.env[tfsConstants.RequestedForUsername] = UserName;
        process.env[tfsConstants.RequestedForUserId] = UserID;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), expectedRequestBody, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Build shall be triggered for same user that triggered current build: ${UserName}`));
    }));
    it("should NOT trigger build for user that trigger original build if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const UserName = "Buildy McBuildFace";
        const UserID = "12";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.QueueBuildForUserInput, true))
            .returns(() => false);
        var expectedRequestBody = `requestedFor: { id: \"${UserID}\"}`;
        process.env[tfsConstants.RequestedForUsername] = UserName;
        process.env[tfsConstants.RequestedForUserId] = UserID;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), expectedRequestBody, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(!consoleLogSpy.calledWith(`Build shall be triggered for same user that triggered current build: ${UserName}`));
    }));
    it("should use same branch if configured", () => __awaiter(this, void 0, void 0, function* () {
        const BranchToUse = "MyBranch";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameBranchInput, true))
            .returns(() => true);
        process.env[tfsConstants.SourceBranch] = BranchToUse;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", BranchToUse, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Using same branch as source version: ${BranchToUse}`));
    }));
    it("should NOT use same branch if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const BranchToUse = "MyBranch";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameBranchInput, true))
            .returns(() => false);
        process.env[tfsConstants.SourceBranch] = BranchToUse;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", BranchToUse, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(!consoleLogSpy.calledWith(`Using same branch as source version: ${BranchToUse}`));
    }));
    it("should include build parameters if they are specified", () => __awaiter(this, void 0, void 0, function* () {
        const Params = "myParams";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.BuildParametersInput, false))
            .returns(() => Params);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), Params), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Will trigger build with following parameters: ${Params}`));
    }));
    it("should trigger build with same source version if configured", () => __awaiter(this, void 0, void 0, function* () {
        const SourceVersion = "1234";
        const RepoType = "Git";
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);
        setupBuildConfiguration(["build"]);
        process.env[tfsConstants.SourceVersion] = SourceVersion;
        process.env[tfsConstants.RepositoryType] = RepoType;
        var expectedSourceVersionBody = `sourceVersion: \"${SourceVersion}\"`;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), expectedSourceVersionBody, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Source Version: ${SourceVersion}`));
        assert(consoleLogSpy.calledWith(`Triggered Build will use the same source version: ${SourceVersion}`));
    }));
    it("should NOT trigger build with same source version if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const SourceVersion = "1234";
        const RepoType = "Git";
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => false);
        setupBuildConfiguration(["build"]);
        process.env[tfsConstants.SourceVersion] = SourceVersion;
        process.env[tfsConstants.RepositoryType] = RepoType;
        var expectedSourceVersionBody = `sourceVersion: \"${SourceVersion}\"`;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), expectedSourceVersionBody, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(!consoleLogSpy.calledWith(`Source Version: ${SourceVersion}`));
        assert(!consoleLogSpy.calledWith(`Triggered Build will use the same source version: ${SourceVersion}`));
    }));
    it("should prepend source version with C in TFS Repo", () => __awaiter(this, void 0, void 0, function* () {
        const SourceVersion = "1234";
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);
        setupBuildConfiguration(["build"]);
        process.env[tfsConstants.SourceVersion] = SourceVersion;
        process.env[tfsConstants.RepositoryType] = tfsConstants.TfsRepositoryType;
        var expectedSourceVersionBody = `sourceVersion: \"C${SourceVersion}\"`;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), expectedSourceVersionBody, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
    }));
    it("should not prepend source version with C in TFS Repo if already starts with C", () => __awaiter(this, void 0, void 0, function* () {
        const SourceVersion = "C1234";
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);
        setupBuildConfiguration(["build"]);
        process.env[tfsConstants.SourceVersion] = SourceVersion;
        process.env[tfsConstants.RepositoryType] = tfsConstants.TfsRepositoryType;
        var expectedSourceVersionBody = `sourceVersion: \"${SourceVersion}\"`;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), expectedSourceVersionBody, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
    }));
    it("should not prepend source version with C in TFS Repo if starts with L", () => __awaiter(this, void 0, void 0, function* () {
        const SourceVersion = "L1234";
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);
        setupBuildConfiguration(["build"]);
        process.env[tfsConstants.SourceVersion] = SourceVersion;
        process.env[tfsConstants.RepositoryType] = tfsConstants.TfsRepositoryType;
        var expectedSourceVersionBody = `sourceVersion: \"${SourceVersion}\"`;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), expectedSourceVersionBody, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
    }));
    it("should trigger build with demands specified", () => __awaiter(this, void 0, void 0, function* () {
        var expectedDemands = ["demand1", "demand2"];
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => expectedDemands);
        setupBuildConfiguration(["build"]);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.is(demands => areEqual(demands, expectedDemands)), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith("Will trigger build with following demands:"));
        assert(consoleLogSpy.calledWith("demand1"));
        assert(consoleLogSpy.calledWith("demand2"));
    }));
    it("should not log anything if no demands are specified", () => __awaiter(this, void 0, void 0, function* () {
        var expectedDemands = [];
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => expectedDemands);
        setupBuildConfiguration(["build"]);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(!consoleLogSpy.calledWith("Will trigger build with following demands:"));
    }));
    it("should convert demands which check for equality", () => __awaiter(this, void 0, void 0, function* () {
        var demands = ["demand=test123"];
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => demands);
        setupBuildConfiguration(["build"]);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.is(demands => areEqual(demands, ["demand -equals test123"])), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
    }));
    it("should fetch queue id by name if string was specified", () => __awaiter(this, void 0, void 0, function* () {
        const QueueID = 7;
        const QueueName = "My Favorite Queue";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.QueueID, false))
            .returns(() => QueueName);
        tfsRestServiceMock.setup(srv => srv.getQueueIdByName(QueueName))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return QueueID; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), QueueID, TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Build Queue was specified as string: ${QueueName} - trying to fetch Queue ID for the queue...`));
        assert(consoleLogSpy.calledWith(`Found id of queue ${QueueName}: ${QueueID}`));
        assert(consoleLogSpy.calledWith(`Will trigger build in following agent queue: ${QueueID}`));
    }));
    it("should pass build queue id if specified as integer", () => __awaiter(this, void 0, void 0, function* () {
        const QueueID = 7;
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.QueueID, false))
            .returns(() => QueueID.toString());
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild("build", TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), QueueID, TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Will trigger build in following agent queue: ${QueueID}`));
    }));
    it("should check if any builds are queued if build in queue condition is true", () => __awaiter(this, void 0, void 0, function* () {
        var blockingBuilds = ["Build1", "Build2"];
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus(TypeMoq.It.isAny(), tfsConstants.BuildStateNotStarted))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return []; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.getBuildsByStatus("Build1", tfsConstants.BuildStateNotStarted), TypeMoq.Times.once());
        tfsRestServiceMock.verify(srv => srv.getBuildsByStatus("Build2", tfsConstants.BuildStateNotStarted), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith("Build in Queue Condition is enabled"));
        assert(consoleLogSpy.calledWith("Following builds are blocking:"));
        assert(consoleLogSpy.calledWith("Build1"));
        assert(consoleLogSpy.calledWith("Build2"));
    }));
    it("should include current build definition in blocking builds list if enabled", () => __awaiter(this, void 0, void 0, function* () {
        const CurrentBuildDefinition = "My Build";
        var blockingBuilds = [];
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);
        process.env[tfsConstants.CurrentBuildDefinition] = CurrentBuildDefinition;
        yield subject.run();
        assert(consoleLogSpy.calledWith("Build in Queue Condition is enabled"));
        assert(consoleLogSpy.calledWith("Following builds are blocking:"));
        assert(consoleLogSpy.calledWith("Current Build Definition shall be included"));
        assert(consoleLogSpy.calledWith(CurrentBuildDefinition));
    }));
    it("should not trigger build if build is in queue", () => __awaiter(this, void 0, void 0, function* () {
        var blockingBuilds = ["Build"];
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);
        var buildMock = TypeMoq.Mock.ofType();
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", tfsConstants.BuildStateNotStarted))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return [buildMock.object]; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(`Build is queued - will not trigger new build.`));
    }));
    it("should trigger new build if no build is in queue", () => __awaiter(this, void 0, void 0, function* () {
        var blockingBuilds = ["Build"];
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", tfsConstants.BuildStateNotStarted))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return []; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith("None of the blocking builds is queued - proceeding"));
    }));
    it(`should not trigger build if dependant on successful build condition is enabled and
    last build was not successful`, () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => ["Build"]);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);
        var buildMock = TypeMoq.Mock.ofType();
        buildMock.setup(b => b.result).returns(() => "Failed");
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return [buildMock.object]; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith("Checking if dependant build definitions last builds were successful"));
        assert(consoleLogSpy.calledWith("Checking build Build"));
    }));
    it(`should trigger build if dependant on successful build condition is enabled and
        last build was successful`, () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => ["Build"]);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);
        var buildMock = TypeMoq.Mock.ofType();
        buildMock.setup(b => b.result).returns(() => tfsConstants.BuildResultSucceeded);
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return [buildMock.object]; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith("None of the dependant build definitions last builds were failing - proceeding"));
    }));
    it(`should trigger build if dependant on successful build condition is enabled and
                there is no build found to check`, () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => ["Build"]);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return []; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
    }));
    it(`should not trigger build if dependant on failed build condition is enabled and
        last build was not failed`, () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => ["Build"]);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);
        var buildMock = TypeMoq.Mock.ofType();
        buildMock.setup(b => b.result).returns(() => tfsConstants.BuildResultSucceeded);
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return [buildMock.object]; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith("Checking if dependant build definitions last builds were NOT successful"));
    }));
    it(`should trigger build if dependant on failed build condition is enabled and
            last build was not successful`, () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => ["Build"]);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);
        var buildMock = TypeMoq.Mock.ofType();
        buildMock.setup(b => b.result).returns(() => "Failed");
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return [buildMock.object]; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith("None of the dependant build definitions last builds were successful - proceeding"));
    }));
    it(`should trigger build if dependant on failed build condition is enabled and
                    there is no build found to check`, () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => ["Build"]);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);
        tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return []; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.triggerBuild(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
    }));
    function areEqual(a, b) {
        a.forEach(element => {
            if (b.indexOf(element) < 0) {
                return false;
            }
        });
        return true;
    }
    function setupBuildIdForTriggeredBuild(buildConfig, buildID) {
        tfsRestServiceMock.setup(srv => srv.triggerBuild(buildConfig, TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return buildID; }));
    }
    function setupBuildConfiguration(buildsToTrigger) {
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", TypeMoq.It.isAny()))
            .returns(() => buildsToTrigger);
        generalFunctionsMock.setup(gf => gf.trimValues(buildsToTrigger)).returns(() => buildsToTrigger);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, TypeMoq.It.isAny()))
            .returns(() => false);
    }
    function setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, IgnoreSslCertificateErrorsInput) {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.ServerUrlInput, TypeMoq.It.isAny()))
            .returns(() => tfsServer);
        generalFunctionsMock.setup(gf => gf.trimValue(tfsServer)).returns(() => tfsServer);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.AuthenticationMethodInput, TypeMoq.It.isAny()))
            .returns(() => authenticationMethod);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.UsernameInput, TypeMoq.It.isAny()))
            .returns(() => username);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.PasswordInput, TypeMoq.It.isAny()))
            .returns(() => password);
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, TypeMoq.It.isAny()))
            .returns(() => IgnoreSslCertificateErrorsInput);
    }
});
