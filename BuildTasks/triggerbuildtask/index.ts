import tfsRestService = require("./tfsrestservice");
import common = require("./generalfunctions");
import tr = require("./taskrunner");
import tl = require("./tasklibrary");

var taskRunner: tr.TaskRunner = new tr.TaskRunner(
    new tfsRestService.TfsRestService(),
    new tl.TaskLibrary(),
    new common.GeneralFunctions());

taskRunner.run();