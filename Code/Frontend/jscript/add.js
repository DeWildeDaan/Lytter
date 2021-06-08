'use strict';
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);
const backend = `http://${lanIP}/api/v1`;

//#region ***  DOM references                           ***********
let htmlAddTrashcan, htmlName, htmlLatitude, htmlLongitude, htmlTreshHold, htmlInterval;
let valName, valLat, valLong, valTreshhold, valInterval, valMessage;
//#endregion

//#region ***  Callback-Visualisation - show___         ***********
const showStatus = function() {
	let lastValue = htmlAddTrashcan.value;
	htmlAddTrashcan.value = valMessage;
	setTimeout(function(){
		htmlAddTrashcan.value = lastValue;
		htmlAddTrashcan.disabled = false;
		if(valMessage == 'Trashcan added!'){
			htmlName.value = "";
			htmlLatitude.value = "";
			htmlLongitude.value = "";
			htmlTreshHold.value = "";
			htmlInterval.value = "";
		}
	}.bind(this), 2000);
}
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const callbackError = function(jsonObject) {
	console.log(jsonObject);
}
//#endregion

//#region ***  Data Access - get___                     ***********
//#endregion

//#region ***  Event Listeners - listenTo___            ***********
const listentoNav = function () {
	let toggleTrigger = document.querySelectorAll('.js-toggle-nav');
	for (let i = 0; i < toggleTrigger.length; i++) {
		toggleTrigger[i].addEventListener('click', function () {
			document.querySelector('body').classList.toggle('has-mobile-nav');
		});
	}
};

const listentoValidation = function() {
	htmlName.addEventListener('input', function(){
		if(this.value == ""){
			this.classList.add('c-form__invalid');
			valName = false;
		} else {
			this.classList.remove('c-form__invalid');
			valName = true;
		}
	})

	htmlLatitude.addEventListener('input', function(){
		if(this.value == "" | isNaN(this.value) | this.value == 0){
			this.classList.add('c-form__invalid');
			valLat = false;
		} else {
			this.classList.remove('c-form__invalid');
			valLat = true;
		}
	})

	htmlLongitude.addEventListener('input', function(){
		if(this.value == "" | isNaN(this.value)| this.value == 0){
			this.classList.add('c-form__invalid');
			valLong = false;
		} else {
			this.classList.remove('c-form__invalid');
			valLong = true;
		}
	})

	htmlTreshHold.addEventListener('input', function(){
		if(this.value == "" | isNaN(this.value)| this.value == 0){
			this.classList.add('c-form__invalid');
			valTreshhold = false;
		} else {
			this.classList.remove('c-form__invalid');
			valTreshhold = true;
		}
	})

	htmlInterval.addEventListener('input', function(){
		if(this.value == "" | isNaN(this.value)| this.value == 0){
			this.classList.add('c-form__invalid');
			valInterval = false;
		} else {
			this.classList.remove('c-form__invalid');
			valInterval = true;
		}
	})
	
};

const listentoAdd = function() {
	htmlAddTrashcan.addEventListener('click', function(){
		valMessage = 'Nothing to add!';
		htmlAddTrashcan.disabled = true;
		let url = `${backend}/trashcans`;
		if(valName == true){
			if(valLat == true){
				if(valLong == true){
					if(valTreshhold == true) {
						if(valInterval == true) {
							const body = JSON.stringify({
								name: htmlName.value,
								lat: htmlLatitude.value,
								long: htmlLongitude.value,
								treshhold: htmlTreshHold.value,
								interval: htmlInterval.value
							});
							valMessage = 'Trashcan added!';	
							handleData(url, showStatus, callbackError, 'POST', body);
						} else {
							valMessage = 'Invalid interval';
							showStatus();
						}
					} else {
						valMessage = 'Invalid tresh hold';
						showStatus();
					}
				} else {
					valMessage = 'Invalid Longitude';
					showStatus();
				}
			} else {
				valMessage = 'Invalid Latitude';
				showStatus();
			}
		} else {
			valMessage = 'Invalid Name';
			showStatus();
		}
		
		});
};
// Event listeners

// Socketio listener
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
	console.log('DOM Content Loaded.');
	htmlAddTrashcan = document.querySelector('.js-add-btn');
	htmlName = document.querySelector('.js-add-name');
	htmlLatitude = document.querySelector('.js-add-latitude');
	htmlLongitude = document.querySelector('.js-add-longitude');
	htmlTreshHold = document.querySelector('.js-add-treshhold');
	htmlInterval = document.querySelector('.js-add-interval');
	listentoNav();
	listentoValidation();
	listentoAdd();
	
};

document.addEventListener('DOMContentLoaded', init);
//#endregion
