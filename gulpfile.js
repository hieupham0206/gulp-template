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
  webp = require('gulp-webp'),
  browserSync = require('browser-sync'),
  sourcemaps = require('gulp-sourcemaps')
const paths = {
  src: 'src/',
  dist: 'dist/'
}

gulp.task('html', function () {
  return gulp.src(`${paths.src}/*.html`).pipe(htmlmin({
    removeComments: true,
    collapseWhitespace: true
  })).pipe(rename({extname: '.html'})).pipe(gulp.dest(`${paths.dist}`))
})

gulp.task('styles', function () {
  return gulp.src(`${paths.src}/sass/**/[!_]*.scss`).
    pipe(sass({precision: 4}).on('error', sass.logError)).
    pipe(autoprefixer('last 2 version')).
    pipe(gulp.dest(`${paths.dist}/css/`)).
    pipe(shorthand()).
    pipe(concat('bundle.min.css')).
    pipe(sourcemaps.init()).
    pipe(cleanCss({shorthandCompacting: false})).
    pipe(sourcemaps.write()).
    pipe(gulp.dest(`${paths.dist}/css/bundle`))
})

gulp.task('uglify', function () {
  return gulp.src(`${paths.src}/js/custom/**/*.js`).
    pipe(babel()).
    pipe(gulp.dest(`${paths.dist}/js/`))
})

gulp.task('scripts', ['uglify'], function () {
  gulp.src(`${paths.src}/js/**/*.js`).pipe(gulp.dest(`${paths.dist}/js/`))
  gulp.src(`${paths.dist}/js/**/*.js`).
    pipe(concat('bundle.js')).
    pipe(insert.prepend('(function(window,document){')).
    pipe(insert.append('}(this,this.document));')).
    pipe(sourcemaps.init()).
    pipe(uglify()).
    pipe(sourcemaps.write()).
    pipe(rename({suffix: '.min'})).
    pipe(gulp.dest(`${paths.dist}/js/bundle`))

  return true;
})

gulp.task('images', function () {
  // Optimize & move
  gulp.src(`${paths.src}/img/**/*.{jpg,png,svg,gif,jpeg}`)
  // Only new stuff
    .pipe(newer(`${paths.dist}/img/`))
    // Optimize
    .pipe(imagemin())
    // Copy
    .pipe(gulp.dest(`${paths.dist}/img/`))

  // Make WebP versions or PNG & JPG
  gulp.src(`${paths.src}/img/**/*.{jpg,png,svg,gif,jpeg}`)
  // Only new stuff
    .pipe(newer(`${paths.dist}/img/webp`))
    // WebP
    .pipe(webp())
    // Publish
    .pipe(gulp.dest(`${paths.dist}/img/webp`))

  return true
})

gulp.task('browser-sync', ['styles', 'html', 'scripts', 'images'], function () {
  browserSync.init([`${paths.dist}/css/*.css`, `${paths.dist}/js/*.js`, `${paths.dist}/*.html`], {
    server: {
      baseDir: './dist/'
    }
  })
})

gulp.task('default', ['browser-sync'], function () {
  gulp.watch(`${paths.src}/sass/**/*.scss`, ['styles'])
  gulp.watch(`${paths.src}/js/**/*.js`, ['scripts'])
  gulp.watch(`${paths.src}/img/**/*.{jpg,png,svg,gif,jpeg}`, ['images'])
  gulp.watch(`${paths.src}/*.html`, ['html'])
  gulp.watch(`${paths.src}/html/**/*.html`, ['html'])
})