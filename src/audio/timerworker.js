let timerID = null;
let interval = 100;
self.onmessage = (event) => {
  if (event.data === 'start') {
    timerID = setInterval(() => {
      postMessage('tick');
    }, interval);
    postMessage('Started');
  } else if (event.data.interval) {
    interval = event.data.interval;
    if (timerID) {
      clearInterval(timerID);
      timerID = setInterval(() => {
        postMessage('tick');
      }, interval);
    }
    postMessage('Interval updated');
  } else if (event.data === 'stop') {
    clearInterval(timerID);
    timerID = null;
    postMessage('Stopped');
  }
};
/* self.addEventListener('connect', (e) => {
  const port = e.ports[0];
  let timerID = null;
  let interval = 100;

  port.addEventListener('message', (event) => {
    if (event.data === 'start') {
      console.log('Starting Timer Worker');
      timerID = setInterval(() => {
        port.postMessage('tick');
      }, interval);
      port.postMessage('Started');
    } else if (event.data.interval) {
      interval = event.data.interval;
      if (timerID) {
        clearInterval(timerID);
        timerID = setInterval(() => {
          port.postMessage('tick');
        }, interval);
      }
      port.postMessage('Interval updated');
    } else if (event.data === 'stop') {
      clearInterval(timerID);
      timerID = null;
      port.postMessage('Stopped');
    }
  });

  port.start();

  port.postMessage('Timer initialised');
}); */
