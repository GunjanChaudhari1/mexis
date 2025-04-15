const SESSION = require("./Handler_Session")
const UTIL = require("./Util")
const HOST = require("./Handler_Host");

// const CatTable = {
//         "K21" : "PRD0000163",
//         "K11" : "PRD0000164",
//         "K22" : "PRD0000165",
//         "K12" : "PRD0000166",
//         "K23" : "PRD0000167",
//         "K13" : "PRD0000168",
//         "K24" : "PRD0000169",
//         "K14" : "PRD0000170"
// }
function salesChannelsHelper(attrs=[]) {
  let result = [];

  if (attrs != '' && attrs != undefined) {
    for (attr of attrs) {
      for (key of Object.keys(attr)) {
        let item = {};
        item["schemeName"] = key;
        item["value"] = attr[key];

        result.push(item);
      }
    }
  }

  return result;
}

async function createLeadLMS(msisdn, customerName="", lmsCategoryId="") {
  let url = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;

  let body = {
    "customerName": customerName,
    "email": null,
    "msisdn": msisdn,
    "leadCatId": lmsCategoryId,
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

  try {
    if (data.status == "fail") {
      return data.violations[0].code == 102 ? "Duplicate" : "General";
    } else {
      return "Success";
    }
  } catch {
    return "General";
  }
}

async function createLeadSalesForce(msisdn, companyName, state, customerName, contactNumber, sfProductGroupEligible, sfCampaignId, sfProductOfInterestEligible) {
  let url = `${HOST.SFDC[HOST.TARGET]}/leads/api/v1.0/leads/enterprise`;

  let body = {
    "organization": {
      "name": companyName,
      "location": state,
    },
    "contactPerson": {
      "name": customerName,
      "mobileNumber": contactNumber
    },
    "salesChannel": "MAXBOT",
    "salesOpportunity": sfProductGroupEligible,
    "campaignId": sfCampaignId,
    "areaOfInterest": sfProductOfInterestEligible
  };

  let head = {
    method :"POST",
    body   : JSON.stringify(body),
    headers: {"Content-Type" : "application/json"}
  };

  let data = await UTIL.GetUrl(url,head);

  return data.status == "fail" ? false : true;
}

async function createLeadDealerNet(msisdn, dealerCode="", otherComment="", campaignName="", salesChannelsIdOtherAttributes=[]) {
  let url = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;
  console.log(salesChannelsHelper(salesChannelsIdOtherAttributes));

  let body = {
    "channelCode": "MAXBOT",
    "msisdn": msisdn,
    "otherComment": otherComment,
    "tranxId": `${msisdn}_${new Date().getTime()}`,
    "targetSystem": "DNET",
    "salesChannelsIdOtherAttributes": salesChannelsHelper(salesChannelsIdOtherAttributes)
  }

  if (dealerCode != "" && dealerCode != undefined) body["dealerCode"] = dealerCode;
  if (campaignName != "" && campaignName != undefined) body["refereeName"] = campaignName.replace("[","").replace("]","");

  let head = {
    method :"POST",
    body   : JSON.stringify(body),
    headers: {"Content-Type" : "application/json"}
  };

  let data = await UTIL.GetUrl(url,head);

  return data.status == "fail" ? false : true;
}

function FiveDotFiveHelper(queryText) {
  let result = {};
  console.log("Inside FiveDotFiveHelper funtion")
  let cleanText = queryText.replace(/\n/g,'')
  // if (/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5} \[.+\].+$/.test(cleanText)) // Old code by accenture
  if (/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5} \[.+\].+$|^\[.+\].+$/.test(cleanText)) { // Fixed code by updating regular expression and added try..catch
    try {
    //   result["dealerCode"] = queryText.match(/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5}/)[0]; // dealerCode
      const dealerCodeTemp = queryText.match(/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5}/)[0]; // dealerCode
      result["dealerCode"] = dealerCodeTemp
    } catch (err) {
      result["dealerCode"] = "";
    }

    // result["campaignName"] = queryText.match(/\[.+\]/)[0]; //campaign
    const campaignNameTemp = queryText.match(/\[.+\]/)[0]; // campaign
    result["campaignName"] = campaignNameTemp
    result["campaignTitle"] = queryText.split(']')[1].trim(); // text
  }
  return result;
}

