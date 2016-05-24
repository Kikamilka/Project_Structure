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
gulp.task('browserify', function() {
    return browserify(['frontend/js/brows/bar.js', 'frontend/js/brows/foo.js', 'frontend/js/brows/main.js'])
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('public/js/browserify'));
});

// 5. Запуск unit тестов. (gulp test)
gulp.task('lint', function() {
  return gulp
    .src(['gulpfile.js', 'src/*.js', 'test/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('inn_test', function() {
  return gulp
    .src('test/*.js')
    .pipe(mocha());
});

gulp.task('watch', function() {
    gulp.watch(['src/*.js', 'test/*.js'], gulp.series('lint'));
    gulp.watch(['src/*.js', 'test/*.js'], gulp.series('inn_test'));
});

gulp.task('test', gulp.parallel(gulp.series('lint','inn_test'), 'watch'));

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

gulp.task('main_task', gulp.series('clean', 'babel', 'compress', 'browserify', 'styles'));

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

gulp.task('build', gulp.series('clean', gulp.parallel('styles', 'assets')));

gulp.task('watchPage', function() {
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
