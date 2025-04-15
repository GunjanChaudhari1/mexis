const moment = require('moment');
const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");
const portInPortOutJson = require('./portInPortOutResponseJson');

// condition to validate the number
async function validinput(str) {
  if ((str.length == 12 || str.length == 11 || str.length == 10) && (str.startsWith("6", 0)||str.startsWith("0", 0))) {
    console.log("length of phone number is true");
    return true
  } else {
    console.log("length of phone number is false");
    return false
  }
}

// //Port out
exports.PortOut_Initiation_Name_Wh = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  // ðŸ”EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
  if (redirectToEvent != undefined) {
    console.log("event followup------>", redirectToEvent);
    return UTIL.ComposeResult("", redirectToEvent);
  }
  let Cache = await SESSION.GetCache(sessionID)

  console.log("******PortOut_Initiation_Name_Wh******", JSON.stringify(Cache));
  if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
    // return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }

  //-------------------------------------------------------------------------------
  console.log("TAC Authenticated")
  // let cusData = await getAccountDetails(msisdn);
  return UTIL.ComposeResult("", "PortIn_StatusMSISDN_Query");
};

// checking the 1st api
async function CheckRetrieveStatus(msisdn) {
  console.log("coming to this flow");
  //     curl --location --request GET 'http://api-digital-uat4.isddc.men.maxis.com.my/mnp/api/v1.0/mnp?msisdn=60178497391' \
  // --header 'channel: MAXBOT' \
  // --header 'languageid: en-US'
  let url = `${HOST.PORTIN_INFO[HOST.TARGET]}/mnp/api/v1.0/mnp?msisdn=${msisdn}`;
  let head = {
    method: "GET",
    headers: { "channel": "MAXBOT", "languageid": "en-US" }
  };
  let apiResponse = await UTIL.GetUrl(url, head)
  console.log(JSON.stringify(apiResponse), "11111111111111111111111");
  return JSON.stringify(apiResponse);
}

async function forFindIndexResponse(msisdn, ResponseApi) {
  let NavigateEvent = "";
  console.log(msisdn, "msisdn");
  console.log(ResponseApi.status, "ResponseApi.status");
  if (ResponseApi.status === "success") {
    let findIndexForResponseCode = portInPortOutJson.APIResponseMapping.findIndex(findResponseCode => findResponseCode.ResponseCode === ResponseApi.responseData.status);
    // check here invalid response code
    console.log(findIndexForResponseCode, "findIndexForResponseCodefindIndexForResponseCodefindIndexForResponseCode");
    if (findIndexForResponseCode !== -1) {
      let getResponseJson = portInPortOutJson.APIResponseMapping[findIndexForResponseCode];
      console.log(JSON.stringify(getResponseJson), "getResponseJsongetResponseJsongetResponseJson");
      /**
               * port in condistion valid for 1 to 12
               * port out valid for  up to 12
               */
      if (parseInt(getResponseJson.ResponseCode) <= 12) {
        console.log("1", "in between 12");

        if (getResponseJson.status == "Completed") {
          // congrajulations message
          console.log("status complete works here");

          return UTIL.ComposeResult("", "PortIn_Status_Successful_END");
        } else if (getResponseJson.status == "In-Progress") {
          if (getResponseJson.vendor == "Olo") {
            // bot notify customer
            console.log("status come in-progress", "olo users");
            return UTIL.ComposeResult("", "PortIn_Status_InProcess_OLO_END");
          } else if (getResponseJson.vendor == "Maxis") {
            /**
                           * Time and duration 12 hour
                           * using moment dependency for time difference
                           * */
            let startTime = UTIL.IOSDateFormat(ResponseApi.responseData.createdDate);
            let lastModifiedDate = moment(ResponseApi.timeStamp).utcOffset("+08:00").format();
            console.log("last Modified Date", lastModifiedDate);
            // let differenceHourTwelve = timeDifference(startTime, lastModifiedDate, 'hour');
            let differenceHourTwelve = await UTIL.is12BusinessHoursElapsed(startTime);
            console.log("differenceHourTwelve", differenceHourTwelve);
            if (differenceHourTwelve === true) {
              console.log("12 hours condistion true");
              return UTIL.ComposeResult("", "PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_Query",{ "MSISDN":msisdn , "CreatedDate": ResponseApi.responseData.createdDate,"PortInStatus":ResponseApi.responseData.description, "PendingTime":"12", });
            } else {
              console.log("12 hours condistion false",getResponseJson['MPG Status']);
              if (getResponseJson['MPG Status'] == "NPR Accepted, activation in progress") {
                /**
                    * Time and duration 12 hour
                    * using moment dependency for time difference
                    * */
                // let differenceHourTwo = timeDifference(startTime, lastModifiedDate, 'hour');
                let differenceHourTwo = await UTIL.is2BusinessHoursElapsed(startTime);
                console.log(differenceHourTwo, "differenceHourTwo");
                if (differenceHourTwo ===true) {
                  console.log("hour diff 2",differenceHourTwo);
                  return UTIL.ComposeResult("", "PortIn_Status_InProcess_Maxis_CaseEscalation_ActivationMoreThan2Hours_Query",{ "MSISDN":msisdn , "CreatedDate": ResponseApi.responseData.createdDate,"PortInStatus":ResponseApi.responseData.description, "PendingTime":"2", });
                  // method calling for escalate
                } else {
                  console.log("hour not diff 2");
                  return UTIL.ComposeResult("", "PortIn_Status_InProcess_12hours_END");
                };// check two hour time
              } else {
                // else part here
                console.log("else MPG Status");
                return UTIL.ComposeResult("", "PortIn_Status_InProcess_12hours_END");
              }
            } // else ned here for time difference  condistion not match
          }; // find maxis users or olo users
        } else if (getResponseJson.status == "Rejected") {
          return UTIL.ComposeResult("", "PortIn_Status_Rejected_7DayTimedOut", { "CreatedDate": ResponseApi.responseData.createdDate, "LastModifiedDate": moment(ResponseApi.timeStamp).utcOffset("+08:00").format(),"PortInStatus":ResponseApi.responseData.description,"MSISDN":msisdn , });
        }
      } else if (parseInt(getResponseJson.ResponseCode) >= 30 && parseInt(getResponseJson.ResponseCode) <= 42) {
        console.log("2", "above the 12 and less equal 42 port out ");
        let responseStatus = getResponseJson['status'];
        // port out logic here
        if (responseStatus == "Completed") {
          console.log("PortOut_Status_Successful_END", 'Completed');
          return UTIL.ComposeResult("", "PortOut_Status_Successful_END");
        } else if (responseStatus=="In-progress") {
          console.log("PortOut_Status_InProcess_END", "In-Progress");
          return UTIL.ComposeResult("", "PortOut_Status_InProcess_END");
        } else if (responseStatus == "Rejected") {
          console.log("PortOut_Rejected_END", 'Rejected');
          return UTIL.ComposeResult("", "PortOut_Rejected_END");
        }
      }
    } else {
      return "invalid response code"
    } // else api invalid response code
  } else {
    console.log("forFindIndexResponse");
    if (ResponseApi.violations[0].code=="MPG_0009") {
      console.log(true, "No Record Found");
      return UTIL.ComposeResult("", "PortIn_NoRecordFound");
    } else {
      console.log(false, "Api response get status fail system error");
      return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }
  } // end else for checking status success or not
}

