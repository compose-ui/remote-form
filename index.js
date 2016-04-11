var request = require('superagent')
var serialize = require('form-serialize')
var domify = require('domify')
var event = require('compose-event')
var dialog = require('compose-dialog')

var counter = 0
var DEFAULT_CONTINUE_BUTTON = 'Yes'

var Form = {
  listen: function(){

    event.on(document, {
      submit: this.submit.bind(this),
      'ajax:success': this.success.bind(this),
      'ajax:error': this.error.bind(this),
      'ajax:beforeSend': this.beforeSend.bind(this)
    }, 'form[data-remote]', this.submit)

    event.on(document, 'submit', 'form', this.disableWith)
    event.on(document, 'click', 'a[data-method], a[data-confirm], button[data-method], button[data-confirm]', this.click.bind(this))
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

    event.fire(form, 'ajax:beforeSend', [req])

    req.end(function(error, response) { this.handleResponse(error, response, currentRequest) }.bind(this))

    return req
  },

  handleResponse: function(error, response, currentRequest){
    if (error)
      event.fire(form, 'ajax:error', [currentRequest.xhr, currentRequest.xhr.status, error])
    else if (response.error)
      event.fire(form, 'ajax:error', [currentRequest.xhr, response.status, response.error])
    else
      event.fire(form, 'ajax:success', [response.body, response.status, currentRequest.xhr])
    // This is fired every time.
    event.fire(form, 'ajax:complete', [currentRequest.xhr, response ? response.status : 0])
    delete currentRequest
  },

  beforeSend: function(req){},
  success: function(body, status, xhr){},
  error: function(xhr, status, error){},

  disableWith: function(event) {
    var buttons = event.currentTarget.querySelectorAll('[data-disable-with]')
    Array.prototype.forEach.call(buttons, function(button){
      button.disabled = true
      button.classList.add('disabled')

      var buttonText = button.dataset.disableWith
      if (!buttonText || buttonText == '') { buttonText = button.innerHTML }

      // Because dang it all, an elipsis is not three periods.
      button.innerHTML = buttonText.replace(/\.{3}/, '…')
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

    dialog.show(opts)
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

event.ready(function(){
  // Since this is a replacement for Rails UJS, we want to be sure it's not being used.
  if (!window.$ || !$.rails) Form.listen()
})

module.exports = Form

