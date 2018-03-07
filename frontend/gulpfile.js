const sourcemaps  = require('gulp-sourcemaps');
const gulp        = require('gulp');
const gutil       = require('gulp-util');
const sass        = require('gulp-sass');
const browserSync = require('browser-sync').create();
const source      = require('vinyl-source-stream');
const buffer      = require('vinyl-buffer');
const browserify  = require('browserify');
const babelify    = require('babelify');
const url         = require('url');
const proxy       = require('proxy-middleware');

// compile the javascript bundle
gulp.task('js', () => {
	browserify('./app/js/app.js')
		.transform("babelify", {presets: ['es2015']})
		.bundle()
		.on('error', gutil.log)
		.pipe(source('bundle.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./dest/js/'))
		.pipe(browserSync.reload({ stream: true }));
});

gulp.task('res', () => {
	gulp.src('./app/resources/**/*')
		.pipe(gulp.dest('./dest/res/'));
});

// Copy html files from `app` to `dest`
gulp.task('html', () => {
	gulp.src('./app/**/*.html')
		.pipe(gulp.dest('./dest/'))
		.pipe(browserSync.reload({ stream: true }));
});

// Compile SASS to CSS
gulp.task('sass', () => {
	gulp.src('./app/scss/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./dest/css/'))
		.pipe(browserSync.reload({ stream: true }));
});

// Task for starting the dev setup and watching for changes
gulp.task('server', ['js', 'html', 'sass', 'res'], () => {
	gulp.watch('./app/js/**/*.js', ['js']);
	gulp.watch('./app/scss/**/*.scss', ['sass']);
	gulp.watch('./app/**/*.html', ['html']);

	const proxyOptions = url.parse('http://localhost:5000');
	proxyOptions.route = '/api';

	browserSync.init({
		server:  {
			baseDir: './dest/',
			middleware: [proxy(proxyOptions)]
		}
	});
});

// Build javascript, html and sass
gulp.task('build', ['js', 'html', 'sass', 'res']);

gulp.task('default', ['build']);