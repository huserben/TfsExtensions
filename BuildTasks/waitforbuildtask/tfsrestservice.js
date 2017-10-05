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
const WebRequest = require("web-request");
const fs = require("fs");
const url = require("url");
const tfsConstants = require("./tfsconstants");
const taskConstants = require("./taskconstants");
let options;
function initialize(authenticationMethod, username, password, tfsServer, ignoreSslError) {
    var baseUrl = `${encodeURI(tfsServer)}/${taskConstants.ApiUrl}/`;
    if (authenticationMethod === taskConstants.AuthenticationMethodDefaultCredentials) {
        console.warn("Default Credentials are not supported anymore - will try to use OAuth Token- Please change your configuration");
        console.warn("Make sure Options-Allow Access To OAuth Token is enabled for your build definition.");
        authenticationMethod = taskConstants.AuthenticationMethodOAuthToken;
        password = "";
    }
    switch (authenticationMethod) {
        case taskConstants.AuthenticationMethodOAuthToken:
            console.log("Using OAuth Access Token");
            var authenticationToken;
            if (password === null || password === "") {
                console.log("Trying to fetch authentication token from system...");
                authenticationToken = `${process.env[tfsConstants.OAuthAccessToken]}`;
            }
            else {
                authenticationToken = password;
            }
            options = {
                baseUrl: baseUrl, auth: {
                    bearer: authenticationToken
                }
            };
            break;
        case taskConstants.AuthenticationMethodBasicAuthentication:
            console.log("Using Basic Authentication");
            options = {
                baseUrl: baseUrl, auth: {
                    user: username,
                    password: password
                }
            };
            break;
        case taskConstants.AuthenticationMethodPersonalAccessToken:
            console.log("Using Personal Access Token");
            options = {
                baseUrl: baseUrl,
                auth: {
                    user: "whatever",
                    password: password
                }
            };
            break;
        default:
            throw new Error("Cannot handle authentication method " + authenticationMethod);
    }
    options.headers = {
        "Content-Type": "application/json"
    };
    options.agentOptions = { rejectUnauthorized: !ignoreSslError };
    options.encoding = "utf-8";
}
exports.initialize = initialize;
function getBuildsByStatus(buildDefinitionName, statusFilter) {
    return __awaiter(this, void 0, void 0, function* () {
        var buildDefinitionID = yield getBuildDefinitionId(buildDefinitionName);
        var requestUrl = `build/builds?api-version=2.0&definitions=${buildDefinitionID}&statusFilter=${statusFilter}`;
        var result = yield WebRequest.json(requestUrl, options);
        return result.value;
    });
}
exports.getBuildsByStatus = getBuildsByStatus;
function triggerBuild(buildDefinitionName, branch, requestedFor, sourceVersion, demands, queueId, buildParameters) {
    return __awaiter(this, void 0, void 0, function* () {
        var buildId = yield getBuildDefinitionId(buildDefinitionName);
        var queueBuildUrl = "build/builds?api-version=2.0";
        var queueBuildBody = `{ definition: { id: ${buildId} }`;
        if (branch !== null) {
            queueBuildBody += `, sourceBranch: \"${branch}\"`;
        }
        if (requestedFor !== undefined) {
            queueBuildBody += `, ${requestedFor}`;
        }
        if (sourceVersion !== undefined) {
            queueBuildBody += `, ${sourceVersion}`;
        }
        if (queueId !== null && queueId !== undefined) {
            queueBuildBody += `, queue: { id: ${queueId}}`;
        }
        if (demands !== null) {
            queueBuildBody += `, demands: [`;
            demands.forEach(demand => queueBuildBody += `\"${demand}\",`);
            queueBuildBody += `]`;
        }
        if (buildParameters !== null) {
            queueBuildBody += `, parameters: \"{${buildParameters}}\"`;
        }
        queueBuildBody += "}";
        console.log(`Queue new Build for definition ${buildDefinitionName}`);
        var result = yield WebRequest.post(queueBuildUrl, options, queueBuildBody);
        var resultAsJson = JSON.parse(result.content);
        var triggeredBuildID = resultAsJson.id;
        // if we are not able to fetch the expected JSON it means something went wrong and we got back some exception from TFS.
        if (triggeredBuildID === undefined) {
            handleValidationError(resultAsJson);
        }
        return triggeredBuildID;
    });
}
exports.triggerBuild = triggerBuild;
function waitForBuildsToFinish(triggeredBuilds, failIfNotSuccessful) {
    return __awaiter(this, void 0, void 0, function* () {
        var result = true;
        for (let queuedBuildId of triggeredBuilds) {
            var buildFinished = yield isBuildFinished(queuedBuildId);
            if (!buildFinished) {
                console.log(`Build ${queuedBuildId} has not yet completed`);
                result = false;
            }
            else {
                result = result && true;
                console.log(`Build ${queuedBuildId} has completed`);
                var buildSuccessful = yield wasBuildSuccessful(queuedBuildId);
                if (failIfNotSuccessful && !buildSuccessful) {
                    throw new Error(`Build ${queuedBuildId} was not successful - failing task.`);
                }
            }
        }
        return result;
    });
}
exports.waitForBuildsToFinish = waitForBuildsToFinish;
function downloadArtifacts(buildId, downloadDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Downloading artifacts for ${buildId}`);
        if (!fs.existsSync(downloadDirectory)) {
            console.log(`Directory ${downloadDirectory} does not exist - will be created`);
            fs.mkdirSync(downloadDirectory);
        }
        if (!downloadDirectory.endsWith("\\")) {
            downloadDirectory += "\\";
        }
        var requestUrl = `build/builds/${buildId}/artifacts`;
        var result = yield WebRequest.json(requestUrl, options);
        if (result.count === undefined) {
            console.log(`No artifacts found for build ${buildId} - skipping...`);
        }
        console.log(`Found ${result.count} artifact(s)`);
        for (let artifact of result.value) {
            console.log(`Downloading artifact ${artifact.name}...`);
            var fileFormat = url.parse(artifact.resource.downloadUrl, true).query.$format;
            // if for whatever reason we cannot get the file format from the url just try with zip.
            if (fileFormat === null || fileFormat === undefined) {
                fileFormat = "zip";
            }
            var fileName = `${artifact.name}.${fileFormat}`;
            var index = 1;
            while (fs.existsSync(`${downloadDirectory}${fileName}`)) {
                console.log(`${fileName} already exists...`);
                fileName = `${artifact.name}${index}.${fileFormat}`;
                index++;
            }
            options.baseUrl = "";
            options.headers = {
                "Content-Type": `application/${fileFormat}`
            };
            options.encoding = null;
            var request = yield WebRequest.stream(artifact.resource.downloadUrl, options);
            yield request.pipe(fs.createWriteStream(downloadDirectory + fileName));
            console.log(`Stored artifact here: ${downloadDirectory}${fileName}`);
        }
    });
}
exports.downloadArtifacts = downloadArtifacts;
function getQueueIdByName(buildQueue) {
    return __awaiter(this, void 0, void 0, function* () {
        var requestUrl = `distributedtask/queues`;
        var result = yield WebRequest.json(requestUrl, options);
        throwIfAuthenticationError(result);
        for (let queue of result.value) {
            if (queue.name.toLowerCase() === buildQueue.toLowerCase()) {
                return queue.id;
            }
        }
        console.error(`No queue found with the name: ${buildQueue}. Following Queues were found (Name (id)):`);
        for (let queue of result.value) {
            console.error(`${queue.name} (${queue.id})`);
        }
        throw new Error(`Could not find any Queue with the name ${buildQueue}`);
    });
}
exports.getQueueIdByName = getQueueIdByName;
function isBuildFinished(buildId) {
    return __awaiter(this, void 0, void 0, function* () {
        var requestUrl = `build/builds/${buildId}?api-version=2.0`;
        var result = yield WebRequest.json(requestUrl, options);
        return result.status === taskConstants.BuildStateCompleted;
    });
}
function wasBuildSuccessful(buildId) {
    return __awaiter(this, void 0, void 0, function* () {
        var requestUrl = `build/builds/${buildId}?api-version=2.0`;
        var result = yield WebRequest.json(requestUrl, options);
        return result.result === taskConstants.BuildResultSucceeded;
    });
}
function getBuildDefinitionId(buildDefinitionName) {
    return __awaiter(this, void 0, void 0, function* () {
        var requestUrl = `build/definitions?api-version=2.0&name=${encodeURIComponent(buildDefinitionName)}`;
        var result = yield WebRequest.json(requestUrl, options);
        throwIfAuthenticationError(result);
        if (result.count === 0) {
            throw new Error(`Did not find any build definition with this name: ${buildDefinitionName}
        - checked following url: ${options.baseUrl}${requestUrl}`);
        }
        return result.value[0].id;
    });
}
function handleValidationError(resultAsJson) {
    var validationResults = resultAsJson.ValidationResults;
    if (validationResults === undefined) {
        // in case something else failed try fetch just a message:
        var errorMessage = resultAsJson.message;
        if (errorMessage !== undefined) {
            console.error(errorMessage);
        }
        else {
            console.error("Unknown error - printing complete return value from server.");
            console.error(`Consider raising an issue at github if problem cannot be solved:
            https://github.com/huserben/TfsExtensions/issues`);
            console.error(resultAsJson);
        }
    }
    else {
        console.error("Could not queue the build because there were validation errors or warnings:");
        validationResults.forEach(validation => {
            if (validation.result !== "ok") {
                console.error(`${validation.result}: ${validation.message}`);
            }
        });
    }
    throw new Error(`Could not Trigger build. See console for more Information.`);
}
function throwIfAuthenticationError(result) {
    if (result === undefined || result.value === undefined) {
        console.log("Authentication failed - please make sure your settings are correct.");
        console.log("If you use the OAuth Token, make sure you enabled the access to it on the Build Definition.");
        console.log("If you use a Personal Access Token, make sure it did not expire.");
        console.log("If you use Basic Authentication, make sure alternate credentials are enabled on your TFS/VSTS.");
        throw new Error(`Authentication with TFS Server failed. Please check your settings.`);
    }
}
