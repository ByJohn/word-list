/**
 * Automatically tags words that are homonyms.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const csvFiles = findCsvFiles(__dirname + '/../words');
const homonyms = [...new Set(fs.readFileSync(path.resolve(__dirname, 'homonyms.txt'), 'utf8').split(os.EOL))];

csvFiles.forEach(file => {
	const data = fs.readFileSync(file, 'utf8');

	if (!data) return;

	let lines = data.split(os.EOL);

	lines.forEach((line, i) => {
		if (!line || i === 0) return; //Skip first line

		let parts = line.split(','),
			word = parts[0].toLowerCase();

		if (homonyms.includes(word)) {
			let tags = [];

			if (parts[2] != '') {
				tags = parts[2].split('|');
			}

			if (!tags.includes('Homonym')) {
				tags.push('Homonym');

				parts[2] = tags.join('|');
			}

			lines[i] = parts.join(',');
		}
	});

	fs.writeFileSync(file, lines.join(os.EOL));
});

function findCsvFiles(directory) {
	const files = fs.readdirSync(directory);

	const csvFiles = files.reduce((acc, file) => {
		const filePath = path.join(directory, file);
		const stats = fs.statSync(filePath);

		if (stats.isDirectory()) {
			// Recursively search in subdirectories
			acc.push(...findCsvFiles(filePath));
		} else if (path.extname(file).toLowerCase() === '.csv') {
			// Check if the file has a .csv extension
			acc.push(filePath);
		}

		return acc;
	}, []);

	return csvFiles;
}
