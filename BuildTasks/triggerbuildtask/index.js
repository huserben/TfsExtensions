"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tfsRestService = require("tfsrestservice");
const common = require("./generalfunctions");
const tr = require("./taskrunner");
const tl = require("./tasklibrary");
var taskLibrary = new tl.TaskLibrary();
var taskRunner = new tr.TaskRunner(new tfsRestService.TfsRestService(), taskLibrary, new common.GeneralFunctions());
taskRunner.run();
//# sourceMappingURL=index.js.map