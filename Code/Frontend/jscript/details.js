'use strict';
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);
const backend = `http://${lanIP}/api/v1`;

//#region ***  DOM references                           ***********
let trashcanid, flagstate, magnetstate, htmlTrashcan, htmlFlag, htmlFlagText, htmlLid, htmlLock, htmlLockText, htmlWeight, htmlChartVolume, htmlChartMain, htmlcollections, htmlcollected;
let volumechart, mainchart;
//#endregion

//#region ***  Callback-Visualisation - show___         ***********
const showVolumeChart = function (data) {
	var options = {
		chart: {
			height: '75%',
			type: 'radialBar',
		},
		colors: ['#3F6474'],
		series: [data],

		plotOptions: {
			radialBar: {
				hollow: {
					margin: 15,
					size: '60%',
				},

				dataLabels: {
					showOn: 'always',
					name: {
						offsetY: 20,
						show: true,
						color: '#00040D',
						fontSize: '10px',
					},
					value: {
						offsetY: -19,
						color: '#00040D',
						fontSize: '20px',
						show: true,
					},
				},

				track: {
					dropShadow: {
						enabled: true,
						top: 3,
						left: 0,
						blur: 4,
						opacity: 0.15,
					},
				},
			},
		},

		stroke: {
			lineCap: 'round',
		},
		labels: ['Full'],
	};

	volumechart = new ApexCharts(document.querySelector('.js-chart-volume'), options);

	volumechart.render();
};

const showMainChart = function () {
	var options = {
		chart: {
			type: 'line',
			height: 450,
		},
		series: [
			{
				data: [0],
			},
		],
		colors: ['#3F6474'],
		stroke: {
			curve: 'smooth',
			width: 2,
		},

		xaxis: {
			categories: [0],
		},
	};

	mainchart = new ApexCharts(document.querySelector('.js-chart-main'), options);

	mainchart.render();
};

const showInfo = function (jsonObject) {
	let trashcan = jsonObject.info;
	htmlTrashcan.innerHTML = trashcan.Name;
	if (trashcan.Flagged == 1) {
		htmlFlagText.innerHTML = 'This trashcan is flagged as an illegal dumping spot.';
		let html = `
		<svg class="c-flag__btn-symbol" id="assistant_photo_black_24dp_1_" data-name="assistant_photo_black_24dp (1)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path id="Path_25" data-name="Path 25" d="M0,0H24V24H0Z" fill="none"/>
			<path id="Path_26" data-name="Path 26" d="M14.4,6,14,4H5V21H7V14h5.6l.4,2h7V6Z" fill="#3f6474"/>
		</svg>
		`;
		htmlFlag.innerHTML = html;
	} else {
		htmlFlagText.innerHTML = 'Flag this trashcan as an illegal dumping spot.';
		let html = `
		<svg class="c-flag__btn-symbol" id="assistant_photo_black_24dp" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path id="Path_23" data-name="Path 23" d="M0,0H24V24H0Z" fill="none"/>
			<path id="Path_24" data-name="Path 24" d="M12.36,6l.08.39L12.76,8H18v6H14.64l-.08-.39L14.24,12H7V6h5.36M14,4H5V21H7V14h5.6l.4,2h7V6H14.4Z" fill="#3f6474"/>
		</svg>
		`;
		htmlFlag.innerHTML = html;
	}

	flagstate = trashcan.Flagged;
	listentoFlag();
};

const showMagnet = function (jsonObject) {
	magnetstate = jsonObject.state;
	if (magnetstate == 1) {
		htmlLockText.innerHTML = 'Closed';
		htmlLock.innerHTML = `
		<svg class="c-lid__lock-symbol" id="lock_black_24dp_2_" data-name="lock_black_24dp (2)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<g id="Group_9" data-name="Group 9">
			<path id="Path_34" data-name="Path 34" d="M0,0H24V24H0Z" fill="none"/>
			<path id="Path_35" data-name="Path 35" d="M0,0H24V24H0Z" fill="none" opacity="0.87"/>
			</g>
			<path id="Path_36" data-name="Path 36" d="M18,8H17V6A5,5,0,0,0,7,6V8H6a2.006,2.006,0,0,0-2,2V20a2.006,2.006,0,0,0,2,2H18a2.006,2.006,0,0,0,2-2V10A2.006,2.006,0,0,0,18,8ZM9,6a3,3,0,0,1,6,0V8H9Zm9,14H6V10H18Zm-6-3a2,2,0,1,0-2-2A2.006,2.006,0,0,0,12,17Z" fill="#3f6474"/>
		</svg>
		`;
	} else {
		htmlLockText.innerHTML = 'Open';
		htmlLock.innerHTML = `
		<svg class="c-lid__lock-symbol" id="lock_open_black_24dp_1_" data-name="lock_open_black_24dp (1)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path id="Path_32" data-name="Path 32" d="M0,0H24V24H0Z" fill="none"/>
			<path id="Path_33" data-name="Path 33" d="M18,8H17V6A5,5,0,0,0,7,6H9a3,3,0,0,1,6,0V8H6a2.006,2.006,0,0,0-2,2V20a2.006,2.006,0,0,0,2,2H18a2.006,2.006,0,0,0,2-2V10A2.006,2.006,0,0,0,18,8Zm0,12H6V10H18Zm-6-3a2,2,0,1,0-2-2A2.006,2.006,0,0,0,12,17Z" fill="#3f6474"/>
		</svg>
		`;
	}
	listentoLid();
};

