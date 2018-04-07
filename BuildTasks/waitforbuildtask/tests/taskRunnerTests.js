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
const tfsService = require("tfsrestservice");
const taskConstants = require("../taskconstants");
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
    it("should get input 'ignore ssl certificae errors' correct", () => __awaiter(this, void 0, void 0, function* () {
        yield subject.run();
        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true), TypeMoq.Times.once());
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
    it("should get build id to await from the variable", () => __awaiter(this, void 0, void 0, function* () {
        const StoredBuildId = "12";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => StoredBuildId);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        yield subject.run();
        assert(consoleLogSpy.calledWith(`Following Builds are awaited: ${StoredBuildId}`));
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
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
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
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);
        process.env[tfsService.TeamFoundationCollectionUri] = teamFoundationCollection;
        process.env[tfsService.TeamProject] = teamProject;
        var expectedTfsAddress = `${teamFoundationCollection}${teamProject}`;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should read tfs server url from input when definition is not in current project", () => __awaiter(this, void 0, void 0, function* () {
        const expectedTfsAddress = "https://myUrl.com/DefaultCollection/My Project";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => expectedTfsAddress);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);
        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should unescape spaces from tfs server input", () => __awaiter(this, void 0, void 0, function* () {
        const inputTfsAddress = "https://myUrl.com/DefaultCollection/My%20Project";
        const expectedTfsAddress = "https://myUrl.com/DefaultCollection/My Project";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => inputTfsAddress);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);
        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should use OAuth method if default credentials authentication is used", () => __awaiter(this, void 0, void 0, function* () {
        var authenticationMethod = taskConstants.AuthenticationMethodDefaultCredentials;
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        var tfsServer = "https://MyServer";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(tfsService.AuthenticationMethodOAuthToken, username, TypeMoq.It.isAny(), tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should try to fetch OAuth access token when using OAuth method and not having set a password", () => __awaiter(this, void 0, void 0, function* () {
        var tfsServer = "https://MyServer";
        var expectedOAuthToken = "fadsljlakdfsj12093ui1203";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupRestServiceConfiguration(tfsService.AuthenticationMethodOAuthToken, "", "", tfsServer, true);
        process.env[tfsService.OAuthAccessToken] = expectedOAuthToken;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(tfsService.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, true), TypeMoq.Times.once());
    }));
    it("should wait for build to finish", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupBuildInfoMock(BuildID, "somebuild", "someLink");
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.areBuildsFinished([BuildID], true, true), TypeMoq.Times.once());
    }));
    it("should log info for awaited builds", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        const DefinitionName = "someBuild";
        const ExpectedLink = `http://someLink.ToTheBuild.expected
        `;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return false; }));
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);
        yield subject.run();
        assert(consoleLogSpy.calledWith(`Build ${BuildID} (${DefinitionName}): ${ExpectedLink.trim()}`));
    }));
    it("should wait and sleep for configured time while builds are not finished", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return false; }));
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupBuildInfoMock(BuildID, "somebuild", "someLink");
        yield subject.run();
        generalFunctionsMock.verify(gf => gf.sleep(WaitTime * 1000), TypeMoq.Times.once());
    }));
    it("should NOT download artifacts for build after completion if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        const DropDirectory = "C:/Whereever";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DownloadBuildArtifacts, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.DropDirectory, false))
            .returns(() => DropDirectory);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.never());
    }));
    it("should download artifacts for build after completion if configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        const DropDirectory = "C:/Whereever";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DownloadBuildArtifacts, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.DropDirectory, false))
            .returns(() => DropDirectory);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupBuildInfoMock(BuildID, "somebuild", "someLink");
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.once());
    }));
    it("should clear variable if configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        const DefinitionName = "someBuild";
        const ExpectedLink = `http://someLink.ToTheBuild.expected
        `;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => true);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, false))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return false; }));
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, false))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);
        yield subject.run();
        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.once());
    }));
    it("should NOT clear variable if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const WaitTime = 10;
        const BuildID = "12";
        const DefinitionName = "someBuild";
        const ExpectedLink = `http://someLink.ToTheBuild.expected
        `;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => false);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return false; }));
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);
        yield subject.run();
        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.never());
    }));
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
    function setupBuildInfoMock(buildID, definition, link) {
        var buildInfoMock = TypeMoq.Mock.ofType();
        var definitionObj = { name: definition };
        buildInfoMock.setup(bi => bi.definition).returns(() => definitionObj);
        var links = {
            web: {
                href: link
            }
        };
        buildInfoMock.setup(bi => bi._links).returns(() => links);
        tfsRestServiceMock.setup(service => service.getBuildInfo(buildID)).returns(() => __awaiter(this, void 0, void 0, function* () { return buildInfoMock.target; }));
    }
});
//# sourceMappingURL=taskRunnerTests.js.map