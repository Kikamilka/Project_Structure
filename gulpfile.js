'use strict'

const gulp = require('gulp');
const stylus = require('gulp-stylus');
const concat = require('gulp-concat');
const debug = require('gulp-debug');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if'); // проверка условия на этапе выполнения потоков
const del = require('del');
const browserSync = require('browser-sync').create();
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const generateSuite = require("gulp-mocha-browserify-suite");
const mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

// 1. Процессинг JS (BabelJs) (gulp babel)
gulp.task('babel', function() {
    return gulp.src('frontend/js/example.js')
        .pipe(babel())
        .pipe(gulp.dest('public/js'));
});

// 2. Минификация JS + 4.создание map файлов (gulp compress)
gulp.task('compress', function() {
    return gulp.src('frontend/js/test_ugl.js')
        .pipe(gulpIf(isDevelopment, sourcemaps.init())) // file.sourceMap (пустая)
        .pipe(uglify())
        .pipe(gulpIf(isDevelopment, sourcemaps.write('./maps'))) // итоговая map - для разработки лучше когда внутри самого файла находится
        .pipe(gulp.dest('public/js/compress'));
});

// 3. Склейка JS в один бандл (gulp browserify)
gulp.task('browserify', function() { // FIXME browserify при должной настройке может сам выполнить обработку через babeljs, минификацию и создание map файлов, отдельные таски для этого не нужны
    return browserify(['frontend/js/brows/bar.js', 'frontend/js/brows/foo.js', 'frontend/js/brows/main.js']) // FIXME достаточно указать главный файл
        .bundle() // FIXME добавить обработку ошибок (вместо стектрейса пусть выводится текст ошибки)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('public/js/browserify'));
});
/*
 	FIXME временные файлы лучше класть во временную директорию (к примеру, /temp). В директории /public/js должен лежать js файл (бандл) из шага 3,
 	а я наблюдаю там временные файлы из шагов 1 и 2. К тому же, создание временных файлов без особой необходимости не вписывается в идеологию gulp.
 	Как я указал выше, данную цепочку преобразований можно произвести, используя browserify + соответствующие плагины. Либо тогда не использовать browserify,
 	но делать всё в одном таске через pipe (тогда придётся подсуетиться на тему склейки модулей для использования в браузере).
*/

// 5. Запуск unit тестов. (gulp test)
gulp.task('lint', function() {
  return gulp
    .src(['gulpfile.js', 'src/*.js', 'test/*.js']) // FIXME дочерние директории игнорирутся (подобная проблема встречается и в других частях файла, я не стал помечать остальные места, попробуй найти их все :))
    .pipe(jshint()) // FIXME jshint ругается на ES6
    .pipe(jshint.reporter('default'));
});

gulp.task('inn_test', function() { // FIXME таскам лучше давать понятные имена
  return gulp
    .src('test/*.js')
    .pipe(mocha()); // FIXME сделать вывод тестов более красивым (без страшных стектрейсов)
});

gulp.task('watch', function() {
    gulp.watch(['src/*.js', 'test/*.js'], gulp.series('lint')); // FIXME можно объединить эти строки в одну?
    gulp.watch(['src/*.js', 'test/*.js'], gulp.series('inn_test'));
});

gulp.task('test', gulp.parallel(gulp.series('lint','inn_test'), 'watch')); // FIXME неплохо бы разбить на выполнение тестов и watch: я хочу иметь возможность прогнать тесты единожды, без запуска watch

// 6. Процессинг CSS. (.styl -> .css) + map файлы (gulp styles)
gulp.task('styles', function() {
    return gulp.src('frontend/styles/*.styl')
        .pipe(gulpIf(isDevelopment, sourcemaps.init())) // file.sourceMap (пустая)
        .pipe(stylus())
        .pipe(concat('main.css'))
        .pipe(gulpIf(isDevelopment, sourcemaps.write('.'))) // итоговая map - для разработки лучше когда внутри самого файла находится
        .pipe(gulp.dest('public'));
});


gulp.task('clean', function() {
    return del('public');
});

gulp.task('main_task', gulp.series('clean', 'babel', 'compress', 'browserify', 'styles')); // FIXME здесь подойдёт название "default"

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

gulp.task('build', gulp.series('clean', gulp.parallel('styles', 'assets'))); // FIXME а компиляция js не относится к build?

gulp.task('watchPage', function() { // FIXME а отслеживание js файлов?
    // наблюдает за изменениями в файле styles и сразу все пересобирается
    gulp.watch('frontend/styles/**/*.* ', gulp.series('styles'));
    gulp.watch('frontend/assets/**/*.*', gulp.series('assets'));
});

gulp.task('serve', function() {
    browserSync.init({
        server: 'public'
    });
    browserSync.watch('public/**/*.*').on('change', browserSync.reload);
});

gulp.task('dev',
    gulp.series('build', gulp.parallel('watchPage', 'serve'))
		 );

/*
 	FIXME
 	Составные таски (которые будут вызываться из консоли - default, dev) лучше определять в конце файла, тем самым визуально отделяя внутренние таски от внешних,
 	чтобы было понятно что следует использовать при разработке.
 	Ещё один момент: пусть в html файле подключается js модуль, и вызывается функция, результат работы которой пишется в консоль.
 	Например, подключить main.js, в нём вызвать функцию из модуля bar, результат - в консоль. Это наглядно продемонстрирует работу watch при изменении js кода.
*/
