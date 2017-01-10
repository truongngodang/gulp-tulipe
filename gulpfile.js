
//Load in the plugins

var gulp = require('gulp'),
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

var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var mergeJson = require('gulp-merge-json');
var gulpSequence = require('gulp-sequence');
var browserSync = require('browser-sync').create();

// Bower sync
gulp.task('browser-sync', function() {
    return browserSync.init({
        server: {
            baseDir: 'dist'
        }
    });
});

//Build style
gulp.task('styles', function() {
    return sass('src/scss/main.scss', { style: 'expanded' })
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist/assets/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/assets/css'))
        .pipe(notify({ message: 'Style task complete' }))
        .pipe(browserSync.stream());
});

//Build js
gulp.task('scripts', function() {
    return gulp.src('src/scripts/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest('dist/assets/js'))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/assets/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/assets/js'))
        .pipe(notify({ message: 'scripts task complete' }));
});

//Compress Images
gulp.task('images', function() {
    return gulp.src('src/images/**/*')
        .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
        .pipe(gulp.dest('dist/assets/img'))
        .pipe(notify({ message: 'Images task complete' }));
});


//Clean up
gulp.task('clean', function() {
    return del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img']);
});

// = Build DataJson
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

// Service tasks
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
var pug = require('gulp-pug');
var fs = require('fs');
gulp.task('pug', function(done) {
    var jsonData = JSON.parse(fs.readFileSync('./tmp/data.json'));
    gulp.src('src/*.pug')
        .pipe(plumber(function(error){
            console.log("Error happend!", error.message);
            this.emit('end');
        }))
        .pipe(pug({
            pretty: true,
            locals: jsonData
        }))
        .pipe(gulp.dest('dist'))
        .on('end', done);
});

// Build html
//The default task DEV
gulp.task('html', function(cb) {
    return gulpSequence(
        'combine-data',
        'pug',
        cb
    );
});

//The default task DEV
gulp.task('dev', function(cb) {
    return gulpSequence(
        'browser-sync', 'clean', 'html', 'styles', 'scripts', 'images', 'watch',
        cb
    );
});

//Move lib bower
gulp.task('cleanlibs', function() {
    return del(['dist/libs/*', 'src/libs/*']);
});
gulp.task('movelibs', ['cleanlibs'], function(){
    gulp.src(['bower_components/*/dist/*.min.js',
        'bower_components/*/dist/*/*.min.js',
        'bower_components/*/dist/*.min.css',
        'bower_components/*/dist/*/*.min.css'])
        .pipe(gulp.dest('dist/libs'))
        .pipe(gulp.dest('src/libs'))
});

// Watch
gulp.task('watch', function() {

    // Watch .pug files
    gulp.watch(
        ['src/*/**/data/*.json', 'src/*.pug','src/*/*.pug', 'src/**/*.pug'],
        ['html', browserSync.reload]);
    // Watch .scss files
    gulp.watch('src/scss/**/*.scss', ['styles']);

    // Watch .js files
    gulp.watch('src/scripts/**/*.js', ['scripts', browserSync.reload]);

    // Watch image files
    gulp.watch('src/images/**/*', ['images']);

});