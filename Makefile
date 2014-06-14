all:
	npm install

test:
	# todo - Add unit tests here
	@echo "Testing..."
	@echo ""
	@echo "Performance stats after 5 seconds:"
	@screen time node app.js --quit-after 5

release-patch: test
	npm version patch -m "Release vtop patch version %s"
	sudo npm publish
	git push origin master

release-minor: test
	npm version minor -m "Release vtop minor version %s"
	sudo npm publish
	git push origin master

release-major: test
	npm version major -m "Release vtop major version %s"
	sudo npm publish
	git push origin master

clean:
	rm -Rf node_modules