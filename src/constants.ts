const gpio = require('rpi-gpio')

export const READ = gpio.DIR_IN
export const WRITE = gpio.DIR_OUT
  
export const DEVICES = {
  YF_S403: {
    PULSE_FREQUENCY: 4.5
  }
}
 
