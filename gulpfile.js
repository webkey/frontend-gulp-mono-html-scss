'use strict';

var gulp             = require('gulp'),
    sass             = require('gulp-sass'),
    browserSync      = require('browser-sync').create(),
    reload           = browserSync.reload,
    concat           = require('gulp-concat'),
    uglify           = require('gulp-uglifyjs'),
    cssnano          = require('gulp-cssnano'),
    concatCss        = require('gulp-concat-css'),
    rename           = require('gulp-rename'),
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
    stripCssComments = require('gulp-strip-css-comments'),
    removeEmptyLines = require('gulp-remove-empty-lines'),
    revts            = require('gulp-rev-timestamp'),
    beautify         = require('gulp-beautify'),
    index            = require('gulp-index'); // Для создания списка страниц https://www.npmjs.com/package/gulp-index

/**
 * @description Относительный путь
 * @type {{dist: string}}
 */
var path = {
  'dist': 'dist'
};

/**
 * @description Таск формирует ДОМ страниц
 */
gulp.task('htmlCompilation', function () {
  return gulp.src(['src/__*.html'])
      .pipe(fileinclude({
        filters: {
          markdown: markdown.parse
        }
      }))
      .pipe(rename(function (path) {
        path.basename = path.basename.substr(2);
      }))
      .pipe(htmlbeautify({
        // "indent_with_tabs": true,
        "indent_size": 2,
        "max_preserve_newlines": 0
      }))
      .pipe(gulp.dest('./src/'));
});

/**
 * @description Таск создает список всех страниц
 */
gulp.task('html:buildAllPages', ['htmlCompilation'], function () {
  var pref = "all-pages";
  return gulp.src(['!src/all-pages.html', '!src/__*.html', '!src/~*.html', '!src/_tpl_*.html', '!src/_temp_*.html', './src/*.html'])
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
        // "indent_with_tabs": true,
        "indent_size": 2,
        "max_preserve_newlines": 0
      }))
      .pipe(gulp.dest('./src/'));
});

/**
 * @description Таск для переноса normalize
 */
gulp.task('normalize', function () {
  return gulp.src('node_modules/normalize-scss/sass/**/*.+(scss|sass)')
      .pipe(stripCssComments())
      .pipe(gulp.dest('src/_temp/'));
});

/**
 * @description Таск преобразует sass в css
 */
gulp.task('sassCompilation', ['normalize'], function () {
  return gulp.src('src/sass/**/*.+(scss|sass)')
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'expanded', // nested (default), expanded, compact, compressed
        // indentType: 'tab',
        indentType: 'space',
        // indentWidth: 1,
        indentWidth: 2,
        precision: 3,
        linefeed: 'lf' // cr, crlf, lf or lfcr
      }).on('error', sass.logError))
      .pipe(replace('../../', '../'))
      .pipe(replace('@charset "UTF-8";', ''))
      .pipe(autoprefixer([
        'last 5 versions', '> 1%', 'ie >= 9', 'and_chr >= 2.3' //, 'ie 8', 'ie 7'
      ], {
        cascade: true
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./src/css'))
      .pipe(browserSync.reload({
        stream: true
      }));
});

/**
 * @description Таск для мержа css библиотек
 */
gulp.task('mergeCssLibs', function () {
  return gulp.src([
    'node_modules/select2/dist/css/select2.min.css'
  ])
      .pipe(concatCss("src/css/libs.css", {
        rebaseUrls: false
      }))
      .pipe(gulp.dest('./'))
      .pipe(cssnano())
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('./'));
});

/**
 * @description Таск для формирования кастомного modernizr
 */
gulp.task('createCustomModernizr', function (done) {
  modernizr.build(config, function (code) {
    fs.writeFile('src/js/modernizr.min.js', code, done);
  });
});

/**
 * @description Таск для мераж js библиотек
 */
gulp.task('copyLibsScriptsToJs', ['copyJqueryToJs'], function () {
  return gulp.src([
    'node_modules/jquery-validation/dist/jquery.validate.min.js' // валидация форм
    , 'node_modules/select2/dist/js/select2.full.min.js' // кастомный селект
    , 'node_modules/select2/dist/js/i18n/ru.js' // локализация для кастомного селекта
    , 'node_modules/object-fit-images/dist/ofi.min.js' // object-fit fix for non-support browsers
  ])
      .pipe(concat('libs.js'))
      .pipe(gulp.dest('src/js'))
      .pipe(rename({suffix: '.min'}))
      .pipe(uglify())
      .pipe(gulp.dest('src/js'));
});

/**
 * @description Таск для копирования jquery в js папку
 */
gulp.task('copyJqueryToJs', function () {
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js'
  ])
      .pipe(gulp.dest('src/js'));
});

/**
 * @description Таск browserSync
 */
