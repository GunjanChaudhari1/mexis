const UTIL = require("./Util")
const HOST = require("./Handler_Host");
const SESSION = require("./Handler_Session");

//--------------------------------------------------------
// Unblock Top Authentication
//--------------------------------------------------------
exports.Prepaid_TopUp_Unblock_Auth = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);

  //------------------------------------------------------------------------------
  // 🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  // let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
  // if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
  //-------------------------------------------------------------------------------
  let Cache = await SESSION.GetCache(sessionID);

  // console.log("******Prepaid_TopUp_Unblock_Auth******", JSON.stringify(Cache));
  // if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
  //         //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
  //         return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  // }

  // console.log("TAC Authenticated")
  // let cusData = await getAccountDetails(msisdn);
  return UTIL.ComposeResult("", "TopUp_Unblock_NumberQuery2");
}

//----------------------------------------------------------------------------------------
// 👇 helper functions intended for the currect usecase
//----------------------------------------------------------------------------------------
function VomsSystemError() {
  return "Voms_System_Error";
}

function VomsMaxAttemptError() {
  return "Voms_Max_Attempt_Error";
}

//--------------------------------------------------------
// API CALL: Request to check Blocked Status of Own/Other Number
//--------------------------------------------------------
async function vomsRetrieveStaus(msisdn) {
  let url = `${HOST.PREPAID_UNBLOCK_TOPUP[HOST.TARGET]}/topup/api/v1.0/fraud?msisdn=${msisdn}`;

  let head = {
    method: "GET",
    headers: {
      "channel": "MAXBOT",
      "languagecode": "en-US" }
  };

  let data = await UTIL.GetUrl(url, head);
  return data;
}

//--------------------------------------------------------
// API CALL: Request to Unblock Own/Other Number
//--------------------------------------------------------
async function vomsUnblockNumber(msisdn) {
  let url = `${HOST.PREPAID_UNBLOCK_TOPUP[HOST.TARGET]}/topup/api/v1.0/fraud`;

  let header = { "channel":"MAXBOT",
    "languagecode":"en-US",
    "Content-Type": "application/json" };

  let body = {
    "action": "RESET_WITH_LIMIT",
    "msisdn": msisdn,
    "comment": "Unblock please!"
  };

  let head = {
    method: "PUT",
    body: JSON.stringify(body),
    headers: header
  };

  let data = await UTIL.GetUrl(url, head);
  return data;
}

//--------------------------------------------------------
// API CALL: Request to Check NRIC/Passport Number
//--------------------------------------------------------
async function retrieveNircPassportNumber(msisdn) {
  let url = `${HOST.PREPAID_UNBLOCK_TOPUP_CHECK_NRIC_PASSPORT_NUMBER[HOST.TARGET]}?searchField=MSISDN&searchValue=${msisdn}&getAllSubscriptions=true&queryType=INDIVIDUAL&queryType=SUBSCRIPTION&subscriptionType=PREPAID`;
  let head = {
    method: "GET",
    headers: {
      "channel": "MAXBOT",
      "languagecode": "en-US" }
  };

  let data = await UTIL.GetUrl(url, head);
  return data;
}

//--------------------------------------------------------
// Unblock Top Up Own Number Confirm
//--------------------------------------------------------
exports.Prepaid_Unblock_Topup_Own_Number_Confirm_process = async function(event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let retunParam = {"OwnNumber": msisdn}
    return UTIL.ComposeResult("", "Unblock_TopUp_OwnNumber_Display", retunParam);
  } catch (err) {
    console.log("Own Number Selection Error 🔻", err);
    return UTIL.ComposeResult("", VomsSystemError());
  }
}

