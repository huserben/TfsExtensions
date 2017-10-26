"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const taskLibrary = require("vsts-task-lib/task");
var TaskResult;
(function (TaskResult) {
    TaskResult[TaskResult["Failed"] = 0] = "Failed";
    TaskResult[TaskResult["Succeeded"] = 1] = "Succeeded";
    TaskResult[TaskResult["SucceededWithIssues"] = 2] = "SucceededWithIssues";
})(TaskResult = exports.TaskResult || (exports.TaskResult = {}));
class TaskLibrary {
    getDelimitedInput(name, delimeter, isRequired) {
        return taskLibrary.getDelimitedInput(name, delimeter, isRequired);
    }
    getBoolInput(name, isRequired) {
        return taskLibrary.getBoolInput(name, isRequired);
    }
    getInput(name, isRequired) {
        return taskLibrary.getInput(name, isRequired);
    }
    setVariable(name, value) {
        taskLibrary.setVariable(name, value);
    }
    getVariable(variableName) {
        return taskLibrary.getVariable(variableName);
    }
    setResult(result, message) {
        taskLibrary.setResult(result, message);
    }
}
exports.TaskLibrary = TaskLibrary;
