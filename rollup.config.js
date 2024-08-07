import vue from 'rollup-plugin-vue'
import babel from '@rollup/plugin-babel'
import eslint from '@rollup/plugin-eslint'
import bundleSize from 'rollup-plugin-filesize'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import ignore from 'rollup-plugin-ignore'
import autoExternal from 'rollup-plugin-auto-external'
import { terser } from 'rollup-plugin-terser'

const extensions = ['.js', '.vue']
const isProduction = !process.env.ROLLUP_WATCH

const lintOpts = {
  extensions,
  cache: true,
  throwOnError: true
}

const prodPlugins = [
  ignore(['quasar', 'vue']),
  autoExternal({
    dependencies: true,
    peerDependencies: true
  }),
  resolve({
    jail: '/src'
  }),
  commonjs(),
  vue({
    template: {
      isProduction,
      compilerOptions: { preserveWhitespace: false }
    },
    css: true
  }),
  babel({
    exclude: 'node_modules/**',
    babelHelpers: 'runtime',
    extensions: ['.js', '.vue']
  }),
  terser()
]
const devPlugins = [
  eslint(lintOpts),
  bundleSize()
]

const plugins = isProduction ? prodPlugins : [...devPlugins, ...prodPlugins]

export default [
  {
    input: './src/store/modules/logs/index.js',
    output: [
      {
        file: 'lib/logs.js',
        format: 'umd',
        name: 'logs',
        exports: 'named',
        sourcemap: true,
        globals: {
          'lodash/get': '_get',
          'lodash/set': '_set'
        }
      }
    ],
    plugins: plugins,
  // indicate which modules should be treated as external
  external: ['lodash/get', 'lodash/set']
  },
  {
    input: './src/store/modules/channelsMessagesSerial/index.js',
    output: [
      {
        file: 'lib/channelsMessagesSerial.js',
        format: 'umd',
        name: 'channelsMessagesSerial',
        exports: 'named',
        sourcemap: true,
        globals: {
          'lodash/get': '_get',
          'lodash/set': '_set'
        }
      }
    ],
    plugins: plugins,
  // indicate which modules should be treated as external
  external: ['lodash/get', 'lodash/set']
  },
  {
    input: './src/store/modules/devicesMessages/index.js',
    output: [
      {
        file: 'lib/devicesMessages.js',
        format: 'umd',
        name: 'devicesMessages',
        exports: 'named',
        sourcemap: true,
        globals: {
          'lodash/get': '_get',
          'lodash/set': '_set'
        }
      }
    ],
    plugins: plugins,
  // indicate which modules should be treated as external
  external: ['lodash/get', 'lodash/set']
  },
  {
    input: './src/store/modules/containersMessages/index.js',
    output: [
      {
        file: 'lib/containersMessages.js',
        format: 'umd',
        name: 'containersMessages',
        exports: 'named',
        sourcemap: true,
        globals: {
          'lodash/get': '_get',
          'lodash/set': '_set'
        }
      }
    ],
    plugins: plugins,
  // indicate which modules should be treated as external
  external: ['lodash/get', 'lodash/set']
  },
  {
    input: './src/store/modules/intervals/index.js',
    output: [
      {
        file: 'lib/intervals.js',
        format: 'umd',
        name: 'intervals',
        exports: 'named',
        sourcemap: true,
        globals: {
          'lodash/get': '_get',
          'lodash/set': '_set'
        }
      }
    ],
    plugins: plugins,
  // indicate which modules should be treated as external
  external: ['lodash/get', 'lodash/set']
  }
]
