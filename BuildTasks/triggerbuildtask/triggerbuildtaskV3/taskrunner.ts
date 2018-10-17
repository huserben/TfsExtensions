import tfsService = require("tfsrestservice");
import taskConstants = require("./taskconstants");
import common = require("./generalfunctions");
import tl = require("./tasklibrary");
import { Build, BuildStatus, BuildResult } from "vso-node-api/interfaces/BuildInterfaces";

export class TaskRunner {

    definitionIsInCurrentTeamProject: boolean = false;
    tfsServer: string = "";
    teamProject: string = "";
    buildDefinitionsToTrigger: string[] = [];
    queueBuildForUserThatTriggeredBuild: boolean = false;
    useSameSourceVersion: boolean = false;
    useSameBranch: boolean = false;
    branchToUse: string;
    waitForQueuedBuildsToFinish: boolean = false;
    waitForQueuedBuildsToFinishRefreshTime: number = 60;
    failTaskIfBuildsNotSuccessful: boolean = false;
    cancelBuildsIfAnyFails: boolean = false;
    treatPartiallySucceededBuildAsSuccessful: boolean = false;
    downloadBuildArtifacts: boolean = false;
    dropDirectory: string;
    storeInVariable: boolean = false;
    demands: string[];
    buildQueue: string;
    buildQueueId: number;
    buildParameters: string;
    delayBetweenBuilds: number;
    ignoreSslCertificateErrors: boolean = false;
    authenticationMethod: string = "";
    username: string;
    password: string;
    enableBuildInQueueCondition: boolean = false;
    includeCurrentBuildDefinition: boolean = false;
    blockInProgressBuilds: boolean = false;
    blockingBuilds: string[];
    dependentOnSuccessfulBuildCondition: boolean = false;
    dependentBuildsList: string[];
    dependentOnFailedBuildCondition: boolean = false;
    dependentFailingBuildsList: string[];
    failTaskIfConditionsAreNotFulfilled: boolean = false;

    userId: string;
    sourceVersion: string;

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

