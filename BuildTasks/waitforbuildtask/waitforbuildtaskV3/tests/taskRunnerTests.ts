import sinon = require("sinon");
import assert = require("assert");
import tr = require("../taskrunner");
import tfsService = require("tfsrestservice");
import common = require("../generalfunctions");
import tl = require("../tasklibrary");
import taskConstants = require("../taskconstants");
import * as TypeMoq from "typemoq";
import { Build } from "azure-devops-node-api/interfaces/BuildInterfaces";

describe("Task Runner Tests", function (): void {
    let subject: tr.TaskRunner;
    let tfsRestServiceMock: TypeMoq.IMock<tfsService.ITfsRestService>;
    let tasklibraryMock: TypeMoq.IMock<tl.ITaskLibrary>;
    let generalFunctionsMock: TypeMoq.IMock<common.IGeneralFunctions>;

    let consoleLogSpy: sinon.SinonSpy;
    let consoleWarnSpy: sinon.SinonSpy;
    let consoleErrorSpy: sinon.SinonSpy;

    beforeEach(async () => {
        tfsRestServiceMock = TypeMoq.Mock.ofType<tfsService.ITfsRestService>();
        tasklibraryMock = TypeMoq.Mock.ofType<tl.ITaskLibrary>();
        generalFunctionsMock = TypeMoq.Mock.ofType<common.IGeneralFunctions>();

        generalFunctionsMock.setup(gf => gf.trimValue(TypeMoq.It.isAnyString()))
            .returns(val => val);
        generalFunctionsMock.setup(gf => gf.trimValues(TypeMoq.It.isAny()))
            .returns(val => val);

        consoleLogSpy = sinon.spy(console, "log");
        consoleWarnSpy = sinon.spy(console, "warn");
        consoleErrorSpy = sinon.spy(console, "error");

        subject = new tr.TaskRunner(
            tfsRestServiceMock.object,
            tasklibraryMock.object,
            generalFunctionsMock.object
        );

        this.timeout(1000);
    });

    afterEach(async () => {
        consoleLogSpy.restore();
        consoleWarnSpy.restore();
        consoleErrorSpy.restore();
    });

    /* -------------------------------------------------------------------------
     *  Tests for reading Inputs
     * ------------------------------------------------------------------------- */
    it("should get input 'definition is in current team project' correct", async () => {
        await subject.run();

        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'tfs server' correct", async () => {
        const tfsServerInput: string = "http://bla.blub";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => tfsServerInput);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.ServerUrlInput, false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(tfsServerInput), TypeMoq.Times.once());
    });

    it("should get input 'ignore ssl certificae errors' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'wait for queued builds to finish refresh time' correct", async () => {
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => "42");

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'fail task if build not successful' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'cancel Builds If Any Fails' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.CancelBuildsIfAnyFailsInput, true),
            TypeMoq.Times.once());
    });

    it("should NOT get input 'download build artifacts' if 'fail task if build not successful' was false", async () => {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => false);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DownloadBuildArtifacts, true),
            TypeMoq.Times.never());
    });

    it("should get input 'download build artifacts' if 'fail task if build not successful' was true", async () => {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DownloadBuildArtifacts, true),
            TypeMoq.Times.once());
    });

    it("should get input 'drop directory' correct", async () => {
        const dropDirectory: string = "C:/wahtever/is/here/temp";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.DropDirectory, false))
            .returns(() => dropDirectory);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.DropDirectory, false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(dropDirectory), TypeMoq.Times.once());
    });

    it("should get input 'authentication method' correct", async () => {
        const authenticationMethod: string = "Basic";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.AuthenticationMethodInput, true))
            .returns(() => authenticationMethod);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.AuthenticationMethodInput, true),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(authenticationMethod), TypeMoq.Times.never());
    });

    it("should get input 'username' correct", async () => {
        const username: string = "donald";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.UsernameInput, false))
            .returns(() => username);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.UsernameInput, false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(username), TypeMoq.Times.never());
    });

    it("should get input 'password' correct", async () => {
        const password: string = "P4s5W0rd";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.PasswordInput, false))
            .returns(() => password);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.PasswordInput, false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(password), TypeMoq.Times.never());
    });

    it("should get build id to await from the variable", async () => {
        const StoredBuildId: string = "12";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => StoredBuildId);

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);

        await subject.run();

        assert(consoleLogSpy.calledWith(`Following Builds are awaited: ${StoredBuildId}`));
    });

    /* -------------------------------------------------------------------------
     *  Tests for parsing Inputs
     * ------------------------------------------------------------------------- */
    it("should initialize tfs rest service with read inputs", async () => {
        var tfsServer: string = "https://MyServer";
        var teamProject: string = "MyProject";
        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, teamProject, ignoreSSLErrors);

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, tfsServer, teamProject, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should read tfs server from environment variable when definition is in current project", async () => {
        const teamFoundationCollection: string = "https://myUrl.com/";
        const teamProject: string = "MyProject";

        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = teamFoundationCollection;
        process.env[tfsService.TeamProjectId] = teamProject;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, teamFoundationCollection, teamProject, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should read tfs server url from input when definition is not in current project", async () => {
        const expectedTfsAddress: string = "https://myUrl.com/DefaultCollection";
        const expectedTeamProject: string = "My Project";

        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => expectedTfsAddress);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.TeamProjectInput, false))
            .returns(() => expectedTeamProject);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, expectedTeamProject, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should decode spaces from tfs server input when using current team project url", async () => {
        var collectionUrl: string = "https://somevstsinstance.visualstudio.com/Default%20Collection";
        var teamProject: string = "Team Project";
        var expectedUrl: string = "https://somevstsinstance.visualstudio.com/Default Collection";
        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

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
            .returns(async () => true);

        process.env[tfsService.TeamFoundationCollectionUri] = collectionUrl;
        process.env[tfsService.TeamProjectId] = teamProject;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedUrl, teamProject, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should decode spaces from tfs server input when using manual input url", async () => {
        const inputTfsAddress: string = "https://myUrl.com/Default%20Collection";
        const expectedTfsAddress: string = "https://myUrl.com/Default Collection";

        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => inputTfsAddress);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", "", ignoreSSLErrors);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);

        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, "", ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should try to fetch OAuth access token when using OAuth method and not having set a password", async () => {
        var tfsServer: string = "https://MyServer";
        var expectedOAuthToken: string = "fadsljlakdfsj12093ui1203";

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tasklibraryMock.setup(tl => tl.getVariable("System.AccessToken"))
            .returns(() => expectedOAuthToken);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);
        setupRestServiceConfiguration(tfsService.AuthenticationMethodOAuthToken, "", "", tfsServer, "", true);

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            tfsService.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, "", true), TypeMoq.Times.once());
    });

    it("should wait for build to finish", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => true);

        setupBuildInfoMock(BuildID, "somebuild", "someLink");

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.areBuildsFinished([BuildID], true, true), TypeMoq.Times.once());
    });

    it("should throw an error if build to await is not available anymore", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => true);

        await subject.run();

        tasklibraryMock.verify(x => x.setResult(tl.TaskResult.Failed, `Build with id ${BuildID} is not available anymore!`), TypeMoq.Times.once());
        tfsRestServiceMock.verify(
            srv => srv.areBuildsFinished([BuildID], true, true), TypeMoq.Times.never());
    });

    it("should log info for awaited builds", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => false);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => true);

        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);

        await subject.run();

        assert(consoleLogSpy.calledWith(`Build ${BuildID} (${DefinitionName}): ${ExpectedLink.trim()}`));
    });

    it("should fail task if build failes if configured", async () => {
        const ErrorMessage: string = "Upps, build failed";
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.CancelBuildsIfAnyFailsInput, true))
            .returns(() => false);

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .throws(new Error(ErrorMessage));

        setupBuildInfoMock(BuildID, DefinitionName, "someLink");

        await subject.run();

        tasklibraryMock.verify(x => x.setResult(tl.TaskResult.Failed, ErrorMessage), TypeMoq.Times.once());
    });

    it("should NOT fail task if build failes if not configured", async () => {
        const ErrorMessage: string = "Upps, build failed";
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.CancelBuildsIfAnyFailsInput, true))
            .returns(() => false);

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], false, true))
            .returns(async () => true);

        setupBuildInfoMock(BuildID, DefinitionName, "someLink");

        await subject.run();

        tasklibraryMock.verify(x => x.setResult(tl.TaskResult.Failed, ErrorMessage), TypeMoq.Times.never());
    });

    it("should cancel awaited builds if one failes", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.CancelBuildsIfAnyFailsInput, true))
            .returns(() => true);

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .throws(new Error("Upps, build failed"));

        setupBuildInfoMock(BuildID, DefinitionName, "someLink");

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.cancelBuild(BuildID), TypeMoq.Times.once());
    });

    it("should wait and sleep for configured time while builds are not finished", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => false);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => true);

        setupBuildInfoMock(BuildID, "somebuild", "someLink");

        await subject.run();

        generalFunctionsMock.verify(gf => gf.sleep(WaitTime * 1000), TypeMoq.Times.once());
    });

    it("should NOT download artifacts for build after completion if not configured", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DropDirectory: string = "C:/Whereever";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
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
            .returns(async () => true);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.never());
    });

    it("should download artifacts for build after completion if configured", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DropDirectory: string = "C:/Whereever";
        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
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
            .returns(async () => true);

        setupBuildInfoMock(BuildID, "somebuild", "someLink");

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.once());
    });

    it("should clear variable if configured", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => true);

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, false))
            .returns(async () => false);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, false))
            .returns(async () => true);

        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);

        await subject.run();

        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.once());
    });

    it("should clear variable if configured as well when task fails", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => true);

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, false))
            .throws(new Error("Build failed"));

        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);

        await subject.run();

        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.once());
    });

    it("should NOT clear variable if not configured", async () => {
        const WaitTime: number = 10;
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => false);

        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => false);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true, true))
            .returns(async () => true);

        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);

        await subject.run();

        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.never());
    });

    function setupRestServiceConfiguration(
        authenticationMethod: string,
        username: string,
        password: string,
        tfsServer: string,
        teamProject: string,
        IgnoreSslCertificateErrorsInput: boolean): void {
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

    function setupBuildInfoMock(
        buildID: number,
        definition: string,
        link: string
    ): void {
        var buildInfoMock: TypeMoq.IMock<Build> = TypeMoq.Mock.ofType<Build>();

        var definitionObj: any = { name: definition };
        buildInfoMock.setup(bi => bi.definition).returns(() => definitionObj);

        var links: any = {
            web: {
                href: link
            }
        };

        buildInfoMock.setup(bi => bi._links).returns(() => links);

        tfsRestServiceMock.setup(service => service.getBuildInfo(buildID)).returns(async () => buildInfoMock.target);
    }
});