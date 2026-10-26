const test=require('node:test'),assert=require('node:assert/strict');
const {retryAfterMs,classifyFailure,backoffMs}=require('./retry_policy.cjs');
test('Retry-After supports seconds and HTTP-date',()=>{assert.equal(retryAfterMs('45'),45000);assert.equal(retryAfterMs('Thu, 01 Jan 1970 00:01:00 GMT',0),60000);assert.equal(retryAfterMs('bad'),null);});
test('Retryable errors distinct from auth/billing failures',()=>{for(const s of [429,500,503])assert.equal(classifyFailure(s,null),'retryable');for(const s of [401,402,403,404])assert.equal(classifyFailure(s,null),'fatal');assert.equal(classifyFailure(null,'TIMEOUT'),'retryable');assert.equal(classifyFailure(200,'INVALID_OUTPUT'),'terminal');});
test('Backoff never shortens provider Retry-After',()=>{assert.equal(backoffMs(1,null),30000);assert.equal(backoffMs(2,null),60000);assert.equal(backoffMs(1,120000),120000);});
