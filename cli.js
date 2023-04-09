#! /usr/bin/env node

const parseArgs = require("minimist")
const packageJson = require("./package.json")
const { SimojiApp } = require("./components/SimojiApp.js")
const { Disk } = require("jtree/products/Disk.node.js")
const VERSION = packageJson.version

const CommandFnDecoratorSuffix = "Command"

class SimojiCli {
  execute(args = []) {
    this.log(`\n🧫🧫🧫 WELCOME TO SIMOJI (v${VERSION}) 🧫🧫🧫`)
    const command = args[0]
    const filename = args[1]
    const commandName = `${command}${CommandFnDecoratorSuffix}`
    const cwd = process.cwd()
    if (this[commandName]) return this[commandName](cwd, filename)

    if (Disk.exists(cwd + "/" + command)) return this.runCommand(cwd, command)

    if (!command) this.log(`\nNo command provided. Running help command.`)
    else this.log(`\nUnknown command or file '${commandName}' provided. Running help command.`)
    return this.helpCommand()
  }

  get _allCommands() {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(word => word.endsWith(CommandFnDecoratorSuffix))
      .sort()
  }

  async runCommand(cwd, filename) {
    const fullPath = cwd + "/" + filename
    if (!Disk.exists(fullPath)) return this.log(`❌ file '${fullPath}' not found.`)
    this.log(`\n⏳ Running '${fullPath}'...\n`)
    const code = Disk.read(filename)
    const app = SimojiApp.setupApp(code)
    app.verbose = false
    await app.runUntilPause()
  }

  helpCommand() {
    return this.log(
      `\nThis is the Simoji help page.\n\nCommands you can run:\n\n${this._allCommands
        .map(comm => `➡️  ` + comm.replace(CommandFnDecoratorSuffix, ""))
        .join("\n")}\n`
    )
  }

  verbose = true
  log(message) {
    if (this.verbose) console.log(message)
    return message
  }
}

if (module && !module.parent) new SimojiCli().execute(parseArgs(process.argv.slice(2))._)
