const FormData = require('form-data');
const fs = require('fs');
const path = require("path");
const SESSION = require("./Handler_Session")
const UTIL = require("./Util")
const HOST = require("./Handler_Host");
const RC = require("./Handler_RingCentral");

const FETCH = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

//--------------------------------------------------------------------------
// API to check for open case status
async function OpencaseStatus(sessionID, msisdn) {
  let CaseType = await SESSION.GetCaseType(sessionID);
  console.log("CaseType", CaseType);

  if ((CaseType == undefined || Object.keys(CaseType).length == 0) && msisdn != undefined && msisdn != null && msisdn != "") {
    console.log("if true locate payment");

    let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case?searchText=Complaint-Payment_Not Credited in Account-To Locate&status=In Progress&dateRange=1w`;
    let head = {
      headers: { "Content-Type": "application/json", "msisdn": msisdn, "channel": "MAXBOT" },
      method: "GET"
    };
    console.log("url", url);
    try {
      let data = await UTIL.GetUrl(url, head);
      if (data.status == "success") {
        console.log("🟢 logging opencase API response", data)
        CaseType = data.responseData
        console.log("return", CaseType);
        return CaseType;
      }
    } catch (err) {
      console.log("Open case status Info Error 🔻");
      console.log(err);
    }
  }
}

exports.Payment_LocatePayment = async function (event) {
  let followupevent = "";
  const sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  const Cache = await SESSION.GetCache(sessionID);

  if (Cache.customerData.responseData == null) {
    let accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }

  // calls the API to check for open case status
  let CaseInfo = await OpencaseStatus(sessionID, msisdn);
  console.log(CaseInfo.caseList.length, "length");
  if (CaseInfo.caseList.length > 0) {
    console.log("if");
    followupevent = "Billing_AccountStatus_LocatePaymentReceipt_ExistingCaseOpen";
    return UTIL.ComposeResult("", followupevent, { "caseId": CaseInfo.caseList[0].caseId });
  } else {
    console.log("else");
    // let Cache = await SESSION.GetCache(sessionID);
    Cache['enableLocateFlag'] = true;
    await SESSION.SetCache(sessionID, Cache);
    followupevent = "Billing_AccountStatus_LocatePayment_QueryReceipt";
    await SESSION.SetLastEvent(sessionID, { "event": followupevent, "param": {} });
    return UTIL.ComposeResult("", followupevent);
  }
};

// -------------------------------- create case for locate payment-------------------------
async function createCase(body) {
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`;
  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "channel": "MAXBOT", "uuid": null }
  };
  try {
    let data = await UTIL.GetUrl(url, head);
    console.log("ðŸŸ¢ logging case creation response", data)
    return data.responseData;
  } catch (error) {
    console.log("ðŸ”» ERROR: CASE CREATION FOR LOCATE RECEIPT")
    console.log(err);
  }
}

// if the user sends the attachment.. it triggers the following function
exports.Attachment_Check = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let LastEvent = await SESSION.GetLastEvent(sessionID);
  const Cache = await SESSION.GetCache(sessionID);
  LastEvent = LastEvent.event;
  console.log("Logging Last Event Name", LastEvent);

  //For Naked Fibre Number
  if (Cache.customerData.responseData == null) {
    const accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }

  if (LastEvent == "Billing_AccountStatus_LocatePayment_QueryReceipt" ||
    LastEvent == "Billing_AccountStatus_LocatePayment_OpenCase_No_WithAttachment_Sizecheck" ||
    LastEvent == "Shared_InvalidInput_NonNumericInput" || LastEvent == "Manage_account_maxis" ||
    LastEvent == "BillingAccountStatusLocatePaymentQueryReceipt.BillingAccountStatusLocatePaymentQueryReceipt-fallback") {
    let intent = "Billing.AccountStatus.LocatePayment.QueryReceipt"
    return new Promise((resolve) => {
      const delay = (milliseconds) => new Promise((resolves) => {
        setTimeout(resolves, milliseconds)
      })
      // need to return fro the promise itself mah
      delay(1500)
        .then(async () => SESSION.GetCache(sessionID))
        .then(async (cache) => {
          console.log('ðŸ› This is the cache -> ', cache)
          let locatePaymentFile = cache.LocatePayment[0];
          console.log('ðŸ“ This is the locate payment file -> ', locatePaymentFile)
          cache['enableLocateFlag'] = false;
          await SESSION.SetCache(sessionID, cache);
          console.log("Logging cache locatepayment attachment details", locatePaymentFile["filename"], locatePaymentFile["size"], locatePaymentFile["url"])
          let filename = locatePaymentFile["filename"];
          let checkCaseCreated = cache.LocatePayment.filter((payment) => payment['caseCreated'] === true)
          console.log('ðŸ› Case created ', checkCaseCreated)
          if (!checkCaseCreated[0]) {
            if (filename.match("[^\\s]+(.*?)\\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$")) {
              if (locatePaymentFile["size"] <= 2000000) {
                let body = {
                  "idType": "MSISDN",
                  "idValue": msisdn,
                  "msisdn": msisdn,
                  "caseType1": "Complaint-Payment",
                  "caseType2": "Not Credited in Account-To Locate",
                  "caseType3": "BOT Escalation",
                  "description": `WA MSISDN: ${msisdn}, Payment Receipt Attached: Yes, DF Intent Name: ${intent}`,
                  "isUpdateCBR": false
                };
                console.log("Body **", JSON.stringify(body));
                let caseResult = await createCase(body);
                console.log("caseResult result", caseResult);
                console.log("caseId" in caseResult);
                if ("caseId" in caseResult) {
                  console.log('Before LocatePayment ', cache.LocatePayment)
                  cache.LocatePayment.pop();
                  cache.LocatePayment.push({...locatePaymentFile, "caseCreated": true})
                  console.log('Case created, update the key in locatePayment child -> ', cache.LocatePayment)
                  await SESSION.SetCache(sessionID, cache);
                  followupevent = "LocatePayment_AddAttachment";
                  resolve(UTIL.ComposeResult("", followupevent, { "CaseID": caseResult.caseId, "Filename": filename }));
                }
              } else {
                followupevent = "Billing_AccountStatus_LocatePayment_OpenCase_No_WithAttachment_Sizecheck";
                resolve(UTIL.ComposeResult("", followupevent));
              }
            } else {
              followupevent = "Shared_InvalidInput_NonNumericInput";
              resolve(UTIL.ComposeResult("", followupevent));
            }
          } else {
            console.log('ðŸ› Found case created in the locatePayment array', cache.LocatePayment);
          }
        }).catch((e) => {
          console.log('This is the error --->', e);
        });
    });
  } else {
    console.log("last event not match", "Shared.Error_InvalidArgument");
    return UTIL.ComposeResult("", "Shared_Error_InvalidArgument");
  };
};

