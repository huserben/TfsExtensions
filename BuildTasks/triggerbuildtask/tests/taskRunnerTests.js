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
const tr = require("../taskrunner");
const taskConstants = require("../taskconstants");
const tfsConstants = require("../tfsconstants");
const TypeMoq = require("typemoq");
describe("Task Runner Tests", function () {
    let subject;
    let tfsRestServiceMock;
    let tasklibraryMock;
    let generalFunctionsMock;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        tfsRestServiceMock = TypeMoq.Mock.ofType();
        tasklibraryMock = TypeMoq.Mock.ofType();
        generalFunctionsMock = TypeMoq.Mock.ofType();
        subject = new tr.TaskRunner(tfsRestServiceMock.object, tasklibraryMock.object, generalFunctionsMock.object);
        this.timeout(1000);
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
    it("should initialize tfs rest service with read inputs", () => {
        var tfsServer = "https://MyServer";
        var authenticationMethod = "Basic";
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);
        subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    });
    it("should read tfs server from environment variable when definition is in current project", () => {
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
        subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    });
    it("should use OAuth method if default credentials authentication is used", () => {
        var authenticationMethod = tfsConstants.AuthenticationMethodDefaultCredentials;
        var username = "User1";
        var password = "P4s5W0rd";
        var ignoreSSLErrors = true;
        var tfsServer = "https://MyServer";
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);
        subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(tfsConstants.AuthenticationMethodOAuthToken, username, TypeMoq.It.isAny(), tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    });
    it("should try to fetch OAuth access token when using OAuth method and not having set a password", () => {
        var tfsServer = "https://MyServer";
        var expectedOAuthToken = "fadsljlakdfsj12093ui1203";
        setupRestServiceConfiguration(tfsConstants.AuthenticationMethodOAuthToken, "", "", tfsServer, true);
        process.env[tfsConstants.OAuthAccessToken] = expectedOAuthToken;
        subject.run();
        tfsRestServiceMock.verify(srv => srv.initialize(tfsConstants.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, true), TypeMoq.Times.once());
    });
    function setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, IgnoreSslCertificateErrorsInput) {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => tfsServer);
        generalFunctionsMock.setup(gf => gf.trimValue(tfsServer)).returns(() => tfsServer);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.AuthenticationMethodInput, true))
            .returns(() => authenticationMethod);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.UsernameInput, false))
            .returns(() => username);
        tasklibraryMock.setup(lib => lib.getInput(taskConstants.PasswordInput, false))
            .returns(() => password);
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true))
            .returns(() => IgnoreSslCertificateErrorsInput);
    }
});
