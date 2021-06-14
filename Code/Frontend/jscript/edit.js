'use strict';
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);
const backend = `http://${lanIP}/api/v1`;

//#region ***  DOM references                           ***********
let htmlSection, htmlLead, htmlCancel, htmlUpdate, htmlName, htmlLatitude, htmlLongitude, htmlTreshHold, htmlInterval;
let valName, valLat, valLong, valTreshhold, valInterval, valMessage;
//#endregion

//#region ***  Callback-Visualisation - show___         ***********
const showTrashcans = function (jsonObject) {
	let html = `
	<div class="o-container">
		<div class="o-layout o-layout--gutter o-layout--align-center">
	`;
	for (let trashcan of jsonObject.trashcans) {
		html += `
		<div class="o-layout__item u-1-of-3-bp3 u-1-of-2-bp2">
			<div class="c-trashcan">
				<div>
					<p class="c-trashcan__name u-4-of-5">${trashcan.name}</p>
				</div>
				<div class="c-trashcan__edit u-1-of-5 js-edit" data-id=${trashcan.trashcanID}>
					<svg class="c-trashcan__edit-symbol" id="edit" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
						<path id="Path_40" data-name="Path 40" d="M0,0H24V24H0Z" fill="none"/>
						<path id="Path_41" data-name="Path 41" d="M14.06,9.02l.92.92L5.92,19H5v-.92l9.06-9.06M17.66,3a1,1,0,0,0-.7.29L15.13,5.12l3.75,3.75,1.83-1.83a1,1,0,0,0,0-1.41L18.37,3.29A.982.982,0,0,0,17.66,3Zm-3.6,3.19L3,17.25V21H6.75L17.81,9.94,14.06,6.19Z" fill="#3f6474"/>
				  	</svg>
				</div>
				<div class="c-trashcan__delete u-1-of-5 js-delete" data-id=${trashcan.trashcanID}>
					<svg class="c-trashcan__delete-symbol" id="delete" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
						<path id="Path_42" data-name="Path 42" d="M0,0H24V24H0Z" fill="none" />
						<path id="Path_43" data-name="Path 43" d="M16,9V19H8V9h8M14.5,3h-5l-1,1H5V6H19V4H15.5ZM18,7H6V19a2.006,2.006,0,0,0,2,2h8a2.006,2.006,0,0,0,2-2Z" fill="#3f6474" />
					</svg>
				</div>
				<div class="c-trashcan__poweroff u-1-of-5 js-poweroff">
					<svg class="c-trashcan__poweroff-symbol" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
						<path d="M0 0h24v24H0V0z" fill="none" />
						<path d="M10 3H8v1.88l2 2zm6 6v3.88l1.8 1.8.2-.2V9c0-1.1-.9-2-2-2V3h-2v4h-3.88l2 2H16zM4.12 3.84L2.71 5.25 6 8.54v5.96L9.5 18v3h5v-3l.48-.48 4.47 4.47 1.41-1.41L4.12 3.84zm8.38 13.33V19h-1v-1.83L8 13.65v-3.11l5.57 5.57-1.07 1.06z" fill="#3f6474" />
					</svg>
				</div>
			</div>
		</div>
		`;
	}
	html += `
		</div>
	</div>
	`;
	htmlSection.innerHTML = html;
	htmlLead.innerHTML = 'Edit trashcans';
	listentoDelete();
	listentoEdit();
	listentoPoweroff();
};

const showTrashcan = function (jsonObject) {
	let trashcan = jsonObject.info;
	let html = `
	<section class="o-row">
				<div class="o-container u u-max-width-lg">
					<form class="c-form">
						<div class="c-form__row">
							<label class="c-form__label" for="name">Name:</label>
							<input value="${trashcan.Name}" type="text" name="name" id="name" class="js-edit-name" required/>
						</div>
						<div class="c-form__row">
							<label class="c-form__label" for="latitude">Latitude:</label>
							<input value="${trashcan.Latitude}" type="number" name="latitude" id="latitude" class="js-edit-latitude" step="0.000001" min="0" required/>
						</div>
						<div class="c-form__row">
							<label class="c-form__label" for="longitude">Longitude:</label>
							<input value="${trashcan.Longitude}" type="number" name="longitude" id="longitude" class="js-edit-longitude" step="0.000001" min="0" required/>
						</div>
						<div class="c-form__row">
							<label class="c-form__label" for="treshhold">Tresh hold:</label>
							<input value="${trashcan.Treshhold}" type="number" placeholder="Tresh hold in %" name="treshhold" id="treshhold" class="js-edit-treshhold" min="0" max="100" pattern="[0-9]*" required/>
						</div>
						<div class="c-form__row">
							<label class="c-form__label" for="interval">Interval:</label>
							<input value="${trashcan.TimeInterval}" type="number" placeholder="Interval in seconds" name="interval" id="interval" class="js-edit-interval" pattern="[0-9]*" required/>
						</div>

						<div>
							<input type="button" value="Update trashcan" data-id=${trashcan.TrashcanID} class="js-edit-btn c-form__confirm"/>
						</div>
						<div>
							<input type="button" value="Cancel" class="js-cancel-btn c-form__cancel"/>
						</div>
						
					</form>
				</div>
			</section>
	`;

	htmlSection.innerHTML = html;
	htmlLead.innerHTML = `Edit trashcan ${trashcan.TrashcanID}`;

	htmlName = document.querySelector('.js-edit-name');
	htmlLatitude = document.querySelector('.js-edit-latitude');
	htmlLongitude = document.querySelector('.js-edit-longitude');
	htmlTreshHold = document.querySelector('.js-edit-treshhold');
	htmlInterval = document.querySelector('.js-edit-interval');
	valName = true;
	valLat = true;
	valLong = true;
	valTreshhold = true;
	valInterval = true;

	listentoValidation();
	listentoCancel();
	listentoUpdate();
};

