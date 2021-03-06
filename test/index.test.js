var assert = require('chai').assert
var RemoteForm = require('../index')
var event = require('compose-event')
var request = require('superagent')
var sinon = require('sinon')
var domify = require('domify')

describe('RemoteForm', function(){
  before(function() {
    event.fire(document, 'DOMContentLoaded')
    this.formEl = domify('<form data-remote="true"></form>')
    
    document.body.appendChild(this.formEl)
  })

  beforeEach(function(){
    this.beforeSendCb = sinon.spy()
    this.successCb = sinon.spy()
    this.errorCb = sinon.spy()
    this.completeCb = sinon.spy()
    
    // Typically reset by page loads, this needs to be done manually in testing
    RemoteForm.resetCallbacks()

    RemoteForm.on(this.formEl, {
      beforeSend: this.beforeSendCb,
      success: this.successCb,
      error: this.errorCb,
      complete: this.completeCb,
    })
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
      beforeEach(function(done){
        sinon.stub(request.Request.prototype, 'end', function(callback){
          this.xhr = {}
          callback(new Error('Fake error'))
        })
        event.one(this.formEl, 'ajax:complete', function(){done()})
        event.fire(this.formEl, 'submit')
      })
      afterEach(function(){
        request.Request.prototype.end.restore()
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
