const UTIL = require("./Util");
const HOST = require("./Handler_Host");
const SESSION = require("./Handler_Session");

async function setBill(msisdn, body) {
  //Sheet9
  let result = false;

  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/methods`;
  let head = {
    "method" : "PUT",
    "headers": {
      "content-type":"application/json","msisdn":msisdn,"maxis_channel_type":"MAXBOT","languageid" : "en-US"
    },
    "body" : JSON.stringify(body)     
  };

  let data   = await UTIL.GetUrl(url,head);
  return data;
}

async function getBillMethod(msisdn) {
  //Sheet9
  
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/methods`;
  let head = {
    "headers": {"content-type":"application/json","msisdn":msisdn,"maxis_channel_type":"MAXBOT","languageid" : "en-US"}     
  };

  let data   = await UTIL.GetUrl(url,head);
  return data.responseData;

}

exports.BillingAddress =  async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  //🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  const Cache = await SESSION.GetCache(sessionID);

  if (Cache.customerData.responseData == null) {
    const accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }
  
  let bilData   = await getBillMethod(msisdn);
  let followUpEvent = undefined;
  let billingAddress = "";

  if (bilData.preferMethod == "postalAddress") {
    followUpEvent ="manage_address_ebill_query";
  }

  if (bilData.preferMethod == "email") {
    followUpEvent ="manage_billing_address_current";
    billingAddress = bilData.address.fullAddress;
  }

  return UTIL.ComposeResult("",followUpEvent,{"billingAddress": billingAddress});
}

exports.ChangeAddress = async function (event) {
  
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  
  //👇these params are passed as ARRAY
  let addressLine1  = UTIL.GetParameterValue(event,"addressLine1");
  let postcode      = UTIL.GetParameterValue(event,"postcode");
  let city          = UTIL.GetParameterValue(event,"city");
  let state         = UTIL.GetParameterValue(event,"state");

  let returnParam = {
    "addressLine1" : addressLine1[0],
    "postcode" : postcode[0],
    "city" : city[0],
    "state" : state
  }

  //✋validation is no longer necessary
  return UTIL.ComposeResult("","billing_address_change_address_confirmation", returnParam );  
}

exports.Confirmation_Yes = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  const Cache = await SESSION.GetCache(sessionID);
  if (Cache.customerData.responseData == null) {
    const accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }
  let addressLine1  = UTIL.GetParameterValue(event,"addressLine1");
  let postcode      = UTIL.GetParameterValue(event,"postcode");
  let city          = UTIL.GetParameterValue(event,"city");
  let state         = UTIL.GetParameterValue(event,"state");

  let body = {
    "type": "postalAddress",
    "address": {
      "addressLine1": addressLine1,
      "addressLine2": "",
      "addressLine3": "",
      "postCode" : postcode,
      "city" : city,
      "state" : state
    }
  };

  try {
    let result = await setBill(msisdn, body);

    if (result.status != "success") {
      return UTIL.ComposeResult("","manage_billing_address_invalid_address");
    } else {
      return UTIL.ComposeResult("","billing_address_change_case_creation");
    }
  } catch (err) {
    console.log("🔻 Manage Address Confirmation Error");
    console.log(err);
    return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
  }
};

exports.CurrentAddress = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  // let billingAddress  = UTIL.GetParameterValue(event,"billingAddress");
  let bilData   = await getBillMethod(msisdn);
  let billingAddress = bilData.address.fullAddress;
  return UTIL.ComposeResult("","manage_billing_address_current", {"billingAddress":billingAddress});
};

// exports.ChangeAddress_Invalid = async function (event) {

// }
