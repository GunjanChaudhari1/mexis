const { performance } = require('perf_hooks');
const CALLER = require('caller-id');
const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const INTENT = require("./IntentMapper");
const HOST = require("./Handler_Host");

const FETCH = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
async function TACValidated(msisdn, sessionID, cache, flagVar, tacResult) {
  try {
    let TacCount = await SESSION.getAuthCount(sessionID);
    console.log(`get Authentication*************`);
    let TACCOUNT;
    if (flagVar == 1) {
      console.log("***********[reset value one]***********");
      TACCOUNT = 1
    }
    TACCOUNT = parseInt(TacCount) + 1;

    if (TACCOUNT == 3) {
      let SessionBlockDateTime = (Math.floor(Date.now() / 1000) + (30 * 60));
      await SESSION.SetAuthTime(sessionID, SessionBlockDateTime);
    }
    await SESSION.SetAuthCount(sessionID, TACCOUNT);

    console.log("return****************************", "Shared_Auth_InvalidTAC");
    return "Shared_Auth_InvalidTAC";
  } catch (error) {
    console.log("Api calling error", error);
  }
}
exports.CheckTAC = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  console.log("sessionID while valid tac**************", msisdn);
  let tacCODE = UTIL.GetParameterValue(event, "userTAC");
  let result = UTIL.ComposeResult("");
  let cache = await SESSION.GetCache(sessionID)
  let IntentName = "";
  let url = `${HOST.TAC[HOST.TARGET]}/tac/api/v1.0/tac/verify`;
  let regexTacValidate = /^[0-9]{6,6}$/g;
  if (regexTacValidate.test(tacCODE) == true) {
    let head = {
      "headers": { "content-type": "application/json", "channel": "MAXBOT" },
      "method": "POST",
      "body": JSON.stringify({ "msisdn": msisdn, "tactype": "1", "languageId": "en-US", "tac": tacCODE })
    };

    try {
      let IsAuthenticated = await SESSION.GetIsAuthenticated(sessionID);

      if (IsAuthenticated) {
        if (cache['getChannelName'] != 'whats_app') {
          IntentName = cache['lastIntent']
        } else {
          IntentName = await SESSION.GetLastIntent(sessionID);
        }

        console.log(`🔑 Already Authenticated! Redirecting To ${IntentName} from Authentication`);

        let Task = INTENT.Map();
        result = await Task[IntentName](event);
      }
      else {
        let tacResult = await UTIL.GetUrl(url, head, msisdn, sessionID);

        if (tacResult.status == "success") {
          //👇 when TAC is correct
          await SESSION.SetIsAuthenticated(sessionID, true);
          if (cache['getChannelName'] != 'whats_app') {
            IntentName = cache['lastIntent']
          } else {
            IntentName = await SESSION.GetLastIntent(sessionID);
          }

          //👇 redirect back to last saved intent
          console.log(`🔑 Redirecting To ${IntentName} from Authentication`);

          let Task = INTENT.Map();
          result = await Task[IntentName](event);
        }
        else {
          //TACValidated//
          console.log("else part 1111");
          let TacCount = await SESSION.getAuthCount(sessionID);
          let getSessionTimeDate = await SESSION.getAuthTime(sessionID)
          console.log("else part 22222");
          console.log("Social Media---------------> else", TacCount);
          if (TacCount < 3) {
            console.log("**************[retry 0,1,2]******************")
            let appName = await TACValidated(msisdn, sessionID, 0, tacResult);
            result = UTIL.ComposeResult("", appName);
            console.log("**************[retry 0,1,2]******************", result);
          } else {
            let EXPIRE = Math.floor(Date.now() / 1000);
            if (EXPIRE >= getSessionTimeDate) {
              console.log("**************[retry after 30 min over]******************")
              let appName = await TACValidated(msisdn, sessionID, 1, tacResult);
              result = UTIL.ComposeResult("", appName);
              console.log("**************[retry after 30 min over]******************", result)
            } else {
              console.log("**************[retry after 30 min]******************")
              result = UTIL.ComposeResult("", "Greeting_Authentication_MobileNo_FailedMaxRetries");
              console.log("**************[retry after 30 min]******************", result)
            }
          }
        }
      }
    }
    catch (err) {
      console.log("Check TAC Error 🔻");
      console.log(err);
      // result = UTIL.ComposeResult("","Shared_Auth_Fail") // Removed the old menu auth fail
      result = UTIL.ComposeResult("", "Shared_Tech_IssueServicing")
    }

    return result;
  } else {
    console.log("else part22222");
          let TacCount = await SESSION.getAuthCount(sessionID);
          let getSessionTimeDate = await SESSION.getAuthTime(sessionID)
          console.log("else part 22222");
          console.log("Social Media---------------> else", TacCount);
          if (TacCount < 3) {
            console.log("**************[retry 0,1,2]******************")
            let appName = await TACValidated(msisdn, sessionID, 0, tacResult);
            result = UTIL.ComposeResult("", appName);
            console.log("**************[retry 0,1,2]******************", result);
          } else {
            let EXPIRE = Math.floor(Date.now() / 1000);
            if (EXPIRE >= getSessionTimeDate) {
              console.log("**************[retry after 30 min over]******************")
              let appName = await TACValidated(msisdn, sessionID, 1, tacResult);
              result = UTIL.ComposeResult("", appName);
              console.log("**************[retry after 30 min over]******************", result)
            } else {
              console.log("**************[retry after 30 min]******************")
              result = UTIL.ComposeResult("", "Greeting_Authentication_MobileNo_FailedMaxRetries");
              console.log("**************[retry after 30 min]******************", result)
            }
          }
          return result;
  }

}

