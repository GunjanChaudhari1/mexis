const UTIL = require("./Util")
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

async function getBills(msisdn) {
  // let url  = 'http://api-digital-uat2.isddc.men.maxis.com.my/billing/api/v4.0/bills/statements';
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/statements`;
  let head = {"headers": {"Content-Type":"application/json", "msisdn":msisdn, "maxis_channel_type":"MAXBOT", "languageid":"en-US", "uuid":"dcd5b0ae-7266-443d-a7e0-12f2776cdc4e"}};

  let data = await UTIL.GetUrl(url,head);
  data = data.responseData;

  let all = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  data.forEach(function(item){
    let date = new Date(item.billCloseDate);
    let key = monthNames[date.getMonth()] + " " + date.getFullYear();
    all.push({"key" : key, "value" : item.billNumber});
  })

  return all;
}

// ✋also used in UserStory_CheckAccountDetails
async function getAccounts(msisdn) {
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/accounts?checkfssp=true&checkroaming=true`;
  let head = {"headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT"}};

  let data = await UTIL.GetUrl(url,head);
  data = data.responseData;
  return data;
}

async function getCase(msisdn) {
  let result = false;

  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/billprint?conditionType=OPEN&numMonth=3`;
  let head = {
    "headers": {"msisdn":msisdn, "channel":"MAXBOT", "languagecode":"en-US"},
  };

  let data = await UTIL.GetUrl(url,head);

  try {
    result = data.responseData.caseList.length > 0 ? true : false;
  } catch (err) {
    console.log("ERROR 🔻"); console.log(err);
    result = false;
  }

  return result;
}

async function createCase(msisdn, description) {
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`;
  let head = {
    "headers": {"content-type":"application/json","channel":"MAXBOT","uuid":"SS", "msisdn" : msisdn},
    "method" : "POST",
    "body": JSON.stringify( {
      "idType"     : "MSISDN",
      "idValue"    : msisdn,
      "msisdn"     : msisdn,
      "caseType1"  : "Enquiry_Request-Billing",
      "caseType2"  : "Bill Print",
      "caseType3"  : "To Print and Deliver",
      "description": description,
      "isUpdateCBR" : "false"
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

//------------------------------------------------------------------------------------------------
async function checkSubscription(msisdn) {
  let result = false;

  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/methods`;
  let head = {
    "headers": {"content-type":"application/json","msisdn":msisdn,"maxis_channel_type":"MAXBOT","languageid" : "en-US"}
  };

  let data = await UTIL.GetUrl(url,head);

  try {
    result = data.responseData.preferMethod == "postalAddress" ? true : false;
  } catch {
    result = false;
  }

  return result;
}

async function getBillLink(billNumber, msisdn){
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v3.0/bills/statements/${billNumber}/url`;
  let head = {
    "headers": {"content-type":"application/json","msisdn":msisdn,"maxis_channel_type":"MAXBOT","languageid" : "en-US"}
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

exports.BillStatementRequest = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);

  //------------------------------------------------------------------------------
  // 🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  console.log("msisdn***************", msisdn);
  
  let followUpEvent = undefined;
  let Cache = await SESSION.GetCache(sessionID)

  console.log("******BillStatementRequest******", JSON.stringify(Cache));
  if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
    // return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }
  let accData = '';

  if (Cache.customerData.responseData == null) {
     console.log('***Cache.getCustomerforNRICPassport****', Cache.getCustomerforNRICPassport);
    accData = Cache.getCustomerforNRICPassport.responseData;
    // msisdn = accData.accounts[0].msisdns[0].serviceId;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      console.log("if for get nirc and passport", accData.accounts[0].msisdns[0].serviceId);
      msisdn = serviceId[0].serviceId;
    } else {
      console.log("else for get nirc and passport", accData.accounts[0].msisdns[0].serviceId);
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
    console.log('New MSISDN >> ', msisdn);
  } else {
  // else get
  console.log("for get nirc and passport???");
    accData = Cache.customerData.responseData;
  }
console.log("final>>>", msisdn);
let isCase = await getCase(msisdn);
  if (isCase) {
    followUpEvent = "Billing_BillStatementRequest_ExistingCase";
  } else {
    // ✋ postalAddress (paperbill) = true or false
    let isSubscribe = await checkSubscription(msisdn);

    // 👇when postalAddress (paperbill)
    if (isSubscribe == true) {
      followUpEvent = "Billing_BillStatementRequest_QueryEBill";
    } else { // 👇when non-postalAddress (email)
      try {
        // let Cache = await SESSION.GetCache(sessionID)
        console.log("works***********881");
        accData = Cache['userBillAccountData']  //await getAccounts(msisdn);//Cache['userBillAccountData']// 
        let billItemised;
        if (accData.bundledAddOnGroups !== null) {
          billItemised = accData.bundledAddOnGroups[0].bundledAddOns.filter(e=>e.name=="Bill Itemised")[0].isSelected;
        } else {
           billItemised =false
        }

        let arrBill =  Cache['userBillData'] //await getBills(msisdn);//Cache['userBillData']//
        console.log("works***********8812");
        let menu = UTIL.GetNumberedMenu(arrBill.map(e=>e.key));

        // let Cache = await SESSION.GetCache(sessionID);

        Cache["BillArray"] = arrBill
        Cache["BillItemised"] = billItemised

        await SESSION.SetCache(sessionID, Cache);

        if (billItemised == true) {
          return UTIL.ComposeResult("","Billing_BillStatementRequest_Itemised_ListMonth",{"billSelection":menu});
        } else {
          if(accData.bundledAddOnGroups !== null){
            return UTIL.ComposeResult("","Billing_BillStatementRequest_Summarised_ListMonth",{"billSelection":menu});  
          } else {
            return UTIL.ComposeResult("","Billing_BillStatementRequest_ServiceNotAvailable");
          }
          
        }
      } catch (err) {
        console.log("Bill Statement Request Error 🔻");
        console.log(err);
        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
      }
    }
  }

  return UTIL.ComposeResult("",followUpEvent);
}

exports.QueryEBill_QueryMonth = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let statementMonth = UTIL.GetParameterValue(event,"paperBillMonth");
  statementMonth = statementMonth.replace(" ","-");

  // let year  = UTIL.GetParameterValue(event,"paperBillYear");

  let cache = await SESSION.GetCache(sessionID);
  let billItemised = cache.BillItemised;

  let itemizedBill = undefined;
  let statementRequest = undefined;

  if (billItemised) {
    itemizedBill = "Yes";
    statementRequest = "Bill Statement";
  } else {
    itemizedBill = "No";
    statementRequest = "Bill Summary";
  }

  let desc = `Notes from Chatbot WA MSISDN: ${msisdn}, Itemized Bill Subscription: ${itemizedBill}, Statement Request: ${statementRequest}, Statement Month: ${statementMonth}, Delivery Method: Normal Mail, DF Intent Name: Billing.BillStatementRequest.QueryEBill.QueryMonth`;

  let caseResult = await createCase(msisdn,desc);

  if ("caseId" in caseResult) {
    let Cache = await SESSION.GetCache(sessionID);
    Cache["LastCaseId"] = caseResult.caseId;
    await SESSION.SetCache(sessionID, Cache);
  }

  return UTIL.ComposeResult("","Billing_BillStatementRequest_QueryEBill_CaseCreation");
}

exports.Itemised_QueryMonth = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let billNumber = UTIL.GetParameterValue(event, "billNumber");
  let cache = await SESSION.GetCache(sessionID);

  let arrBill = cache.BillArray;
   console.log("bill array from cache>>>>>> 👇");
   console.log(arrBill);

   console.log("bill array VALUE from cache>>>2 👇");
   console.log(arrBill[billNumber-1].value);

  let link = await getBillLink(arrBill[billNumber-1].value,msisdn);
   console.log("link payload 👇");
   console.log(link);

  if (link == undefined || link == "") {
    return UTIL.ComposeResult("","Billing_BillStatementRequest_Itemised_BillNA");
  } else {
    return UTIL.ComposeResult("","Billing_BillStatementRequest_Itemised_BillURL", {"billURL": link});
  }
}

exports.Itemised_QtherMonth = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let month = UTIL.GetParameterValue(event,"paperBillMonth");
  let year = UTIL.GetParameterValue(event,"paperBillYear");

  let cache = await SESSION.GetCache(sessionID);
  let billItemised = cache.BillItemised;

  let itemizedBill = undefined;
  let statementRequest = undefined;

  if (billItemised) {
    itemizedBill = "Yes";
    statementRequest = "Bill Statement";
  } else {
    itemizedBill = "No";
    statementRequest = "Bill Summary";
  }

  let desc = `Notes from Chatbot WA MSISDN: ${msisdn}, Itemized Bill Subscription: ${itemizedBill}, Statement Request: ${statementRequest}, Statement Month: ${month}-${year}, Delivery Method: Normal Mail, DF Intent Name: Billing.BillStatementRequest.QueryEBill.QueryMonth`;

  let caseResult = await createCase(msisdn,desc);

  if ("caseId" in caseResult) {
    let Cache = await SESSION.GetCache(sessionID);
    Cache["LastCaseId"] = caseResult.caseId;
    await SESSION.SetCache(sessionID, Cache);
  }

  return UTIL.ComposeResult("","Billing_BillStatementRequest_QueryEBill_CaseCreation");
}

exports.Summary_QueryMonth = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let billNumber = UTIL.GetParameterValue(event, "billNumber");
  let cache = await SESSION.GetCache(sessionID);

  if (cache.customerData.responseData == null) {
    const accData = cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
    msisdn = serviceId[0].serviceId;
    } else {
    msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }

  let arrBill = cache.BillArray;
  console.log("bill array from cache<<<<<1 👇");
   console.log(arrBill);

   console.log("bill array VALUE from cache 👇");
   console.log(arrBill[billNumber-1].value);

  let link = await getBillLink(arrBill[billNumber-1].value,msisdn);
  // console.log("link payload 👇");
  // console.log(link);

  if (link == undefined || link == "") {
    return UTIL.ComposeResult("","Billing_BillStatementRequest_Summarised_BillNA");
  } else {
    return UTIL.ComposeResult("","Billing_BillStatementRequest_Summarised_BillURL", {"billURL": link});
  }
}

