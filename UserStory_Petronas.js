const SESSION = require("./Handler_Session");
const UTIL = require("./Util");
const HOST = require("./Handler_Host");

const CatTable = {
  "K21": "PRD0000163",
  "K11": "PRD0000164",
  "K22": "PRD0000165",
  "K12": "PRD0000166",
  "K23": "PRD0000167",
  "K13": "PRD0000168",
  "K24": "PRD0000169",
  "K14": "PRD0000170"
};

async function createLead(sessionID, msisdn, notes) {
  let url = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;

  let Cache = await SESSION.GetCache(sessionID);
  let option3 = Cache["Petronas_Option3"];
  let option4 = Cache["Petronas_Option4"];

  // option3 = option3.split('.')[0];
  const option3Temp = option3.split('.')[0];
  option3 = option3Temp;
  // option4 = option4.split('.')[0];
  const option4Temp = option4.split('.')[0];
  option4 = option4Temp;

  let catId = CatTable[`K${option3}${option4}`];

  let body = {
    "customerName": null,
    "email": null,
    "msisdn": msisdn,
    "leadCatId": catId,
    "sourceId": "MAXBOT",
    "channelCode": "MAXBOT",
    "dealerCode": "MAXBOT",
    "userId": "MAXBOT",
    "otherComment": notes
  };

  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {"Content-Type": "application/json"}
  };

  let data = await UTIL.GetUrl(url,head);

  if (data.status == "fail") {
    return data.violations[0].code == 102 ? "Duplicate" : "General";
  } else {
    return "Success";
  }
}

async function CacheHelper(sessionID, msisdn,value,key) {
  let Cache = await SESSION.GetCache(sessionID);
  Cache[value] = key;
  await SESSION.SetCache(sessionID,Cache);
}

exports.Petronas_En_Language_Wh = async function (event, isBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let inputDesc = UTIL.GetParameterValue(event, "inputDesc");

  await CacheHelper(sessionID,msisdn,"Petronas_Option2",inputDesc);
  await CacheHelper(sessionID,msisdn,"Petronas_Option3","");
  await CacheHelper(sessionID,msisdn,"Petronas_Option4","");
  await CacheHelper(sessionID,msisdn,"Petronas_Option5","");

  if (isBM)
    return UTIL.ComposeResult("", "Petronas_Bm_CustomerType");
  else
    return UTIL.ComposeResult("", "Petronas_En_CustomerType");
};

exports.Petronas_En_CustomerType_Existing_Wh = async function(event, isBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let inputDesc = UTIL.GetParameterValue(event, "inputDesc");

  await CacheHelper(sessionID,msisdn,"Petronas_Option3",inputDesc);

  if (isBM) return UTIL.ComposeResult("", "Petronas_Bm_Plan");
  else return UTIL.ComposeResult("", "Petronas_En_Plan");
};

exports.Petronas_En_CustomerType_New_Wh = async function(event, isBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let inputDesc = UTIL.GetParameterValue(event, "inputDesc");

  await CacheHelper(sessionID,msisdn,"Petronas_Option3",inputDesc);

  if (isBM) return UTIL.ComposeResult("", "Petronas_Bm_Plan");
  else return UTIL.ComposeResult("", "Petronas_En_Plan");
};

exports.Petronas_En_Plan_FibreBundle_Wh = async function(event, isBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let inputDesc = UTIL.GetParameterValue(event, "inputDesc");
  await CacheHelper(sessionID,msisdn,"Petronas_Option4",inputDesc);

  if (isBM) return UTIL.ComposeResult("", "Petronas_Bm_PlanFibre");
  else return UTIL.ComposeResult("", "Petronas_En_PlanFibre");
};

exports.Petronas_En_Plan_WiFiBundle_Wh = async function(event,isBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let inputDesc = UTIL.GetParameterValue(event, "inputDesc");

  await CacheHelper(sessionID, msisdn,"Petronas_Option4",inputDesc);

  if (isBM) return UTIL.ComposeResult("", "Petronas_Bm_CustomerDetails_Wh");
  else return UTIL.ComposeResult("", "Petronas_En_CustomerDetails_Wh");
};

exports.Petronas_En_PlanFibre_100_Wh = async function(event,isBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let inputDesc = UTIL.GetParameterValue(event, "inputDesc");

  await CacheHelper(sessionID, msisdn,"Petronas_Option5",inputDesc);

  if (isBM) return UTIL.ComposeResult("", "Petronas_Bm_CustomerDetails_Wh");
  else return UTIL.ComposeResult("", "Petronas_En_CustomerDetails_Wh");
};

exports.Petronas_En_CustomerDetails_Wh = async function(event, isBM=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let fullName = UTIL.GetParameterValue(event,"fullName");
  let emailAddr = UTIL.GetParameterValue(event,"emailAddr");
  let mobileNo = UTIL.GetParameterValue(event,"mobileNo");
  let homePostcode = UTIL.GetParameterValue(event,"homePostcode");
  let otherMobileNo = UTIL.GetParameterValue(event,"otherMobileNo");
  let agentStartDay = UTIL.GetParameterValue(event,"agentStartDay");
  let agentEndDay = UTIL.GetParameterValue(event,"agentEndDay");
  let agentStartTime = UTIL.GetParameterValue(event,"agentStartTime");
  let agentEndTime = UTIL.GetParameterValue(event,"agentEndTime");
  let shortStartTime = UTIL.GetParameterValue(event,"shortStartTime");
  let shortEndTime = UTIL.GetParameterValue(event,"shortEndTime");
  let onlineMessage = UTIL.GetParameterValue(event,"onlineMessage");
  let offlineMessage = UTIL.GetParameterValue(event,"offlineMessage");
  let param = "";

  let Cache = await SESSION.GetCache(sessionID);
  let option4 = Cache["Petronas_Option4"];
  let option5 = Cache["Petronas_Option5"];

  // check for Close Intervention----------------------------------------------------------------------------
  let closeIntervention=UTIL.GetParameterValue(event,"closeIntervention");
  closeIntervention=closeIntervention == undefined || closeIntervention == "" ? "FALSE" : closeIntervention; //default is FALSE

  let notes = `Maxis Offer:${option4}\nMaxis Bundle:${option5}\nFull Name:${fullName}\nWork Email Address:${emailAddr}\nMobile Mumber:${mobileNo}\nHome Postcode:${homePostcode}\nAlternate Contact Number:${otherMobileNo}`;

  let result = await createLead(sessionID, msisdn,notes);

  let returnEvent = isBM ? "Petronas_Bm_Closing" : "Petronas_En_Closing"; //👈 "Success" is default

  if (result == "Duplicate") {
    returnEvent = isBM ? "Petronas_Bm_Closing_Duplicate" : "Petronas_En_Closing_Duplicate";
  }

  if (result == "General") returnEvent = "Shared_Tech_IssueServicing";


  if ( UTIL.IsAgentOnline2(agentStartDay, agentEndDay, agentStartTime, agentEndTime, shortStartTime, shortEndTime)) {
    param = onlineMessage;
  } else {
    param = offlineMessage;
  }


  if (closeIntervention.toUpperCase() == "TRUE" && result=="Success") {
    //Once Ring-Central "Close" api is called. You can no longer reply text to this tread id. Therefore, no bye bye message is sent.
    await SESSION.SetClose(sessionID, true);
  }

  //TEST TIME OUT
  // const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  // await delay(4000);/// waiting 1 second.

  return UTIL.ComposeResult("", returnEvent,{message: param});
};