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
        this.triggeredBuilds = [];
        this.tfsRestService = tfsRestService;
        this.taskLibrary = taskLibrary;
        this.generalFunctions = generalFunctions;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.getInputs();
                yield this.parseInputs();
                if (this.triggeredBuilds.length === 0) {
                    console.log(`No build id's found to wait for. Make sure you enabled \"Store Build IDs in Variable\" 
                    // under Advanced Configuration for all the Triggered Builds you want to await.`);
                    return;
                }
                yield this.cancelBuilds(this.triggeredBuilds);
            }
            catch (err) {
                this.taskLibrary.setResult(tl.TaskResult.Failed, err.message);
            }
        });
    }
    cancelBuilds(queuedBuildIds) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let buildId of queuedBuildIds) {
                var buildInfo = yield this.tfsRestService.getBuildInfo(buildId);
                // TODO: Write test for this
                if (buildInfo === undefined) {
                    console.log(`No Build with ID ${buildId} found - skipping`);
                    continue;
                }
                console.log(`Cancelling Build ${buildId} (${buildInfo.definition.name}): ${buildInfo._links.web.href.trim()}`);
                yield this.tfsRestService.cancelBuild(buildId);
                yield this.generalFunctions.sleep(200);
            }
            if (this.clearVariable === true) {
                console.log("Clearing TriggeredBuildIds Variable...");
                this.taskLibrary.setVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName, "");
            }
        });
    }
    parseInputs() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.definitionIsInCurrentTeamProject) {
                console.log("Using current Team Project Url");
                this.tfsServer = `${process.env[tfsService.TeamFoundationCollectionUri]}`;
                this.teamProject = `${process.env[tfsService.TeamProject]}`;
            }
            else {
                console.log("Using Custom Team Project Url");
            }
            /* we decode here because the web request library handles the encoding of the uri.
             * otherwise we get double-encoded urls which cause problems. */
            this.tfsServer = decodeURI(this.tfsServer);
            console.log("Server URL: " + this.tfsServer);
            console.log("Team Project: " + this.teamProject);
            if (this.authenticationMethod === tfsService.AuthenticationMethodOAuthToken &&
                (this.password === null || this.password === "")) {
                console.log("Trying to fetch authentication token from system...");
                this.password = `${process.env[tfsService.OAuthAccessToken]}`;
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
        this.ignoreSslCertificateErrors = this.taskLibrary.getBoolInput(taskConstants.IgnoreSslCertificateErrorsInput, true);
        this.clearVariable = this.taskLibrary.getBoolInput(taskConstants.ClearVariable, true);
        // authentication
        this.authenticationMethod = this.taskLibrary.getInput(taskConstants.AuthenticationMethodInput, true);
        this.username = this.taskLibrary.getInput(taskConstants.UsernameInput, false);
        this.password = this.taskLibrary.getInput(taskConstants.PasswordInput, false);
        var storedBuildInfo = this.taskLibrary.getVariable(taskConstants.TriggeredBuildIdsEnvironmentVariableName);
        if (storedBuildInfo === undefined) {
            storedBuildInfo = "";
        }
        for (let storedBuildId of storedBuildInfo.split(",")) {
            // TODO: Unit Test
            if (isNaN(Number(storedBuildId))) {
                console.log(`Value ${storedBuildId} is not a valid build id - skipping.`);
            }
            else {
                this.triggeredBuilds.push(Number.parseInt(storedBuildId));
            }
        }
        console.log(`Following Builds are awaited: ${this.triggeredBuilds}`);
    }
}
exports.TaskRunner = TaskRunner;
//# sourceMappingURL=taskrunner.js.map