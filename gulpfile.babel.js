/* eslint-env node */
/* global require */

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import bs from 'browser-sync';
import del from 'del';
import runSequence from 'run-sequence';
import browserify from 'browserify';
import babelify from 'babelify';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import eslint from 'gulp-eslint';
import jsdoc from 'gulp-jsdoc3';
import stylelint from 'gulp-stylelint';
import mocha from 'gulp-mocha';
import istanbul from 'gulp-babel-istanbul';
import coveralls from 'gulp-coveralls';
import util from 'gulp-util';
import preprocessify from 'preprocessify';
import version from './tools/version';
import config from './tools/config';


util.log(version.copyright);

const browserSync = bs.create();
const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const uglify = require('gulp-uglify-es').default;

const dev = true;

gulp.task('styles', () => {
  gulp.src(config.styles.src)
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.'],
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(gulp.dest(config.styles.tmpdst))
    .pipe(reload({ stream: true }));
});

gulp.task('scripts', () => {
  const b = browserify({
    entries: 'app/scripts/main.js',
    transform: babelify,
    debug: true,
  });

  return b.transform(preprocessify, {
    includeExtensions: ['.js'],
    context: { 'PACKAGE_VERSION': version.combined }
  })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe($.plumber())
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(config.scripts.tmpdst))
    .pipe(reload({ stream: true }));
});

gulp.task('lint', done =>
  runSequence('lint:css', 'lint:js', done));

gulp.task('lint:js', () =>
  gulp.src(['*.js', 'app/scripts/**/*.js', 'test/**/*.js', 'lib/scripts/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('lint:css', () =>
  gulp.src(['src/**/*.scss'])
    .pipe(stylelint({
      reporters: [
        { formatter: 'string', console: true },
      ],
    })));

gulp.task('test', () =>
  gulp.src(config.test.src, { read: false })
    .pipe(mocha({ require: 'babel-core/register' })));

gulp.task('test:cover', ['test:cover-hook'], () =>
  gulp.src(config.test.src)
    .pipe(mocha({ require: 'babel-core/register' }))
    .pipe(istanbul.writeReports({
      dir: config.cover.dst,
      includeAllSources: true,
      reporters: ['lcov', 'json', 'text-summary'],
      reportOpts: { dir: config.cover.dst },
    })));

gulp.task('test:cover-hook', () =>
  gulp.src(config.cover.src)
    .pipe(istanbul({ includeUntested: true }))
    .pipe(istanbul.hookRequire()));

gulp.task('test:coveralls', () =>
  gulp.src(config.cover.dst.concat('lcov.info'))
    .pipe(coveralls()));

gulp.task('test:e2e', ['clean:e2e'], () =>
  gulp.src(config.e2e.src, { read: false })
    .pipe(mocha({ require: 'babel-core/register', timeout:55000 })));

const NEED_CONSOLE_LOGS_BUILD = true;

const uglifyConfig = {
  output: {
    comments: /copyright/i,
  },
  compress: {
    drop_console: !NEED_CONSOLE_LOGS_BUILD,
    global_defs: { // eslint-disable-line camelcase
      DEBUG: NEED_CONSOLE_LOGS_BUILD,
      PACKAGE_VERSION: version.combined,
    }
  }
};


gulp.task('html', ['styles', 'scripts'], () => {
  gulp.src('app/*.html')
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.if(/\.js$/, uglify(uglifyConfig)))
    .pipe($.if(/\.css$/, $.cssnano({ safe: true, autoprefixer: false })))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: { compress: { drop_console: true } },
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('data', () => {
  gulp.src(config.data.src)
    .pipe(gulp.dest(config.data.tmpdst));
});

gulp.task('build:data', () => {
  gulp.src(config.data.src)
    .pipe(gulp.dest(config.data.distdst));
});

gulp.task('images', () => {
  gulp.src(config.images.src)
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest(config.images.tmpdst));
});
gulp.task('build:images', () => {
  gulp.src(config.images.src)
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest(config.images.distdst));
});

gulp.task('fonts', () => {
  gulp.src(config.fonts.src)
    .pipe(gulp.dest(config.fonts.tmpdst));
});
gulp.task('build:fonts', () => {
  gulp.src(config.fonts.src)
    .pipe(gulp.dest(config.fonts.distdst));
});

gulp.task('shaders', () => {
  gulp.src(config.shaders.src)
    .pipe(gulp.dest(config.shaders.tmpdst));
});

gulp.task('build:shaders', () => {
  gulp.src(config.shaders.src)
    .pipe(gulp.dest(config.shaders.distdst));
});

gulp.task('extras', () => {
  gulp.src(['app/*.*', '!app/*.html'], { dot: true }).pipe(gulp.dest('dist'));
});

gulp.task('clean', ['clean:docs', 'clean:dist', 'clean:cover', 'clean:e2e']);

gulp.task('clean:docs', () => {
  del(['docs/auto/']);
});

gulp.task('clean:dist', () => {
  del(['dist/*']);
});

gulp.task('clean:cover', () => {
  del(['coverage/*']);
});

gulp.task('clean:e2e', () => {
  del(['test/e2e/mismatch/*.png', 'test/e2e/mismatch/*.html']);
});

gulp.task('serve', () => {
  runSequence(['clean'], ['styles', 'scripts', 'images', 'data', 'shaders', 'fonts'], () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app'],
      },
    });

    gulp.watch([
      'app/*.html',
      config.images.src,
      config.shaders.src,
      config.data.src,
    ]).on('change', reload);

    gulp.watch(config.styles.src, ['styles']);
    gulp.watch(config.scripts.src, ['scripts']);
    gulp.watch('tools/*.js', ['scripts']);
    gulp.watch(config.data.src, ['data']);
    gulp.watch(config.images.src, ['images']);
    gulp.watch(config.shaders.src, ['shaders']);
  });
});

gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist'],
    },
  });
});

gulp.task('serve:test', ['scripts'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': config.scripts.tmpdst,
      },
    },
  });

  gulp.watch(config.scripts.src, ['scripts']);
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

gulp.task('docs', ['clean:docs'], (done) => {
  gulp.src(config.jsdocConfig.source, { read: false })
    .pipe(jsdoc(config.jsdocConfig, done));
});


gulp.task('build', ['lint', 'html', 'extras', 'build:images', 'build:data', 'build:shaders', 'build:fonts'], () => {
  gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
});

gulp.task('default', (done) => {
  runSequence('lint', 'test:cover', ['docs', 'build'], done);
});
