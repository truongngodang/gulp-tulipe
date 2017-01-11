//Load in the plugins

const gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    del = require('del');

const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const mergeJson = require('gulp-merge-json');
const gulpSequence = require('gulp-sequence');
const browserSync = require('browser-sync').create();
const pug = require('gulp-pug');
const fs = require('fs');

// Bower sync
gulp.task('browser-sync', function () {
    return browserSync.init({
        server: {
            baseDir: 'dist'
        }
    });
});

//Clean up
gulp.task('clean', function () {
    return del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img']);
});

//Build style
gulp.task('styles', function () {
    return sass('src/scss/main.scss', {style: 'expanded'})
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist/assets/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/assets/css'))
        .pipe(browserSync.stream());
});

//Build js
gulp.task('scripts', function () {
    return gulp.src('src/scripts/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest('dist/assets/js/modules'))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/assets/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(browserSync.stream());
});

//Compress Images
gulp.task('image-min', function () {
    return gulp.src('src/images/**/*')
        .pipe(imagemin({optimizationLevel: 3, progressive: true, interlaced: true}))
        .pipe(gulp.dest('dist/assets/img'));
});

//Compine Images
gulp.task('images', function () {
    return gulp.src('src/images/**/*')
        .pipe(gulp.dest('dist/assets/img'));
});

//Compine fonts
gulp.task('fonts', function () {
    return gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/assets/fonts'));
});

// Build DataJson
gulp.task('combine-modules-json', function () {
    return gulp.src(['**/*.json', '!**/_*.json'], {cwd: 'src/*/**/data'})
        .pipe(mergeJson('data-json.json'))
        .pipe(gulp.dest('tmp/data'));
});

gulp.task('combine-modules-data', function () {
    return gulp.src('**/*.json', {cwd: 'tmp/data'})
        .pipe(mergeJson('data.json'))
        .pipe(gulp.dest('tmp'));
});

gulp.task('combine-data', function (cb) {
    return gulpSequence(
        [
            'combine-modules-json'
        ],
        'combine-modules-data',
        cb
    );
});

// Build pug
gulp.task('pug', function (done) {
    const jsonData = JSON.parse(fs.readFileSync('./tmp/data.json'));
    gulp.src('src/*.pug')
        .pipe(plumber(function (error) {
            console.log("Error happend!", error.message);
            this.emit('end');
        }))
        .pipe(pug({
            pretty: true,
            locals: jsonData
        }))
        .pipe(gulp.dest('dist'))
        .on('end', done)
        .pipe(browserSync.stream());
});

// Build html
gulp.task('html', function (cb) {
    return gulpSequence(
        'combine-data',
        'pug',
        cb
    );
});

//The default task DEV
gulp.task('dev', function (cb) {
    return gulpSequence(
        'clean', 'html', 'styles', 'scripts', 'images', 'browser-sync', 'watch',
        cb
    );
});

//Move lib bower
gulp.task('cleanlib', function () {
    return del(['dist/library/*']);
});
gulp.task('movelib', ['cleanlib'], function () {
    gulp.src(['bower_components/*/dist/**'])
        .pipe(gulp.dest('dist/library'))
});

// Watch
gulp.task('watch', function () {

    // Watch .pug files
    gulp.watch(
        ['src/*/**/data/*.json', 'src/*.pug', 'src/*/*.pug', 'src/**/*.pug'],
        ['html']);
    // Watch .scss files
    gulp.watch('src/scss/**/*.scss', ['styles']);

    // Watch .js files
    gulp.watch('src/scripts/**/*.js', ['scripts']);

    // Watch image files
    gulp.watch('src/images/**/*', ['images']);

});