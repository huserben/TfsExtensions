# Release Notes

## Version 2.5
- Added option for Build in Queue Condition to treat In Progress Builds as blocking (["Consider option for blocking against inProgress builds"](https://github.com/huserben/TfsExtensions/issues/46))  


### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@cbaxter**](https://github.com/cbaxter)

## Version 2.4
- Updated documentation for fixing problems with persisted Build ID from Version 1.* script ([Version 2 TiggerBuildTask Setting TriggeredBuildIds Environment Variable Differently Than Version 1](https://github.com/huserben/TfsExtensions/issues/29))  
- Added better logging/error message when Wait For Build Task is used without having at least one Triggered Build Task that has storage of the variable enabled ([Wait for build to finish error](https://github.com/huserben/TfsExtensions/issues/32))
- Added possibility to specify the Queue by name and not only by ID ([Specify Queue by Name](https://github.com/huserben/TfsExtensions/issues/33))
- Fixed issue that when no demands where specified original demands specified by build definitions were overwritten ([Demands defined by the build definition aren't honored by queued builds](https://github.com/huserben/TfsExtensions/issues/35))  
- Fixed invalid release package ([Task crashes - Cannot find module 'tfsrestservice'](https://github.com/huserben/TfsExtensions/issues/37))
- Fixed issue that when Task was failing due to an error the result was still seen as "Succeeded" ([Task Result is not set properly when Task has an Error](https://github.com/huserben/TfsExtensions/issues/38))  
- Fixed issue that "use current changeset" had no effect on triggered build (["Use same source branch as triggered build"/"Use current changeset for the triggered build" doesn't sync to correct commit](https://github.com/huserben/TfsExtensions/issues/40))  
- Changed TriggerBuildTask to interpret previously stored build id's correctly when there is more than one existing value (["Trigger Build extension losing track of successful builds](https://github.com/huserben/TfsExtensions/issues/43))  


### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@toddbrownmcis**](https://github.com/toddbrownmcis)  
- [**@Serdfd**](https://github.com/Serdfd)   
- [**@user273835**](https://github.com/user273835)  
- [**@ItielBeeri**](https://github.com/ItielBeeri)  
- [**@dtzar**](https://github.com/dtzar)  
- [**@rfennell**](https://github.com/rfennell)  
- [**@cdacamar**](https://github.com/cdacamar)  
- [**@patnolan**](https://github.com/patnolan)  


## Version 2.3
- Fixed issue that task failed when it was built for a label ([Build from label or changeset and use same version causes error](https://github.com/huserben/TfsExtensions/issues/28#issuecomment-332582129))  
- Added option to specify Queue ID ([Add option to specify Queue ID](https://github.com/huserben/TfsExtensions/issues/30)).

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@JohnHennesey**](https://github.com/JohnHennesey)  
- [**@user273835**](https://github.com/user273835)  

## Version 2.2
- Added option to specify demands for triggered build. This for example allows the possibility to filter for a specific build agent ([Possibility to add Demands](https://github.com/huserben/TfsExtensions/issues/27)).
- Improved handling when authentication fails. Now a proper message with some additional help info will be displayed ([Failed Authentication should fail Task and output a proper Message](https://github.com/huserben/TfsExtensions/issues/25)).
- Validation errors when triggering the build are now caught and will fail the build. Furthermore the validation error will be written to the output. Validation errors can happen when no build agent is available (e.g. no Agent Queue specified or no agent with matching demands etc.) ([Handle Validation Errors when triggering Build](https://github.com/huserben/TfsExtensions/issues/26)).
- Blocking Builds will not check for builds that are currently building, only for the ones waiting in a queue.  
- Inputs are now trimmed so that trailing whitespaces don't lead to errors  

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@Koshak118**](https://github.com/Koshak118)  
- [**@thoemmi**](https://github.com/thoemmi)  
- [**@veepee78**](https://github.com/veepee78)  
- [**@JohnHennesey**](https://github.com/JohnHennesey)  


## Version 2.1
- Added option to download build artifacts from triggreed builds to both Tasks. This option is only available when failing the task if the builds were not successful. Drop Folder can be specified to where to put the artifacts ([Add new Task: Wait for triggered build to complete](https://github.com/huserben/TfsExtensions/issues/22)).

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@henning-krause**](https://github.com/henning-krause)  

## Version 2.0
- Task was completly refactored to use Node.js. PowerShell Task is not supported anymore - if needed you can still find it [here](https://github.com/huserben/TfsExtensions/tree/master/BuildTasks/powershellTask). ([Make Trigger Build Task available to be run on all Platforms](https://github.com/huserben/TfsExtensions/issues/10))
- Stored variable with Build IDs is now only available during runtime of the build and can be accessed via *$env:TriggeredBuildIds* in a PowerShell Script of via *$(TriggeredBuildIds)* in the configuration section of all subsequent Tasks.
- Added separate Task (*Wait For Builds to Finish*) that will wait for builds to be finished and that will use the *TriggeredBuildIds* of **all** previous Trigger Build Tasks that had the option to store the triggered build ids in a variable. The task has the same options available as the regular task (setting refresh time and define if build should fail on task failure) ([Add new Task: Wait for triggered build to complete](https://github.com/huserben/TfsExtensions/issues/22)).
- Removed support for Default Credentials - for compatibility you can still select it, however the build task will create a warning and internally try to use the OAuth Authentication Method. If you use Default Credentials, please switch to another method as soon as possible as the option itself will be removed in future versions.

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@henning-krause**](https://github.com/henning-krause)  

## Version 1.11
- Added option to save id's of triggered builds in an environment variable so subsequent tasks can use this info (e.g. for downloading artifacts etc.) ([Save resulting build ID in environment ](https://github.com/huserben/TfsExtensions/issues/15))
- Changed output so that a link to the triggered build is displayed ([Feature request: when a build is queued, include a link or the full name of the new build](https://github.com/huserben/TfsExtensions/issues/16))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@garuma**](https://github.com/garuma)  
- [**@shmatkotija**](https://github.com/shmatkotija)

## Version 1.10
- Added support to select which source branch shall be used - either the same as the source build or it can be specified freely ([Unable to specify git sourceBranch for triggered build](https://github.com/huserben/TfsExtensions/issues/14))
- Added option to wait for triggered builds to complete - this enables to run builds on a different agent and continue with the build just when they have finished. User can decide in which intervall the triggered builds shall be checked and if the build should fail if one of the builds was not completed successfully.
- Added handling that if for some reason we get en already escaped string we do not encode it a second time ([Double encoding of URL with space in collection name](https://github.com/huserben/TfsExtensions/issues/12))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@shmatkotija**](https://github.com/shmatkotija)  
- [**@viperx77**](https://github.com/viperx77)  

## Version 1.9
- Added support to trigger multiple builds at once via a comma-separated list

## Version 1.8.5
- Fixed bug that caused Task to fail when using Current Source Version on Git Repositories [The latest version throw 409 conflict error](https://github.com/huserben/TfsExtensions/issues/7)

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@nobitagamaer**](https://github.com/nobitagamer)  

## Version 1.8
- Added option to use the same source version for the triggered builds. If enabled, when a build is triggered for a specific changeset, the triggered build will use the same source version.
- Added option to pass parameters to triggered build. Build Parameters like *BuildPlatform* or *BuildConfiguration* can be specified as part of the Build Task. It is possible to use hardcoded values or reuse the variables from the original build. A detailed description can be found in the overview.

## Version 1.7
- Added option that you can choose if the builds that are triggered are run now for the same user that triggered the first build. This means if a CI build is kicked off by a check-in from a specific user, the triggered builds will be queued for that user as well. This enables that queries based on the user name will work properly (e.g. customized dashboards, email-alerts etc.) - based on feedback from [Dependent Build Timestamp Not Updated ](https://github.com/huserben/TfsExtensions/issues/6)

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@bdwellborn**](https://github.com/bdwellborn)  

## Version 1.6
- SourceBranch is now included when triggering a build 
- Fixed issue that exception was thrown when Blocking Build Condition was enabled with the current build selected, but no additional builds selected [(see Issue)](https://github.com/huserben/TfsExtensions/issues/4)

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@nobitagamaer**](https://github.com/nobitagamer)  

## Version 1.5
- Added new Condition to check if last build of a definition failed. This enables to queue for example a scheduled build automatically if it failed last time and all dependent builds are now fixed.

## Version 1.4
- Added support for Personal Access Token and OAuth System Token Authentication ([Invalid Web Request results on a default VSTS environment](https://github.com/huserben/TfsExtensions/issues/2))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@nobitagamaer**](https://github.com/nobitagamer)  
- [**@lukx**](https://github.com/lukx)

## Version 1.3.16
- Fixed Issue that Trigger did not work when building in Release Mode ([Trigger Build out of a release build does not resolve BUILD_REPOSITORY_URI](https://github.com/huserben/TfsExtensions/issues/1))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@lukx**](https://github.com/lukx)