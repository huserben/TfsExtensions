import taskLibrary = require("vsts-task-lib/task");
import tfsRestService = require("../triggerBuildTask/tfsrestservice");
import tfsConstants = require("../triggerBuildTask/tfsconstants");
import taskConstants = require("../triggerBuildTask/taskconstants");

let definitionIsInCurrentTeamProject: boolean;
let tfsServer: string;
let triggeredBuilds : string[];
let waitForQueuedBuildsToFinishRefreshTime: number;
let failTaskIfBuildsNotSuccessful: boolean;
let authenticationMethod: string;
let username: string;
let password: string;

async function run(): Promise<void> {
    try {
        getInputs();
        parseInputs();

        await waitForBuildsToFinish(triggeredBuilds);
    } catch (err) {
        taskLibrary.setResult(taskLibrary.TaskResult.Failed, err.message);
    }
}

function sleep(ms: number): Promise<void> {
    console.log(`Sleeping for ${ms} of miliseconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForBuildsToFinish(queuedBuildIds: string[]): Promise<void> {
         console.log(`
         Will wait for queued build to be finished - Refresh time is set to ${waitForQueuedBuildsToFinishRefreshTime} seconds`);

        var areBuildsFinished: boolean = false;
        while (!areBuildsFinished) {
            areBuildsFinished = await areTriggeredBuildsFinished(queuedBuildIds);
            await sleep((waitForQueuedBuildsToFinishRefreshTime * 1000));
        }
}

async function areTriggeredBuildsFinished(triggeredBuilds: string[]): Promise<boolean> {

    for (let queuedBuildId of triggeredBuilds) {
        var buildFinished: boolean = await tfsRestService.isBuildFinished(queuedBuildId);

        if (!buildFinished) {
            console.log(`Build ${queuedBuildId} is not yet completed`);
            return false;
        } else {
            console.log(`Build ${queuedBuildId} has completed`);
            var buildSuccessful: boolean = await tfsRestService.wasBuildSuccessful(queuedBuildId);

            if (failTaskIfBuildsNotSuccessful && !buildSuccessful) {
                throw new Error(`Build ${queuedBuildId} was not successful - failing task.`);
            }
        }
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

    tfsRestService.initialize(authenticationMethod, username, password, tfsServer);

}

/// Fetch all the inputs and set them to the variables to be used within the script.
function getInputs(): void {
    // basic Configuration
    definitionIsInCurrentTeamProject = taskLibrary.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true);
    tfsServer = taskLibrary.getInput(taskConstants.ServerUrlInput, false);

    // authentication
    authenticationMethod = taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
    username = taskLibrary.getInput(taskConstants.UsernameInput, false);
    password = taskLibrary.getInput(taskConstants.PasswordInput, false);


    // task configuration
    waitForQueuedBuildsToFinishRefreshTime = parseInt(taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
    failTaskIfBuildsNotSuccessful = taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);

    triggeredBuilds = taskLibrary.getDelimitedInput(taskConstants.TriggeredBuildIdsEnvironmentVariableName, ",", true);
}

run();