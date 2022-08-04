const SimConstants = {"grammar":"anyCell\nbooleanCell\nstringCell\n highlightScope string\nsettingValueCell\n highlightScope constant.numeric\ncssCell\n highlightScope string\njavascriptCell\n highlightScope string\nhtmlCell\n highlightScope string\nemojiCell\n highlightScope string\nohayoCell\n highlightScope string\nblankCell\ncodeCell\n highlightScope comment\ncommentCell\n highlightScope comment\nkeywordCell\n highlightScope keyword\ntextCell\n highlightScope string\nintegerCell\n highlightScope constant.numeric\nbehaviorNameCell\n highlightScope keyword\nconditionalOperatorCell\n highlightScope keyword\n enum < > = <= >=\npositionCell\n highlightScope constant.numeric\nneighborCountCell\n extends integerCell\n min 0\n max 8\nintegerOrPercentCell\n highlightScope constant.numeric\nprobabilityCell\n description A number between 0 and 1\n highlightScope constant.numeric\npropertyNameCell\n highlightScope keyword\nangleCell\n enum North South East West NorthWest NorthEast SouthWest SouthEast\n highlightScope constant.numeric\nerrorNode\n baseNodeType errorNode\nsimojiNode\n extensions simoji\n description A Tree Language that compiles to a TreeComponentFramework app.\n root\n inScope abstractIgnoreNode abstractSetupNode abstractInjectCommandNode onTickNode onExtinctNode behaviorDefinitionNode experimentNode settingDefinitionNode\n catchAllNodeType agentDefinitionNode\n compilesTo javascript\n example\n  🦋\n   onTick .1\n    turnRandomly\n    move\n   onTick .2\n    turnToward 💡\n    move\n  💡\n  \n  insert 10 🦋\n  insert 2 💡\n javascript\n  get agentTypes() {\n   return this.filter(node => node.getNodeTypeId() === \"agentDefinitionNode\")\n  }\nexperimentNode\n crux experiment\n cells keywordCell\n inScope abstractIgnoreNode abstractSetupNode abstractInjectCommandNode onTickNode onExtinctNode settingDefinitionNode\n catchAllCellType stringCell\nabstractSetupNode\natTimeNode\n crux atTime\n description Run commands at a certain tick.\n cells keywordCell integerCell\n extends abstractSetupNode\n inScope abstractInjectCommandNode\nabstractSetupNumberNode\n cells keywordCell integerCell\n extends abstractSetupNode\n javascript\n  compile() {\n   return \"\"\n  }\nsizeNode\n description Size of a grid cell in pixels. Min is 10. Max is 200.\n extends abstractSetupNumberNode\n crux size\nrowsNode\n description Number of rows in the grid. Default is based on screen size.\n extends abstractSetupNumberNode\n crux rows\ncolumnsNode\n description Number of columns in the grid. Default is based on screen size.\n extends abstractSetupNumberNode\n crux columns\nseedNode\n description If you'd like reproducible runs set a seed for the random number generator.\n extends abstractSetupNumberNode\n crux seed\nticksPerSecondNode\n description Time in milliseconds of one step.\n extends abstractSetupNumberNode\n crux ticksPerSecond\nreportNode\n crux report\n description Define a custom report template.\n catchAllNodeType ohayoLineNode\n extends abstractSetupNode\n cells keywordCell\n javascript\n  compile() {\n   return \"\"\n  }\nstyleNode\n description Optional CSS to load in BoardStyleComponent\n extends abstractSetupNode\n cells keywordCell\n crux style\n catchAllNodeType styleLineNode\n javascript\n  compile() {\n   return \"\"\n  }\nquestionNode\n crux question\n description What are you trying to figure out?\n cells keywordCell\n catchAllCellType stringCell\n extends abstractSetupNode\nabstractInjectCommandNode\nfillNode\n description Fill all blank cells with this agent.\n extends abstractInjectCommandNode\n cells keywordCell emojiCell\n crux fill\ndrawNode\n extends abstractInjectCommandNode\n cells keywordCell\n crux draw\n catchAllNodeType drawLineNode\ninsertNode\n extends abstractInjectCommandNode\n cells keywordCell integerOrPercentCell emojiCell\n crux insert\ninsertAtNode\n extends insertNode\n description Insert at X Y\n cells keywordCell emojiCell positionCell positionCell\n crux insertAt\ninsertClusterNode\n extends insertNode\n crux insertCluster\n catchAllCellType integerCell\nrectangleDrawNode\n extends abstractInjectCommandNode\n cells keywordCell emojiCell integerCell integerCell\n catchAllCellType integerCell\n crux rectangle\npasteDrawNode\n extends abstractInjectCommandNode\n cells keywordCell\n crux paste\n catchAllNodeType pasteLineNode\ndrawLineNode\n catchAllCellType emojiCell\npasteLineNode\n catchAllCellType anyCell\n catchAllNodeType pasteLineNode\nagentDefinitionNode\n inScope abstractIgnoreNode abstractEventNode abstractAgentAttributeNode abstractBehaviorAttributeNode\n cells keywordCell\n catchAllNodeType errorNode\n compiler\n  stringTemplate \n javascript\n  compile() {\n   const root = this.getRootNode()\n   const name = root.agentKeywordMap[this.getWord(0)]\n   const normal = super.compile()\n   const behaviors = this.filter(node => node.getNodeTypeId() === \"abstractBehaviorAttributeNode\")\n    .map(behavior => `\"${behavior.getLine()}\"`)\n    .join(\",\")\n   return `class ${name} extends Agent {\n      icon = \"${this.getWord(0)}\"\n      behaviors = [${behaviors}]\n      ${normal}\n    }`\n  }\nabstractCommandNode\n cells keywordCell\nabstractSubjectObjectCommandNode\n extends abstractCommandNode\nreplaceWithCommandNode\n extends abstractSubjectObjectCommandNode\n crux replaceWith\n cells keywordCell emojiCell\nkickItCommandNode\n extends abstractSubjectObjectCommandNode\n crux kickIt\nshootCommandNode\n extends abstractSubjectObjectCommandNode\n crux shoot\npickItUpCommandNode\n extends abstractSubjectObjectCommandNode\n crux pickItUp\nspawnCommandNode\n crux spawn\n extends abstractCommandNode\n cells keywordCell emojiCell\n catchAllCellType positionCell\nmoveToEmptySpotCommandNode\n crux moveToEmptySpot\n extends abstractCommandNode\n cells keywordCell\nremoveCommandNode\n description Remove this agent from the board.\n crux remove\n extends abstractCommandNode\n cells keywordCell\njavascriptCommandNode\n description An escape hatch so you can write custom javascript in a pinch.\n extends abstractCommandNode\n crux javascript\n catchAllNodeType javascriptLineNode\n cells keywordCell\nalertCommandNode\n extends abstractCommandNode\n crux alert\n catchAllCellType stringCell\nlogCommandNode\n extends abstractCommandNode\n crux log\n catchAllCellType stringCell\nnarrateCommandNode\n extends abstractCommandNode\n crux narrate\n catchAllCellType stringCell\npauseCommandNode\n extends abstractCommandNode\n crux pause\ndecreaseCommandNode\n extends abstractCommandNode\n description Decrease a property by 1.\n crux decrease\n cells keywordCell propertyNameCell\nincreaseCommandNode\n extends abstractCommandNode\n description Increase a property by 1.\n crux increase\n cells keywordCell propertyNameCell\nmoveCommandNode\n extends abstractCommandNode\n crux move\nturnRandomlyCommandNode\n extends abstractCommandNode\n crux turnRandomly\njitterCommandNode\n extends abstractCommandNode\n crux jitter\nturnTowardCommandNode\n description Turn to the closest agent of a certain type.\n extends abstractCommandNode\n crux turnToward\n cells keywordCell emojiCell\nturnFromCommandNode\n description Turn away from the closest agent of a certain type.\n extends abstractCommandNode\n crux turnFrom\n cells keywordCell emojiCell\nlearnCommandNode\n crux learn\n extends abstractCommandNode\n cells keywordCell behaviorNameCell\nunlearnCommandNode\n crux unlearn\n extends abstractCommandNode\n cells keywordCell behaviorNameCell\nabstractAgentAttributeNode\n cells keywordCell\nabstractStringAttributeNode\n extends abstractAgentAttributeNode\n pattern ^\\w+ .+$\n catchAllCellType stringCell\n javascript\n  compile() {\n   return `${this.getWord(0)} = \"${this.getWord(1)}\"`\n  }\nangleNode\n extends abstractStringAttributeNode\n cells keywordCell angleCell\n crux angle\nagentStyleNode\n description Provide custom CSS for an agent type.\n extends abstractStringAttributeNode\n cells keywordCell cssCell\n crux style\nagentHtmlNode\n description Provide custom HTML for each rendered agent.\n extends abstractStringAttributeNode\n cells keywordCell htmlCell\n crux html\nabstractBooleanAttributeNode\n description A boolean attribute.\n extends abstractAgentAttributeNode\n javascript\n  compile() {\n   return `${this.getWord(0)} = true`\n  }\nnoPaletteNode\n extends abstractBooleanAttributeNode\n cruxFromId\n description Don't show this agent in the palette.\nsolidTraitNode\n description If set other agents won't pass through these.\n extends abstractBooleanAttributeNode\n crux solid\nbouncyTraitNode\n description If set other agents will bounce off this after a collision.\n extends abstractBooleanAttributeNode\n crux bouncy\nabstractIntegerAttributeNode\n extends abstractAgentAttributeNode\n description An integer attribute.\n cells keywordCell integerCell\n javascript\n  compile() {\n   return `${this.getWord(0)} = ${this.getWord(1)}`\n  }\ncustomIntegerAttributeNode\n pattern ^\\w+ \\d+$\n extends abstractIntegerAttributeNode\nhealthNode\n extends abstractIntegerAttributeNode\n crux health\nsettingDefinitionNode\n description Define a configurable input.\n cells keywordCell settingValueCell\n pattern ^\\w+Setting .+$\nohayoLineNode\n description Data visualization code written for Ohayo.\n catchAllCellType ohayoCell\nstyleLineNode\n catchAllCellType cssCell\n catchAllNodeType styleLineNode\ntargetEmojiNode\n inScope abstractCommandNode\n cells emojiCell\nabstractEventNode\n cells keywordCell\n catchAllCellType probabilityCell\n javascript\n  compile() {\n   return ``\n  }\nabstractInteractionEventNode\n extends abstractEventNode\n catchAllNodeType targetEmojiNode\nonHitNode\n extends abstractInteractionEventNode\n crux onHit\n description Define what happens when this agent collides with other agents.\nonTouchNode\n extends abstractInteractionEventNode\n crux onTouch\n description Define what happens when this agent is adjacent to other agents.\nonNeighborsNode\n description Define what happens when a certain amount of neighbors are nearby.\n extends abstractInteractionEventNode\n inScope emojiAndNeighborConditionNode\n crux onNeighbors\nonDeathNode\n extends abstractEventNode\n crux onDeath\n inScope abstractCommandNode\n description Define what happens when this agent runs out of health.\nonTickNode\n extends abstractEventNode\n crux onTick\n inScope abstractCommandNode\n description Define what happens each tick.\nemojiAndNeighborConditionNode\n inScope abstractCommandNode\n pattern ^.+ (<|>|=|<=|>=)+ .+$\n cells emojiCell conditionalOperatorCell neighborCountCell\nonExtinctNode\n crux onExtinct\n inScope abstractCommandNode\n cells keywordCell emojiCell\n description Define what happens when a type of agent goes extinct from the board.\n javascript\n  compile() {\n   return \"\"\n  }\nabstractIgnoreNode\n tags doNotSynthesize\n javascript\n  compile () {\n    return \"\"\n  }\ncommentNode\n extends abstractIgnoreNode\n catchAllCellType commentCell\n crux comment\n catchAllNodeType commentLineNode\ncommentAliasNode\n description Alternate alias for a comment.\n crux #\n extends commentNode\nblankLineNode\n extends abstractIgnoreNode\n description Blank lines compile do nothing.\n cells blankCell\n pattern ^$\ncommentLineNode\n catchAllCellType commentCell\njavascriptLineNode\n catchAllCellType javascriptCell\nabstractBehaviorAttributeNode\n cells behaviorNameCell\n pattern ^.*Behavior$\n javascript\n  compile() {\n   return \"\"\n  }\nbehaviorDefinitionNode\n inScope abstractIgnoreNode abstractEventNode\n cells behaviorNameCell\n pattern ^.*Behavior$\n catchAllNodeType errorNode\n javascript\n  compile() {\n   return \"\"\n  }","examples":"ants\n comment\n  https://ccl.northwestern.edu/netlogo/models/Ants\n \n ⛰\n  onTick 0.05\n   spawn 🐜\n 🐜\n  onTick\n   jitter\n  onHit\n   🥖\n    pickItUp\n 🥖\n \n insert 3 🥖\n insert 1 ⛰\nbasketball\n question Is it better to shoot wildly or to bring it close to the basket?\n \n experiment Shoot rarely\n  shotProbabilitySetting .02\n \n experiment\n  shotProbabilitySetting .2\n \n experiment\n  shotProbabilitySetting .4\n \n experiment Shoot right away\n  shotProbabilitySetting .8\n \n 🏀\n  onHit\n   🥅⛹️‍♂️\n    narrate Blue scores!\n    spawn 🏀 9⬇️ 15➡️\n    spawn 🔵 18⬇️ 1➡️\n    remove\n   🥅⛹️‍♀️\n    narrate Red scores!\n    spawn 🏀 9⬇️ 15➡️\n    spawn 🔴 17⬇️ 1➡️\n    remove\n \n \n moveEastToBlankSpotBehavior\n  onTick\n   moveToEmptySpot\n   unlearn moveEastToBlankSpotBehavior\n \n \n 🔵\n  angle East\n  moveEastToBlankSpotBehavior\n 🔴\n  angle East\n  moveEastToBlankSpotBehavior\n \n \n ticksPerSecond 30\n \n hasBallBehavior\n  comment Sprint toward net\n  onTick .5\n   turnToward net\n   move\n   narrate breaks toward the net.\n  comment Shoot\n  onTick shotProbabilitySetting\n   turnToward net\n   shoot\n   narrate shoots!\n   learn noBallBehavior\n   unlearn hasBallBehavior\n  comment Pass\n  onTick .02\n   turnToward team\n   shoot\n   narrate passes the ball!\n   learn noBallBehavior\n   unlearn hasBallBehavior\n \n noBallBehavior\n  onTick .3\n   turnToward 🏀\n   move\n  onHit\n   🏀\n    pickItUp\n    narrate has the ball\n    learn hasBallBehavior\n    unlearn noBallBehavior\n  onTick .05\n   turnFrom opponent\n   move\n  onTick .1\n   turnFrom opponent\n   jitter\n \n # Blue Team\n ⛹️‍♂️\n  net 🥅⛹️‍♂️\n  team ⛹️‍♂️\n  opponent ⛹️‍♀️\n  noBallBehavior\n \n # Red Team\n ⛹️‍♀️\n  net 🥅⛹️‍♀️\n  team ⛹️‍♀️\n  opponent ⛹️‍♂️\n  noBallBehavior\n \n # Baskets\n 🥅⛹️‍♂️\n  html 🥅\n 🥅⛹️‍♀️\n  html 🥅\n paste\n  🥅⛹️‍♂️ 8⬇️ 2➡️\n  🥅⛹️‍♀️ 8⬇️ 29➡️\n  🏀 9⬇️ 15➡️\n \n # Court\n 🪵\n  solid\n rectangle 🪵 30 15 1 1\n \n size 30\n \n # Red Team\n paste\n  ⛹️‍♀️ 9⬇️ 6➡️\n  ⛹️‍♀️ 5⬇️ 6➡️\n  ⛹️‍♀️ 11⬇️ 11➡️\n  ⛹️‍♀️ 8⬇️ 11➡️\n  ⛹️‍♀️ 5⬇️ 11➡️\n \n # Blue Team\n paste\n  ⛹️‍♂️ 8⬇️ 25➡️\n  ⛹️‍♂️ 6⬇️ 25➡️\n  ⛹️‍♂️ 11⬇️ 20➡️\n  ⛹️‍♂️ 7⬇️ 20➡️\n  ⛹️‍♂️ 4⬇️ 20➡️\n \ncity\n ⛪️\n  comment church\n 🏟\n  comment stadium\n 🏥\n  comment hospital\n 🏭\n  comment factory\n 🏦\n  comment bank\n 🏛\n  comment courthouse\n 🏫\n  comment school\n 🏡\n  comment house\n 🏘\n  comment houses\n 🎡\n  comment park\n 🏪\n  comment store\n 🚗\n  onTick\n   move\n   move\n  angle West\n 🚓\n  onTick\n   move\n   move\n  angle West\n 🚋\n  comment subway\n  onTick\n   move\n   move\n   move\n  angle West\n ⬜️\n  comment road\n 🟩\n ⛳️\n size 20\n \n rectangle ⬜️ 10 20 0 0\n rectangle ⬜️ 10 1 0 10\n paste\n  🏛 9⬇️ 8➡️\n  🏭 1⬇️ 4➡️\n  🏭 1⬇️ 3➡️\n  🏭 1⬇️ 2➡️\n  🏭 1⬇️ 1➡️\n  🏡 18⬇️ 5➡️\n  🏡 18⬇️ 6➡️\n  🏡 18⬇️ 7➡️\n  🏡 18⬇️ 8➡️\ncops\n 🚗\n  onTick .5\n   jitter\n   move\n 🚓\n  onHit\n   🚗\n    alert Got em!\n    pause\n  onTick .1\n   turnToward 🚗\n   move\n  onTick .1\n   move\n \n size 20\n ticksPerSecond 30\n \n paste\n  🚓 1⬇️ 1➡️\n  🚗 15⬇️ 5➡️\ncovid19\n 🦠\n \n question How long will the pandemic last?\n \n # Given someone has never been infected, what are the odds they get infected?\n succeptibilitySetting .95\n # What are odds of reinfection?\n reinfectionRateSetting .002\n \n # 1 is no lockdowns. 0 is total lockdown.\n freedomOfMovementSetting 1\n \n # What is starting population size?\n urbanPopulationSetting 150\n # What is starting rural population?\n ruralPopulationSetting 30\n # What is starting infected size?\n startingInfectedSetting 3\n \n # How many places can one get the vaccine?\n vaccineCentersSetting 5\n # How likely are people to seek the vaccine?\n vaccinationDesirabilitySetting .3\n # Given someone was vaxed, what are the odds they get infected?\n vaxSucceptibilitySetting .5\n \n experiment High Vaccination Rate, High Vaccine Efficacy\n  vaccinationDesirabilitySetting .8\n  vaxSucceptibilitySetting .05\n \n \n experiment High Vaccination Rate, Low Vaccine Efficacy\n  vaccinationDesirabilitySetting .8\n  vaxSucceptibilitySetting .75\n \n experiment Lockdown\n  freedomOfMovementSetting .3\n \n experiment High Reinfection Rate\n  reinfectionRateSetting .2\n \n \n insert startingInfectedSetting 🧟\n insert vaccineCentersSetting 💉\n \n insertCluster urbanPopulationSetting 🙍\n insert ruralPopulationSetting 🙍\n \n \n 🧟\n  health 100\n  onTick .03\n   log recovered\n   replaceWith 🦸‍♂️\n  onTick\n   decrease health\n   jitter\n  onDeath\n   replaceWith 🪦\n \n 🦸‍♂️\n  comment Recovered\n  onTick\n   jitter\n  onTouch reinfectionRateSetting\n   🧟\n    replaceWith 🧟\n \n lifeBehavior\n  onTick freedomOfMovementSetting\n   jitter\n \n seekVaccineBehavior\n  onTick vaccinationDesirabilitySetting\n   turnToward 💉\n   move\n \n \n 🙍\n  lifeBehavior\n  seekVaccineBehavior\n  onTouch innateImmunitySetting\n   🧟\n    replaceWith 🧟\n   💉\n    replaceWith 🧑🏽‍🚒\n \n \n 💉\n \n \n 🧑🏽‍🚒\n  lifeBehavior\n  onTouch vaxSucceptibilitySetting\n   🧟\n    replaceWith 🧟\n \n \n \n \n onExtinct 🧟\n  log No more cases.\n  pause\n \n \n 🪦\n \n size 15\n ticksPerSecond 10\n \n report\n  roughjs.line\n  columns.keep 🧟\n   roughjs.line Active Cases\n  columns.keep 🪦\n   roughjs.line Cumulative Deaths\n \n \n comment\n  See Also\n  - http://covidsim.eu/\n  - http://modelingcommons.org/browse/one_model/6282#model_tabs_browse_info\n  - https://github.com/maplerainresearch/covid19-sim-mesa/blob/master/model.py\n  - https://www.frontiersin.org/articles/10.3389/fpubh.2020.563247/full\n  - https://ncase.me/covid-19/\n  - https://en.wikipedia.org/wiki/List_of_COVID-19_simulation_models\n  \n \ncovid19simple\n question What is the effect of population density on pandemic duration?\n \n experiment\n  insertCluster 100 🙍\n  insertCluster 100 🙍\n  insertCluster 100 🙍\n  insertCluster 30 🙍\n  insertCluster 30 🙍\n  insertCluster 10 🙍\n \n experiment\n  insert 200 🙍\n \n experiment\n  insertCluster 200 🙍\n \n experiment\n  insertCluster 200 🙍\n  insert 200 🙍\n \n \n 🦠\n  health 10\n  onTick\n   decrease health\n  onDeath\n   remove\n \n 🧟\n  health 100\n  onTick .03\n   log recovered\n   replaceWith 🦸‍♂️\n  onTick\n   decrease health\n   jitter\n  onDeath\n   replaceWith 🪦\n \n 🦸‍♂️\n  comment immune\n  onTick\n   jitter\n \n 🙍\n  onTick\n   jitter\n  onTouch\n   🦠\n    replaceWith 🧟\n   🧟\n    replaceWith 🧟\n \n insert 1 🦠\n \n onExtinct 🧟\n  log No more cases.\n  pause\n \n \n 🪦\n \n size 15\n ticksPerSecond 10\n \n report\n  roughjs.line\n  columns.keep 🧟\n   roughjs.line Active Cases\n  columns.keep 🪦\n   roughjs.line Cumulative Deaths\n \n \n comment\n  See Also\n  - http://covidsim.eu/\n  - http://modelingcommons.org/browse/one_model/6282#model_tabs_browse_info\n  - https://github.com/maplerainresearch/covid19-sim-mesa/blob/master/model.py\n  - https://www.frontiersin.org/articles/10.3389/fpubh.2020.563247/full\n  - https://ncase.me/covid-19/\n  - https://en.wikipedia.org/wiki/List_of_COVID-19_simulation_models\n  \neatTheBacon\n 🐕\n  onTick .2\n   turnToward 🥓\n   move\n  onTick .2\n   jitter\n 🥓\n  onTouch\n   🐕\n    remove\n 🥦\n \n \n insert 1 🐕\n insert 3 🥓\n insert 10 🥦\n \nelevators\n 🛗\n  onTick\n   move\n   move\n  angle South\n  bouncy\n  onHit\n   🚶🏻\n    pickItUp\n 🚶🏻\n  angle West\n  onTick\n   move\n  bouncy\n 🌾\n 🚪\n  onTick .001\n   spawn 🚶🏻\n 🪵\n  solid\n 🚗\n \n \n size 15\n \n rectangle 🪵 20➡️ 47⬇️ 5 1\n rectangle 🌾 40➡️ 1⬇️ 0 48\n rectangle 🚪 1➡️ 45⬇️ 15 2\n paste\n  🛗 6⬇️ 19➡️\n  🛗 4⬇️ 22➡️\n  🛗 3⬇️ 20➡️\n  🛗 10⬇️ 13➡️\n  🛗 4⬇️ 9➡️\n  🛗 3⬇️ 11➡️\n  🚗 47⬇️ 30➡️\n  🚗 47⬇️ 28➡️\nfire\n question How fast do fires spread?\n \n 🌲\n  onHit\n   ⚡️\n    replaceWith 🔥\n  onTouch\n   🔥\n    replaceWith 🔥\n \n ⚡️\n  health 10\n  onTick\n   decrease health\n  onDeath\n   remove\n \n 🔥\n  health 50\n  onTick\n   decrease health\n  onDeath\n   replaceWith ⬛️\n \n \n ⬛️\n  comment Burnt forest\n  html 🌲\n  style filter:grayscale(100%);\n \n \n insert 50% 🌲\n onTick .3\n  spawn ⚡️\nfireAdvanced\n question What is the effect of forest density on fire risk?\n \n experiment\n  treeDensitySetting 10%\n \n experiment\n  treeDensitySetting 20%\n \n experiment\n  treeDensitySetting 40%\n \n experiment\n  treeDensitySetting 80%\n \n catchFireSetting .3\n fireSpreadSetting .7\n fireLifetimeSetting 10\n lightningFrequencySetting .1\n \n 🌲\n  onHit catchFireSetting\n   ⚡️\n    replaceWith 🔥\n  onTouch fireSpreadSetting\n   🔥\n    replaceWith 🔥\n \n ⚡️\n  health 10\n  onTick\n   decrease health\n  onDeath\n   remove\n \n 🔥\n  health fireLifetimeSetting\n  onTick\n   decrease health\n  onDeath\n   replaceWith ⬛️\n \n \n ⬛️\n  comment Burnt forest\n  html 🌲\n  style filter:grayscale(100%);\n \n \n insert treeDensitySetting 🌲\n onTick lightningFrequencySetting\n  spawn ⚡️\n \ngameOfLife\n question Can simple rules produce complex effects?\n \n ⬛️\n  onNeighbors\n   ⬛️ < 2\n    replaceWith ◻️\n   ⬛️ > 3\n    replaceWith ◻️\n \n ◻️\n  onNeighbors\n   ⬛️ = 3\n    replaceWith ⬛️\n \n insert 10% ⬛️\n fill ◻️\n size 15\ngameOfLifeAdvanced\n # Conway's Game of Life\n \n experiment\n  neighborSetting 2\n \n experiment\n  neighborSetting 3\n \n experiment\n  neighborSetting 4\n \n experiment\n  neighborSetting 5\n \n ⬛️\n  onNeighbors\n   ⬛️ < 2\n    replaceWith ◻️\n   ⬛️ > neighborSetting\n    replaceWith ◻️\n \n ◻️\n  onNeighbors\n   ⬛️ = 3\n    replaceWith ⬛️\n \n insert 10% ⬛️\n fill ◻️\n size 15\ngospersGliderGun\n ⬛️\n  onNeighbors\n   ⬛️ < 2\n    replaceWith ◻️\n   ⬛️ > 3\n    replaceWith ◻️\n \n ◻️\n  onNeighbors\n   ⬛️ = 3\n    replaceWith ⬛️\n \n # Gosper's Glider Gun\n \n draw\n                          ⬛️           \n                        ⬛️  ⬛️           \n              ⬛️ ⬛️       ⬛️ ⬛️              \n             ⬛️    ⬛️     ⬛️ ⬛️             ⬛️ ⬛️\n            ⬛️      ⬛️    ⬛️ ⬛️             ⬛️ ⬛️\n  ⬛️ ⬛️         ⬛️    ⬛️  ⬛️ ⬛️     ⬛️  ⬛️           \n  ⬛️ ⬛️         ⬛️      ⬛️        ⬛️           \n             ⬛️    ⬛️                    \n              ⬛️ ⬛️                      \n \n \n fill ◻️\n \nmoths\n question Can you move the moths from one light to the other?\n \n 🦋\n  onTick .1\n   jitter\n   move\n  onTick .2\n   turnToward 💡\n   move\n   move\n 💡\n \n ticksPerSecond 10\n size 20\n style\n  .BoardComponent {background:black;}\n \n insert 10 🦋\n insert 2 💡\n \n comment\n  http://www.netlogoweb.org/launch#http://www.netlogoweb.org/assets/modelslib/Sample%20Models/Biology/Moths.nlogo\nninjas\n 🤺\n  health 100\n  onTick\n   decrease health\n   jitter\n \n 🥷\n  health 100\n  onTick\n   decrease health\n   jitter\n \n insert 50 🤺\n insert 50 🥷\npong\n \n \n 🏐\n  bouncy\n  onTick\n   move\n  angle West\n 🏓\n  angle East\n  onHit\n   🏐\n    kickIt\n 🏸\n  angle West\n  onHit\n   🏐\n    kickIt\n 🪵\n  solid\n \n size 20\n ticksPerSecond 10\n \n rectangle 🪵 30 15 5 5\n paste\n  🏓 13⬇️ 6➡️\n  🏸 13⬇️ 33➡️\n  🏐 13⬇️ 19➡️\n \n \npoolTable\n comment\n  Needs balls to collide. Acceleration.\n \n 🎱\n  bouncy\n  onHit\n   🎱\n    kickIt\n   🏐\n    kickIt\n \n 🪵\n  solid\n \n 🏐\n  bouncy\n  onTick .1\n   turnRandomly\n   kickIt\n  onTick .5\n   kickIt\n  onHit\n   🎱\n    kickIt\n  angle West\n \n rectangle 🪵 40 20 0 7\n paste\n  🏐 17⬇️ 32➡️\n  🎱 12⬇️ 7➡️\n  🎱 14⬇️ 7➡️\n  🎱 16⬇️ 7➡️\n  🎱 18⬇️ 7➡️\n  🎱 20⬇️ 7➡️\n  🎱 22⬇️ 7➡️\n  🎱 21⬇️ 8➡️\n  🎱 19⬇️ 8➡️\n  🎱 17⬇️ 8➡️\n  🎱 15⬇️ 8➡️\n  🎱 13⬇️ 8➡️\n  🎱 20⬇️ 9➡️\n  🎱 18⬇️ 9➡️\n  🎱 16⬇️ 9➡️\n  🎱 14⬇️ 9➡️\n  🎱 15⬇️ 10➡️\n  🎱 17⬇️ 10➡️\n  🎱 19⬇️ 10➡️\n  🎱 18⬇️ 11➡️\n  🎱 16⬇️ 11➡️\n  🎱 17⬇️ 12➡️\nsoccer\n \n \n ⚽️\n  onHit\n   🥅\n    pause\n    alert GOAAAAAAAAALLLL!\n  bouncy\n \n ⛹️‍♂️\n  onTick\n   jitter\n  onHit\n   ⚽️\n    kickIt\n \n ⛹️‍♀️\n  onTick\n   jitter\n  onHit\n   ⚽️\n    kickIt\n 🥅\n 🪵\n  solid\n \n size 20\n ticksPerSecond 10\n \n rectangle 🪵 30 15 5 5\n \n paste\n  🥅 13⬇️ 6➡️\n  🥅 13⬇️ 33➡️\n  ⚽️ 13⬇️ 19➡️\n \n paste\n  ⛹️‍♀️ 17⬇️ 14➡️\n  ⛹️‍♀️ 17⬇️ 17➡️\n  ⛹️‍♀️ 13⬇️ 17➡️\n  ⛹️‍♀️ 13⬇️ 14➡️\n  ⛹️‍♀️ 8⬇️ 14➡️\n  ⛹️‍♀️ 8⬇️ 17➡️\n  ⛹️‍♀️ 10⬇️ 14➡️\n  ⛹️‍♀️ 9⬇️ 10➡️\n  ⛹️‍♀️ 13⬇️ 8➡️\n  ⛹️‍♀️ 13⬇️ 10➡️\n  ⛹️‍♀️ 17⬇️ 10➡️\n \n paste\n  ⛹️‍♂️ 13⬇️ 31➡️\n  ⛹️‍♂️ 17⬇️ 28➡️\n  ⛹️‍♂️ 13⬇️ 28➡️\n  ⛹️‍♂️ 8⬇️ 29➡️\n  ⛹️‍♂️ 8⬇️ 25➡️\n  ⛹️‍♂️ 10⬇️ 25➡️\n  ⛹️‍♂️ 13⬇️ 25➡️\n  ⛹️‍♂️ 17⬇️ 25➡️\n  ⛹️‍♂️ 17⬇️ 21➡️\n  ⛹️‍♂️ 8⬇️ 21➡️\n  ⛹️‍♂️ 13⬇️ 21➡️\n \nstartupIdeas\n question What is the effect of ideas vs ideas with revenue?\n \n 👨‍💼🔖\n  comment person with an idea\n  onTick\n   jitter\n \n 👨‍💼💰\n  comment peron with an idea\n   that is making money\n  onTick\n   jitter\n \n 👨‍\n  onTick .1\n   jitter\n  onTick .1\n   turnToward 👨‍💼💰\n   move\n \n \n size 10\n insert 200 👨‍\n insert 30 👨‍💼🔖\n insert 3 👨‍💼💰\n \n \nstore\n 🚶🏻\n  onTick\n   move\n  angle North\n 🛒\n 🚪\n  onTick .1\n   spawn 🚶🏻\n 🪵\n  solid\n \n size 25\n \n rectangle 🪵 30 15 3 3\n paste\n  🚪 16⬇️ 17➡️\n \nvirus\n question What might the spread of a simple virus look like?\n \n 🧟\n  health 100\n  onTick .9\n   decrease health\n   jitter\n  onTick .01\n   log recovered\n   replaceWith 🦸‍♂️\n  onDeath\n   replaceWith 🪦\n \n 🙍\n  onTick\n   jitter\n  onTouch\n   🧟\n    replaceWith 🧟\n \n 🦸‍♂️\n  onTick\n   jitter\n \n insert 10% 🙍\n insert 1 🧟\n \n 🪦\n \n onExtinct 🧟\n  log No more cases.\n  pause\nwaves\n 🌊\n  onTick\n   move\n  angle South\n \n size 25\n ticksPerSecond 5\n \n rectangle 🌊 100 1 0\n rectangle 🌊 100 1 0 6\n rectangle 🌊 100 1 0 11\nzombies\n question Can you protect the family from the zombies?\n \n 🧟‍♂️\n  noPalette\n  onTick\n   jitter\n  onHit\n   🪃\n    replaceWith 🪦\n   💣\n    replaceWith 🪦\n   👨‍👩‍👧‍👦\n    pause\n    alert TheyGotYou!\n \n 🧱\n  solid\n \n 🔫\n  onTick .1\n   spawn 🪃\n \n 🪃\n  noPalette\n  angle West\n  onTick\n   move\n \n 💣\n \n 🪦\n  noPalette\n  comment Dead zombie\n \n 👨‍👩‍👧‍👦\n  noPalette\n \n size 30\n ticksPerSecond 10\n \n insertCluster 30 🧟‍♂️ 1 1\n paste\n  👨‍👩‍👧‍👦 12⬇️ 11➡️"}