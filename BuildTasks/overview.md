# Trigger Build Task
This build task enables the chaining of builds within TFS.  
It makes use of the built-in TFS API to queue a new build of any build definition (within the same Team Project or even across projects).  

## Supported TFS Versions
The Build Task is supported for both VSTS and TFS on-Premises from Version 2015 Update 2 updwards.  
Currently only Windows Build Agents are supported as the Task is based on Powershell.

## Release Notes
The latest release notes can be found on [Github](https://github.com/huserben/TfsExtensions/blob/master/BuildTasks/ReleaseNotes.md).

## Known Issues
- Build Definitions that contain a '&' are not supported. If you want to trigger a build definition with such a name, consider renaming it. [The remote server returned an error: (400) Bad Request ](https://github.com/huserben/TfsExtensions/issues/13)

A list of all current issues can be found on [Github](https://github.com/huserben/TfsExtensions/issues).
  
## Basic Configuration
The configuration is quite simple. After adding the task to your current build, you can select under *Basic Configuration* the Name of the Build you would like to trigger.  
This name **must** match with what you defined as name for your build definition. If the build you want to trigger is defined in the same team project as the build definition you are currently modifying, you can leave the checkbox checked. You can as well define multiple build that you want to trigger by separating the names with a comma.  
  
![Basic Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/basic_configuration.PNG)  
  

**Important:** If your build definition name contains a '&', the task will fail (see Known Issues above).
  
If your build would be in another Team Project, uncheck the checkbox and fill in the URL to this team project. It **must** include the collection it is in and would look something like this:  
*https://**YOURACCOUNT**.visualstudio.com/DefaultCollection/<TEAMPROJECT>*  
  
![Custom Team Project Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/customteamprojectconfiguration.PNG)  
  
Furthermore you can select whether the subsequent builds that are triggered should be run as it would be requested by the same user that triggered the original build or not. This can be useful if you have any kind of query that is based on the name, for example if you want to filter for builds triggered by you or if you have setup email alerts.   
  
If you do not select this option, it depends on the method of authentication (see below) for whom the builds will be triggered:  
 - **Default Credentials**: Build Service User  
 - **OAuth Token**: Build Service User (if System.AccessToken is used), otherwise owner of the Token  
 - **Personal Access Token**: Owner of that Token  
 - **Basic Authentication**: Specified User 
  
## Advanced Configuration
![Advanced Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/advanced_configuration.PNG)  
### Use Same Source Version
If this option is enabled, the triggered build will use the same source version as the build that includes the task. This means if the build was triggered for a specific changeset or label, the same source version will used in the triggered build. This option is disabled by default, which means the triggered build will use the latest sources.

### Use Same Source Branch
If this is enabled, the triggered build will use the same source branch as the build that includes the task. This means if the build is triggered for the source branch *refs/heads/master*, the triggered build will as well.  
Please make sure that if this option is enabled, the triggered build can actually be triggered for that branch. Especially if you trigger builds across projects you might want to disable this step.

If you disable this option, you can specify the source-branch that shall be used yourself. If you don't define anything, the source-branch parameter will not be specified and the default will be used.

### Wait for Completion of Triggered Builds
If you enable this option, the build task will wait for the completion of all the triggered builds.  
After triggering all the builds, the task periodically check the builds that were triggered and just continue when all of them are finished.  
You can specify the intervall of when the builds are checked, just specify the value in seconds.  
Furthermore you can define what shall happen if one of the triggered builds was not successful, you can either fail the Task or you can continue anyway.

**Important:** If you don't have an additional available build agent you will get stuck, as the original build is waiting for the completion of the other build, which can only be started once the original build is finished and the agent will be available!

### Build Parameters
This field allows to parametrize the triggered build. The option you can specify via the GUI if you queue the build manually can be passed here. As you can see in the screenshot above, the syntax to specify those parameters is a bit tricky.  
You need to specify first the name of the variable you want to set, as you can see it in the Variables Tab of the build you want to trigger. Then the value can be set after a *:*   
**All** variable names and values must be enclosed by a *\"*  
\"VariableIWantToSet\" : \"WhateverValue\"  
You can specify multiple parameters, just append a *,* after the value and then specify the next variable-value pair.  
It is as well possible to make use of the build variables of the build that is running. For example if you want to reuse the Build Configuration for the triggered build, you can do so by using the following syntax for the value part:  
\"$(BuildConfiguration)\"  
This will work with every variable you have defined in your build.  
  
**Note:** If you set a variable via these parameters that is not settable at queue time, the Build Task will still succeed. However, the build that is triggered might fail. For example if the build configuration is not settable at queue time but fix set to Release, and you specify the parameter anyway and will pass "Debug", you will get the follwing error:  
*The specified solution configuration "debug|x64" is invalid. Please specify a valid solution configuration using the Configuration and Platform properties (e.g. MSBuild.exe Solution.sln /p:Configuration=Debug /p:Platform="Any CPU") or leave those properties blank to use the default solution configuration.*

## Authentication Options
In this section can be set how you authenticate against your TFS. 

### Default Credentials
If your build agent has access to your TFS and sufficient rights to trigger a build and is part of your domain, you can leave the *Use Default Credentials*. This will be a valid option if you have an OnPrem Build Agent, but will not work if you use the Hosted Agents from VSTS.  
### OAuth Token
If you want to use OAuth, you can select this option. If you leave the Token field empty, the task will try to access the System.AccessToken environment variable of your build agent.  If you use this option, make sure that you enabled the option *Allow Scripts to Access OAuth Token* in the options of your Build Definition:  
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
As with the build to trigger, you specify the builds by name. You can add multiple builds separated by a comma. If you want to include the build you are currently modifying you can do this via the provided checkbox.  
This condition could be used in order to implement a "two-build" continuous integration scenario. If you have a CI build that should run fast you can trigger at the end of this build another build that runs more expensive and 
long running operations, for example integration- or UI Tests. Now in case you already have another CI Build in the queue, you don't want to trigger this build because it will anyway be triggered by that build waiting in the queue.  

![Build In Queue Condition Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/buildinqueue.PNG)

### Build Dependency Condition
The second supported condition is the *Dependency Condition*. This condition will check the latest builds of the provided build definitions and will only trigger the new build if those last builds were successful.  
The example scneario for this could be that you don't want to trigger your Release build if your CI build is failing. Again you can specify a comma speratated list of build definitions that you would like to have included in the check.
  
![Build Dependency Condition](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/builddependencycondition.PNG)

### Failed Build Dependency Condition
This condition is very similar to the *Build Dependency Condition* mentioned above. The difference is that it will check whether the latest builds of the provided build definitions were failing and will only trigger the new build if the builds failed.  
The example scenario would be that you have a scheduled build during the night that runs no matter what. Due to failing dependent builds it will fail as well. Now you fix the dependent build and you automatically want to trigger the build that failed during the nightly-run, but you only want to do that if it failed before.  
Again you can specify a comma speratated list of build definitions that you would like to have included in the check.
  
![Failing Build Dependency Condition](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/failedbuilddependencycondition.PNG)  

## Issues
In case you have issues, for example exceptions when you run the Task make sure that the Authentication Option selected is valid. If you still have problems, please open a new issue at [github](https://github.com/huserben/TfsExtensions/issues) rather than in the Q&A section.