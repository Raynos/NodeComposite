build:
	node build.js

test:
	firefox ./test/test.html

.PHONY: build test