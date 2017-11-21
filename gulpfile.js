const gulp = require('gulp'),
  babel = require('gulp-babel'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  cleanCss = require('gulp-clean-css'),
  shorthand = require('gulp-shorthand'),
  rename = require('gulp-rename'),
  insert = require('gulp-insert'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  htmlmin = require('gulp-htmlmin'),
  newer = require('gulp-newer'),
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp')
const paths = {
    src: 'src/',
    dist: 'dist/'
}

gulp.task('html', function () {
    'use strict'
    return gulp.src(`${paths.src}/*.html`).pipe(htmlmin({
        removeComments: true,
        collapseWhitespace: true
    })).pipe(rename({extname: '.html'})).pipe(gulp.dest(`${paths.dist}`))
})

gulp.task('styles', function () {
    return gulp.src(`${paths.src}/sass/*.scss`).
      pipe(sass({
          precision: 4
      }).on('error', sass.logError)).
      pipe(autoprefixer('last 2 version')).
      pipe(gulp.dest(`${paths.dist}/css/`)).
      pipe(rename({suffix: '.min'})).
      pipe(shorthand()).
      pipe(cleanCss({
          shorthandCompacting: false // it was merging rems over pixels
      })).
      pipe(gulp.dest(`${paths.dist}/css/`))
})

gulp.task('uglify', function () {
    return gulp.src(`${paths.src}/js/*.js`).pipe(babel()).pipe(gulp.dest(`${paths.dist}/js/`))
})

gulp.task('scripts', ['uglify'], function () {
    'use strict'
    return gulp.src(`${paths.dist}/js/*.js`).
      pipe(concat('bundle.js')).
      pipe(insert.prepend('(function(window,document){')).
      pipe(insert.append('}(this,this.document));')).
      pipe(uglify()).
      pipe(rename({suffix: '.min'})).
      pipe(gulp.dest(`${paths.dist}/js/bundle`))
})

gulp.task('images', function () {
    // Optimize & move
    gulp.src(`${paths.src}/img/*.{jpg,png,svg,gif,jpeg}`)
    // Only new stuff
      .pipe(newer(`${paths.dist}/img/`))
      // Optimize
      .pipe(imagemin())
      // Copy
      .pipe(gulp.dest(`${paths.dist}/img/`))

    // Make WebP versions or PNG & JPG
    gulp.src(`${paths.src}/img/*.{jpg,png,svg,gif,jpeg}`)
    // Only new stuff
      .pipe(newer(`${paths.dist}/img/webp`))
      // WebP
      .pipe(webp())
      // Publish
      .pipe(gulp.dest(`${paths.dist}/img/webp`))
    return true
})

gulp.task('default', function() {
    gulp.watch(`${paths.src}/sass/*.scss`, ['styles']);
    gulp.watch(`${paths.src}/js/*.js`, ['scripts']);
    gulp.watch(`${paths.src}/img/*.{jpg,png,svg,gif,jpeg}`, ['images']);
    gulp.watch(`${paths.src}/templates/*.html`, ['html']);
});