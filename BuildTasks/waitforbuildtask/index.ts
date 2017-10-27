import tl = require("./tasklibrary");
import tfsRestService = require("tfsrestservice");
import common = require("./generalfunctions");
import tr = require("./taskrunner");

var taskRunner: tr.TaskRunner = new tr.TaskRunner(
    new tfsRestService.TfsRestService(),
    new tl.TaskLibrary(),
    new common.GeneralFunctions());

taskRunner.run();