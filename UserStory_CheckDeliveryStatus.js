const UTIL = require("./Util")
const HOST = require("./Handler_Host");
const SESSION   = require("./Handler_Session");


exports.Maxis_CheckMyDeliveryStatus_Start = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn =await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID)

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
     let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
     if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    msisdn    = await SESSION.GetMSISDN(sessionID);
    Cache   = await SESSION.GetCache(sessionID);  
    console.log("**Maxis_CheckMyDeliveryStatus_Start**", JSON.stringify(Cache))
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
        //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
        return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }
    return UTIL.ComposeResult("","Maxis_CheckMyDeliveryStatus_Start_Display");
}

exports.HotlinkPostPaid_CheckMyDeliveryStatus_Start = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn =await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID)

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
     let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
     if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    msisdn    = await SESSION.GetMSISDN(sessionID);
    Cache   = await SESSION.GetCache(sessionID);  
    console.log("**HotlinkPostPaid_CheckMyDeliveryStatus_Start**", JSON.stringify(Cache))
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
        //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
        return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }
    return UTIL.ComposeResult("","HotlinkPostPaid_CheckMyDeliveryStatus_Start_Display");
}

exports.HotlinkPrePaid_CheckMyDeliveryStatus_Start = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn =await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID)

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
     let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
     if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    msisdn    = await SESSION.GetMSISDN(sessionID);
    Cache   = await SESSION.GetCache(sessionID);      
    console.log("**HotlinkPrePaid_CheckMyDeliveryStatus_Start**", JSON.stringify(Cache))
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
        //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
        return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }
    return UTIL.ComposeResult("","HotlinkPrePaid_CheckMyDeliveryStatus_Start_Display");
}
async function getBills(sessionID, msisdn) {
    try {
      let apiId = HOST.TARGET == 0 ? "nx5rbzdio4" : "avezebzouc";
      let apiky = HOST.TARGET == 0 ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin" : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
      let url = HOST.TARGET == 0 ? "https://maxbot-uat.maxis.com.my/dev/MaxisCallback" : "https://maxbot.maxis.com.my/prod/diagnostic";
  
  
      let head = {
        "headers": { "x-apigw-api-id": apiId, "x-api-key": apiky },
        "method": "POST",
        "body": JSON.stringify({
          "msisdn": msisdn,
          "sessionID": sessionID,
          "getBilling": "getBilling",
        })
      };
      console.log("customer API calling start");
      let data = await UTIL.GetUrl(url, head);
      console.log("customer API calling end");
      return true;
    } catch (err) {
      console.log('Maxis callback failed with error', err);
      return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }
  }
exports.Manage_Billing_Tac = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn =await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID)

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
     let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
     if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    msisdn    = await SESSION.GetMSISDN(sessionID);
    //callback add here 
   let getBillUser = await getBills(sessionID,msisdn);
    Cache   = await SESSION.GetCache(sessionID);    
    console.log("**Manage_Billing_Tac**", JSON.stringify(Cache))
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
        //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
        return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }

    if(Cache["MaxisNakedFiber"]  == "Olo"){
        return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
    }

    if(!Cache["MaxisNakedFiber"]){
        return UTIL.ComposeResult("","Manage_account_maxis_DirectDebit");
    }
    else{
        return UTIL.ComposeResult("","Manage_account_naked_DirectDebit");
    }
    
}


exports.Greeting_CheckCaseStatus_Start = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn =await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID)

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
     let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
     if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    msisdn    = await SESSION.GetMSISDN(sessionID);
    Cache   = await SESSION.GetCache(sessionID);  
    console.log("******Greeting_CheckCaseStatus_Start******", JSON.stringify(Cache));
    
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
            //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
            return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }

    if(Cache["MaxisNakedFiber"]  == "Olo"){
          return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
    }

    return UTIL.ComposeResult("","Greeting_CheckCaseStatus_ReportNetworkFault");
}