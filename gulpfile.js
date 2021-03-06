//Load in the plugins

const gulp = require('gulp'),
    sass = require('gulp-sass'),
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

var errorHandler = function() {
    return plumber(function(error){
        var msg = error.codeFrame.replace(/\n/g, '\n    ');

        gutil.log('|- ' + gutil.colors.bgRed.bold('Build Error in ' + error.plugin));
        gutil.log('|- ' + gutil.colors.bgRed.bold(error.message));
        gutil.log('|- ' + gutil.colors.bgRed.regular('>>>'));
        gutil.log('|\n    ' + msg + '\n           |');
        gutil.log('|- ' + gutil.colors.bgRed.regular('<<<'));
    });
};

var prettify = require('gulp-html-prettify');

var options = {
    htmlPrettify: {
        'indent_size': 4,
        'unformatted': ['pre', 'code'],
        'indent_with_tabs': false,
        'preserve_newlines': true,
        'brace_style': 'expand',
        'end_with_newline': true
    }
};

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
    return del(['dist/*.html', 'dist/assets/css', 'dist/assets/js', 'dist/assets/img']);
});

//Build style
var sourcemaps = require('gulp-sourcemaps');
gulp.task('styles', function () {
    return gulp.src('src/scss/main.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist/assets/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/assets/css'))
        .pipe(browserSync.stream());
});

//Build js
gulp.task('scripts', function () {
    return gulp.src('src/scripts/**/*.js')
        .pipe(plumber(function (error) {
            console.log("Error happend!", error.message);
            this.emit('end');
        }))
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest('dist/assets/js/modules'))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/assets/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify());
});

//Compress Images
gulp.task('image-min', function () {
    return gulp.src('src/images/**/*')
        .pipe(plumber(function (error) {
            console.log("Error happend!", error.message);
            this.emit('end');
        }))
        .pipe(imagemin({optimizationLevel: 3, progressive: true, interlaced: true}))
        .pipe(gulp.dest('dist/assets/img'));
});

//Compine Images
gulp.task('images', function () {
    return gulp.src('src/images/**/*')
        .pipe(plumber(function (error) {
            console.log("Error happend!", error.message);
            this.emit('end');
        }))
        .pipe(gulp.dest('dist/assets/img'));
});

//Compine fonts
gulp.task('fonts', function () {
    return gulp.src('src/fonts/**/*')
        .pipe(plumber(function (error) {
            console.log("Error happend!", error.message);
            this.emit('end');
        }))
        .pipe(gulp.dest('dist/assets/fonts'));
});

// Build DataJson
gulp.task('combine-modules-json', function () {
    return gulp.src(['**/*.json', '!**/_*.json'], {cwd: 'src/*/**/data'})
        .pipe(plumber(function (error) {
            console.log("Error happend!", error.message);
            this.emit('end');
        }))
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
});

// html prety
gulp.task('build-html', function () {
   return gulp.src('dist/*.html')
       .pipe(prettify(options.htmlPrettify))
       .pipe(gulp.dest('dist'));
});

// Build html
gulp.task('html', function (cb) {
    return gulpSequence(
        'combine-data',
        'pug',
        'build-html',
        cb
    );
});

//Move lib bower
gulp.task('cleanlib', function () {
    return del(['dist/library/*']);
});
gulp.task('movelib', ['cleanlib'], function () {
    gulp.src(['bower_components/*/dist/**', 'bower_components/*/css/**', 'bower_components/*/fonts/**'])
        .pipe(gulp.dest('dist/library'))
});

// Watch
gulp.task('watch', function () {

    // Watch .pug files
    gulp.watch(
        ['src/*/**/data/*.json', 'src/*.pug', 'src/*/*.pug', 'src/**/*.pug'],
        ['html', browserSync.reload]);
    // Watch .scss files
    gulp.watch('src/scss/**/*.scss', ['styles']);

    // Watch .js files
    gulp.watch('src/scripts/**/*.js', ['scripts', browserSync.reload]);

    // Watch image files
    gulp.watch('src/images/**/*', ['images', browserSync.reload]);

});

//The default task build
gulp.task('build', function (cb) {
    return gulpSequence(
        'clean', 'styles', 'scripts', 'images', 'html',
        cb
    );
});

gulp.task('dev', function (cb) {
    return gulpSequence(
        'build',
        [
            'browser-sync',
            'watch'
        ],
        cb
    );
});