//Words
let words = {
	wordCache: {}, //Previously-loaded word sets
	wordMetadata: {}, //Extra data for each word set
	combinedMetadata: {}, //Combined data of selected word sets
	list: [], //Current, full word list
	newListLatestFulfilmentToken: null,

	standardiseWordClass: function (wordClass) {
		switch (wordClass.toLowerCase()) {
			case 'nouns' :
				return 'noun';

			case 'verbs' :
				return 'verb';

			case 'adjectives' :
				return 'adjective';
		}

		return wordClass;
	},
	loadCSVs: function (args) {
		return new Promise((resolve, reject) => {
			let defaultArgs = {
				fulfilmentToken: 0,
				csvs: [],
			};

			args = {...defaultArgs, ...args};

			this.newListLatestFulfilmentToken = args.fulfilmentToken;

			let promises = [];

			args.csvs.forEach(csv => {
				promises.push(this.loadWords(csv));
			});

			//Once all CSVs are loaded
			Promise.allSettled(promises).then(results => {
				if (args.fulfilmentToken != this.newListLatestFulfilmentToken) return resolve(this.list); //Make sure we are processing the latest request

				this.combineMetadata(args.csvs);

				resolve();
			});
		});
	},
	loadWords: function (csv) {
		return new Promise((resolve, reject) => {
			//Check cache
			if (this.wordCache.hasOwnProperty(csv)) {
				return resolve(this.wordCache[csv]); //Return early from cache
			}

			let pathParts = csv.split('/'),
				lang = pathParts[0],
				wordClass = this.standardiseWordClass(pathParts[1]);

			//Parse CSV
			try {
				Papa.parse('words/' + csv + '.csv', {
					download: true,
					header: true,
					skipEmptyLines: true,
					complete: results => {
						if (!results.data || !Array.isArray(results.data)) return resolve([]); //Return empty array early

						results.data.forEach(word => {
							word.lang = lang;
							word.wordClass = wordClass;
						});

						this.wordCache[csv] = results.data; //Save to cache

						this.addMetadata(csv, results.data);

						resolve(results.data);
					},
					error: (e, file) => {
						console.error('Error loading "words/' + csv + '.csv"', e, file);
						resolve([]); //Return empty array if the file does not exist
					},
				});
			} catch (e) {
				console.error('Error loading "words/' + csv + '.csv"', e);
				resolve([]); //Return empty array
			}
		});
	},
	addMetadata: function (csv, words) {
		if (this.wordMetadata.hasOwnProperty(csv)) return; //Skip if already added

		let metadata = {
			type: {},
			tag: {},
		};

		words.forEach(word => {
			let type = word.type.trim(),
				tags = word.tags.trim().split('|');

			if (!metadata.type.hasOwnProperty(type)) {
				metadata.type[type] = 1;
			} else {
				metadata.type[type]++;
			}

			tags.forEach(tag => {
				tag = tag.trim();

				if (!metadata.tag.hasOwnProperty(tag)) {
					metadata.tag[tag] = 1;
				} else {
					metadata.tag[tag]++;
				}
			});
		});

		this.wordMetadata[csv] = metadata;
	},
	combineMetadata: function (csvs) {
		//Organised by standardised word class
		this.combinedMetadata = {
			noun: {
				type: {},
				tag: {},
			},
			verb: {
				type: {},
				tag: {},
			},
			adjective: {
				type: {},
				tag: {},
			},
		};

		csvs.forEach(csv => {
			let pathParts = csv.split('/'),
				lang = pathParts[0],
				wordClass = this.standardiseWordClass(pathParts[1]);
				wordClassMetadata = this.combinedMetadata[wordClass],
				csvMetadata = this.wordMetadata[csv];

			for (type in csvMetadata.type) {
				if (!wordClassMetadata.type.hasOwnProperty(type)) {
					wordClassMetadata.type[type] = csvMetadata.type[type];
				} else {
					wordClassMetadata.type[type] += csvMetadata.type[type];
				}
			}

			for (tag in csvMetadata.tag) {
				if (!wordClassMetadata.tag.hasOwnProperty(tag)) {
					wordClassMetadata.tag[tag] = csvMetadata.tag[tag];
				} else {
					wordClassMetadata.tag[tag] += csvMetadata.tag[tag];
				}
			}
		});
	},
	//Gets a list of words given the word sets, filters and randomiser seed. The CSVs must have already been loaded into wordCache
	newList: function (args) {
		return new Promise((resolve, reject) => {
			//TODO: Do not load new words if only list settings have changed - Only a shuffle is needed (take care, considering shuffling may depend on input order)

			let defaultArgs = {
				fulfilmentToken: 0,
				csvs: [],
				filters: {},
				seed: '',
			};

			args = {...defaultArgs, ...args};

			this.list.length = 0; //Empty existing list

			args.csvs.forEach(csv => {
				let = wordSet = this.wordCache[csv],
					pathParts = csv.split('/'),
					lang = pathParts[0],
					wordClass = this.standardiseWordClass(pathParts[1]),
					wordClassCombinedMetadata = this.combinedMetadata[wordClass],
					possibleTypes = Object.keys(wordClassCombinedMetadata.type),
					possibleTags = Object.keys(wordClassCombinedMetadata.tag),
					filters = args.filters[wordClass],
					allTypesSelected = possibleTypes.length < 2 || possibleTypes.length == filters.type.length,
					allTagsSelected = possibleTags.length < 2 || possibleTags.length == filters.tag.length;

				if (allTypesSelected && allTagsSelected) {
					this.list.push(...wordSet); //Add all words in the word set

					return; //Skip to next csv
				}

				wordSet.forEach(word => {
					let tags = word.tags.trim().split('|').map(w => w.trim());

					if (
						(possibleTypes.length < 2 || allTypesSelected || filters.type.includes(word.type)) &&
						(possibleTags.length < 2 || allTagsSelected || filters.tag.filter(t => tags.includes(t)).length > 0)
					) {
						this.list.push(word);
					}
				});
			});

			this.list = shuffleArrayWithSeed(this.list, stringToHash(args.seed));

			resolve(this.list);
		});
	},
};
