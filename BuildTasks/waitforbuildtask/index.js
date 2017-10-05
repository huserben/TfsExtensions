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
let ignoreSslCertificateErrors;
let triggeredBuilds;
let waitForQueuedBuildsToFinishRefreshTime;
let failTaskIfBuildsNotSuccessful;
let downloadBuildArtifacts;
let dropDirectory;
let authenticationMethod;
let username;
let password;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            getInputs();
            parseInputs();
            yield waitForBuildsToFinish(triggeredBuilds);
        }
        catch (err) {
            taskLibrary.setResult(taskLibrary.TaskResult.Failed, err.message);
        }
    });
}
function waitForBuildsToFinish(queuedBuildIds) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`
         Will wait for queued build to be finished - Refresh time is set to ${waitForQueuedBuildsToFinishRefreshTime} seconds`);
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
}
/// Fetch all the inputs and set them to the variables to be used within the script.
function getInputs() {
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
    }
    else {
        downloadBuildArtifacts = false;
    }
    dropDirectory = common.trimValue(taskLibrary.getInput(taskConstants.DropDirectory, false));
    var tasksToTrigger = taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
    if (tasksToTrigger === undefined) {
        throw Error(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" under
        Advanced Configuration for all the Triggered Builds you want to await.`);
    }
    triggeredBuilds = tasksToTrigger.split(",");
    console.log(`Following Builds are awaited: {triggeredBuilds}`);
}
run();
