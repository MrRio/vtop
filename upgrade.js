/**
 * npm package updater
 *
 * @copyright 2014 James HAll
 * 
 * This will detect if a package needs and update, 
 * and also update it
 */
var upgrade = function() {

	return {
		check: function() {

		},
		/**
		 * This will install the update and relaunch
		 */
		install: function(package) {
			var blessed = require('blessed'),
			program = blessed.program(),
			spawn = require('child_process').spawn,
			exec = require('child_process').exec;

			var sudo = require('sudo');
			console.log('');
			console.log('Installing vtop update...');
			console.log('');
			console.log(' ** You will need to enter your password to upgrade ** ');
			console.log('');

			var args = ['npm', 'install', '-g', 'vtop'];
			console.log(args.join(' '));

			var options = {
			    cachePassword: false,
			    prompt: 'Password:',
			    spawnOptions: { stdio: 'inherit' }
			};
			var child = sudo(args, options);


			var path = false;
			child.stdout.on('data', function (data) {
			    console.log(data.toString());

			    if (data.toString().indexOf('vtop.js') != -1) {
			    	path = data.toString().trim().split(' ')[2];
			    } 
			});
			child.stderr.on('data', function (data) {
			    console.log(data.toString());
			});

			child.on('close', function() {
				console.log('Installed!');

				if (path === false) {
					console.log('');
					console.log('Type vtop to relaunch');
				} else {
					require(path);
				}
			});
		}

	}

}();

module.exports = upgrade;