// //this is for the main logic
exports.PortOut_WA_Wh = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  console.log(msisdn, "msisdn");
  let Retrievestatus = await CheckRetrieveStatus(msisdn)
  let Responsestatus = await forFindIndexResponse(msisdn, JSON.parse(Retrievestatus))
  return Responsestatus;
}

exports.PortOut_Other_Wh = async function (event) {
  let PhoneNumber = UTIL.GetParameterValue(event, "PhoneNumber");
  console.log(typeof (PhoneNumber));
  console.log("Logging Phonenumber", PhoneNumber);
  PhoneNumber = PhoneNumber.toString();
  console.log(".toString--", typeof (PhoneNumber));
  console.log(PhoneNumber);

  let valinp = await validinput(PhoneNumber);
  console.log("validating number",valinp);
  if (valinp == true) {
    if (PhoneNumber.startsWith("0", 0)&& PhoneNumber.length == 10) {
      PhoneNumber = 6 +PhoneNumber
      let Retrievestatus = await CheckRetrieveStatus(PhoneNumber)
      let Responsestatus = await forFindIndexResponse(PhoneNumber, JSON.parse(Retrievestatus))
      return Responsestatus;
    } else {
      let Retrievestatus = await CheckRetrieveStatus(PhoneNumber)
      let Responsestatus = await forFindIndexResponse(PhoneNumber, JSON.parse(Retrievestatus))
      return Responsestatus;
    }
  } else if (valinp == false) {
    console.log(`Retrieving failed---inside else`);
    return UTIL.ComposeResult("","PortIn_StatusMSISDN_Query_OtherMSISDN_Error");
  }
};

/**
 *
 * @param {String} startTime start date pass
 * @param {String} endTime   end date or last date
 * @param {*} differenceIn  specify difference day, hour, second, millSecond
 * @returns {String}  return value either day, hour etc
 */
function timeDifference(startTime, endTime, differenceIn) {
  let startDate = moment(startTime);
  let endDate = moment(endTime);
  return endDate.diff(startDate, differenceIn);
}