const addAttachmentLocatePaymentCall = async (msisdn, sessionID, filename, caseId, fetchUrl) => {
  try {
    let apiId = HOST.TARGET == 0 ? "nx5rbzdio4" : "avezebzouc";
    let apiky = HOST.TARGET == 0 ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin" : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
    let url = HOST.TARGET == 0 ? "https://maxbot-uat.maxis.com.my/dev/MaxisCallback" : "https://maxbot.maxis.com.my/prod/diagnostic";

    let head = {
      headers: { "x-apigw-api-id": apiId, "x-api-key": apiky },
      method: "POST",
      body: JSON.stringify({
        msisdn,
        sessionID,
        filename,
        caseId,
        fetchUrl,
        addAttachmentLocatePayment: "addAttachmentLocatePayment",
      }),
    };

    let data = await UTIL.GetUrl(url, head);
    return data;
  } catch (err) {
    console.log("Maxis callback failed --- > ", err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
};

exports.Addattachment = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let cache = await SESSION.GetCache(sessionID);
  let caseId = UTIL.GetParameterValue(event, "CaseID");
  let filename = UTIL.GetParameterValue(event, "Filename");

  //For Naked Fibre Number
  if (cache.customerData.responseData == null) {
    const accData = cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }

  const validAttachment = cache.LocatePayment.filter((payment) => payment['caseCreated'] === true)
  console.log('📁Case Id => ', caseId)
  console.log('📁filename => ', filename)
  if (validAttachment[0]) {
    const fetchUrl = validAttachment[0].url;
    console.log('🚗 FETCHURL - > ', fetchUrl);
    console.log("💚 attaching image case before ->");
    await addAttachmentLocatePaymentCall(msisdn, sessionID, filename, caseId, fetchUrl);
    console.log("💖 attaching image case after ->");
    return UTIL.ComposeResult("", "LocatePayment_AddAttachment_Inprogress");
  } else {
    console.log("success else");
    followupevent = "Shared_Tech_IssueServicing";
    return UTIL.ComposeResult("", followupevent);
  }
};

//----------------------------------------------------------------------------
/**
 *  creating a case along with attachment
 * @param {String} path image path where we have attched
 * @param {String} caseId case id come with api
 * @param {Sting} imageName image name extract in image url
 */
async function CaseAttachment(caseId, imageName) {
  /*
    await FETCH(cache.LocatePayment.url).then((response) => {
      response.body.pipe(file)
    });
 */

  var formdata = new FormData();
  formdata.append("attachmentTitle", "MyTitle");
  formdata.append("attachmentDescription", "MyDescription");
  formdata.append('file', fs.createReadStream(`/tmp/${imageName}`));

  var requestOptions = {
    method: 'POST',
    headers: { "channel": "MAXBOT", "languageid": "en-US" },
    body: formdata,
    redirect: 'follow'
  };

  let fetchData = await FETCH(`${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/${caseId}/attachment`, requestOptions);
  let getResponse = await fetchData.text();
  console.log('getResponse', getResponse);
  return getResponse;
}
