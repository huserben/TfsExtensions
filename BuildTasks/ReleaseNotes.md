# Release Notes

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