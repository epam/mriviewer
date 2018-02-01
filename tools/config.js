/* eslint-env node */

export default {
  styles: {
    src: 'app/styles/*.scss',
    tmpdst: '.tmp/styles',
    distdst: 'dist/styles',
  },
  scripts: {
    src: [
      'app/scripts/*.js',
      'app/scripts/**/*.js',
      'lib/scripts/*.js',
      'lib/scripts/**/*.js',
    ],
    tmpdst: '.tmp/scripts',
    distdst: 'dist/scripts',
  },
  shaders: {
    src: 'app/shaders/*.glsl',
    tmpdst: '.tmp/shaders',
    distdst: 'dist/shaders',
  },
  images: {
    src: 'app/images/*.*',
    tmpdst: '.tmp/images',
    distdst: 'dist/images',
  },
  fonts: {
    src: [
      'node_modules/bootstrap/dist/fonts/*.+(ttf|woff|woff2|svg|eot)',
      'node_modules/font-awesome/fonts/*.+(ttf|woff|woff2|svg|eot)',
      'node_modules/font-awesome/fonts/FontAwesome.otf',
    ],
    tmpdst: '.tmp/fonts',
    distdst: 'dist/fonts',
  },
  data: {
    src: 'app/data/*.*',
    tmpdst: '.tmp/data',
    distdst: 'dist/data',
    onloadsrc: '', // 'data/lungs.ktx',
  },
  jsdocConfig: {
    source: [
      'README.md',
      './app/scripts/**/*.js',
      './lib/scripts/**/*.js',
      '!app/scripts/__mmm.js',
    ],
    opts: {
      template: './docs/template',
      tutorials: './docs/tutorials',
      destination: './docs/auto',
      private: false,
    },
    plugins: [
      'plugins/underscore',
      'plugins/markdown',
      'node_modules/jsdoc-export-default-interop/dist/index',
    ],
    templates: {
      default: {
        outputSourceFiles: false,
        staticFiles: {
          include: [
            'node_modules/jsdoc/templates/default/static',
            'docs/template/static',
            'docs/tutorials',
          ],
        },
      },
    },
  },
  test: {
    src: [
      'test/**/*.test.js',
    ],
  },
  e2e: {
    src: 'test/**/*.e2e.js',
    dst: [
      'test/e2e/mismatch/*.png',
      'test/e2e/mismatch/*.html',
    ],
    show: 'test/e2e/mismatch/*.html',
  },
  presetListPath: '',
};
