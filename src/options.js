import * as storage from './storage.js'

function main() {
    storage.engine().then( st => new App(st))
}

class App {
    constructor(st) {
	this.st = st
	this.node_save     = document.querySelector('#save')
	this.node_reset    = document.querySelector('#reset')
	this.node_textarea = document.querySelector('textarea')

	this.textarea_update()
	let input = debounce( () => this.node_save.disabled = false, 500)
	this.node_textarea.addEventListener('input', input)

	this.node_save.onclick = this.save.bind(this)
	this.node_reset.onclick = this.reset.bind(this)

	this.node_save.disabled = true
    }

    textarea_update() {
	storage.get(this.st).then( data => this.node_textarea.value = data.ini)
    }

    save() {
	Promise.resolve()
	    .then( () => storage.ini_parse(this.node_textarea.value)) //validate
	    .then( () => storage.save(this.st, this.node_textarea.value))
	    .then( () => this.node_save.disabled = true)
	    .catch(alert)
    }

    reset() {
	if (confirm('Are you sure?'))
	    storage.clear(this.st).then(this.textarea_update.bind(this))
    }
}

function debounce(fn, ms = 0) {
    let id
    return function(...args) {
	clearTimeout(id)
	id = setTimeout(() => fn.apply(this, args), ms)
    }
}

document.addEventListener('DOMContentLoaded', main)
