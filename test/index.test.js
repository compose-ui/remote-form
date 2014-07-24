var helpers = require('./helpers')
var assert = helpers.assert
var makeHtml = helpers.makeHtml
var RemoteForm = require('../index')
var bean = require('bean')

var proxy_url = 'http://localhost:8800'

var successes, errors, beforeSends, completes = 0

function addBeforeSend(){beforeSends++}
function addSuccess(){successes++}
function addError(){errors++}
function addComplete(){completes++}

describe('RemoteForm', function(){
  var formEl, remoteForm;
  beforeEach(function(){
    successes = errors = beforeSends = completes = 0
    formEl = makeHtml(function(){/*
      <form data-remote="true"></form>
    */})
    bean.on(formEl, 'ajax:beforeSend', addBeforeSend)
    bean.on(formEl, 'ajax:success', addSuccess)
    bean.on(formEl, 'ajax:error', addError)
    bean.on(formEl, 'ajax:complete', addComplete)
    remoteForm = new RemoteForm({el: formEl})
    document.body.appendChild(formEl)
  })
  describe('basic', function(){
    describe('success', function(){
      beforeEach(function(done){
        formEl.setAttribute('action', proxy_url + '/success')
        bean.one(formEl, 'ajax:complete', function(){done()})
        bean.fire(formEl, 'submit')
      })

      it('fires one ajax:beforeSend event', function(){
        assert.strictEqual(beforeSends, 1)
      })
      it('fires one ajax:success event', function(){
        assert.strictEqual(successes, 1)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(completes, 1)
      })
      it('fires zero ajax:error event', function(){
        assert.strictEqual(errors, 0)
      })
    })

    describe('error', function(){
      beforeEach(function(done){
        formEl.setAttribute('action', proxy_url + '/error')
        bean.one(formEl, 'ajax:complete', function(){done()})
        remoteForm._handleResponse(new Error('Fake error'))
      })
      it('fires zero ajax:success event', function(){
        assert.strictEqual(successes, 0)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(completes, 1)
      })
      it('fires one ajax:error event', function(){
        assert.strictEqual(errors, 1)
      })
    })
  })
  afterEach(function(){
    bean.off(formEl, 'ajax:beforeSend', addBeforeSend)
    bean.off(formEl, 'ajax:success', addSuccess)
    bean.off(formEl, 'ajax:error', addError)
    bean.off(formEl, 'ajax:complete', addComplete)
  })
})