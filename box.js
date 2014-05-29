
var output = '';
var width = 150;

output += '┌';
for (var i = 0; i < width; i ++) {
	output += '─';
}
output += "┐\n";

for (var i = 0; i < 15; i ++) {
	output += '│';
	for (var j = 0; j < width; j ++) {
		output += ' ';
	}
	output += "│\n";
}

output += '└';
for (var i = 0; i < width; i ++) {
	output += '─';
}
output += '┘\n';
console.log(output);