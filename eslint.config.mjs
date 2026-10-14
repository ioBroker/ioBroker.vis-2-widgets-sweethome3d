import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        // disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],
        },
    },
    {
        ignores: [
            'src-widgets/.__mf__temp/**/*',
            'src-widgets/build/**/*',
            'src-widgets/node_modules/**/*',
            'src-widgets/src/lib/**/*',
            'viewerSources/**/*',
            'admin/**/*',
            'widgets/**/*',
            'test/**/*',
            'tmp/**/*',
        ],
    },
];
