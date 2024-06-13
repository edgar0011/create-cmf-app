module.exports = {
  replacer: (source) => source
    .replace(/yarn /g, 'npm run '),
}
