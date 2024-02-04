const test = require('tape');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

Error.stackTraceLimit = 0; //Reduce stack traces to improve test report readability

const csvFiles = findCsvFiles(__dirname + '/../words');
const csvHeaders = ['word', 'type', 'tags'];

let typeList = {}, //Count of all word types by word class
	tagList = {}; //Count of all tags by word class

//Check the csv files exist
test('Data presence', t => {
	t.plan(1);

	if(csvFiles.length == 0) {
		t.fail('No csv files found');
	} else {
		t.pass('CSV files present');
		t.comment(csvFiles.length + ' csv files found');
	}
});

csvFiles.forEach(file => {
	const wordClass = path.parse(file).name; //Get word class based on file name

	test('Check ' + path.basename(path.dirname(file)) + '/' + path.basename(file), async t => {
		//TODO: Check for whitespace rows

		//csv parser is asynchronous, so run in promise
		await new Promise((resolve, reject) => {
			const options = {
				headers: true,
			};

			let csvParser = fs.createReadStream(file).pipe(csv.parse(options)),
				i = 0,
				lastRow = null,
				uniqueWords = new Set();

			csvParser.on('error', error => {
				t.fail('Error parsing: ' + error)

				resolve();
			});

			csvParser.on('headers', headers => {
				t.deepEqual(headers, csvHeaders, 'Correct headers');
			});

			csvParser.on('data', row => {
				i++;

				if (row.word.trim() === '') {
					failRow('Empty word');

					return; //Exit row early
				}

				if (lastRow && row.word.localeCompare(lastRow.word) === -1) failRow('Incorrect order');

				if (row.word[0] !== row.word[0].toUpperCase()) failRow('First letter lowercase');

				if (row.word.indexOf(' ') >= 0) failRow('Multiple words');

				if (uniqueWords.has(row.word)) {
					failRow('Duplicate word');
				} else {
					uniqueWords.add(row.word);
				}

				//TODO: Check word spelling?
				//TODO: Validate word types?

				addToList(typeList, wordClass, row.type);
				addToList(tagList, wordClass, row.tags);

				lastRow = row;
			});

			csvParser.on('end', rowCount => {
				t.pass('Valid CSV');

				t.comment('Parsed ' + rowCount + ' rows');
				t.ok(rowCount > 0, 'Not empty');

				resolve();
			});

			function failRow(error) {
				t.fail('Row ' + i + ': ' + error);
			}
		});
	});
});

test('Bulk check', t => {
	checkList(typeList, 'type');
	checkList(tagList, 'tag');

	t.end();

	function checkList(list, listType) {
		for (wordClass in list) {
			t.comment(Object.keys(list[wordClass]).length + ' unique ' + listType + 's for ' + wordClass + ':');

			for (thing in list[wordClass]) {
				t.ok(list[wordClass][thing] > 1, listType + '"' + thing + '" used more than once')

				t.comment(listType + ' ' + thing + ': ' + list[wordClass][thing]); //One thing per line to avoid long-line output issues
			}
		}
	}
});

function addToList(list, wordClass, string) {
	if (string.trim().length === 0) return;

	let things = string.trim().split('|');

	if (!list.hasOwnProperty(wordClass)) list[wordClass] = {};

	things.forEach(thing => {
		thing = thing.trim();

		if (!list[wordClass].hasOwnProperty(thing)) list[wordClass][thing] = 1;
		else list[wordClass][thing]++;
	});
}

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