//--------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

function VerifyNumber(NRIC) {
  let pattern = /^[a-z A-Z\d\\s]+$/;

  if (pattern.test(NRIC)) {
    return true
  } else {
    return false
  }
}
function VerificationNRIC(NRICNumber) {
  let numberpattern = /(([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01]))([0-9]{6})/;

  if (numberpattern.test(NRICNumber)) {
    return true
  } else {
    return false
  }
}

async function CreateCase(msisdn,CreatedDate,PortInStatus,othermsisdn) {
  let date = UTIL.DateFormat(CreatedDate);
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`
  let body = {
    "idType": "",
    "idValue": "",
    "msisdn": msisdn,
    "caseType1": "Enquiry_Request-MNP",
    "caseType2": "To Resubmit Port IN",
    "caseType3": "To Resubmit Port IN",
    "description": `Port-In Date and Time (Latest):${date}, Port-In Status: ${PortInStatus}, Dialogflow Intent Name: PortIn.7DayTimedOut.OpenCase, WA MSISDN: ${msisdn}, Port-In MSISDN: ${othermsisdn},Channel: MAXBOT`,
    "isUpdateCBR": false
  };
  let head = {

    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "channel": "MAXBOT", "uuid": null }

  };
  let data = await UTIL.GetUrl(url, head);
  return data.responseData;
}

async function CreateCaseInProgress(msisdn,NRIC,CreatedDate,PortInStatus,othermsisdn,PendingTime) {
  let TimeViolation = "";
  if (PendingTime=="12") TimeViolation="Pending Maxis more than 12 Business Hours";
  if (PendingTime=="2") TimeViolation="Pending Maxis more than 2 Business Hours Activation In Progress";
  let date = UTIL.DateFormat(CreatedDate);
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`
  let body = {
    "idType": "",
    "idValue": "",
    "msisdn": msisdn,
    "caseType1": "Enquiry_Request-MNP",
    "caseType2": "Port In Status",
    "caseType3": "NA",
    "description": `Port-In Date and Time (Latest):${date}, Port-In Status: ${PortInStatus}, Passport number: ${NRIC},WA MSISDN: ${msisdn}, Timer Violation: ${TimeViolation}, Port-In MSISDN: ${othermsisdn},DF Intent Name:PortIn.Status.InProcess.Maxis.CaseEscalation.MoreThan12Hours.RequestNRIC.Verify,Channel: MAXBOT`,
    "isUpdateCBR": false
  };
  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "channel": "MAXBOT", "uuid": null }
  };
  let data = await UTIL.GetUrl(url, head);
  console.log("data", data);
  return data.responseData;
}

