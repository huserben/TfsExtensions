"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunner = void 0;
const tfsService = require("tfsrestservice");
const taskConstants = require("./taskconstants");
const tl = require("./tasklibrary");
const BuildInterfaces_1 = require("azure-devops-node-api/interfaces/BuildInterfaces");
class TaskRunner {
    constructor(tfsRestService, taskLibrary, generalFunctions) {
        this.definitionIsInCurrentTeamProject = false;
        this.tfsServer = "";
        this.teamProject = "";
        this.buildDefinitionsToTrigger = [];
        this.queueBuildForUserThatTriggeredBuild = false;
        this.useSameSourceVersion = false;
        this.useSameBranch = false;
        this.useCustomSourceVersion = false;
        this.waitForQueuedBuildsToFinish = false;
        this.waitForQueuedBuildsToFinishRefreshTime = 60;
        this.failTaskIfBuildsNotSuccessful = false;
        this.cancelBuildsIfAnyFails = false;
        this.treatPartiallySucceededBuildAsSuccessful = false;
        this.downloadBuildArtifacts = false;
        this.storeInVariable = false;
        this.ignoreSslCertificateErrors = false;
        this.authenticationMethod = "";
        this.enableBuildInQueueCondition = false;
        this.includeCurrentBuildDefinition = false;
        this.blockInProgressBuilds = false;
        this.dependentOnSuccessfulBuildCondition = false;
        this.dependentOnFailedBuildCondition = false;
        this.checkbuildsoncurrentbranch = false;
        this.branchToCheckConditionsAgainst = "";
        this.failTaskIfConditionsAreNotFulfilled = false;
        this.tfsRestService = tfsRestService;
        this.taskLibrary = taskLibrary;
        this.generalFunctions = generalFunctions;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.getInputs();
                yield this.parseInputs();
                var conditionsFulfilled = yield this.checkConditions();
                if (conditionsFulfilled) {
                    var triggeredBuilds = yield this.triggerBuilds();
                    this.writeVariable(triggeredBuilds);
                    yield this.waitForBuildsToFinish(triggeredBuilds);
                }
                else if (this.failTaskIfConditionsAreNotFulfilled) {
                    throw new Error("Condition not fulfilled - failing task.");
                }
            }
            catch (err) {
                this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
            }
        });
    }
    waitForBuildsToFinish(queuedBuildIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.waitForQueuedBuildsToFinish) {
                console.log(`Will wait for queued build to be finished - Refresh time is set to ${this.waitForQueuedBuildsToFinishRefreshTime} seconds`);
                console.log("Following Builds will be awaited:");
                for (let buildId of queuedBuildIds) {
                    var buildInfo = yield this.tfsRestService.getBuildInfo(buildId);
                    console.log(`Build ${buildId} (${buildInfo.definition.name}): ${buildInfo._links.web.href.trim()}`);
                }
                var areBuildsFinished = false;
                console.log("Waiting for builds to finish - This might take a while...");
                while (!areBuildsFinished) {
                    try {
                        areBuildsFinished = yield this.tfsRestService.areBuildsFinished(queuedBuildIds, this.failTaskIfBuildsNotSuccessful, this.treatPartiallySucceededBuildAsSuccessful);
                        if (!areBuildsFinished) {
                            this.taskLibrary.debug(`Builds not yet finished...Waiting ${this.waitForQueuedBuildsToFinishRefreshTime} seconds`);
                            yield this.generalFunctions.sleep((this.waitForQueuedBuildsToFinishRefreshTime * 1000));
                        }
                    }
                    catch (err) {
                        if (this.cancelBuildsIfAnyFails) {
                            console.log("Awaited build failed - attempting to cancel triggered builds");
                            for (let buildId of queuedBuildIds) {
                                console.log(`Cancel build ${buildId}`);
                                yield this.tfsRestService.cancelBuild(buildId);
                            }
                        }
                        throw err;
                    }
                }
                console.log("All builds are finished");
                if (this.downloadBuildArtifacts) {
                    console.log(`Downloading build artifacts to ${this.dropDirectory}`);
                    for (let buildId of queuedBuildIds) {
                        yield this.tfsRestService.downloadArtifacts(buildId, this.dropDirectory);
                    }
                }
            }
        });
    }
    writeVariable(triggeredBuilds) {
        if (this.storeInVariable) {
            console.log(`Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`);
            var previousValue = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
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
    triggerBuilds() {
        return __awaiter(this, void 0, void 0, function* () {
            var queuedBuildIds = new Array();
            var index = 0;
            for (let build of this.buildDefinitionsToTrigger) {
                var queuedBuild = yield this.tfsRestService.triggerBuild(build.trim(), this.branchToUse, this.userId, this.sourceVersion, this.demands, this.buildQueueId, this.buildParameters);
                queuedBuildIds.push(queuedBuild.id);
                console.log(`Queued new Build for definition ${build}: ${queuedBuild._links.web.href}`);
                if (this.delayBetweenBuilds > 0 && index !== this.buildDefinitionsToTrigger.length - 1) {
                    console.log(`Waiting for ${this.delayBetweenBuilds} seconds before triggering next build`);
                    yield this.generalFunctions.sleep(this.delayBetweenBuilds * 1000);
                }
                index++;
            }
            return queuedBuildIds;
        });
    }
    checkConditions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.enableBuildInQueueCondition) {
                console.log("Checking if blocking builds are queued");
                var buildStatesToCheck = BuildInterfaces_1.BuildStatus.NotStarted;
                if (this.blockInProgressBuilds) {
                    // tslint:disable-next-line:no-bitwise
                    buildStatesToCheck |= BuildInterfaces_1.BuildStatus.InProgress;
                }
                var currentBuildDefinition = `${process.env[tfsService.CurrentBuildDefinition]}`;
                for (let blockingBuild of this.blockingBuilds) {
                    console.log(`Checking build ${blockingBuild}`);
                    var stateToCheck = buildStatesToCheck;
                    if (this.includeCurrentBuildDefinition && blockingBuild === currentBuildDefinition) {
                        // current build is always in progress --> only check whether is queued.
                        console.log("Is current build definition - will not check for builds in progress");
                        stateToCheck = BuildInterfaces_1.BuildStatus.NotStarted;
                    }
                    let queuedBuilds = yield this.tfsRestService.getBuildsByStatus(blockingBuild, stateToCheck);
                    queuedBuilds = this.filterBuildsForSameBranch(queuedBuilds);
                    if (queuedBuilds.length > 0) {
                        console.log(`${blockingBuild} is queued - will not trigger new build.`);
                        return false;
                    }
                }
                ;
                console.log("None of the blocking builds is queued - proceeding");
            }
            if (this.dependentOnSuccessfulBuildCondition) {
                console.log("Checking if dependant build definitions last builds were successful");
                for (let element of this.dependentBuildsList) {
                    console.log(`Checking build ${element}`);
                    let lastBuilds = this.filterBuildsForSameBranch((yield this.tfsRestService.getBuildsByStatus(element)));
                    if (lastBuilds.length > 0 && lastBuilds[0].result !== BuildInterfaces_1.BuildResult.Succeeded) {
                        console.log(`Last build of definition ${element} was not successful
                    (state is ${BuildInterfaces_1.BuildResult[lastBuilds[0].result]}) - will not trigger new build`);
                        return false;
                    }
                }
                ;
                console.log("None of the dependant build definitions last builds were failing - proceeding");
            }
            if (this.dependentOnFailedBuildCondition) {
                console.log("Checking if dependant build definitions last builds were NOT successful");
                for (let build of this.dependentFailingBuildsList) {
                    let lastBuilds = this.filterBuildsForSameBranch((yield this.tfsRestService.getBuildsByStatus(build)));
                    if (lastBuilds.length > 0 && lastBuilds[0].result === BuildInterfaces_1.BuildResult.Succeeded) {
                        console.log(`Last build of definition ${build} was successful
                (state is ${BuildInterfaces_1.BuildResult[lastBuilds[0].result]}) - will not trigger new build`);
                        return false;
                    }
                }
                ;
                console.log("None of the dependant build definitions last builds were successful - proceeding");
            }
            return true;
        });
    }
    filterBuildsForSameBranch(builds) {
        if (this.checkbuildsoncurrentbranch) {
            var filteredBuilds = [];
            for (let build of builds) {
                if (build.sourceBranch === this.branchToCheckConditionsAgainst) {
                    filteredBuilds.push(build);
                }
            }
            return filteredBuilds;
        }
        return builds;
    }
    parseInputs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initializeTfsRestService();
            if (this.queueBuildForUserThatTriggeredBuild) {
                if (process.env[tfsService.ReleaseRequestedForUsername]) {
                    console.log(`Context is Release - using Release Environment Variables`);
                    var user = `${process.env[tfsService.ReleaseRequestedForUsername]}`;
                    this.userId = `${process.env[tfsService.ReleaseRequestedForId]}`;
                    console.log(`Build shall be triggered for same user that triggered current Release: ${user}`);
                }
                else {
                    console.log(`Context is Build - using Build Environment Variables`);
                    var user = `${process.env[tfsService.RequestedForUsername]}`;
                    this.userId = `${process.env[tfsService.RequestedForUserId]}`;
                    console.log(`Build shall be triggered for same user that triggered current build: ${user}`);
                }
            }
            if (this.useSameSourceVersion) {
                this.sourceVersion = `${process.env[tfsService.SourceVersion]}`;
                let repositoryType = `${process.env[tfsService.RepositoryType]}`;
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
            else if (this.useCustomSourceVersion) {
                this.sourceVersion = this.customSourceVersion;
                let repositoryType = `${process.env[tfsService.RepositoryType]}`;
                console.log(`Source Version: ${this.sourceVersion}`);
                // if we use a TFS Repository, we need to specify a "C" before the changeset...it is usually set by default, except
                // if we use the latest version, the source version will not have a C prepended, so we have to do that manually...
                // in case it starts with an L it means it's a label and its fine.
                // shelvesets are prepended with a C as well, so the logic still holds
                if (!this.sourceVersion.startsWith("C") && !this.sourceVersion.startsWith("L")
                    && repositoryType === tfsService.TfsRepositoryType) {
                    this.sourceVersion = `C${this.sourceVersion}`;
                }
                console.log(`Triggered Build will use the custom source version: ${this.sourceVersion}`);
            }
            if (this.useSameBranch) {
                this.branchToUse = `${process.env[tfsService.SourceBranch]}`;
                console.log(`Using same branch as source version: ${this.branchToUse}`);
            }
            if (this.demands != null) {
                var parsedDemands = [];
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
                    this.buildQueueId = yield this.tfsRestService.getQueueIdByName(this.buildQueue);
                    console.log(`Found id of queue ${this.buildQueue}: ${this.buildQueueId}`);
                }
                else {
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
                    let currentBuildDefinition = `${process.env[tfsService.CurrentBuildDefinition]}`;
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
            if (this.checkbuildsoncurrentbranch) {
                let repositoryType = `${process.env[tfsService.RepositoryType]}`;
                if (repositoryType === tfsService.TfsRepositoryType) {
                    console.warn(`Configured to only include builds from current branch - this option does not work in a TFVC repository, will skip...`);
                    this.checkbuildsoncurrentbranch = false;
                }
                else {
                    this.branchToCheckConditionsAgainst = `${process.env[tfsService.SourceBranch]}`;
                    console.log(`Will only include builds from current branch in build condition: ${this.branchToCheckConditionsAgainst}`);
                }
            }
            if (this.failTaskIfConditionsAreNotFulfilled) {
                console.log("Will fail the task if a condition is not fulfilled.");
            }
        });
    }
    initializeTfsRestService() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.definitionIsInCurrentTeamProject) {
                console.log("Using current Team Project");
                this.teamProject = `${process.env[tfsService.TeamProjectId]}`;
                console.log(`Team Project: ${process.env[tfsService.TeamProject]} with ID ${this.teamProject}`);
                console.log("Using current Collection Url");
                this.tfsServer = `${process.env[tfsService.TeamFoundationCollectionUri]}`;
            }
            else {
                console.log("Using Custom Team Project");
                console.log(`Team Project: ${this.teamProject}`);
                console.log("Using Custom Collection Url");
            }
            /* we decode here because the web request library handles the encoding of the uri.
             * otherwise we get double-encoded urls which cause problems. */
            this.tfsServer = decodeURI(this.tfsServer);
            console.log(`Server URL: ${this.tfsServer}`);
            console.log(`Using following Authentication Method: ${this.authenticationMethod}`);
            if (this.authenticationMethod === tfsService.AuthenticationMethodOAuthToken &&
                (this.password === null || this.password === "")) {
                console.log("Trying to fetch authentication token from system...");
                const token = this.taskLibrary.getVariable("System.AccessToken");
                if (token == null) {
                    throw new Error("Failed to get OAuth token");
                }
                this.password = token;
            }
            yield this.tfsRestService.initialize(this.authenticationMethod, this.username, this.password, this.tfsServer, this.teamProject, this.ignoreSslCertificateErrors);
        });
    }
    /// Fetch all the inputs and set them to the variables to be used within the script.
    getInputs() {
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
        this.useCustomSourceVersion = this.taskLibrary.getBoolInput(taskConstants.UseCustomSourceVersionInput, true);
        this.customSourceVersion = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.CustomSourceVersionInput, false));
        this.useSameBranch = this.taskLibrary.getBoolInput(taskConstants.UseSameBranchInput, true);
        this.branchToUse = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.BranchToUseInput, false));
        this.waitForQueuedBuildsToFinish = this.taskLibrary.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true);
        this.waitForQueuedBuildsToFinishRefreshTime =
            parseInt(this.taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
        this.failTaskIfBuildsNotSuccessful = this.taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);
        this.cancelBuildsIfAnyFails = this.taskLibrary.getBoolInput(taskConstants.CancelBuildsIfAnyFails, true);
        this.treatPartiallySucceededBuildAsSuccessful = this.taskLibrary.getBoolInput(taskConstants.TreatPartiallySucceededBuildAsSuccessfulInput, true);
        if (this.failTaskIfBuildsNotSuccessful) {
            this.downloadBuildArtifacts = this.taskLibrary.getBoolInput(taskConstants.DownloadBuildArtifacts, true);
        }
        else {
            this.downloadBuildArtifacts = false;
        }
        this.dropDirectory = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.DropDirectory, false));
        this.storeInVariable = this.taskLibrary.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true);
        this.demands = this.generalFunctions.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false));
        this.buildQueue = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.QueueID, false));
        this.buildParameters = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.BuildParametersInput, false));
        var delayBetweenBuildsInput = this.taskLibrary.getInput(taskConstants.DelayBetweenBuildsInput, false);
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
            this.generalFunctions.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false));
        this.dependentOnFailedBuildCondition = this.taskLibrary.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, true);
        this.dependentFailingBuildsList =
            this.generalFunctions.trimValues(this.taskLibrary.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false));
        this.checkbuildsoncurrentbranch = this.taskLibrary.getBoolInput(taskConstants.CheckBuildsOnCurrentBranch, true);
        this.failTaskIfConditionsAreNotFulfilled = this.taskLibrary.getBoolInput(taskConstants.FailTaskIfConditionsAreNotFulfilled, true);
    }
}
exports.TaskRunner = TaskRunner;
