const UTIL = require("./Util")
const HOST = require("./Handler_Host");
const SESSION = require("./Handler_Session");

async function setBillEmail(msisdn, emailAddress) {
  console.log("MSISDN>>>>>>>>>>",msisdn,'Email:>>', emailAddress);
  //API TEST: Sheet 15
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/methods/prefer`;
  let head = {
    "method": "PUT",
    "headers": {
      "Content-Type": "application/json", "msisdn": msisdn, "maxis_channel_type": "MAXBOT", "languageid": "en-US", "uuid": "dcd5b0ae-7266-443d-a7e0-12f2776cdc4e"
    },
    "body": JSON.stringify({
      "type": "email",
      "email": emailAddress
    })
  };

  let data = await UTIL.GetUrl(url, head);
  return data.status;
}

async function getBillMethod(msisdn) {
  let result = false;

  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/methods`;
  let head = {
    "headers": { "content-type": "application/json", "msisdn": msisdn, "maxis_channel_type": "MAXBOT", "languageid": "en-US" }
  };

  let data = await UTIL.GetUrl(url, head);
  return data.responseData;

}

async function getEBill_URL_HSSP(msisdn, languageId) {

  let url = `${HOST.OPT_E_BILL_URL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/oi?msisdn=${msisdn}`;
  console.log("languageid", languageId);

  let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
  let data = await UTIL.GetUrl(url, head);
  data = data.responseData;

  return data

}
async function getEBill_url_MSSP(msisdn, accountNo, languageId) {

  let url = `${HOST.OPT_E_BILL_URL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/oi?msisdn=${msisdn}&accountNumber=${accountNo}`;
  console.log("languageid", languageId);

  let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
  let data = await UTIL.GetUrl(url, head);
  data = data.responseData;
  return data

}
exports.eBill = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  //------------------------------------------------------------------------------
  //🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  Cache = await SESSION.GetCache(sessionID);

  let accData = '';
  if (Cache.customerData.responseData == null) {
    accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }


  try {
    const bilData = await getBillMethod(msisdn);
    let followUpEvent;
    let email = '';

    // if (bilData.preferMethod == "postalAddress") {
    //   followUpEvent = "Biling_eBill_NotRegistered";
    // }

    if (bilData.preferMethod == "email") {
      followUpEvent = "Biling_eBill_Registered";
      email = bilData.emailAddress;
    } else {
      followUpEvent = "Biling_eBill_NotRegistered";
    }

    if(followUpEvent){
      return UTIL.ComposeResult("", followUpEvent, { "email": email });
    } else {
      return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }

  }
  catch
  {
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }



}

exports.NotRegistered_EmailQuery = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let email = UTIL.GetParameterValue(event, "email");
  let CustomerType = await SESSION.GetCustomerType(sessionID);
  let Cache = await SESSION.GetCache(sessionID)
  let languageId = Cache.Language == 1 ? "ms-MY" : "en-US";
  let accountNo = '';
  if (Cache.customerData.responseData == null) {
    console.log('***Cache.getCustomerforNRICPassport****', Cache.getCustomerforNRICPassport);
    const accData = Cache.getCustomerforNRICPassport.responseData;
    accountNo = accData.accounts[0].accountNo;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
    console.log("NF MSISDN >> ", msisdn);
  } else {
    accountNo = Cache['customerData']['responseData']['accounts'][0]['accountNo']
  }
  console.log("AccNo", accountNo);
  let subType = ""
  let urlMessage = ""

  subType = await CustomerType.subType;
  console.log("Subtype", subType, "type", typeof subType)
  let url = ""
  if (subType == "Maxis Individual") {
    try {
      url = await getEBill_url_MSSP(msisdn, accountNo, languageId)
    } catch {
      url = "https://care.maxis.com.my/en/auth"
    }

    urlMessage = "You may also view and update your eBill email at the Maxis Care portal, just click the link"

  } else if (subType == "Hotlink Individual") {
    try {
      url = await getEBill_URL_HSSP(msisdn, languageId)
    } catch {
      url = "https://selfserve.hotlink.com.my/en/auth"
    }

    urlMessage = "You may also view and update your eBill email at the Hotlink Self  Serve portal, just click the link"
  }


  await setBillEmail(msisdn, email)
  return UTIL.ComposeResult("", "ebill_verification_email_sent", { "email": email, "url": url, "urlMessage": urlMessage });
}

