//Main and Utilities

function clamp(number, max, min) {
	min = typeof min === 'number' ? min : 0;

	return Math.min(Math.max(number, min), max);
}

//Based on https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

//Based on https://stackoverflow.com/a/378001
function getTemplateString( templateid, data ) {
	return document.getElementById( templateid ).innerHTML
		.replace(
		/%(\w*)%/g, // or /{(\w*)}/g for "{this} instead of %this%"
		function( m, key ){
			return data.hasOwnProperty( key ) ? data[ key ] : "";
		}
	);
}

//Basic number hash generator
//Based on https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0
function stringToHash(s) {
	var h = 0, l = s.length, i = 0;
	if ( l > 0 )
	while (i < l)
		h = (h << 5) - h + s.charCodeAt(i++) | 0;
	return h;
};

//Based on https://stackoverflow.com/a/53758827
function shuffleArrayWithSeed(array, seed) {
	var m = array.length, t, i;

	// While there remain elements to shuffle…
	while (m) {

		// Pick a remaining element…
		i = Math.floor(random(seed) * m--);

		// And swap it with the current element.
		t = array[m];
		array[m] = array[i];
		array[i] = t;
		++seed
	}

	function random(seed) {
		var x = Math.sin(seed++) * 10000;
		return x - Math.floor(x);
	}

	return array;
}

function init() {
	ui.init();
}

init();
