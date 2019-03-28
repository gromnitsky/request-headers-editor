# Request Headers Editor

(Download the .crx file
[here](http://gromnitsky.users.sourceforge.net/js/chrome/).)

A Chrome 73+ extension that allows to edit request headers (add,
modify, delete) for any domain. Aims to be fast via creating hooks
instead of analysing each request.

Uber-useful for getting around paywalls.

The options page is actually a simple ini-config editor:

![](https://ultraimg.com/images/2019/03/28/ZHdD.png)

## Compilation

~~~
$ npm i
$ make crx
~~~

The result should be in `_out` dir.

## License

MIT.
