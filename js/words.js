//Words
let words = {
	wordCache: {},
	list: [],
	newListLatestFulfilmentToken: null,
	test: 1,

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
	newList: function (args) {
		return new Promise((resolve, reject) => {
			//TODO: Do not load new words if only list settings have changed - Only a shuffle is needed

			let defaultArgs = {
				fulfilmentToken: 0,
				csvs: [],
				seed: '',
			};

			args = {...defaultArgs, ...args};

			this.newListLatestFulfilmentToken = args.fulfilmentToken;
			this.list.length = 0; //Empty existing list

			let promises = [];

			args.csvs.forEach(csv => {
				promises.push(this.loadWords(csv));
			});

			Promise.allSettled(promises).then(results => {
				if (args.fulfilmentToken != this.newListLatestFulfilmentToken) return resolve(this.list); //Make sure we are processing the latest request

				this.list = [];

				results.forEach(result => this.list.push(...result.value)); //Merge all words into one list

				this.list = shuffleArrayWithSeed(this.list, stringToHash(args.seed));

				resolve(this.list);
			});
		});
	},
};
