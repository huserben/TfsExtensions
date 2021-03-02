import sinon = require("sinon");
import tr = require("../taskrunner");
import tfsService = require("tfsrestservice");
import assert = require("assert");
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

    /* -------------------------------------------------------------------------
     *  Tests for parsing Inputs
     * ------------------------------------------------------------------------- */
    it("should initialize tfs rest service with read inputs", async () => {
        var tfsServer: string = "https://MyServer";
        var teamProject: string = "TeamProject";
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
        const teamProjectId: string = "42";

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
        process.env[tfsService.TeamProjectId] = teamProjectId;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, teamFoundationCollection, teamProjectId, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should read tfs server url from input when definition is not in current project", async () => {
        const expectedTfsAddress: string = "https://myUrl.com/DefaultCollection";
        const teamProject: string = "TeamProject";

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
        .returns(() => teamProject);
        setupRestServiceConfiguration(authenticationMethod, username, password, "", "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, teamProject, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should decode spaces from tfs server input when using current team project url", async () => {
        var collectionUrl: string = "https://somevstsinstance.visualstudio.com/Default%20Collection/";
        var teamProjectId: string = "12";
        var expectedUrl: string = "https://somevstsinstance.visualstudio.com/Default Collection/";
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
        process.env[tfsService.TeamProjectId] = teamProjectId;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedUrl, teamProjectId, ignoreSSLErrors), TypeMoq.Times.once());
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

    it("should cancel builds ", async () => {
        const BuildID: number = 12;
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());

        setupBuildInfoMock(BuildID, "somebuild", "someLink");

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.cancelBuild(BuildID), TypeMoq.Times.once());
    });

    it("should log if no build id as variable is available ", async () => {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => undefined);

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.cancelBuild(TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(
            `No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" under Advanced Configuration for all the Triggered Builds you want to await.`));
        assert(consoleLogSpy.calledWith(`Value ${""} is not a valid build id - skipping`));
    });

    it("should log if no valid build id as variable is available ", async () => {
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => "asdf");

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.cancelBuild(TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(
            `No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" under Advanced Configuration for all the Triggered Builds you want to await.`));
        assert(consoleLogSpy.calledWith(`Value ${"asdf"} is not a valid build id - skipping`));
    });

    it("should skip build to cancel if its not available anymore ", async () => {
        const BuildID: number = 12;
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.cancelBuild(TypeMoq.It.isAny()), TypeMoq.Times.never());
        assert(consoleLogSpy.calledWith(
                `No Build with ID ${BuildID} found - skipping`));
    });

    it("should clear variable if configured", async () => {
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => false);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => true);

        setupBuildInfoMock(BuildID, DefinitionName, ExpectedLink);

        await subject.run();

        tasklibraryMock.verify(x => x.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ""), TypeMoq.Times.once());
    });

    it("should NOT clear variable if not configured", async () => {
        const BuildID: number = 12;
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID.toString());
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.ClearVariable, true)).returns(() => false);

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