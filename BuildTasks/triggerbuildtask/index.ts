import tfsRestService = require("tfsrestservice");
import common = require("./generalfunctions");
import tr = require("./taskrunner");
import tl = require("./tasklibrary");

var taskLibrary : tl.TaskLibrary = new tl.TaskLibrary();

var taskRunner: tr.TaskRunner = new tr.TaskRunner(
    new tfsRestService.TfsRestService(true, (message) => taskLibrary.debug(message)),
    taskLibrary,
    new common.GeneralFunctions());

taskRunner.run();