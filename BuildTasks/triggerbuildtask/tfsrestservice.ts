import * as WebRequest from "web-request";
import fs = require("fs");
import url = require("url");
import tfsConstants = require("./tfsconstants");

export interface IBuild {
    name: string;
    id: string;
    result: string;
    status: string;
}

export interface ITfsRestService {
    initialize(authenticationMethod: string, username: string, password: string, tfsServer: string, ignoreSslError: boolean): void;
    getBuildsByStatus(buildDefinitionName: string, statusFilter: string): Promise<IBuild[]>;
    triggerBuild(
        buildDefinitionName: string,
        branch: string,
        requestedFor: string,
        sourceVersion: string,
        demands: string[],
        queueId: number,
        buildParameters: string): Promise<string>;
    downloadArtifacts(buildId: string, downloadDirectory: string): Promise<void>;
    getQueueIdByName(buildQueue: string): Promise<number>;
    waitForBuildsToFinish(triggeredBuilds: string[], failIfNotSuccessful: boolean): Promise<boolean>;
}

// internally used interfaces for json objects returned by REST request.
interface ITfsGetResponse<T> {
    count: number;
    value: T[];
}

interface IQueue {
    id: number;
    name: string;
}

interface IArtifact {
    id: string;
    name: string;
    resource: IArtifactResource;
}

interface IArtifactResource {
    downloadUrl: string;
}

interface IValidationResult {
    result: string;
    message: string;
}

export class TfsRestService implements  ITfsRestService {
    options: WebRequest.RequestOptions;

