/* global iniReader */
import match_patterns from './match-patterns.js'

function main(first_time = true) {
    let r = guess_storage_engine()
	.then(options)
	.then( r => ini_parse(r.ini))
	.then(mk_listener_callback)

    if (first_time) r = r.then(storage_hooks)

    r.then(listener_add)
}

function guess_storage_engine() {
    return new Promise( (resolve, _) => {
	chrome.management.getSelf( info => {
	    resolve(chrome.storage[info.installType === 'development' ? 'local' : 'sync'])
	})
    })
}

function options(storage) {
    return new Promise( (res, rej) => {
	storage.get(null, data => {
	    if (!data.ini) data.ini = `# hello

[*://*.wsj.com/*]
referer = https://www.facebook.com
user-agent = curl/7.61.1

[*://*.ft.com/*]
referer = https://news.google.com
`
	    chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(data)
	})
    })
}

function ini_parse(str) {
    let parser = new iniReader.IniReader()
    parser.load = function(s) { // a monkey patch
        this.lines = s.split("\n").filter(Boolean)
        this.values = this.parseFile()
        this.emit('fileParse')
    }
    parser.load(str)
    return parser.getBlock()
}

function mk_listener_callback(conf) {
    let urls = Object.keys(conf)
    let callback = details => modify_headers(details, conf, urls.map(match_patterns))
    return {urls, callback}
}

function modify_headers(details, conf, pathern_matchers) {
    let headers = pattern_find(conf, pathern_matchers, details.url)
    Object.keys(headers).forEach( name => {
	header_fix(details, name, headers[name])
    })

    console.log(details.url, headers)
    return { requestHeaders: details.requestHeaders }
}

function pattern_find(conf, pathern_matchers, url) { // early exit
    let patterns = Object.keys(conf)
    for (let idx in pathern_matchers) {
	if (pathern_matchers[idx](url)) return conf[patterns[idx]]
    }
}

function header_fix(details, name, value) {
    let cmp = (a, b) => a.toLowerCase() === b.toLowerCase()
    let hdr = details.requestHeaders.find( hdr => cmp(hdr.name, name))
    hdr ? hdr.value = value : details.requestHeaders.push({ name, value })
}

function storage_hooks(listener) {
    chrome.storage.onChanged.addListener( () => { // reread options
	console.log('onBeforeSendHeaders.removeListener')
	chrome.webRequest.onBeforeSendHeaders.removeListener(listener.callback)
	main(false)
    })
    return listener
}

function listener_add(listener) {
    console.log('onBeforeSendHeaders.addListener', listener.urls)
    chrome.webRequest.onBeforeSendHeaders
	.addListener(listener.callback, { urls: listener.urls },
		     ["blocking", "requestHeaders", "extraHeaders"])
}


main()