            var conditionsFulfilled: boolean = await this.checkConditions();
            if (conditionsFulfilled) {
                var triggeredBuilds: number[] = await this.triggerBuilds();
                this.writeVariable(triggeredBuilds);
                await this.waitForBuildsToFinish(triggeredBuilds);
            } else if (this.failTaskIfConditionsAreNotFulfilled) {
                throw new Error("Condition not fulfilled - failing task.");
            }
        } catch (err) {
            this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
        }
    }

    private async waitForBuildsToFinish(queuedBuildIds: number[]): Promise<void> {
        if (this.waitForQueuedBuildsToFinish) {
            console.log(`Will wait for queued build to be finished - Refresh time is set to ${this.waitForQueuedBuildsToFinishRefreshTime} seconds`);
            console.log("Following Builds will be awaited:");

            for (let buildId of queuedBuildIds) {
                var buildInfo: Build = await this.tfsRestService.getBuildInfo(buildId);
                console.log(`Build ${buildId} (${buildInfo.definition.name}): ${buildInfo._links.web.href.trim()}`);
            }

            var areBuildsFinished: boolean = false;
            console.log("Waiting for builds to finish - This might take a while...");
            while (!areBuildsFinished) {
                try {
                    areBuildsFinished = await this.tfsRestService.areBuildsFinished(
                        queuedBuildIds, this.failTaskIfBuildsNotSuccessful, this.treatPartiallySucceededBuildAsSuccessful);
                    if (!areBuildsFinished) {
                        this.taskLibrary.debug(`Builds not yet finished...Waiting ${this.waitForQueuedBuildsToFinishRefreshTime} seconds`);
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
        }
    }

    private writeVariable(triggeredBuilds: number[]): void {
        if (this.storeInVariable) {
            console.log(`Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`);
            var previousValue: string = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);

            if (previousValue !== undefined && previousValue !== "") {
                // concatenate variable values
                console.log(`Following value is already stored in the variable: '${previousValue}'`);

                for (let value of previousValue.split(",").reverse()) {
                    triggeredBuilds.splice(0, 0, Number.parseInt(value));
                }
            }

            this.taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, triggeredBuilds.join(","));
            console.log(`New Value of variable: '${this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)}'`);
        }
    }

    private async triggerBuilds(): Promise<number[]> {
        var queuedBuildIds: number[] = new Array();

        var index: number = 0;

        for (let build of this.buildDefinitionsToTrigger) {
            var queuedBuild: Build =
                await this.tfsRestService.triggerBuild(
                    build.trim(),
                    this.branchToUse,
                    this.userId,
                    this.sourceVersion,
                    this.demands,
                    this.buildQueueId,
                    this.buildParameters);

            queuedBuildIds.push(queuedBuild.id);

            console.log(`Queued new Build for definition ${build}: ${queuedBuild._links.web.href}`);

            if (this.delayBetweenBuilds > 0 && index !== this.buildDefinitionsToTrigger.length - 1) {
                console.log(`Waiting for ${this.delayBetweenBuilds} seconds before triggering next build`);
                await this.generalFunctions.sleep(this.delayBetweenBuilds * 1000);
            }

            index++;
        }

        return queuedBuildIds;
    }

    private async checkConditions(): Promise<boolean> {
        if (this.enableBuildInQueueCondition) {
            console.log("Checking if blocking builds are queued");

            var buildStatesToCheck: BuildStatus = BuildStatus.NotStarted;
            if (this.blockInProgressBuilds) {
                // tslint:disable-next-line:no-bitwise
                buildStatesToCheck |= BuildStatus.InProgress;
            }

            var currentBuildDefinition: string = `${process.env[tfsService.CurrentBuildDefinition]}`;

            for (let blockingBuild of this.blockingBuilds) {
                console.log(`Checking build ${blockingBuild}`);
                var stateToCheck: BuildStatus = buildStatesToCheck;

                if (this.includeCurrentBuildDefinition && blockingBuild === currentBuildDefinition) {
                    // current build is always in progress --> only check whether is queued.
                    console.log("Is current build definition - will not check for builds in progress");
                    stateToCheck = BuildStatus.NotStarted;
                }

                let queuedBuilds: Build[]
                    = await this.tfsRestService.getBuildsByStatus(
                        blockingBuild,
                        stateToCheck);

                if (queuedBuilds.length > 0) {
                    console.log(`${blockingBuild} is queued - will not trigger new build.`);

                    return false;
                }
            };

            console.log("None of the blocking builds is queued - proceeding");
        }

        if (this.dependentOnSuccessfulBuildCondition) {
            console.log("Checking if dependant build definitions last builds were successful");

            for (let element of this.dependentBuildsList) {
                console.log(`Checking build ${element}`);

                let lastBuilds: Build[] = (await this.tfsRestService.getBuildsByStatus(element));

                if (lastBuilds.length > 0 && lastBuilds[0].result !== BuildResult.Succeeded) {
                    console.log(
                        `Last build of definition ${element} was not successful
                    (state is ${BuildResult[lastBuilds[0].result]}) - will not trigger new build`);
                    return false;
                }
            };

            console.log("None of the dependant build definitions last builds were failing - proceeding");
        }

        if (this.dependentOnFailedBuildCondition) {
            console.log("Checking if dependant build definitions last builds were NOT successful");

            for (let build of this.dependentFailingBuildsList) {
                let lastBuilds: Build[] = (await this.tfsRestService.getBuildsByStatus(build));

                if (lastBuilds.length > 0 && lastBuilds[0].result === BuildResult.Succeeded) {
                    console.log(`Last build of definition ${build} was successful
                (state is ${BuildResult[lastBuilds[0].result]}) - will not trigger new build`);
                    return false;
                }
            };

            console.log("None of the dependant build definitions last builds were successful - proceeding");
        }

        return true;
    }

    private async parseInputs(): Promise<void> {
        await this.initializeTfsRestService();

        if (this.queueBuildForUserThatTriggeredBuild) {
            let user: string = `${process.env[tfsService.RequestedForUsername]}`;
            this.userId = `${process.env[tfsService.RequestedForUserId]}`;
            console.log(`Build shall be triggered for same user that triggered current build: ${user}`);
        }

        if (this.useSameSourceVersion) {
            this.sourceVersion = `${process.env[tfsService.SourceVersion]}`;
            let repositoryType: string = `${process.env[tfsService.RepositoryType]}`;

            console.log(`Source Version: ${this.sourceVersion}`);

            // if we use a TFS Repository, we need to specify a "C" before the changeset...it is usually set by default, except
            // if we use the latest version, the source version will not have a C prepended, so we have to do that manually...
            // in case it starts with an L it means it's a label and its fine.
            // shelvesets are prepended with a C as well, so the logic still holds
            if (!this.sourceVersion.startsWith("C") && !this.sourceVersion.startsWith("L")
                && repositoryType === tfsService.TfsRepositoryType) {
                this.sourceVersion = `C${this.sourceVersion}`;
            }

            console.log(`Triggered Build will use the same source version: ${this.sourceVersion}`);
        }

        if (this.useSameBranch) {
            this.branchToUse = `${process.env[tfsService.SourceBranch]}`;
            console.log(`Using same branch as source version: ${this.branchToUse}`);
        }

        if (this.demands != null) {
            var parsedDemands: string[] = [];

            this.demands.forEach(demand => {
                parsedDemands.push(demand.replace("=", " -equals "));
            });

            this.demands = parsedDemands;

            if (this.demands.length > 0) {
                console.log(`Will trigger build with following demands:`);
                this.demands.forEach(demand => console.log(demand));
            }
        }

        if (this.buildQueue !== null) {
            if (isNaN(Number(this.buildQueue))) {
                console.log(`Build Queue was specified as string: ${this.buildQueue} - trying to fetch Queue ID for the queue...`);
                this.buildQueueId = await this.tfsRestService.getQueueIdByName(this.buildQueue);
                console.log(`Found id of queue ${this.buildQueue}: ${this.buildQueueId}`);
            } else {
                this.buildQueueId = parseInt(this.buildQueue, 10);
            }
            console.log(`Will trigger build in following agent queue: ${this.buildQueueId}`);
        }

        if (this.buildParameters !== null) {
            console.log(`Will trigger build with following parameters: ${this.buildParameters}`);
        }

        if (this.delayBetweenBuilds > 0) {
            console.log(`Delay between builds is set to ${this.delayBetweenBuilds} seconds`);
        }

        if (this.enableBuildInQueueCondition) {
            console.log("Build in Queue Condition is enabled");

            if (this.includeCurrentBuildDefinition) {
                let currentBuildDefinition: string = `${process.env[tfsService.CurrentBuildDefinition]}`;
                console.log("Current Build Definition shall be included");
                this.blockingBuilds.push(currentBuildDefinition);
            }

            if (this.blockInProgressBuilds) {
                console.log("Will treat in progress builds as blocking.");
            }

            console.log("Following builds are blocking:");
            this.blockingBuilds.forEach(blockingBuild => {
                console.log(`${blockingBuild}`);
            });
        }

        if (this.dependentOnSuccessfulBuildCondition) {
            console.log("Dependant Build Condition is enabled - Following builds are checked:");

            this.dependentBuildsList.forEach(element => {
                console.log(`${element}`);
            });
        }

        if (this.dependentOnFailedBuildCondition) {
            console.log("Dependant Failing Build Condition is enabled - Following builds are checked:");
            this.dependentFailingBuildsList.forEach(dependantBuild => {
                console.log(`${dependantBuild}`);
            });
        }

        if (this.failTaskIfConditionsAreNotFulfilled) {
            console.log("Will fail the task if a condition is not fulfilled.");
        }
    }

    private async initializeTfsRestService(): Promise<void> {
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
        console.log(`Server URL: ${this.tfsServer}`);

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

        this.buildDefinitionsToTrigger =
            this.generalFunctions.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true));

        this.ignoreSslCertificateErrors = this.taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);

        // advanced Configuration
        this.queueBuildForUserThatTriggeredBuild = this.taskLibrary.getBoolInput(taskConstants.QueueBuildForUserInput, true);
        this.useSameSourceVersion = this.taskLibrary.getBoolInput(taskConstants.UseSameSourceVersionInput, true);
        this.useSameBranch = this.taskLibrary.getBoolInput(taskConstants.UseSameBranchInput, true);
        this.branchToUse = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.BranchToUseInput, false));
        this.waitForQueuedBuildsToFinish = this.taskLibrary.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true);
        this.waitForQueuedBuildsToFinishRefreshTime =
            parseInt(this.taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
        this.failTaskIfBuildsNotSuccessful = this.taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);
        this.cancelBuildsIfAnyFails = this.taskLibrary.getBoolInput(taskConstants.CancelBuildsIfAnyFails, true);
        this.treatPartiallySucceededBuildAsSuccessful = this.taskLibrary.getBoolInput(
            taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true);

        if (this.failTaskIfBuildsNotSuccessful) {
            this.downloadBuildArtifacts = this.taskLibrary.getBoolInput(taskConstants.DownloadBuildArtifacts, true);
        } else {
            this.downloadBuildArtifacts = false;
        }

        this.dropDirectory = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.DropDirectory, false));

        this.storeInVariable = this.taskLibrary.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true);
        this.demands = this.generalFunctions.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false));

        this.buildQueue = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.QueueID, false));
        this.buildParameters = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.BuildParametersInput, false));

        var delayBetweenBuildsInput: string = this.taskLibrary.getInput(taskConstants.DelayBetweenBuildsInput, false);
        this.delayBetweenBuilds = parseInt(delayBetweenBuildsInput, 10);
        if (isNaN(this.delayBetweenBuilds)) {
            this.delayBetweenBuilds = 0;
        }

        // authentication
        this.authenticationMethod = this.taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
        this.username = this.taskLibrary.getInput(taskConstants.UsernameInput, false);
        this.password = this.taskLibrary.getInput(taskConstants.PasswordInput, false);

        // conditions
        this.enableBuildInQueueCondition = this.taskLibrary.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, true);

        this.includeCurrentBuildDefinition = this.taskLibrary.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, false);
        this.blockingBuilds =
            this.generalFunctions.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", false));
        this.blockInProgressBuilds = this.taskLibrary.getBoolInput(taskConstants.BlockInProgressBuilds, false);

        this.dependentOnSuccessfulBuildCondition =
            this.taskLibrary.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, true);
        this.dependentBuildsList =
            this.generalFunctions.trimValues(
                this.taskLibrary.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false));
        this.dependentOnFailedBuildCondition = this.taskLibrary.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, true);
        this.dependentFailingBuildsList =
            this.generalFunctions.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false));

        this.failTaskIfConditionsAreNotFulfilled = this.taskLibrary.getBoolInput(taskConstants.FailTaskIfConditionsAreNotFulfilled, true);
    }
}