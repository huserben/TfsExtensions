import taskLibrary = require("vsts-task-lib/task");
import tfsRestService = require("./tfsrestservice");
import tfsConstants = require("./tfsconstants");
import taskConstants = require("./taskconstants");
import common = require("./generalfunctions");

let definitionIsInCurrentTeamProject: boolean;
let tfsServer: string;
let ignoreSslCertificateErrors: boolean;
let triggeredBuilds: string[];
let waitForQueuedBuildsToFinishRefreshTime: number;
let failTaskIfBuildsNotSuccessful: boolean;
let downloadBuildArtifacts: boolean;
let dropDirectory: string;
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

async function waitForBuildsToFinish(queuedBuildIds: string[]): Promise<void> {
    console.log(`
         Will wait for queued build to be finished - Refresh time is set to ${waitForQueuedBuildsToFinishRefreshTime} seconds`);

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

function parseInputs(): void {
    if (definitionIsInCurrentTeamProject) {
        console.log("Using current Team Project Url");
        tfsServer = `${process.env[tfsConstants.TeamFoundationCollectionUri]}${process.env[tfsConstants.TeamProject]}`;
    } else {
        console.log("Using Custom Team Project Url");
    }
    console.log("Path to Server: " + tfsServer);

    tfsRestService.initialize(authenticationMethod, username, password, tfsServer, ignoreSslCertificateErrors);

}

/// Fetch all the inputs and set them to the variables to be used within the script.
function getInputs(): void {
    // basic Configuration
    definitionIsInCurrentTeamProject = taskLibrary.getBoolInput(taskConstants.DefininitionIsInCurrentTeamProjectInput, true);
    tfsServer = common.trimValue(taskLibrary.getInput(taskConstants.ServerUrlInput, false));
    ignoreSslCertificateErrors = taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);

    // authentication
    authenticationMethod = taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
    username = taskLibrary.getInput(taskConstants.UsernameInput, false);
    password = taskLibrary.getInput(taskConstants.PasswordInput, false);


    // task configuration
    waitForQueuedBuildsToFinishRefreshTime = parseInt(taskLibrary.getInput(taskConstants.WaitForBuildsToFinishRefreshTimeInput, true), 10);
    failTaskIfBuildsNotSuccessful = taskLibrary.getBoolInput(taskConstants.FailTaskIfBuildNotSuccessfulInput, true);

    if (failTaskIfBuildsNotSuccessful) {
        downloadBuildArtifacts = taskLibrary.getBoolInput(taskConstants.DownloadBuildArtifacts, true);
    } else {
        downloadBuildArtifacts = false;
    }

    dropDirectory = common.trimValue(taskLibrary.getInput(taskConstants.DropDirectory, false));

    triggeredBuilds = taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName).split(",");
    console.log(`Following Builds are awaited: {triggeredBuilds}`);
}

run();