exports.Summary_OtherMonth = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let month = UTIL.GetParameterValue(event,"paperBillMonth");
  // let year  = UTIL.GetParameterValue(event,"paperBillYear");z

  let cache = await SESSION.GetCache(sessionID);

  if (cache.customerData.responseData == null) {
    const accData = cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
    msisdn = serviceId[0].serviceId;
    } else {
    msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }

  let billItemised = cache.BillItemised;

  let itemizedBill = undefined;
  let statementRequest = undefined;

  if (billItemised) {
    itemizedBill = "Yes";
    statementRequest = "Bill Statement";
  } else {
    itemizedBill = "No";
    statementRequest = "Bill Summary";
  }

  let desc = `Notes from Chatbot WA MSISDN: ${msisdn}, Itemized Bill Subscription: ${itemizedBill}, Statement Request: ${statementRequest}, Statement Month: ${month}, Delivery Method: Normal Mail, DF Intent Name: Billing.BillStatementRequest.QueryEBill.QueryMonth`;

  let caseResult = await createCase(msisdn,desc);

  if ("caseId" in caseResult) {
    let Cache = await SESSION.GetCache(sessionID);
    Cache["LastCaseId"] = caseResult.caseId;
    await SESSION.SetCache(sessionID, Cache);
  }

  return UTIL.ComposeResult("","Billing_BillStatementRequest_Summarised_CaseCreation");
}

exports.OtherBill = function(event) {
  return UTIL.ComposeResult("","Billing_BillStatementRequest_Itemised_OtherBill");
}