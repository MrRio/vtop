all:
	npm install

test:
	# todo - Add unit tests here
	@echo "Testing..."
	@echo ""
	@echo "Performance stats after 5 seconds:"
	@time node app.js --quit-after 5

release-patch: test
	git push origin master
	npm version patch -m "Release vtop patch version %s"
	sudo npm publish

release-minor: test
	git push origin master
	npm version minor -m "Release vtop minor version %s"
	sudo npm publish

release-major: test
	git push origin master
	npm version major -m "Release vtop major version %s"
	sudo npm publish

clean:
	rm -Rf node_modules