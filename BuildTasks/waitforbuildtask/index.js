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
const tfsRestService = require("../triggerBuildTask/tfsrestservice");
const tfsConstants = require("../triggerBuildTask/tfsconstants");
const taskConstants = require("../triggerBuildTask/taskconstants");
let definitionIsInCurrentTeamProject;
let tfsServer;
let triggeredBuilds;
let waitForQueuedBuildsToFinishRefreshTime;
let failTaskIfBuildsNotSuccessful;
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
function sleep(ms) {
    console.log(`Sleeping for ${ms} of miliseconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}
function waitForBuildsToFinish(queuedBuildIds) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`
         Will wait for queued build to be finished - Refresh time is set to ${waitForQueuedBuildsToFinishRefreshTime} seconds`);
        var areBuildsFinished = false;
        while (!areBuildsFinished) {
            areBuildsFinished = yield areTriggeredBuildsFinished(queuedBuildIds);
            yield sleep((waitForQueuedBuildsToFinishRefreshTime * 1000));
        }
    });
}
function areTriggeredBuildsFinished(triggeredBuilds) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let queuedBuildId of triggeredBuilds) {
            var buildFinished = yield tfsRestService.isBuildFinished(queuedBuildId);
            if (!buildFinished) {
                console.log(`Build ${queuedBuildId} is not yet completed`);
                return false;
            }
            else {
                console.log(`Build ${queuedBuildId} has completed`);
                var buildSuccessful = yield tfsRestService.wasBuildSuccessful(queuedBuildId);
                if (failTaskIfBuildsNotSuccessful && !buildSuccessful) {
                    throw new Error(`Build ${queuedBuildId} was not successful - failing task.`);
                }
            }
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
    tfsRestService.initialize(authenticationMethod, username, password, tfsServer);
}
/// Fetch all the inputs and set them to the variables to be used within the script.
function getInputs() {
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