    public initialize(authenticationMethod: string, username: string, password: string, tfsServer: string, ignoreSslError: boolean): void {
        var baseUrl: string = `${encodeURI(tfsServer)}/${tfsConstants.ApiUrl}/`;

        switch (authenticationMethod) {
            case tfsConstants.AuthenticationMethodOAuthToken:
                console.log("Using OAuth Access Token");
                this.options = {
                    baseUrl: baseUrl, auth: {
                        bearer: password
                    }
                };
                break;
            case tfsConstants.AuthenticationMethodBasicAuthentication:
                console.log("Using Basic Authentication");
                this.options = {
                    baseUrl: baseUrl, auth: {
                        user: username,
                        password: password
                    }
                };

                break;
            case tfsConstants.AuthenticationMethodPersonalAccessToken:
                console.log("Using Personal Access Token");

                this.options = {
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

        this.options.headers = {
            "Content-Type": "application/json"
        };
        this.options.agentOptions = { rejectUnauthorized: !ignoreSslError };
        this.options.encoding = "utf-8";
    }

    public async getBuildsByStatus(buildDefinitionName: string, statusFilter: string): Promise<IBuild[]> {
        var buildDefinitionID: string = await this.getBuildDefinitionId(buildDefinitionName);

        var requestUrl: string =
            `build/builds?api-version=2.0&definitions=${buildDefinitionID}&statusFilter=${statusFilter}`;

        var result: ITfsGetResponse<IBuild> =
            await WebRequest.json<ITfsGetResponse<IBuild>>(requestUrl, this.options);

        return result.value;
    }

    public async triggerBuild(
        buildDefinitionName: string,
        branch: string,
        requestedFor: string,
        sourceVersion: string,
        demands: string[],
        queueId: number,
        buildParameters: string): Promise<string> {
        var buildId: string = await this.getBuildDefinitionId(buildDefinitionName);
        var queueBuildUrl: string = "build/builds?api-version=2.0";

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

        var result: WebRequest.Response<string> = await WebRequest.post(queueBuildUrl, this.options, queueBuildBody);

        var resultAsJson: any = JSON.parse(result.content);
        var triggeredBuildID: string = resultAsJson.id;

        // if we are not able to fetch the expected JSON it means something went wrong and we got back some exception from TFS.
        if (triggeredBuildID === undefined) {
            this.handleValidationError(resultAsJson);
        }

        return triggeredBuildID;
    }

    public async waitForBuildsToFinish(triggeredBuilds: string[], failIfNotSuccessful: boolean): Promise<boolean> {
        var result: boolean = true;
        for (let queuedBuildId of triggeredBuilds) {
            var buildFinished: boolean = await this.isBuildFinished(queuedBuildId);

            if (!buildFinished) {
                console.log(`Build ${queuedBuildId} has not yet completed`);
                result = false;
            } else {
                result = result && true;
                console.log(`Build ${queuedBuildId} has completed`);
                var buildSuccessful: boolean = await this.wasBuildSuccessful(queuedBuildId);

                if (failIfNotSuccessful && !buildSuccessful) {
                    throw new Error(`Build ${queuedBuildId} was not successful - failing task.`);
                }
            }
        }

        return result;
    }

    public async downloadArtifacts(buildId: string, downloadDirectory: string): Promise<void> {
        console.log(`Downloading artifacts for ${buildId}`);

        if (!fs.existsSync(downloadDirectory)) {
            console.log(`Directory ${downloadDirectory} does not exist - will be created`);
            fs.mkdirSync(downloadDirectory);
        }

        if (!downloadDirectory.endsWith("\\")) {
            downloadDirectory += "\\";
        }

        var requestUrl: string = `build/builds/${buildId}/artifacts`;
        var result: ITfsGetResponse<IArtifact> = await WebRequest.json<ITfsGetResponse<IArtifact>>(requestUrl, this.options);

        if (result.count === undefined) {
            console.log(`No artifacts found for build ${buildId} - skipping...`);
        }

        console.log(`Found ${result.count} artifact(s)`);

        for (let artifact of result.value) {
            console.log(`Downloading artifact ${artifact.name}...`);

            var fileFormat: any = url.parse(artifact.resource.downloadUrl, true).query.$format;

            // if for whatever reason we cannot get the file format from the url just try with zip.
            if (fileFormat === null || fileFormat === undefined) {
                fileFormat = "zip";
            }

            var fileName: string = `${artifact.name}.${fileFormat}`;
            var index: number = 1;

            while (fs.existsSync(`${downloadDirectory}${fileName}`)) {
                console.log(`${fileName} already exists...`);
                fileName = `${artifact.name}${index}.${fileFormat}`;
                index++;
            }

            this.options.baseUrl = "";
            this.options.headers = {
                "Content-Type": `application/${fileFormat}`
            };
            this.options.encoding = null;

            var request: WebRequest.Request<void> = await WebRequest.stream(artifact.resource.downloadUrl, this.options);
            await request.pipe(fs.createWriteStream(downloadDirectory + fileName));

            console.log(`Stored artifact here: ${downloadDirectory}${fileName}`);
        }
    }

    public async getQueueIdByName(buildQueue: string): Promise<number> {
        var requestUrl: string = `distributedtask/queues`;
        var result: ITfsGetResponse<IQueue> = await WebRequest.json<ITfsGetResponse<IQueue>>(requestUrl, this.options);

        this.throwIfAuthenticationError(result);

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
    }

    private async isBuildFinished(buildId: string): Promise<boolean> {
        var requestUrl: string = `build/builds/${buildId}?api-version=2.0`;
        var result: IBuild =
            await WebRequest.json<IBuild>(requestUrl, this.options);

        return result.status === tfsConstants.BuildStateCompleted;
    }

    private async wasBuildSuccessful(buildId: string): Promise<boolean> {
        var requestUrl: string = `build/builds/${buildId}?api-version=2.0`;
        var result: IBuild =
            await WebRequest.json<IBuild>(requestUrl, this.options);

        return result.result === tfsConstants.BuildResultSucceeded;
    }

    private async getBuildDefinitionId(buildDefinitionName: string): Promise<string> {
        var requestUrl: string = `build/definitions?api-version=2.0&name=${encodeURIComponent(buildDefinitionName)}`;

        var result: ITfsGetResponse<IBuild> =
            await WebRequest.json<ITfsGetResponse<IBuild>>(requestUrl, this.options);

            this.throwIfAuthenticationError(result);

        if (result.count === 0) {
            throw new Error(`Did not find any build definition with this name: ${buildDefinitionName}
            - checked following url: ${this.options.baseUrl}${requestUrl}`);
        }

        return result.value[0].id;
    }

    private handleValidationError(resultAsJson: any): void {
        var validationResults: IValidationResult[] = resultAsJson.ValidationResults;
        if (validationResults === undefined) {
            // in case something else failed try fetch just a message:
            var errorMessage: string = resultAsJson.message;

            if (errorMessage !== undefined) {
                console.error(errorMessage);
            } else {
                console.error("Unknown error - printing complete return value from server.");
                console.error(`Consider raising an issue at github if problem cannot be solved:
                https://github.com/huserben/TfsExtensions/issues`);
                console.error(resultAsJson);
            }
        } else {
            console.error("Could not queue the build because there were validation errors or warnings:");
            validationResults.forEach(validation => {
                if (validation.result !== "ok") {
                    console.error(`${validation.result}: ${validation.message}`);
                }
            });
        }

        throw new Error(`Could not Trigger build. See console for more Information.`);
    }

    private throwIfAuthenticationError<T>(result: ITfsGetResponse<T>): void {
        if (result === undefined || result.value === undefined) {
            console.log("Authentication failed - please make sure your settings are correct.");
            console.log("If you use the OAuth Token, make sure you enabled the access to it on the Build Definition.");
            console.log("If you use a Personal Access Token, make sure it did not expire.");
            console.log("If you use Basic Authentication, make sure alternate credentials are enabled on your TFS/VSTS.");
            throw new Error(`Authentication with TFS Server failed. Please check your settings.`);
        }
    }
}
