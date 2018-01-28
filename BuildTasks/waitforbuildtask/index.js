"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("./tasklibrary");
const tfsRestService = require("tfsrestservice");
const common = require("./generalfunctions");
const tr = require("./taskrunner");
var taskRunner = new tr.TaskRunner(new tfsRestService.TfsRestService(), new tl.TaskLibrary(), new common.GeneralFunctions());
taskRunner.run();
