import tfsRestService = require("./tfsrestservice");
import tr = require("./taskrunner");
import tl = require("./tasklibrary");

var taskRunner : tr.TaskRunner = new tr.TaskRunner(new tfsRestService.TfsRestService(), new tl.TaskLibrary());
taskRunner.run();