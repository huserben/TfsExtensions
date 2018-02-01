import tfsService = require("tfsrestservice");
import taskConstants = require("./taskconstants");
import common = require("./generalfunctions");
import tl = require("./tasklibrary");

export class TaskRunner {
    definitionIsInCurrentTeamProject: boolean;
    tfsServer: string;
    ignoreSslCertificateErrors: boolean;
    triggeredBuilds: string[];
    waitForQueuedBuildsToFinishRefreshTime: number;
    failTaskIfBuildsNotSuccessful: boolean;
    downloadBuildArtifacts: boolean;
    dropDirectory: string;
    authenticationMethod: string;
    username: string;
    password: string;


    tfsRestService: tfsService.ITfsRestService;
    taskLibrary: tl.ITaskLibrary;
    generalFunctions: common.IGeneralFunctions;

    constructor(
        tfsRestService: tfsService.ITfsRestService,
        taskLibrary: tl.ITaskLibrary,
        generalFunctions: common.IGeneralFunctions) {
        this.tfsRestService = tfsRestService;
        this.taskLibrary = taskLibrary;
        this.generalFunctions = generalFunctions;
    }

    public async run(): Promise<void> {
        try {
            this.getInputs();
            this.parseInputs();

            await this.waitForBuildsToFinish(this.triggeredBuilds);
        } catch (err) {
            this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
        }
    }

    private async waitForBuildsToFinish(queuedBuildIds: string[]): Promise<void> {
        console.log(`
             Will wait for queued build to be finished - Refresh time is set to ${this.waitForQueuedBuildsToFinishRefreshTime} seconds`);

        var areBuildsFinished: boolean = false;
        while (!areBuildsFinished) {
            areBuildsFinished = await this.tfsRestService.areBuildsFinished(queuedBuildIds, this.failTaskIfBuildsNotSuccessful);

            if (!areBuildsFinished) {
                await this.generalFunctions.sleep((this.waitForQueuedBuildsToFinishRefreshTime * 1000));
            }
        }

        if (this.downloadBuildArtifacts) {
            console.log(`Downloading build artifacts to ${this.dropDirectory}`);
            for (let buildId of queuedBuildIds) {
                await this.tfsRestService.downloadArtifacts(buildId, this.dropDirectory);
            }
        }
    }

    private parseInputs(): void {
        if (this.definitionIsInCurrentTeamProject) {
            console.log("Using current Team Project Url");
            this.tfsServer = `${process.env[tfsService.TeamFoundationCollectionUri]}${process.env[tfsService.TeamProject]}`;
        } else {
            console.log("Using Custom Team Project Url");
            this.tfsServer = decodeURI(this.tfsServer);
        }
        console.log("Path to Server: " + this.tfsServer);

        if (this.authenticationMethod === taskConstants.AuthenticationMethodDefaultCredentials) {
            console.warn("Default Credentials are not supported anymore - will try to use OAuth Token- Please change your configuration");
            console.warn("Make sure Options-Allow Access To OAuth Token is enabled for your build definition.");
            this.authenticationMethod = tfsService.AuthenticationMethodOAuthToken;
            this.password = "";
        }

        if (this.authenticationMethod === tfsService.AuthenticationMethodOAuthToken &&
            (this.password === null || this.password === "")) {
            console.log("Trying to fetch authentication token from system...");
            this.password = `${process.env[tfsService.OAuthAccessToken]}`;
        }

        this.tfsRestService.initialize(
            this.authenticationMethod, this.username, this.password, this.tfsServer, this.ignoreSslCertificateErrors);
    }

    /// Fetch all the inputs and set them to the variables to be used within the script.
    private getInputs(): void {
        // basic Configuration
        this.definitionIsInCurrentTeamProject = this.taskLibrary.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true);
        this.tfsServer = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.ServerUrlInput, false));
        this.ignoreSslCertificateErrors = this.taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);

        // authentication
        this.authenticationMethod = this.taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
        this.username = this.taskLibrary.getInput(taskConstants.UsernameInput, false);
        this.password = this.taskLibrary.getInput(taskConstants.PasswordInput, false);


        // task configuration
        this.waitForQueuedBuildsToFinishRefreshTime =
        parseInt(this.taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
        this.failTaskIfBuildsNotSuccessful = this.taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);

        if (this.failTaskIfBuildsNotSuccessful) {
            this.downloadBuildArtifacts = this.taskLibrary.getBoolInput(taskConstants.DownloadBuildArtifacts, true);
        } else {
            this.downloadBuildArtifacts = false;
        }

        this.dropDirectory = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.DropDirectory, false));

        var storedBuildInfo: string = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
        if (storedBuildInfo === undefined) {
            throw Error(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" 
            // under Advanced Configuration for all the Triggered Builds you want to await.`);
        }

        this.triggeredBuilds = storedBuildInfo.split(",");
        console.log(`Following Builds are awaited: ${this.triggeredBuilds}`);
    }
}