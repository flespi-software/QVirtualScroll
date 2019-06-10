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
        input: './src/store/modules/logs/index.js',
        output: [
            { file: './dist/logs.js', format: 'cjs' }
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
    },
    {
      input: './src/store/modules/intervals/index.js',
      output: [
          { file: './dist/intervals.js', format: 'cjs' }
      ],
      plugins: plugins
  }
];
