var blessed = require('blessed'),
	program = blessed.program();

// Create a screen object.
var screen = blessed.screen();

screen.on('keypress', function(ch, key) {
	if (key.name === 'q' || key.name === 'escape') {
		return process.exit(0);
	}
});

var header = blessed.text({
	top: 'top',
	left: 'left',
	width: '50%',
	height: '1',
	fg: '#a537fd',
	content: '{bold}vtop{/bold} {white-fg} - http://parall.ax/vtop{/white-fg}',
	tags: true
});
var date = blessed.text({
	top: 'top',
	left: '50%',
	width: '50%',
	height: '1',
	align: 'right',
	content: '',
	tags: true
});
screen.append(header);
screen.append(date);

var graph = blessed.box({
	top: 1,
	left: 'left',
	width: '100%',
	height: '50%',
	content: 'test',
	label: ' CPU Usage ',
	border: {
		type: 'line',
		fg: '#00ebbe'
	}
});

screen.append(graph);

var graph2;
var graph2appended = false;

var createGraphs = function() {
	if (graph2appended) {
		screen.remove(graph2);
	}
	graph2appended = true;
	graph2 = blessed.box({
		top: graph.bottom + 1,
		left: 'left',
		width: '50%',
		height: '50%',
		content: 'test',
		label: ' Memory ',
		border: {
			type: 'line',
			fg: '#00ebbe'
		}
	});
	screen.append(graph2);

};

screen.on('resize', function() {
	createGraphs();
});
createGraphs();

screen.append(graph);


var updateTime = function() {
	var time = new Date();
	date.setContent(time.getHours() + ':' + ('0' + time.getMinutes()).slice(-2) + ':' + ('0' + time.getSeconds()).slice(-2));
	screen.render();
};

updateTime();
setInterval(updateTime, 1000);

// Render the screen.
screen.render();