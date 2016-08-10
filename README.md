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
    // req is the current reuqest object
    console.log('submitting the form...')
  },
  success: function(form, eventType, xhr){
    console.log('success!', xhr.responseText)
  },
  error: function(form, eventType, xhr){
    console.log('error :(', xhr.errors)
  },
  complete: function(form, eventType xhr){
    // All form events have been triggered
    // Use this to do any generic cleanup
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


## Confirm dialog

If you add a `data-confirm='Are you sure?'` to your form's submission button to trigger a confirm dialog. This will use the browser's default confirm dialog but you can customize it like this if you wish.

```javascript
var RemoteForm = require('compose-remote-form')

RemoteForm.confirm = function(options) {
  // your code.
}
```

The options passed to your confirm function will look like this:

```javascript
options = {
  title: 'Are you sure?', // Based on the button's data-confirm attribute.
  submit: '#form-id',     // form's id, allowing you to trigger a javascript submit.
  message: '',            // OPTIONAL: button's data-message attribute, used to allow title/message style dialogs.
  destructive: true,      // OPTIONAL: Matches data-destructive attribute (used to set styling on warning style confirm dialogs
  follow: 'http://...',   // OPTIONAL: A data-follow attribute can be set to take a user to a url.
}
```

