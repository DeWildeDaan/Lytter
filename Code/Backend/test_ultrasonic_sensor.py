from RPi import GPIO
import time
from helpers.HCSR04 import HCSR04
from numpy import mean
from numpy import std

hcsr = HCSR04(16, 24)

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
    print(f'average: {average}')
    volume_precentage = 100 - (((average)/30)*100)
    if volume_precentage < 0:
        volume_precentage = 0
    elif volume_precentage > 100:
        volume_precentage = 100
    return int(volume_precentage)

while True:
    print(f'volume: {get_volume()}')
    time.sleep(2)