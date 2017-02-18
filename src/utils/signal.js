/* eslint no-underscore-dangle: [ "error", { "allow": ["_signal", "_connect"] } ] */
/**
 * Signal : Factory Function
 * Returns a function that has methods
 * for connecting and disconnecting functions
 * from it.
 * When the function is invoked, the invocation
 * is dispatched to each of the registered
 * functions
 * stateful - if the calling scope should be
 *    passed on to
 *    underlying dispatches.
 **/
export function signal(stateful) {
  const slots = [];
  /**
   * _signal : Proxy Function
   * acts as a multicast proxy to the
   * functions connected to it,
   * passing along the arguments it was
   * invoked with
   **/
  const _signal = function _signal(...args) {
    let arglist = [];
    if (stateful) {
      arglist.push(this);
    }
    arglist = arglist.concat(args);
    for (let j = 0; j < slots.length; j += 1) {
      let obj = slots[j][0];
      if (obj == null) {
        obj = this;
      }
      const fun = slots[j][1];
      try {
        fun.apply(obj, arglist);
      } catch (e) {
        console.log(e);
      }
    }
  };

  /**
   * _signal._connect: Function
   * Connects a function and the scope to be
   * called when the signal is invoked.
   * fun - The function to be invoked on
   *    signal.
   * obj - The scope
   */
  _signal._connect = function _connect(fun, scope) {
    slots.push([scope, fun]);
  };

  /**
   * _signal.disconnect: Function
   * Disconnects a matching function from a
   * signal.
   * fun - The function to be removed.
   * obj - The scope
   */
  _signal.disconnect = function disconnect(fun, scope) {
    let shift = false;
    for (let i = 0; i < slots.length; i += 1) {
      if (shift) {
        slots[i - 1] = slots[i];
      } else if (scope === slots[i][0] &&
              fun === slots[i][1]) {
        shift = true;
      }
    }
    if (shift) {
      slots.pop();
    }
  };

  _signal.disconnectAll = function disconnectAll() {
    const slen = slots.length;
    for (let i = 0; i < slen; i += 1) {
      slots.pop();
    }
  };
  return _signal;
}

/**
 * Connect : Helper function
 * connects a sender to a reciever
 * through a signal and slot
 * sender - the object which will send
 *      the signal.
 * signal - string name representing
 *      the signal
 * rec - object to recieve the
 *      signal notification.
 * slot - a string that will be used
 *      to look up the same named attr
 *      on rec, which should be a
 *      function.  The function gets
 *      the arguments passed to the
 *      signal.  If stateful, the
 *      first argument will be the
 *      scope of the connect call.
 */
/* eslint no-param-reassign: ["error", { "props": false }] */
export function connect(sender, theSignal, rec, slot) {
  let sigf;
  let err = null;
  if (sender[theSignal] == null) {
    sigf = signal(true);
    sender[theSignal] = sigf;
  } else if (!sender[theSignal]._connect) {
    err = `No Signal ${theSignal}`;
    throw new Error(err);
  } else {
    sigf = sender[theSignal];
  }
  if (rec) {
    const slotf = rec[slot];
    if (typeof slotf === 'function') {
      sigf._connect(slotf, rec);
      return;
    }
  }
  err = 'Bad Slot';
  throw new Error(err);
}

export default {
  signal,
  connect,
};
