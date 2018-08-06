import tl = require("./tasklibrary");
import tfsRestService = require("tfsrestservice");
import common = require("./generalfunctions");
import tr = require("./taskrunner");

var tasklibrary : tl.TaskLibrary = new tl.TaskLibrary();

var taskRunner: tr.TaskRunner = new tr.TaskRunner(
    new tfsRestService.TfsRestService(true, (message) => tasklibrary.debug(message)),
    tasklibrary,
    new common.GeneralFunctions());

taskRunner.run();