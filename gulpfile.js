"use strict";

const gulp = require('gulp');
const stylus = require('gulp-stylus');
const concat = require('gulp-concat');
const debug = require('gulp-debug');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if'); // проверка условия на этапе выполнения потоков
const del = require('del');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const mocha = require('gulp-mocha');
const babelify = require('babelify');
const glob = require('glob');
const gulp_util = require('gulp-util');
const buff = require('vinyl-buffer');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

// 1. Процессинг JS (BabelJs)
// 2. Минификация JS
// 3. Склейка JS в один бандл (gulp browserify)
gulp.task('browserify', function() {
    var files = glob.sync('frontend/**/main.js');
    return browserify({
      entries: ["frontend/**/main.js"],
      debug: true
    })    
    .transform(babelify)
    .bundle()
    .on('error', gulp_util.log)
    .pipe(source('bundle.js'))
    .pipe(buff())
    .pipe(uglify())
    .pipe(gulp.dest('public/js/browserify'));
});

// 5. Запуск unit тестов. (gulp test)
gulp.task('test', function() {
  return gulp
    .src('./test/**/*.js', {read: false})
    .pipe(mocha())
    .on('error', gulp_util.log);
});

// 6. Процессинг CSS. (.styl -> .css) + 4. map файлы (gulp styles)
gulp.task('styles', function() {
    return gulp.src('frontend/styles/*.styl')
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(stylus())
        .pipe(concat('main.css'))
        .pipe(gulpIf(isDevelopment, sourcemaps.write('.')))
        .pipe(gulp.dest('public'));
});


gulp.task('clean', function() {
    return del('public');
});

gulp.task('default', gulp.series('clean', 'browserify', 'test', 'styles')); 


// Дополнительное задание:
// gulp dev -> запуск странички в браузере - мониторинг и изменения в реальном времени (*)
gulp.task('assets', function() {
    return gulp.src('frontend/assets/**', {
            since: gulp.lastRun('assets')
        })
        .pipe(debug({
            title: 'assets'
        }))
        .pipe(gulp.dest('public'));
});

gulp.task('watchPage', function() {
    gulp.watch('frontend/js/**/*.js', gulp.series('browserify'));
    gulp.watch('frontend/styles/**/*.styl', gulp.series('styles'));
    gulp.watch('frontend/assets/**/*.*', gulp.series('assets'));    
});

gulp.task('serve', function() {
    browserSync.init({
        server: 'public'
    });
    browserSync.watch('public/**/*.*').on('change', browserSync.reload);
});

gulp.task('build', gulp.series('default', 'assets'));

gulp.task('dev',
    gulp.series('build', gulp.parallel('watchPage', 'serve')));

/* как подключить js модуль к страничке html ??? */
/*
 	FIXME
 	Составные таски (которые будут вызываться из консоли - default, dev) лучше определять в конце файла, 
    тем самым визуально отделяя внутренние таски от внешних,
 	чтобы было понятно что следует использовать при разработке.
 	Ещё один момент: пусть в html файле подключается js модуль, и вызывается функция, 
    результат работы которой пишется в консоль.
 	Например, подключить main.js, в нём вызвать функцию из модуля foo, результат - в консоль. 
    Это наглядно продемонстрирует работу watch при изменении js кода.
 	Остальные js файлы (использующиеся в шагах 1 и 2) можно удалить.
*/