exports.ReSendTAC = async function (event) {
console.log("resent tac************************");
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);

  //👇 reset authentication counter
  await SESSION.ResetAuthenticationCount(sessionID);

  //👇 assuming redirectToEvent will never be undefined
  return UTIL.ComposeResult("", redirectToEvent);


}
exports.Dump = function (object, text = "", head = "", msisdn = "") {
  console.log(`🚽 Dumping${msisdn} [${text}][${JSON.stringify(head)}] ${JSON.stringify(object)}`);
}
exports.GetUrl = async function (url, header = undefined, msisdn = undefined, sessionID = undefined) {

  console.log("22222222222222222");
  let functionName = CALLER.getData().functionName;
  let data = {};
  let isUsingCache = false;

  let msisdnText = `${msisdn == undefined ? "" : " [" + msisdn + "] "}`;

  console.log(`🤞 fetching:${msisdnText}[${url}] [${JSON.stringify(header)}]`);
  let A = performance.now();

  try {
    //👇 if msisdn is supplied, then check if cache exist
    if (msisdn != undefined) {
      let cache = await SESSION.GetCache(sessionID);
      let dataCache = cache[functionName];

      if (dataCache != undefined && Object.keys(dataCache).length > 0) {
        isUsingCache = true;
        data = dataCache;
      }
    }

    if (isUsingCache == false) {
      if (header != undefined && Object.keys(header).length > 0) {
        data = await FETCH(url, header);
      }
      else {
        data = await FETCH(url);
      }
      data = await data.json();

      //👇 if msisdn is supplied, then cache into session
      if (msisdn != undefined && data.status == "success") {
        let cache = await SESSION.GetCache(sessionID)
        cache[functionName] = data;
        await SESSION.SetCache(sessionID, cache)
      }
    }
  }
  catch (err) {
    console.log(`🔻 ERROR: Fetching URL ${functionName}, ${err}`);
    data = undefined;
  }
  finally {
    let B = performance.now();
    let C = B - A;
    let SEC = (C / 1000).toFixed(3);

    if (C <= 1000) {
      console.log(`🐇 ${isUsingCache ? "🏃‍♀️" : "☁"}${msisdnText}: ${functionName} [${SEC}s]`);
    }
    else {
      console.log(`🐌 ${isUsingCache ? "🏃‍♀️" : "☁"}${msisdnText}: ${functionName} [${SEC}s]`);
    }

    exports.Dump(data, url, header, msisdnText);
  }
  return data;
}

async function TACApiValidate(msisdn, sessionID, flagVar) {
  try {
    let TacCount = await SESSION.getAuthCount(sessionID);
    let tacUrl = `${HOST.TAC[HOST.TARGET]}/tac/api/v1.0/tac`;
    let head = { "headers": { "msisdn": msisdn, "tactype": "1", "languageId": "en-US", "channel": "MAXBOT" } };

    let data = await exports.GetUrl(tacUrl, head);
    if (data.status == "fail" && data.violations[0].code == "TAC0001") {
      result = "Shared_Auth_ExistingTAC";
    }
    else {
      console.log(`🔑 💬 TAC: Send To [${msisdn}]`);
      let TACCOUNT;
      if (flagVar == 1) {
        console.log("***********[reset value one]***********");
        TACCOUNT = 1
      }
      TACCOUNT = parseInt(TacCount) + 1;

      if (TACCOUNT == 3) {
        let SessionBlockDateTime = (Math.floor(Date.now() / 1000) + (30 * 60));
        await SESSION.SetAuthTime(sessionID, SessionBlockDateTime)
      }
      await SESSION.SetAuthCount(sessionID, TACCOUNT)

      result = "Shared_Auth_EnterTAC";
      SESSION.SetMSISDN(sessionID, msisdn)
    }
    return result;
  } catch (error) {
    console.log("Api calling error", error);
  }

}