const showStatus = function (jsonObject) {
	htmlUpdate = document.querySelector('.js-edit-btn');
	let lastValue = htmlUpdate.value;
	if (jsonObject) {
		if (jsonObject.updated == 0) {
			htmlUpdate.value = 'Nothing to update!';
		} else {
			htmlUpdate.value = 'Trashcan updated!';
		}
	} else {
		htmlUpdate.value = valMessage;
	}

	setTimeout(
		function () {
			htmlUpdate.value = lastValue;
			htmlUpdate.disabled = false;
		}.bind(this),
		2000
	);
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const callbackError = function (jsonObject) {
	console.log(jsonObject);
};
//#endregion

//#region ***  Data Access - get___                     ***********
const getTrashcans = function () {
	let url = `${backend}/trashcans`;
	handleData(url, showTrashcans, callbackError, 'GET');
};
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

const listentoDelete = function () {
	for (let btn of document.querySelectorAll('.js-delete')) {
		btn.addEventListener('click', function () {
			let id = this.getAttribute('data-id');
			let url = `${backend}/trashcan/${id}`;
			handleData(url, getTrashcans, callbackError, 'DELETE');
		});
	}
};

const listentoEdit = function () {
	for (let btn of document.querySelectorAll('.js-edit')) {
		btn.addEventListener('click', function () {
			let id = this.getAttribute('data-id');
			let url = `${backend}/trashcan/${id}/update`;
			handleData(url, showTrashcan, callbackError, 'GET');
		});
	}
};

const listentoPoweroff = function () {
	for (let btn of document.querySelectorAll('.js-poweroff')) {
		btn.addEventListener('click', function () {
			socket.emit('F2B_poweroff');
			alert('Trashcan is powering off.');
		});
	}
};

const listentoCancel = function () {
	htmlCancel = document.querySelector('.js-cancel-btn');
	htmlCancel.addEventListener('click', function () {
		getTrashcans();
	});
};

const listentoUpdate = function () {
	htmlUpdate = document.querySelector('.js-edit-btn');
	htmlUpdate.addEventListener('click', function () {
		htmlUpdate.disabled = true;
		let id = this.getAttribute('data-id');
		let url = `${backend}/trashcan/${id}/update`;
		if (valName == true) {
			if (valLat == true) {
				if (valLong == true) {
					if (valTreshhold == true) {
						if (valInterval == true) {
							const body = JSON.stringify({
								name: htmlName.value,
								lat: htmlLatitude.value,
								long: htmlLongitude.value,
								treshhold: htmlTreshHold.value,
								interval: htmlInterval.value,
							});
							valMessage = 'Trashcan updated!';
							handleData(url, showStatus, callbackError, 'PUT', body);
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

const listentoValidation = function () {
	htmlName.addEventListener('input', function () {
		if (this.value == '') {
			this.classList.add('c-form__invalid');
			valName = false;
		} else {
			this.classList.remove('c-form__invalid');
			valName = true;
		}
	});

	htmlLatitude.addEventListener('input', function () {
		if ((this.value == '') | isNaN(this.value) | (this.value == 0)) {
			this.classList.add('c-form__invalid');
			valLat = false;
		} else {
			this.classList.remove('c-form__invalid');
			valLat = true;
		}
	});

	htmlLongitude.addEventListener('input', function () {
		if ((this.value == '') | isNaN(this.value) | (this.value == 0)) {
			this.classList.add('c-form__invalid');
			valLong = false;
		} else {
			this.classList.remove('c-form__invalid');
			valLong = true;
		}
	});

	htmlTreshHold.addEventListener('input', function () {
		if ((this.value == '') | isNaN(this.value) | (this.value == 0)) {
			this.classList.add('c-form__invalid');
			valTreshhold = false;
		} else {
			this.classList.remove('c-form__invalid');
			valTreshhold = true;
		}
	});

	htmlInterval.addEventListener('input', function () {
		if ((this.value == '') | isNaN(this.value) | (this.value == 0)) {
			this.classList.add('c-form__invalid');
			valInterval = false;
		} else {
			this.classList.remove('c-form__invalid');
			valInterval = true;
		}
	});
};
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
	console.log('DOM Content Loaded.');
	htmlSection = document.querySelector('.js-section');
	htmlLead = document.querySelector('.js-lead');

	listentoNav();
	getTrashcans();
};

document.addEventListener('DOMContentLoaded', init);
//#endregion
