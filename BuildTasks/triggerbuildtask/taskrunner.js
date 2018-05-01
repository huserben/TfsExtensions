"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tfsService = require("tfsrestservice");
const taskConstants = require("./taskconstants");
const tl = require("./tasklibrary");
class TaskRunner {
    constructor(tfsRestService, taskLibrary, generalFunctions) {
        this.definitionIsInCurrentTeamProject = false;
        this.tfsServer = "";
        this.buildDefinitionsToTrigger = [];
        this.queueBuildForUserThatTriggeredBuild = false;
        this.useSameSourceVersion = false;
        this.useSameBranch = false;
        this.waitForQueuedBuildsToFinish = false;
        this.waitForQueuedBuildsToFinishRefreshTime = 60;
        this.failTaskIfBuildsNotSuccessful = false;
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
                    areBuildsFinished = yield this.tfsRestService.areBuildsFinished(queuedBuildIds, this.failTaskIfBuildsNotSuccessful, this.treatPartiallySucceededBuildAsSuccessful);
                    if (!areBuildsFinished) {
                        this.taskLibrary.debug(`Builds not yet finished...Waiting ${this.waitForQueuedBuildsToFinishRefreshTime * 1000} seconds`);
                        yield this.generalFunctions.sleep((this.waitForQueuedBuildsToFinishRefreshTime * 1000));
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
                    triggeredBuilds.splice(0, 0, value);
                }
            }
            this.taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, triggeredBuilds.join(","));
            console.log(`New Value of variable: '${this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)}'`);
        }
    }
    triggerBuilds() {
        return __awaiter(this, void 0, void 0, function* () {
            var queuedBuildIds = new Array();
            for (let build of this.buildDefinitionsToTrigger) {
                var queuedBuildId = yield this.tfsRestService.triggerBuild(build.trim(), this.branchToUse, this.userId, this.sourceVersion, this.demands, this.buildQueueId, this.buildParameters);
                queuedBuildIds.push(queuedBuildId);
                console.log(`Queued new Build for definition ${build}: ${this.tfsServer}/_build/index?buildId=${queuedBuildId}`);
            }
            return queuedBuildIds;
        });
    }
    checkConditions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.enableBuildInQueueCondition) {
                console.log("Checking if blocking builds are queued");
                var buildStatesToCheck = tfsService.BuildStateNotStarted;
                if (this.blockInProgressBuilds) {
                    buildStatesToCheck += `,${tfsService.BuildStateInProgress}`;
                }
                var currentBuildDefinition = `${process.env[tfsService.CurrentBuildDefinition]}`;
                for (let blockingBuild of this.blockingBuilds) {
                    console.log(`Checking build ${blockingBuild}`);
                    var stateToCheck = buildStatesToCheck;
                    if (this.includeCurrentBuildDefinition && blockingBuild === currentBuildDefinition) {
                        // current build is always in progress --> only check whether is queued.
                        console.log("Is current build definition - will not check for builds in progress");
                        stateToCheck = tfsService.BuildStateNotStarted;
                    }
                    let queuedBuilds = yield this.tfsRestService.getBuildsByStatus(blockingBuild, stateToCheck);
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
                    let lastBuilds = (yield this.tfsRestService.getBuildsByStatus(element, ""));
                    if (lastBuilds.length > 0 && lastBuilds[0].result !== tfsService.BuildResultSucceeded) {
                        console.log(`Last build of definition ${element} was not successful
                    (state is ${lastBuilds[0].result}) - will not trigger new build`);
                        return false;
                    }
                }
                ;
                console.log("None of the dependant build definitions last builds were failing - proceeding");
            }
            if (this.dependentOnFailedBuildCondition) {
                console.log("Checking if dependant build definitions last builds were NOT successful");
                for (let build of this.dependentFailingBuildsList) {
                    let lastBuilds = (yield this.tfsRestService.getBuildsByStatus(build, ""));
                    if (lastBuilds.length > 0 && lastBuilds[0].result === tfsService.BuildResultSucceeded) {
                        console.log(`Last build of definition ${build} was successful
                (state is ${lastBuilds[0].result}) - will not trigger new build`);
                        return false;
                    }
                }
                ;
                console.log("None of the dependant build definitions last builds were successful - proceeding");
            }
            return true;
        });
    }
    parseInputs() {
        return __awaiter(this, void 0, void 0, function* () {
            this.initializeTfsRestService();
            if (this.queueBuildForUserThatTriggeredBuild) {
                let user = `${process.env[tfsService.RequestedForUsername]}`;
                this.userId = `${process.env[tfsService.RequestedForUserId]}`;
                console.log(`Build shall be triggered for same user that triggered current build: ${user}`);
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
        });
    }
    initializeTfsRestService() {
        if (this.definitionIsInCurrentTeamProject) {
            console.log("Using current Team Project Url");
            this.tfsServer = `${process.env[tfsService.TeamFoundationCollectionUri]}${process.env[tfsService.TeamProject]}`;
        }
        else {
            console.log("Using Custom Team Project Url");
        }
        /* we decode here because the web request library handles the encoding of the uri.
         * otherwise we get double-encoded urls which cause problems. */
        this.tfsServer = decodeURI(this.tfsServer);
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
        this.tfsRestService.initialize(this.authenticationMethod, this.username, this.password, this.tfsServer, this.ignoreSslCertificateErrors);
    }
    /// Fetch all the inputs and set them to the variables to be used within the script.
    getInputs() {
        // basic Configuration
        this.definitionIsInCurrentTeamProject = this.taskLibrary.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true);
        this.tfsServer = this.generalFunctions.trimValue(this.taskLibrary.getInput(taskConstants.ServerUrlInput, false));
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
    }
}
exports.TaskRunner = TaskRunner;
