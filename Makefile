build:
	node build.js

browserify:
	browserify ./lib/index.js --outfile ./vendor/nodecomposite.js

test:
	firefox ./test/test.html

.PHONY: build test
