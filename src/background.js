/* global UrlMatch */
import * as storage from './storage.js'

function main() {
    storage.parse().then(hooks_make).then(hooks_add)
}

function hooks_make(conf) {
    let urls = Object.keys(conf)
    let pathern_matchers = urls.map( v => new UrlMatch.default(v))

    let callback = {
	headers: details => modify_headers(details, conf, pathern_matchers),
	tabs: (tabId, changeInfo, tab) => {
	    if (changeInfo.url && pathern_matchers.some( m => m.test(tab.url)))
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

//    console.log(details.url, headers)
    return { requestHeaders: details.requestHeaders }
}

function pattern_find(conf, pathern_matchers, url) { // early exit
    let patterns = Object.keys(conf)
    for (let idx in pathern_matchers) {
	if (pathern_matchers[idx].test(url)) return conf[patterns[idx]]
    }
}

function header_fix(details, name, value) {
    let cmp = (a, b) => a.toLowerCase() === b.toLowerCase()
    let hdr = details.requestHeaders
    let idx = hdr.findIndex( h => cmp(h.name, name))
    if (-1 === idx)
	hdr.push({ name, value })
    else
	value ? hdr[idx].value = value : hdr.splice(idx, 1)
}

function hooks_add(listener) {
    console.log('hooks add', listener.urls)
    chrome.storage.onChanged.addListener(listener.callback.storage)

    if (!listener.urls.length) return

    let opt = ["blocking", "requestHeaders"]
    if (!is_firefox) opt.push("extraHeaders")

    chrome.webRequest.onBeforeSendHeaders
        .addListener(listener.callback.headers, { urls: listener.urls }, opt)
    chrome.tabs.onUpdated.addListener(listener.callback.tabs)
}

function hooks_rm(listener) {
    console.log('hooks rm', listener.urls)
    chrome.storage.onChanged.removeListener(listener.callback.storage)
    chrome.webRequest.onBeforeSendHeaders.removeListener(listener.callback.headers)
    chrome.tabs.onUpdated.removeListener(listener.callback.tabs)

    main()
}

function is_firefox() { return typeof browser !== "undefined" }

main()
