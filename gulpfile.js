const gulp = require('gulp'),
	babel = require('gulp-babel'),
	sass = require('gulp-dart-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	cleanCss = require('gulp-clean-css'),
	shorthand = require('gulp-shorthand'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify'),
	htmlmin = require('gulp-htmlmin'),
	newer = require('gulp-newer'),
	imagemin = require('gulp-imagemin'),
	webp = require('gulp-webp'),
	browserSync = require('browser-sync'),
	sourcemaps = require('gulp-sourcemaps'),
	del = require('del'),
	{networkInterfaces} = require('os'),
	rollup = require("gulp-better-rollup"),

	{nodeResolve} = require('@rollup/plugin-node-resolve'),
	commonjs = require('@rollup/plugin-commonjs'),
	{ terser } = require('rollup-plugin-terser')

const paths = {
	src: './src',
	dist: './dist',
}

gulp.task('html', function() {
	return gulp.src(`${paths.src}/html/**/*.html`).
		pipe(htmlmin({
			removeComments: true,
			collapseWhitespace: true,
			removeEmptyAttributes: true,
		})).
		pipe(gulp.dest(`${paths.dist}`))
})

gulp.task('clean', function(cb) {
	return del([`${paths.dist}/css`, `${paths.dist}/js`, `${paths.dist}/img`, `${paths.dist}/fonts`], cb)
})

gulp.task('styles', function() {
	// compile sass file
	return gulp.src(`${paths.src}/styles/sass/**/[!_]*.scss`).
		pipe(sourcemaps.init()).
		pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError)).
		pipe(autoprefixer('last 2 version')).
		pipe(shorthand()).
		pipe(cleanCss({
			mergeIntoShorthands: false,
			level: 2,
		})).
		pipe(rename({suffix: '.min'})).
		pipe(gulp.dest(`${paths.dist}/css/`)).
		pipe(sourcemaps.write()).
		pipe(browserSync.stream())
})

gulp.task('scripts', function() {
	return gulp.src(`${paths.src}/js/**/[!_]*.js`).
		pipe(rollup({
			plugins: [babel(), nodeResolve(), commonjs(), terser()]
		},{
			format: "iife",
		})).
		// pipe(sourcemaps.init()).
		// pipe(terser()).
		pipe(uglify()).
		// pipe(sourcemaps.write()).
		pipe(rename({suffix: '.min'})).
		pipe(gulp.dest(`${paths.dist}/js/`))
})

gulp.task('copy-src', function(done) {
	//copy toàn bộ file js từ src -> dist
	gulp.src(`${paths.src}/js/libs/**/*.js`).pipe(gulp.dest(`${paths.dist}/js/libs/`))

	//copy toàn bộ file css từ src -> dist

	gulp.src(`${paths.src}/styles/css/**/*.css`).pipe(gulp.dest(`${paths.dist}/css/`))
	//copy toàn bộ file font từ src -> dist
	gulp.src(`${paths.src}/fonts/**/*.{ttf,otf}`).pipe(gulp.dest(`${paths.dist}/fonts/`))

	//copy toàn bộ file video từ src -> dist
	gulp.src(`${paths.src}/videos/**/*.mp4`).pipe(gulp.dest(`${paths.dist}/videos/`))

	done()
})

gulp.task('images', function(done) {
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

	done()
})

gulp.task('watch', gulp.series('copy-src', gulp.parallel('styles', 'html', 'scripts', 'images'), () => {

	const nets = networkInterfaces()
	const results = Object.create(null) // Or just '{}', an empty object

	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			// Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
			if (net.family === 'IPv4' && !net.internal) {
				if (!results[name]) {
					results[name] = []
				}
				results[name].push(net.address)
			}
		}
	}

	browserSync.init([`${paths.dist}/css/*.css`, `${paths.dist}/js/*.js`, `${paths.dist}/*.html`], {
		server: {
			baseDir: './dist',
		},
		host: results ? results['Wi-Fi'][0] : '',
		browser: [],
		injectChanges: false,
		ghostMode: true,
		notify: false,
	})

	gulp.watch(`${paths.src}/styles/sass/**/*.scss`, gulp.series('styles')).on('change', browserSync.reload)

	gulp.watch(`${paths.src}/js/**/*.js`, gulp.series('scripts')).on('change', browserSync.reload)

	gulp.watch(`${paths.src}/img/**/*.{jpg,png,svg,gif,jpeg}`, gulp.series('images'))

	gulp.watch([`${paths.src}/html/**/*.html`], gulp.series('html')).on('change', browserSync.reload)
}))

gulp.task('prod', gulp.series('clean', 'copy-src', gulp.parallel('styles', 'html', 'scripts', 'images'), done => {
	done()
}))

gulp.task('dev', gulp.series('copy-src', gulp.parallel('styles', 'html', 'scripts', 'images'), done => {
	done()
}))

gulp.task('default', gulp.series('watch'))