exports.General = async function(event) {
  // console.log(event);

  let targetMS = UTIL.GetParameterValue(event,"targetMS");
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);

  // CUSTOMER
  let customerName = UTIL.GetParameterValue(event,"customerName");
  let companyName = UTIL.GetParameterValue(event,"companyName");
  let contactNumber = UTIL.GetParameterValue(event,"contactNumber");
  let contactState = UTIL.GetParameterValue(event,"contactState");
  let contactPostcode = UTIL.GetParameterValue(event,"contactPostcode");
  let lmsCategoryId = UTIL.GetParameterValue(event,"lmsCategoryId");

  // AGENT
  let agentStartDay = UTIL.GetParameterValue(event,"agentStartDay");
  let agentEndDay = UTIL.GetParameterValue(event,"agentEndDay");
  let agentStartTime = UTIL.GetParameterValue(event,"agentStartTime");
  let agentEndTime = UTIL.GetParameterValue(event,"agentEndTime");
  let shortStartTime = UTIL.GetParameterValue(event,"shortStartTime");
  let shortEndTime = UTIL.GetParameterValue(event,"shortEndTime");
  let onlineMessage = UTIL.GetParameterValue(event,"onlineMessage");
  let offlineMessage = UTIL.GetParameterValue(event,"offlineMessage");
  let agentId = UTIL.GetParameterValue(event,"agentCategoryId");

  // SFDC
  let eligibleMessage = UTIL.GetParameterValue(event,"eligibleMessage");
  let sfObj = UTIL.GetParameterValue(event,"sfObj")
  let userObj = UTIL.GetParameterValue(event,"userObj")

  if (sfObj != "" && sfObj != undefined) sfObj = JSON.parse(sfObj);
  if (userObj != "" && userObj != undefined) userObj = JSON.parse(userObj);

  let dealerObj = FiveDotFiveHelper(event.queryResult.queryText);

  if (Object.keys(dealerObj).length > 0) {
    console.log("👉 Dealer Net Detected! Stored in Session")
    let Cache = await SESSION.GetCache(sessionID);
    Cache["dealerObj"] = dealerObj;

    await SESSION.SetCache(sessionID,Cache);
  } else {
    let Cache = await SESSION.GetCache(sessionID);
    dealerObj = Cache["dealerObj"];

    if (dealerObj == undefined || Object.keys(dealerObj).length == 0) {
      dealerObj = UTIL.GetParameterValue(event,"dealerObj");

      if (dealerObj != "" && dealerObj != undefined) {
        console.log("👉 Dealer Net picked up from Parameter");
        dealerObj = JSON.parse(dealerObj);
      } else {
        console.log("🤮 Dealer object is not present in Dialogflow parameter");
      }
    } else {
      console.log("👉 Dealer Net picked up from Session");
    }
  }

  console.log("sfObj:"); console.log(sfObj);
  console.log("dealerObj:"); console.log(dealerObj);
  console.log("userObj:"); console.log(userObj);

  // RETURN PARAMETER & AGENT CLOSING MESSAGE
  let message = UTIL.IsAgentOnline2(agentStartDay, agentEndDay, agentStartTime, agentEndTime, shortStartTime, shortEndTime) ? onlineMessage : offlineMessage;

  let paramObj = {
    "LMS"        : {"agentStartDay":agentStartDay,"agentEndDay":agentEndDay,"agentStartTime":agentStartTime,"agentEndTime":agentEndTime,"shortStartTime":shortStartTime,"shortEndtime":shortEndTime, "message":message},
    "SALESFORCE" : {"closingMessage":message, "eligibleMessage" : eligibleMessage },
    "DEALERNET"  : {"agentStartDay":agentStartDay,"agentEndDay":agentEndDay,"agentStartTime":agentStartTime,"agentEndTime":agentEndTime,"shortStartTime":shortStartTime,"shortEndtime":shortEndTime, "message":message}
  };

  let returnParam = paramObj[targetMS];

  // HANDOVER
  let handoverToRc = UTIL.GetParameterValue(event,"handoverToRc");
  handoverToRc = handoverToRc == undefined || handoverToRc == "" ? "TRUE" : handoverToRc; // default is TRUE

  // CLOSE INTERVENTION
  let closeIntervention = UTIL.GetParameterValue(event,"closeIntervention");
  closeIntervention = closeIntervention == undefined || closeIntervention == "" ? "FALSE" : closeIntervention; // default is FALSE

  // RETURN EVENT
  let returnEvent = ({"LMS":"Shared_Handover_Message", "SALESFORCE":"Sfdc_En_Closing", "DEALERNET":"Shared_Handover_Message"})[targetMS];
  let result = "";

  // ⭐ CEATE LEAD for LMS
  if (targetMS == "LMS") {
    if (handoverToRc.toUpperCase() == "FALSE") {
      console.log("👍 Reached Create Lead LMS");
      result = await createLeadLMS(msisdn, customerName, lmsCategoryId);
      returnEvent = result == "Duplicate" ? "Shared_Error_LmsDuplicate" : returnEvent;
    } else {
      console.log("👍 Reached LMS HandOver");
    }
  }

  // ⭐CEATE LEAD for SALES FORCE
  if (targetMS == "SALESFORCE") {
    console.log("👍 Reached Create Lead Sales Force");
    let isSuccess = await createLeadSalesForce(msisdn, companyName, contactState, customerName, contactNumber, sfProductGroupEligible, sfCampaignId, sfProductOfInterestEligible);
    result = isSuccess ? "Success" : "Fail";
  }

  // ⭐CEATE LEAD for DEALERNET
  if (targetMS == "DEALERNET") {
    console.log("👍 Reached Create Lead Dealer-Net");
    let isSuccess = await createLeadDealerNet(msisdn, dealerObj.dealerCode, dealerObj.campaignTitle, dealerObj.campaignName, userObj);
    result = isSuccess ? "Success" : "Fail";
  }

  // CLOSE
  if (closeIntervention.toUpperCase() == "TRUE" && result == "Success") {
    // Once Ring-Central "Close" api is called. You can no longer reply text to this tread id. Therefore, no bye bye message is sent.
    await SESSION.SetClose(sessionID, true);
  }

  console.log(result);

  if (result != "Success")
    return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
  else
    return UTIL.ComposeResult("",returnEvent,returnParam);
}