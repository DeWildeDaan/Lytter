# ******************Hardware imports******************
from RPi import GPIO
import time
from numpy import mean
from numpy import std
from subprocess import check_output
from numpy.core.arrayprint import DatetimeFormat

from helpers.KlasseLCDPCF import KlasseLCDPCF
from helpers.HCSR04 import HCSR04
from helpers.HX711 import HX711
from helpers.Magnet import Magnet


# ******************Backend imports******************
import threading
import subprocess
import shlex
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify, request
from repositories.DataRepository import DataRepository


# ******************Flask code******************
app = Flask(__name__)
app.config['SECRET_KEY'] = 'geheim!'
socketio = SocketIO(app, cors_allowed_origins="*", logger=False,
                    engineio_logger=False, ping_timeout=1)

CORS(app)
endpoint = '/api/v1'


@socketio.on_error()
def error_handler(e):
    print(e)


# ******************Hardware code******************

# PIN/ID SETUP

# Reading the config file and extracting the needed info
with open("/home/student/2020-2021-projectone-DeWildeDaan/Code/Backend/appconfig.txt", "r") as f:
    contents = f.readlines()
    ids = {}
    for id in contents:
        id = id.rstrip("\n")
        split_lines = id.split("=")
        if(len(split_lines) == 2):
            ids[split_lines[0]] = split_lines[1]
f.close()
# Defining the GPIO pins
LCD_e = int(ids["LCD_e"])
LCD_rs = int(ids["LCD_rs"])
HCSR_trigger = int(ids["HCSR_trigger"])
HCSR_echo = int(ids["HCSR_echo"])
HX711_dout = int(ids["HX711_dout"])
HX711_sck = int(ids["HX711_sck"])
magnet = int(ids["magnet"])
contactsensor = int(ids["contactsensor"])
btn_display = int(ids["btn_display"])

# Defining the ratio of the load cell
Ratio = float(ids["Ratio"])
Offset = float(ids["Offset"])

# Defining the trashcan id
TrashcanID = int(ids["TrashcanID"])

# Defining the sensor id's
MagnetID = int(ids["MagnetID"])
ContactsensorID = int(ids["ContactsensorID"])
WeightsensorID = int(ids["WeightsensorID"])
UltrasonesensorID = int(ids["UltrasonesensorID"])

# Get the treshhold and interval for the trashcan from the database
treshhold_and_interval = DataRepository.read_treshhold_and_interval(TrashcanID)
treshhold = treshhold_and_interval['Treshhold']
interval = treshhold_and_interval['TimeInterval']


# LOADING CLASSES
lcd = KlasseLCDPCF(False, LCD_e, LCD_rs)
hcsr = HCSR04(HCSR_trigger, HCSR_echo)
hx = HX711(HX711_dout, HX711_sck)
mag = Magnet(magnet, 100000)


# CALLBACK FUNCTIONS
aantal = 0
btn_state = 0
prev_btn_state = 1


def empty(channel):
    global full
    global aantal
    aantal += 1
    if(aantal >= 2):
        full = 0
        aantal = 0
        log_magnet(0)
        log_empty()


def plus(channel):
    global btn_state
    if btn_state < 1:
        btn_state = btn_state + 1
    else:
        btn_state = 0
    show_display()
    


# GET SENSOR DATA EVERY SET TIME AND PASS IT ON TO THE RIGHT FUNCTIONS
prev_time = time.time()

# Volume
full = 0


def distance():
    return hcsr.get_distance()


def get_volume():
    values = []
    for i in range(0, 150):
        values.append(int(distance()))
    data_mean, data_std = mean(values), std(values)
    cut_off = data_std * 3
    lower, upper = data_mean - cut_off, data_mean + cut_off
    outliers_removed = [x for x in values if x >= lower and x <= upper]
    average = mean(outliers_removed) - 22
    volume_precentage = 100 - ((average/30)*100)
    if volume_precentage < 0:
        volume_precentage = 0
    elif volume_precentage > 100:
        volume_precentage = 100
    return int(volume_precentage)


# Weight


def get_weight():
    grams = hx.get_weight_mean(20)
    kg = (grams/1000) - Offset
    if kg < 0:
        kg = 0
    return round(kg, 2)


# Check the time to see if set amount of time has passed


def check_sensors(current_time):
    global prev_time
    global full
    global interval
    if full == 0:
        if (current_time - prev_time) > interval:
            prev_time = current_time
            get_sensors()
    else:
        pass


# Checks the values to see if the trashcan is full


