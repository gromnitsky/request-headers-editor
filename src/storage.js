/* global iniReader */

export function parse() {
    return engine().then(get).then( r => ini_parse(r.ini))
}

export function engine() {
    return new Promise( (resolve, _) => {
	chrome.management.getSelf( info => {
	    resolve(chrome.storage[info.installType === 'development' ? 'local' : 'sync'])
	})
    })
}

export function get(storage) {
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

export function ini_parse(str) {
    let parser = new iniReader.IniReader()
    parser.load = function(s) { // a monkey patch
        this.lines = s.split("\n").filter(Boolean)
        this.values = this.parseFile()
        this.emit('fileParse')
    }
    parser.load(str)
    return parser.getBlock()
}

export function clear(storage) {
    return new Promise( (res, rej) => {
	storage.clear( () => {
	    chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(true)
	})
    })
}

export function save(storage, val) {
    return new Promise( (res, rej) => {
	storage.set({ini: val}, () => {
	    chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(val)
	})
    })
}
