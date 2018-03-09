# Using the Task with TFS 2015
As TFS 2015 uses a rather old version of the build agent, it can be that the node version used by the Task-Runner is to old. This can then result in an error such as the following:  

	const tfsRestService = require("tfsrestservice");
	^^^^^
	Use of const in strict mode.
	at exports.runInThisContext (vm.js:73:16)
	at Module._compile (module.js:443:25)
	at Object.Module._extensions..js (module.js:478:10)
	at Module.load (module.js:355:32)
	at Function.Module._load (module.js:310:12)
	at Function.Module.runMain (module.js:501:10)
	at startup (node.js:129:16)
	at node.js:814:3

## Updating Node on the Agent
In order to resolve this issue node has to be updated on **all** the agents that run the TriggerBuild or Wait Task.  
Updating node is done simply by going to the [node.js Download Page](https://nodejs.org/en/download/) and fetch the latest version for your agent.  
However the agent itself uses its own version of node, that is stored under the agent directory. On TFS 2015 Agent this is usually located somewhere here (this depends on your configuration of the Agent however):  
*C:\agent\Agent\Worker\Handlers\Node\node.exe*  

In order to update node now, please copy the *node.exe* from Program Files (or wherever you just installed the newest version to) and paste it into the agent folder. You might want to rename the original *node.exe* first in order to be able to go back to the original state.

Now rerun the Task, the above error should not occur anymore and you should be able to run the Task normally.

**If you have any issues regarding this update, plesae see following [Issue](https://github.com/huserben/TfsExtensions/issues/56) about the problem. Feel free to ask further questions in this issue. If you have another problem please create a new issue.**