const DEFAULT_SIM = "soccer"
const { jtree } = require("jtree")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

// prettier-ignore
/*NODE_JS_ONLY*/ const simojiCompiler = jtree.compileGrammarFileAtPathAndReturnRootConstructor(   __dirname + "/simoji.grammar")

let exampleSims = new jtree.TreeNode()

class BrowserLauncher extends AbstractTreeComponent {
  async fetchAndLoadSimCodeFromUrlCommand(url) {
    const { willowBrowser } = this
    const simCode = await willowBrowser.httpGetUrl(url)
    return simCode
  }

  getFromLocalStorage() {
    return localStorage.getItem("simoji")
  }

  async fetchSimCode() {
    const hash = location.hash.substr(1)
    const deepLink = new jtree.TreeNode(decodeURIComponent(hash))
    const example = deepLink.get("example")
    const fromUrl = deepLink.get("url")
    const simojiCode = deepLink.getNode("simoji")

    if (fromUrl) return this.fetchAndLoadSimCodeFromUrlCommand(fromUrl)
    if (example) return this.getExample(example)
    if (simojiCode) return simojiCode.childrenToString()

    const localStorageCode = this.getFromLocalStorage()
    if (localStorageCode) return localStorageCode

    return this.getExample(DEFAULT_SIM)
  }

  getExample(id) {
    return exampleSims.has(id) ? exampleSims.getNode(id).childrenToString() : `comment Example '${id}' not found.`
  }

  async fetchAndInit() {
    const grammar = await fetch("simoji.grammar")
    const text = await grammar.text()
    window.simojiCompiler = new jtree.HandGrammarProgram(text).compileAndReturnRootConstructor()

    const result = await fetch("examples")
    exampleSims = new jtree.TreeNode(await result.text())
    const simCode = await this.fetchSimCode()

    window.app = SimojiApp.setupApp(simCode, jQuery(window).width(), jQuery(window).height())
    window.app.start()
    return window.app
  }
}

module.exports = { BrowserLauncher }
