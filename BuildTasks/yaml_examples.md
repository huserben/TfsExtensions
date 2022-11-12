# Yaml Examples
The following shows examples of how to call the tasks with yaml syntax.

## Trigger Build

## Minimal Example
``` yaml
- task: TriggerBuild@4
  inputs:
    definitionIsInCurrentTeamProject: true
    buildDefinition: 'PipelineToTrigger'
    queueBuildForUserThatTriggeredBuild: true
    ignoreSslCertificateErrors: false
    useSameSourceVersion: false
    useCustomSourceVersion: false
    useSameBranch: true
    waitForQueuedBuildsToFinish: false
    storeInEnvironmentVariable: false
    authenticationMethod: 'OAuth Token'
    password: '$(System.AccessToken)'
    enableBuildInQueueCondition: false
    dependentOnSuccessfulBuildCondition: false
    dependentOnFailedBuildCondition: false
    checkbuildsoncurrentbranch: false
    failTaskIfConditionsAreNotFulfilled: false
```

### Full Example
``` yaml
- task: TriggerBuild@4
  inputs:
    definitionIsInCurrentTeamProject: true
    buildDefinition: 'MyPipeline'
    queueBuildForUserThatTriggeredBuild: true
    ignoreSslCertificateErrors: true
    useSameSourceVersion: true
    useSameBranch: true
    waitForQueuedBuildsToFinish: true
    waitForQueuedBuildsToFinishRefreshTime: '60'
    failTaskIfBuildsNotSuccessful: true
    cancelBuildsIfAnyFails: true
    treatPartiallySucceededBuildAsSuccessful: true
    downloadBuildArtifacts: true
    dropDirectory: '$(agent.workFolder)/DownloadDirectory'
    storeInEnvironmentVariable: true
    demands: 'Demand1, Demand2 = Test'
    queueid: 'MyCustomAgentPool'
    delayBetweenBuilds: '5'
    buildParameters: 'MyVariable: MyVariableValue'
    templateParameters: 'MyTemplateParameter: TemplateValue'
    authenticationMethod: 'OAuth Token'
    password: '$(System.AccessToken)'
    enableBuildInQueueCondition: true
    includeCurrentBuildDefinition: true
    blockingBuildsList: 'Pipeline1, Pipeline3'
    blockInProgressBuilds: true
    dependentOnSuccessfulBuildCondition: true
    dependentBuildsList: 'Pipeline5'
    dependentOnFailedBuildCondition: true
    dependentFailingBuildsList: 'Pipeline12'
    checkbuildsoncurrentbranch: true
    failTaskIfConditionsAreNotFulfilled: true
```

### Outputs
The task will store the Build IDs of the triggered build(s) in a variable called `TriggeredBuildIds`.

## Wait For Build

### Inputs
The task will check the `TriggeredBuildIds` variable. If it's not set by the Trigger task, you can also set it manually yourself.

### Example
``` yaml
- task: WaitForBuildToFinish@3
  inputs:
    definitionIsInCurrentTeamProject: true
    ignoreSslCertificateErrors: true
    waitForQueuedBuildsToFinishRefreshTime: '60'
    failTaskIfBuildsNotSuccessful: true
    cancelBuildsIfAnyFails: false
    treatPartiallySucceededBuildAsSuccessful: false
    downloadBuildArtifacts: false
    clearVariable: true
    authenticationMethod: 'OAuth Token'
    password: '$(System.AccessToken)'
```

## Cancel Build

### Input
The task will check the `TriggeredBuildIds` variable. If it's not set by the Trigger task, you can also set it manually yourself.

### Example
``` yaml
- task: CancelBuildTask@3
  inputs:
    definitionIsInCurrentTeamProject: true
    ignoreSslCertificateErrors: false
    clearVariable: true
    authenticationMethod: 'OAuth Token'
    password: '$(System.AccessToken)'
```