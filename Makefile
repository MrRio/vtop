all:
	npm install

test:
	# todo - Add unit tests here
	@echo "Testing..."
	@echo ""
	@echo "Performance stats after 5 seconds:"
	@time node app.js --quit-after 5

release: test
	git push origin master
	npm publish
	npm version minor -m "Bumped to version %s"

clean:
	rm -Rf node_modules