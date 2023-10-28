/*!
 * ioBroker gulpfile
 * Date: 2023-02-22
 */
'use strict';

const gulp = require('gulp');
const adapterName = require('./package.json').name.replace('iobroker.', '');
const gulpHelper = require('@iobroker/vis-2-widgets-react-dev/gulpHelper');

// http://127.0.0.1:18082/vis-2-beta/widgets/vis-2-widgets-material/static/js/node_modules_iobroker_vis-2-widgets-react-dev_index_jsx-_adb40.af309310.chunk.js

gulpHelper.gulpTasks(gulp, adapterName, __dirname, `${__dirname}/src-widgets/`, [
    `${__dirname}/src-widgets/build/static/js/*echarts-for-react_lib_core_js-node_modules_echarts_core*.*`,
    `${__dirname}/src-widgets/build/static/js/*spectrum_color_dist_import_mjs*.*`,
    `${__dirname}/src-widgets/build/static/js/*uiw_react-color-shade-slider*.*`,
    `${__dirname}/src-widgets/build/static/js/*lottie-react_build*.*`,
    `${__dirname}/src-widgets/build/static/js/*node_modules_babel_runtime_helpers_createForOfItera*.*`,
]);

gulp.task('default', gulp.series('widget-build'));