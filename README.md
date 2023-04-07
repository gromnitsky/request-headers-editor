# Request Headers Editor

* [crx file][]
* [chrome web store][]

A Chrome/Firefox extension that allows to edit request headers (add,
modify, delete) for any domain. Aims to be fast via creating hooks
instead of analysing each request.

Uber-useful for getting around paywalls.

After installing the extension, visit [a test page][].

An options page is actually a simple ini-config editor:

![](https://sigwait.tk/~alex/mm/Request-Headers-Editor-0.0.5.png)

## Compilation

~~~
$ npm -g i json adieu browserify crx3-utils
$ npm i
$ make crx
~~~

The result should be in `_out` dir.

## License

MIT.

[crx file]: http://gromnitsky.users.sourceforge.net/js/chrome/
[chrome web store]: https://chrome.google.com/webstore/detail/request-headers-editor/ilnphcjchjmgfnoblebeachdjbhapapg
[a test page]: http://gromnitsky.users.sourceforge.net/js/request-headers-editor/examine-headers.html
