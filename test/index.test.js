var helpers = require('./helpers')
var assert = helpers.assert
var makeHtml = helpers.makeHtml
var RemoteForm = require('../index')
var bean = require('bean')
var request = require('superagent')
var sinon = require('sinon')

describe('RemoteForm', function(){
  beforeEach(function(){
    this.formEl = makeHtml(function(){/*
      <form data-remote="true"></form>
    */})
    this.remoteForm = new RemoteForm({el: this.formEl})
    
    this.beforeSendCb = sinon.spy()
    this.successCb = sinon.spy()
    this.errorCb = sinon.spy()
    this.completeCb = sinon.spy()
    
    bean.on(this.formEl, 'ajax:beforeSend', this.beforeSendCb)
    bean.on(this.formEl, 'ajax:success', this.successCb)
    bean.on(this.formEl, 'ajax:error', this.errorCb)
    bean.on(this.formEl, 'ajax:complete', this.completeCb)
    
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
        bean.one(this.formEl, 'ajax:complete', function(){done()})
        bean.fire(this.formEl, 'submit')
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
        bean.one(this.formEl, 'ajax:complete', function(){done()})
        bean.fire(this.formEl, 'submit')
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
        bean.one(this.formEl, 'ajax:complete', function(){done()})
        bean.fire(this.formEl, 'submit')
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
        bean.one(this.formEl, 'ajax:complete', function(){done()})
        bean.fire(this.formEl, 'submit')
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
    bean.off(this.formEl, 'ajax:beforeSend', this.beforeSendCb)
    bean.off(this.formEl, 'ajax:success', this.successCb)
    bean.off(this.formEl, 'ajax:error', this.errorCb)
    bean.off(this.formEl, 'ajax:complete', this.completeCb)
  })
})