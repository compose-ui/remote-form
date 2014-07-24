var helpers = require('./helpers')
var assert = helpers.assert
var makeHtml = helpers.makeHtml
var RemoteForm = require('../index')
var bean = require('bean')
var request = require('superagent')
var sinon = require('sinon')

var successCount, errorCount, beforeSendCount, completeCount = 0
var successArgs, errorArgs, beforeSendArgs, completeArgs = []

function beforeSendCb(){beforeSendCount++; beforeSendArgs = arguments}
function successCb(){successCount++; successArgs = arguments}
function errorCb(){errorCount++; errorArgs = arguments}
function completeCb(){completeCount++; completeArgs = arguments}

describe('RemoteForm', function(){
  var formEl, remoteForm;
  beforeEach(function(){
    successCount = errorCount = beforeSendCount = completeCount = 0
    successArgs, errorArgs, beforeSendArgs, completeArgs = []
    formEl = makeHtml(function(){/*
      <form data-remote="true"></form>
    */})
    bean.on(formEl, 'ajax:beforeSend', beforeSendCb)
    bean.on(formEl, 'ajax:success', successCb)
    bean.on(formEl, 'ajax:error', errorCb)
    bean.on(formEl, 'ajax:complete', completeCb)
    remoteForm = new RemoteForm({el: formEl})
    document.body.appendChild(formEl)
  })
  describe('basic', function(){
    describe('success', function(){
      beforeEach(function(){
        sinon.stub(request.Request.prototype, 'end', function(callback){
          callback(null, {})
        })
      })
      afterEach(function(){
        request.Request.prototype.end.restore()
      })
      beforeEach(function(done){
        bean.one(formEl, 'ajax:complete', function(){done()})
        bean.fire(formEl, 'submit')
      })

      it('fires one ajax:beforeSend event', function(){
        assert.strictEqual(beforeSendCount, 1)
      })
      it('fires one ajax:success event', function(){
        assert.strictEqual(successCount, 1)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(completeCount, 1)
      })
      it('fires zero ajax:error event', function(){
        assert.strictEqual(errorCount, 0)
      })
    })

    describe('error (unreachable server)', function(){
      beforeEach(function(){
        sinon.stub(request.Request.prototype, 'end', function(callback){
          this.xhr = {}
          callback(new Error('Fake error'))
        })
      })
      afterEach(function(){
        request.Request.prototype.end.restore()
      })
      beforeEach(function(done){
        bean.one(formEl, 'ajax:complete', function(){done()})
        bean.fire(formEl, 'submit')
      })
      it('fires zero ajax:success event', function(){
        assert.strictEqual(successCount, 0)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(completeCount, 1)
      })
      it('fires one ajax:error event', function(){
        assert.strictEqual(errorCount, 1)
      })
    })

    describe('error (response status)', function(){
      beforeEach(function(){
        sinon.stub(request.Request.prototype, 'end', function(callback){
          this.xhr = {}
          callback(null, {error: {status: 401}})
        })
      })
      afterEach(function(){
        request.Request.prototype.end.restore()
      })
      beforeEach(function(done){
        bean.one(formEl, 'ajax:complete', function(){done()})
        bean.fire(formEl, 'submit')
      })
      it('fires zero ajax:success event', function(){
        assert.strictEqual(successCount, 0)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(completeCount, 1)
      })
      it('fires one ajax:error event', function(){
        assert.strictEqual(errorCount, 1)
      })
    })
  })
  afterEach(function(){
    bean.off(formEl, 'ajax:beforeSend', beforeSendCb)
    bean.off(formEl, 'ajax:success', successCb)
    bean.off(formEl, 'ajax:error', errorCb)
    bean.off(formEl, 'ajax:complete', completeCb)
  })
})