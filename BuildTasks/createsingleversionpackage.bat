REM First Run the prepare tasks for each task:
REM triggerbuildtask\perpareTriggerBuildTask.bat
REM waitforbuildtask\perpareWaitForBuildTask.bat

REM Don't forget to increase the version!

del build /S /Q
copy vss-extension.json build /Y
copy LICENSE build /Y
xcopy *.png build /y
xcopy *.md build /y

robocopy images build/images
robocopy triggerbuildtask/triggerbuildtaskV3 build/triggerbuildtask /E
robocopy cancelbuildtask/cancelbuildtaskV2 build/cancelbuildtask /E
robocopy waitforbuildtask/waitforbuildtaskV2 build/waitforbuildtask /E

tfx extension create --manifest-globs build\vss-extension.json