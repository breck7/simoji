const Keywords = {}

Keywords.experiment = "experiment"
Keywords.seed = "seed"
Keywords.height = "height"
Keywords.width = "width"
Keywords.report = "report"
Keywords.ticksPerSecond = "ticksPerSecond"
Keywords.style = "style"

Keywords.onNeighbors = "onNeighbors"
Keywords.onHit = "onHit"
Keywords.onTick = "onTick"
Keywords.onDeath = "onDeath"
Keywords.onExtinct = "onExtinct"

Keywords.question = "question"

const LocalStorageKeys = {}

LocalStorageKeys.simoji = "simoji"
LocalStorageKeys.editorStartWidth = "editorStartWidth"

const UrlKeys = {}

UrlKeys.simoji = "simoji"
UrlKeys.example = "example"
UrlKeys.url = "url"

const Directions = {}

Directions.North = "North"
Directions.East = "East"
Directions.South = "South"
Directions.West = "West"

const ParserTypes = {}

ParserTypes.agentDefinitionParser = "agentDefinitionParser"
ParserTypes.experimentParser = "experimentParser"
ParserTypes.settingDefinitionParser = "settingDefinitionParser"
ParserTypes.abstractInjectCommandParser = "abstractInjectCommandParser"

module.exports = { Keywords, LocalStorageKeys, UrlKeys, Directions, ParserTypes }
