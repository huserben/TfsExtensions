import tfsService = require("./tfsrestservice");
import tfsConstants = require("./tfsconstants");
import taskConstants = require("./taskconstants");
import common = require("./generalfunctions");
import tl = require("./tasklibrary");

export class TaskRunner {
    definitionIsInCurrentTeamProject: boolean;
    tfsServer: string;
    buildDefinitionsToTrigger: string[];
    queueBuildForUserThatTriggeredBuild: boolean;
    useSameSourceVersion: boolean;
    useSameBranch: boolean;
    branchToUse: string;
    waitForQueuedBuildsToFinish: boolean;
    waitForQueuedBuildsToFinishRefreshTime: number;
    failTaskIfBuildsNotSuccessful: boolean;
    downloadBuildArtifacts: boolean;
    dropDirectory: string;
    storeInVariable: boolean;
    demands: string[];
    buildQueue: string;
    buildQueueId: number;
    buildParameters: string;
    ignoreSslCertificateErrors: boolean;
    authenticationMethod: string;
    username: string;
    password: string;
    enableBuildInQueueCondition: boolean;
    includeCurrentBuildDefinition: boolean;
    blockingBuilds: string[];
    dependentOnSuccessfulBuildCondition: boolean;
    dependentBuildsList: string[];
    dependentOnFailedBuildCondition: boolean;
    dependentFailingBuildsList: string[];

    requestedForBody: string;
    sourceVersionBody: string;

    tfsRestService :tfsService.ITfsRestService;
    taskLibrary : tl.ITaskLibrary;

    constructor(
        tfsRestService :tfsService.ITfsRestService,
        taskLibrary : tl.ITaskLibrary) {
        this.tfsRestService = tfsRestService;
        this.taskLibrary = taskLibrary;
    }

    public async run(): Promise<void> {
        try {
            this.getInputs();
            await this.parseInputs();

            var conditionsFulfilled: boolean = await this.checkConditions();
            if (conditionsFulfilled) {
                var triggeredBuilds: string[] = await this.triggerBuilds();
                this.writeVariable(triggeredBuilds);
                await this.waitForBuildsToFinish(triggeredBuilds);
            }
        } catch (err) {
            this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
        }
    }

    private async waitForBuildsToFinish(queuedBuildIds: string[]): Promise<void> {
        if (this.waitForQueuedBuildsToFinish) {
            console.log(`Will wait for queued build to be finished - Refresh time is set to ${this.waitForQueuedBuildsToFinishRefreshTime} seconds`);

            var areBuildsFinished: boolean = false;
            while (!areBuildsFinished) {
                areBuildsFinished = await this.tfsRestService.waitForBuildsToFinish(queuedBuildIds, this.failTaskIfBuildsNotSuccessful);

                if (!areBuildsFinished) {
                    await common.sleep((this.waitForQueuedBuildsToFinishRefreshTime * 1000));
                }
            }

            if (this.downloadBuildArtifacts) {
                console.log(`Downloading build artifacts to ${this.dropDirectory}`);
                for (let buildId of queuedBuildIds) {
                    await this.tfsRestService.downloadArtifacts(buildId, this.dropDirectory);
                }
            }
        }
    }

