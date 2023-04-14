const { TreeNode } = require("jtree/products/TreeNode.js")
const { HandGrammarProgram } = require("jtree/products/GrammarLanguage.js")
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
    // if (example)
    //   return ExampleSims.has(example)
    //     ? ExampleSims.getNode(example).childrenToString()
    //     : `comment Example '${example}' not found.`
    if (simojiCode) return simojiCode.childrenToString()

    const localStorageCode = this.getFromLocalStorage()
    if (localStorageCode) return localStorageCode

    return ""
    // return ExampleSims.getNode("fire").childrenToString()
  }

  getExample(id) {
    return
  }

  async fetchSimGrammarAndExamplesAndInit() {
    const grammar = await fetch("dist/simoji.grammar")
    const grammarCode = await grammar.text()

    return this.init(grammarCode)
  }

  async init(grammarCode) {
    window.simojiParser = new HandGrammarProgram(grammarCode).compileAndReturnRootParser()
    // ExampleSims.setChildren(theExamples)

    // const simCode = await this.fetchSimCode()

    window.app = await SimojiApp.setupApp(window.innerWidth, window.innerHeight)
    window.app.start()
    return window.app
  }
}

module.exports = { BrowserGlue }
