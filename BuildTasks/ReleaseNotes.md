# Release Notes
## Version 4.0.0
- Created new major version of all three tasks that implement that node10 execution handler change. Reverted previous major versions back to node6 to make it work on outdated Azure DevOps Server/Agent combinations. See [Issue 200](https://github.com/huserben/TfsExtensions/issues/200) and [Issue 199](https://github.com/huserben/TfsExtensions/issues/200).


## Version 3.2.0
- [Updated all tasks to use the Node10 Execution handler](https://github.com/huserben/TfsExtensions/issues/196) - This should remove the warning displayed when running any of the tasks.

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@FKSI**](https://github.com/FKSI)  
- [**@richhoward1**](https://github.com/richhoward1)  

## Version 3.1.0
- Updated all dependencies of all the tasks to make use of the newest [azure-devops-node-api](https://github.com/microsoft/azure-devops-node-api)
- Allow defining template parameters similar to build parameters [Build parameters are being set as variables](https://github.com/huserben/TfsExtensions/issues/163) and [When I trigger another pipeline, the given parameter does not override the default parameter value](https://github.com/huserben/TfsExtensions/issues/153)
- Don't wait a long time after the last retry-attempt [Unnecessary wait after last failed retry](https://github.com/huserben/TfsExtensions/issues/163)
- Various fixed in the documentation

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@icnocop**](https://github.com/icnocop)  
- [**@CraigMacomber**](https://github.com/CraigMacomber)  
- [**@krispenner**](https://github.com/krispenner)  
- [**@rfennell**](https://github.com/rfennell)  
- [**@mohak2006**](https://github.com/mohak2006)  
- [**@jason-ha**](https://github.com/jason-ha)  
- [**@gexiangge**](https://github.com/gexiangge)  
- [**@wbin666**](https://github.com/wbin666)  
- [**@bergmeister**](https://github.com/bergmeister)  

## Version 3.0.14
- Update Azure-DevOps-Node-API to get latest fixes and improvements, especially in http_proxy settings in conjuction with no_proxy handling  
- Handle downloading of artifacts on MacOS machines ([Download Artifacts not working at MAC Build Machines](https://github.com/huserben/TfsExtensions/issues/130))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@BobSilent**](https://github.com/BobSilent)  
- [**@jensheidrich-acn**](https://github.com/jensheidrich-acn)  

## Version 3.0.13
- Allow specifying build definition id and not only the name ([Using build definition ID rather than name](https://github.com/huserben/TfsExtensions/issues/126))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@ArazAbishov**](https://github.com/ArazAbishov)  

## Version 3.0.12
- Allow Triggering of Build with a specific Source ID ([Trigger build with specific Source ID](https://github.com/huserben/TfsExtensions/issues/119))
- Allow specification of build parameter as pure JSON Object ([Universal solution for build parameter escaping](https://github.com/huserben/TfsExtensions/issues/123))
- Ignore casing of artifact type when downloading artifacts ([Unable to download artifacts published by built-in Publish Build Artifacts on Azure DevOps Server 2019](https://github.com/huserben/TfsExtensions/issues/125))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@petermisovic**](https://github.com/petermisovic)  
- [**@dgomsvek**](https://github.com/dgomsvek)
- [**@v-bekif**](https://github.com/v-bekif)
- [**@milliamp**](https://github.com/milliamp)



## Version 3.0.11
- Improve handling when encountering connection issues. ([ECONNRESET issues](https://github.com/huserben/TfsExtensions/issues/108))  
- Allow conditions to filter only for builds in same branch as source build. ([Feature for TriggerBuildTask: Only check build conditions from the same branch](https://github.com/huserben/TfsExtensions/issues/110))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@aee11**](https://github.com/aee11)  
- [**@geofflamrock**](https://github.com/geofflamrock)  

## Version 3.0.10  
- Updated Documentation related to Build Queue Parameter. ([Triggering a build on a different queue fails](https://github.com/huserben/TfsExtensions/issues/102))  
- Task is using Release Environment Variables to figure out who triggered it when used in the context of a release. ([Use Release Environment Variables when Task is used in Context of Release](https://github.com/huserben/TfsExtensions/issues/106))  
- Build Parameters now support that a JSON string is passed as a value. ([Trigger build is failing if JSON needs to be passed as a parameter](https://github.com/huserben/TfsExtensions/issues/107))  
  
### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@migheorghe**](https://github.com/migheorghe)  
- [**@rfennell**](https://github.com/rfennell)  
- [**@mykolad**](https://github.com/mykolad)  

## Version 3.0.8-3.0.9
- Download Artifacts fails for larger artifacts folders. ([3.0.4: download artifact "error: request timeout"](https://github.com/huserben/TfsExtensions/issues/100))  

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@daughey**](https://github.com/daughey)  
 
## Version 3.0.7
- Improved log messages when authentication options are missing configuration (e.g. PAT is selected but no token is specified). ([Cannot read property 'length' of null](https://github.com/huserben/TfsExtensions/issues/99))  
- Added retry mechanism so requests are sent up to 5 times in case of an error to overcome unreliable servers. ([VSTS unreliablity](https://github.com/huserben/TfsExtensions/issues/98))  
- Updated documentation with unsupported use-cases when task is used in a Release Definition. ([Error from manually started release](https://github.com/huserben/TfsExtensions/issues/97))  

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@SimoneLocatelli**](https://github.com/SimoneLocatelli)  
- [**@daughey**](https://github.com/daughey)  
- [**@arnochauveau**](https://github.com/arnochauveau)  
- [**@sevaa**](https://github.com/sevaa)  


## Version 3.0.6
- Wait Task clears stored variables now as well in the case of the task failing. ([TriggeredBuildIds not cleared if waiting for triggered build that failed](https://github.com/huserben/TfsExtensions/issues/94))  

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@dwhearn**](https://github.com/dwhearn)  
   
## Version 3.0.4
- Created special package that only contains a single version of every task for backward compatibility. Updated documentation accordingly. ([Installing Trigger Build .vsix in TFS causes Error: XML Document- 'public' is not a valid value for global::Microsoft.VisualStudio.Services.Gallery.WebApi.PublishedExtensionFlags](https://github.com/huserben/TfsExtensions/issues/90))  
- Updated documentation about usage of the branch parameter . ([Failing to queue build for refs/heads/master](https://github.com/huserben/TfsExtensions/issues/92))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@jawn**](https://github.com/jawn)  
- [**@sanderaernouts**](https://github.com/sanderaernouts)  
  
## Version 3.0.3
- Fixed issue that prevented extension to be installed on On Prem TFS 2017 Update 1. ([Installing Trigger Build .vsix in TFS causes Error: XML Document- 'public' is not a valid value for global::Microsoft.VisualStudio.Services.Gallery.WebApi.PublishedExtensionFlags](https://github.com/huserben/TfsExtensions/issues/90))  
- Various Typos in task description were fixed.  
- New version of tasks are out of preview

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@jawn**](https://github.com/jawn)  

## Version 3.0.0-3.0.2
- Changed underlying service to make use of [vso-node-api](https://github.com/Microsoft/vsts-node-api) instead of custom implementation. This caused slight interface changes for the tasks. Specifically, the team project now needs to be defined in a special field instead of being part of the server url when using a custom address. ([Task is not working behind a proxy. Please respect agent.proxyurl and agent.proxypassword as well as the proxy bypass list](https://github.com/huserben/TfsExtensions/issues/78))  
- Added new option to specify delay between builds if more than one build is triggered. ([Time between each queued build in same step](https://github.com/huserben/TfsExtensions/issues/85))  
- Packaged both versions of the task into one extension. Fixed issue that version 2 tasks were not available anymore ([Task doesn't work anymore](https://github.com/huserben/TfsExtensions/issues/86) and [Newly installed 3.0.0 is not visible in the task list](https://github.com/huserben/TfsExtensions/issues/87))  
- Fixed issue with invalid Certificate when error is not ignored [`unable to verify the first certificate` when SSL Certificate error is not ignored](https://github.com/huserben/TfsExtensions/issues/81)

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@gereon77**](https://github.com/gereon77)  
- [**@LarryRothOakton**](https://github.com/LarryRothOakton)  
- [**@hrlourenco**](https://github.com/hrlourenco)  
- [**@LokiMidgard**](https://github.com/LokiMidgard)

**Special Thanks to all the people that were affected by the mess created due to the dissappeard tasks and reported it:**  
- [**@BlackSlashProd**](https://github.com/BlackSlashProd)  
- [**@JordanRBG**](https://github.com/JordanRBG)  
- [**@jzghaib**](https://github.com/jzghaib)  
- [**@Wazner**](https://github.com/Wazner)  
- [**@sandeep10n**](https://github.com/sandeep10n)  

## Version 2.9.2
- Improved help markdown text in general and especially for build parameters. ([Build parameters for "Trigger Build Tasks" are undocumented](https://github.com/huserben/TfsExtensions/issues/77))  
- Improved label for Authentication Options ([Add more secure options for storing authentication information](https://github.com/huserben/TfsExtensions/issues/82))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@PxlBuzzard**](https://github.com/PxlBuzzard)  
- [**@heikkoe**](https://github.com/heikkoe)


## Version 2.9.1
- Added option to cancel builds to trigger build and wait task. ([Add option to Cancel Builds when awaited build failed](https://github.com/huserben/TfsExtensions/issues/75))  
- Added option to fail trigger task if conditions are not fulfilled ([Add option to fail Task if conditions are not fulfilled](https://github.com/huserben/TfsExtensions/issues/76))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@atlesp**](https://github.com/atlesp)  
- [**@abk90007**](https://github.com/abk90007)

## Version 2.9.0
- Added a new task that allows to cancel builds. ([Cancel child build if the parent build fails](https://github.com/huserben/TfsExtensions/issues/72))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@atlesp**](https://github.com/atlesp)  


## Version 2.8.4
- Fixed issue that prevent task from running successfully if URL read from environment variable was encoded. ([Fail with collection name with space](https://github.com/huserben/TfsExtensions/issues/70))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@G100g**](https://github.com/G100g)  

## Version 2.8.1
- Improved handling of wrong parameter format to output a proper error message ([Cannot read property 'trim' of undefined](https://github.com/huserben/TfsExtensions/issues/65))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@thomasonb**](https://github.com/thomasonb)  

## Version 2.8.0
- Hardened Requests made to Server by retrying up to 5 times to prevent random timeout errors. ([ETIMEOUT happens randomly](https://github.com/huserben/TfsExtensions/issues/59) and [Harden "wait for builds to finish" task?](https://github.com/huserben/TfsExtensions/issues/63))  
- Added additonal option for awaited builds to not fail the Task if the build was partially successful (["Fail the build" option will fail for partially successful triggered tasks](https://github.com/huserben/TfsExtensions/issues/64))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@JeffRausch**](https://github.com/JeffRausch)  
- [**@cdacamar**](https://github.com/cdacamar)  
- [**@burndeal**](https://github.com/burndeal)  

## Version 2.7.2
- Improved logging by enabling debug log and writing more info when build is started with system.debug option ([ETIMEOUT happens randomly](https://github.com/huserben/TfsExtensions/issues/59) and [authentication failed](https://github.com/huserben/TfsExtensions/issues/61))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@JeffRausch**](https://github.com/JeffRausch)  
- [**@userjeff3**](https://github.com/userjeff3)  

## Version 2.7.1
- Fixed Issue empty TriggeredBuildId variable was treated as actual value which caused an issue when new values were appened ([Add option to clear TriggeredBuilds Variable after Build awaited and improve logging](https://github.com/huserben/TfsExtensions/issues/57))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@cbaxter**](https://github.com/cbaxter)  

## Version 2.7.0
- Added guide on how to update Node.js on TFS 2015 Build Agent ([TFS 2015 Build Agent uses unsupported node version](https://github.com/huserben/TfsExtensions/issues/56)   
- Improved logging while awaiting builds and added option to clear Triggered Build Variables after builds were awaited ([Add option to clear TriggeredBuilds Variable after Build awaited and improve logging](https://github.com/huserben/TfsExtensions/issues/57))

### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@gtarunr**](https://github.com/gtarunr)  
- [**@cbaxter**](https://github.com/cbaxter)  
- [**@jfinnegan3**](https://github.com/jfinnegan3)  

## Version 2.6.2 - 2.6.4
- Reverted updated dependency packages that caused an error on some agents ([Error regarding Unexpected token](https://github.com/huserben/TfsExtensions/issues/55)   
- Build Parameters that have a comma in the value itself are now properly parsed ([Trigger Build failing for path-like branches](https://github.com/huserben/TfsExtensions/issues/54))  


### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@cdacamar**](https://github.com/cdacamar)  
- [**@pavlo-pryimak**](https://github.com/pavlo-pryimak)  
- [**@Studentblanchard**](https://github.com/Studentblanchard)  
- [**@Paul-Clewell**](https://github.com/Paul-Clewell)  
- [**@timsiefert**](https://github.com/timsiefert) 

Special thanks goes out to the people of the [linqts](https://github.com/kutyel/linq.ts) library, especially to [**@kutyel**](https://github.com/kutyel) for the support in resolving [Issue 55](https://github.com/huserben/TfsExtensions/issues/55).

## Version 2.6.0
- Build Parameters are now properly escaped to produce a valid JSON format ([Special Characters are not escaped in JSON that is sent to Server](https://github.com/huserben/TfsExtensions/issues/47) and [Build Trigger failing for paths](https://github.com/huserben/TfsExtensions/issues/51))  
- Build can now be triggered even if there are now active Build Agents at the moment. Validation Warnings are shown if there are any, even if the build was successfully triggered. ([Build not Triggered if there are no active Build Agents](https://github.com/huserben/TfsExtensions/issues/50))  


### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@jfinnegan3**](https://github.com/jfinnegan3)  
- [**@Tadimsky**](https://github.com/Tadimsky)  
- [**@JeffRausch**](https://github.com/JeffRausch) 

## Version 2.5
- Added option for Build in Queue Condition to treat In Progress Builds as blocking ([Consider option for blocking against inProgress builds](https://github.com/huserben/TfsExtensions/issues/46))  
- Fixed bug that task was not able to access the server if a different Team Project/Server was used and the specified URL contained escaped spaces ([Use different Team Project with escaped URL fails](https://github.com/huserben/TfsExtensions/issues/41))  
- Fixed problem that special characters were not properly escaped and caused the task to fail ([Special Characters are not escaped in JSON that is sent to Server](https://github.com/huserben/TfsExtensions/issues/47))  
- Fixed problem that downloading artifacts from multiple builds failed ([Wait for build task fail on artifacts download if it waits for two triggered builds](https://github.com/huserben/TfsExtensions/issues/48))
- Fixed Bug so tasks are not trying to download artifacts that are not downloadable ([Artifact download causes error if triggered build tags the sources](https://github.com/huserben/TfsExtensions/issues/49))


### Acknowledgements
Thank you goes to all of the following users, who contributed feedback, bug reports, code submissions, testing, and reviews which helped in this release.  
- [**@cbaxter**](https://github.com/cbaxter)  
- [**@dhanashivam**](https://github.com/dhanashivam)  
- [**@Kyle-Gray**](https://github.com/Kyle-Gray)  
- [**@jfinnegan3**](https://github.com/jfinnegan3)  
- [**@atlesp**](https://github.com/atlesp)  
- [**@jogotcha**](https://github.com/jogotcha)  

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