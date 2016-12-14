var connections = 0;

self.addEventListener("connect", function (e) {
  var port = e.ports[0];
  var timerID=null;
  var interval=100;
  connections += 1;

  port.addEventListener("message", function (e) {
    if (e.data=="start") {
      timerID=setInterval(function(){port.postMessage("tick");},interval)
      port.postMessage("Started");
    }
    else if (e.data.interval) {
      interval=e.data.interval;
      if (timerID) {
        clearInterval(timerID);
        timerID=setInterval(function(){port.postMessage("tick");},interval)
      } 
      port.postMessage("Interval updated");
    }
    else if (e.data=="stop") {
      clearInterval(timerID);
      timerID=null;
      port.postMessage("Stopped");
    }
  });

  port.start();

  port.postMessage('Timer initialised');
});
