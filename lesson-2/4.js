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

    const awaitTime = this.timers.reduce((prev, current) => (
      prev > current.delay ? prev : current.delay
    ), 0) + 10000

    setTimeout(this.stop.bind(this), awaitTime)
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
      let jobResult
      
      try {
        jobResult = job(...params)
      
        this.logs.push({
          name: timerName,
          in: params,
          out: jobResult,
          created: new Date().toISOString()
        })

        return jobResult
      } catch ({name, message, stack}) {
        this.logs.push({
          name: timerName,
          in: params,
          out: jobResult,
          error: {
            name,
            message,
            stack
          },
          created: new Date().toISOString()
        })
      }
    }
  }

  print() {
    console.log('Logs:', this.logs)
  }
}

const manager = new TimersManager();

const t1 = {
  name: 't1',
  delay: 3000,
  interval: false,
  job: (a, b) => a + b
};
const t2 = {
  name: 't2',
  delay: 2000,
  interval: false,
  job: () => {throw new Error('We have a problem!')}
};
const t3 = {
  name: 't3',
  delay: 5000,
  interval: false,
  job: n => n
};

manager.add(t1, 1, 2);
manager.add(t2);
manager.add(t3, 1);
manager.start();