//--------------------------------------------------------
// Unblock Top Up Customer chooses option Own Number
//--------------------------------------------------------
exports.Prepaid_Unblock_Topup_Own_Number_process = async function(event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID);

    let retrieveOwnNumberBlockStaus = await vomsRetrieveStaus(msisdn);
    console.log(`VOMS Request to check Blocked Status of Own Number !!! ${retrieveOwnNumberBlockStaus}`);
    if (retrieveOwnNumberBlockStaus.status == "success") {
      let ownNumberBlockStatus = retrieveOwnNumberBlockStaus.responseData['status'];
      console.log(`VOMS Retrieve Own Number Staus!!! ${ownNumberBlockStatus}`);
      Cache["vomsOwnNumberBlockStatus"] = ownNumberBlockStatus;
      await SESSION.SetCache(sessionID, Cache);
      if (ownNumberBlockStatus == 'FraudStateBlocked') {
        try {
          let unblockOwnNumber = await vomsUnblockNumber(msisdn);
          console.log(`VOMS Request to Unblock Own Number!!! ${unblockOwnNumber}`);
          if (unblockOwnNumber.status == "success") {
            let ownNumberLimitState = unblockOwnNumber.responseData['limitState'];
            console.log(`VOMS Unblock Own Number limitState!!! ${ownNumberLimitState}`);
            Cache["vomsOwnNumberLimitState"] = ownNumberLimitState;
            await SESSION.SetCache(msisdn, Cache);
            if (ownNumberLimitState == "LimitNotReached") {
              console.log("CALL: Own Number confirmation on Unblock Top-up Access");
              return UTIL.ComposeResult("", "Unblocked_TopUp_proceed_Success_Yes");
            } else {
              console.log("Own Number Update Unblock Status From VOMS Max Attemp Error 🔻");
              return UTIL.ComposeResult("", VomsMaxAttemptError());
            }
          }
        } catch (err) {
          console.log("Own Number Update Unblock Status From VOMS Error 🔻", err);
          return UTIL.ComposeResult("", VomsSystemError());
        }
        console.log('Own Number is blocked and can proceed to Top-up');
        return UTIL.ComposeResult("","Own_Number_Block_status_Proceed_TopUp");
      } else {
        console.log('Own Number is not blocked and can proceed to Top-up');
        return UTIL.ComposeResult("","Own_Number_Not_Block_status_Proceed_TopUp");
      }
    }
  } catch (err) {
    console.log("Own Number Access Block Status From VOMS Error 🔻", err);
    return UTIL.ComposeResult("", VomsSystemError());
  }
};

