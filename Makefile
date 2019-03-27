out := _out
ext := $(out)/ext
crx := $(shell json -d- -a name version < src/manifest.json).crx

compile:
compile.all :=



static.src  := $(shell find src -type f -name '*.js' -or -name '*.html' -or -name '*.png' -or -name '*.json')
static.dest := $(patsubst src/%, $(ext)/%, $(static.src))
compile.all += $(static.dest)

$(ext)/%: src/%; $(copy)



$(ext)/inireader.js: node_modules/inireader/index.js
	browserify -s iniReader $< > $@

compile.all += $(ext)/inireader.js



crx: $(out)/$(crx)
$(out)/$(crx): private.pem $(compile.all)
	google-chrome --pack-extension=$(out)/ext --pack-extension-key=$<
	mv $(out)/ext.crx $@

private.pem:
	openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out $@

define copy =
@mkdir -p $(dir $@)
cp $< $@
endef

compile: $(compile.all)
