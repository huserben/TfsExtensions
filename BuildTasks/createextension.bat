REM First Run the prepare tasks for each task:
REM triggerbuildtask\perpareTriggerBuildTask.bat
REM waitforbuildtask\perpareWaitForBuildTask.bat

REM Don't forget to increase the version!
tfx extension create --manifest-globs vss-extension.json