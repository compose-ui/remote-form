var helpers = require('./helpers')
var assert = helpers.assert
var makeHtml = helpers.makeHtml
var RemoteForm = require('../index')
var event = require('compose-event')
var request = require('superagent')
var sinon = require('sinon')

describe('RemoteForm', function(){
  beforeEach(function(){
    this.formEl = makeHtml(function(){/*
      <form data-remote="true"></form>
    */})
    //this.remoteForm = new RemoteForm({el: this.formEl})
    
    this.beforeSendCb = sinon.spy()
    this.successCb = sinon.spy()
    this.errorCb = sinon.spy()
    this.completeCb = sinon.spy()
    
    event.on(this.formEl, 'ajax:beforeSend', this.beforeSendCb)
    event.on(this.formEl, 'ajax:success', this.successCb)
    event.on(this.formEl, 'ajax:error', this.errorCb)
    event.on(this.formEl, 'ajax:complete', this.completeCb)
    
    document.body.appendChild(this.formEl)
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
        event.one(this.formEl, 'ajax:complete', function(){done()})
        event.fire(this.formEl, 'submit')
      })

      it('fires one ajax:beforeSend event', function(){
        assert.strictEqual(this.beforeSendCb.callCount, 1)
      })
      it('fires one ajax:success event', function(){
        assert.strictEqual(this.successCb.callCount, 1)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(this.completeCb.callCount, 1)
      })
      it('fires zero ajax:error event', function(){
        assert.strictEqual(this.errorCb.callCount, 0)
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
        event.one(this.formEl, 'ajax:complete', function(){done()})
        event.fire(this.formEl, 'submit')
      })
      it('fires zero ajax:success event', function(){
        assert.strictEqual(this.successCb.callCount, 0)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(this.completeCb.callCount, 1)
      })
      it('fires one ajax:error event', function(){
        assert.strictEqual(this.errorCb.callCount, 1)
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
        event.one(this.formEl, 'ajax:complete', function(){done()})
        event.fire(this.formEl, 'submit')
      })
      it('fires zero ajax:success event', function(){
        assert.strictEqual(this.successCb.callCount, 0)
      })
      it('fires one ajax:complete event', function(){
        assert.strictEqual(this.completeCb.callCount, 1)
      })
      it('fires one ajax:error event', function(){
        assert.strictEqual(this.errorCb.callCount, 1)
      })
    })

    describe('DELETE', function(){
      beforeEach(function(){
        sinon.spy(request, 'del')
        sinon.stub(request.Request.prototype, 'end', function(callback){
          callback(null, {})
        })
      })
      afterEach(function(){
        request.Request.prototype.end.restore()
        request.del.restore()
      })
      beforeEach(function(done){
        this.formEl.dataset.method = "delete"
        event.one(this.formEl, 'ajax:complete', function(){done()})
        event.fire(this.formEl, 'submit')
      })
      it('fires one ajax:beforeSend event', function(){
        assert.strictEqual(this.beforeSendCb.callCount, 1)
      })
      it('fires one ajax:success event', function(){
        assert.strictEqual(this.successCb.callCount, 1)
      })
      it('calls the del method on the request', function(){
        assert(request.del.called)
      })
    })
  })
  afterEach(function(){
    event.off(this.formEl, 'ajax:beforeSend', this.beforeSendCb)
    event.off(this.formEl, 'ajax:success', this.successCb)
    event.off(this.formEl, 'ajax:error', this.errorCb)
    event.off(this.formEl, 'ajax:complete', this.completeCb)
  })
})
