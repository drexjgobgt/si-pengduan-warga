// Pure authorization decision. Evidence is caller-supplied, NOT authenticated by this function.
const MODEL='minimax-m3.1-flash-free',ENDPOINT='https://kiosapi.com/v1/chat/completions';
function authorize(config,evidence,now){
 const deny=reason=>({allowed:false,reason});
 if(!config||config.model!==MODEL||config.endpoint!==ENDPOINT||config.freeOnly!==true||config.allowUnverified!==false)return deny('CONFIG_NOT_EXPLICITLY_APPROVED');
 if(config.fallbackModels?.length)return deny('FALLBACK_FORBIDDEN');
 if(!evidence||evidence.origin!=='verified_provider_account'||evidence.model!==MODEL||evidence.endpoint!==ENDPOINT||evidence.group!=='Free-Pro')return deny('ACCOUNT_EVIDENCE_REQUIRED');
 if(!Number.isFinite(now)||!Number.isFinite(evidence.validUntil)||evidence.validUntil<=now||!evidence.accountBinding||!evidence.evidenceSha256)return deny('EVIDENCE_STALE_OR_UNBOUND');
 if(evidence.aliasResolutionVerified!==true||!evidence.returnedModelAllowlist?.length)return deny('ALIAS_UNVERIFIED');
 if(evidence.allFeesZero!==true||evidence.providerPaidDebitBlocked!==true||evidence.hardNoSpendVerified!==true)return deny('ZERO_DEBIT_NOT_PROVEN');
 if(!Number.isInteger(evidence.remainingRequests)||evidence.remainingRequests<config.plannedPosts||config.plannedPosts!==270||!(evidence.rpm>0)||!(evidence.dailyLimit>0))return deny('QUOTA_NOT_VERIFIED');
 return {allowed:true,reason:'SUPPLIED_EVIDENCE_MEETS_POLICY_NOT_AUTHENTICATED'};
}
module.exports={authorize};