exports.Verification_Resend = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let email = UTIL.GetParameterValue(event, "email");
  const Cache = await SESSION.GetCache(sessionID)
  let languageId = Cache.Language == 1 ? "ms-MY" : "en-US";
  console.log("Cache", JSON.stringify(Cache));
  let CustomerType = await SESSION.GetCustomerType(sessionID);
  let accountNo = '';
  if (Cache.customerData.responseData == null) {
    console.log('***Cache.getCustomerforNRICPassport****', Cache.getCustomerforNRICPassport);
    const accData = Cache.getCustomerforNRICPassport.responseData;
    accountNo = accData.accounts[0].accountNo;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
    console.log("NF MSISDN >> ", msisdn);
  } else {
    accountNo = Cache['customerData']['responseData']['accounts'][0]['accountNo']
  }
  console.log("AccNo", accountNo);
  console.log("AccNo", accountNo);
  let subType = ""
  let urlMessage = ""

  subType = await CustomerType.subType;
  console.log("Subtype", subType, "type", typeof subType)
  let url = ""

  if (subType == "Maxis Individual") {
    try {
      url = await getEBill_url_MSSP(msisdn, accountNo, languageId)
    } catch {
      url = "https://care.maxis.com.my/en/auth"
    }

    urlMessage = "You may also view and update your eBill email at the Maxis Care portal, just click the link"

  } else if (subType == "Hotlink Individual") {
    try {
      url = await getEBill_URL_HSSP(msisdn, languageId)
    } catch {
      url = "https://selfserve.hotlink.com.my/en/auth"
    }

    urlMessage = "You may also view and update your eBill email at the Hotlink Self  Serve portal, just click the link"
  }
  url=url.trim()
  urlMessage=urlMessage.trim()
  let returnParam = { "email": email, "url": `${url}`, "urlMessage": `${urlMessage}` };


  await setBillEmail(msisdn, email);
  return UTIL.ComposeResult("", "email_resent", returnParam);
}

exports.Registered_NewEmail = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  const email = UTIL.GetParameterValue(event, "newEmail");
  let Cache = await SESSION.GetCache(sessionID)
  let languageId = Cache.Language == 1 ? "ms-MY" : "en-US";
  console.log("Cache", JSON.stringify(Cache));
  //------------------------------------------------------------------------------
  //🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event, msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
  //-------------------------------------------------------------------------------
  Cache = await SESSION.GetCache(sessionID)
  msisdn = await SESSION.GetMSISDN(sessionID);
  const CustomerType = await SESSION.GetCustomerType(sessionID);
  let accountNo ='';
  if(Cache["customerData"]["responseData"]===null) {
    if(Cache["getCustomerforNRICPassport"]!=undefined){
      accountNo = Cache["getCustomerforNRICPassport"]["responseData"]["accounts"][0]["accountNo"]
    } else {
     console.log("else condition>>>>>>>>>>>>>>>.>>");
    }
  } else {
     accountNo = Cache["customerData"]["responseData"]["accounts"][0]["accountNo"]
  }
  
  console.log("AccNo", accountNo);
  let subType = ""
  let urlMessage = ""
  
  if (Cache.customerData.responseData == null) {
    const accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }
  
  subType = await CustomerType.subType;
  console.log("Subtype", subType, "type", typeof subType)
  let url = ""
  if (subType == "Maxis Individual") {
    try {
      url = await getEBill_url_MSSP(msisdn, accountNo, languageId)
    } catch {
      url = "https://care.maxis.com.my/en/auth"
    }

    urlMessage = "You may also view and update your eBill email at the Maxis Care portal, just click the link"

  } else if (subType == "Hotlink Individual") {
    try {
      url = await getEBill_URL_HSSP(msisdn, languageId)
    } catch {
      url = "https://selfserve.hotlink.com.my/en/auth"
    }

    urlMessage = "You may also view and update your eBill email at the Hotlink Self  Serve portal, just click the link"
  }
  url=url.trim()
  urlMessage=urlMessage.trim()
  let returnParam = { "email": email, "url": `${url}`, "urlMessage": `${urlMessage}` };
  await setBillEmail(msisdn, email);

  return UTIL.ComposeResult("", "update_ebilling_email_sent", returnParam);
}



