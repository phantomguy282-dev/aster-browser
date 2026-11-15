'use strict';
// Coalesce synchronous event bursts. Security-sensitive layout changes remain
// synchronous in Browser.emit; only the redundant state snapshots are deferred.
class StatePublisher {
 constructor(publish,options={}){this.publish=publish;this.schedule=options.schedule||setImmediate;this.cancel=options.cancel||clearImmediate;this.pending=null;this.closed=false;this.requested=0;this.published=0;}
 request(){if(this.closed)return;this.requested++;if(this.pending!==null)return;this.pending=this.schedule(()=>{this.pending=null;if(this.closed)return;this.published++;this.publish();});}
 dispose(){this.closed=true;if(this.pending!==null){this.cancel(this.pending);this.pending=null;}}
 stats(){return {requested:this.requested,published:this.published,pending:this.pending!==null};}
}
module.exports={StatePublisher};
