import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

let plugins = [
    resolve(),
    commonjs(),
    babel({
        exclude: 'node_modules/**',
        externalHelpers: false,
        runtimeHelpers: true
    }),
    uglify()
]

export default [
    {
        input: './src/store/modules/channelsLogs/index.js',
        output: [
            { file: './dist/channelsLogs.js', format: 'cjs' }
        ],
        plugins: plugins
    },
    {
        input: './src/store/modules/channelsMessages/index.js',
        output: [
            { file: './dist/channelsMessages.js', format: 'cjs' }
        ],
        plugins: plugins
    },
    {
        input: './src/store/modules/devicesMessages/index.js',
        output: [
            { file: './dist/devicesMessages.js', format: 'cjs' }
        ],
        plugins: plugins
    }
];