const showCollections = function (jsonObject) {
	var data = [];
	var labels = [];
	for (let collection of jsonObject.collections) {
		data.push(collection.collections);
		labels.push(collection.date);
	}

	mainchart.updateOptions({
		series: [
			{
				name: 'Collections',
				data: data,
			},
		],
		xaxis: {
			categories: labels,
		},
		yaxis: {
			title: {
				text: 'Amount',
				rotate: -90,
				offsetX: 0,
				offsetY: 0,
				style: {
					color: '#00040d',
					fontSize: '16px',
					fontFamily: 'Interstate, Helvetica, Arial, sans-serif',
					fontWeight: 300,
				},
			},
		},
	});
};

const showWeights = function (jsonObject) {
	var data = [];
	var labels = [];
	for (let weight of jsonObject.weights) {
		data.push(weight.amount);
		labels.push(weight.time);
	}

	mainchart.updateOptions({
		series: [
			{
				name: 'Trash collected in Kg',
				data: data,
			},
		],
		xaxis: {
			categories: labels,
		},
		yaxis: {
			title: {
				text: 'Kg',
				rotate: -90,
				offsetX: 0,
				offsetY: 0,
				style: {
					color: '#00040d',
					fontSize: '16px',
					fontFamily: 'Interstate, Helvetica, Arial, sans-serif',
					fontWeight: 300,
				},
			},
		},
	});
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const callbackError = function (jsonObject) {
	console.log(jsonObject);
};
//#endregion

//#region ***  Data Access - get___                     ***********

const getTrashcanInfo = function () {
	socket.emit('F2B_info', { id: trashcanid });
};

const getMagnet = function () {
	socket.emit('F2B_magnet', { id: trashcanid });
};

const getWeight = function () {
	socket.emit('F2B_weight', { id: trashcanid });
};

const getVolume = function () {
	socket.emit('F2B_volume', { id: trashcanid });
};

const getCollections = function () {
	let url = `${backend}/trashcan/${trashcanid}/collections`;
	handleData(url, showCollections, callbackError, 'GET');
};

const getWeights = function () {
	let url = `${backend}/trashcan/${trashcanid}/weights`;
	handleData(url, showWeights, callbackError, 'GET');
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

const listentoFlag = function () {
	htmlFlag.addEventListener('click', function () {
		if (flagstate == 1) {
			var newstate = 0;
		} else {
			var newstate = 1;
		}
		socket.emit('F2B_update_flag', { id: trashcanid, state: newstate });
	});
};

const listentoLid = function () {
	htmlLid.addEventListener('click', function () {
		if (magnetstate == 1) {
			var newstate = 0;
		} else {
			var newstate = 1;
		}
		socket.emit('F2B_update_magnet', { id: trashcanid, state: newstate, user: 'Webuser' });
	});
};

const listentoCollected = function () {
	htmlcollected.addEventListener('click', function () {
		this.classList.add('c-is-selected');
		htmlcollections.classList.remove('c-is-selected');
		getWeights();
	});
};

const listentoCollections = function () {
	htmlcollections.addEventListener('click', function () {
		this.classList.add('c-is-selected');
		htmlcollected.classList.remove('c-is-selected');
		getCollections();
	});
};
// Event listeners

// Socketio listener
const listentoSocket = function () {
	socket.on('B2F_info', function (jsonObject) {
		if (jsonObject.info.TrashcanID == trashcanid) {
			showInfo(jsonObject);
		}
	});

	socket.on('B2F_update_flag', function (jsonObject) {
		if (jsonObject.info.TrashcanID == trashcanid) {
			showInfo(jsonObject);
		}
	});

	socket.on('B2F_magnet', function (jsonObject) {
		if (jsonObject.id == trashcanid) {
			showMagnet(jsonObject);
		}
	});

	socket.on('B2F_update_magnet', function (jsonObject) {
		if (jsonObject.id == trashcanid) {
			showMagnet(jsonObject);
		}
	});

	socket.on('B2F_volume', function (jsonObject) {
		if (jsonObject.id == trashcanid) {
			showVolumeChart(jsonObject.volume);
		}
		if (htmlcollected.classList.contains('c-is-selected')) {
			getWeights();
		}
	});

	socket.on('B2F_weight', function (jsonObject) {
		if (jsonObject.id == trashcanid) {
			htmlWeight.innerHTML = `${jsonObject.weight} Kg`;
		}
	});

	socket.on('B2F_empty', function () {
		if (htmlcollections.classList.contains('c-is-selected')) {
			getCollections();
		} else if (htmlcollected.classList.contains('c-is-selected')) {
			getWeights();
		}
	});
};
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
	console.log('DOM Content Loaded.');
	let urlParams = new URLSearchParams(window.location.search);
	trashcanid = parseInt(urlParams.get('trashcan'), 10);
	if (trashcanid) {
		htmlTrashcan = document.querySelector('.js-trashcan');
		htmlFlag = document.querySelector('.js-flag');
		htmlFlagText = document.querySelector('.js-flag-text');
		htmlLid = document.querySelector('.js-lid');
		htmlLock = document.querySelector('.js-lock');
		htmlLockText = document.querySelector('.js-lock-text');
		htmlWeight = document.querySelector('.js-weight');
		htmlChartVolume = document.querySelector('.js-chart-volume');
		htmlChartMain = document.querySelector('.js-chart-main');
		htmlcollections = document.querySelector('.js-collections');
		htmlcollected = document.querySelector('.js-collected');

		listentoNav();
		listentoSocket();

		showMainChart();

		getTrashcanInfo();
		getMagnet();
		getWeight();
		getVolume();

		getWeights();

		listentoCollected();
		listentoCollections();
	} else {
		window.location = '/index.html';
	}
};

document.addEventListener('DOMContentLoaded', init);
//#endregion
