import * as storage from './storage.js'

function main() {
    return storage.engine().then(storage.get).then( r => {
	document.querySelector('textarea').value = r.ini
    })
}

main()
