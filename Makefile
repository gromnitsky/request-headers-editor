out := _out
ext := $(out)/ext
pkg := $(out)/$(shell json -d- -a name version < src/manifest.json | tr ' ' -)
crx := $(pkg).crx
zip := $(pkg).zip

compile:
compile.all :=



static.src  := $(shell find src -type f -name '*.js' -or -name '*.html' -or -name '*.png' -or -name '*.json')
static.dest := $(patsubst src/%, $(ext)/%, $(static.src))
compile.all += $(static.dest)

$(ext)/%: src/%; $(copy)



$(ext)/inireader.js: node_modules/inireader/index.js
	browserify -s iniReader $< > $@

compile.all += $(ext)/inireader.js



crx: $(crx)
$(crx): private.pem $(compile.all)
	google-chrome --pack-extension=$(out)/ext --pack-extension-key=$<
	mv $(out)/ext.crx $@

private.pem:
	openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out $@

zip: $(zip)
$(zip): private.pem $(compile.all)
	cd $(ext) && zip -qr $(CURDIR)/$@ *

define copy =
@mkdir -p $(dir $@)
cp $< $@
endef

compile: $(compile.all)

upload: $(crx)
	scp $< gromnitsky@web.sourceforge.net:/home/user-web/gromnitsky/htdocs/js/chrome/
