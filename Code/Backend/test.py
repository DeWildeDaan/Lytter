import subprocess
import shlex
from RPi import GPIO
import time
import keyboard 

keyboard.write('The quick brown fox jumps over the lazy dog.')
keyboard.press_and_release('enter')



# cmd = shlex.split("shutdown -h now")
# subprocess.call(cmd)