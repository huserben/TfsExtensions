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
        this.treatPartiallySucceededBuildAsSuccessful = false;
        this.tfsRestService = tfsRestService;
        this.taskLibrary = taskLibrary;
        this.generalFunctions = generalFunctions;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.getInputs();
                this.parseInputs();
                yield this.waitForBuildsToFinish(this.triggeredBuilds);
            }
            catch (err) {
                this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
            }
        });
    }
    waitForBuildsToFinish(queuedBuildIds) {
        return __awaiter(this, void 0, void 0, function* () {
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
            if (this.clearVariable === true) {
                console.log("Clearing TriggeredBuildIds Variable...");
                this.taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, "");
            }
        });
    }
    parseInputs() {
        if (this.definitionIsInCurrentTeamProject) {
            console.log("Using current Team Project Url");
            this.tfsServer = `${process.env[tfsService.TeamFoundationCollectionUri]}${process.env[tfsService.TeamProject]}`;
        }
        else {
            console.log("Using Custom Team Project Url");
            this.tfsServer = decodeURI(this.tfsServer);
        }
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
        this.ignoreSslCertificateErrors = this.taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);
        // authentication
        this.authenticationMethod = this.taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
        this.username = this.taskLibrary.getInput(taskConstants.UsernameInput, false);
        this.password = this.taskLibrary.getInput(taskConstants.PasswordInput, false);
        // task configuration
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
        this.clearVariable = this.taskLibrary.getBoolInput(taskConstants.ClearVariable, true);
        var storedBuildInfo = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
        if (storedBuildInfo === undefined) {
            throw Error(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" 
            // under Advanced Configuration for all the Triggered Builds you want to await.`);
        }
        this.triggeredBuilds = storedBuildInfo.split(",");
        console.log(`Following Builds are awaited: ${this.triggeredBuilds}`);
    }
}
exports.TaskRunner = TaskRunner;
//# sourceMappingURL=taskrunner.js.map