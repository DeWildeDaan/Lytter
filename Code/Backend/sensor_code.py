# ******************Hardware imports******************
from RPi import GPIO
import time
from numpy import mean
from numpy import std
from subprocess import check_output
from numpy.core.arrayprint import DatetimeFormat

from repositories.DataRepository import DataRepository
from helpers.KlasseLCDPCF import KlasseLCDPCF
from helpers.HCSR04 import HCSR04
from helpers.HX711 import HX711
from helpers.Magnet import Magnet

# ******************Hardware code******************
lcd = KlasseLCDPCF()
hcsr = HCSR04(16, 24)
hx = HX711(dout_pin=13, pd_sck_pin=19)
mag = Magnet(26, 100000)

# The ID of the trashcan in the database
TrashcanID = 1

# Get the treshhold and interval for the trashcan from the database
treshhold_and_interval = DataRepository.read_treshhold_and_interval(TrashcanID)
treshhold = treshhold_and_interval['Treshhold']
interval = treshhold_and_interval['TimeInterval']


# CALLBACK FUNCTIONS
contactsensor = 23
aantal = 0

btn = 25
btn_state = 0
prev_btn_state = 1


def empty(channel):
    global full
    global aantal
    aantal += 1
    if(aantal >= 2):
        full = 0
        aantal = 0
        log_empty()
        log_magnet(0)


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
    for i in range(0, 100):
        values.append(int(distance()))
    data_mean, data_std = mean(values), std(values)
    cut_off = data_std * 3
    lower, upper = data_mean - cut_off, data_mean + cut_off
    outliers_removed = [x for x in values if x >= lower and x <= upper]
    average = mean(outliers_removed)
    volume_precentage = 100 - ((average/50)*100)
    if volume_precentage < 0:
        volume_precentage = 0
    return int(volume_precentage)


def check_volume(volume):
    global full
    global treshhold
    if volume > treshhold:
        full = 1
        log_magnet(1)


# Weight
ratio = 1700


def get_weight():
    weight = float(hx.read_mean() / ratio)
    if weight < 1:
        weight = 0
    return round(weight, 2)

# Check the time to see if set amount of time has passed


def check_sensors(current_time):
    global prev_time
    global full
    global interval
    if full == 0:
        if (current_time - prev_time) > interval:
            prev_time = current_time
            get_sensors()

# Get the data and pass it on to the log functions


def get_sensors():
    volume = get_volume()
    weight = get_weight()
    check_volume(volume)
    show_volume(volume)
    log_volume(volume)
    log_weight(weight)

# CHECK MAGNET STATE AND TURN IT ON/OFF


def check_magnet():
    magnet_state = DataRepository.read_status_magnet(TrashcanID)
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
    lcd.resetLCD()
    lcd.sendMessage('Surf to:')
    row2 = ips[1]
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
    DataRepository.log(TrashcanID, 4, volume, "Trashcan")


def log_weight(weight):
    global TrashcanID
    DataRepository.log(TrashcanID, 3, weight, "Trashcan")


def log_magnet(state):
    global TrashcanID
    DataRepository.log(TrashcanID, 1, state, "Trashcan")


def log_empty():
    global TrashcanID
    DataRepository.log(TrashcanID, 2, 0, "Trashcan")
    volume = DataRepository.read_trashcan_info(TrashcanID, 4)[0]['LogID']
    weight = DataRepository.read_trashcan_info(TrashcanID, 3)[0]['LogID']
    DataRepository.update_last_values_on_collection(int(volume))
    DataRepository.update_last_values_on_collection(int(weight))
    get_sensors()

# SETUP


def setup():
    print("**** Setup ****")
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(contactsensor, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(btn, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.add_event_detect(contactsensor, GPIO.RISING,
                          callback=empty, bouncetime=1000)
    GPIO.add_event_detect(btn, GPIO.RISING, callback=plus, bouncetime=500)

    lcd.LCDInit()
    hx.power_up()
    mag.start()
    show_display()
    get_sensors()


setup()
print("**** Program started ****")


try:
    while True:
        check_sensors(time.time())
        check_magnet()

except KeyboardInterrupt as e:
    print(e)
finally:
    GPIO.cleanup()
    print("Cleanup.")
