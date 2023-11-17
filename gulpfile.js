/*!
 * ioBroker gulpfile
 * Date: 2023-02-22
 */
'use strict';

const gulp = require('gulp');
const adapterName = require('./package.json').name.replace('iobroker.', '');
const gulpHelper = require('@iobroker/vis-2-widgets-react-dev/gulpHelper');
const decompress= require('decompress');
const fs = require('node:fs');

gulp.task('update-viewer-source', async () => {
    await decompress(`${__dirname}/viewerSources/SweetHome3DJSViewer-7.2.zip`, `${__dirname}/viewerSources/src`);
    const files = fs.readdirSync(`${__dirname}/viewerSources/src/lib`);
    // copy all files
    for (const file of files) {
        let data = fs.readFileSync(`${__dirname}/viewerSources/src/lib/${file}`);
        if (file === 'viewhome.min.js') {
            data = data.toString().replace(`"'+ZIPTools.getScriptFolder("gl-matrix-min.js")+'navigationPanel.png"`, '"./widgets/vis-2-widgets-sweethome3d/navigationPanel.png"');
            data = data.toString().replace(`ZIPTools.getScriptFolder()+"close.png"`, '"./widgets/vis-2-widgets-sweethome3d/close.png"');
            data = data.toString().replace(`ZIPTools.getScriptFolder()+"close.png"`, '"./widgets/vis-2-widgets-sweethome3d/close.png"');
        }

        fs.writeFileSync(`src-widgets/src/lib/${file.replace(/\.js$/, '.txt')}`, data);
    }
});

// http://127.0.0.1:18082/vis-2-beta/widgets/vis-2-widgets-material/static/js/node_modules_iobroker_vis-2-widgets-react-dev_index_jsx-_adb40.af309310.chunk.js

gulpHelper.gulpTasks(gulp, adapterName, __dirname, `${__dirname}/src-widgets/`, [
    `${__dirname}/src-widgets/build/static/js/*echarts-for-react_lib_core_js-node_modules_echarts_core*.*`,
    `${__dirname}/src-widgets/build/static/js/*spectrum_color_dist_import_mjs*.*`,
    `${__dirname}/src-widgets/build/static/js/*uiw_react-color-shade-slider*.*`,
    `${__dirname}/src-widgets/build/static/js/*lottie-react_build*.*`,
    `${__dirname}/src-widgets/build/static/js/*node_modules_babel_runtime_helpers_createForOfItera*.*`,
]);

gulp.task('copyPng', done => {
   fs.writeFileSync(`${__dirname}/widgets/vis-2-widgets-sweethome3d/navigationPanel.png`, fs.readFileSync(`${__dirname}/src-widgets/src/lib/navigationPanel.png`));
   fs.writeFileSync(`${__dirname}/widgets/vis-2-widgets-sweethome3d/close.png`, fs.readFileSync(`${__dirname}/src-widgets/src/lib/close.png`));
   done();
});

gulp.task('default', gulp.series('widget-build', 'copyPng'));