def check_full(volume, weight):
    global full
    global treshhold
    if volume >= treshhold or weight >= 25.00:
        full = 1
        log_magnet(1)

# Get the data and pass it on to the log functions


def get_sensors():
    volume = get_volume()
    weight = get_weight()
    check_full(volume, weight)
    show_volume(volume)
    log_volume(volume)
    log_weight(weight)


# CHECK MAGNET STATE AND TURN IT ON/OFF


def check_magnet():
    magnet_state = DataRepository.read_status_magnet(TrashcanID, MagnetID)
    if magnet_state["value"] == 1:
        mag.duty_cycle(50)
    else:
        mag.duty_cycle(0)

# SHOW IP & VOLUME ON DISPLAY


def getIp():
    ips = str(check_output(['hostname', '--all-ip-addresses']))
    ips = ips[2:len(ips)-4]
    ips = ips.split(" ")
    return ips


def show_ip():
    ips = getIp()
    if len(ips) == 2:
        row2 = ips[0]
    elif len(ips) == 3:
        row2 = ips[1]

    lcd.resetLCD()
    lcd.sendMessage('Surf to:')
    lcd.secondRow()
    lcd.sendMessage(row2)


def show_volume(volume):
    global btn_state
    global prev_btn_state
    if btn_state == 1:
        lcd.resetLCD()
        lcd.sendMessage('Volume:')
        lcd.secondRow()
        msg = str(volume)
        while len(msg) < 3:
            msg = ' '+msg
        msg += '%'
        lcd.sendMessage(msg)


def show_display():
    global prev_btn_state
    global btn_state

    if btn_state == 0:
        lcd.displayOn()
        if prev_btn_state != 0:
            prev_btn_state = 0
            show_ip()
    elif btn_state == 1:
        if prev_btn_state != 1:
            prev_btn_state = 1
            show_volume(get_volume())

# LOG FUNCTIONS


def log_volume(volume):
    global TrashcanID
    DataRepository.log(TrashcanID, UltrasonesensorID, volume, "Trashcan")
    socketio.emit('B2F_volume', {'volume': volume,
                  'id': TrashcanID}, broadcast=True)


def log_weight(weight):
    global TrashcanID
    DataRepository.log(TrashcanID, WeightsensorID, weight, "Trashcan")
    socketio.emit('B2F_weight', {'weight': weight,
                  'id': TrashcanID}, broadcast=True)


def log_magnet(state):
    global TrashcanID
    DataRepository.log(TrashcanID, MagnetID, state, "Trashcan")
    socketio.emit('B2F_update_magnet', {'state': DataRepository.read_status_magnet(
        TrashcanID, MagnetID)['value']}, broadcast=True)


def log_empty():
    global TrashcanID
    DataRepository.log(TrashcanID, ContactsensorID, 0, "Trashcan")
    volume = DataRepository.read_trashcan_info(
        TrashcanID, UltrasonesensorID)[0]['LogID']
    weight = DataRepository.read_trashcan_info(
        TrashcanID, WeightsensorID)[0]['LogID']
    DataRepository.update_last_values_on_collection(int(volume))
    DataRepository.update_last_values_on_collection(int(weight))
    socketio.emit('B2F_empty', broadcast=True)
    socketio.emit('F2B_update_magnet', broadcast=True)
    get_sensors()

# SETUP


