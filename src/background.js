/* global iniReader */
import match_patterns from './match-patterns.js'

function main() {
    guess_storage_engine()
	.then(options)
	.then( r => ini_parse(r.ini))
	.then(hooks_make)
	.then(hooks_add)
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

function hooks_make(conf) {
    let urls = Object.keys(conf)
    let pathern_matchers = urls.map(match_patterns)

    let callback = {
	headers: details => modify_headers(details, conf, pathern_matchers),
	tabs: (tabId, changeInfo, tab) => {
	    if (changeInfo.url && pathern_matchers.some( pm => pm(tab.url)))
		chrome.browserAction.setBadgeText({text: '1+', tabId: tab.id})
	}
    }
    let r = {urls, pathern_matchers, callback}
    callback.storage = (_changes, _areaName) => hooks_rm(r)

    return r
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

function hooks_add(listener) {
    console.log('hooks add', listener.urls)
    chrome.storage.onChanged.addListener(listener.callback.storage)

    if (!listener.urls.length) return

    chrome.webRequest.onBeforeSendHeaders
	.addListener(listener.callback.headers, { urls: listener.urls },
		     ["blocking", "requestHeaders", "extraHeaders"])
    chrome.tabs.onUpdated.addListener(listener.callback.tabs)
}

function hooks_rm(listener) {
    console.log('hooks rm', listener.urls)
    chrome.storage.onChanged.removeListener(listener.callback.storage)
    chrome.webRequest.onBeforeSendHeaders.removeListener(listener.callback.headers)
    chrome.tabs.onUpdated.removeListener(listener.callback.tabs)

    main()
}


main()
