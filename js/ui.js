//UI
let ui = {
	$form: document.getElementById('form'),
	$checkboxes: document.querySelectorAll('#form input[type="checkbox"]'),
	$langs: document.querySelectorAll('#form input[name="lang"]'),
	$classes: document.querySelectorAll('#form input[name="class"]'),
	$textFields: document.querySelectorAll('#form input[type="text"], #form input[type="number"]'),
	$perPage: document.getElementById('per-page'),
	$startPage: document.getElementById('start-page'),
	$seed: document.getElementById('seed'),
	$preResultsCount: document.querySelector('#pre-results .count'),
	$preResultsPages: document.querySelector('#pre-results .pages'),
	$submit: document.getElementById('submit'),
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
		this.refreshForm();
	},
	setupEvents: function () {
		this.$form.addEventListener('submit', this.formSubmitted.bind(this), false);

		this.$checkboxes.forEach($checkbox => {
			$checkbox.addEventListener('change', debounce(this.refreshForm.bind(this), 200), false);
		});

		this.$perPage.addEventListener('keyup', this.updatePreResults.bind(this), false);
		this.$perPage.addEventListener('change', this.updatePreResults.bind(this), false);

		this.$seed.addEventListener('keyup', debounce(this.refreshForm.bind(this), 200), false);
		this.$seed.addEventListener('change', debounce(this.refreshForm.bind(this), 200), false);

		this.$close.addEventListener('click', this.closeList.bind(this), false);
		this.$prevPage.addEventListener('click', this.prevPage.bind(this), false);
		this.$nextPage.addEventListener('click', this.nextPage.bind(this), false);
		this.$toggleWords.addEventListener('click', this.toggleWords.bind(this), false);
	},

	//Form methods
	formSubmitted: function (e) {
		e.preventDefault();

		if (words.list.length < 1) return;

		this.setPage(this.getStartPage());
		this.openList();
	},
	refreshForm: function () {
		this.$submit.setAttribute('disabled', '');
		this.$form.classList.add('refreshing');

		//Get words
		let fulfilmentToken = Date.now(),
			args = {
				fulfilmentToken: fulfilmentToken,
				langs: this.getCheckedValues(this.$langs),
				classes: this.getCheckedValues(this.$classes),
				seed: this.getSeed(),
			};

		words.newList(args)
			.then(list => {
				if (fulfilmentToken != this.newListLatestFulfilmentToken) return; //Make sure we have loaded the last form refresh

				this.$form.classList.remove('refreshing');

				this.updatePreResults(list);

				if (list.length) {
					this.$submit.removeAttribute('disabled');
				}
			});

		this.newListLatestFulfilmentToken = fulfilmentToken;
	},
	updatePreResults: function (list) {
		list = Array.isArray(list) ? list : words.list;

		this.$preResultsCount.innerHTML = list.length;
		this.$preResultsPages.innerHTML = Math.ceil(list.length / this.getPerPage());
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
			let number = start + i + 1;

			wordsHtml += '<li><span class="number">' + number + '</span><span class="word">' + word.word + '</span></li>';
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
};