gulp.task('browserSync', function (done) {
  browserSync.init({
    server: {
      baseDir: "./src"
    },
    open: false,
    notify: false
  });
  browserSync.watch(['src/*.html', 'src/js/**/*.js', 'src/includes/**/*.json', 'src/includes/**/*.svg']).on("change", browserSync.reload);
  done();
});

/**
 * @description Таск наблюдения за изменением файлов
 */
gulp.task('watch', ['createCustomModernizr', 'browserSync', 'html:buildAllPages', 'sassCompilation', 'mergeCssLibs', 'copyLibsScriptsToJs'], function () {
  gulp.watch(['src/_tpl_*.html', 'src/__*.html', 'src/includes/**/*.json', 'src/includes/**/*.html', 'src/includes/**/*.svg'], ['html:buildAllPages']);
  gulp.watch('src/sass/**/*.+(scss|sass)', ['sassCompilation']);
});

/**
 * @description Таск watch определяем как дефолтный
 */
gulp.task('default', ['watch']);


/************************************************************
 * Create Distribution folder and move files to it
 ************************************************************/

/**
 * @description Копирование изображений в папку релиза
 */
gulp.task('copyImgToDist', function () {
  return gulp.src('src/img/**/*')
      .pipe(cache(imagemin({
        interlaced: true,
        progressive: true,
        // svgoPlugins: [{removeViewBox: false}],
        optimizationLevel: 7, //степень сжатия от 0 до 7
        use: [pngquant()]
      })))
      .pipe(gulp.dest(path.dist + '/img'));
});

/**
 * @description Таск для компиляции sass файлов без мапинга. Специально для релизной версии
 */
gulp.task('sassCompilationForDist', function () {
  return gulp.src('src/sass/**/*.+(scss|sass)')
      .pipe(sass({
        outputStyle: 'expanded',
        indentType: 'space',
        indentWidth: 2,
        precision: 3,
        linefeed: 'lf'
      }).on('error', sass.logError))
      .pipe(replace('../../', '../'))
      .pipe(replace('@charset "UTF-8";', ''))
      .pipe(autoprefixer([
        'last 5 versions', '> 1%', 'ie >= 9', 'and_chr >= 2.3'
      ], {
        cascade: true
      }))
      // .pipe(removeEmptyLines())
      .pipe(cssnano())
      .pipe(gulp.dest(path.dist + '/css'))
});

/**
 * @description Перенос файлов в папку релиза
 */
gulp.task('buildDist', ['cleanDist', 'html:buildAllPages', 'copyImgToDist', 'sassCompilationForDist', 'mergeCssLibs', 'createCustomModernizr', 'copyLibsScriptsToJs'], function () {

  gulp.src(['src/ajax/**/*'])
      .pipe(gulp.dest(path.dist + '/ajax'));

  gulp.src(['src/video/**/*'])
      .pipe(gulp.dest(path.dist + '/video'));

  gulp.src('src/fonts/**/*')
      .pipe(gulp.dest(path.dist + '/fonts'));

  gulp.src('src/js/common.js')
      .pipe(strip({
        safe: true,
        ignore: /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\//g // Не удалять /**...*/
      }))
      // .pipe(removeEmptyLines())
      // .pipe(beautify({
      //   // "indent_with_tabs": true,
      //   "indent_size": 2,
      //   "space_after_anon_function": true,
      //   "max_preserve_newlines": 2
      // }))
      .pipe(uglify())
      .pipe(gulp.dest(path.dist + '/js'));

  gulp.src(['!src/css/temp/**/*.css', '!src/css/temp/**/~*.css', '!src/css/**/_temp_*.css', '!src/css/main.css', '!src/css/libs.css', 'src/css/*.css'])
      .pipe(gulp.dest(path.dist + '/css'));

  gulp.src(['!src/js/temp/**/*.js', '!src/js/temp/**/~*.js', '!src/js/**/_temp_*.js', '!src/js/libs.js', '!src/js/common.js', 'src/js/*.js'])
      .pipe(gulp.dest(path.dist + '/js'));

  gulp.src('src/assets/**/*')
      .pipe(gulp.dest(path.dist + '/assets'));

  gulp.src(['!src/__*.html', '!src/~*.html', '!src/_tpl_*.html', '!src/typography.html', '!src/forms.html', '!src/all-pages.html', '!src/_temp_*.html', 'src/*.html'])
      .pipe(revts()) // Добавить версии подключаемых файлов. В html добавить ключ ?rev=@@hash в место добавления версии
      .pipe(gulp.dest(path.dist));

  gulp.src(['src/*.png', 'src/*.jpg', 'src/*.ico', 'src/.htaccess', 'src/*.webmanifest', 'src/*.json'])
      .pipe(gulp.dest(path.dist));

});

/**
 * @description Таск удаления релизной папки
 */
gulp.task('cleanDist', function () {
  return del.sync([path.dist + '/']);
});

/**
 * @description Таск очистки кэша
 */
gulp.task('clearCache', function () {
  return cache.clearAll();
});