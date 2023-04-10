const DEFAULT_SIM = "fire"
const { TreeNode } = require("jtree/products/TreeNode.js")
const { HandGrammarProgram } = require("jtree/products/GrammarLanguage.js")
const { ExampleSims } = require("./components/ExampleSims.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")
const { LocalStorageKeys, UrlKeys } = require("./components/Types.js")

class BrowserGlue extends AbstractTreeComponentParser {
  async fetchAndLoadSimCodeFromUrlCommand(url) {
    const simCode = await this.fetchText(url)
    return simCode
  }

  async fetchText(url) {
    const result = await fetch(url)
    const text = await result.text()
    return text
  }

  getFromLocalStorage() {
    return localStorage.getItem(LocalStorageKeys.simoji)
  }

  async fetchSimCode() {
    const hash = this.willowBrowser.getHash().substr(1)
    const deepLink = new TreeNode(decodeURIComponent(hash))
    const example = deepLink.get(UrlKeys.example)
    const fromUrl = deepLink.get(UrlKeys.url)
    const simojiCode = deepLink.getNode(UrlKeys.simoji)

    if (fromUrl) return this.fetchAndLoadSimCodeFromUrlCommand(fromUrl)
    if (example) return this.getExample(example)
    if (simojiCode) return simojiCode.childrenToString()

    const localStorageCode = this.getFromLocalStorage()
    if (localStorageCode) return localStorageCode

    return this.getExample(DEFAULT_SIM)
  }

  getExample(id) {
    return ExampleSims.has(id) ? ExampleSims.getNode(id).childrenToString() : `comment Example '${id}' not found.`
  }

  async fetchSimGrammarAndExamplesAndInit() {
    const grammar = await fetch("simoji.grammar")
    const grammarCode = await grammar.text()

    const result = await fetch("examples")
    return this.init(grammarCode, await result.text())
  }

  async init(grammarCode, theExamples) {
    window.simojiParser = new HandGrammarProgram(grammarCode).compileAndReturnRootParser()
    ExampleSims.setChildren(theExamples)

    const simCode = await this.fetchSimCode()

    window.app = SimojiApp.setupApp(simCode, window.innerWidth, window.innerHeight)
    window.app.start()
    return window.app
  }
}

module.exports = { BrowserGlue }
