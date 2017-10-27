const gulp = require('gulp');
const ts = require('gulp-typescript');
const mocha = require('gulp-mocha');

// pull in the project Typescript config
const tsProject = ts.createProject('tsconfig.json');
//task to be run when the watcher detects changes
gulp.task('scripts', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest(''))
    .pipe(mocha({reporter: "min"}));
});
//set up a watcher to watch over changes
gulp.task('watch', ['scripts'], () => {
  gulp.watch('**/*.ts', ['scripts']);
});

gulp.task('default', ['watch']);