const UTIL = require("./Util")
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

async function getCustomerNakedFiber(searchtype, searchvalue) {
  let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  let head = {
    headers: {"Content-Type" : "application/json", "maxis_channel_type" : "MAXBOT", "languageid":"en-US"},
    method : "POST",
    body : JSON.stringify({
      "searchtype":searchtype,
      "searchvalue": searchvalue,
      "prinSuppValue": "",
      "isGetSupplementary": true,
      "isPrincipalPlanName": true,
      "isLookupAllAccount": true,
      "isIndividual": 1,
      "isSubscription": true,
      "isIncludeOfferingConfig":false,
      "isCustomerProfile":false,
      "familyType": false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getCustomer(msisdn) {
  let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  let head = {
    headers: {"Content-Type" : "application/json", "maxis_channel_type" : "MAXBOT", "languageid":"en-US"},
    method : "POST",
    body : JSON.stringify({
      "searchtype":"MSISDN",
      "searchvalue": msisdn,
      "prinSuppValue": "",
      "isGetSupplementary": true,
      "isPrincipalPlanName": true,
      "isLookupAllAccount": false,
      "isIndividual": 1,
      "isSubscription": true,
      "isIncludeOfferingConfig":false,
      "isCustomerProfile":false,
      "familyType": false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getDirectDebit(msisdn, accountNo) {
  let url = `${HOST.DIRECT_DEBIT[HOST.TARGET]}/directdebit/api/v3.0/directdebit`;
  let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn, "accountno":accountNo} };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getRedirectLinkMSSP(msisdn, accountNo, languageId) {
  let url = `${HOST.REDIRECTION_URL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/dd?msisdn=${msisdn}&accountNumber=${accountNo}`;
  let head = { headers: {"channel" : "MAXBOT", "languageid":languageId} };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getRedirectLinkHSSP(msisdn, languageId) {
  let url = `${HOST.REDIRECTION_URL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/dd?msisdn=${msisdn}`;
  let head = { headers: {"channel" : "MAXBOT", "languageid":languageId} };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

function datediff(first, second) {
  return Math.round((second-first)/(1000*60*60*24));
}

exports.DirectDebit = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Redirectlink ="";
  let subType = "";
  let type="";
  //------------------------------------------------------------------------------
  // ðŸ”EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event, msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID)

  console.log("******DirectDebit******", JSON.stringify(Cache));
  if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
    // return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }

  try {
    // Added to replace msisdn to serviceId
    if (Cache.customerData.responseData == null) {
      console.log(' Hit DirectDebit flow if cond ')
      // console.log('***Cache.getCustomerforNRICPassport****', Cache.getCustomerforNRICPassport);
      let accData = Cache.getCustomerforNRICPassport.responseData;
      // msisdn = accData.accounts[0].msisdns[0].serviceId;
      const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
      if (serviceId.length !== 0) {
        msisdn = serviceId[0].serviceId;
      } else {
        msisdn = accData.accounts[0].msisdns[0].serviceId;
      }
      // console.log('New MSISDN >> ', msisdn);
    }
    //

    let cusData = '';
    //     if (Cache['customerData']['responseData']==null) {
    //       console.log("***Card Number****", Cache['cardNumber']);
    //       cusData = await getCustomerNakedFiber(Cache['cardNumber'][0], Cache['cardNumber'][1])
    //     } else {
    //       console.log("***else condition for card number***")
    //       cusData = await getCustomer(msisdn);
    //     }
    cusData = await getCustomer(msisdn);
    console.log("cusData********", JSON.stringify(cusData));
    let accountNo = cusData.accounts[0].accountNo;
    // fetch subType
    subType = cusData.accounts[0].subType;
    type = cusData.accounts[0].type;
    console.log ("subType ðŸ‘‰"+ subType)
    console.log("accountNo ðŸ‘‰" + accountNo);
    console.log("type ðŸ‘‰" + type);
    let debData = await getDirectDebit(msisdn, accountNo);
    let responsemsg = "";
    // let Cache   = await SESSION.GetCache(sessionID);
    let languageId = Cache.Language == 1 ? "ms-MY" : "en-US";

    // logic for Maxis/Hotlink Customer
    if (subType =="Maxis Individual") {
      Redirectlink = await getRedirectLinkMSSP(msisdn, accountNo, languageId);
      // Redirectlink = `${HOST.DIRECT_DEBIT_MAXIS[HOST.TARGET]}`;
      console.log("Maxis Redirectlink" + Redirectlink)
      responsemsg = "Click the link to manage your Direct Debit service through our Maxis Self Serve portal.";
    } else {
      // Redirectlink =  `${HOST.DIRECT_DEBIT_HOTLINK[HOST.TARGET]}`;
      Redirectlink = await getRedirectLinkHSSP(msisdn, languageId)
      console.log("Hotlink Redirectlink" + Redirectlink)
      responsemsg = "Click the link to manage your Direct Debit service through our Hotlink Self Serve portal.";
    }

    if (debData.isEnabled) {
      let expiryDate = new Date(debData.cardExpiryDate);
      let cardNumber = "```****``` " + debData.lastDigits.split('-')[3];
      let status = "";
      let followUpEvent = "";

      let days = datediff(new Date().getTime(), expiryDate.getTime());
      console.log(days)

      if ( days >= 30 ) { status = "Active"; followUpEvent="direct_debit_true";}
      if ( days <= 0 ) { status = "Expired"; followUpEvent="direct_debit_expired";}
      if ( days < 30 && days > 0 ) { status = "Active (near expiry)"; followUpEvent="direct_debit_near_expiry";}

      console.log('accountNo '+ accountNo)
      console.log('msisdn '+ msisdn)

      // let Redirectlink  = `https://care-uat.maxis.com.my/en/auth/redirect?r=dd&account=${accountNo}&msisdn=${msisdn}`;
      console.log (Redirectlink);

      return UTIL.ComposeResult("",followUpEvent, {"responsemsg": responsemsg,"Redirectlink":Redirectlink,"expiryNumber":UTIL.ToMM_YYYY(expiryDate.toUTCString()),"cardNumber":cardNumber,"status":status.replace("(near expiry)","")});
    } else {
      console.log('accountNo '+ accountNo)
      console.log('msisdn '+ msisdn)
      // let Redirectlink  = `https://care-uat.maxis.com.my/en/auth/redirect?r=dd&account=${accountNo}&msisdn=${msisdn}`;
      console.log (Redirectlink);
      if (subType == "Individual") {
        if (type == "Consumer") {
          return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
        } else {
          return UTIL.ComposeResult("","direct_debit_false",{"responsemsg": responsemsg,"Redirectlink":Redirectlink});
        }
      } else {
        return UTIL.ComposeResult("","direct_debit_false",{"responsemsg": responsemsg,"Redirectlink":Redirectlink});
      }
      //
    }
  } catch (err) {
    console.log("Error in Direct Debit!!", err);
    if(subType =="Maxis Individual"){
      return UTIL.ComposeResult("","Shared_Tech_IssueServicingMaxis");
    }else{
      return UTIL.ComposeResult("","Shared_Tech_IssueServicingHotlink");
    }
  }
}