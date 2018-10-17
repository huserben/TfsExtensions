import tfsService = require("tfsrestservice");
import taskConstants = require("./taskconstants");
import common = require("./generalfunctions");
import tl = require("./tasklibrary");
import { Build } from "azure-devops-node-api/interfaces/BuildInterfaces";

export class TaskRunner {
    definitionIsInCurrentTeamProject: boolean;
    tfsServer: string;
    teamProject: string;
    ignoreSslCertificateErrors: boolean;
    triggeredBuilds: number[] = [];
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

            if (this.triggeredBuilds.length === 0) {
                console.log(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" under Advanced Configuration for all the Triggered Builds you want to await.`);
                return;
            }

            await this.cancelBuilds(this.triggeredBuilds);
        } catch (err) {
            this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
        }
    }

    private async cancelBuilds(queuedBuildIds: number[]): Promise<void> {
        for (let buildId of queuedBuildIds) {
            var buildInfo: Build = await this.tfsRestService.getBuildInfo(buildId);

            if (buildInfo === undefined) {
                console.log(`No Build with ID ${buildId} found - skipping`);
                continue;
            }

            console.log(`Cancelling Build ${buildId} (${buildInfo.definition.name}): ${buildInfo._links.web.href.trim()}`);

            await this.tfsRestService.cancelBuild(buildId);

            await this.generalFunctions.sleep(200);
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

        this.clearVariable = this.taskLibrary.getBoolInput(taskConstants.ClearVariable, true);

        // authentication
        this.authenticationMethod = this.taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
        this.username = this.taskLibrary.getInput(taskConstants.UsernameInput, false);
        this.password = this.taskLibrary.getInput(taskConstants.PasswordInput, false);


        var storedBuildInfo: string = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
        if (storedBuildInfo === undefined) {
            storedBuildInfo = "";
        }

        for (let storedBuildId of storedBuildInfo.split(",")) {
            if (isNaN(Number(storedBuildId)) || storedBuildId === "") {
                console.log(`Value ${storedBuildId} is not a valid build id - skipping`);
            } else {
                this.triggeredBuilds.push(Number.parseInt(storedBuildId));
            }
        }

        console.log(`Following Builds are awaited: ${this.triggeredBuilds}`);
    }
}