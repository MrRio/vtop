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
		/**
		 * Should call the callback with a new version number, or false
		 */
		check: function(callback) {
			try {
				var current = require('./package.json').version;

				var child_process = require('child_process');
				var ps = child_process.exec('npm info vtop', function (error, stdout, stderr) {
					var output = eval('(' + stdout + ')');
					if (output['dist-tags']['latest'] != current) {
						callback(output['dist-tags']['latest']);
					} else {
						callback(false);
					}
				});
			} catch(e) {
				callback(false);
			}

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

			    if (data.toString().indexOf('/bin/vtop') != -1) {
			    	path = data.toString().trim().split(' ')[2];
			    } 
			});
			child.stderr.on('data', function (data) {
			    console.log(data.toString());
			});

			child.on('close', function() {
				for (var file in require.cache) {
					delete require.cache[file];
				}
				console.log('Finished updating. Clearing cache and relaunching...');
				setTimeout(function() {
					require(path);
				}, 1000);
			});
		}
	}
}();

module.exports = upgrade;