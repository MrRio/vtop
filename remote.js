var fs         = require('fs'),
    join       = require('path').join,
    Connection = require('ssh2');

var debugging  = process.env.DEBUG,
    debug      = debugging ? console.log : function() { /* noop */ };

var get_key = function(file) {
  var file = file || join(process.env.HOME, '.ssh', 'id_rsa');
  return fs.readFileSync(file);
}

var usage = {
  cpu  : "grep 'cpu ' /proc/stat | awk '{ print ($2+$4)*100/($2+$4+$5) \"%\" }'",
  ram  : "free | egrep 'Mem|buffers' | tr -d '\\n' | awk '{print $14*100/$7 \"%\"}'",
  disk : "df -lh | grep '% /$' | awk '{print $5}'"
}

var poll_command = function(interval) {
  var list = [];

  for (var key in usage) {
    var cmd = key + '_usage=$(' + usage[key] + ')';
    list.push(cmd);
  }

  list.push('echo $cpu_usage, $ram_usage, $disk_usage');
  return 'while sleep ' + interval + '; do ' + list.join(' && ') + '; done';
}

var Remote = function(host, opts) {
  var opts = opts || {};

  this.host = host;
  this.user = opts.user || process.env.USER;
  this.port = opts.port;
  this.connected = false;
}

Remote.prototype.connect = function(done) {

  var self = this,
      ssh = new Connection();

  debug('Connecting to ' + this.host);

  ssh.connect({
    readyTimeout : 30000,
    host         : this.host,
    port         : this.port,
    compress     : true,
    username     : this.user,
    privateKey   : this.key || get_key(this.key_path),
    agentForward : true,
    agent        : process.env['SSH_AUTH_SOCK']
  });

  ssh.on('error', function(err) {
    // debug('Connection error: ' + err.message);
    done(err);
  });

  ssh.on('end', function() {
    self.connected = false;
    debug('Disconnected from ' + self.host);
  });

  ssh.on('close', function(had_error) {
    // c.debug('Connection stream closed. Had error: ' + had_error);
  });

  ssh.on('ready', function() {
    debug('Connected to ' + self.host);
    self.connected = true;
    done();
  })

  this.connection = ssh;
}

Remote.prototype.start = function(cb) {
  var self = this;

  self.connect(function(err) {
    cb(err); 

    self.poll();
  })
}

Remote.prototype.poll = function(interval) {

  var self     = this,
      interval = interval || '1';

  var parse = function(data) {
    debug('Got data: ' + data.toString());

    var split = data.toString().split(', ');
    if (!split[1]) return;

    self.cpu_usage  = parseFloat(split[0]);
    self.mem_usage  = parseFloat(split[1]);
    self.disk_usage = parseFloat(split[2]);
  }

  this.connection.exec(poll_command(interval), { pty: true }, function(err, child) {
    if (err) return self.stop();

    child.on('end', function() {
      self.stop();
    });

    child.on('data', parse);
  });

}

/*
Remote.prototype.close_stream = function() {
  debug('Closing stream...');
  this.stream.exit();
}

Remote.prototype.stream_closed = function() {
  debug('Stream closed.');
  this.disconnect();
}
*/

Remote.prototype.stop = function(cb) {
  // if (this.stream) 
  //   this.close_stream(); // should trigger the stream_ended method
  if (this.connected)
    this.disconnect(function() { cb && cb() });
  else
    cb();
}

Remote.prototype.disconnect = function(cb) {
  debug('Disconnecting...');
  this.connection.on('end', cb);
  this.connection.end();
}

Remote.prototype.cpu = function() {
  return this.connected ? this.cpu_usage : null;
}

Remote.prototype.mem = function() {
  return this.connected ? this.mem_usage : null;
}

Remote.prototype.disk = function() {
  return this.connected ? this.disk_usage : null;
}

module.exports = Remote;