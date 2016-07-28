# Compose Remote Form

Wraps good old forms and transforms them into AJAX forms.

## Installation

```
npm install compose-remote-form
```

## Usage

### Setup

```javascript
var RemoteForm = require('compose-remote-form')
```

### Add your own ajax event callbacks

More details about each fired "event" below.

```javascript

// Register single callbacks:
RemoteForm.on('#formid', 'error', function(form, body, status, xhr) {
  console.log('success!', body)
})

// Register multiple callbacks for a single form:
var formEl = document.querySelector('#formid')
RemoteForm.on(formEl, {
  beforeSend: function(form, req){
    console.log('submitting the form...')
  },
  success: function(form, body, status, xhr){
    console.log('success!', body)
  },
  error: function(form, xhr, status, error){
    console.log('error :(', error)
  },
  complete: function(form, xhr, status){
    console.log('complete:', status)
  },
})


// Listen to form events on all forms
RemoteForm.on(document, {
  success: function(form, body, status, xhr){
    console.log('a form was submited sucessfully!')
  },
})
```

## Events

Without the need to bind any extra events, you can specify `beforeSend`, `success` and `error` functions in your extension of RemoteForm (shown in the example code above.)

### `ajax:beforeSend(form, req)`

Fired before sending the AJAX request. There's no stopping it, but it's useful to notify the user that something is happening, disable buttons/inputs, etc.

It's fired with the superagent request (`req`) object.

### `ajax:success(form, body, status, xhr)`

Upon success, this is fired with the returned `body`, response `status` and the ajax request `xhr` object.

### `ajax:error(form, xhr, status, error)`

When an error occurs, this event is fired with the original ajax request `xhr` object and the `error` that the ajax library suffered.

It'll fire in the event of a request not getting through (due to CORS, server down, etc.), a server error (5xx) or a client error (4xx).

### `ajax:complete(form, xhr, status)`

The `complete` event is fired at the end of the ajax submission lifecycle,
regardless of success or failure. You might use this event to perform some
cleanup action no matter the end result of a form submission.
