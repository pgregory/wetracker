/* convertArguments : Utility Function
 * copies array A starting at index i
 * into existing array R, or new R if undefined */
var convertArguments = function(A,i,R){
    if(R==undefined){
        R = [];
    }
    for(;i<A.length;i++){
        R.push(A[i]);
    }
    return R;
}
/* Signal : Factory Function
* Returns a function that has methods
* for connecting and disconnecting functions
* from it.
* When the function is invoked, the invocation
* is dispatched to each of the registered
* functions
* stateful - if the calling scope should be
*    passed on to
*    underlying dispatches. */
export function signal(stateful) {
  var slots = [];
  /* _signal : Proxy Function
   * acts as a multicast proxy to the
   * functions connected to it,
   * passing along the arguments it was
   * invoked with */  
  var _signal = function()
  {
    var arglist = [];
    if(stateful)
      arglist.push(this);
    convertArguments(arguments,0,arglist);
    for(var j=0;j<slots.length;j++){
      var obj = slots[j][0];
      if(obj==undefined)
        obj = this;
      var fun = slots[j][1];
      try{
        fun.apply(obj,arglist);
      }catch(e){
        console.log(e);
      }
    }
  }
  /* _signal.connect: Function
   * Connects a function and the scope to be
   * called when the signal is invoked.
   * fun - The function to be invoked on
   *    signal.
   * obj - The scope
   */
  _signal.connect = function(fun,scope)
  {
    slots.push( [scope,fun] );
  }
  /*  _signal.disconnect: Function
   * Disconnects a matching function from a
   * signal.
   * fun - The function to be removed.
   * obj - The scope
   */
  _signal.disconnect = function(fun,scope)
  {
    var shift=false;
    for(var i=0; i<slots.length;i++){
      if(shift)
        slots[i-1]=slots[i];
      else if(scope==slots[i][0] &&
              fun==slots[i][1])shift=true;
    }
  if(shift)
    slots.pop();
  }
  _signal.disconnect_all = function()
  {
    var slen = slots.length;
    for(var i=0;i<slen;i++)
    {
      slots.pop();
    }
  }
  return _signal;
};
/* Connect : Helper function
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
 *      scope of the connect call.*/
export function connect(sender,signal,
                       rec,slot){
                         var sigf;
                         var err = null;
                         if(sender[signal]==undefined){
                           sigf = Signal(true);
                           sender[signal] = sigf;
                         }else{
                           if(!sender[signal].connect){
                             err="No Signal "+signal;
                             throw new Error(err);
                           }
                           else{
                             sigf = sender[signal];
                           }
                         }
                         var slot_type = typeof(slot);
                         var rec_type = typeof(rec);
                         if(rec){
                           var slotf = rec[slot];
                           if(typeof(slotf)=="function"){
                             sigf.connect(slotf,rec);
                             return;
                           }
                         }
                         err = "Bad Slot";
                         throw new Error(err);
                       };

export default {
  signal,
  connect,
};
