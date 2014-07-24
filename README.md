# Compose Remote Form

Wraps good old forms and transforms them into AJAX forms.

## Installation

```
npm install compose-remote-form
```

## Usage

### Just make it AJAX-y already!

```javascript
var RemoteForm = require('compose-remote-form')

new RemoteForm({el: document.querySelector('form')})
```

### Extending remote forms

More details about each fired "event" below.

```javascript
RemoteForm.extend({
  beforeSend: function(req){
    console.log('submitting the form...')
  },
  success: function(body, status, xhr){
    console.log('success!', body)
  },
  error: function(xhr, status, error){
    console.log('error :(', error)
  }
})
```

## Events

Without the need to bind any extra events, you can specify `beforeSend`, `success` and `error` functions in your extension of RemoteForm (shown in the example code above.)

### `ajax:beforeSend(req)`

Fired before sending the AJAX request. There's no stopping it, but it's useful to notify the user that something is happening, disable buttons/inputs, etc.

It's fired with the superagent request (`req`) object.

### `ajax:success(body, status, xhr)`

Upon success, this is fired with the returned `body`, response `status` and the ajax request `xhr` object.

### `ajax:error(xhr, status, error)`

When an error occurs, this event is fired with the original ajax request `xhr` object and the `error` that the ajax library suffered.

It'll be fire in the event of a request not getting through (due to CORS, server down, etc.), a server error (5xx) or a client error (4xx).
