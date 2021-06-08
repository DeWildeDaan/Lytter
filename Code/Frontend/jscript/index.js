'use strict';
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);
const backend = `http://${lanIP}/api/v1`;

const provider = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
const copyright = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

//#region ***  DOM references                           ***********
let map, layergroup;
//#endregion

//#region ***  Callback-Visualisation - show___         ***********
const showMap = function() {
	map = L.map('mapid').setView([51.110393, 4.001928], 16);
	L.tileLayer(provider, { attribution: copyright, maxZoom: 18, id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, accessToken: 'pk.eyJ1IjoiZGFhbmR3NSIsImEiOiJja21xYWVrY2IwbWo2MzBvOWNkdmdhMjlsIn0.2mkN44JAwQ3xoESwwRIJRw' }).addTo(map);
	layergroup = L.layerGroup().addTo(map);
}

const showMarkers = function(jsonObject) {
	for(let trashcan of jsonObject.info) {
		let arrCoords = [trashcan.Latitude, trashcan.Longitude];
		if(trashcan.value < trashcan.treshhold){
			var myIcon = L.icon({
				iconUrl: '../img/svg/ic_marker.svg',
				iconSize: [32, 32],
			});
		} else {
			var myIcon = L.icon({
				iconUrl: '../img/svg/ic_marker2.svg',
				iconSize: [32, 32],
			});
		}
		let marker = L.marker(arrCoords, { icon: myIcon }).addTo(layergroup);
		marker.bindPopup(`<a href="details.html?trashcan=${trashcan.TrashcanID}" class="c-popup__link"><p>${trashcan.Name}</p></a>`, {className: 'c-popup'});
		// marker.bindPopup(`<a href="details.html?trashcan=${trashcan.TrashcanID}"><h3>${trashcan.Name}</h3></a>`);
	};
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const showError = function(jsonObject) {
	console.log(jsonObject);
};
//#endregion

//#region ***  Data Access - get___                     ***********
const getTrashcans = function() {
	let url = `${backend}/trashcans/info`;
	handleData(url, showMarkers, showError, 'GET');
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
// Event listeners

// Socketio listener
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
	console.log('DOM Content Loaded.');

	listentoNav();
	showMap();
	getTrashcans();
};

document.addEventListener('DOMContentLoaded', init);
//#endregion
