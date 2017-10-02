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
const taskLibrary = require("vsts-task-lib/task");
const tfsRestService = require("./tfsrestservice");
const tfsConstants = require("./tfsconstants");
const taskConstants = require("./taskconstants");
const common = require("./generalfunctions");
let definitionIsInCurrentTeamProject;
let tfsServer;
let buildDefinitionsToTrigger;
let queueBuildForUserThatTriggeredBuild;
let useSameSourceVersion;
let useSameBranch;
let branchToUse;
let waitForQueuedBuildsToFinish;
let waitForQueuedBuildsToFinishRefreshTime;
let failTaskIfBuildsNotSuccessful;
let downloadBuildArtifacts;
let dropDirectory;
let storeInVariable;
let demands;
let queueid;
let buildParameters;
let ignoreSslCertificateErrors;
let authenticationMethod;
let username;
let password;
let enableBuildInQueueCondition;
let includeCurrentBuildDefinition;
let blockingBuilds;
let dependentOnSuccessfulBuildCondition;
let dependentBuildsList;
let dependentOnFailedBuildCondition;
let dependentFailingBuildsList;
let requestedForBody;
let sourceVersionBody;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            getInputs();
            parseInputs();
            var conditionsFulfilled = yield checkConditions();
            if (conditionsFulfilled) {
                var triggeredBuilds = yield triggerBuilds();
                writeVariable(triggeredBuilds);
                yield waitForBuildsToFinish(triggeredBuilds);
            }
        }
        catch (err) {
            taskLibrary.setResult(taskLibrary.TaskResult.Failed, err.message);
        }
    });
}
function waitForBuildsToFinish(queuedBuildIds) {
    return __awaiter(this, void 0, void 0, function* () {
        if (waitForQueuedBuildsToFinish) {
            console.log(`Will wait for queued build to be finished - Refresh time is set to ${waitForQueuedBuildsToFinishRefreshTime} seconds`);
            var areBuildsFinished = false;
            while (!areBuildsFinished) {
                areBuildsFinished = yield tfsRestService.waitForBuildsToFinish(queuedBuildIds, failTaskIfBuildsNotSuccessful);
                if (!areBuildsFinished) {
                    yield common.sleep((waitForQueuedBuildsToFinishRefreshTime * 1000));
                }
            }
            if (downloadBuildArtifacts) {
                console.log(`Downloading build artifacts to ${dropDirectory}`);
                for (let buildId of queuedBuildIds) {
                    yield tfsRestService.downloadArtifacts(buildId, dropDirectory);
                }
            }
        }
    });
}
function writeVariable(triggeredBuilds) {
    if (storeInVariable) {
        console.log(`Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`);
        var previousValue = taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
        if (previousValue !== undefined) {
            // concatenate variable values
            console.log(`Following value is already stored in the variable: '${previousValue}'`);
            triggeredBuilds.splice(0, 0, previousValue);
        }
        taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, triggeredBuilds.join(","));
        console.log(`New Value of variable: '${taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)}'`);
    }
}
function triggerBuilds() {
    return __awaiter(this, void 0, void 0, function* () {
        var queuedBuildIds = new Array();
        for (let build of buildDefinitionsToTrigger) {
            var queuedBuildId = yield tfsRestService.triggerBuild(build.trim(), branchToUse, requestedForBody, sourceVersionBody, demands, queueid, buildParameters);
            queuedBuildIds.push(queuedBuildId);
            console.log(`Queued new Build for definition ${build}: ${tfsServer}/_build/index?buildId=${queuedBuildId}`);
        }
        return queuedBuildIds;
    });
}
function checkConditions() {
    return __awaiter(this, void 0, void 0, function* () {
        if (enableBuildInQueueCondition) {
            console.log("Checking if blocking builds are queued");
            for (let blockingBuild of blockingBuilds) {
                console.log(`Checking build ${blockingBuild}`);
                let queuedBuilds = yield tfsRestService.getBuildsByStatus(blockingBuild, `${taskConstants.BuildStateNotStarted}`);
                if (queuedBuilds.length > 0) {
                    console.log(`${blockingBuild} is queued - will not trigger new build.`);
                    return false;
                }
            }
            ;
            console.log("None of the blocking builds is queued - proceeding");
        }
        if (dependentOnSuccessfulBuildCondition) {
            console.log("Checking if dependant build definitions last builds were successful");
            for (let element of dependentBuildsList) {
                console.log(`Checking build ${element}`);
                let lastBuilds = (yield tfsRestService.getBuildsByStatus(element, ""));
                if (lastBuilds.length > 0 && lastBuilds[0].result !== taskConstants.BuildResultSucceeded) {
                    console.log(`Last build of definition ${element} was not successful
                    (state is ${lastBuilds[0].result}) - will not trigger new build`);
                    return false;
                }
            }
            ;
            console.log("None of the dependant build definitions last builds were failing - proceeding");
        }
        if (dependentOnFailedBuildCondition) {
            console.log("Checking if dependant build definitions last builds were NOT successful");
            for (let build of dependentFailingBuildsList) {
                let lastBuilds = (yield tfsRestService.getBuildsByStatus(build, ""));
                if (lastBuilds.length > 0 && lastBuilds[0].result === taskConstants.BuildResultSucceeded) {
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
function parseInputs() {
    if (definitionIsInCurrentTeamProject) {
        console.log("Using current Team Project Url");
        tfsServer = `${process.env[tfsConstants.TeamFoundationCollectionUri]}${process.env[tfsConstants.TeamProject]}`;
    }
    else {
        console.log("Using Custom Team Project Url");
    }
    console.log("Path to Server: " + tfsServer);
    tfsRestService.initialize(authenticationMethod, username, password, tfsServer, ignoreSslCertificateErrors);
    if (queueBuildForUserThatTriggeredBuild) {
        let user = `${process.env[tfsConstants.RequestedForUsername]}`;
        let userId = `${process.env[tfsConstants.RequestedForUserId]}`;
        console.log(`Build shall be triggered for same user that triggered current build: ${user}`);
        requestedForBody = `requestedFor: { id: \"${userId}\"}`;
    }
    if (useSameSourceVersion) {
        let sourceVersion = `${process.env[tfsConstants.SourceVersion]}`;
        let repositoryType = `${process.env[tfsConstants.RepositoryType]}`;
        console.log(`Source Version: ${sourceVersion}`);
        // if we use a TFS Repository, we need to specify a "C" before the changeset...it is usually set by default, except
        // if we use the latest version, the source version will not have a C prepended, so we have to do that manually...
        // in case it starts with an L it means it's a label and its fine.
        // shelvesets are prepended with a C as well, so the logic still holds
        if (!sourceVersion.startsWith("C") && !sourceVersion.startsWith("L") && repositoryType === tfsConstants.TfsRepositoryType) {
            sourceVersion = `C${sourceVersion}`;
        }
        console.log(`Triggered Build will use the same source version: ${sourceVersion}`);
        sourceVersionBody = `sourceVersion: \"${sourceVersion}\"`;
    }
    if (useSameBranch) {
        branchToUse = `${process.env[tfsConstants.SourceBranch]}`;
        console.log(`Using same branch as source version: ${branchToUse}`);
    }
    if (demands != null) {
        var parsedDemands = [];
        demands.forEach(demand => {
            parsedDemands.push(demand.replace("=", " -equals "));
        });
        demands = parsedDemands;
        console.log(`Will trigger build with following demands:`);
        demands.forEach(demand => console.log(demand));
    }
    if (queueid !== undefined) {
        console.log(`Will trigger build in following agent queue: ${queueid}`);
    }
    if (buildParameters !== null) {
        console.log(`Will trigger build with following parameters: ${buildParameters}`);
    }
    if (enableBuildInQueueCondition) {
        console.log("Build in Queue Condition is enabled");
        if (includeCurrentBuildDefinition) {
            let currentBuildDefinition = `${process.env[tfsConstants.CurrentBuildDefinition]}`;
            console.log("Current Build Definition shall be included");
            blockingBuilds.push(currentBuildDefinition);
        }
        console.log("Following builds are blocking:");
        blockingBuilds.forEach(blockingBuild => {
            console.log(`${blockingBuild}`);
        });
    }
    if (dependentOnSuccessfulBuildCondition) {
        console.log("Dependant Build Condition is enabled - Following builds are checked:");
        dependentBuildsList.forEach(element => {
            console.log(`${element}`);
        });
    }
    if (dependentOnFailedBuildCondition) {
        console.log("Dependant Failing Build Condition is enabled - Following builds are checked:");
        dependentFailingBuildsList.forEach(dependantBuild => {
            console.log(`${dependantBuild}`);
        });
    }
}
/// Fetch all the inputs and set them to the variables to be used within the script.
function getInputs() {
    // basic Configuration
    definitionIsInCurrentTeamProject = taskLibrary.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true);
    tfsServer = common.trimValue(taskLibrary.getInput(taskConstants.ServerUrlInput, false));
    buildDefinitionsToTrigger = common.trimValues(taskLibrary.getDelimitedInput(taskConstants.BuildDefinitionsToTriggerInput, ",", true));
    ignoreSslCertificateErrors = taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);
    // advanced Configuration
    queueBuildForUserThatTriggeredBuild = taskLibrary.getBoolInput(taskConstants.QueueBuildForUserInput, true);
    useSameSourceVersion = taskLibrary.getBoolInput(taskConstants.UseSameSourceVersionInput, true);
    useSameBranch = taskLibrary.getBoolInput(taskConstants.UseSameBranchInput, true);
    branchToUse = common.trimValue(taskLibrary.getInput(taskConstants.BranchToUseInput, false));
    waitForQueuedBuildsToFinish = taskLibrary.getBoolInput(taskConstants.WaitForBuildsToFinishInput, true);
    waitForQueuedBuildsToFinishRefreshTime = parseInt(taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
    failTaskIfBuildsNotSuccessful = taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);
    if (failTaskIfBuildsNotSuccessful) {
        downloadBuildArtifacts = taskLibrary.getBoolInput(taskConstants.DownloadBuildArtifacts, true);
    }
    else {
        downloadBuildArtifacts = false;
    }
    dropDirectory = common.trimValue(taskLibrary.getInput(taskConstants.DropDirectory, false));
    storeInVariable = taskLibrary.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true);
    demands = common.trimValues(taskLibrary.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false));
    var queueIdAsString = taskLibrary.getInput(taskConstants.QueueID, false);
    if (queueIdAsString !== null && queueIdAsString !== "" && queueIdAsString !== undefined) {
        queueid = parseInt(queueIdAsString, 10);
    }
    buildParameters = common.trimValue(taskLibrary.getInput(taskConstants.BuildParametersInput, false));
    // authentication
    authenticationMethod = taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
    username = taskLibrary.getInput(taskConstants.UsernameInput, false);
    password = taskLibrary.getInput(taskConstants.PasswordInput, false);
    // conditions
    enableBuildInQueueCondition = taskLibrary.getBoolInput(taskConstants.EnableBuildInQueueConditionInput, true);
    includeCurrentBuildDefinition = taskLibrary.getBoolInput(taskConstants.IncludeCurrentBuildDefinitionInput, false);
    blockingBuilds = common.trimValues(taskLibrary.getDelimitedInput(taskConstants.BlockingBuildsInput, ",", false));
    dependentOnSuccessfulBuildCondition = taskLibrary.getBoolInput(taskConstants.DependentOnSuccessfulBuildConditionInput, true);
    dependentBuildsList = common.trimValues(taskLibrary.getDelimitedInput(taskConstants.DependentOnSuccessfulBuildsInput, ",", false));
    dependentOnFailedBuildCondition = taskLibrary.getBoolInput(taskConstants.DependentOnFailedBuildConditionInput, true);
    dependentFailingBuildsList = common.trimValues(taskLibrary.getDelimitedInput(taskConstants.DependentOnFailedBuildsInput, ",", false));
}
run();
