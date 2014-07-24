var Wagon = require('wagon')
var request = require('superagent')
var serialize = require('form-serialize')
var bean = require('bean')

module.exports = Wagon.extend({

  events: {
    'ajax:success': 'success',
    'ajax:error': 'error',
    'ajax:beforeSend': 'beforeSend',
    'submit': 'submit'
  },

  '$': function(){
    return this.el.querySelector.apply(this.el, arguments) || {}
  },

  submit: function(event){
    event.preventDefault()
    var method = this.el.dataset.method || this.el.getAttribute('method') || 'get'
    var url = this.el.dataset.url || this.el.getAttribute('action')
    var data = serialize(this.el)
    var dataType = this.el.dataset.type || undefined // 'form' or 'json'

    var req;
    this.currentRequest = req = request[method.toLowerCase()](url)

    if (data)
      req.send(data)
    if (dataType)
      req.type(dataType)
    else
      req.set('Accept', '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript')

    bean.fire(this.el, 'ajax:beforeSend', req)

    req.end(this._handleResponse.bind(this))

    return req
  },

  _handleResponse: function(error, resp){
    if (error)
      bean.fire(this.el, 'ajax:error', this.currentRequest, error)
    else
      bean.fire(this.el, 'ajax:success', resp.body, resp.status, this.currentRequest)
    // This is fired every time.
    bean.fire(this.el, 'ajax:complete', this.currentRequest, resp ? resp.status : 0)
    delete this.currentRequest
  },

  beforeSend: function(event, req){},
  success: function(event, body, status, req){},
  error: function(event, req, error){}

})