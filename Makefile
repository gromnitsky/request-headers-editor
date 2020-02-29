out := _out
ext := $(out)/ext
pkg := $(out)/$(shell json -d- -a name version < src/manifest.json | tr ' ' -)
crx := $(pkg).crx
zip := $(pkg).zip

compile:
compile.all :=



static.src  := $(wildcard src/*)
static.dest := $(patsubst src/%, $(ext)/%, $(static.src))
compile.all += $(static.dest)

$(ext)/%: src/%; $(copy)



$(ext)/inireader.js: node_modules/inireader/index.js
	browserify -s iniReader $< > $@

vendor.src := $(shell adieu -pe '$$("link,script").map((_,e) => $$(e).attr("href") || $$(e).attr("src")).get().filter(v => /node_modules/.test(v)).join`\n`' src/background.html)
vendor.dest := $(addprefix $(ext)/, $(vendor.src))
$(ext)/node_modules/%: node_modules/%; $(copy)

compile.all += $(ext)/inireader.js $(vendor.dest)



crx: $(crx)
%.crx: %.zip private.pem
	crx3-new private.pem < $< > $@

private.pem:
	openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out $@

zip: $(zip)
$(zip): $(compile.all)
	cd $(ext) && zip -qr $(CURDIR)/$@ *

define copy =
@mkdir -p $(dir $@)
cp $< $@
endef

compile: $(compile.all)

upload: $(crx)
	scp $< gromnitsky@web.sourceforge.net:/home/user-web/gromnitsky/htdocs/js/chrome/
	rsync -avPL --delete -e ssh test/ gromnitsky@web.sourceforge.net:/home/user-web/gromnitsky/htdocs/js/request-headers-editor
