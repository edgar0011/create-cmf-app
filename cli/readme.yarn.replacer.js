module.exports = {
  replacer: (source) => source
    .replace(/yarn /g, 'npm run ')
    .replace(/npm run install/g, 'npm install'),
}
