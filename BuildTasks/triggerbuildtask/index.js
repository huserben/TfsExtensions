"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tfsRestService = require("tfsrestservice");
const common = require("./generalfunctions");
const tr = require("./taskrunner");
const tl = require("./tasklibrary");
var taskLibrary = new tl.TaskLibrary();
var taskRunner = new tr.TaskRunner(new tfsRestService.TfsRestService(true, (message) => taskLibrary.debug(message)), taskLibrary, new common.GeneralFunctions());
taskRunner.run();
