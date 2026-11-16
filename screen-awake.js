'use strict';
/* A listening session owns the screen lock, including pauses between piano notes.
   Late permission results must never keep the display awake after Stop. */
(function(root){
  function createScreenWakeLock({request,isVisible,onChange=()=>{}}){
    let wanted=false,epoch=0,sentinel=null,pending=null,status='idle';
    function report(next){status=next;onChange({status,wanted});}
    async function release(lock){if(lock&&!lock.released){try{await lock.release();}catch{}}}
    function acquire(){
      if(!wanted)return Promise.resolve();
      if(!isVisible()){report('hidden');return Promise.resolve();}
      if(sentinel&&!sentinel.released){report('active');return Promise.resolve();}
      if(pending)return pending.promise;
      if(!request){report('unsupported');return Promise.resolve();}
      const operation={epoch};pending=operation;report('requesting');
      operation.promise=(async()=>{
        try{
          const lock=await request();
          if(operation.epoch!==epoch||!wanted||!isVisible()){await release(lock);return;}
          if(lock.released){report('released');return;}
          sentinel=lock;
          lock.addEventListener('release',()=>{
            if(sentinel!==lock)return;
            sentinel=null;
            report(!wanted?'idle':isVisible()?'released':'hidden');
          },{once:true});
          report('active');
        }catch{
          if(operation.epoch===epoch&&wanted)report(isVisible()?'blocked':'hidden');
        }finally{if(pending===operation)pending=null;}
      })();
      return operation.promise;
    }
    function drop(){epoch++;pending=null;const lock=sentinel;sentinel=null;return release(lock);}
    const api={
      start(){wanted=true;return acquire();},
      stop(){wanted=false;const result=drop();report('idle');return result;},
      suspend(){const result=drop();report(wanted?'hidden':'idle');return result;},
      resume:acquire,
      get status(){return status;}
    };
    report(request?'idle':'unsupported');
    return api;
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=createScreenWakeLock;
  else root.createScreenWakeLock=createScreenWakeLock;
})(typeof window==='undefined'?globalThis:window);
