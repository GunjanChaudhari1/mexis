const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

async function vas_URL_HSSP(msisdn, languageId) {
  let url = `${HOST.CHECKPUKURL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/mv?msisdn=${msisdn}`;
  console.log("languageid",languageId);

  let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
  let data = await UTIL.GetUrl(url, head);
  data = data.responseData;

  return data
}

async function vas_url_MSSP(msisdn,accountNo,languageId) {
  let url = `${HOST.CHECKPUKURL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/mv?msisdn=${msisdn}&accountNumber=${accountNo}`;
  console.log("languageid",languageId);

  let head = { "headers": { "languageid":languageId, "channel": "MAXBOT" } };
  let data = await UTIL.GetUrl(url, head);
  data = data.responseData;
  return data
}

exports.Manage_Vas_Wh = async function (event) {
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
  //   let accountNo = Cache["customerData"]["responseData"]["accounts"][0]["accountNo"]
  let { accountNo } = Cache["customerData"]["responseData"]["accounts"][0];
  console.log("AccNo", accountNo);
  let subType = ""

  console.log("TAC Authenticated")
  // let cusData = await getAccountDetails(msisdn);
  try {
    subType = await CustomerType.subType;
    console.log("Subtype", subType, "type", typeof subType)
    if (subType == "Maxis Individual") {
      let url;
      try {
        url = await vas_url_MSSP(msisdn, accountNo, languageId)
      } catch (error) {
        url = "https://care.maxis.com.my/en/auth";
      }
      let returnParam = {"url": url }
      return UTIL.ComposeResult("", "present_vas", returnParam)
    } else if (subType == "Hotlink Individual") {
      let url;
      try {
        url = await vas_URL_HSSP(msisdn, languageId)
      } catch (error) {
        url = "https://selfserve.hotlink.com.my/en/auth";
      }
      let returnParam = {"url": `${url}`}
      return UTIL.ComposeResult("", "present_vas_hotlink", returnParam)
    }
  } catch {
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
};
