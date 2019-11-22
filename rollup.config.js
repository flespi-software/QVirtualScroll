import vue from 'rollup-plugin-vue'
import babel from 'rollup-plugin-babel'
import { eslint } from 'rollup-plugin-eslint'
import bundleSize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import ignore from 'rollup-plugin-ignore'
import autoExternal from 'rollup-plugin-auto-external'
import { uglify } from 'rollup-plugin-uglify'

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
    externalHelpers: false,
    runtimeHelpers: true,
    extensions: ['.js', '.vue']
  }),
  uglify()
]
const devPlugins = [
  eslint(lintOpts),
  bundleSize()
]

let plugins = isProduction ? prodPlugins : [...devPlugins, ...prodPlugins]

export default [
  {
    input: './src/store/modules/logs/index.js',
    output: [
      {
        file: 'lib/logs.js',
        format: 'umd',
        name: 'logs',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: plugins
  },
  {
    input: './src/store/modules/channelsMessagesPull/index.js',
    output: [
      {
        file: 'lib/channelsMessagesPull.js',
        format: 'umd',
        name: 'channelsMessagesPull',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: plugins
  },
  {
    input: './src/store/modules/channelsMessagesSerial/index.js',
    output: [
      {
        file: 'lib/channelsMessagesSerial.js',
        format: 'umd',
        name: 'channelsMessagesSerial',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: plugins
  },
  {
    input: './src/store/modules/devicesMessages/index.js',
    output: [
      {
        file: 'lib/devicesMessages.js',
        format: 'umd',
        name: 'devicesMessages',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: plugins
  },
  {
    input: './src/store/modules/intervals/index.js',
    output: [
      {
        file: 'lib/intervals.js',
        format: 'umd',
        name: 'intervals',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: plugins
  }
]