def setup():
    print("**** Setup ****")
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(contactsensor, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(btn_display, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.add_event_detect(contactsensor, GPIO.RISING,
                          callback=empty, bouncetime=1000)
    GPIO.add_event_detect(btn_display, GPIO.RISING,
                          callback=plus, bouncetime=500)

    lcd.LCDInit()
    hx.set_scale_ratio(Ratio)
    mag.start()
    show_display()
    get_sensors()


setup()

# THREADING THE LOOP


def all_out():
    try:
        while True:
            check_sensors(time.time())
            check_magnet()
    except IOError as e:
        print(e)

thread = threading.Timer(0.1, all_out)
thread.start()
print("**** Program started ****")


# ******************API Endpoints******************
@app.route('/')
def hallo():
    return "Server is running, er zijn momenteel geen API endpoints beschikbaar."


@app.route(endpoint + '/test', methods=['GET'])
def test():
    if request.method == 'GET':
        data = 'testjee'
        return jsonify(data), 200


@app.route(endpoint + '/trashcans', methods=['GET', 'POST'])
def get_trashcans():
    if request.method == 'GET':
        data = DataRepository.read_trashcans()
        if data is not None:
            return jsonify(trashcans=data), 200
        else:
            return jsonify(message='error'), 404
    elif request.method == 'POST':
        values = DataRepository.json_or_formdata(request)
        data = DataRepository.create_trashcan(
            values['name'], values['lat'], values['long'], values['treshhold'], values['interval'])
        return jsonify(trashcanid=data), 201


@app.route(endpoint + '/trashcans/info', methods=['GET'])
def get_trashcans_info():
    if request.method == 'GET':
        data = DataRepository.read_trashcans_info(UltrasonesensorID)
        if data is not None:
            return jsonify(info=data), 200
        else:
            return jsonify(message='error'), 404


@app.route(endpoint + '/trashcan/<id>', methods=['PUT', 'DELETE'])
def edit_trashcan(id):
    if request.method == 'DELETE':
        data = DataRepository.delete_trashcan(id)
        return jsonify(deleted=data), 201


@app.route(endpoint + '/trashcan/<id>/<device>', methods=['GET'])
def get_trashcan_info(id, device):
    if request.method == 'GET':
        data = DataRepository.read_trashcan_info(id, device)
        if data is not None:
            return jsonify(info=data), 200
        else:
            return jsonify(message='error'), 404


@app.route(endpoint + '/trashcan/<id>/collections', methods=['GET'])
def get_trashcan_collections(id):
    if request.method == 'GET':
        data = DataRepository.read_collections(id, ContactsensorID)
        if data is not None:
            return jsonify(collections=data), 200
        else:
            return jsonify(message='error'), 404


@app.route(endpoint + '/trashcan/<id>/weights', methods=['GET'])
def get_trashcan_weights(id):
    if request.method == 'GET':
        data = DataRepository.read_kg_collected(id, WeightsensorID)
        if data is not None:
            return jsonify(weights=data), 200
        else:
            return jsonify(message='error'), 404


@app.route(endpoint + '/trashcan/<id>/update', methods=['GET', 'PUT'])
def update_trashcan(id):
    if request.method == 'GET':
        data = DataRepository.read_trashcan(int(id))
        if data is not None:
            return jsonify(info=data), 200
        else:
            return jsonify(message='error'), 404
    elif request.method == 'PUT':
        values = DataRepository.json_or_formdata(request)
        data = DataRepository.update_trashcan(
            id, values['name'], values['lat'], values['long'], values['treshhold'], values['interval'])
        if data is not None:
            return jsonify(updated=data), 200
        else:
            return jsonify(message='error'), 404


# ******************Socket IO******************
@socketio.on('connect')
def initial_connection():
    print('A new client connected.')


@socketio.on('F2B_poweroff')
def trashcan_info():
    print("**** Powering off ****")
    cmd = shlex.split("sudo shutdown -h now")
    subprocess.call(cmd)


@socketio.on('F2B_info')
def trashcan_info(msg):
    data = DataRepository.read_trashcan(msg['id'])
    socketio.emit('B2F_info', {'info': data}, broadcast=False)


@socketio.on('F2B_update_flag')
def update_flag(msg):
    DataRepository.update_flag(msg['id'], msg['state'])
    data = DataRepository.read_trashcan(msg['id'])
    socketio.emit('B2F_update_flag', {'info': data}, broadcast=True)


@socketio.on('F2B_magnet')
def magnet_state(msg):
    data = DataRepository.read_status_magnet(msg['id'], MagnetID)
    value = data['value']
    id = data['TrashcanID']
    socketio.emit('B2F_magnet', {'state': value, 'id': id}, broadcast=False)


@socketio.on('F2B_update_magnet')
def update_magnet(msg):
    DataRepository.log(msg['id'], MagnetID, msg['state'], msg['user'])
    data = DataRepository.read_status_magnet(msg['id'], MagnetID)
    value = data['value']
    id = data['TrashcanID']
    socketio.emit('B2F_update_magnet', {
                  'state': value, 'id': id}, broadcast=True)


@socketio.on('F2B_volume')
def read_volume(msg):
    data = DataRepository.read_trashcan_info(msg['id'], UltrasonesensorID)[0]
    value = data['value']
    id = data['TrashcanID']
    socketio.emit('B2F_volume', {'volume': value, 'id': id})


@socketio.on('F2B_weight')
def read_volume(msg):
    data = DataRepository.read_trashcan_info(msg['id'], WeightsensorID)[0]
    value = data['value']
    id = data['TrashcanID']
    socketio.emit('B2F_weight', {'weight': value, 'id': id})


# ******************Start app******************
if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0')
