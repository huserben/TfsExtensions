"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const tr = require("../taskrunner");
const tfsService = require("tfsrestservice");
const assert = require("assert");
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
    /* -------------------------------------------------------------------------
     *  Tests for parsing Inputs
     * ------------------------------------------------------------------------- */
    it("should initialize tfs rest service with read inputs", () => __awaiter(this, void 0, void 0, function* () {
        var tfsServer = "https://MyServer";
        var teamProject = "TeamProject";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, teamProject, ignoreSSLErrors);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, tfsServer, teamProject, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should read tfs server from environment variable when definition is in current project", () => __awaiter(this, void 0, void 0, function* () {
        const teamFoundationCollection = "https://myUrl.com/";
        const teamProjectId = "42";
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
        setupRestServiceConfiguration(authenticationMethod, username, password, "", "", ignoreSSLErrors);
        process.env[tfsService.TeamFoundationCollectionUri] = teamFoundationCollection;
        process.env[tfsService.TeamProjectId] = teamProjectId;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, teamFoundationCollection, teamProjectId, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should read tfs server url from input when definition is not in current project", () => __awaiter(this, void 0, void 0, function* () {
        const expectedTfsAddress = "https://myUrl.com/DefaultCollection";
        const teamProject = "TeamProject";
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
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.TeamProjectInput, false))
            .returns(() => teamProject);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", "", ignoreSSLErrors);
        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedTfsAddress, teamProject, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should decode spaces from tfs server input when using current team project url", () => __awaiter(this, void 0, void 0, function* () {
        var collectionUrl = "https://somevstsinstance.visualstudio.com/Default%20Collection/";
        var teamProjectId = "12";
        var expectedUrl = "https://somevstsinstance.visualstudio.com/Default Collection/";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.AuthenticationMethodInput, TypeMoq.It.isAny()))
            .returns(() => authenticationMethod);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.UsernameInput, TypeMoq.It.isAny()))
            .returns(() => username);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.PasswordInput, TypeMoq.It.isAny()))
            .returns(() => password);
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, TypeMoq.It.isAny()))
            .returns(() => ignoreSSLErrors);
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        process.env[tfsService.TeamFoundationCollectionUri] = collectionUrl;
        process.env[tfsService.TeamProjectId] = teamProjectId;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedUrl, teamProjectId, ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should decode spaces from tfs server input when using manual input url", () => __awaiter(this, void 0, void 0, function* () {
        const inputTfsAddress = "https://myUrl.com/Default%20Collection";
        const expectedTfsAddress = "https://myUrl.com/Default Collection";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => inputTfsAddress);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", "", ignoreSSLErrors);
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedTfsAddress, "", ignoreSSLErrors), TypeMoq.Times.once());
    }));
    it("should try to fetch OAuth access token when using OAuth method and not having set a password", () => __awaiter(this, void 0, void 0, function* () {
        var tfsServer = "https://MyServer";
        var expectedOAuthToken = "fadsljlakdfsj12093ui1203";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => __awaiter(this, void 0, void 0, function* () { return true; }));
        setupRestServiceConfiguration(tfsService.AuthenticationMethodOAuthToken, "", "", tfsServer, "", true);
        process.env[tfsService.OAuthAccessToken] = expectedOAuthToken;
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(tfsService.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, "", true), TypeMoq.Times.once());
    }));
    it("should cancel builds ", () => __awaiter(this, void 0, void 0, function* () {
        const BuildID = 12;
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        setupBuildInfoMock(BuildID, "somebuild", "someLink");
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.cancelBuild(BuildID), TypeMoq.Times.once());
    }));
    it("should log if no build id as variable is available ", () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => undefined);
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.cancelBuild(TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" under Advanced Configuration for all the Triggered Builds you want to await.`));
        assert(consoleLogSpy.calledWith(`Value ${""} is not a valid build id - skipping`));
    }));
    it("should log if no valid build id as variable is available ", () => __awaiter(this, void 0, void 0, function* () {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => "asdf");
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.cancelBuild(TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" under Advanced Configuration for all the Triggered Builds you want to await.`));
        assert(consoleLogSpy.calledWith(`Value ${"asdf"} is not a valid build id - skipping`));
    }));
    it("should skip build to cancel if its not available anymore ", () => __awaiter(this, void 0, void 0, function* () {
        const BuildID = 12;
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        yield subject.run();
        tfsRestServiceMock.verify(srv => srv.cancelBuild(TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(`No Build with ID ${BuildID} found - skipping`));
    }));
    it("should clear variable if configured", () => __awaiter(this, void 0, void 0, function* () {
        const BuildID = 12;
        const DefinitionName = "someBuild";
        const ExpectedLink = `http://someLink.ToTheBuild.expected
        `;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => true);
        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);
        yield subject.run();
        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.once());
    }));
    it("should NOT clear variable if not configured", () => __awaiter(this, void 0, void 0, function* () {
        const BuildID = 12;
        const DefinitionName = "someBuild";
        const ExpectedLink = `http://someLink.ToTheBuild.expected
        `;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => false);
        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);
        yield subject.run();
        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.never());
    }));
    function setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, teamProject, IgnoreSslCertificateErrorsInput) {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.ServerUrlInput, TypeMoq.It.isAny()))
            .returns(() => tfsServer);
        generalFunctionsMock.setup(gf => gf.trimValue(tfsServer)).returns(() => tfsServer);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.TeamProjectInput, TypeMoq.It.isAny()))
            .returns(() => teamProject);
        generalFunctionsMock.setup(gf => gf.trimValue(teamProject)).returns(() => teamProject);
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