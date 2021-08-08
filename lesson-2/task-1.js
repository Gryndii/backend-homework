class TimersManager {
  constructor() {
    this.timers = [];
  }

  add() {}
  remove() {}
  start() {}
  stop() {}
  pause() {}
  resume() {}

}

const manager = new TimersManager();

const t1 = {
  name: 't1',
  delay: 1000,
  interval: false,
  job: () => { console.log('t1') }
};

const t2 = {
  name: 't2',
  delay: 1000,
  interval: false,
  job: (a, b) => a + b
};

manager.add(t1);
manager.add(t2, 1, 2);
manager.start();
console.log(1);
manager.pause('t1');