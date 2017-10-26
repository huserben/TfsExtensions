import * as assert from "assert";
import tr = require("../taskrunner");
import tfsService = require("../tfsrestservice");
import common = require("../generalfunctions");
import tl = require("../tasklibrary");
import taskConstants = require("../taskconstants");
import tfsConstants = require("../tfsconstants");
import * as TypeMoq from "typemoq";

describe("Task Runner Tests", function (): void {
    let subject: tr.TaskRunner;
    let tfsRestServiceMock: TypeMoq.IMock<tfsService.ITfsRestService>;
    let tasklibraryMock: TypeMoq.IMock<tl.ITaskLibrary>;
    let generalFunctionsMock: TypeMoq.IMock<common.IGeneralFunctions>;

    beforeEach(async () => {
        tfsRestServiceMock = TypeMoq.Mock.ofType<tfsService.ITfsRestService>();
        tasklibraryMock = TypeMoq.Mock.ofType<tl.ITaskLibrary>();
        generalFunctionsMock = TypeMoq.Mock.ofType<common.IGeneralFunctions>();

        subject = new tr.TaskRunner(
            tfsRestServiceMock.object,
            tasklibraryMock.object,
            generalFunctionsMock.object
        );

        this.timeout(1000);
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
    it("should initialize tfs rest service with read inputs", () => {
        var tfsServer: string = "https://MyServer";
        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);

        subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should read tfs server from environment variable when definition is in current project", () => {
        const teamFoundationCollection: string = "https://myUrl.com/";
        const teamProject: string = "MyProject";

        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup((lib) => lib.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true))
            .returns(() => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);

        process.env[tfsConstants.TeamFoundationCollectionUri] = teamFoundationCollection;
        process.env[tfsConstants.TeamProject] = teamProject;
        var expectedTfsAddress: string = `${teamFoundationCollection}${teamProject}`;

        subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should use OAuth method if default credentials authentication is used", () => {
        var authenticationMethod: string = tfsConstants.AuthenticationMethodDefaultCredentials;
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;
        var tfsServer: string = "https://MyServer";

        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);

        subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            tfsConstants.AuthenticationMethodOAuthToken, username, TypeMoq.It.isAny(), tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should try to fetch OAuth access token when using OAuth method and not having set a password", () => {
        var tfsServer: string = "https://MyServer";
        var expectedOAuthToken: string = "fadsljlakdfsj12093ui1203";

        setupRestServiceConfiguration(tfsConstants.AuthenticationMethodOAuthToken, "", "", tfsServer, true);
        process.env[tfsConstants.OAuthAccessToken] = expectedOAuthToken;

        subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            tfsConstants.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, true), TypeMoq.Times.once());
    });

    function setupRestServiceConfiguration(
        authenticationMethod: string,
        username: string,
        password: string,
        tfsServer: string,
        IgnoreSslCertificateErrorsInput: boolean): void {
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