async function userProfileSet(sessionID, msisdn) {
  try {
          let apiId = HOST.TARGET == 0 ? "nx5rbzdio4" : "avezebzouc";
          let apiky = HOST.TARGET == 0 ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin" : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
          let url = HOST.TARGET == 0 ? "https://maxbot-uat.maxis.com.my/dev/MaxisCallback" : "https://maxbot.maxis.com.my/prod/diagnostic";
  

          let head = {
                  "headers": { "x-apigw-api-id": apiId, "x-api-key": apiky },
                  "method": "POST",
                  "body": JSON.stringify({
                    "msisdn": msisdn,
                    "sessionID":sessionID,
                    "customerAccountDetailsAPI":"customerAccountDetailsAPI",
                  })
          };

          let data = await UTIL.GetUrl(url, head);
          return true;
  } catch (err) {
          console.log('Maxis callback failed with error', err);
          return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
}


async function userProfileSetAccount(sessionID, msisdn) {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        msisdn,
        sessionID,
        customerAccountDetailsAPIAccount: 'customerAccountDetailsAPIAccount',
      }),
    };
    console.log('customer API calling start');
    const data = await exports.GetUrl(url, head);
    console.log('customer API calling end');
    return true;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

exports.Greeting_Authentication_MobileNo_Input_Query = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let Cache = await SESSION.GetCache(sessionID);
  let msisdn = UTIL.GetParameterValue(event, "MobileNum");
  console.log(`{MobileNum before}---->${msisdn}`);
  if(msisdn!=undefined||msisdn!=""){
    let firstTwoDigit= msisdn.substring(0,2);
    if(firstTwoDigit=='01'){
        msisdn = '6'+msisdn;
    }
  }
  //let userProfile =  await userProfileSet(sessionID,msisdn);
  if (Cache['accountStatus'] === undefined) {
    console.log('TAC if part');
    let userProfile = await userProfileSet(sessionID, msisdn);
  } else {
    console.log('TAC else part');
    let userProfile = await userProfileSetAccount(sessionID, msisdn);
    // if (Cache.customerData !== undefined && Cache.customerData.responseData !== null) {
    //   const accData = Cache.customerData.responseData;
    //   const { accountNo } = accData.accounts[0];
    //   const bilData = await getBills(msisdn, accountNo, sessionID);
    // }
    
  }
  
  console.log(`{MobileNum after}---->${msisdn}`);
  let result = undefined;
  let IsAuthenticated = await SESSION.GetIsAuthenticated(sessionID);
  //let userProfile =  await userProfileSet(sessionID,msisdn);

  if (IsAuthenticated == false) {
    try {
      let tacUrl = `${HOST.TAC[HOST.TARGET]}/tac/api/v1.0/tac`;
      let head = { "headers": { "msisdn": msisdn, "tactype": "1", "languageId": "en-US", "channel": "MAXBOT" } };
      let data = await exports.GetUrl(tacUrl, head);
      console.log("data************************", data);
      
      if (data.status == "fail" && data.violations[0].code == "TAC0001") {
        result = "Shared_Auth_ExistingTAC";
      }
      else {
        console.log(`🔑 💬 TAC: Send To [${msisdn}]`);
        await SESSION.SetMSISDN(sessionID, msisdn)

        result = "Shared_Auth_EnterTAC";
      }
    }
    catch (err) {
      console.log("Authentication Error 🔻"); console.log(err);
      result = "Shared_Auth_Fail";
    }

  }

  return UTIL.ComposeResult("", result);
}


