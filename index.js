var request = require('superagent')
var serialize = require('form-serialize')
var domify = require('domify')
var Event = require('compose-event')
var Dialog = require('compose-dialog')
var slice = Array.prototype.slice

var counter = 0
var DEFAULT_CONTINUE_BUTTON = 'Yes'
var callbacks = {}

var Form = {
  listen: function(){
    this.resetCallbacks()

    Event.on(document, 'submit', 'form[data-remote]',  this.submit.bind(this))
    Event.on(document, 'submit', 'form', this.disableWith)
    Event.on(document, 'click', 'a[data-method], a[data-confirm], button[data-method], button[data-confirm]', this.click.bind(this))
  },

  submit: function(event){
    var form = event.currentTarget
    event.preventDefault()

    var method = (form.dataset.method || form.getAttribute('method') || 'get').toLowerCase()
    var url = form.dataset.url || form.getAttribute('action')
    var data = serialize(form)
    var dataType = form.dataset.type || undefined // 'form' or 'json'

    var req;
    if (method === 'delete') method = 'del'
    var currentRequest = req = request[method](url)

    if (data)
      req.send(data)
    if (dataType)
      req.type(dataType)
    else
      req.set('Accept', '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript')

    this.fireCallbacks(form, 'beforeSend', [req])

    req.end(function(error, response) { this.handleResponse(form, error, response, currentRequest) }.bind(this))

    return req
  },

  handleResponse: function(form, error, response, currentRequest){
    if (error)
      this.fireCallbacks(form, 'error', [currentRequest.xhr, currentRequest.xhr.status, error])
    else if (response.error)
      this.fireCallbacks(form, 'error', [currentRequest.xhr, response.status, response.error])
    else
      this.fireCallbacks(form, 'success', [response.body, response.status, currentRequest.xhr])

    this.enableButtons(form)
    this.fireCallbacks(form, 'complete', [currentRequest.xhr, response ? response.status : 0])
    delete currentRequest
  },

  fireCallbacks: function(form, type, args) {
    callbacks[type].forEach(function(cb) { 
      if (cb[0] == form || (typeof cb[0] == 'string' && document.querySelector(cb[0]) == form)) {
        cb[1].apply(null, args)
      }
    })
    Event.fire(form, 'ajax:'+type, args)
  },

  // Register callbacks to be executed at each phase of the form event.
  on: function () {
    var args = slice.call(arguments)
    var form = args.shift()
    var events = args.shift()

    if (typeof events == 'string') {
      var objEvents = {}
      objEvents[events] = args.shift()
      events = objEvents
    }

    for (type in events) {
      var cb = events[type]
      if (events.hasOwnProperty(type) && callbacks.hasOwnProperty(type)) {
        callbacks[type].push([form, cb])
      }
    }
  },

  resetCallbacks: function() {
    callbacks = {
      beforeSend: [],
      success: [],
      error: [],
      complete: []
    }
  },

  disableWith: function(event) {
    var buttons = event.currentTarget.querySelectorAll('[data-disable-with]')
    Array.prototype.forEach.call(buttons, function(button){
      button.disabled = true
      button.classList.add('disabled')
      button.dataset.enabledButtonLabel = button.innerHTML

      var buttonText = button.dataset.disableWith
      if (!buttonText || buttonText == '') { buttonText = button.innerHTML }

      // Because dang it all, an elipsis is not three periods.
      button.innerHTML = buttonText.replace(/\.{3}/, '…')
    })
  },

  enableButtons: function(form) {
    var buttons = form.querySelectorAll('[data-disable-with]')
    Array.prototype.forEach.call(buttons, function(button){
      button.disabled = false
      button.classList.remove('disabled')

      button.innerHTML = button.dataset.enabledButtonLabel
    })
  },

  click: function(event) {
    event.preventDefault()
    var el = event.currentTarget
    var form = null

    if (el.dataset.method) {
      form = this.buildForm(el)
      document.body.appendChild(form)
    }

    if (el.dataset.confirm) {
      this.confirm(el, form)
    } else {
      form.submit()
    }
  },

  confirm: function(el, form) {
    var opts = {
      title: el.dataset.confirm,
      message: el.dataset.message || null,
      continue: el.dataset.continue || DEFAULT_CONTINUE_BUTTON
    }

    if (el.dataset.method) {
      opts.submit = '#' + form.getAttribute('id')
      if (el.dataset.method.toLowerCase() === 'delete') {
        opts.destructive = true
        opts.continue = el.dataset.continue || 'Delete'
      }
    } else {
      opts.follow = el.getAttribute('href')
      opts.destructive = !!el.dataset.destructive
      opts.submit = el.dataset.submit
    }

    Dialog.show(opts)
  },

  buildForm: function(el) {
    var method = el.dataset.method || 'post'
    var csrfToken = document.querySelector('meta[name=csrf-token]')
    var csrfParam = document.querySelector('meta[name=csrf-param]')

    var form = domify('<form id="link-'+ (++counter) +'" class="hidden" action="'+el.href+'" method="post"></form>')

    form.appendChild(domify('<input name="_method" value="' + method + '" type="hidden">'))

    if (csrfToken && csrfParam)
      form.appendChild(domify('<input name="' + csrfParam.getAttribute('content') + '" value="' + csrfToken.getAttribute('content') + '" type="hidden" />'))

    return form
  }

}

Event.ready(function(){
  // Since this is a replacement for Rails UJS, we want to be sure it's not being used.
  if (!window.$ || !$.rails) Form.listen()
})

module.exports = Form