async function CreateCaseInProgressNRIC(msisdn,NRICNumber,CreatedDate,PortInStatus,othermsisdn,PendingTime) {
  let TimeViolation = "";
  console.log(msisdn,NRICNumber,CreatedDate,PortInStatus,othermsisdn);
  if (PendingTime=="12") TimeViolation="Pending Maxis more than 12 Business Hours";
  if (PendingTime=="2") TimeViolation="Pending Maxis more than 2 Business Hours Activation In Progress";
  let date = UTIL.DateFormat(CreatedDate);
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`
  let body = {
    "idType": "",
    "idValue": "",
    "msisdn": msisdn,
    "caseType1": "Enquiry_Request-MNP",
    "caseType2": "Port In Status",
    "caseType3": "NA",
    "description": `Port-In Date and Time (Latest):${date}, Port-In Status: ${PortInStatus},NRIC Number: ${NRICNumber},WA MSISDN: ${msisdn}, Timer Violation: ${TimeViolation}, Port-In MSISDN: ${othermsisdn},DF Intent Name:PortIn.Status.InProcess.Maxis.CaseEscalation.MoreThan12Hours.RequestNRIC.Verify,Channel: MAXBOT`,
    "isUpdateCBR": false
  };
  console.log("JSON.stringify(body)", JSON.stringify(body));
  console.log("body", body);
  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "channel": "MAXBOT", "uuid": null }
  };

  let data = await UTIL.GetUrl(url, head);
  console.log("data",data);
  console.log("data.responseData",data.responseData);

  return data.responseData;
}

exports.RejectedFlow = async function (event) {
  let CreatedDate = UTIL.GetParameterValue(event, "CreatedDate");
  let LastModifiedDate = UTIL.GetParameterValue(event, "LastModifiedDate");
  let PortInStatus = UTIL.GetParameterValue(event,"PortInStatus");
  let othermsisdn = UTIL.GetParameterValue(event,"MSISDN");
  let createDateFormat = UTIL.IOSDateFormat(CreatedDate)
  console.log("CreatedDate", CreatedDate, createDateFormat,PortInStatus);
  console.log("LastModifiedDate", LastModifiedDate, moment(LastModifiedDate).utcOffset("+08:00").format());
  let lastGMt = LastModifiedDate.replace('+08:00', '')
  console.log("lastGMt",lastGMt);
  let differenceHourDays = timeDifference(createDateFormat, moment(lastGMt).utcOffset("+08:00").format(), 'hour')
  console.log("differenceHourDays before", differenceHourDays);
  differenceHourDays = parseInt(differenceHourDays)/24;
  console.log("differenceHourDays", differenceHourDays);
  console.log("differenceHourDays", differenceHourDays, ((differenceHourDays > 1) && (differenceHourDays <= 4)));
  if ((differenceHourDays > 7) && (differenceHourDays <= 30)) {
    console.log("Bot Prompts customer if still want to proceed with request", {"CreatedDate":CreatedDate, "PortInStatus":PortInStatus,"MSISDN":othermsisdn});
    return UTIL.ComposeResult("", "PortIn_Status_Rejected_7DayTimedOut_Resubmit",{"CreatedDate":CreatedDate, "PortInStatus":PortInStatus,"MSISDN":othermsisdn});
  } else {
    console.log("PortIn_Status_Rejected_7DayTimedOut_lessthan7days", "false");
    return UTIL.ComposeResult("", "PortIn_Status_Rejected_7DayTimedOut_lessthan7days");
  }
}

exports.RejectedFlow_CaseCreation = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let othermsisdn = UTIL.GetParameterValue(event,"MSISDN");
  let CreatedDate = UTIL.GetParameterValue(event, "CreatedDate");
  let PortInStatus = UTIL.GetParameterValue(event, "PortInStatus");
  let caseResult = await CreateCase(msisdn,CreatedDate,PortInStatus,othermsisdn);
  if ("caseId" in caseResult) {
    console.log("PortIn_7DayTimedOut_OpenCase", "true");
    return UTIL.ComposeResult("", "PortIn_7DayTimedOut_OpenCase",{"caseId":caseResult.caseId});
  } else {
    console.log("Shared_SystemError_TryAgain",false);
    return UTIL.ComposeResult("", "Shared_SystemError_TryAgain");
  }
}

exports.VerifyNRIC = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let othermsisdn = UTIL.GetParameterValue(event,"MSISDN");
  let NRIC = UTIL.GetParameterValue(event, "NRIC");
  let CreatedDate = UTIL.GetParameterValue(event,"CreatedDate");
  let PortInStatus = UTIL.GetParameterValue(event,"PortInStatus");
  let PendingTime = UTIL.GetParameterValue(event,"PendingTime");
  console.log("logging NRIC",NRIC);
  let result = VerifyNumber(NRIC)
  if (result == true) {
    let caseResult = await CreateCaseInProgress(msisdn,NRIC,CreatedDate,PortInStatus,othermsisdn,PendingTime);
    if ("caseId" in caseResult) {
      console.log("PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_Created_END", "true");
      return UTIL.ComposeResult("", "PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_Created_END",{"caseId":caseResult.caseId});
    } else {
      console.log("Shared_SystemError_TryAgain", "false");
      return UTIL.ComposeResult("", "Shared_SystemError_TryAgain");
    }
  } else{
    console.log("PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_RequestNRIC_No", result);
    return UTIL.ComposeResult("", "PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_RequestNRIC_No");
  }
}

exports.VerifyNRICNumber = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let othermsisdn = UTIL.GetParameterValue(event,"MSISDN");
  let NRICNumber = UTIL.GetParameterValue(event, "NRICNumber");
  let CreatedDate = UTIL.GetParameterValue(event,"CreatedDate");
  let PortInStatus = UTIL.GetParameterValue(event,"PortInStatus");
  let PendingTime = UTIL.GetParameterValue(event,"PendingTime");
  console.log("logging NRIC",NRICNumber);
  let result1 = VerificationNRIC(NRICNumber)
  if (result1 == true) {
    let caseResult = await CreateCaseInProgressNRIC(msisdn,NRICNumber,CreatedDate,PortInStatus,othermsisdn,PendingTime);

    if ("caseId" in caseResult) {
      console.log("PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_Created_END", "true");
      return UTIL.ComposeResult("", "PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_Created_END",{"caseId":caseResult.caseId});
    } else {
      console.log("Shared_SystemError_TryAgain", "false");
      return UTIL.ComposeResult("", "Shared_SystemError_TryAgain");
    }
  } else{
    console.log("PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_RequestNRIC_NRICNo", result1);
    return UTIL.ComposeResult("", "PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_RequestNRIC_NRICNo");
  }
}