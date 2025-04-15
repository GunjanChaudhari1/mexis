const UTIL = require("./Util")
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

async function getCreditLimit(msisdn) {
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/creditlimit?conditionType=OPEN&numMonth=2`;
  let head = {"headers": {"msisdn": msisdn, "channel": "MAXBOT", "languageid": "en-US"}};

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getBills(msisdn) {
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills`;
  let head = {"headers": {"Content-Type": "application/json", "msisdn": msisdn, "maxis_channel_type": "MAXBOT", "languageid": 1}};

  let data = await UTIL.GetUrl(url,head);
  data = data.responseData;
  return data;
}

async function createCase(msisdn,body) {
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`;

  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {"Content-Type": "application/json", "msisdn": msisdn, "channel": "MAXBOT", "uuid": "SS"}
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

exports.ChangeCreditLimit = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  // 🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  // let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  // if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  const Cache = await SESSION.GetCache(sessionID);

  // console.log("******ChangeCreditLimit******", JSON.stringify(Cache));
  // if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
  //         //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
  //         return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  // }
  msisdn = await SESSION.GetMSISDN(sessionID);

  if (Cache.customerData.responseData == null) {
    const accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }

  let data = await getCreditLimit(msisdn);
  let followUpEvent ="Billing_ChangeCreditLimit_CurrentCreditLimit_ExistingCase";
  let returnParam = {};

  try {
    // 👇 when there's a case id
    if (data != null && "caseId" in data.caseCreditLimit) {
      let caseId = data.caseCreditLimit.caseId;

      if (caseId != "") {
        followUpEvent ="change_credit_limit_existingCase";
      }
    } else { // 👇 when there's no case id
      let dataBill = await getBills(msisdn);
      returnParam["currentCreditLimit"] = dataBill.billCreditLimit;
      followUpEvent = "Billing_ChangeCreditLimit_CurrentCreditLimit";
    }
  } catch (err) {
    console.log("🔻 ERROR: Change Credit Limit");
    console.log(err);
    followUpEvent = "Shared_Tech_IssueServicing";
  }
  return UTIL.ComposeResult("",followUpEvent, returnParam);
}

exports.Confirmation = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let newCreditLimit = UTIL.GetParameterValue(event,"newCL");
  let reason = UTIL.GetParameterValue(event,"reason");
  const Cache = await SESSION.GetCache(sessionID);

  let caller = UTIL.GetIntentDisplayName(event)
  let increaseDecrease = caller == "Billing.ChangeCreditLimit.DecreaseCreditLimit.Confirmation.Yes" ? "Decrease Credit Limit" : "Increase Credit Limit";

  let followupEvent = "";

  // 👇current credit limit
  if (Cache.customerData.responseData == null) {
    const accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }
  let data = await getBills(msisdn);
  let currentCreditLimit = data.billCreditLimit;

  let body = {
    "idType": "MSISDN",
    "idValue": msisdn,
    "msisdn": msisdn,
    "caseType1": "Enquiry_Request-Account Related",
    "caseType2": "Credit Limit",
    "caseType3": "Credit Limit Request",
    "description": `Reason: ${reason}, WA MSISDN: ${msisdn}, Request Type: ${increaseDecrease}, Current Credit Limit: RM${UTIL.ToCurrency(currentCreditLimit)}, New Credit Limit: RM${UTIL.ToCurrency(newCreditLimit)}, Intent Name: Billing.ChangeCreditLimit.CurrentCreditLimit.Confirmation.Yes`,
    "isUpdateCBR": "false",
  };

  console.log("Body of Change Credit Limit Case 👇");
  console.log(body);

  try {
    let caseResult = await createCase(msisdn,body);
    if ("caseId" in caseResult) {
      let Cache1 = await SESSION.GetCache(sessionID);
      Cache1["LastCaseId"] = caseResult.caseId;
      await SESSION.SetCache(sessionID, Cache1);
    }
    followupEvent ="change_credit_limit_case_creation";
  } catch (err) {
    followupEvent ="Shared_Tech_IssueServicing";
  }

  return UTIL.ComposeResult("",followupEvent);
}

exports.Confirmation2 = async function (event, returnEvent) {
  let newCreditLimit = UTIL.GetParameterValue(event,"newCL");
  let reason = UTIL.GetParameterValue(event,"reason");

  return UTIL.ComposeResult("",returnEvent, {"newCL": newCreditLimit, "reason": reason});
};
