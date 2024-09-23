#!/usr/bin/env node
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const childProcess = require('node:child_process')

const inquirer = require('inquirer')
const shell = require('shelljs')
const chalkPipe = require('chalk-pipe')
const { glob } = require('glob')

const fsPromises = fs.promises

const pckg = require('../package.json')

const pckReplacer = require('./packageJson.replacer').replacer
const pckYarnReplacer = require('./packageJson.yarn.replacer').replacer
const readmeReplacer = require('./readme.replacer').replacer
const readmeYarnReplacer = require('./readme.yarn.replacer').replacer
const huskyYarnReplacer = require('./husky.yarn.replacer').replacer

let folderName = 'cmf-ui-app'
let folderSet = false

const GIT_REPO_CORE_VITE = 'git@github.com:edgar0011/core-vite.git'
const GIT_REPO_CMF = 'git@github.com:edgar0011/core-vite-app-example.git'

const packageJSONFile = 'package.json'
const readmeFile = 'README.md'
const huskyFile = '.husky/pre-push'
const templateConfigFile = '.templaterc.json'

let gitRepo = GIT_REPO_CORE_VITE

if (process.argv.length >= 3) {
  folderName = process.argv?.[2]
  folderSet = true
}

console.log(chalkPipe('blue').underline(`
  ░█████╗░███╗░░░███╗███████╗
  ██╔══██╗████╗░████║██╔════╝
  ██║░░╚═╝██╔████╔██║█████╗░░
  ██║░░██╗██║╚██╔╝██║██╔══╝░░
  ╚█████╔╝██║░╚═╝░██║██║░░░░░
  ░╚════╝░╚═╝░░░░░╚═╝╚═╝░░░░░
`))
console.log(chalkPipe('blue').underline(`Create CMF app, v${pckg.version}`))
console.log('')

const appNames = {
  CMF: 'cmf',
  CORE_VITE: 'coreVite',
  RUN_CORE_VITE: 'Run Core Vite',
}

const prompts = [
  {
    type: 'list',
    message: () => chalkPipe('green.bold')('Type of app:'),
    name: 'appType',
    choices: Object.values(appNames),
    default: 'cmf',
    transformer(text) {
      return chalkPipe('blue.bold')(text)
    },
  },
  {
    type: 'input',
    message: () => chalkPipe('green.bold')('Target folder / application name:'),
    name: 'folderName',
    default: folderName,
    transformer(text) {
      return chalkPipe('blue.bold')(text)
    },
    when: (answers) => answers.appType !== appNames.RUN_CORE_VITE,
  },
  {
    type: 'list',
    message: () => chalkPipe('green.bold')('Package installer:'),
    name: 'installer',
    choices: ['npm', 'yarn'],
    default: 'npm',
    transformer(text) {
      return chalkPipe('blue.bold')(text)
    },
    when: (answers) => answers.appType !== appNames.RUN_CORE_VITE,
  },
  {
    type: 'list',
    message: () => chalkPipe('green.bold')('Type of template:'),
    name: 'templateType',
    choices: ['medium', 'simple'],
    default: 'medium',
    transformer(text) {
      return chalkPipe('blue.bold')(text)
    },
    when: (answers) => answers.appType !== appNames.RUN_CORE_VITE,
  },
]

if (folderSet) {
  prompts.splice(1, 1)
}

(async function () {
  const answers = await inquirer.prompt(prompts)

  if (answers.folderName) {
    folderName = answers.folderName
  }
  // folder
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName)
  }

  if (answers.appType === appNames.RUN_CORE_VITE) {
    childProcess.fork('./cli/core-vite-executor.js', [process.argv[2] || ''])
    process.exit()
  }

  if (answers.appType === appNames.CORE_VITE) {
    gitRepo = GIT_REPO_CORE_VITE
  }

  if (answers.appType === appNames.CMF) {
    gitRepo = GIT_REPO_CMF
  }

  shell.exec(`git clone ${gitRepo} ${folderName}`)

  shell.cd(folderName)

  let pkg = await fsPromises.readFile(packageJSONFile, 'utf8')
  let readme = await fsPromises.readFile(readmeFile, 'utf8')
  let husky = await fsPromises.readFile(huskyFile, 'utf8')

  if (fs.existsSync(templateConfigFile)) {
    const templateConfig = JSON.parse(await fsPromises.readFile(templateConfigFile, 'utf8'))

    const removeFiles = await glob(templateConfig[answers.templateType].remove)
    const replaceFiles = templateConfig[answers.templateType]?.replace

    console.log('Removing files...')
    // eslint-disable-next-line no-restricted-syntax
    for (const file of removeFiles) {
      shell.exec(`rm -rf ${file}`)
    }

    if (replaceFiles) {
      console.log('Replacing files...')
      for (const file of replaceFiles) {
        const [source, target] = Object.entries(file)[0]

        if (fs.existsSync(target)) {
          await fsPromises.rename(target, source)
        }
      }
    }
    await fsPromises.unlink(templateConfigFile)
  }

  pkg = pckReplacer(pkg, folderName)
  readme = readmeReplacer(readme, folderName)

  if (answers.installer === 'npm') {
    pkg = pckYarnReplacer(pkg)
    readme = readmeYarnReplacer(readme)
    husky = huskyYarnReplacer(husky)
  }

  await fsPromises.writeFile(packageJSONFile, pkg)
  await fsPromises.writeFile(readmeFile, readme)
  await fsPromises.writeFile(huskyFile, husky)



  shell.exec(`${answers.installer} install`, { silent: false }, function(code, stdout, stderr) {
    if (stderr) {
      console.error(stderr)
    }
    console.log(stdout)
    shell.exec(`${answers.installer} run build:routes:config`, { silent: false })
    shell.exec('rm -rf .git')
  })
}())
