'use strict';

var gulp             = require('gulp'),
    sass             = require('gulp-sass'),
    browserSync      = require('browser-sync').create(),
    plumber          = require('gulp-plumber'),
    reload           = browserSync.reload,
    concat           = require('gulp-concat'),
    uglify           = require('gulp-uglifyjs'),
    cssnano          = require('gulp-cssnano'),
    gcmq             = require('gulp-group-css-media-queries'),
    concatCss        = require('gulp-concat-css'),
    del              = require('del'),
    imagemin         = require('gulp-imagemin'),
    pngquant         = require('imagemin-pngquant'),
    cache            = require('gulp-cache'),
    autoprefixer     = require('gulp-autoprefixer'),
    sourcemaps       = require('gulp-sourcemaps'),
    fileinclude      = require('gulp-file-include'),
    markdown         = require('markdown'),
    htmlbeautify     = require('gulp-html-beautify'),
    fs               = require('fs'),
    modernizr        = require('modernizr'),
    config           = require('./modernizr-config'),
    replace          = require('gulp-string-replace'),
    strip            = require('gulp-strip-comments'),
    removeEmptyLines = require('gulp-remove-empty-lines'),
    revts            = require('gulp-rev-timestamp'),
    beautify         = require('gulp-beautify'),
    index            = require('gulp-index'); // Для создания списка страниц https://www.npmjs.com/package/gulp-index

var path = {
  'dist': 'dist'
};

gulp.task('html:compilation', function () {
  return gulp.src(['!app/_tpl_*.html', 'app/*.html'])
      .pipe(plumber())
      .pipe(fileinclude({
        basepath: 'app',
        filters: {
          markdown: markdown.parse
        }
      }))
      .pipe(gulp.dest('./' + path.dist));
});

gulp.task('html:production', function () {
  return gulp.src(['!app/_tpl_*.html', 'app/*.html'])
      .pipe(plumber())
      .pipe(fileinclude({
        basepath: 'app',
        filters: {
          markdown: markdown.parse
        }
      }))
      .pipe(htmlbeautify({
        "indent_size": 2,
        "max_preserve_newlines": 0
      }))
      .pipe(revts())
      .pipe(gulp.dest('./' + path.dist));
});

gulp.task('html:buildAllPages', ['html:compilation'], function () {
  var pref = "all-pages";
  return gulp.src(['!app/all-pages.html', '!app/__*.html', '!app/~*.html', '!app/_tpl_*.html', '!app/_temp_*.html', './app/*.html'])
      .pipe(index({
        // written out before index contents
        'prepend-to-output': () => `<head> <title>All pages</title><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0"><link rel="shortcut icon" href="favicon.ico"></head><body>`,
        'title': 'All pages',
        'title-template': (title) => `<h1 class="` + pref + `__title">${title}</h1>`,
        'section-template': (sectionContent) => `<section class="` + pref + `__section"> ${sectionContent}</section>`,
        'section-heading-template': (heading) => `<!--<h2 class="` + pref + `__section-heading">${heading}</h2>-->`,
        'list-template': (listContent) => `<ul class="` + pref + `__list"> ${listContent}</ul>`,
        'item-template': (filepath, filename) => `<li class="` + pref + `__item"><a class="` + pref + `__item-link" href="./${filename}">${filename}</a></li>`,
        'outputFile': './all-pages.html'
      }))
      .pipe(htmlbeautify({
        "indent_size": 2,
        "max_preserve_newlines": 0
      }))
      .pipe(gulp.dest('./' + path.dist));
});

