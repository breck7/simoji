const SimConstants = {"grammar":"\n\n\n\n\n\n\n\n\n\n\n\n\nanyCell\nbooleanCell\nstringCell\n highlightScope string\nsettingValueCell\n highlightScope constant.numeric\ncssCell\n highlightScope string\njavascriptCell\n highlightScope string\nhtmlCell\n highlightScope string\nemojiCell\n highlightScope string\nohayoCell\n highlightScope string\nblankCell\ncodeCell\n highlightScope comment\ncommentCell\n highlightScope comment\nkeywordCell\n highlightScope keyword\ntextCell\n highlightScope string\nintegerCell\n highlightScope constant.numeric\nbehaviorNameCell\n highlightScope keyword\nconditionalOperatorCell\n highlightScope keyword\n enum < > = <= >=\npositionCell\n highlightScope constant.numeric\nneighborCountCell\n extends integerCell\n min 0\n max 8\nintegerOrPercentCell\n highlightScope constant.numeric\nprobabilityCell\n description A number between 0 and 1\n highlightScope constant.numeric\npropertyNameCell\n highlightScope keyword\nangleCell\n enum North South East West NorthWest NorthEast SouthWest SouthEast\n highlightScope constant.numeric\njavascriptLineParser\n catchAllCellType javascriptCell\nabstractCommandParser\n cells keywordCell\nabstractSubjectObjectCommandParser\n extends abstractCommandParser\nreplaceWithCommandParser\n extends abstractSubjectObjectCommandParser\n crux replaceWith\n cells keywordCell emojiCell\nkickItCommandParser\n extends abstractSubjectObjectCommandParser\n crux kickIt\nshootCommandParser\n extends abstractSubjectObjectCommandParser\n crux shoot\npickItUpCommandParser\n extends abstractSubjectObjectCommandParser\n crux pickItUp\nspawnCommandParser\n crux spawn\n extends abstractCommandParser\n cells keywordCell emojiCell\n catchAllCellType positionCell\nmoveToEmptySpotCommandParser\n crux moveToEmptySpot\n extends abstractCommandParser\n cells keywordCell\nremoveCommandParser\n description Remove this agent from the board.\n crux remove\n extends abstractCommandParser\n cells keywordCell\njavascriptCommandParser\n description An escape hatch so you can write custom javascript in a pinch.\n extends abstractCommandParser\n crux javascript\n catchAllParser javascriptLineParser\n cells keywordCell\nalertCommandParser\n extends abstractCommandParser\n crux alert\n catchAllCellType stringCell\nlogCommandParser\n extends abstractCommandParser\n crux log\n catchAllCellType stringCell\nnarrateCommandParser\n extends abstractCommandParser\n crux narrate\n catchAllCellType stringCell\npauseCommandParser\n extends abstractCommandParser\n crux pause\ndecreaseCommandParser\n extends abstractCommandParser\n description Decrease a property by 1.\n crux decrease\n cells keywordCell propertyNameCell\nincreaseCommandParser\n extends abstractCommandParser\n description Increase a property by 1.\n crux increase\n cells keywordCell propertyNameCell\nmoveCommandParser\n extends abstractCommandParser\n crux move\nturnRandomlyCommandParser\n extends abstractCommandParser\n crux turnRandomly\njitterCommandParser\n extends abstractCommandParser\n crux jitter\nturnTowardCommandParser\n description Turn to the closest agent of a certain type.\n extends abstractCommandParser\n crux turnToward\n cells keywordCell emojiCell\nturnFromCommandParser\n description Turn away from the closest agent of a certain type.\n extends abstractCommandParser\n crux turnFrom\n cells keywordCell emojiCell\nlearnCommandParser\n crux learn\n extends abstractCommandParser\n cells keywordCell behaviorNameCell\nunlearnCommandParser\n crux unlearn\n extends abstractCommandParser\n cells keywordCell behaviorNameCell\nagentDefinitionParser\n inScope abstractIgnoreParser abstractEventParser abstractAgentAttributeParser behaviorAttributeParser\n cells keywordCell\n catchAllParser errorParser\n compiler\n  stringTemplate \n javascript\n  compile() {\n   const root = this.root\n   const name = root.agentKeywordMap[this.firstWord]\n   const normal = super.compile()\n   const behaviors = this.filter(node => node.parserId === \"behaviorAttributeParser\")\n    .map(behavior => `\"${behavior.getLine()}\"`)\n    .join(\",\")\n   return `class ${name} extends Agent {\n      icon = \"${this.firstWord}\"\n      behaviors = [${behaviors}]\n      ${normal}\n    }`\n  }\nabstractAgentAttributeParser\n cells keywordCell\nstringAttributeParser\n extends abstractAgentAttributeParser\n pattern ^\\w+ .+$\n catchAllCellType stringCell\n javascript\n  compile() {\n   return `${this.firstWord} = \"${this.getWord(1)}\"`\n  }\nangleParser\n extends stringAttributeParser\n cells keywordCell angleCell\n cruxFromId\nagentStyleParser\n description Provide custom CSS for an agent type.\n extends stringAttributeParser\n cells keywordCell cssCell\n crux style\nagentHtmlParser\n description Provide custom HTML for each rendered agent.\n extends stringAttributeParser\n cells keywordCell htmlCell\n crux html\nabstractBooleanAttributeParser\n description A boolean attribute.\n extends abstractAgentAttributeParser\n javascript\n  compile() {\n   return `${this.firstWord} = true`\n  }\nnoPaletteParser\n extends abstractBooleanAttributeParser\n cruxFromId\n description Don't show this agent in the palette.\nsolidTraitParser\n description If set other agents won't pass through these.\n extends abstractBooleanAttributeParser\n crux solid\nbouncyTraitParser\n description If set other agents will bounce off this after a collision.\n extends abstractBooleanAttributeParser\n crux bouncy\nabstractIntegerAttributeParser\n extends abstractAgentAttributeParser\n description An integer attribute.\n cells keywordCell integerCell\n javascript\n  compile() {\n   return `${this.firstWord} = ${this.getWord(1)}`\n  }\ncustomIntegerAttributeParser\n pattern ^\\w+ \\d+$\n extends abstractIntegerAttributeParser\nhealthParser\n extends abstractIntegerAttributeParser\n cruxFromId\nagentWidthParser\n extends abstractIntegerAttributeParser\n description Width of the agent.\n crux width\nagentHeightParser\n extends abstractIntegerAttributeParser\n description Height of the agent.\n crux height\nsettingDefinitionParser\n description Define a configurable input.\n cells keywordCell settingValueCell\n pattern ^\\w+Setting .+$\nbehaviorAttributeParser\n cells behaviorNameCell\n pattern ^.*Behavior$\n javascript\n  compile() {\n   return \"\"\n  }\nbehaviorDefinitionParser\n inScope abstractIgnoreParser abstractEventParser\n cells behaviorNameCell\n pattern ^.*Behavior$\n catchAllParser errorParser\n javascript\n  compile() {\n   return \"\"\n  }\nstyleLineParser\n catchAllCellType cssCell\n catchAllParser styleLineParser\nabstractSetupParser\nstyleParser\n description Optional CSS to load in BoardStyleComponent\n extends abstractSetupParser\n cells keywordCell\n cruxFromId\n catchAllParser styleLineParser\n javascript\n  compile() {\n   return \"\"\n  }\nquestionParser\n cruxFromId\n description What are you trying to figure out?\n cells keywordCell\n catchAllCellType stringCell\n extends abstractSetupParser\natTimeParser\n cruxFromId\n description Run commands at a certain tick.\n cells keywordCell integerCell\n extends abstractSetupParser\n inScope abstractInjectCommandParser\nabstractSetupNumberParser\n cells keywordCell integerCell\n extends abstractSetupParser\n javascript\n  compile() {\n   return \"\"\n  }\nheightParser\n description Height of the grid. Default is based on screen size.\n extends abstractSetupNumberParser\n crux height\nwidthParser\n description Width of the grid. Default is based on screen size.\n extends abstractSetupNumberParser\n crux width\nseedParser\n description If you'd like reproducible runs set a seed for the random number generator.\n extends abstractSetupNumberParser\n cruxFromId\nticksPerSecondParser\n description Time in milliseconds of one step.\n extends abstractSetupNumberParser\n cruxFromId\nreportParser\n cruxFromId\n description Define a custom report template.\n catchAllParser ohayoLineParser\n extends abstractSetupParser\n cells keywordCell\n javascript\n  compile() {\n   return \"\"\n  }\ncommentLineParser\n catchAllCellType commentCell\nabstractIgnoreParser\n tags doNotSynthesize\n javascript\n  compile () {\n    return \"\"\n  }\ncommentParser\n extends abstractIgnoreParser\n catchAllCellType commentCell\n cruxFromId\n catchAllParser commentLineParser\ncommentAliasParser\n description Alternate alias for a comment.\n crux #\n extends commentParser\nblankLineParser\n extends abstractIgnoreParser\n description Blank lines compile do nothing.\n cells blankCell\n pattern ^$\nabstractInjectCommandParser\nfillParser\n description Fill all blank cells with this agent.\n extends abstractInjectCommandParser\n cells keywordCell emojiCell\n cruxFromId\ndrawParser\n extends abstractInjectCommandParser\n cells keywordCell\n cruxFromId\n catchAllParser drawLineParser\ninsertParser\n extends abstractInjectCommandParser\n cells keywordCell integerOrPercentCell emojiCell\n cruxFromId\ninsertAtParser\n extends insertParser\n description Insert at X Y\n cells keywordCell emojiCell positionCell positionCell\n cruxFromId\ninsertClusterParser\n extends insertParser\n cruxFromId\n catchAllCellType integerCell\nrectangleDrawParser\n extends abstractInjectCommandParser\n cells keywordCell emojiCell integerCell integerCell\n catchAllCellType integerCell\n crux rectangle\npasteDrawParser\n extends abstractInjectCommandParser\n cells keywordCell\n crux paste\n catchAllParser pasteLineParser\ndrawLineParser\n catchAllCellType emojiCell\npasteLineParser\n catchAllCellType anyCell\n catchAllParser pasteLineParser\ntargetEmojiParser\n inScope abstractCommandParser\n cells emojiCell\nabstractEventParser\n cells keywordCell\n catchAllCellType probabilityCell\n javascript\n  compile() {\n   return ``\n  }\nabstractInteractionEventParser\n extends abstractEventParser\n catchAllParser targetEmojiParser\nonHitParser\n extends abstractInteractionEventParser\n cruxFromId\n description Define what happens when this agent collides with other agents.\nonTouchParser\n extends abstractInteractionEventParser\n cruxFromId\n description Define what happens when this agent is adjacent to other agents.\nonNeighborsParser\n description Define what happens when a certain amount of neighbors are nearby.\n extends abstractInteractionEventParser\n inScope emojiAndNeighborConditionParser\n cruxFromId\nonDeathParser\n extends abstractEventParser\n cruxFromId\n inScope abstractCommandParser\n description Define what happens when this agent runs out of health.\nonTickParser\n extends abstractEventParser\n cruxFromId\n inScope abstractCommandParser\n description Define what happens each tick.\nemojiAndNeighborConditionParser\n inScope abstractCommandParser\n pattern ^.+ (<|>|=|<=|>=)+ .+$\n cells emojiCell conditionalOperatorCell neighborCountCell\nonExtinctParser\n cruxFromId\n inScope abstractCommandParser\n cells keywordCell emojiCell\n description Define what happens when a type of agent goes extinct from the board.\n javascript\n  compile() {\n   return \"\"\n  }\nexperimentParser\n cruxFromId\n cells keywordCell\n inScope abstractIgnoreParser abstractSetupParser abstractInjectCommandParser onTickParser onExtinctParser settingDefinitionParser\n catchAllCellType stringCell\nohayoLineParser\n description Data visualization code written for Ohayo.\n catchAllCellType ohayoCell\nerrorParser\n baseParser errorParser\nsimojiParser\n extensions simoji\n description A Tree Language that compiles to a TreeComponentFramework app.\n root\n inScope abstractIgnoreParser abstractSetupParser abstractInjectCommandParser onTickParser onExtinctParser behaviorDefinitionParser experimentParser settingDefinitionParser\n catchAllParser agentDefinitionParser\n compilesTo javascript\n example\n  🦋\n   onTick .1\n    turnRandomly\n    move\n   onTick .2\n    turnToward 💡\n    move\n  💡\n  \n  insert 10 🦋\n  insert 2 💡\n javascript\n  get agentTypes() {\n   return this.filter(node => node.parserId === \"agentDefinitionParser\")\n  }","examples":"ants\n comment\n  https://ccl.northwestern.edu/netlogo/models/Ants\n \n ⛰\n  onTick 0.05\n   spawn 🐜\n 🐜\n  onTick\n   jitter\n  onHit\n   🥖\n    pickItUp\n 🥖\n \n insert 3 🥖\n insert 1 ⛰\nbasketball\n question Is it better to shoot wildly or to bring it close to the basket?\n \n experiment Shoot rarely\n  shotProbabilitySetting .02\n \n experiment\n  shotProbabilitySetting .2\n \n experiment\n  shotProbabilitySetting .4\n \n experiment Shoot right away\n  shotProbabilitySetting .8\n \n 🏀\n  onHit\n   🥅⛹️‍♂️\n    narrate Blue scores!\n    spawn 🏀 15 9\n    spawn 🔵 1 18\n    remove\n   🥅⛹️‍♀️\n    narrate Red scores!\n    spawn 🏀 15 9\n    spawn 🔴 1 17\n    remove\n \n \n moveEastToBlankSpotBehavior\n  onTick\n   moveToEmptySpot\n   unlearn moveEastToBlankSpotBehavior\n \n \n 🔵\n  angle East\n  moveEastToBlankSpotBehavior\n 🔴\n  angle East\n  moveEastToBlankSpotBehavior\n \n \n ticksPerSecond 30\n \n hasBallBehavior\n  comment Sprint toward net\n  onTick .5\n   turnToward net\n   move\n   narrate breaks toward the net.\n  comment Shoot\n  onTick shotProbabilitySetting\n   turnToward net\n   shoot\n   narrate shoots!\n   learn noBallBehavior\n   unlearn hasBallBehavior\n  comment Pass\n  onTick .02\n   turnToward team\n   shoot\n   narrate passes the ball!\n   learn noBallBehavior\n   unlearn hasBallBehavior\n \n noBallBehavior\n  onTick .3\n   turnToward 🏀\n   move\n  onHit\n   🏀\n    pickItUp\n    narrate has the ball\n    learn hasBallBehavior\n    unlearn noBallBehavior\n  onTick .05\n   turnFrom opponent\n   move\n  onTick .1\n   turnFrom opponent\n   jitter\n \n # Blue Team\n ⛹️‍♂️\n  net 🥅⛹️‍♂️\n  team ⛹️‍♂️\n  opponent ⛹️‍♀️\n  noBallBehavior\n \n # Red Team\n ⛹️‍♀️\n  net 🥅⛹️‍♀️\n  team ⛹️‍♀️\n  opponent ⛹️‍♂️\n  noBallBehavior\n \n # Baskets\n 🥅⛹️‍♂️\n  html 🥅\n 🥅⛹️‍♀️\n  html 🥅\n paste\n  🥅⛹️‍♂️ 2 8\n  🥅⛹️‍♀️ 29 8\n  🏀 15 9\n \n # Court\n 🪵\n  solid\n rectangle 🪵 30 15 1 1\n \n # Red Team\n paste\n  ⛹️‍♀️ 6 9\n  ⛹️‍♀️ 6 5\n  ⛹️‍♀️ 11 11\n  ⛹️‍♀️ 11 8\n  ⛹️‍♀️ 11 5\n \n # Blue Team\n paste\n  ⛹️‍♂️ 25 8\n  ⛹️‍♂️ 25 6\n  ⛹️‍♂️ 20 11\n  ⛹️‍♂️ 20 7\n  ⛹️‍♂️ 20 4\n \ncity\n ⛪️\n  comment church\n 🏟\n  comment stadium\n 🏥\n  comment hospital\n 🏭\n  comment factory\n 🏦\n  comment bank\n 🏛\n  comment courthouse\n 🏫\n  comment school\n 🏡\n  comment house\n 🏘\n  comment houses\n 🎡\n  comment park\n 🏪\n  comment store\n 🚗\n  onTick\n   move\n   move\n  angle West\n 🚓\n  onTick\n   move\n   move\n  angle West\n 🚋\n  comment subway\n  onTick\n   move\n   move\n   move\n  angle West\n ⬜️\n  comment road\n 🟩\n ⛳️\n \n rectangle ⬜️ 10 20 0 0\n rectangle ⬜️ 10 1 0 10\n paste\n  🏛 8 9\n  🏭 4 1\n  🏭 3 1\n  🏭 2 1\n  🏭 1 1\n  🏡 5 18\n  🏡 6 18\n  🏡 7 18\n  🏡 8 18\ncops\n 🚗\n  onTick .5\n   jitter\n   move\n 🚓\n  onHit\n   🚗\n    alert Got em!\n    pause\n  onTick .1\n   turnToward 🚗\n   move\n  onTick .1\n   move\n \n ticksPerSecond 30\n \n paste\n  🚓 1 1\n  🚗 5 15\ncovid19\n 🦠\n \n question How long will the pandemic last?\n \n # Given someone has never been infected, what are the odds they get infected?\n succeptibilitySetting .95\n # What are odds of reinfection?\n reinfectionRateSetting .002\n \n # 1 is no lockdowns. 0 is total lockdown.\n freedomOfMovementSetting 1\n \n # What is starting population size?\n urbanPopulationSetting 150\n # What is starting rural population?\n ruralPopulationSetting 30\n # What is starting infected size?\n startingInfectedSetting 3\n \n # How many places can one get the vaccine?\n vaccineCentersSetting 5\n # How likely are people to seek the vaccine?\n vaccinationDesirabilitySetting .3\n # Given someone was vaxed, what are the odds they get infected?\n vaxSucceptibilitySetting .5\n \n experiment High Vaccination Rate, High Vaccine Efficacy\n  vaccinationDesirabilitySetting .8\n  vaxSucceptibilitySetting .05\n \n \n experiment High Vaccination Rate, Low Vaccine Efficacy\n  vaccinationDesirabilitySetting .8\n  vaxSucceptibilitySetting .75\n \n experiment Lockdown\n  freedomOfMovementSetting .3\n \n experiment High Reinfection Rate\n  reinfectionRateSetting .2\n \n \n insert startingInfectedSetting 🧟\n insert vaccineCentersSetting 💉\n \n insertCluster urbanPopulationSetting 🙍\n insert ruralPopulationSetting 🙍\n \n \n 🧟\n  health 100\n  onTick .03\n   log recovered\n   replaceWith 🦸‍♂️\n  onTick\n   decrease health\n   jitter\n  onDeath\n   replaceWith 🪦\n \n 🦸‍♂️\n  comment Recovered\n  onTick\n   jitter\n  onTouch reinfectionRateSetting\n   🧟\n    replaceWith 🧟\n \n lifeBehavior\n  onTick freedomOfMovementSetting\n   jitter\n \n seekVaccineBehavior\n  onTick vaccinationDesirabilitySetting\n   turnToward 💉\n   move\n \n \n 🙍\n  lifeBehavior\n  seekVaccineBehavior\n  onTouch innateImmunitySetting\n   🧟\n    replaceWith 🧟\n   💉\n    replaceWith 🧑🏽‍🚒\n \n \n 💉\n \n \n 🧑🏽‍🚒\n  lifeBehavior\n  onTouch vaxSucceptibilitySetting\n   🧟\n    replaceWith 🧟\n \n \n \n \n onExtinct 🧟\n  log No more cases.\n  pause\n \n \n 🪦\n \n \n ticksPerSecond 10\n \n report\n  roughjs.line\n  columns.keep 🧟\n   roughjs.line Active Cases\n  columns.keep 🪦\n   roughjs.line Cumulative Deaths\n \n \n comment\n  See Also\n  - http://covidsim.eu/\n  - http://modelingcommons.org/browse/one_model/6282#model_tabs_browse_info\n  - https://github.com/maplerainresearch/covid19-sim-mesa/blob/master/model.py\n  - https://www.frontiersin.org/articles/10.3389/fpubh.2020.563247/full\n  - https://ncase.me/covid-19/\n  - https://en.wikipedia.org/wiki/List_of_COVID-19_simulation_models\n  \n \ncovid19simple\n question What is the effect of population density on pandemic duration?\n \n experiment\n  insertCluster 100 🙍\n  insertCluster 100 🙍\n  insertCluster 100 🙍\n  insertCluster 30 🙍\n  insertCluster 30 🙍\n  insertCluster 10 🙍\n \n experiment\n  insert 200 🙍\n \n experiment\n  insertCluster 200 🙍\n \n experiment\n  insertCluster 200 🙍\n  insert 200 🙍\n \n \n 🦠\n  health 10\n  onTick\n   decrease health\n  onDeath\n   remove\n \n 🧟\n  health 100\n  onTick .03\n   log recovered\n   replaceWith 🦸‍♂️\n  onTick\n   decrease health\n   jitter\n  onDeath\n   replaceWith 🪦\n \n 🦸‍♂️\n  comment immune\n  onTick\n   jitter\n \n 🙍\n  onTick\n   jitter\n  onTouch\n   🦠\n    replaceWith 🧟\n   🧟\n    replaceWith 🧟\n \n insert 1 🦠\n \n onExtinct 🧟\n  log No more cases.\n  pause\n \n \n 🪦\n \n ticksPerSecond 10\n \n report\n  roughjs.line\n  columns.keep 🧟\n   roughjs.line Active Cases\n  columns.keep 🪦\n   roughjs.line Cumulative Deaths\n \n \n comment\n  See Also\n  - http://covidsim.eu/\n  - http://modelingcommons.org/browse/one_model/6282#model_tabs_browse_info\n  - https://github.com/maplerainresearch/covid19-sim-mesa/blob/master/model.py\n  - https://www.frontiersin.org/articles/10.3389/fpubh.2020.563247/full\n  - https://ncase.me/covid-19/\n  - https://en.wikipedia.org/wiki/List_of_COVID-19_simulation_models\n  \neatTheBacon\n 🐕\n  onTick .2\n   turnToward 🥓\n   move\n  onTick .2\n   jitter\n 🥓\n  onTouch\n   🐕\n    remove\n 🥦\n \n \n insert 1 🐕\n insert 3 🥓\n insert 10 🥦\n \nelevators\n 🛗\n  onTick\n   move\n   move\n  angle South\n  bouncy\n  onHit\n   🚶🏻\n    pickItUp\n 🚶🏻\n  angle West\n  onTick\n   move\n  bouncy\n 🌾\n 🚪\n  onTick .001\n   spawn 🚶🏻\n 🪵\n  solid\n 🚗\n \n \n rectangle 🪵 20 47 5 1\n rectangle 🌾 40 1 0 48\n rectangle 🚪 1 45 15 2\n paste\n  🛗 19 6\n  🛗 22 4\n  🛗 20 3\n  🛗 13 10\n  🛗 9 4\n  🛗 11 3\n  🚗 30 47\n  🚗 28 47\nfire\n question How fast do fires spread?\n \n 🌲\n  onHit\n   ⚡️\n    replaceWith 🔥\n  onTouch\n   🔥\n    replaceWith 🔥\n \n ⚡️\n  health 10\n  onTick\n   decrease health\n  onDeath\n   remove\n \n 🔥\n  health 50\n  onTick\n   decrease health\n  onDeath\n   replaceWith ⬛️\n \n \n ⬛️\n  comment Burnt forest\n  html 🌲\n  style filter:grayscale(100%);\n \n \n insert 50% 🌲\n onTick .3\n  spawn ⚡️\nfireAdvanced\n question What is the effect of forest density on fire risk?\n \n experiment\n  treeDensitySetting 10%\n \n experiment\n  treeDensitySetting 20%\n \n experiment\n  treeDensitySetting 40%\n \n experiment\n  treeDensitySetting 80%\n \n catchFireSetting .3\n fireSpreadSetting .7\n fireLifetimeSetting 10\n lightningFrequencySetting .1\n \n 🌲\n  onHit catchFireSetting\n   ⚡️\n    replaceWith 🔥\n  onTouch fireSpreadSetting\n   🔥\n    replaceWith 🔥\n \n ⚡️\n  health 10\n  onTick\n   decrease health\n  onDeath\n   remove\n \n 🔥\n  health fireLifetimeSetting\n  onTick\n   decrease health\n  onDeath\n   replaceWith ⬛️\n \n \n ⬛️\n  comment Burnt forest\n  html 🌲\n  style filter:grayscale(100%);\n \n \n insert treeDensitySetting 🌲\n onTick lightningFrequencySetting\n  spawn ⚡️\n \ngameOfLife\n question Can simple rules produce complex effects?\n \n ⬛️\n  onNeighbors\n   ⬛️ < 2\n    replaceWith ◻️\n   ⬛️ > 3\n    replaceWith ◻️\n \n ◻️\n  onNeighbors\n   ⬛️ = 3\n    replaceWith ⬛️\n \n insert 10% ⬛️\n fill ◻️\ngameOfLifeAdvanced\n # Conway's Game of Life\n \n experiment\n  neighborSetting 2\n \n experiment\n  neighborSetting 3\n \n experiment\n  neighborSetting 4\n \n experiment\n  neighborSetting 5\n \n ⬛️\n  onNeighbors\n   ⬛️ < 2\n    replaceWith ◻️\n   ⬛️ > neighborSetting\n    replaceWith ◻️\n \n ◻️\n  onNeighbors\n   ⬛️ = 3\n    replaceWith ⬛️\n \n insert 10% ⬛️\n fill ◻️\ngospersGliderGun\n ⬛️\n  onNeighbors\n   ⬛️ < 2\n    replaceWith ◻️\n   ⬛️ > 3\n    replaceWith ◻️\n \n ◻️\n  onNeighbors\n   ⬛️ = 3\n    replaceWith ⬛️\n \n # Gosper's Glider Gun\n \n draw\n                          ⬛️           \n                        ⬛️  ⬛️           \n              ⬛️ ⬛️       ⬛️ ⬛️              \n             ⬛️    ⬛️     ⬛️ ⬛️             ⬛️ ⬛️\n            ⬛️      ⬛️    ⬛️ ⬛️             ⬛️ ⬛️\n  ⬛️ ⬛️         ⬛️    ⬛️  ⬛️ ⬛️     ⬛️  ⬛️           \n  ⬛️ ⬛️         ⬛️      ⬛️        ⬛️           \n             ⬛️    ⬛️                    \n              ⬛️ ⬛️                      \n \n \n fill ◻️\n \nmoths\n question Can you move the moths from one light to the other?\n \n 🦋\n  onTick .1\n   jitter\n   move\n  onTick .2\n   turnToward 💡\n   move\n   move\n 💡\n \n ticksPerSecond 10\n style\n  .BoardComponent {background:black;}\n \n insert 10 🦋\n insert 2 💡\n \n comment\n  http://www.netlogoweb.org/launch#http://www.netlogoweb.org/assets/modelslib/Sample%20Models/Biology/Moths.nlogo\nninjas\n 🤺\n  health 100\n  onTick\n   decrease health\n   jitter\n \n 🥷\n  health 100\n  onTick\n   decrease health\n   jitter\n \n insert 50 🤺\n insert 50 🥷\npong\n \n \n 🏐\n  bouncy\n  onTick\n   move\n  angle West\n 🏓\n  angle East\n  onHit\n   🏐\n    kickIt\n 🏸\n  angle West\n  onHit\n   🏐\n    kickIt\n 🪵\n  solid\n \n ticksPerSecond 10\n \n rectangle 🪵 30 15 5 5\n paste\n  🏓 6 13\n  🏸 33 13\n  🏐 19 13\n \n \npoolTable\n comment\n  Needs balls to collide. Acceleration.\n \n 🎱\n  bouncy\n  onHit\n   🎱\n    kickIt\n   🏐\n    kickIt\n \n 🪵\n  solid\n \n 🏐\n  bouncy\n  onTick .1\n   turnRandomly\n   kickIt\n  onTick .5\n   kickIt\n  onHit\n   🎱\n    kickIt\n  angle West\n \n rectangle 🪵 40 20 0 7\n paste\n  🏐 32 17\n  🎱 7 12\n  🎱 7 14\n  🎱 7 16\n  🎱 7 18\n  🎱 7 20\n  🎱 7 22\n  🎱 8 21\n  🎱 8 19\n  🎱 8 17\n  🎱 8 15\n  🎱 8 13\n  🎱 9 20\n  🎱 9 18\n  🎱 9 16\n  🎱 9 14\n  🎱 10 15\n  🎱 10 17\n  🎱 10 19\n  🎱 11 18\n  🎱 11 16\n  🎱 12 17\nsoccer\n \n \n ⚽️\n  onHit\n   🥅\n    pause\n    alert GOAAAAAAAAALLLL!\n  bouncy\n \n ⛹️‍♂️\n  onTick\n   jitter\n  onHit\n   ⚽️\n    kickIt\n \n ⛹️‍♀️\n  onTick\n   jitter\n  onHit\n   ⚽️\n    kickIt\n 🥅\n 🪵\n  solid\n \n ticksPerSecond 10\n \n rectangle 🪵 30 15 5 5\n \n paste\n  🥅 6 13\n  🥅 33 13\n  ⚽️ 19 13\n \n paste\n  ⛹️‍♀️ 14 17\n  ⛹️‍♀️ 17 17\n  ⛹️‍♀️ 17 13\n  ⛹️‍♀️ 14 13\n  ⛹️‍♀️ 14 8\n  ⛹️‍♀️ 17 8\n  ⛹️‍♀️ 14 10\n  ⛹️‍♀️ 10 9\n  ⛹️‍♀️ 8 13\n  ⛹️‍♀️ 10 13\n  ⛹️‍♀️ 10 17\n \n paste\n  ⛹️‍♂️ 31 13\n  ⛹️‍♂️ 28 17\n  ⛹️‍♂️ 28 13\n  ⛹️‍♂️ 29 8\n  ⛹️‍♂️ 25 8\n  ⛹️‍♂️ 25 10\n  ⛹️‍♂️ 25 13\n  ⛹️‍♂️ 25 17\n  ⛹️‍♂️ 21 17\n  ⛹️‍♂️ 21 8\n  ⛹️‍♂️ 21 13\n \nstartupIdeas\n question What is the effect of ideas vs ideas with revenue?\n \n 👨‍💼🔖\n  comment person with an idea\n  onTick\n   jitter\n \n 👨‍💼💰\n  comment peron with an idea\n   that is making money\n  onTick\n   jitter\n \n 👨‍\n  onTick .1\n   jitter\n  onTick .1\n   turnToward 👨‍💼💰\n   move\n \n \n insert 200 👨‍\n insert 30 👨‍💼🔖\n insert 3 👨‍💼💰\n \n \nstore\n 🚶🏻\n  onTick\n   move\n  angle North\n 🛒\n 🚪\n  onTick .1\n   spawn 🚶🏻\n 🪵\n  solid\n \n rectangle 🪵 30 15 3 3\n paste\n  🚪 17 16\n \nvirus\n question What might the spread of a simple virus look like?\n \n 🧟\n  health 100\n  onTick .9\n   decrease health\n   jitter\n  onTick .01\n   log recovered\n   replaceWith 🦸‍♂️\n  onDeath\n   replaceWith 🪦\n \n 🙍\n  onTick\n   jitter\n  onTouch\n   🧟\n    replaceWith 🧟\n \n 🦸‍♂️\n  onTick\n   jitter\n \n insert 10% 🙍\n insert 1 🧟\n \n 🪦\n \n onExtinct 🧟\n  log No more cases.\n  pause\nwaves\n 🌊\n  onTick\n   move\n  angle South\n \n ticksPerSecond 5\n \n rectangle 🌊 100 1 0\n rectangle 🌊 100 1 0 6\n rectangle 🌊 100 1 0 11\nzombies\n question Can you protect the family from the zombies?\n \n 🧟‍♂️\n  noPalette\n  onTick\n   jitter\n  onHit\n   🪃\n    replaceWith 🪦\n   💣\n    replaceWith 🪦\n   👨‍👩‍👧‍👦\n    pause\n    alert TheyGotYou!\n \n 🧱\n  solid\n \n 🔫\n  onTick .1\n   spawn 🪃\n \n 🪃\n  noPalette\n  angle West\n  onTick\n   move\n \n 💣\n \n 🪦\n  noPalette\n  comment Dead zombie\n \n 👨‍👩‍👧‍👦\n  noPalette\n \n ticksPerSecond 10\n \n insertCluster 30 🧟‍♂️ 1 1\n paste\n  👨‍👩‍👧‍👦 11 12"}