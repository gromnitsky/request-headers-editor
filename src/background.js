/* global iniReader */
import match_patterns from './match-patterns.js'

function main() {
    guess_storage_engine()
	.then(options)
	.then( r => ini_parse(r.ini))
	.then(mk_listener_callback)
	.then(listener_add)
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
    let pathern_matchers = urls.map(match_patterns)

    let callback = {
	headers: details => modify_headers(details, conf, pathern_matchers),
	tabs: (tabId, changeInfo, tab) => {
	    if (changeInfo.url && pathern_matchers.some( pm => pm(tab.url)))
		chrome.browserAction.setBadgeText({text: '1+', tabId: tab.id})
	}
    }

    return {urls, pathern_matchers, callback}
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

function listener_add(listener) {
    let hook = (_changes, _areaName) => storage_hook(hook, listener)
    console.log('storage.onChanged.addListener', listener.urls)
    chrome.storage.onChanged.addListener(hook)

    if (!listener.urls.length) {
	console.log('listener_add', 'no patterns to hook on')
	return
    }

    console.log('onBeforeSendHeaders.addListener')
    chrome.webRequest.onBeforeSendHeaders
	.addListener(listener.callback.headers, { urls: listener.urls },
		     ["blocking", "requestHeaders", "extraHeaders"])

    console.log('tabs.onUpdated.addListener')
    chrome.tabs.onUpdated.addListener(listener.callback.tabs)
}

function storage_hook(prev_hook, listener) {
    console.log('storage.onChanged.removeListener', listener.urls)
    chrome.storage.onChanged.removeListener(prev_hook)

    console.log('onBeforeSendHeaders.removeListener')
    chrome.webRequest.onBeforeSendHeaders.removeListener(listener.callback.headers)

    console.log('tabs.onUpdated.removeListener')
    chrome.tabs.onUpdated.removeListener(listener.callback.tabs)

    main()
}


main()
