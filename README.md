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
  beforeSend: function(event, req){
    console.log('submitting the form...')
  },
  success: function(event, body, status, req){
    console.log('success!', body)
  },
  error: function(event, req, error){
    console.log('error :(', error)
  }
})
```

## Events

Without the need to bind any extra events, you can specify `beforeSend`, `success` and `error` functions in your extension of RemoteForm (shown in the example code above.)

### `ajax:beforeSend(req)`

Fired before sending the AJAX request. There's no stopping it, but it's useful to notify the user that something is happening, disable buttons/inputs, etc.

It's fired with the superagent request (`req`) object.

### `ajax:success(body, status, req)`

Upon success, this is fired with the returned `body`, response `status` and the ajax request `req` object.

### `ajax:error(req, error)`

When an error occurs, this event is fired with the original ajax request `req` and the `error` that the ajax library suffered.
