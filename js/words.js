//Words
let words = {
	wordCache: {},
	list: [],
	newListLatestFulfilmentToken: null,
	test: 1,

	loadWords: function (lang, wordClass) {
		return new Promise((resolve, reject) => {
			//Check cache
			if (this.wordCache.hasOwnProperty(lang) && this.wordCache[lang].hasOwnProperty(wordClass)) {
				return resolve(this.wordCache[lang][wordClass]); //Return early from cache
			}

			//Parse CSV
			try {
				Papa.parse('words/' + lang + '/' + wordClass + '.csv', {
					download: true,
					header: true,
					skipEmptyLines: true,
					complete: results => {
						if (!results.data || !Array.isArray(results.data)) return resolve([]); //Return empty array early

						if (!this.wordCache.hasOwnProperty(lang)) {
							this.wordCache[lang] = {}; //Create cache parent
						}

						this.wordCache[lang][wordClass] = results.data; //Save to cache

						resolve(results.data);
					},
					error: (e, file) => {
						resolve([]); //Return empty array if the file does not exist
					},
				});
			} catch (e) {
				resolve([]); //Return empty array
			}
		});
	},
	newList: function (args) {
		return new Promise((resolve, reject) => {
			//TODO: Do not load new words if only list settings have changed - Only a shuffle is needed

			let defaultArgs = {
				fulfilmentToken: 0,
				langs: [],
				classes: [],
				seed: '',
			};

			args = {...defaultArgs, ...args};

			this.newListLatestFulfilmentToken = args.fulfilmentToken;
			this.list.length = 0; //Empty existing list

			let promises = [];

			args.langs.forEach(lang => {
				args.classes.forEach(wordClass => {
					promises.push(this.loadWords(lang, wordClass));
				});
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
