const SESSION   = require("./Handler_Session")
const UTIL      = require("./Util")
const HOST    = require("./Handler_Host");

async function performPTP(msisdn, sessionID) {
  let cusType = SESSION.GetCustomerType(sessionID);
  let accountNo = cusType["accountNo"];
  let url  = `${HOST.CASE[HOST.TARGET]}/ptp/api/v1.0/ptp`;
  let head = {
    "method": "POST",
    "headers": {"maxis_channel_type":"MAXBOT", "Content-Type": "application/json"},
    "body": JSON.stringify({
      "msisdn": msisdn,
      "accountNumber": accountNo
    })     
  };

  let data   = await UTIL.GetUrl(url, head);
  try{

    if (data.status == "success"){
            return true;     
    }
    else if (data.status == "fail"){
            // return true;
            return false;
    }
    else {
            console.log("Perform PTP API is not working as expected!!!");
            // return true;
            return false;        
    }
}
catch(err) {
    console.log("API is not working as expected!!!");
    return false;
}

}

async function checkPTPEligibility(msisdn) {
  let url  = `${HOST.CASE[HOST.TARGET]}/ptp/api/v1.0/ptp?msisdn=${msisdn}`;
  let head = {
    "headers": {"maxis_channel_type":"MAXBOT"}     
  };

  let data   = await UTIL.GetUrl(url,head);
  return data.responseData;

}



exports.Payment_PaymentArrangement_PTP =  async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
    let checkptpeligibility   = await checkPTPEligibility(msisdn);

    if(checkptpeligibility == null){
      // PTP Eligible - NO and Active PTP - NO
      return UTIL.ComposeResult("","Payment_PaymentArrangement_PTP_NotEligible"); 
    }

    try{

      let ptpeligibility = checkptpeligibility["ptpEligInd"];
      let ptpDesc = checkptpeligibility["ptpEligDesc"];
      ptpDesc= ptpDesc.toLowerCase();
      if (ptpeligibility == 'Y'){
        // PTP Eligible - Yes and Active PTP - Yes
        let ptpamount = UTIL.ToCurrency(checkptpeligibility["ptpAmount"]);
        let ptpexpirydate = checkptpeligibility["ptpExpiryDate"]; // Date format in 20220416
        if (ptpexpirydate != "")
        {
          let monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          ptpexpirydate = ptpexpirydate.substr(6,2) + "-" +  monthName[parseInt(ptpexpirydate.substr(4,2))-1] + "-" + ptpexpirydate.substr(0,4) 
        }
        return UTIL.ComposeResult("","Payment_PaymentArrangement_PTP_Eligible_Yes", {"ptpamount": ptpamount, "ptpexpirydate": ptpexpirydate});
      }
      else{
        if (ptpDesc == "reason - live ptp"){
          // PTP Eligible - NO and Active PTP - Yes
          console.log("active",ptpDesc)
          return UTIL.ComposeResult("","Payment_PaymentArrangement_PTP_Eligible_No_ActivePTP_Yes");
        }
        else{
          // PTP Eligible - NO and Active PTP - NO
          console.log("not eligible",ptpDesc)
          return UTIL.ComposeResult("","Payment_PaymentArrangement_PTP_NotEligible");
        }
      }
    }
    catch(err){
      console.log("API not working correctly!!", err);
      return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }
}
        




exports.Payment_PaymentArrangement_PTP_SetUp_Yes =  async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
    let performptp   = await performPTP(msisdn,sessionID);
    let ptpAmount =  UTIL.GetParameterValue(event, "ptpamount");
    let ptpExpiryDate =  UTIL.GetParameterValue(event, "ptpexpirydate");
    

    if (performptp == true){
      return UTIL.ComposeResult("","Payment_PaymentArrangement_PTP_SetUp_Sucessful_Yes", {"ptpamount": ptpAmount, "ptpexpirydate": ptpExpiryDate});
    }
    else{
      return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
    }
} 
          


