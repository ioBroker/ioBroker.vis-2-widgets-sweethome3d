/*!
 * ioBroker build tasks for the vis-2 SweetHome3D widget set.
 *
 * Executed with `tsx` (see the `build` and `widget-*` scripts in package.json), so this file is type checked by
 * the root tsconfig.json like the rest of the repository.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } from '@iobroker/build-tools';
import decompress from 'decompress';

const { name } = JSON.parse(readFileSync(`${__dirname}/package.json`, 'utf8')) as { name: string };

/** Name of the adapter without the `iobroker.` prefix, e.g. `vis-2-widgets-sweethome3d` */
const adapterName = name.replace('iobroker.', '');

const SRC = 'src-widgets/';
const src = `${__dirname}/${SRC}`;

/** ZIP file of the SweetHome3D JS viewer from https://www.sweethome3d.com/ */
const VIEWER_ZIP = `${__dirname}/viewerSources/SweetHome3DJSViewer-7.2.zip`;

/** Images that viewhome.min.js loads at runtime. The paths are patched in `updateViewerSource()` */
const VIEWER_IMAGES = ['navigationPanel.png', 'close.png'];

/**
 * Extract the SweetHome3D JS viewer and store its scripts as *.txt in `src-widgets/src/lib/`, so that the bundler
 * copies them unchanged and the widget can load them via `<script>`.
 */
async function updateViewerSource(): Promise<void> {
    await decompress(VIEWER_ZIP, `${__dirname}/viewerSources/src`);
    const libDir = `${__dirname}/viewerSources/src/lib`;
    for (const file of readdirSync(libDir)) {
        let data: Buffer | string = readFileSync(`${libDir}/${file}`);
        if (file === 'viewhome.min.js') {
            data = data
                .toString()
                .replace(
                    `"'+ZIPTools.getScriptFolder("gl-matrix-min.js")+'navigationPanel.png"`,
                    `"./widgets/${adapterName}/navigationPanel.png"`,
                )
                .replaceAll(`ZIPTools.getScriptFolder()+"close.png"`, `"./widgets/${adapterName}/close.png"`);
        }

        writeFileSync(`${src}src/lib/${file.replace(/\.js$/, '.txt')}`, data);
    }
}

/** Remove the Vite output and the published widget folder */
function clean(): void {
    deleteFoldersRecursive(`${src}build`);
    deleteFoldersRecursive(`${__dirname}/widgets`);
}

/** Type check and build the widget sources with Vite */
function compile(): Promise<void> {
    return buildReact(src, { rootDir: __dirname, vite: true, tsc: true });
}

/** Copy the Vite output into `widgets/<adapter>/`, which is what vis-2 loads at runtime */
function copyAllFiles(): void {
    copyFiles(
        [
            `${SRC}build/**/*`,
            // Entry page of the stand-alone dev server, not part of the widget set
            `!${SRC}build/index.html`,
            // Statistics of the federation build. `mf-manifest.json` is NOT excluded: vis-2 reads it to see
            // which modules this widget set shares.
            `!${SRC}build/mf-stats.json`,
        ],
        `widgets/${adapterName}/`,
    );

    // viewhome.min.js loads these images from `widgets/<adapter>/`
    copyFiles(
        VIEWER_IMAGES.map(file => `${SRC}src/lib/${file}`),
        `widgets/${adapterName}/`,
    );

    // Keep the standalone i18n files alongside the widgets
    copyFiles([`${SRC}src/i18n/*.json`], `widgets/${adapterName}/i18n`);
}

/**
 * Report a failed stage and end the process with a non-zero exit code
 *
 * @param what - what did not work, e.g. `build`
 * @param e - the error that was thrown
 */
function fail(what: string, e: unknown): never {
    const message = e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
    console.error(`Cannot ${what}: ${message}`);
    process.exit(2);
}

if (process.argv.includes('--update-viewer-source')) {
    updateViewerSource().catch((e: unknown) => fail('update the viewer sources', e));
} else if (process.argv.includes('--widget-0-clean')) {
    clean();
} else if (process.argv.includes('--widget-1-npm')) {
    npmInstall(src).catch((e: unknown) => fail('install npm modules', e));
} else if (process.argv.includes('--widget-2-compile')) {
    compile().catch((e: unknown) => fail('build', e));
} else if (process.argv.includes('--widget-3-copy')) {
    copyAllFiles();
} else {
    clean();
    npmInstall(src)
        .then(() => compile())
        .then(() => copyAllFiles())
        .catch((e: unknown) => fail('build the widgets', e));
}
