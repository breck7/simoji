const Keywords = {}

Keywords.experiment = "experiment"
Keywords.seed = "seed"
Keywords.height = "height"
Keywords.width = "width"
Keywords.report = "report"
Keywords.ticksPerSecond = "ticksPerSecond"
Keywords.style = "style"

Keywords.onHit = "onHit"
Keywords.onTick = "onTick"
Keywords.onDeath = "onDeath"
Keywords.onExtinct = "onExtinct"

Keywords.question = "question"

const LocalStorageKeys = {}

LocalStorageKeys.fileSystem = "fileSystem"
LocalStorageKeys.openFile = "openFile"
LocalStorageKeys.editorStartWidth = "editorStartWidth"

const UrlKeys = {}

UrlKeys.simoji = "simoji"
UrlKeys.example = "example"
UrlKeys.url = "url"

const ParserTypes = {}

ParserTypes.agentDefinitionParser = "agentDefinitionParser"
ParserTypes.experimentParser = "experimentParser"
ParserTypes.settingDefinitionParser = "settingDefinitionParser"
ParserTypes.abstractInjectCommandParser = "abstractInjectCommandParser"

module.exports = { Keywords, LocalStorageKeys, UrlKeys, ParserTypes }