//--------------------------------------------------------
// Unblock Top Up Customer chooses option Other Number
//--------------------------------------------------------
exports.Prepaid_Unblock_Topup_Other_Number_process = async function(event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID);
    let otherPhoneNumber = UTIL.GetParameterValue(event, "otherPhoneNumber");

    Cache["unblockOtherNumber"] = otherPhoneNumber;
    await SESSION.SetCache(sessionID, Cache);

    let retrieveNircPassport = await retrieveNircPassportNumber(msisdn);
    console.log("NIRC API Response: " + JSON.stringify(retrieveNircPassport));
    if (retrieveNircPassport.status == "success") {
      let customer = retrieveNircPassport.responseData.customers;
      let subscriptionID = "";
      for (let i=0; i < customer.length; i++) {
        // subscriptionCount = (customer[i].accounts[0].subscriptions);
        accountCount = (customer[i].accounts);

        for (let j=0; j < accountCount.length ; j++) {
          subscriptionCount = accountCount[j].subscriptions;
          if (subscriptionCount) {
            for (let k=0; k < subscriptionCount.length; k++) {
              subscriptionID += subscriptionCount[k]['id'] + ", ";
            }
          }
        }
      }

      let subscriptionIDArray = subscriptionID.split(", ");
      let otherPhoneNumberExits = subscriptionIDArray.some((code) => code === otherPhoneNumber);

      console.log("subscriptionIDArray: "+subscriptionIDArray);
      console.log("other Phone Number: "+otherPhoneNumber);
      console.log("other Phone Number Exist: "+otherPhoneNumberExits);

      if (otherPhoneNumberExits) {
        try {
          let retrieveOtherNumberBlockStaus = await vomsRetrieveStaus(otherPhoneNumber);
          console.log(`VOMS Request to check Blocked Status of Other Number !!! ${retrieveOtherNumberBlockStaus}`);
          if (retrieveOtherNumberBlockStaus.status == "success") {
            let otherNumberBlockStatus = retrieveOtherNumberBlockStaus.responseData['status'];
            console.log(`VOMS Retrieve Other Number Staus!!! ${otherNumberBlockStatus}`);
            Cache["vomsOtherNumberBlockStatus"] = otherNumberBlockStatus;
            await SESSION.SetCache(sessionID, Cache);
            if (otherNumberBlockStatus == 'FraudStateBlocked') {
              try {
                let unblockOtherNumber = await vomsUnblockNumber(otherPhoneNumber);
                console.log(`VOMS Request to Unblock Other Number!!! ${unblockOtherNumber}`);
                if (unblockOtherNumber.status == "success") {
                  let otherNumberLimitState = unblockOtherNumber.responseData['limitState'];
                  console.log(`VOMS Unblock Other Number limitState!!! ${otherNumberLimitState}`);
                  Cache["vomsOtherNumberLimitState"] = otherNumberLimitState;
                  await SESSION.SetCache(sessionID, Cache);
                  if (otherNumberLimitState == "LimitNotReached") {
                    console.log("CALL: Other Number confirmation on Unblock Top-up Access");
                    return UTIL.ComposeResult("", "Unblocked_TopUp_proceed_Success_Yes");
                  } else {
                    console.log("Other Number Update Unblock Status From VOMS Max Attemp Error 🔻");
                    return UTIL.ComposeResult("", VomsMaxAttemptError());
                  }
                }
              } catch (err) {
                console.log("Other Number Update Unblock Status From VOMS Error 🔻", err);
                return UTIL.ComposeResult("", VomsSystemError());
              }
              console.log('Other Number is blocked and can proceed to Top-up');
              return UTIL.ComposeResult("","Other_Number_Block_status_Proceed_TopUp");
            } else {
              console.log('Other Number is not blocked and can proceed to Top-up');
              return UTIL.ComposeResult("","Other_Number_Not_Block_status_Proceed_TopUp");
            }
          }
        } catch (err) {
          console.log("Other Number Access Block Status From VOMS Error 🔻", err);
          return UTIL.ComposeResult("", VomsSystemError());
        }
      } else {
        console.log('Other Number Not Matches NRIC Prepaid Line');
        return UTIL.ComposeResult("","Other_Number_Not_Matches_NRIC_Prepaid_Line");
      }
    }
  } catch (err) {
    console.log("Other Number Access Block Status From VOMS Error 🔻", err);
    return UTIL.ComposeResult("", VomsSystemError());
  }
};

//--------------------------------------------------------
// Unblock Top Up Offer Link
//--------------------------------------------------------
exports.Prepaid_Unblock_TopUp_Own_number_Offer_Link_process = async function(event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let offereLink = `https://selfserve-uat.hotlink.com.my/en/auth/redirect?r=topup&msisdn=${msisdn}`;
    let retunParam = {"OfferLink": offereLink}
    return UTIL.ComposeResult("", "TopUp-OfferTopUpLink", retunParam);
  } catch (err) {
    console.log("Top Up Offer Link Issue 🔻", err);
    return UTIL.ComposeResult("", VomsSystemError());
  }
};

exports.Prepaid_Unblock_TopUp_Other_Number_Offer_Link_process = async function(event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);
    let otherPhoneNumber = Cache["unblockOtherNumber"];
    let offereLink = `https://selfserve-uat.hotlink.com.my/en/auth/redirect?r=topup&msisdn=${otherPhoneNumber}`;
    let retunParam = {"OfferLink1": offereLink}
    return UTIL.ComposeResult("", "TopUp-OfferTopUpLink2", retunParam);
  } catch (err) {
    console.log("Top Up Offer Link Issue 🔻", err);
    return UTIL.ComposeResult("", VomsSystemError());
  }
};
