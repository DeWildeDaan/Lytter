from RPi import GPIO


class Magnet:
    def __init__(self, pin, frequecy):
        self.pin = pin
        self.frequency = frequecy

        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        GPIO.setup(self.pin, GPIO.OUT)
        self.pwm_magnet = GPIO.PWM(self.pin, self.frequency)

    def start(self, startpwm=0):
        self.pwm_magnet.start(startpwm)

    def duty_cycle(self, duty_cycle=0):
        self.pwm_magnet.ChangeDutyCycle(duty_cycle)
