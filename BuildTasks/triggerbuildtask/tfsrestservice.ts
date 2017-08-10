import * as WebRequest from "web-request";
import tfsConstants = require("./tfsconstants");
import taskConstants = require("./taskconstants");

let options : WebRequest.RequestOptions;

export interface IBuild {
    name: string;
    id: string;
    result: string;
    status: string;
}

interface ITfsGetResponse {
    count: number;
    value: IBuild[];
}

export function initialize(authenticationMethod: string, username: string, password: string, tfsServer: string): void {
    var baseUrl: string = `${encodeURI(tfsServer)}/${taskConstants.ApiUrl}/`;

    switch (authenticationMethod) {
        case taskConstants.AuthenticationMethodDefaultCredentials:
            console.log("Using Default Credentials");
            options = {
                baseUrl: baseUrl,
            };

            break;
        case taskConstants.AuthenticationMethodOAuthToken:
            console.log("Using OAuth Access Token");

            var authenticationToken: string;
            if (password === null) {
                console.log("Trying to fetch authentication token from system...");
                authenticationToken = `${process.env[tfsConstants.OAuthAccessToken]}`;
            } else {
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
    options.encoding = "utf-8";
}

export async function getBuildsByStatus(buildDefinitionName: string, statusFilter: string): Promise<IBuild[]> {
    var buildDefinitionID : string = await getBuildDefinitionId(buildDefinitionName);

    var requestUrl : string =
    `build/builds?api-version=2.0&definitions=${buildDefinitionID}&statusFilter=${statusFilter}`;

    var result : ITfsGetResponse = await WebRequest.json<ITfsGetResponse>(requestUrl, options);

    return result.value;
}

export async function triggerBuild(
    buildDefinitionName: string, branch: string, requestedFor: string, sourceVersion: string, buildParameters: string): Promise<string> {
    var buildId : string = await getBuildDefinitionId(buildDefinitionName);
    var queueBuildUrl : string = "build/builds?api-version=2.0";

    var queueBuildBody: string = `{ definition: { id: ${buildId} }`;
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

    var result : WebRequest.Response<string>= await WebRequest.post(queueBuildUrl, options, queueBuildBody);

    return JSON.parse(result.content).id;
}

export async function isBuildFinished(buildId: string): Promise<boolean> {
    var requestUrl : string = `build/builds/${buildId}?api-version=2.0`;
    var result : IBuild = await WebRequest.json<IBuild>(requestUrl, options);

    return result.status === taskConstants.BuildStateCompleted;
}

export async function wasBuildSuccessful(buildId: string): Promise<boolean> {
    var requestUrl : string = `build/builds/${buildId}?api-version=2.0`;
    var result : IBuild = await WebRequest.json<IBuild>(requestUrl, options);

    return result.result === taskConstants.BuildResultSucceeded;
}

async function getBuildDefinitionId(buildDefinitionName: string): Promise<string> {
    var requestUrl: string = `build/definitions?api-version=2.0&name=${encodeURIComponent(buildDefinitionName)}`;

    var result :ITfsGetResponse = await WebRequest.json<ITfsGetResponse>(requestUrl, options);

    if (result.count === 0) {
        throw new Error(`Did not find any build definition with this name: ${buildDefinitionName}
        - checked following url: ${options.baseUrl}${requestUrl}`);
    }

    return result.value[0].id;
}