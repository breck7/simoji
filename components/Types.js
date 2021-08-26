const Keywords = {}

Keywords.experiment = "experiment"
Keywords.seed = "seed"
Keywords.size = "size"
Keywords.rows = "rows"
Keywords.columns = "columns"
Keywords.report = "report"
Keywords.ticksPerSecond = "ticksPerSecond"
Keywords.style = "style"

Keywords.onNeighbors = "onNeighbors"
Keywords.onTouch = "onTouch"
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

const NodeTypes = {}

NodeTypes.agentDefinitionNode = "agentDefinitionNode"
NodeTypes.experimentNode = "experimentNode"
NodeTypes.settingDefinitionNode = "settingDefinitionNode"
NodeTypes.abstractDrawNode = "abstractDrawNode"

module.exports = { Keywords, LocalStorageKeys, UrlKeys, Directions, NodeTypes }
