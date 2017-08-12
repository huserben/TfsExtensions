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
        "Content-Type": "application/json; charset=utf-8"
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
function triggerBuild(buildDefinitionName, branch, requestedFor, sourceVersion, buildParameters) {
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
        if (buildParameters !== null) {
            queueBuildBody += `, parameters: \"{${buildParameters}}\"`;
        }
        queueBuildBody += "}";
        console.log(`Queue new Build for definition ${buildDefinitionName}`);
        console.log(queueBuildBody);
        var result = yield WebRequest.post(queueBuildUrl, options, queueBuildBody);
        return JSON.parse(result.content).id;
    });
}
exports.triggerBuild = triggerBuild;
function waitForBuildsToFinish(triggeredBuilds, failIfNotSuccessful) {
    return __awaiter(this, void 0, void 0, function* () {
        var result = true;
        for (let queuedBuildId of triggeredBuilds) {
            var buildFinished = yield isBuildFinished(queuedBuildId);
            if (!buildFinished) {
                console.log(`Build ${queuedBuildId} is not yet completed`);
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
        if (result.count === 0) {
            throw new Error(`Did not find any build definition with this name: ${buildDefinitionName}
        - checked following url: ${options.baseUrl}${requestUrl}`);
        }
        return result.value[0].id;
    });
}
