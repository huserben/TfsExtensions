# Trigger Build Task
This build task enables the chaining of builds within TFS.  
It makes use of the built-in TFS API to queue a new build of any build definition (within the same Team Project or even across projects) and has support for different conditions if the Build should be triggered.  

## Supported TFS Versions
The Build Task is supported for both VSTS and TFS on-Premises from Version 2015 Update 2 upwards.  
**Please check the following guide on [github](https://github.com/huserben/TfsExtensions/blob/master/BuildTasks/Tfs15.md) if you are still using TFS 2015.**

If you are having problems installing the extension on you on Prem TFS and getting the following error message:  
![Upload Error](https://user-images.githubusercontent.com/1705112/44252681-3c951080-a1fd-11e8-8f3d-5915f86ebdf0.png)  
Please check the [Releases](https://github.com/huserben/TfsExtensions/tree/master/BuildTasks/Releases/singleversion) folder on github for the "single version packages".  
It seems that some versions of TFS don't support packages with multiple versions packages, therefore a dedicated package will be available that includes just the newest versions of the tasks.

## Release Notes

**A new Task "Cancel Builds" is available that can be used to cancel builds that were triggered with the Trigger Build Task in any previous step**
  
The latest release notes can be found on [Github](https://github.com/huserben/TfsExtensions/blob/master/BuildTasks/ReleaseNotes.md).

## Version 3 now available
This version of the tasks are making use now of the official node.js library from Microsoft to access the VSTS/TFS instead of relying on a custom implementation. This brings the advantage of having many things built-in by design, being more uptodate with the current state of the REST API and making it easier to extend functionality. 

### Disclaimer 
The basic functionality was retested and worked fine. However there might be some cases where some things now look or behave a bit different (for example the logging). If you experience anything please let me know by creating a new issue on github.

### Updating from Version 2.* to 3.*
There are only slight interface changes. If a custom TFS/VSTS Server address is used, the Team Project has to be specified now in a seperate variable instead of being part of the URL. If you don't use a custom URL, everything stays the same.  
Moreover, the *Default Authentication* option was now removed completly, after being obsolete since version 2.

## Updating from Version 1.* to 2.0.0
In order to update your Task from Version 1.* to the new Version 2.0.0, you have to manually switch the Version in the Build Definition:
![Update Task](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/updateToVersion2.png)  

### Interface Changes
The interface including mainly stays the same. Your configuration will work as before. The only changes were made in the authentication and how to access the stored variable when this was used before (see [Release Notes](https://github.com/huserben/TfsExtensions/blob/master/BuildTasks/ReleaseNotes.md)) and that a flag was added to the Basic Configuration that untrusted certificate errors are ignored (see Basic Configuration below).

#### Removed Default Credentials Options
The option to authenticate via default credentials was removed as it is not well supported within Node.js. Please do switch to another authentication method. The task currently automatically will switch to OAuth if Default is still used - however this option will be removed in an upcoming version.

#### Stored Environment Variable
The Powershell version stored the triggered build id as an environment variable that was available even after the build. The new script will only use variables in scope of the build, however if there is still an id stored from the previous version, you have to delete it manually. If you have access to the Agent(s) directly you can simply delete the environment variable "TriggeredBuildIds".  
Otherwise you can as well run the following command in a Powershell script (this only has to be done once and then the variable is cleared) as part of the build:  
` [Environment]::SetEnvironmentVariable("TriggeredBuildIds", ",", "User")`

## Known Issues
- Build Definitions that contain a '&' are not supported. If you want to trigger a build definition with such a name, consider renaming it. [The remote server returned an error: (400) Bad Request ](https://github.com/huserben/TfsExtensions/issues/13)  
- When the task is used within a release definition, certain configuration options might not work properly if there is no build artifact linked (e.g. for *Use same User that triggered Build* and *Use same Branch*). The task was designed only with build definitions in mind, in case you need it to work in Release Definitions wihtout any builds linked please open a new issue on [Github](https://github.com/huserben/TfsExtensions/issues) and explain your problem to see whether there is a workaround

A list of all current issues can be found on [Github](https://github.com/huserben/TfsExtensions/issues).

If you find any Bugs, you have feature- or change requests or questions in general about the Task, feel free to raise an issue over at [Github](https://github.com/huserben/TfsExtensions/issues). 
  
## Basic Configuration
The configuration is quite simple. After adding the task to your current build, you can select under *Basic Configuration* the Name of the Build you would like to trigger.  
This name **must** match with what you defined as name for your build definition. If the build you want to trigger is defined in the same team project as the build definition you are currently modifying, you can leave the checkbox checked. You can as well define multiple build that you want to trigger by separating the names with a comma.  
  
![Basic Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/basic_configuration.PNG)  
  

**Important:** If your build definition name contains a '&', the task will fail (see Known Issues above).
  
If your build would be in another Team Project, another collection on the same server or a completly different server, uncheck the checkbox and fill in the URL to the server including the collection and the team project. This would look something like this:  
  
![Custom Team Project Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/customteamprojectconfiguration.PNG)  
  
Furthermore you can select whether the subsequent builds that are triggered should be run as it would be requested by the same user that triggered the original build or not. This can be useful if you have any kind of query that is based on the name, for example if you want to filter for builds triggered by you or if you have setup email alerts.   
  
If you do not select this option, it depends on the method of authentication (see below) for whom the builds will be triggered:  
 - **OAuth Token**: Build Service User (if System.AccessToken is used), otherwise owner of the Token  
 - **Personal Access Token**: Owner of that Token  
 - **Basic Authentication**: Specified User 

The **Ignore SSL Certificate Errors** flag can be used if you need to ignore SSL errors caused by untrusted certificates.

### Important Configuration Options when Triggered Build is not located on the VSTS/TFS Instance or Team Project
If the target build is on a different TFS some special circumstances apply. First and foremost the authentication options (see below) are limited. You cannot use OAuth authentication, either use a Personal Access Token (recommended) or Basic Authentication.  
**Important:** The Acess Token or Basic Authentication must be setup on the VSTS/TFS that hosts the Target Build!  

As well it's not possible to have conditions based on builds of the current VSTS/TFS, due to the authentication being setup for the VSTS/TFS Instance that hosts the triggered build. Conditions based on builds of this Instance however would be possible.  
Additionally the option *Queue Build for User that triggered original build* does not work as this user might not exist on the target VSTS/TFS. Please do not check this option in that case. See above for whom the build will be triggered depending on the specified authentication method.

If you want to trigger a build from a different Team Project but within the same VSTS/TFS instance you can still use OAuth Authentication.  

In any case if you trigger a build from a different team project, no matter if on the same or a different server instance, the following *Advanced Configuration* options shall not be enabled to prevent issues:  
- Use current changeset for the triggered build  
- Use same source branch as triggered build
  
## Advanced Configuration
![Advanced Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/advanced_configuration.PNG)  
### Use Same Source Version
If this option is enabled, the triggered build will use the same source version as the build that includes the task. This means if the build was triggered for a specific changeset or label, the same source version will used in the triggered build. This option is disabled by default, which means the triggered build will use the latest sources.

### Use Same Source Branch
If this is enabled, the triggered build will use the same source branch as the build that includes the task. This means if the build is triggered for the source branch *master*, the triggered build will as well.  
Please make sure that if this option is enabled, the triggered build can actually be triggered for that branch. Especially if you trigger builds across projects you might want to disable this step.

If you disable this option, you can specify the source-branch that shall be used yourself. If you don't define anything, the source-branch parameter will not be specified and the default will be used.

### Wait for Completion of Triggered Builds
![Waiting Options](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/waitingoptions.PNG)  
  
If you enable this option, the build task will wait for the completion of all the triggered builds.  
After triggering all the builds, the task periodically check the builds that were triggered and just continue when all of them are finished.  
You can specify the interval of when the builds are checked, just specify the value in seconds.  
Furthermore you can define what shall happen if one of the triggered builds was not successful, you can either fail the Task or you can continue anyway. Additionally you can define whether you want to treat a partially successful build as successful to not fail the task.  
If it is checked that the build is successful it can be specified whether the artifacts of the build(s) shall be downloaded. If so it can be specified where to store them on the build agent for further use. This location can then be used in the subsequent Tasks (for example extracting the downloaded zip and do something with it).

There is as well the option to cancel all awaited builds if you are failing the task due to a build that failed. This will then stop other builds and free up the build queue.

**Important:** If you don't have an additional available build agent you will get stuck, as the original build is waiting for the completion of the other build, which can only be started once the original build is finished and the agent will be available!

####Wait for Triggered Build Task
There is a dedicated Task that can be used in order to wait for triggered Builds to finish. When using this Task instead of the above mentioned option, you can do other Tasks in between and just start waiting at the latest possible moment.
The Task uses as an input the Stored Build ID's (see below) of any Trigger Build Task that was running before and that set the option of storing the IDs. The rest of the configuration is as described above.

#### Cancel Build Task
There is as well a dedicated task to cancel builds. This can be used for example to cancel all builds if anything in the build itself fails after triggering. Just add the task in the end of the build and set it to be executed only if a previous task failed.  The task works against the Stored Build ID's in the same way as the Wait for Triggered Build Task does.

###Store Build IDs in Variable
If any subsequent task needs the info of which builds were triggered by this Task, this information is available as an environment variable to the subsequent Tasks. The name of the variable is *TriggeredBuildIds*. If more than one build will be triggered, the values will be written comma separated. If there is already a value in the variable from a previous Task, it **not** overwritten but keep the original value and append his resulting build id's.   

In for example a PowerShell Script the variable can be accessed like this:  
  
*Write-Output "Fetching variable TriggeredBuildIds:"  
Write-Output "$($env:TriggeredBuildIds)"*

The possible output could then look like this for 2 triggered builds:  
*2017-07-01T11:41:20.5194001Z Fetching variable TriggeredBuildIds:  
2017-07-01T11:41:20.6131495Z 601,602*

The variable is as well available as an input in the configuration for *any* subsequent Task. Just access it like this:
*$(TriggeredBuildIds)* 

### Demands
Depending on your build definition a ceratin set of demands will be required from the agent to be built. When queuing a build additional demands can be specified, for example to filter for a special build agent. If additional demands need to be specified, they can be added here. Multiple demands can be specified when they are separated by a comma.  

####Syntax
The syntax is as follows. If you just want to check if the demand exists on the agent, just specify the value (see image above the demand "MySpecialDemandForThisBuild".  Furthermore a demand can be checked if it has a certain value. To add this kind of demands you can write it like this: "OtherDemand = 42".  

**Note:** If no suitable agent is available with the specified demands, the build cannot be triggered and the Task will fail!

### Queue
Specify here the name or the id of the agent queue that you want to use. If not specified, the default queue will be used. 

### Delay between triggering builds
Define here if you wish to delay the builds that are triggered by the specified amount of seconds. This might be useful if you have some issues when triggering builds at nearly the same time.

### Build Parameters
This field allows to parametrize the triggered build. The option you can specify via the GUI if you queue the build manually can be passed here. As you can see in the screenshot above, the syntax to specify those parameters is a bit tricky.  
You need to specify first the name of the variable you want to set, as you can see it in the Variables Tab of the build you want to trigger. Then the value can be set after a *:*   
**VariableIWantToSet: WhateverValue**  
You can specify multiple parameters, just append a *,* after the value and then specify the next variable-value pair.  
It is as well possible to make use of the build variables of the build that is running. For example if you want to reuse the Build Configuration for the triggered build, you can do so by using the following syntax for the value part:  
*$(BuildConfiguration)*  
This will work with every variable you have defined in your build.  

**Caution:** Be cautious when you have a variable value that contains itself a comma. As this is used in the task for separating the parameter key's and values it can cause some issues. However it is supported that you have Variable values that include a comma, however then your parameter cannot contain a colon.  
For example these will work:  
- **VariableKey**: *MyValue1, MyValue2*  
- **VariableKey**: *C:\Test\Something, otherValue*  

However, the following will not work:  
- **VariableKey**: *C:\Test\Something, C:\Test\SomethingElse*

Please see the following [Issue](https://github.com/huserben/TfsExtensions/issues/54#issuecomment-368578707) for a more detailed explanation. If you cannot work around this, please open a new Issue on github.
  
**Note:** If you set a variable via these parameters that is not settable at queue time, the Build Task will still succeed. However, the build that is triggered might fail. For example if the build configuration is not settable at queue time but fix set to Release, and you specify the parameter anyway and will pass "Debug", you will get the following error:  
*The specified solution configuration "debug|x64" is invalid. Please specify a valid solution configuration using the Configuration and Platform properties (e.g. MSBuild.exe Solution.sln /p:Configuration=Debug /p:Platform="Any CPU") or leave those properties blank to use the default solution configuration.*

## Authentication Options
In this section can be set how you authenticate against your TFS. 

### Default Credentials
**This option is not supported anymore - when used the script will automatically try to use the OAuth Token instead to provide support for. However it will create a warning and you should change it yourself to another Authentication Method as this will option will be removed in the future.**  
### OAuth Token
If you want to use OAuth, you can select this option. If you leave the Token field empty, the task will try to access the System.AccessToken environment variable of your build agent.  If you use this option, make sure that you enabled the option *Allow Scripts to Access OAuth Token* in the options of your Build Definition.  
On VSTS (newer versions of TFS) this is specified for the *Agent Phase* the task runs under:  
![Allow Scripts OAuth Token Access for Agent Phase](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/allowscriptstokenaccess_new.png)  

On TFS Instances (2015 - 2018) this is located under the Options of the Build Definition.  
![Allow Scripts OAuth Token Access](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/allowscriptstokenaccess.png)  
Otherwise your build task will fail.

This option will work with Hosted Build Agents from VSTS.  

### Personal Access Token
If you want to use a Personal Access Token, you have to make sure that it at least has the following right: *Build (read and execute)*  
Then just provide the Access Token in the appropriate input box and the task is good to go:  
![Using the Personal Access Token](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/usepersonalaccesstoken.PNG) 

### Basic Authentication
If you have enabled Basic Authentication, you can as well use this sort of authentication by providing the username and password.    
It is recommended to not use plaintext here, but make use of variables - especially for the password.  
  
![Use Alternate Credentials](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/usealternatecredentials.PNG)  
  
If the specified user will not have sufficient rights, the task will fail!  

## Conditions
The build tasks supports two different kinds of conditions.  
  
### Build In Queue Condition
The first condition is called *Build In Queue* condition.  
If you enable this condition, you can specify a list of build definitions that will prevent the trigger of a new build if any of those are currently in a queue waiting to be built.  
Additionally there is the option that the condition should take into account builds that are currently being run. A small exception of that rule is if the current build definition is blocking. This one will always just be checked for additional builds in the queue, as there will always be one in progress.

As with the build to trigger, you specify the builds by name. You can add multiple builds separated by a comma. If you want to include the build you are currently modifying you can do this via the provided checkbox.  
This condition could be used in order to implement a "two-build" continuous integration scenario. If you have a CI build that should run fast you can trigger at the end of this build another build that runs more expensive and 
long running operations, for example integration- or UI Tests. Now in case you already have another CI Build in the queue, you don't want to trigger this build because it will anyway be triggered by that build waiting in the queue.  

![Build In Queue Condition Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/buildinqueue.PNG)

### Build Dependency Condition
The second supported condition is the *Dependency Condition*. This condition will check the latest builds of the provided build definitions and will only trigger the new build if those last builds were successful.  
The example scenario for this could be that you don't want to trigger your Release build if your CI build is failing. Again you can specify a comma separated list of build definitions that you would like to have included in the check.
  
![Build Dependency Condition](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/builddependencycondition.PNG)

### Failed Build Dependency Condition
This condition is very similar to the *Build Dependency Condition* mentioned above. The difference is that it will check whether the latest builds of the provided build definitions were failing and will only trigger the new build if the builds failed.  
The example scenario would be that you have a scheduled build during the night that runs no matter what. Due to failing dependent builds it will fail as well. Now you fix the dependent build and you automatically want to trigger the build that failed during the nightly-run, but you only want to do that if it failed before.  
Again you can specify a comma separated list of build definitions that you would like to have included in the check.
  
![Failing Build Dependency Condition](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/failedbuilddependencycondition.PNG)  

### Fail Task if Any Condition is not fulfilled
This option allows to fail the task if a condition was setup and is not met. It has no effect if you don't specify any of the other conditions.

## Issues
In case you have issues, for example exceptions when you run the Task make sure that the Authentication Option selected is valid. If you still have problems, please open a new issue at [github](https://github.com/huserben/TfsExtensions/issues).
