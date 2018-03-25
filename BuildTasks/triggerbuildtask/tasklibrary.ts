import taskLibrary = require("vsts-task-lib/task");

export enum TaskResult {
    Failed,
    Succeeded,
    SucceededWithIssues
}

export interface ITaskLibrary {
    getBoolInput(name: string, isRequired: boolean): boolean;
    getInput(name: string, isRequired: boolean): string;
    getDelimitedInput(name: string, delimeter: string, isRequired: boolean): string[];
    setResult(result: TaskResult, message: string): void;
    getVariable(name: string): string;
    setVariable(name: string, value: string): void;
    debug(message: string): void;
}

export class TaskLibrary implements ITaskLibrary {

    debug(message: string): void {
        taskLibrary.debug(message);
    }
    getDelimitedInput(name: string, delimeter: string, isRequired: boolean): string[] {
        return taskLibrary.getDelimitedInput(name, delimeter, isRequired);
    }
    getBoolInput(name: string, isRequired: boolean): boolean {
        return taskLibrary.getBoolInput(name, isRequired);
    }
    getInput(name: string, isRequired: boolean): string {
        return taskLibrary.getInput(name, isRequired);
    }

    public setVariable(name: string, value: string): void {
        taskLibrary.setVariable(name, value);
    }

    public getVariable(variableName: string): string {
        return taskLibrary.getVariable(variableName);
    }

    public setResult(result: TaskResult, message: string): void {
        var actualResult: taskLibrary.TaskResult = taskLibrary.TaskResult.Failed;

        switch (result) {
            case TaskResult.Failed:
                actualResult = taskLibrary.TaskResult.Failed;
                break;
            case TaskResult.SucceededWithIssues:
                actualResult = taskLibrary.TaskResult.SucceededWithIssues;
                break;
            case TaskResult.Succeeded:
                actualResult = taskLibrary.TaskResult.Succeeded;
                break;
            default:
                throw new Error(`Unknown result type`);
        }

        taskLibrary.setResult(actualResult, message);
    }
}