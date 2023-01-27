/** @type {import('vite').UserConfig} */
export default {
  root: './src',
  worker: {
    format: 'es'
  },
  define: {
    ByteStream: 'undefined', // https://github.com/antimatter15/untar.js/pull/5
  }
}