    private writeVariable(triggeredBuilds: string[]): void {
        if (this.storeInVariable) {
            console.log(`Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`);
            var previousValue: string = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);

            if (previousValue !== undefined) {
                // concatenate variable values
                console.log(`Following value is already stored in the variable: '${previousValue}'`);

                triggeredBuilds.splice(0, 0, previousValue);
            }

            this.taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, triggeredBuilds.join(","));
            console.log(`New Value of variable: '${this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)}'`);
        }
    }

    private async triggerBuilds(): Promise<string[]> {
        var queuedBuildIds: string[] = new Array();

        for (let build of this.buildDefinitionsToTrigger) {
            var queuedBuildId: string =
                await this.tfsRestService.triggerBuild(
                    build.trim(),
                    this.branchToUse,
                    this.requestedForBody,
                    this.sourceVersionBody,
                    this.demands,
                    this.buildQueueId,
                    this.buildParameters);

            queuedBuildIds.push(queuedBuildId);

            console.log(`Queued new Build for definition ${build}: ${this.tfsServer}/_build/index?buildId=${queuedBuildId}`);
        }

        return queuedBuildIds;
    }

    private async checkConditions(): Promise<boolean> {
        if (this.enableBuildInQueueCondition) {
            console.log("Checking if blocking builds are queued");

            for (let blockingBuild of this.blockingBuilds) {
                console.log(`Checking build ${blockingBuild}`);
                let queuedBuilds: tfsService.IBuild[]
                    = await this.tfsRestService.getBuildsByStatus(
                        blockingBuild,
                        `${taskConstants.BuildStateNotStarted}`);

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

                let lastBuilds: tfsService.IBuild[] = (await this.tfsRestService.getBuildsByStatus(element, ""));

                if (lastBuilds.length > 0 && lastBuilds[0].result !== taskConstants.BuildResultSucceeded) {
                    console.log(
                        `Last build of definition ${element} was not successful
                    (state is ${lastBuilds[0].result}) - will not trigger new build`);
                    return false;
                }
            };

            console.log("None of the dependant build definitions last builds were failing - proceeding");
        }

        if (this.dependentOnFailedBuildCondition) {
            console.log("Checking if dependant build definitions last builds were NOT successful");

            for (let build of this.dependentFailingBuildsList) {
                let lastBuilds: tfsService.IBuild[] = (await this.tfsRestService.getBuildsByStatus(build, ""));

                if (lastBuilds.length > 0 && lastBuilds[0].result === taskConstants.BuildResultSucceeded) {
                    console.log(`Last build of definition ${build} was successful
                (state is ${lastBuilds[0].result}) - will not trigger new build`);
                    return false;
                }
            };

            console.log("None of the dependant build definitions last builds were successful - proceeding");
        }

        return true;
    }

    private async parseInputs(): Promise<void> {
        if (this.definitionIsInCurrentTeamProject) {
            console.log("Using current Team Project Url");
            this.tfsServer = `${process.env[tfsConstants.TeamFoundationCollectionUri]}${process.env[tfsConstants.TeamProject]}`;
        } else {
            console.log("Using Custom Team Project Url");
        }
        console.log("Path to Server: " + this.tfsServer);

        this.tfsRestService.initialize(
            this.authenticationMethod,
            this.username,
            this.password,
            this.tfsServer,
            this.ignoreSslCertificateErrors);

        if (this.queueBuildForUserThatTriggeredBuild) {
            let user: string = `${process.env[tfsConstants.RequestedForUsername]}`;
            let userId: string = `${process.env[tfsConstants.RequestedForUserId]}`;
            console.log(`Build shall be triggered for same user that triggered current build: ${user}`);

            this.requestedForBody = `requestedFor: { id: \"${userId}\"}`;
        }

        if (this.useSameSourceVersion) {
            let sourceVersion: string = `${process.env[tfsConstants.SourceVersion]}`;
            let repositoryType: string = `${process.env[tfsConstants.RepositoryType]}`;

            console.log(`Source Version: ${sourceVersion}`);

            // if we use a TFS Repository, we need to specify a "C" before the changeset...it is usually set by default, except
            // if we use the latest version, the source version will not have a C prepended, so we have to do that manually...
            // in case it starts with an L it means it's a label and its fine.
            // shelvesets are prepended with a C as well, so the logic still holds
            if (!sourceVersion.startsWith("C") && !sourceVersion.startsWith("L") && repositoryType === tfsConstants.TfsRepositoryType) {
                sourceVersion = `C${sourceVersion}`;
            }

            console.log(`Triggered Build will use the same source version: ${sourceVersion}`);
            this.sourceVersionBody = `sourceVersion: \"${sourceVersion}\"`;
        }

        if (this.useSameBranch) {
            this.branchToUse = `${process.env[tfsConstants.SourceBranch]}`;
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

        if (this.enableBuildInQueueCondition) {
            console.log("Build in Queue Condition is enabled");

            if (this.includeCurrentBuildDefinition) {
                let currentBuildDefinition: string = `${process.env[tfsConstants.CurrentBuildDefinition]}`;
                console.log("Current Build Definition shall be included");
                this.blockingBuilds.push(currentBuildDefinition);
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
    }

    /// Fetch all the inputs and set them to the variables to be used within the script.
    private getInputs(): void {
        // basic Configuration
        this.definitionIsInCurrentTeamProject = this.taskLibrary.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true);
        this.tfsServer = common.trimValue(this.taskLibrary.getInput(taskConstants.ServerUrlInput, false));

        this.buildDefinitionsToTrigger =
        common.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true));

        this.ignoreSslCertificateErrors = this.taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);

        // advanced Configuration
        this.queueBuildForUserThatTriggeredBuild = this.taskLibrary.getBoolInput(taskConstants.QueueBuildForUserInput, true);
        this.useSameSourceVersion = this.taskLibrary.getBoolInput(taskConstants.UseSameSourceVersionInput, true);
        this.useSameBranch = this.taskLibrary.getBoolInput(taskConstants.UseSameBranchInput, true);
        this.branchToUse = common.trimValue(this.taskLibrary.getInput(taskConstants.BranchToUseInput, false));
        this.waitForQueuedBuildsToFinish = this.taskLibrary.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true);
        this.waitForQueuedBuildsToFinishRefreshTime =
        parseInt(this.taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
        this.failTaskIfBuildsNotSuccessful = this.taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);

        if (this.failTaskIfBuildsNotSuccessful) {
            this.downloadBuildArtifacts = this.taskLibrary.getBoolInput(taskConstants.DownloadBuildArtifacts, true);
        } else {
            this.downloadBuildArtifacts = false;
        }

        this.dropDirectory = common.trimValue(this.taskLibrary.getInput(taskConstants.DropDirectory, false));

        this.storeInVariable = this.taskLibrary.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true);
        this.demands = common.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false));

        this.buildQueue = common.trimValue(this.taskLibrary.getInput(taskConstants.QueueID, false));
        this.buildParameters = common.trimValue(this.taskLibrary.getInput(taskConstants.BuildParametersInput, false));

        // authentication
        this.authenticationMethod = this.taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
        this.username = this.taskLibrary.getInput(taskConstants.UsernameInput, false);
        this.password = this.taskLibrary.getInput(taskConstants.PasswordInput, false);

        // conditions
        this.enableBuildInQueueCondition = this.taskLibrary.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, true);

        this.includeCurrentBuildDefinition = this.taskLibrary.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, false);
        this.blockingBuilds = common.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", false));

        this.dependentOnSuccessfulBuildCondition =
        this.taskLibrary.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, true);
        this.dependentBuildsList =
        common.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false));
        this.dependentOnFailedBuildCondition = this.taskLibrary.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, true);
        this.dependentFailingBuildsList =
        common.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false));
    }
}