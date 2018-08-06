import sinon = require("sinon");
import assert = require("assert");
import tr = require("../taskrunner");
import tfsService = require("tfsrestservice");
import common = require("../generalfunctions");
import tl = require("../tasklibrary");
import taskConstants = require("../taskconstants");
import * as TypeMoq from "typemoq";

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
        var authenticationMethod: string = "Basic";
        var username: string = "User1";
        var password: string = "P4s5W0rd";
        var ignoreSSLErrors: boolean = true;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
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
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = teamFoundationCollection;
        process.env[tfsService.TeamProject] = teamProject;
        var expectedTfsAddress: string = `${teamFoundationCollection}${teamProject}`;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should read tfs server url from input when definition is not in current project", async () => {
        const expectedTfsAddress: string = "https://myUrl.com/DefaultCollection/My Project";

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
        setupRestServiceConfiguration(authenticationMethod, username, password, "", ignoreSSLErrors);

        process.env[tfsService.TeamFoundationCollectionUri] = "";
        process.env[tfsService.TeamProject] = "";

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedTfsAddress, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should decode spaces from tfs server input when using current team project url", async () => {
        var collectionUrl: string = "https://somevstsinstance.visualstudio.com/DefaultCollection/";
        var teamProject: string = "Team%20Project";
        var expectedUrl: string = "https://somevstsinstance.visualstudio.com/DefaultCollection/Team Project";
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
        process.env[tfsService.TeamProject] = teamProject;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            authenticationMethod, username, password, expectedUrl, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should decode spaces from tfs server input when using manual input url", async () => {
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

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);

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

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);
        setupRestServiceConfiguration(authenticationMethod, username, password, tfsServer, ignoreSSLErrors);

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            tfsService.AuthenticationMethodOAuthToken, username, TypeMoq.It.isAny(), tfsServer, ignoreSSLErrors), TypeMoq.Times.once());
    });

    it("should try to fetch OAuth access token when using OAuth method and not having set a password", async () => {
        var tfsServer: string = "https://MyServer";
        var expectedOAuthToken: string = "fadsljlakdfsj12093ui1203";

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName))
            .returns(() => "7");
        tfsRestServiceMock.setup(srv => srv.areBuildsFinished(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(async () => true);
        setupRestServiceConfiguration(tfsService.AuthenticationMethodOAuthToken, "", "", tfsServer, true);
        process.env[tfsService.OAuthAccessToken] = expectedOAuthToken;

        await subject.run();

        tfsRestServiceMock.verify(srv => srv.initialize(
            tfsService.AuthenticationMethodOAuthToken, "", expectedOAuthToken, tfsServer, true), TypeMoq.Times.once());
    });

    it("should cancel builds ", async () => {
        const BuildID: string = "12";
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true))
            .returns(() => true);
        tasklibraryMock.setup(tl => tl.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true))
            .returns(() => true);

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);

        setupBuildInfoMock(BuildID, "somebuild", "someLink");

        await subject.run();

        tfsRestServiceMock.verify(
            srv => srv.cancelBuild(BuildID), TypeMoq.Times.once());
    });

    it("should clear variable if configured", async () => {
        const BuildID: string = "12";
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
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
        const BuildID: string = "12";
        const DefinitionName: string = "someBuild";
        const ExpectedLink: string = `http://someLink.ToTheBuild.expected
        `;

        tasklibraryMock.setup(tl => tl.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)).returns(() => BuildID);
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
});