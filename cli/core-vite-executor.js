#!/usr/bin/env node
/* eslint-disable no-useless-escape */
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/order
const fsall = require('fs')

const fs = fsall.promises
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/order
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/order
const shell = require('shelljs')
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/order
// const { glob } = require('glob')

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/order
const chalkPipe = require('chalk-pipe')

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/order
const pckg = require('../package.json')


console.log(chalkPipe('blue').underline(`

 ######   #######  ########  ########    ##     ## #### ######## ########
##    ## ##     ## ##     ## ##          ##     ##  ##     ##    ##
##       ##     ## ##     ## ##          ##     ##  ##     ##    ##
##       ##     ## ########  ######      ##     ##  ##     ##    ######
##       ##     ## ##   ##   ##           ##   ##   ##     ##    ##
##    ## ##     ## ##    ##  ##            ## ##    ##     ##    ##
 ######   #######  ##     ## ########       ###    ####    ##    ########

`))
console.log(chalkPipe('blue').underline(`Core-vite-executor, v${pckg.version}`))
console.log('')


async function shellExec(command) {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const child = shell.exec(command, { async: true })

  let dataStr = ''
  let errorStr = ''

  child.stdout.on('data', (data) => {
    // console.log(data.toString('utf-8'));
    dataStr += data
  })

  child.stderr.on('data', (data) => {
    // console.log(`child stderr: ${data}`);
    errorStr += data
  })

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve)
  })

  child.on('uncaughtException', (error) => {
    console.log(error)
  })

  child.on('unhandledRejection', (reason) => {
    console.log(reason)
  })

  if (exitCode) {
    throw new Error(`child process error exit ${exitCode}, ${errorStr}`)
  }
  return dataStr
}

const providedDirectory = process.argv[2] || './'
const shouldRebuild = process.argv[2] ? process.argv[3] === 'rebuild' : process.argv[2] === 'rebuild'
let pathToRoutesConfig = path.resolve(process.cwd(), providedDirectory) || '';

(async() => {
  if (fsall.lstatSync(pathToRoutesConfig).isDirectory()) {
    console.log('Looking for routes config in the provided directory...')

    // TODO replace with Glob
    const paths = [
      // ...await glob(`${providedDirectory}/public/routes.config{.minimal,}.json`),
      // ...await glob(`${providedDirectory}/dist/routes.config{.minimal,}.json`),
      // ...await glob(`${providedDirectory}/*/routes.config{.minimal,}.json`),
      path.resolve(process.cwd(), `${providedDirectory}/routes.config.json`),
      path.resolve(process.cwd(), `${providedDirectory}/routes.config.minimal.json`),
      path.resolve(process.cwd(), `${providedDirectory}/public/routes.config.json`),
      path.resolve(process.cwd(), `${providedDirectory}/public/routes.config.minimal.json`),
      path.resolve(process.cwd(), `${providedDirectory}/dist/routes.config.json`),
      path.resolve(process.cwd(), `${providedDirectory}/dist/routes.config.minimal.json`),
    ]


    console.log('paths', paths)

    const pathExists = paths.map(
      (_pathtoRoutesConfig) => ({ path: _pathtoRoutesConfig, exists: fsall.existsSync(_pathtoRoutesConfig) }),
    )

    console.log('pathExists', pathExists)

    pathToRoutesConfig = pathExists.filter(({ exists }) => exists === true)?.[0]?.path

    if (!pathToRoutesConfig) {
      // throw Error('Routes configuration `routes.config.json` is missing');
      console.log(chalkPipe('orange').bold('Routes configuration `routes.config.json` is missing'))
      // process.exit(1);
    } else {
      console.log(chalkPipe('green').bold(`Found routes config in the provided directory: ${pathToRoutesConfig}`))
    }
  } else if (!fsall.existsSync(pathToRoutesConfig)) {
    // throw Error('Routes configuration `routes.config.json` is missing');
    console.log(chalkPipe('red').bold('Routes configuration `routes.config.json` is missing'))
    // process.exit(1);
  }

  const GIT_REPO_CORE_VITE = 'git@github.com:edgar0011/core-vite.git'

  const folderName = 'core-vite-local'

  if (!fsall.existsSync(path.resolve(folderName, '.core-vite-executor.done')) || shouldRebuild) {
    await shellExec(`rm -rf ${folderName}`)

    console.log('Downloading CoreVite...')
    await shellExec(`git clone ${GIT_REPO_CORE_VITE} ${folderName} --quiet`)

    shell.cd(folderName)
    console.log('Installing CoreVite...')
    await shellExec('npm install -f')
    await shellExec('cp .env-template .env')
    await shellExec('npm run build')
    await shellExec('cat .env')
    await fs.writeFile('.core-vite-executor.done', 'core-vite-executor install and build finished')
  } else {
    shell.cd(folderName)
  }

  console.log('pathToRoutesConfig', pathToRoutesConfig)
  await shellExec(`npm run start:prodbuild ${pathToRoutesConfig}`)
})()


process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception', error)
})

process.on('unhandledRejection', (reason) => {
  console.log('Unhandled Rejection', reason)
})

