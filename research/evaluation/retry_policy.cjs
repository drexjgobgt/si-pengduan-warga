// Provider compliance: honor Retry-After; never switch identities/models to evade limits.
function retryAfterMs(value, now=Date.now()) {
 if(!value)return null;
 if(/^\d+$/.test(value))return Number(value)*1000;
 const time=Date.parse(value);return Number.isFinite(time)?Math.max(0,time-now):null;
}
function classifyFailure(http,error){
 if([401,402,403,404].includes(http))return 'fatal';
 if(http===429||http>=500||['TIMEOUT','NETWORK_ERROR'].includes(error))return 'retryable';
 return 'terminal';
}
function backoffMs(attempt,retryAfter){return Math.max(30000*2**(attempt-1),retryAfter??0);}
module.exports={retryAfterMs,classifyFailure,backoffMs};
