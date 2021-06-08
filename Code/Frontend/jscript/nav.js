'use strict';
//#region ***  DOM references                           ***********
//#endregion

//#region ***  Callback-Visualisation - show___         ***********
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
//#endregion

//#region ***  Data Access - get___                     ***********
//#endregion

//#region ***  Event Listeners - listenTo___            ***********
const listentoNav = function () {
	let toggleTrigger = document.querySelectorAll('.js-toggle-nav');
	for (let i = 0; i < toggleTrigger.length; i++) {
		toggleTrigger[i].addEventListener('click', function () {
			console.log('ei');
			document.querySelector('body').classList.toggle('has-mobile-nav');
		});
	}
};
// Event listeners

// Socketio listener
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
	console.log('DOM Content Loaded.');
	listentoNav();
};

document.addEventListener('DOMContentLoaded', init);
//#endregion
