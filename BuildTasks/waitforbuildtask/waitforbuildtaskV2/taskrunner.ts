import tfsService = require("tfsrestservice");
import taskConstants = require("./taskconstants");
import common = require("./generalfunctions");
import tl = require("./tasklibrary");
import { Build } from "vso-node-api/interfaces/BuildInterfaces";

export class TaskRunner {
    definitionIsInCurrentTeamProject: boolean;
    tfsServer: string;
    teamProject: string;
    ignoreSslCertificateErrors: boolean;
    triggeredBuilds: number[] = [];
    waitForQueuedBuildsToFinishRefreshTime: number;
    failTaskIfBuildsNotSuccessful: boolean;
    cancelBuildsIfAnyFails: boolean = false;
    treatPartiallySucceededBuildAsSuccessful: boolean = false;
    downloadBuildArtifacts: boolean;
    dropDirectory: string;
    clearVariable: boolean;
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
            await this.parseInputs();

            await this.waitForBuildsToFinish(this.triggeredBuilds);
        } catch (err) {
            this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
        }
    }

    private async waitForBuildsToFinish(queuedBuildIds: number[]): Promise<void> {
        console.log(`Will wait for queued build to be finished - Refresh time is set to ${this.waitForQueuedBuildsToFinishRefreshTime} seconds`);
        console.log("Following Builds will be awaited:");

        for (let buildId of queuedBuildIds) {
            var buildInfo: Build = await this.tfsRestService.getBuildInfo(buildId);

            if (buildInfo === undefined) {
                throw new Error(`Build with id ${buildId} is not available anymore!`);
            }

            console.log(`Build ${buildId} (${buildInfo.definition.name}): ${buildInfo._links.web.href.trim()}`);
        }

        console.log("Waiting for builds to finish - This might take a while...");
        var areBuildsFinished: boolean = false;
        console.log("Waiting for builds to finish - This might take a while...");
        while (!areBuildsFinished) {
            try {
                areBuildsFinished = await this.tfsRestService.areBuildsFinished(
                    queuedBuildIds, this.failTaskIfBuildsNotSuccessful, this.treatPartiallySucceededBuildAsSuccessful);

                if (!areBuildsFinished) {
                    this.taskLibrary.debug(`Builds not yet finished...Waiting ${this.waitForQueuedBuildsToFinishRefreshTime * 1000} seconds`);
                    await this.generalFunctions.sleep((this.waitForQueuedBuildsToFinishRefreshTime * 1000));
                }
            } catch (err) {
                if (this.cancelBuildsIfAnyFails) {
                    console.log("Awaited build failed - attempting to cancel triggered builds");
                    for (let buildId of queuedBuildIds) {
                        console.log(`Cancel build ${buildId}`);
                        await this.tfsRestService.cancelBuild(buildId);
                    }

                }

                throw err;
            }
        }

        console.log("All builds are finished");

        if (this.downloadBuildArtifacts) {
            console.log(`Downloading build artifacts to ${this.dropDirectory}`);
            for (let buildId of queuedBuildIds) {
                await this.tfsRestService.downloadArtifacts(buildId, this.dropDirectory);
            }
        }

        if (this.clearVariable === true) {
            console.log("Clearing TriggeredBuildIds Variable...");
            this.taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, "");
        }
    }

    private async parseInputs(): Promise<void> {
        if (this.definitionIsInCurrentTeamProject) {
            console.log("Using current Team Project");
            this.teamProject = `${process.env[tfsService.TeamProjectId]}`;
            console.log(`Team Project: ${process.env[tfsService.TeamProject]} with ID ${this.teamProject}`);

            console.log("Using current Collection Url");
            this.tfsServer = `${process.env[tfsService.TeamFoundationCollectionUri]}`;
        } else {
            console.log("Using Custom Team Project");
            console.log(`Team Project: ${this.teamProject}`);
            console.log("Using Custom Collection Url");
        }

        /* we decode here because the web request library handles the encoding of the uri.
         * otherwise we get double-encoded urls which cause problems. */
        this.tfsServer = decodeURI(this.tfsServer);
        console.log("Server URL: " + this.tfsServer);
        console.log("Team Project: " + this.teamProject);

        if (this.authenticationMethod === tfsService.AuthenticationMethodOAuthToken &&
            (this.password === null || this.password === "")) {
            console.log("Trying to fetch authentication token from system...");
            this.password = `${process.env[tfsService.OAuthAccessToken]}`;
        }

        await this.tfsRestService.initialize(
            this.authenticationMethod, this.username, this.password, this.tfsServer, this.teamProject, this.ignoreSslCertificateErrors);
    }

    /// Fetch all the inputs and set them to the variables to be used within the script.
    private getInputs(): void {
        // basic Configuration
        this.definitionIsInCurrentTeamProject = this.taskLibrary.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true);
        this.tfsServer = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.ServerUrlInput, false));
        this.teamProject = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.TeamProjectInput, false));
        this.ignoreSslCertificateErrors = this.taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);

        // authentication
        this.authenticationMethod = this.taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
        this.username = this.taskLibrary.getInput(taskConstants.UsernameInput, false);
        this.password = this.taskLibrary.getInput(taskConstants.PasswordInput, false);


        // task configuration
        this.waitForQueuedBuildsToFinishRefreshTime =
            parseInt(this.taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
        this.failTaskIfBuildsNotSuccessful = this.taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);
        this.cancelBuildsIfAnyFails = this.taskLibrary.getBoolInput(taskConstants.CancelBuildsIfAnyFailsInput, true);
        this.treatPartiallySucceededBuildAsSuccessful = this.taskLibrary.getBoolInput(
            taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true);

        if (this.failTaskIfBuildsNotSuccessful) {
            this.downloadBuildArtifacts = this.taskLibrary.getBoolInput(taskConstants.DownloadBuildArtifacts, true);
        } else {
            this.downloadBuildArtifacts = false;
        }

        this.dropDirectory = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.DropDirectory, false));

        this.clearVariable = this.taskLibrary.getBoolInput(taskConstants.ClearVariable, true);

        var storedBuildInfo: string = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
        if (storedBuildInfo === undefined) {
            throw Error(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" 
            // under Advanced Configuration for all the Triggered Builds you want to await.`);
        }

        for (let storedBuildId of storedBuildInfo.split(",")) {
            this.triggeredBuilds.push(Number.parseInt(storedBuildId));
        }

        console.log(`Following Builds are awaited: ${this.triggeredBuilds}`);
    }
}