const SESSION = require("./Handler_Session")
const UTIL = require("./Util")
const HOST = require("./Handler_Host");

async function createCase(msisdn,body)
{
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`;

  let head = {
    method :"POST",
    body   : JSON.stringify(body),
    headers: {"Content-Type" : "application/json", "msisdn" : msisdn, "channel" : "MAXBOT", "uuid":"123123"}
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function createLead(msisdn,ic)
{
  let url = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;

  //     let body = {
  //         "customerName": "NONE",
  //         "email": "NONE",
  //         "msisdn": msisdn,
  //         "leadCatId": "PRD0000162",
  //         "sourceId": "MAXBOT",
  //         "channelCode": "MAXBOT",
  //         "idNo": ic,
  //         "idType": "MALAYSIAN ID CARD",
  //         "dealearCode": "MAXBOT",
  //         "userId": false
  //         };

  let body = {
    "customerName": null,
    "email": null,
    "msisdn": msisdn,
    "leadCatId": "PRD0000162",
    "sourceId": "MAXBOT",
    "channelCode": "MAXBOT",
    "dealerCode": "MAXBOT",
    "userId": "MAXBOT"
  };

  let head = {
    method :"POST",
    body   : JSON.stringify(body),
    headers: {"Content-Type" : "application/json"}
  };

  let data = await UTIL.GetUrl(url,head);
  return data.status == "fail" ? true : false;
}


async function getEligibilityByMsisdn(msisdn) {
  let url = `${HOST.ELIGIBILITY[HOST.TARGET]}/eprihatin/api/v1.0/redemption/check?msisdn=${msisdn}`;
  let head = { headers: {"channel" : "MAXBOT", "languageid":"en-US"} };

  let data = await UTIL.GetUrl(url,head);

  let isEligible = false;

  if (data.responseData != null)
  {
    if ("status" in data.responseData)
    {
      if (data.responseData.status == "BPR00")
        isEligible = true;
    }
  }
  return isEligible;
}

async function getEligibilityByIC(ic) {
  let url = `${HOST.ELIGIBILITY[HOST.TARGET]}/eprihatin/api/v1.0/redemption/check?ic=${ic}`;
  let head = { headers: {"channel" : "MAXBOT", "languageid":"en-US"} };

  let data = await UTIL.GetUrl(url,head);

  let isEligible = false;

  if (data.responseData != null)
  {
    if ("status" in data.responseData)
    {
      if (data.responseData.status == "BPR00")
        isEligible = true;
    }
  }
  return isEligible;
}

async function getCustomer(msisdn,sessionID) {


  let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  let head = {
    headers: {"Content-Type" : "application/json", "maxis_channel_type" : "MAXBOT", "languageid":"en-US"},
    method : "POST",
    body : JSON.stringify({
      "searchtype":"MSISDN",
      "searchvalue": msisdn,
      "prinSuppValue": "",
      "isGetSupplementary": false,
      "isPrincipalPlanName": false,
      "isLookupAllAccount": false,
      "isIndividual": 1,
      "isSubscription": true,
      "isIncludeOfferingConfig":false,
      "isCustomerProfile":false,
      "familyType": false
    })
  };


  let data = await UTIL.GetUrl(url, head, msisdn,sessionID);

  return data.responseData;
}

exports.Eligibility = async function (event, IsBM = false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Customer = await getCustomer(msisdn,sessionID);

  let evt_name = "";

  if (Customer != null && (Customer.accounts[0].status == "Open" && Customer.accounts[0].type=="Consumer")) {
    //------------------------------------------------------------------------------
    // 🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
    if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
    //-------------------------------------------------------------------------------
    // Cache The IC
    if ("customer" in Customer) {
      let cache = await SESSION.GetCache(sessionID);
      cache["IC"] = Customer.customer.documentNumber;
      await SESSION.SetCache(sessionID,cache);
    }

    if (await getEligibilityByMsisdn(msisdn)) {
      evt_name = IsBM ? "JaringanPrihatin_Bm_Eligible_Yes" : "JaringanPrihatin_Eligible_Yes";
    } else {
      evt_name = IsBM ? "JaringanPrihatin_Bm_Eligible_No" : "JaringanPrihatin_Eligible_No";
    }
    return UTIL.ComposeResult("",evt_name);
  } else {
    evt_name = IsBM ? "JaringanPrihatin_Bm_NonMaxis_NRIC" : "JaringanPrihatin_NonMaxis_NRIC";
    return UTIL.ComposeResult("",evt_name);
  }
}

exports.Verify = async function(event, IsBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let ic = UTIL.GetParameterValue(event, "jpUserNRIC");
  let cache = await SESSION.GetCache(sessionID);

  if (ic != null && ic != undefined) {
    cache["IC"] = ic;
    await SESSION.SetCache(sessionID,cache);
  } else {
    ic=cache["IC"];
  }

  let evt_name = "";

  //------------------------------------------------------------------------------
  // 🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------

  if (await getEligibilityByIC(ic)) {
    evt_name = IsBM ? "JaringanPrihatin_Bm_NonMaxis_Eligible_Yes_Telesales" : "JaringanPrihatin_NonMaxis_Eligible_Yes_Telesales";
    console.log("Case: Jaringan Prihatin for NON Customer");

    let isfail = await createLead(msisdn,ic);
    if (isfail) {
      evt_name = IsBM ? "JaringanPrihatin_Bm_NonMaxis_Eligible_ExistingCase": "JaringanPrihatin_NonMaxis_Eligible_ExistingCase";
    }
  } else {
    evt_name = IsBM ? "JaringanPrihatin_Bm_NonMaxis_Eligible_No" : "JaringanPrihatin_NonMaxis_Eligible_No";
  }

  return UTIL.ComposeResult("",evt_name);
}

exports.DeviceSubsidy = async function(event, IsBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let cache = await SESSION.GetCache(sessionID);
  let ic = cache["IC"];
  let Customer = await getCustomer(msisdn, msisdn);
  let evt_name ;
  if (Customer != null && ((Customer.accounts[0].status == "Open" || Customer.accounts[0].status == "None") && Customer.accounts[0].type=="Consumer")) {
    console.log("Case: Jaringan Prihatin for Maxis Customer");
    let body = {
      "idType": "MSISDN",
      "idValue": msisdn,
      "msisdn": msisdn,
      "caseType1": "Sales & Lead",
      "caseType2": "Resg of Interest",
      "caseType3": "Jaringan Prihatin",
      "description": `Notes from Chatbot WA MSISDN: ${msisdn},Channel:MAXBOT, Eligibility Check:Eligible, NRIC: ${ic}, JPP Request: Purchase A Smartphone`,
      "isUpdateCBR": "false",
    };

    await createCase(msisdn, body);
  } else {
    console.log("Case: Jaringan Prihatin for NON Customer");
    let isfail = await createLead(msisdn,ic);
    if (isfail) {
      evt_name = "JaringanPrihatin_NonMaxis_Eligible_ExistingCase";
    }
  }

  evt_name = IsBM ? "JaringanPrihatin_Bm_Eligible_Yes_DeviceSubsidy_Telesales" : "JaringanPrihatin_Eligible_Yes_DeviceSubsidy_Telesales";
  return UTIL.ComposeResult("", evt_name);
};