gulp.task('sass:compilation', function () {
  return gulp.src('app/sass/**/*.+(scss|sass)')
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'expanded',
        indentType: 'space',
        indentWidth: 2,
        precision: 3,
        linefeed: 'lf'
      }).on('error', sass.logError))
      .pipe(replace('../../', '../'))
      .pipe(replace('@charset "UTF-8";', ''))
      .pipe(autoprefixer(['last 3 versions', '> 1%'], {
        cascade: true
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./' + path.dist + '/css'))
});

gulp.task('sass:production', function () {
  return gulp.src('app/sass/**/*.+(scss|sass)')
      .pipe(plumber())
      .pipe(sass({
        outputStyle: 'expanded',
        indentType: 'space',
        indentWidth: 2,
        precision: 3,
        linefeed: 'lf'
      }).on('error', sass.logError))
      .pipe(replace('../../', '../'))
      .pipe(replace('@charset "UTF-8";', ''))
      .pipe(autoprefixer(['last 3 versions', '> 1%'], {
        cascade: true
      }))
      .pipe(gcmq())
      .pipe(cssnano({
        zindex: false,
        autoprefixer: {
          remove: false
        }
      }))
      .pipe(gulp.dest('./' + path.dist + '/css'));
});

const cssLibs = [
  'node_modules/select2/dist/css/select2.min.css'
];

gulp.task('cssLibs:merge', function () {
  if(cssLibs.length) {
    return gulp.src(cssLibs)
        .pipe(concatCss(path.dist + "/css/libs.min.css", {rebaseUrls: false}))
        .pipe(gulp.dest('./'));
  }
});

gulp.task('cssLibs:production', function () {
  if(cssLibs.length) {
    return gulp.src(cssLibs)
        .pipe(concatCss(path.dist + "/css/libs.min.css", {rebaseUrls: false}))
        .pipe(cssnano({
          zindex: false,
          autoprefixer: {
            remove: false
          }
        }))
        .pipe(gulp.dest('./'));
  }
});

gulp.task('modernizr', function (done) {
  modernizr.build(config, function (code) {
    fs.writeFile('app/js/modernizr.min.js', code, done);
  });
});

const jsLibs = [
  'node_modules/jquery-validation/dist/jquery.validate.min.js',
  'node_modules/select2/dist/js/select2.full.min.js',
  'node_modules/select2/dist/js/i18n/ru.js',
  'node_modules/object-fit-images/dist/ofi.min.js'
];
gulp.task('jsLibs:merge', ['copyJqueryToJs'], function () {
  if(jsLibs.length) {
    return gulp.src(jsLibs)
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.dist + '/js'));
  }
});

gulp.task('copyJqueryToJs', function () {
  return gulp.src('node_modules/jquery/dist/jquery.min.js')
      .pipe(gulp.dest('app/js'));
});

gulp.task('copyJs', function () {
  return gulp.src('app/js/**/*')
      .pipe(gulp.dest(path.dist + '/js'));
});

gulp.task('copyJs:production', function () {
  gulp.src(['!app/js/app.min.js', 'app/js/**/*'])
      .pipe(gulp.dest(path.dist + '/js'));

  gulp.src('app/js/app.min.js')
      .pipe(strip({
        safe: true,
        ignore: /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\//g // Не удалять /**...*/
      }))
      .pipe(removeEmptyLines())
      .pipe(beautify({
        "indent_size": 2,
        "space_after_anon_function": true,
        "max_preserve_newlines": 2
      }))
      .pipe(gulp.dest(path.dist + '/js'));
});

gulp.task('copyFavicons', function () {
  return gulp.src('app/favicons/**/*', { dot: true })
      .pipe(plumber())
      .pipe(gulp.dest(path.dist));
});

gulp.task('copyFonts', function () {
  return gulp.src('app/fonts/**/*')
      .pipe(plumber())
      .pipe(gulp.dest(path.dist + '/fonts'));
});

gulp.task('copyImages', function () {
  return gulp.src('app/img/**/*')
      .pipe(cache(imagemin({
        interlaced: true,
        progressive: true,
        optimizationLevel: 7, // from 0 to 7
        use: [pngquant()]
      })))
      .pipe(gulp.dest(path.dist + '/img'));
});

gulp.task('browserSync', function (done) {
  browserSync.init({
    server: {
      baseDir: "./" + path.dist
    },
    open: false,
    notify: false
  });
  browserSync.watch(['app/*.html', 'app/js/**/*.js', 'app/sass/**/*.+(scss|sass)', 'app/includes/**/*.json', 'app/includes/**/*.svg']).on("change", reload);
  done();
});

gulp.task('watch', ['browserSync', 'html:compilation', 'sass:compilation', 'cssLibs:merge', 'jsLibs:merge', 'copyFavicons', 'copyFonts', 'copyJs', 'copyImages'], function () {
  gulp.watch(['app/*.html', 'app/20*/**/*.html', 'app/includes/**/*.svg'], ['html:compilation']);
  gulp.watch('app/sass/**/*.+(scss|sass)', ['sass:compilation']);
  gulp.watch('app/favicons/**/*', ['copyFavicons']);
  gulp.watch('app/fonts/**/*', ['copyFonts']);
  gulp.watch('app/js/**/*', ['copyJs']);
  gulp.watch('app/img/**/*', ['copyImages']);
});

gulp.task('default', ['watch']);
gulp.task('develop', ['cleanDist', 'default']);

/**
 * Create Production
 */

gulp.task('production', ['cleanDist', 'html:production', 'sass:production', 'cssLibs:production', 'jsLibs:merge', 'copyFavicons', 'copyFonts', 'copyJs:production', 'copyImages']);

gulp.task('cleanDist', function () {
  return del.sync([path.dist + '/']);
});

gulp.task('clearCache', function () {
  return cache.clearAll();
});