exports.Authentication_OLO_Multichannel_Query = async function (event) {
  let SelectionMenu = UTIL.GetParameterValue(event, "SelectionMenu");
  let sessionID = UTIL.GetSessionID(event);
  let Cache = await SESSION.GetCache(sessionID);
  let UserProfileName = Cache['displayNameChannel'];
  console.log("***********[SelectionMenu]*******", SelectionMenu);
  if (/^[A-Za-z0-9\s]*$/.test(UserProfileName)) {
    if (/^[0-9\s]*$/.test(UserProfileName)) {
      UserProfileName = "Hi"
    } else {
      UserProfileName = `Hi ${UserProfileName}`
    }
  } else {
    UserProfileName = "Hi"
  }
  if (SelectionMenu == 1) {
    return UTIL.ComposeResult("", "OLO_NRICPassportSelection", { 'name': UserProfileName });
  } else {
    console.log("OLO fiber auth");    
    Cache['MaxisNakedFiber'] = "Olo";
    await SESSION.SetCache(sessionID, Cache);
    return UTIL.ComposeResult("", "main_menu_olo1", { 'name': UserProfileName });

  }


}

async function getCustomerforNRICPassport(idNumber, idCard, sessionID, msisdn) {

  try{
    let url =`${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`
    let head = {
        "method" : "POST",
        "headers" : {"Content-Type" : "application/json", "maxis_channel_type" : "MAXBOT", "languageid":"en-US"},
    
      "body": JSON.stringify({
        "searchtype": idCard,
        "searchvalue": idNumber,
        "isGetSupplementary": true,
        "isPrincipalPlanName": true,
        "isLookupAllAccount": false,
        "isIndividual": 2,
        "isSubscription": true,
        "isIncludeOfferingConfig": false
      })

    };

    let apiData = await UTIL.GetUrl(url, head);
    let data = apiData.responseData;
   console.log('**getCustomerforNRICPassport 22 **', apiData);

    let CustomerType = '';
    if (data != null && Object.keys(data).length > 0) {
      let isSuspended = data.accounts[0].msisdns.filter((x) => x.serviceId === msisdn)[0];
      let accType = '';
      let planName = '';
      if (isSuspended !== undefined) {
        isSuspended = isSuspended.status === 'suspended';
        accType = data.accounts[0].msisdns.filter(x => x.serviceId === msisdn)[0].plan.prinSuppIndicator;
        planName = data.accounts[0].msisdns.filter((x) => x.serviceId === msisdn)[0].plan.name;
      } else {
        isSuspended = '';
      }
      const { subType } = data.accounts[0];
      const cusType = data.accounts[0].type;
      const { status } = data.accounts[0];
      const { accountNo } = data.accounts[0];
      const CRMName = data.customer.name;
      CustomerType = {
        subType, accType, cusType, planName, status, accountNo, isSuspended, CRMName,
      };
      // console.log('Customer found in CRM ', CustomerType);
    } else {
      // console.log('Customer not found');
      CustomerType = {
        subType: '', accType: '', cusType: '', planName: '', status: '', isSuspended: false, CRMName: '',
      };
     // console.log(CustomerType);
    }
    //Cache["CustomerType"] = CustomerType;
    //await SESSION.SetCache(sessionID, Cache);
    await SESSION.SetCustomerType(sessionID, CustomerType);
    return apiData;

    } catch(err){
        console.log("getCustomerforNRICPassport 22 Error", err);
    }

}

exports.Authentication_OLO_Multichannel_NRIC_Query = async function (event) {

  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let NRIC = UTIL.GetParameterValue(event, "selectedNRIC");
    let idCard = UTIL.GetParameterValue(event, "idCard");
    let Cache = await SESSION.GetCache(sessionID);
    console.log(typeof (NRIC));
    console.log("***********[NRIC]*******", NRIC);

    let cusData = await getCustomerforNRICPassport(NRIC, idCard, sessionID, msisdn);
    try {
      let cbr = cusData.responseData.customer['cbrNumber'];
      console.log("***********[cbr]*******", cbr);
      console.log("***********[msisdn]*******", msisdn);
      if (cbr == msisdn) {
        Cache['cardNumber']= [idCard, NRIC];
        Cache['MaxisNakedFiber'] = "NF";
        Cache["menu"] = "Shown";
        await SESSION.SetCache(sessionID, Cache);
        
        console.log("******exports.Authentication_OLO_Multichannel_NRIC_Query******", JSON.stringify(Cache));
        let IntentName = Cache['lastIntent'];
        console.log("******Last Intent******", IntentName);
        let Task = INTENT.Map();
        result = await Task[IntentName](event);
        return result;

      }
      else {
        return UTIL.ComposeResult("", "Authentication_OLO_VerifyCBRFailed", { "idCard": idCard, "idNumber": NRIC });
      }
    }
    catch (err) {
      console.log("Error handling flow is triggered");
      console.log(err);
      //return UTIL.ComposeResult("", "retrival_notsuccessful");
      return UTIL.ComposeResult("", "Authentication_OLO_VerifyCBRFailed", { "idCard": idCard, "idNumber": Passport });
    }
  }
  catch (err) {
    console.log("Error handling flow is triggered");
    console.log(err);
    return UTIL.ComposeResult("", "retrival_notsuccessful");
  }

}

