import sinon = require("sinon");
import assert = require("assert");
import tr = require("../taskrunner");
import common = require("../generalfunctions");
import tl = require("../tasklibrary");
import tfsService = require("tfsrestservice");
import taskConstants = require("../taskconstants");
import * as TypeMoq from "typemoq";

describe("Task Runner Tests", function (): void {
    let subject: tr.TaskRunner;
    let tfsRestServiceMock: TypeMoq.IMock<tfsService.ITfsRestService>;
    let tasklibraryMock: TypeMoq.IMock<tl.ITaskLibrary>;
    let generalFunctionsMock: TypeMoq.IMock<common.IGeneralFunctions>;

    let consoleLogSpy: sinon.SinonSpy;

    beforeEach(async () => {
        tfsRestServiceMock = TypeMoq.Mock.ofType<tfsService.ITfsRestService>();
        tasklibraryMock = TypeMoq.Mock.ofType<tl.ITaskLibrary>();
        generalFunctionsMock = TypeMoq.Mock.ofType<common.IGeneralFunctions>();

        generalFunctionsMock.setup(gf => gf.trimValue(TypeMoq.It.isAnyString()))
            .returns(val => val);
        generalFunctionsMock.setup(gf => gf.trimValues(TypeMoq.It.isAny()))
            .returns(val => val);

        consoleLogSpy = sinon.spy(console, "log");

        subject = new tr.TaskRunner(
            tfsRestServiceMock.object,
            tasklibraryMock.object,
            generalFunctionsMock.object
        );

        this.timeout(1000);
    });

    afterEach(async () => {
        consoleLogSpy.restore();
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

    it("should get input 'build definitions to trigger' correct", async () => {
        var buildDefinitionsToTrigger: string[] = [
            "definition1, definition2"
        ];

        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => buildDefinitionsToTrigger);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValues(buildDefinitionsToTrigger), TypeMoq.Times.once());
    });

    it("should get input 'ignore ssl certificae errors' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'queue build for user that triggered build' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.QueueBuildForUserInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'use same source version' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.UseSameSourceVersionInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'use same branch' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.UseSameBranchInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'branche to use' correct", async () => {
        const branchToUse: string = "MyBranch";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.BranchToUseInput, false))
            .returns(() => branchToUse);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.BranchToUseInput, false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(branchToUse), TypeMoq.Times.once());
    });

    it("should get input 'wait for queued builds to finish' correct", async () => {
        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true),
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

    it("should get input 'store in variable' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'demands' correct", async () => {
        var demands: string[] = [
            "demand1, demand 2"
        ];

        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => demands);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValues(demands), TypeMoq.Times.once());
    });

    it("should get input 'build Queue' correct", async () => {
        const buildQueue: string = "Build Queue";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.QueueID, false))
            .returns(() => buildQueue);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.QueueID, false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(buildQueue), TypeMoq.Times.once());
    });

    it("should get input 'build parameters' correct", async () => {
        const buildParameters: string = "Whatever Paremeters we might have here...";
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.BuildParametersInput, false))
            .returns(() => buildParameters);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getInput(taskConstants.BuildParametersInput, false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValue(buildParameters), TypeMoq.Times.once());
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

    it("should get input 'enable build in queue condition' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'include current build definition' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, false),
            TypeMoq.Times.once());
    });

    it("should get input 'blocking builds' correct", async () => {
        var blockingBuilds: string[] = [
            "Build1, BuildDefinition 2"
        ];

        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", false))
            .returns(() => blockingBuilds);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValues(blockingBuilds), TypeMoq.Times.once());
    });

    it("should get input 'depnedent on successfull build condition' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'dependent builds ' correct", async () => {
        var dependentBuilds: string[] = [
            "Build1, BuildDefinition 2"
        ];

        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false))
            .returns(() => dependentBuilds);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValues(dependentBuilds), TypeMoq.Times.once());
    });

    it("should get input 'depnedent on failed build condition' correct", async () => {
        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, true),
            TypeMoq.Times.once());
    });

    it("should get input 'dependent failing builds ' correct", async () => {
        var dependentFailingBuilds: string[] = [
            "Build1, BuildDefinition 2"
        ];

        tasklibraryMock.setup((lib) => lib.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false))
            .returns(() => dependentFailingBuilds);

        await subject.run();

        // assert
        tasklibraryMock.verify((lib) => lib.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false),
            TypeMoq.Times.once());

        generalFunctionsMock.verify((gf) => gf.trimValues(dependentFailingBuilds), TypeMoq.Times.once());
    });

    /* -------------------------------------------------------------------------
     *  Tests for parsing Inputs
     * ------------------------------------------------------------------------- */
    it("should initialize tfs rest service with read inputs", async () => {
        var tfsServer: string = "https://MyServer";
        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should read tfs server url from environment variable when definition is in current project", async () => {
        const teamFoundationCollection: string = "https://myUrl.com/";
        const teamProject: string = "MyProject";

        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = teamFoundationCollection;
        process.env[tfsService.TeamProject] = teamProject;
        var expectedTfsAddress: string = `${teamFoundationCollection}${teamProject}`;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should read tfs server url from input when definition is not in current project", async () => {
        const expectedTfsAddress: string = "https://myUrl.com/DefaultCollection/MyProject";

        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => expectedTfsAddress);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should unescape spaces from tfs server input", async () => {
        const inputTfsAddress: string = "https://myUrl.com/DefaultCollection/My%20Project";
        const expectedTfsAddress: string = "https://myUrl.com/DefaultCollection/My Project";

        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => false);
        tasklibraryMock.setup((lib) => lib.getInput(taskConstants.ServerUrlInput, false))
            .returns(() => inputTfsAddress);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should use OAuth method if default credentials authentication is used", async () => {
        var authenticationMethod: string = taskConstants.AuthenticationMethodDefaultCredentials;
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;
        var tfsServer: string = "https://MyServer";

        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            tfsService.AuthenticationMethodOAuthToken, username, TypeMoq.It.isAny(), tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should try to fetch OAuth access token when using OAuth method and not having set a password", async () => {
        var tfsServer: string = "https://MyServer";
        var expectedOAuthToken: string = "fadsljlakdfsj12093ui1203";

        setupRestServiceConfiguration(tfsService.AuthenticationMethodOAuthToken, "", "", tfsServer, true);
        process.env[tfsService.OAuthAccessToken] = expectedOAuthToken;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            tfsService.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, true), TypeMoq.Times.once());
    });

    it("should trigger build for all build definitions when no conditions are specified", async () => {
        var buildDefinition1: string = "build1";
        var buildDefinition2: string = "build2";
        var buildsToTrigger: string[] = [buildDefinition1, buildDefinition2];

        setupBuildConfiguration(buildsToTrigger);

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.triggerBuild(
            buildDefinition1,
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny()),
            TypeMoq.Times.once());

        tfsRestServiceMock.verify(srv => srv.triggerBuild(
            buildDefinition2,
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny()),
            TypeMoq.Times.once());
    });

    it("should NOT write queued build id to variable if not specified", async () => {
        const TriggeredBuildID: string = "1337";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => false);

        tfsRestServiceMock.setup(srv => srv.triggerBuild(
            "build",
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny()))
            .returns(async () => TriggeredBuildID);

        await subject.run();

        tasklibraryMock.verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, TriggeredBuildID),
            TypeMoq.Times.never());
        assert(consoleLogSpy.neverCalledWith(
            `Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`));
    });

    it("should write queued build id to variable if specified", async () => {
        const TriggeredBuildID: string = "1337";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);

        tfsRestServiceMock.setup(srv => srv.triggerBuild(
            "build",
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny()))
            .returns(async () => TriggeredBuildID);

        await subject.run();

        tasklibraryMock.verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, TriggeredBuildID),
            TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(
            `Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`));
    });

    it("should not interpret empty string as existing value", async () => {
        const TriggeredBuildID: string = "1337";
        const PreviousValue: string = "";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => PreviousValue);

        setupBuildIdForTriggeredBuild("build", TriggeredBuildID);

        await subject.run();

        tasklibraryMock
            .verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, `${TriggeredBuildID}`),
                TypeMoq.Times.once());

        assert(!consoleLogSpy.calledWith(`Following value is already stored in the variable: '${PreviousValue}'`));
    });

    it("should concatenate queued build id if previous value is available", async () => {
        const TriggeredBuildID: string = "1337";
        const PreviousValue: string = "42";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => PreviousValue);

        setupBuildIdForTriggeredBuild("build", TriggeredBuildID);

        await subject.run();

        tasklibraryMock
            .verify(tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, `${PreviousValue},${TriggeredBuildID}`),
                TypeMoq.Times.once());

        assert(consoleLogSpy.calledWith(`Following value is already stored in the variable: '${PreviousValue}'`));
    });

    it("should read existing values as comma separated values", async () => {
        const TriggeredBuildID: string = "1337";
        const PreviousValue1: string = "42";
        const PreviousValue2: string = "12";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => `${PreviousValue1},${PreviousValue2}`);

        setupBuildIdForTriggeredBuild("build", TriggeredBuildID);

        await subject.run();

        tasklibraryMock
            .verify(tl => tl.setVariable(
                taskConstants.TriggeredBuildIdsEnvironmentVariableName, `${PreviousValue1},${PreviousValue2},${TriggeredBuildID}`),
                TypeMoq.Times.once());

        assert(consoleLogSpy.calledWith(`Following value is already stored in the variable: '${PreviousValue1},${PreviousValue2}'`));
    });

    it("should write queued build id's comma separated to variable if specified", async () => {
        const TriggeredBuildID1: string = "1337";
        const TriggeredBuildID2: string = "42";
        setupBuildConfiguration(["build1", "build2"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true))
            .returns(() => true);

        setupBuildIdForTriggeredBuild("build1", TriggeredBuildID1);
        setupBuildIdForTriggeredBuild("build2", TriggeredBuildID2);

        await subject.run();

        tasklibraryMock
            .verify(
                tl => tl.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, `${TriggeredBuildID1},${TriggeredBuildID2}`),
                TypeMoq.Times.once());
    });

    it("should NOT wait for build to finish if not configured", async () => {
        const WaitTime: number = 10;
        const BuildID: string = "12";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .returns(async () => true);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.areBuildsFinished([BuildID], true), TypeMoq.Times.never());
    });

    it("should wait for build to finish if configured", async () => {
        const WaitTime: number = 10;
        const BuildID: string = "12";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .returns(async () => true);
        setupBuildInfoMock(BuildID, "someBuild", "");

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.areBuildsFinished([BuildID], true), TypeMoq.Times.once());
    });

    it("should log info for awaited builds", async () => {
        const WaitTime: number = 10;
        const BuildID: string = "12";
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        setupBuildConfiguration([DefinitionName]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        setupBuildIdForTriggeredBuild(DefinitionName, BuildID);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .returns(async () => true);
        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);

        await subject.run();

        assert(consoleLogSpy.calledWith(`Build ${BuildID} (${DefinitionName}): ${ExpectedLink.trim()}`));
    });

    it("should fail task if configured and build was not successful", async () => {
        const WaitTime: number = 10;
        const BuildID: string = "12";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);

        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .throws(new Error("builds were apparently not finished..."));

        await subject.run();

        tasklibraryMock.verify(x => x.setResult(tl.TaskResult.Failed, TypeMoq.It.isAny()), TypeMoq.Times.once());
    });

    it("should wait and sleep for configured time while builds are not finished", async () => {
        const WaitTime: number = 10;
        const BuildID: string = "12";
        setupBuildConfiguration(["someBuild"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true))
            .returns(() => WaitTime.toString());

        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .returns(async () => false);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .returns(async () => true);

        setupBuildInfoMock(BuildID, "someBuild", "");

        await subject.run();

        generalFunctionsMock.verify(gf => gf.sleep(WaitTime * 1000), TypeMoq.Times.once());
    });

    it("should NOT download artifacts for build after completion if not configured", async () => {
        const WaitTime: number = 10;
        const BuildID: string = "12";
        const DropDirectory: string = "C:/Whereever";
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
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .returns(async () => true);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.never());
    });

    it("should download artifacts for build after completion if configured", async () => {
        const WaitTime: number = 10;
        const BuildID: string = "12";
        const DropDirectory: string = "C:/Whereever";
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

        setupBuildInfoMock(BuildID, "someBuild", "someLink");
        setupBuildIdForTriggeredBuild("someBuild", BuildID);
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished([BuildID], true))
            .returns(async () => true);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.downloadArtifacts(BuildID, DropDirectory), TypeMoq.Times.once());
    });

    it("should trigger build for user that trigger original build if configured", async () => {
        const UserName: string = "Buildy McBuildFace";
        const UserID: string = "12";

        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.QueueBuildForUserInput, true))
            .returns(() => true);

        process.env[tfsService.RequestedForUsername] = UserName;
        process.env[tfsService.RequestedForUserId] = UserID;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                UserID,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
        assert(
            consoleLogSpy.calledWith(`Build shall be triggered for same user that triggered current build: ${UserName}`));
    });

    it("should NOT trigger build for user that trigger original build if not configured", async () => {
        const UserName: string = "Buildy McBuildFace";
        const UserID: string = "12";

        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.QueueBuildForUserInput, true))
            .returns(() => false);

        var expectedRequestBody: string = `requestedFor: { id: \"${UserID}\"}`;
        process.env[tfsService.RequestedForUsername] = UserName;
        process.env[tfsService.RequestedForUserId] = UserID;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                expectedRequestBody,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.never());
        assert(
            !consoleLogSpy.calledWith(`Build shall be triggered for same user that triggered current build: ${UserName}`));
    });

    it("should use same branch if configured", async () => {
        const BranchToUse: string = "MyBranch";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameBranchInput, true))
            .returns(() => true);

        process.env[tfsService.SourceBranch] = BranchToUse;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                BranchToUse,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
        assert(
            consoleLogSpy.calledWith(`Using same branch as source version: ${BranchToUse}`));
    });

    it("should NOT use same branch if not configured", async () => {
        const BranchToUse: string = "MyBranch";
        setupBuildConfiguration(["build"]);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameBranchInput, true))
            .returns(() => false);

        process.env[tfsService.SourceBranch] = BranchToUse;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                BranchToUse,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.never());
        assert(
            !consoleLogSpy.calledWith(`Using same branch as source version: ${BranchToUse}`));
    });

    it("should include build parameters if they are specified", async () => {
        const Params: string = "myParams";
        setupBuildConfiguration(["build"]);

        tasklibraryMock.setup(tl => tl.getInput(taskConstants.BuildParametersInput, false))
            .returns(() => Params);

        await subject.run();
        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                Params),
            TypeMoq.Times.once());
        assert(
            consoleLogSpy.calledWith(`Will trigger build with following parameters: ${Params}`));
    });

    it("should trigger build with same source version if configured", async () => {
        const SourceVersion: string = "1234";
        const RepoType: string = "Git";

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);

        setupBuildConfiguration(["build"]);

        process.env[tfsService.SourceVersion] = SourceVersion;
        process.env[tfsService.RepositoryType] = RepoType;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                SourceVersion,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
        assert(
            consoleLogSpy.calledWith(`Source Version: ${SourceVersion}`));
        assert(
            consoleLogSpy.calledWith(`Triggered Build will use the same source version: ${SourceVersion}`));
    });

    it("should NOT trigger build with same source version if not configured", async () => {
        const SourceVersion: string = "1234";
        const RepoType: string = "Git";

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => false);

        setupBuildConfiguration(["build"]);

        process.env[tfsService.SourceVersion] = SourceVersion;
        process.env[tfsService.RepositoryType] = RepoType;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                SourceVersion,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.never());
        assert(
            !consoleLogSpy.calledWith(`Source Version: ${SourceVersion}`));
        assert(
            !consoleLogSpy.calledWith(`Triggered Build will use the same source version: ${SourceVersion}`));
    });

    it("should prepend source version with C in TFS Repo", async () => {
        const SourceVersion: string = "1234";

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);

        setupBuildConfiguration(["build"]);

        process.env[tfsService.SourceVersion] = SourceVersion;
        process.env[tfsService.RepositoryType] = tfsService.TfsRepositoryType;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                `C${SourceVersion}`,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
    });

    it("should not prepend source version with C in TFS Repo if already starts with C", async () => {
        const SourceVersion: string = "C1234";

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);

        setupBuildConfiguration(["build"]);

        process.env[tfsService.SourceVersion] = SourceVersion;
        process.env[tfsService.RepositoryType] = tfsService.TfsRepositoryType;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                SourceVersion,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
    });

    it("should not prepend source version with C in TFS Repo if starts with L", async () => {
        const SourceVersion: string = "L1234";

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.UseSameSourceVersionInput, true))
            .returns(() => true);

        setupBuildConfiguration(["build"]);

        process.env[tfsService.SourceVersion] = SourceVersion;
        process.env[tfsService.RepositoryType] = tfsService.TfsRepositoryType;

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                SourceVersion,
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
    });

    it("should trigger build with demands specified", async () => {
        var expectedDemands: string[] = ["demand1", "demand2"];
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => expectedDemands);

        setupBuildConfiguration(["build"]);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.is(demands => areEqual(demands, expectedDemands)),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());

        assert(consoleLogSpy.calledWith("Will trigger build with following demands:"));
        assert(consoleLogSpy.calledWith("demand1"));
        assert(consoleLogSpy.calledWith("demand2"));
    });

    it("should not log anything if no demands are specified", async () => {
        var expectedDemands: string[] = [];
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => expectedDemands);

        setupBuildConfiguration(["build"]);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());

        assert(!consoleLogSpy.calledWith("Will trigger build with following demands:"));
    });

    it("should convert demands which check for equality", async () => {
        var demands: string[] = ["demand=test123"];
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false))
            .returns(() => demands);

        setupBuildConfiguration(["build"]);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.is(demands => areEqual(demands, ["demand -equals test123"])),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
    });

    it("should fetch queue id by name if string was specified", async () => {
        const QueueID: number = 7;
        const QueueName: string = "My Favorite Queue";
        setupBuildConfiguration(["build"]);

        tasklibraryMock.setup(tl => tl.getInput(taskConstants.QueueID, false))
            .returns(() => QueueName);

        tfsRestServiceMock.setup(srv => srv.getQueueIdByName(QueueName))
            .returns(async () => QueueID);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                QueueID,
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(
            `Build Queue was specified as string: ${QueueName} - trying to fetch Queue ID for the queue...`));
        assert(consoleLogSpy.calledWith(`Found id of queue ${QueueName}: ${QueueID}`));
        assert(consoleLogSpy.calledWith(`Will trigger build in following agent queue: ${QueueID}`));
    });

    it("should pass build queue id if specified as integer", async () => {
        const QueueID: number = 7;
        setupBuildConfiguration(["build"]);

        tasklibraryMock.setup(tl => tl.getInput(taskConstants.QueueID, false))
            .returns(() => QueueID.toString());

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                "build",
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                QueueID,
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith(`Will trigger build in following agent queue: ${QueueID}`));
    });

    it("should check if any builds are queued if build in queue condition is true", async () => {
        var blockingBuilds: string[] = ["Build1", "Build2"];

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);

        tfsRestServiceMock.setup(
            srv => srv.getBuildsByStatus(TypeMoq.It.isAny(), tfsService.BuildStateNotStarted))
            .returns(async () => []);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.getBuildsByStatus("Build1", tfsService.BuildStateNotStarted), TypeMoq.Times.once());
        tfsRestServiceMock.verify(
            srv => srv.getBuildsByStatus("Build2", tfsService.BuildStateNotStarted), TypeMoq.Times.once());

        assert(consoleLogSpy.calledWith("Build in Queue Condition is enabled"));
        assert(consoleLogSpy.calledWith("Following builds are blocking:"));
        assert(consoleLogSpy.calledWith("Build1"));
        assert(consoleLogSpy.calledWith("Build2"));
    });

    it("should include current build definition in blocking builds list if enabled", async () => {
        const CurrentBuildDefinition: string = "My Build";
        var blockingBuilds: string[] = [];

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);

        process.env[tfsService.CurrentBuildDefinition] = CurrentBuildDefinition;

        await subject.run();

        assert(consoleLogSpy.calledWith("Build in Queue Condition is enabled"));
        assert(consoleLogSpy.calledWith("Following builds are blocking:"));
        assert(consoleLogSpy.calledWith("Current Build Definition shall be included"));
        assert(consoleLogSpy.calledWith(CurrentBuildDefinition));
    });

    it("should not trigger build if build is in queue", async () => {
        var blockingBuilds: string[] = ["Build"];

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);

        var buildMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();

        tfsRestServiceMock.setup(
            srv => srv.getBuildsByStatus("Build", tfsService.BuildStateNotStarted))
            .returns(async () => [buildMock.object]);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(`Build is queued - will not trigger new build.`));
    });

    it("should not trigger new build if build is in proggres", async () => {
        var blockingBuilds: string[] = ["Build"];

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.BlockInProgressBuilds, TypeMoq.It.isAny()))
            .returns(() => true);

        var buildMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();

        tfsRestServiceMock.setup(
            srv => srv.getBuildsByStatus("Build", `${tfsService.BuildStateNotStarted},${tfsService.BuildStateInProgress}`))
            .returns(async () => [buildMock.object]);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.never());

        assert(consoleLogSpy.calledWith("Will treat in progress builds as blocking."));
        assert(consoleLogSpy.calledWith(`Build is queued - will not trigger new build.`));
    });

    it("should not check if is in progress for current build definition", async () => {
        var blockingBuilds: string[] = [];
        const CurrentBuildDefinition: string = "My Build";

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.BlockInProgressBuilds, TypeMoq.It.isAny()))
            .returns(() => true);

        process.env[tfsService.CurrentBuildDefinition] = CurrentBuildDefinition;

        var buildMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();

        tfsRestServiceMock.setup(
            srv => srv.getBuildsByStatus(CurrentBuildDefinition, tfsService.BuildStateNotStarted))
            .returns(async () => [buildMock.object]);

        // act
        await subject.run();

        // assert
        tfsRestServiceMock.verify(
            srv => srv.getBuildsByStatus(CurrentBuildDefinition, tfsService.BuildStateNotStarted), TypeMoq.Times.once());
        tfsRestServiceMock.verify(
            srv => srv.getBuildsByStatus(CurrentBuildDefinition, `${tfsService.BuildStateNotStarted},${tfsService.BuildStateInProgress}`),
            TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith("Is current build definition - will not check for builds in progress"));
    });

    it("should trigger new build if no build is in queue", async () => {
        var blockingBuilds: string[] = ["Build"];

        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, TypeMoq.It.isAny()))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, TypeMoq.It.isAny()))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", TypeMoq.It.isAny()))
            .returns(() => blockingBuilds);

        tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
            .returns(() => ["dsfalk"]);

        tfsRestServiceMock.setup(
            srv => srv.getBuildsByStatus("Build", tfsService.BuildStateNotStarted))
            .returns(async () => []);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.triggerBuild(
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny(),
                TypeMoq.It.isAny()),
            TypeMoq.Times.once());
        assert(consoleLogSpy.calledWith("None of the blocking builds is queued - proceeding"));
    });

    it(`should not trigger build if dependant on successful build condition is enabled and
    last build was not successful`, async () => {
            tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, TypeMoq.It.isAny()))
                .returns(() => true);
            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", TypeMoq.It.isAny()))
                .returns(() => ["Build"]);

            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
                .returns(() => ["dsfalk"]);

            var buildMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();
            buildMock.setup(b => b.result).returns(() => "Failed");
            tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
                .returns(async () => [buildMock.object]);

            await subject.run();

            tfsRestServiceMock.verify(
                srv => srv.triggerBuild(
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny()),
                TypeMoq.Times.never());
            assert(consoleLogSpy.calledWith("Checking if dependant build definitions last builds were successful"));
            assert(consoleLogSpy.calledWith("Checking build Build"));
        });

    it(`should trigger build if dependant on successful build condition is enabled and
        last build was successful`, async () => {
            tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, TypeMoq.It.isAny()))
                .returns(() => true);
            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", TypeMoq.It.isAny()))
                .returns(() => ["Build"]);

            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
                .returns(() => ["dsfalk"]);

            var buildMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();
            buildMock.setup(b => b.result).returns(() => tfsService.BuildResultSucceeded);
            tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
                .returns(async () => [buildMock.object]);

            await subject.run();

            tfsRestServiceMock.verify(
                srv => srv.triggerBuild(
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny()),
                TypeMoq.Times.once());
            assert(consoleLogSpy.calledWith("None of the dependant build definitions last builds were failing - proceeding"));
        });

    it(`should trigger build if dependant on successful build condition is enabled and
                there is no build found to check`, async () => {
            tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, TypeMoq.It.isAny()))
                .returns(() => true);
            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", TypeMoq.It.isAny()))
                .returns(() => ["Build"]);

            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
                .returns(() => ["dsfalk"]);

            tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
                .returns(async () => []);

            await subject.run();

            tfsRestServiceMock.verify(
                srv => srv.triggerBuild(
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny()),
                TypeMoq.Times.once());
        });

    it(`should not trigger build if dependant on failed build condition is enabled and
        last build was not failed`, async () => {
            tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, TypeMoq.It.isAny()))
                .returns(() => true);
            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", TypeMoq.It.isAny()))
                .returns(() => ["Build"]);

            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
                .returns(() => ["dsfalk"]);

            var buildMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();
            buildMock.setup(b => b.result).returns(() => tfsService.BuildResultSucceeded);
            tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
                .returns(async () => [buildMock.object]);

            await subject.run();

            tfsRestServiceMock.verify(
                srv => srv.triggerBuild(
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny()),
                TypeMoq.Times.never());
            assert(consoleLogSpy.calledWith("Checking if dependant build definitions last builds were NOT successful"));
        });

    it(`should trigger build if dependant on failed build condition is enabled and
            last build was not successful`, async () => {
            tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, TypeMoq.It.isAny()))
                .returns(() => true);
            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", TypeMoq.It.isAny()))
                .returns(() => ["Build"]);

            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
                .returns(() => ["dsfalk"]);

            var buildMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();
            buildMock.setup(b => b.result).returns(() => "Failed");
            tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
                .returns(async () => [buildMock.object]);

            await subject.run();

            tfsRestServiceMock.verify(
                srv => srv.triggerBuild(
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny()),
                TypeMoq.Times.once());
            assert(consoleLogSpy.calledWith("None of the dependant build definitions last builds were successful - proceeding"));
        });

    it(`should trigger build if dependant on failed build condition is enabled and
                    there is no build found to check`, async () => {
            tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, TypeMoq.It.isAny()))
                .returns(() => true);
            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", TypeMoq.It.isAny()))
                .returns(() => ["Build"]);

            tasklibraryMock.setup(tl => tl.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true))
                .returns(() => ["dsfalk"]);

            tfsRestServiceMock.setup(srv => srv.getBuildsByStatus("Build", ""))
                .returns(async () => []);

            await subject.run();

            tfsRestServiceMock.verify(
                srv => srv.triggerBuild(
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny(),
                    TypeMoq.It.isAny()),
                TypeMoq.Times.once());
        });

    function areEqual(a: string[], b: string[]): boolean {
        a.forEach(element => {
            if (b.indexOf(element) < 0) {
                return false;
            }
        });

        return true;
    }

    function setupBuildIdForTriggeredBuild(buildConfig: string, buildID: string): void {
        tfsRestServiceMock.setup(srv => srv.triggerBuild(
            buildConfig,
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny(),
            TypeMoq.It.isAny()))
            .returns(async () => buildID);
    }

    function setupBuildConfiguration(
        buildsToTrigger: string[]
    ): void {
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

    function setupBuildInfoMock(
        buildID: string,
        definition: string,
        link: string
    ): void {
        var buildInfoMock: TypeMoq.IMock<tfsService.IBuild> = TypeMoq.Mock.ofType<tfsService.IBuild>();

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

    function setupRestServiceConfiguration(
        authenticationMethod: string,
        username: string,
        password: string,
        tfsServer: string,
        IgnoreSslCertificateErrorsInput: boolean): void {
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