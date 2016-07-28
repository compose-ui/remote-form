# Changelog

## 2.1.0
- Now form event callbacks pass the form element as the first argument.
- You can set callback on the document to trigger on events for any form.

## 2.0.1
- Removed and upgraded lots of old dependencies.

## 2.0.0
- Removed Wagon dependency, requiring a full rewrite.

## 1.0.2

- Superagent uses `del` for DELETE requests since `delete` is a reserved word.

## 1.0.1

- Fixed bean events not sending in the correct arguments
- Fixed examples in readme
- Trigger error event if the status code is 4xx or 5xx
- Simplify tests

## 1.0.0

- Initial release
