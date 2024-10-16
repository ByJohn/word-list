//UI
let ui = {
	$form: document.getElementById('form'),
	$csvs: document.querySelectorAll('#form input[name="csv"]'),
	$filtersContainer: document.getElementById('filters-container'),
	$filtersToggle: document.getElementById('filters-toggle'),
	$filters: document.getElementById('filters'),
	$textFields: document.querySelectorAll('#form input[type="text"], #form input[type="number"]'),
	$perPage: document.getElementById('per-page'),
	$startPage: document.getElementById('start-page'),
	$seed: document.getElementById('seed'),
	$preResultsCount: document.querySelector('#pre-results .count'),
	$preResultsPages: document.querySelector('#pre-results .pages'),
	$submit: document.getElementById('submit'),
	lastFilters: {}, //Remembers what filters have been checked
	newListLatestFulfilmentToken: null, //Token (millisecond time) of the most recent word list refresh
	page: 1,
	$wordList: document.getElementById('word-list'),
	$wordListInner: document.getElementById('word-list-inner'),
	$close: document.getElementById('close'),
	$pageNumber: document.getElementById('page-number'),
	$totalPages: document.getElementById('total-pages'),
	$prevPage: document.getElementById('prev-page'),
	$nextPage: document.getElementById('next-page'),
	$toggleWords: document.getElementById('toggle-words'),

	init: function () {
		this.setupEvents();
		this.randomiseSeed();
		this.csvsChanged();
	},
	setupEvents: function () {
		this.$form.addEventListener('submit', this.formSubmitted.bind(this), false);

		this.$csvs.forEach($csv => {
			$csv.addEventListener('change', debounce(this.csvsChanged.bind(this), 200), false);
		});

		this.$filtersToggle.addEventListener('click', this.toggleFilters.bind(this), false);
		this.$filters.addEventListener('change', debounce(this.filtersChanged.bind(this), 200), false);

		this.$perPage.addEventListener('keyup', this.updateListStats.bind(this), false);
		this.$perPage.addEventListener('change', this.updateListStats.bind(this), false);

		this.$seed.addEventListener('keyup', debounce(this.prepareWords.bind(this), 200), false);
		this.$seed.addEventListener('change', debounce(this.prepareWords.bind(this), 200), false);

		this.$close.addEventListener('click', this.closeList.bind(this), false);
		this.$prevPage.addEventListener('click', this.prevPage.bind(this), false);
		this.$nextPage.addEventListener('click', this.nextPage.bind(this), false);
		this.$toggleWords.addEventListener('click', this.toggleWords.bind(this), false);

		this.$wordListInner.addEventListener('click', this.toggleWordDetails.bind(this), false);
	},

	//Form methods
	formSubmitted: function (e) {
		e.preventDefault();

		if (words.list.length < 1) return;

		this.setPage(this.getStartPage());
		this.openList();
	},
	setLoading: function (loading) {
		loading = typeof loading !== 'undefined' ? loading : true;

		if (loading) {
			this.$submit.setAttribute('disabled', '');
			this.$form.classList.add('refreshing');
		} else {
			this.$form.classList.remove('refreshing');

			if (words.list.length) {
				this.$submit.removeAttribute('disabled');
			}
		}
	},
	csvsChanged: function () {
		this.setLoading(true);

		let fulfilmentToken = Date.now(),
			args = {
				fulfilmentToken: fulfilmentToken,
				csvs: this.getCheckedValues(this.$csvs)
			};

		words.loadCSVs(args).then(() => {
			if (fulfilmentToken != this.newListLatestFulfilmentToken) return; //Make sure we have loaded the last form refresh

			this.updateAvailableFilters();

			this.prepareWords(fulfilmentToken);
		});

		this.newListLatestFulfilmentToken = fulfilmentToken;
	},
	prepareWords: function (fulfilmentToken) {
		this.setLoading(true);

		fulfilmentToken = typeof fulfilmentToken !== 'undefined' ? fulfilmentToken : Date.now();

		let args = {
				csvs: this.getCheckedValues(this.$csvs),
				filters: {
					noun: {
						type: this.getCheckedValues(this.$filters.querySelectorAll('input[type="checkbox"][name="noun-type"]')),
						tag: this.getCheckedValues(this.$filters.querySelectorAll('input[type="checkbox"][name="noun-tag"]')),
					},
					verb: {
						type: this.getCheckedValues(this.$filters.querySelectorAll('input[type="checkbox"][name="verb-type"]')),
						tag: this.getCheckedValues(this.$filters.querySelectorAll('input[type="checkbox"][name="verb-tag"]')),
					},
					adjective: {
						type: this.getCheckedValues(this.$filters.querySelectorAll('input[type="checkbox"][name="adjective-type"]')),
						tag: this.getCheckedValues(this.$filters.querySelectorAll('input[type="checkbox"][name="adjective-tag"]')),
					}
				},
				seed: this.getSeed(),
			};

		words.newList(args).then(list => {
			if (fulfilmentToken != this.newListLatestFulfilmentToken) return; //Make sure we have loaded the last form refresh

			this.updateListStats(list);

			this.setLoading(false);
		});

		this.newListLatestFulfilmentToken = fulfilmentToken;
	},
	updateListStats: function (list) {
		list = Array.isArray(list) ? list : words.list;

		this.$preResultsCount.innerHTML = list.length;
		this.$preResultsPages.innerHTML = Math.ceil(list.length / this.getPerPage());
	},

	//Filter methods
	toggleFilters: function () {
		this.$filtersContainer.classList.toggle('open');
	},
	updateAvailableFilters: function () {
		let wordClasses = {
				noun: 'Noun',
				verb: 'Verb',
				adjective: 'Adjective',
			},
			wordAttributes = {
				type: 'Type',
				tag: 'Tag',
			};

		this.$filtersContainer.classList.remove('empty');
		this.$filters.innerHTML = '';

		for (wordClass in wordClasses) {
			for (wordAttribute in wordAttributes) {
				let attributeMetadata = words.combinedMetadata[wordClass][wordAttribute],
					attributeOptions = '',
					attributeNames = Object.keys(attributeMetadata);

				if (attributeNames.length < 2) continue; //Skip if less than 2 options

				attributeNames.sort(); //Order names alphabetically

				for (let i = 0; i < attributeNames.length; ++i) {
					let attribute = attributeNames[i],
						checked = !this.lastFilters.hasOwnProperty(wordClass) || !this.lastFilters[wordClass].hasOwnProperty(wordAttribute) || (this.lastFilters?.[wordClass]?.[wordAttribute] && this.lastFilters[wordClass][wordAttribute].includes(attribute));

					attributeOptions += getTemplateString('filter-attribute-option', {
						wordClass: wordClass,
						wordAttribute: wordAttribute,
						value: attribute,
						label: attribute != '' ? attribute : '[No ' + wordAttribute + ']',
						count: attributeMetadata[attribute],
						checked: checked ? 'checked' : '',
					});
				}

				if (attributeOptions) {
					this.$filters.innerHTML += getTemplateString('filter-attribute-group', {
						wordClass: wordClass,
						wordAttribute: wordAttribute,
						title: wordClasses[wordClass] + ' ' + wordAttributes[wordAttribute],
						attributeOptions: attributeOptions,
					});
				}
			}
		}

		if (this.$filters.innerHTML == '') {
			this.$filtersContainer.classList.add('empty');
		} else {
			this.updateAllFilterGroupToggles();
		}
	},
	filtersChanged: function (e) {
		if (e.target.classList.contains('all')) {
			this.filterGroupToggleChanged(e.target);
		} else {
			this.selectedFiltersChanged();
			this.updateFilterGroupToggle(e.target);
		}
	},
	filterGroupToggleChanged: function ($allCheckbox) {
		$allCheckbox.closest('fieldset').querySelectorAll('input.attribute[type="checkbox"]').forEach($checkbox => {
			$checkbox.checked = $allCheckbox.checked; //Check/uncheck all
		});

		this.selectedFiltersChanged();
	},
	updateFilterGroupToggle: function ($el) {
		let $fieldset = $el.closest('fieldset'),
			$allCheckbox = $fieldset.querySelector('input.all[type="checkbox"]'),
			$checkboxes = [...$fieldset.querySelectorAll('input.attribute[type="checkbox"]')]; //Converts NodeList to Array

		let allChecked = $checkboxes.every($checkbox => {
			return $checkbox.checked;
		});

		$allCheckbox.checked = allChecked;
	},
	updateAllFilterGroupToggles: function () {
		this.$filters.querySelectorAll('input.all[type="checkbox"]').forEach($checkbox => {
			this.updateFilterGroupToggle($checkbox);
		});
	},
	selectedFiltersChanged: function () {
		this.$filters.querySelectorAll('input.attribute[type="checkbox"]').forEach($checkbox => {
			let wordClass = $checkbox.dataset.class,
				wordAttribute = $checkbox.dataset.attribute,
				value = $checkbox.value,
				checked = $checkbox.checked;

			if (!this.lastFilters.hasOwnProperty(wordClass)) {
				this.lastFilters[wordClass] = {};
			}

			if (!this.lastFilters[wordClass].hasOwnProperty(wordAttribute)) {
				this.lastFilters[wordClass][wordAttribute] = [];
			}

			let valueIndex = this.lastFilters[wordClass][wordAttribute].indexOf(value);

			if (checked && valueIndex === -1) {
				this.lastFilters[wordClass][wordAttribute].push(value);
			} else if (!checked && valueIndex > -1) {
				this.lastFilters[wordClass][wordAttribute].splice(valueIndex);
			}
		});

		this.prepareWords();
	},

	//Field methods
	getCheckedValues: function ($checkboxes) {
		let values = [];

		$checkboxes.forEach($checkbox => {
			if ($checkbox.checked) values.push($checkbox.value);
		});

		return values;
	},
	getPerPage: function () {
		let value = this.$perPage.value;

		return Math.max(1, value);
	},
	getStartPage: function () {
		let value = this.$startPage.value;

		return Math.max(1, value);
	},
	getSeed: function () {
		return this.$seed.value.trim().toUpperCase();
	},

	randomiseSeed: function () {
		this.$seed.value = Math.random().toString(36).replace(/\d/g, '').substring(2, 7);
	},

	//List methods
	openList: function () {
		this.$wordList.classList.add('show');
	},
	closeList: function () {
		this.$wordList.classList.remove('show');
	},
	setPage: function (targetPage) {
		let lastPage = Math.ceil(words.list.length / this.getPerPage());

		this.page = clamp(targetPage, lastPage, 1); //Clamp page

		this.$startPage.value = this.page; //Set start page to current page number

		let start = (this.page - 1) * this.getPerPage(),
			end = start + this.getPerPage();

		this.$pageNumber.innerHTML = this.page;
		this.$totalPages.innerHTML = lastPage;

		let pageWords = words.list.slice(start, end),
			wordsHtml = '';

		pageWords.forEach((word, i) => {
			let number = start + i + 1,
				tags = word.tags.trim() ? word.tags.split('|').join(' &bull; ') : '';

			wordsHtml += getTemplateString('word-item', {
				number: number,
				word: word.word,
				wordType: word.type,
				wordClass: word.wordClass.charAt(0).toUpperCase() + word.wordClass.slice(1), //Capitalise word
				wordTags: tags,
			});
		});

		this.$wordListInner.innerHTML = getTemplateString('word-list-page', {
			words: wordsHtml,
		});

		this.$wordListInner.scrollTop = 0; //Scroll the new page to the top
	},
	prevPage: function () {
		this.setPage(this.page - 1)
	},
	nextPage: function () {
		this.setPage(this.page + 1)
	},
	toggleWords: function () {
		this.$wordList.classList.toggle('hide-words');
	},
	toggleWordDetails: function () {
		this.$wordList.classList.toggle('show-details');
	},
};
