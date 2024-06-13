module.exports = {
  replacer: (source, folderName) => source
    .replace('"name": "core-vite-app-example"', `"name": "${folderName}"`)
    .replace(/"version": "(.*?)"/, '"version": "1.0.0"'),
}
