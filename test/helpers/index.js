var domify = require('domify')
var multiline = require('multiline')
var _ = require('lodash')
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g
_.template('hello {{ name }}!', { 'name': 'mustache' })

module.exports = {
  assert: require('chai').assert,
  makeHtml: function(fn, data){
    data = (data || {})
    return domify(_.template(multiline.stripIndent(fn), data))
  }
}