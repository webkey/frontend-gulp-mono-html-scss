'use strict';

var gulp = require('gulp'),
    del = require('del');

var path = {
  'tpl': 'gulp-project-template'
};

gulp.task('buildDistTpl', ['cleanDistTpl'], function () {

  gulp.src(['src/img/**/*']).pipe(gulp.dest(path.tpl + '/src/img'));

  gulp.src(['src/sass/**/*']).pipe(gulp.dest(path.tpl + '/src/sass'));

  gulp.src(['src/js/common.js']).pipe(gulp.dest(path.tpl + '/src/js'));

  gulp.src(['src/includes/**/*']).pipe(gulp.dest(path.tpl + '/src/includes'));

  gulp.src([
    'src/fonts',
    'src/__*.html',
    'src/_tpl_*.html',
    'src/*.png',
    'src/*.jpg',
    'src/*.ico',
    'src/*.htaccess',
    'src/*.json',
    'src/manifest.webmanifest'
  ]).pipe(gulp.dest(path.tpl + '/src'));

  gulp.src([
    './.bowerrc',
    './.gitignore',
    './*.json',
    './*.js', '!./gulpfile-create-gulp-project-template.js',
    './*.txt',
    './*.bat'
  ]).pipe(gulp.dest(path.tpl));

});

gulp.task('cleanDistTpl', function () {
  return del.sync([path.tpl + '/']);
});