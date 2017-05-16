param(
     [Parameter(Mandatory=$true)][string]$definitionIsInCurrentTeamProject,
     [Parameter(Mandatory=$false)][string]$tfsServer, 
     [Parameter(Mandatory=$true)][string]$buildDefinition,     
     [Parameter(Mandatory=$true)][string]$queueBuildForUserThatTriggeredBuild,
     [Parameter(Mandatory=$true)][string]$useSameSourceVersion,
     [Parameter(Mandatory=$false)][string]$buildParameters,
     [Parameter(Mandatory=$false)][string]$authenticationMethod,
     [Parameter(Mandatory=$false)][string]$username,
     [Parameter(Mandatory=$false)][string]$password,
     [Parameter(Mandatory=$true)][string]$enableBuildInQueueCondition,
     [Parameter(Mandatory=$false)][string]$includeCurrentBuildDefinition,
     [Parameter(Mandatory=$false)][string]$blockingBuildsList,
     [Parameter(Mandatory=$true)][string]$dependentOnSuccessfulBuildCondition,
     [Parameter(Mandatory=$false)][string]$dependentBuildsList,
     [Parameter(Mandatory=$true)][string]$dependentOnFailedBuildCondition,
     [Parameter(Mandatory=$false)][string]$dependentFailingBuildsList
) 

$definitionIsInCurrentTeamProjectAsBool = [System.Convert]::ToBoolean($definitionIsInCurrentTeamProject)
$enableBuildInQueueConditionAsBool = [System.Convert]::ToBoolean($enableBuildInQueueCondition)
$includeCurrentBuildDefinitionAsBool = [System.Convert]::ToBoolean($includeCurrentBuildDefinition)
$dependentOnSuccessfulBuildConditionAsBool = [System.Convert]::ToBoolean($dependentOnSuccessfulBuildCondition)
$dependentOnFailedBuildConditionAsBool = [System.Convert]::ToBoolean($dependentOnFailedBuildCondition)
$queueBuildForUserThatTriggeredBuildAsBool = [System.Convert]::ToBoolean($queueBuildForUserThatTriggeredBuild)
$useSameSourceVersionAsBool = [System.Convert]::ToBoolean($useSameSourceVersion)

$authenticationToken = ""
$requestedForBody = ""
$sourceVersionBody ="";

if ($definitionIsInCurrentTeamProjectAsBool -eq $False){
    Write-Output "Using Custom Team Project URL"
}
else{
    Write-Output "Using Current Team Project URL"
    $tfsServer = "$($env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI)$($env:SYSTEM_TEAMPROJECT)"
}

Write-Output "Path to Server: $($tfsServer)"

if ($authenticationMethod -eq "Default Credentials"){
    Write-Output "Using Default Credentials"
}
elseif($authenticationMethod -eq "OAuth Token"){
    Write-Output "Using OAuth Access Token"

    if ($password -eq ""){
        Write-Output "Trying to fetch authentication token from system..."
        $authenticationToken = $env:SYSTEM_ACCESSTOKEN
    }
    else{
        $authenticationToken = $password
    }
}
elseif ($authenticationMethod -eq "Basic Authentication"){
        Write-Output "Using Basic Authentication"
        $securePassword = ConvertTo-SecureString -String $password -AsPlainText -Force
        $credential = New-Object –TypeName "System.Management.Automation.PSCredential" –ArgumentList $username, $securePassword
        $authenticationToken = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $username,$securePassword)))
}
elseif($authenticationMethod -eq "Personal Access Token"){
        Write-Output "Using Personal Access Token"
        $authenticationToken = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f "something", $password)))
}

if ($queueBuildForUserThatTriggeredBuildAsBool){
    Write-Output "Build shall be triggered for same user that triggered current build: $($env:BUILD_REQUESTEDFOR)"
    $requestedForBody = "requestedFor: { id: ""$($env:BUILD_REQUESTEDFORID)""}"
}

