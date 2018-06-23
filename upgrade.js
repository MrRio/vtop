/**
 * npm package updater
 *
 * @copyright 2014 James HAll
 *
 * This will detect if a package needs and update,
 * and also update it
 */

var upgrade = (function () {
  return {
    /**
     * Should call the callback with a new version number, or false
     */
    check: function (callback) {
      try {
        var package = require('./package.json')

        var childProcess = require('child_process')
        childProcess.exec('npm info --json ' + package.name, function (error, stdout, stderr) {
          if (error) {
            callback(false)
            return
          }
          var output
          try {
            output = JSON.parse(stdout)
          } catch (e) {
            callback(false)
            return
          }
          if (output['dist-tags']['latest'] !== package.version) {
            callback(output['dist-tags']['latest'])
          } else {
            callback(false)
          }
        })
      } catch (e) {
        callback(false)
      }
    },
    /**
     * This will install the update and relaunch
     */
    install: function (packageName, vars) {
      var sudo = require('sudo')
      console.log('')
      console.log('Installing vtop update...')
      console.log('')
      console.log(' ** You will need to enter your password to upgrade ** ')
      console.log('')

      var args = ['npm', 'install', '-g', 'vtop']
      console.log(args.join(' '))

      var options = {
        cachePassword: false,
        prompt: 'Password:',
        spawnOptions: { stdio: 'inherit' }
      }
      var child = sudo(args, options)

      var path = false
      child.stdout.on('data', function (data) {
        console.log(data.toString())

        if (data.toString().indexOf('vtop.js') !== -1) {
          path = data.toString().trim().split(' ')[2]
        }
      })
      child.stderr.on('data', function (data) {
        console.log(data.toString())
      })

      child.on('close', function () {
        for (var file in require.cache) {
          delete require.cache[file]
        }
        console.log('Finished updating. Clearing cache and relaunching...')
        setTimeout(function () {
          for (var v in vars) {
            process[v] = vars[v]
          }
          require(path)
        }, 1000)
      })
    }
  }
}())

module.exports = upgrade
