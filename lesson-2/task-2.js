class TimersManager {
  constructor() {
    this.timers = [];
    this.logs = [];
  }

  add(timer, ...rest) {
    if (
      typeof timer.name !== 'string' || !timer.name ||
      typeof timer.delay !== 'number' || timer.delay < 0 || timer.delay > 5000 ||
      typeof timer.interval !== 'boolean' || 
      typeof timer.job !== 'function'      
    ) {
      throw new Error('You are trying to add a timer with wrong parameters type or value.') 
    } else if (this.timers.find(
      (item) => item.name === timer.name)
    ) {
      throw new Error(`Timer with name: "${timer.name}" already exists. Try to use another one.`) 
    } else if (this.timers.find((item) => item.name === timer.name)
        ?.hasOwnProperty('timerId')
    ) {
      throw new Error('This timer has been already started.') 
    }

    this.timers.push({
      ...timer,
      jobParams: rest
    })

    return this
  }

  remove(timerName) {
    this.pause(timerName)

    const timerIndex = this.timers.findIndex(((timer) => timer.name === timerName))

    this.timers.splice(timerIndex, 1)
  }

  start() {
    this.timers.forEach((timer) => {
      this.resume(timer)    
    })
  }

  stop() {
    this.timers.forEach((timer) => {
      this.pause(timer)
    })
  }

  pause(timer) {
    if (typeof timer === 'string') {
      timer = this.timers.find((item) => item.name === timer)
    }

    if (!timer.timerId) return

    const stopTimer = timer.interval ? clearInterval : clearTimeout

    stopTimer(timer.timerId)

    delete timer.timerId
  }

  resume(timer) {
    if (typeof timer === 'string') {
      timer = this.timers.find((item) => item.name === timer)
    }

    if (timer.timerId) return

    const createTimer = timer.interval ? setInterval : setTimeout

    const timerId = createTimer(
      this._log(timer.job, timer.name), 
      timer.delay, 
      ...timer.jobParams
    )

    timer.timerId = timerId   
  }

  _log(job, timerName) {
    return (...params) => {   
      const jobResult = job(...params)
      
      this.logs.push({
        name: timerName,
        in: params,
        out: jobResult,
        created: new Date().toISOString()
      })
      this.print()
      return jobResult
    }
  }

  print() {
    console.log('Logs:', this.logs)
  }
}

const manager = new TimersManager();

const t1 = {
  name: 't1',
  delay: 1000,
  interval: false,
  job: (a, b) => a + b
};

manager.add(t1, 1, 2);
manager.start();
manager.print();