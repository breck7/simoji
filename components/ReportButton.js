const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

class ReportButtonComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `span Δ
 title Generate Report
 class ${ReportButtonComponent.name} BottomButton
 clickCommand openReportInOhayoCommand`
  }
}

module.exports = { ReportButtonComponent }
