# Trigger Build Task
This build task enables the chaining of builds within TFS.  
It makes use of the built-in TFS API to queue a new build of any build definition (within the same Team Project or even across projects).  

## Release Notes
The latest release notes can be found on [Github](https://github.com/huserben/TfsExtensions/blob/master/BuildTasks/ReleaseNotes.md).
  
## Basic Configuration
The configuration is quite simple. After adding the task to your current build, you can select under *Basic Configuration* the Name of the Build you would like to trigger.  
This name **must** match with what you defined as name for your build definition. If the build you want to trigger is defined in the same team project as the build definition you are currently modifying, 
you can leave the checkbox checked.  
  
![Basic Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/basic_configuration.PNG)  
  
  
If your build would be in another Team Project, uncheck the checkbox and fill in the URL to this team project. It **must** include the collection it is in and would look something like this:  
*https://**YOURACCOUNT**.visualstudio.com/DefaultCollection/<TEAMPROJECT>*  
  
![Custom Team Project Configuration](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/customteamprojectconfiguration.PNG)  
  
## Authentication Options
In this section can be set how you authenticate against your TFS. 

### Default Credentials
If your build agent has access to your TFS and sufficient rights to trigger a build and is part of your domain, you can leave the *Use Default Credentials*. This will be a valid option if you have an OnPrem Build Agent, but will not work if you use the Hosted Agents from VSTS.  
### OAuth Token
If you want to use OAuth, you can select this option. If you leave the Token field empty, the task will try to access the System.AccessToken environment variable of your build agent.  If you use this option, make sure that you enabled the option *Allow Scripts to Access OAuth Token* in the options of your Build Definition:  
![Allow Scripts OAuth Token Access](https://raw.githubusercontent.com/huserben/TfsExtensions/master/BuildTasks/allowscriptstokenaccess.PNG)  
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