exports.Authentication_OLO_Multichannel_Passport_Query = async function (event) {

  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let Passport = UTIL.GetParameterValue(event, "selectedPass");
    let idCard = UTIL.GetParameterValue(event, "idCard");
    let Cache = await SESSION.GetCache(sessionID);
    console.log(typeof (Passport));
    console.log("***********[Passport No.]*******", Passport);

    let cusData = await getCustomerforNRICPassport(Passport, idCard, sessionID, msisdn);
    
    console.log("** cusData 222 **", cusData);
    try {
      let cbr = cusData.responseData.customer['cbrNumber'];
      console.log("***********[cbr]*******", cbr);
      console.log("***********[msisdn]*******", msisdn);
      if (cbr == msisdn) {
        Cache['cardNumber']= [idCard, Passport];
        Cache['MaxisNakedFiber'] = "NF";
        Cache["menu"] = "Shown";
        await SESSION.SetCache(sessionID, Cache);
        
        console.log("******exports.Authentication_OLO_Multichannel_Passport_Query******", JSON.stringify(Cache));
        let IntentName = Cache['lastIntent'];
        console.log("******Last Intent******", IntentName);
        let Task = INTENT.Map();
        result = await Task[IntentName](event);
        return result;
        
        //return UTIL.ComposeResult("","TAC_authentication"); 
      }
      else {
        return UTIL.ComposeResult("", "Authentication_OLO_VerifyCBRFailed", { "idCard": idCard, "idNumber": Passport });
      }
    }
    catch (err) {
      console.log("Error handling flow is triggered");
      console.log(err);
      return UTIL.ComposeResult("", "Authentication_OLO_VerifyCBRFailed", { "idCard": idCard, "idNumber": Passport });
    }
  }
  catch (err) {
    console.log("Error handling flow is triggered");
    console.log(err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
}

exports.Authentication_OLO_Multichannel_VerifyCBRFailed_FibreAccInput = async function (event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID);
    let fibreAccountInput = UTIL.GetParameterValue(event, "fibreAccountInput");
    let acc = Cache.getCustomerforNRICPassport.responseData.accounts.filter(item => item.status == "Open");
    console.log("**Authentication_OLO_Multichannel_VerifyCBRFailed_FibreAccInput**", Cache);
    console.log("ACC Data", acc);
    let fibreAccNumber = "";
    for (var i = 0; i < acc.length; i++) {
      let ftths = acc[i].msisdns.filter(x => x.serviceType == "FTTH" && x.status == "active");
      console.log(ftths.length);
      if (ftths.length > 0) {
        console.log("ftths : ", ftths);
        fibreAccNumber = acc[i].accountNo;
        break;
      }
    }
    console.log("acc number is : ", fibreAccNumber);
    if (fibreAccountInput == fibreAccNumber) {
      Cache['cardNumber']= ["ACCOUNT", fibreAccountInput];
      Cache['MaxisNakedFiber'] = "NF";
      console.log("******exports.Authentication_OLO_Multichannel_VerifyCBRFailed_FibreAccInput******", JSON.stringify(Cache));
      let IntentName = Cache['lastIntent'];
      console.log("******Last Intent******", IntentName);
      let Task = INTENT.Map();
      result = await Task[IntentName](event);
      return result;
    }
    else {
      Cache['MaxisNakedFiber'] = "Olo";
      return UTIL.ComposeResult("", "Authentication_OLO_VerifyCBRFailed_VerifyFibreAccFailed");
    }
  }
  catch (err) {
    console.log("Error handling flow is triggered");
    console.log(err);
    return UTIL.ComposeResult("", "retrival_notsuccessful");
  }
}


exports.Greeting_ManageFibreService = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn        = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  //🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  console.log(`UserStory_TAC | Greeting_ManageFibreService | MSISDN: ${msisdn} | SESSION ID: ${sessionID}`);
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  let Cache   = await SESSION.GetCache(sessionID);
  console.log("******Greeting_ManageFibreService******", JSON.stringify(Cache));
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
            //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
            return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }
    if(Cache["MaxisNakedFiber"]  == "Olo"){
          return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
    }

  return UTIL.ComposeResult("","Greeting_ManageFibreService");

}