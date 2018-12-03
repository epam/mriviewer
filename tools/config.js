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
    src: 'app/shaders/*.+(frag|vert)',
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
    // Remote Dicom folder load by URL: need to write folder name
    // Remote folder should contains 'file_list.txt' file with all
    // *.dcm files inside. This file (file_list.txt) can be produced
    // by command: dir *.dcm /w /b > file_list.txt
    //
    // onloadsrc: 'http://yoursite.com/folder1/folder2/folder3',
    //
    // Remote Ktx file load by URL
    // You need to specify url, ended with ktx
    // onloadsrc: 'http://yoursite.com/folder1/folder2/somevolume.ktx',
    //
    // Local Ktx file load by relative file path
    // path is relative to index.html location
    // onloadsrc: 'data/lungs.ktx',
    //
    // Start app without load volume on startup
    onloadsrc: '',
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
  cover: {
    src: [
      'lib/**/*.js',
    ],
    dst: 'coverage/',
    show: 'coverage/lcov-report/index.html',
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
