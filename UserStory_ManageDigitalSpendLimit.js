const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

async function getSpendLimit(msisdn,accountNo){
    let url = `${HOST.DCB[HOST.TARGET]}/api/v1.0/dcb?selectedMsisdn=${msisdn}&accountNumber=${accountNo}`;
    let head = {
            headers: { "Content-Type": "application/json", "channel": "SS", "languagecode": "en-US" },
            method: "GET"
    };
  
    let data = await UTIL.GetUrl(url,head);
    console.log(`UserStory Spend Limit | getSpendLimit | response: ${JSON.stringify(data.responseData.spendLimitDetlList[0])}`);
    return data.responseData.spendLimitDetlList[0];
}

async function generateRedirectionUrl(subType, msisdn, accountNo, languageId){
    let url;
    if(subType == 'Maxis Individual'){
        try {
          url = await urlToMSSP(msisdn, accountNo, languageId)
        } catch (error) {
          url = "https://care.maxis.com.my/en/auth";
        }
    } else if (subType == 'Hotlink Individual'){
        try {
            url = await urlToHSSP(msisdn, languageId)
          } catch (error) {
            url = "https://selfserve.hotlink.com.my/en/auth";
          }
    }

    return url;
}

async function urlToHSSP(msisdn, languageId) {
    let url = `${HOST.CHECKPUKURL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/dcb?msisdn=${msisdn}`;
    console.log("languageid",languageId);
  
    let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
    let data = await UTIL.GetUrl(url, head);
    data = data.responseData;
    return data
  }
  
  async function urlToMSSP(msisdn,accountNo,languageId) {
    let url = `${HOST.CHECKPUKURL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/dcb?msisdn=${msisdn}&accountNumber=${accountNo}`;
    console.log("languageid",languageId);
  
    let head = { "headers": { "languageid":languageId, "channel": "MAXBOT" } };
    let data = await UTIL.GetUrl(url, head);
    data = data.responseData;
    return data
  }
  


exports.Manage_Digital_Spend_Limit = async function (event) {
    try {
        console.log(`UserStory Spend Limit | Manage_Digital_Spend_Limit | START`)
        let sessionID = UTIL.GetSessionID(event);
        let msisdn = await SESSION.GetMSISDN(sessionID);
        let Cache = await SESSION.GetCache(sessionID)
        let languageId = Cache.Language == 1 ? "ms-MY" : "en-US";
        console.log("Cache",JSON.stringify(Cache));
      //------------------------------------------------------------------------------
      // 🔐EXECUTE AUTHENTICATION
      //------------------------------------------------------------------------------
      let redirectToEvent = await UTIL.Authenticate(event, msisdn,sessionID);
      if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
      //-------------------------------------------------------------------------------
      msisdn = await SESSION.GetMSISDN(sessionID);
      Cache = await SESSION.GetCache(sessionID)
      if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
        return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
      }
    
      if (Cache["MaxisNakedFiber"]  == "Olo") {
        return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
      }
    
      let CustomerType = await SESSION.GetCustomerType(sessionID);
      let { accountNo } = Cache["customerData"]["responseData"]["accounts"][0];
      console.log(`UserStory Spend Limit | Manage_Digital_Spend_Limit | AccNo: ${accountNo}`);
    
      let spendLimitInfo = await getSpendLimit(msisdn, accountNo);
      let url = await generateRedirectionUrl(CustomerType.subType, msisdn, accountNo, 'English');
    
      let destination = null;
     if(CustomerType.subType == 'Maxis Individual'){
        destination = 'Maxis Care Portal';
     } else if (CustomerType.subType == 'Hotlink Individual'){
        destination = 'Hotlink Self-Serve Portal';
     }
    
      
    
        let returnParam = {
            limit: `RM ${spendLimitInfo.currentSpendLimit}`,
            usage: `RM ${spendLimitInfo.spendLimitUsage}`,
            destination: destination,
            url: url
        }
        
        return UTIL.ComposeResult("", "present_digital_spend_limit", returnParam)
    } catch (error) {
        console.log(`UserStory Spend Limit | Manage_Digital_Spend_Limit | CATCH ERROR ${error}`)
        return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }
   
}