if ($useSameSourceVersionAsBool){
    $sourceVersion = $($env:BUILD_SOURCEVERSION)
    $repositoryType = $($env:BUILD_REPOSITORY_PROVIDER)

    # if we use a TFS Repository, we need to specify a "C" before the changeset...it is usually set by default, except
    # If we use the latest version, the source version will not have a C prepended, so we have to do that manually...
    if (-Not $sourceVersion.StartsWith("C") -and $repositoryType -eq "TfsVersionControl"){
        $sourceVersion = "C$($sourceVersion)"
    }

    Write-Output "Triggered Build will use the same source version: $($sourceVersion)"
    $sourceVersionBody = "sourceVersion: ""$($sourceVersion)"""
}

if ($buildParameters){
    Write-Host "Will trigger build with folowing parameters: $($buildParameters)"
}

if ($enableBuildInQueueConditionAsBool){
    Write-Output "Build In Queue Condition is enabled"
    $blockingBuildsArray = @()

    if ($includeCurrentBuildDefinitionAsBool){
        Write-Output "Current Build Definition shall be included"
        $currentBuildDefinition = Get-ChildItem Env:BUILD_DEFINITIONNAME
        $blockingBuildsArray += $currentBuildDefinition.Value
    }

    $blockingBuildsList.Split(",").Trim() | ForEach {
        if ($_){
            Write-Output "Add $($_) to list of blocking Build Definitions"
            $blockingBuildsArray += $_
        }
    }
}
else{
    Write-Output "Build In Queue Condition is not enabled"
}

if ($dependentOnSuccessfulBuildConditionAsBool){
    Write-Output "Dependant Build Condition is enabled"
    $dependentBuildsArray = @()

    $dependentBuildsList.Split(",").Trim() | ForEach {
        if ($_){
            Write-Output "Add $($_) to list of dependent build definitions"
            $dependentBuildsArray += $_
        }
    }
}
else{
    Write-Output "Dependant Build Condition is not enabled"
}

if ($dependentOnFailedBuildConditionAsBool){
Write-Output "Dependant Failing Build Condition is enabled"
    $dependentFailedBuildsArray = @()

    $dependentFailingBuildsList.Split(",").Trim() | ForEach {
        if ($_){
            Write-Output "Add $($_) to list of dependent build definitions"
            $dependentFailedBuildsArray += $_
        }
    }
}
else{
    Write-Output "Dependant on Failed Build Condition is not enabled"
}

Function Send-Web-Request
{
    param([string]$apiUrl, [string]$requestType, [string]$messageBody)

    $fullUrl = [uri]::EscapeUriString($tfsServer + "/_apis/" + $apiUrl)

    if ($authenticationMethod -eq "Default Credentials"){
        if ($messageBody){
            return Invoke-WebRequest -UseDefaultCredentials -Uri $fullUrl -Method $requestType -ContentType "application/json" -Body $messageBody -UseBasicParsing
        }
        return Invoke-WebRequest -UseDefaultCredentials -Uri $fullUrl -Method $requestType -ContentType "application/json" -UseBasicParsing
    }
    elseif ($authenticationMethod -eq "OAuth Token"){
        if ($messageBody){
            return Invoke-WebRequest -Uri $fullUrl -Headers @{Authorization = "Bearer $authenticationToken"} -Method $requestType -ContentType "application/json" -Body $messageBody -UseBasicParsing
        }
        return Invoke-WebRequest -Uri $fullUrl -Headers @{Authorization = "Bearer $authenticationToken"} -Method $requestType -ContentType "application/json" -UseBasicParsing
    }
    elseif ($authenticationMethod -eq "Basic Authentication"){
            if ($messageBody){
                return Invoke-WebRequest -Credential $credential -Uri $fullUrl -Headers @{Authorization = "Basic $authenticationToken"} -Method $requestType -ContentType "application/json" -Body $messageBody -UseBasicParsing
            }
        
            return Invoke-WebRequest  -Credential $credential -Uri $fullUrl -Headers @{Authorization = "Basic $authenticationToken"} -Method $requestType -ContentType "application/json" -UseBasicParsing
    }elseif($authenticationMethod -eq "Personal Access Token"){        
            if ($messageBody){
                return Invoke-WebRequest -Uri $fullUrl -Headers @{Authorization = "Basic $authenticationToken"} -Method $requestType -ContentType "application/json" -Body $messageBody -UseBasicParsing
            }

            return Invoke-WebRequest -Uri $fullUrl -Headers @{Authorization = "Basic $authenticationToken"} -Method $requestType -ContentType "application/json" -UseBasicParsing
    }    
}

