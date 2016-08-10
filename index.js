var request = require('superagent')
var serialize = require('form-serialize')
var Event = require('compose-event')
var slice = Array.prototype.slice

var counter = 0
var DEFAULT_CONTINUE_BUTTON = 'Yes'
var callbacks = {}

var Form = {
  listen: function(){
    self.resetCallbacks()

    Event.on(document, 'submit', 'form[data-remote]',  self.submit)
    Event.on(document, 'submit', 'form', self.disableWith)
    Event.on(document, 'click', 'a[data-method], a[data-confirm], button[data-method], button[data-confirm]', self.click)
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

    self.fireCallbacks(form, 'beforeSend', [req])

    req.end(function(error, response) { self.handleResponse(form, error, response, currentRequest) })

    return req
  },

  handleResponse: function(form, error, response, currentRequest){
    var xhr = currentRequest.xhr
    var status = self.processStatus(xhr, response)

    if (error || response.error) {
      error = self.processErrorResponse(xhr, error || response.error)
      self.fireCallbacks(form, 'error', [xhr, status, error])
    } else {
      self.fireCallbacks(form, 'success', [response.body, status, xhr])
    }

    self.enableButtons(form)
    self.fireCallbacks(form, 'complete', [xhr, status])
    delete currentRequest
  },

  processStatus: function(xhr, response) {
    if (response && response.status)
      return response.status
    else if (xhr && xhr.status) 
      return xhr.status
    else
      return 0
  },

  processErrorResponse: function(xhr, message) {
    if (xhr && xhr.response && xhr.repsonse.errors) {
      return xhr.response.errors
    }
    try {
      message = JSON.parse(xhr.response.text).messages
    } finally {
      return message
    }
  },

  fireCallbacks: function(form, type, args) {
    callbacks[type].forEach(function(cb) { 
      if (self.matchCallbackForm(form, cb[0])) {
        args.unshift(form)
        cb[1].apply(null, args)
      }
    })
    Event.fire(form, 'ajax:'+type, args)
  },

  matchCallbackForm: function(form, cb) {
    return (cb == form || (typeof cb == 'string' && document.querySelector(cb) == form) || cb == document)
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

  parentForm: function(el) {
    while (el && el.tagName != "FORM") {
      el = el.parentNode
    }

    return el
  },

  click: function(event) {
    event.preventDefault()
    var el = event.currentTarget
    var form = parentForm(el)

    // If the form submission trigger is not inside of a form, create one
    if (!form) {
      document.body.insertAdjacentHTML('beforeend', self.buildForm(el))
      form = document.body.lastChild
    }

    if (el.dataset.confirm) {
      self.triggerConfirm(el, form)
    } else {
      form.submit()
    }

  },

  triggerConfirm: function(el, form) {
    var opts = {
      title: el.dataset.confirm || null,
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

    self.confirm(opts)
  },

  confirm: function(options) {
    if(confirm(options.message || options.title)) {
      if (options.follow)
        window.location = options.follow
      else if (options.submit)
        document.querySelector(options.submit).submit()
    }
  },

  buildForm: function(el) {
    var method = el.dataset.method || 'post'
    var csrfToken = document.querySelector('meta[name=csrf-token]')
    var csrfParam = document.querySelector('meta[name=csrf-param]')

    var form = '<form id="link-'+ (++counter) +'" class="hidden" action="'+el.dataset.url || el.dataset.action || el.href+'" method="post">'
    form += '<input name="_method" value="' + method + '" type="hidden">'

    if (csrfToken && csrfParam)
      form += '<input name="' + csrfParam.getAttribute('content') + '" value="' + csrfToken.getAttribute('content') + '" type="hidden">'

    form += "</form>"

    return form
  }

}

Event.ready(function(){
  // Since this is a replacement for Rails UJS, we want to be sure it's not being used.
  if (!window.$ || !$.rails) Form.listen()
})

module.exports = self = Form

