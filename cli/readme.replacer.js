module.exports = {
  replacer: (source, appName) => source
    .replace(/core-vite-app-example/g, appName),
}
