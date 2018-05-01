"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("./tasklibrary");
const tfsRestService = require("tfsrestservice");
const common = require("./generalfunctions");
const tr = require("./taskrunner");
var tasklibrary = new tl.TaskLibrary();
var taskRunner = new tr.TaskRunner(new tfsRestService.TfsRestService(true, (message) => tasklibrary.debug(message)), tasklibrary, new common.GeneralFunctions());
taskRunner.run();
