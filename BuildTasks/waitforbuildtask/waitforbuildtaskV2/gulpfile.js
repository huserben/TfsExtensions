const gulp = require('gulp');
const ts = require('gulp-typescript');
const mocha = require('gulp-mocha');

// pull in the project Typescript config
const tsProject = ts.createProject('tsconfig.json');
//task to be run when the watcher detects changes
gulp.task('scripts', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('.'))
    .pipe(mocha({reporter: "min"}));
});

gulp.task('build', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('.'))
    .pipe(mocha({reporter: "list"}));
});

//set up a watcher to watch over changes
gulp.task('watch', gulp.series('scripts', () => {
  gulp.watch('**/*.ts', gulp.series('scripts', () => { }));
}));

gulp.task('default', gulp.series('watch', () => { 
  
}));