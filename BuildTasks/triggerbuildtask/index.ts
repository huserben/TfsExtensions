import taskLibrary = require("vsts-task-lib/task");
import tfsRestService = require("./tfsrestservice");
import tfsConstants = require("./tfsconstants");
import taskConstants = require("./taskconstants");
import common = require("./generalfunctions");

let definitionIsInCurrentTeamProject: boolean;
let tfsServer: string;
let buildDefinitionsToTrigger: string[];
let queueBuildForUserThatTriggeredBuild: boolean;
let useSameSourceVersion: boolean;
let useSameBranch: boolean;
let branchToUse: string;
let waitForQueuedBuildsToFinish: boolean;
let waitForQueuedBuildsToFinishRefreshTime: number;
let failTaskIfBuildsNotSuccessful: boolean;
let downloadBuildArtifacts: boolean;
let dropDirectory: string;
let storeInVariable: boolean;
let demands : string[];
let queueid : number;
let buildParameters: string;
let ignoreSslCertificateErrors: boolean;
let authenticationMethod: string;
let username: string;
let password: string;
let enableBuildInQueueCondition: boolean;
let includeCurrentBuildDefinition: boolean;
let blockingBuilds: string[];
let dependentOnSuccessfulBuildCondition: boolean;
let dependentBuildsList: string[];
let dependentOnFailedBuildCondition: boolean;
let dependentFailingBuildsList: string[];

let requestedForBody: string;
let sourceVersionBody: string;

async function run(): Promise<void> {
    try {
        getInputs();
        parseInputs();

        var conditionsFulfilled: boolean = await checkConditions();
        if (conditionsFulfilled) {
            var triggeredBuilds: string[] = await triggerBuilds();
            writeVariable(triggeredBuilds);
            await waitForBuildsToFinish(triggeredBuilds);
        }
    } catch (err) {
        taskLibrary.setResult(taskLibrary.TaskResult.Failed, err.message);
    }
}

async function waitForBuildsToFinish(queuedBuildIds: string[]): Promise<void> {
    if (waitForQueuedBuildsToFinish) {
        console.log(`Will wait for queued build to be finished - Refresh time is set to ${waitForQueuedBuildsToFinishRefreshTime} seconds`);

        var areBuildsFinished: boolean = false;
        while (!areBuildsFinished) {
            areBuildsFinished = await tfsRestService.waitForBuildsToFinish(queuedBuildIds, failTaskIfBuildsNotSuccessful);

            if (!areBuildsFinished) {
                await common.sleep((waitForQueuedBuildsToFinishRefreshTime * 1000));
            }
        }

        if (downloadBuildArtifacts) {
            console.log(`Downloading build artifacts to ${dropDirectory}`);
            for (let buildId of queuedBuildIds) {
                await tfsRestService.downloadArtifacts(buildId, dropDirectory);
            }
        }
    }
}

function writeVariable(triggeredBuilds: string[]): void {
    if (storeInVariable) {
        console.log(`Storing triggered build id's in variable '${taskConstants.TriggeredBuildIdsEnvironmentVariableName}'`);
        var previousValue: string = taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);

        if (previousValue !== undefined) {
            // concatenate variable values
            console.log(`Following value is already stored in the variable: '${previousValue}'`);

            triggeredBuilds.splice(0, 0, previousValue);
        }

        taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, triggeredBuilds.join(","));
        console.log(`New Value of variable: '${taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName)}'`);
    }
}

async function triggerBuilds(): Promise<string[]> {
    var queuedBuildIds: string[] = new Array();

    for (let build of buildDefinitionsToTrigger) {
        var queuedBuildId: string =
            await tfsRestService.triggerBuild(
                build.trim(), branchToUse, requestedForBody, sourceVersionBody, demands, queueid, buildParameters);

        queuedBuildIds.push(queuedBuildId);

        console.log(`Queued new Build for definition ${build}: ${tfsServer}/_build/index?buildId=${queuedBuildId}`);
    }

    return queuedBuildIds;
}

async function checkConditions(): Promise<boolean> {
    if (enableBuildInQueueCondition) {
        console.log("Checking if blocking builds are queued");

        for (let blockingBuild of blockingBuilds) {
            console.log(`Checking build ${blockingBuild}`);
            let queuedBuilds: tfsRestService.IBuild[]
                = await tfsRestService.getBuildsByStatus(
                    blockingBuild,
                    `${taskConstants.BuildStateNotStarted}`);

            if (queuedBuilds.length > 0) {
                console.log(`${blockingBuild} is queued - will not trigger new build.`);

                return false;
            }
        };

        console.log("None of the blocking builds is queued - proceeding");
    }

    if (dependentOnSuccessfulBuildCondition) {
        console.log("Checking if dependant build definitions last builds were successful");

        for (let element of dependentBuildsList) {
            console.log(`Checking build ${element}`);

            let lastBuilds: tfsRestService.IBuild[] = (await tfsRestService.getBuildsByStatus(element, ""));

            if (lastBuilds.length > 0 && lastBuilds[0].result !== taskConstants.BuildResultSucceeded) {
                console.log(
                    `Last build of definition ${element} was not successful
                    (state is ${lastBuilds[0].result}) - will not trigger new build`);
                return false;
            }
        };

        console.log("None of the dependant build definitions last builds were failing - proceeding");
    }

    if (dependentOnFailedBuildCondition) {
        console.log("Checking if dependant build definitions last builds were NOT successful");

        for (let build of dependentFailingBuildsList) {
            let lastBuilds: tfsRestService.IBuild[] = (await tfsRestService.getBuildsByStatus(build, ""));

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

function parseInputs(): void {
    if (definitionIsInCurrentTeamProject) {
        console.log("Using current Team Project Url");
        tfsServer = `${process.env[tfsConstants.TeamFoundationCollectionUri]}${process.env[tfsConstants.TeamProject]}`;
    } else {
        console.log("Using Custom Team Project Url");
    }
    console.log("Path to Server: " + tfsServer);

    tfsRestService.initialize(authenticationMethod, username, password, tfsServer, ignoreSslCertificateErrors);

    if (queueBuildForUserThatTriggeredBuild) {
        let user: string = `${process.env[tfsConstants.RequestedForUsername]}`;
        let userId: string = `${process.env[tfsConstants.RequestedForUserId]}`;
        console.log(`Build shall be triggered for same user that triggered current build: ${user}`);

        requestedForBody = `requestedFor: { id: \"${userId}\"}`;
    }

    if (useSameSourceVersion) {
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
        sourceVersionBody = `sourceVersion: \"${sourceVersion}\"`;
    }

    if (useSameBranch) {
        branchToUse = `${process.env[tfsConstants.SourceBranch]}`;
        console.log(`Using same branch as source version: ${branchToUse}`);
    }

    if (demands != null) {
        var parsedDemands : string[] = [];

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
            let currentBuildDefinition: string = `${process.env[tfsConstants.CurrentBuildDefinition]}`;
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
function getInputs(): void {
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
    } else {
        downloadBuildArtifacts = false;
    }

    dropDirectory = common.trimValue(taskLibrary.getInput(taskConstants.DropDirectory, false));

    storeInVariable = taskLibrary.getBoolInput(taskConstants.StoreInEnvironmentVariableInput, true);
    demands = common.trimValues(taskLibrary.getDelimitedInput(taskConstants.DemandsVariableInput, ",", false));

    var queueIdAsString : string = taskLibrary.getInput(taskConstants.QueueID, false);
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