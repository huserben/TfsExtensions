"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tfsRestService = require("./tfsrestservice");
const tr = require("./taskrunner");
const tl = require("./tasklibrary");
var taskRunner = new tr.TaskRunner(new tfsRestService.TfsRestService(), new tl.TaskLibrary());
taskRunner.run();