Function Get-BuildDefinition-Id
{
    param([string]$definition)

    $buildDefinitionUrl = "build/definitions?api-version=2.0&name=$($definition)"

    $response = Send-Web-Request -apiUrl $buildDefinitionUrl -requestType "GET" | ConvertFrom-Json
    $definitionId = $response.value[0].id
    return $definitionId
}

Function Get-Build-By-Status
{
    param([string]$buildDefinitionId, [string]$statusFilter)

    $apiUrl = "build/builds?api-version=2.0&definitions=$($buildDefinitionId)&statusFilter=$($statusFilter)"
    $response = Send-Web-Request -apiUrl $apiUrl -requestType "GET" | ConvertFrom-Json

    return $response
}

if ($enableBuildInQueueConditionAsBool){
    Write-Output "Checking if blocking builds are queued"

    $blockingBuildsArray | ForEach{
        if ($_){
            Write-Output "Checking Build Definition: $($_)"
            $blockingBuildId = Get-BuildDefinition-Id -definition $_
        
            $queuedBuilds = Get-Build-By-Status -buildDefinitionId $blockingBuildId -statusFilter "notStarted"
            if ($queuedBuilds.Count -ne 0){
                Write-Output "$($_) is queued - will not trigger new build"
                exit
            }
        }
    }

    Write-Output "None of the blocking builds is queued - proceeding"
}

if ($dependentOnSuccessfulBuildConditionAsBool){
    Write-Output "Checking if dependant build definitions last builds were successful"

    $dependentBuildsArray | ForEach{
        Write-Output "Checking Build Definition $($_)"
        $dependentBuildId = Get-BuildDefinition-Id -definition $_

        $lastBuilds = Get-Build-By-Status -buildDefinitionId $dependentBuildId
        $lastBuildResult = $lastBuilds.value[0].result
        if ($lastBuildResult -ne "succeeded"){
            Write-Output "Last build of definition $($_) was not successful (state is: $($lastBuilds.value[0].status)) - will not trigger new build"
            exit
        }
    }

    Write-Output "None of the dependant build definitions last builds were failing - proceeding"
}

if ($dependentOnFailedBuildConditionAsBool){
   Write-Output "Checking if dependant build definitions last builds were NOT successful"

   $dependentFailedBuildsArray | ForEach{
        Write-Output "Checking Build Definition $($_)"
        $dependentBuildId = Get-BuildDefinition-Id -definition $_

        $lastBuilds = Get-Build-By-Status -buildDefinitionId $dependentBuildId
        $lastBuildResult = $lastBuilds.value[0].result
        if ($lastBuildResult -eq "succeeded"){
            Write-Output "Last build of definition $($_) was successful (state is: $($lastBuilds.value[0].status)) - will not trigger new build"
            exit
        }
   }

    Write-Output "None of the dependant build definitions last builds were successful - proceeding"
}

$buildDefinitionId = Get-BuildDefinition-Id -definition $buildDefinition

$queueBuildUrl = "build/builds?api-version=2.0"
$queueBuildBody = "{ definition: { id: $($buildDefinitionId) }, sourceBranch: ""$($env:BUILD_SOURCEBRANCH)"""

if ($requestedForBody){
    $queueBuildBody += ", $($requestedForBody)"
}

if ($sourceVersionBody){
    $queueBuildBody += ", $($sourceVersionBody)"
}

if ($buildParameters){
    $queueBuildBody += ", parameters: ""{$($buildParameters)}"""
}

$queueBuildBody += "}"

Write-Output "Queue new Build for definition $($buildDefinition) on $($tfsServer)/_apis/$($queueBuildUrl)"
Write-Output $queueBuildBody

$response = Send-Web-Request -apiUrl $queueBuildUrl -requestType "POST" -messageBody $queueBuildBody

Write-Output "Queued new Build for Definition $($buildDefinition)"
