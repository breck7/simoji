const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ReportButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span Δ
 title Generate Report
 class ReportButtonComponent
 clickCommand openReportInOhayoCommand`
  }
}

module.exports = { ReportButtonComponent }
