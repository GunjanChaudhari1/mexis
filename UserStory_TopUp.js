const SESSION   = require("./Handler_Session")
const UTIL      = require("./Util")
const HOST    = require("./Handler_Host");


async function getservicebalance(msisdn, sessionID) {
  let url = `${HOST.VIEW_CREDIT_BALANCE_PREPAID_TOPUP[HOST.TARGET]}`;
  let head = {
    "headers": {"maxis_msisdn":msisdn,"maxis_channel_type":"MAXBOT","languageid" : "en-US","clearcache" : "false"}     
  };

  let data   = await UTIL.GetUrl(url,head,msisdn,sessionID);
  console.log("data********", JSON.stringify(data), data.responseData);
  return data.responseData;

}

async function getRedirectLink(msisdn, languageId, sessionID) {
  let url  = `${HOST.REDIRECTION_URL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/topup?msisdn=${msisdn}`;
  let head = { headers: {"channel" : "MAXBOT", "languageid":languageId} };

  let data = await UTIL.GetUrl(url,head,msisdn, sessionID);
  return data.responseData;
}


exports.PrepaidTopup_TopupHistory_Wh = async function (event, followUpEvent) {
    
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID)
  let Cache   = await SESSION.GetCache(sessionID);
  let languageId = Cache.Language == 1 ? "ms-MY" : "en-US"; 
  let redirectLink = await getRedirectLink(msisdn, languageId, sessionID);
  
  return UTIL.ComposeResult("", followUpEvent, {"redirectLink": redirectLink});
}

// 👇 Userstory Topup.js
  exports.PrepaidTopup_TopupMenu_Wh =  async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn =  await SESSION.GetMSISDN(sessionID);
    console.log("PrepaidTopup.topup menu flow started. Got msisdn!!")

    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
    if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
    //-------------------------------------------------------------------------------    
    
    console.log("TAC Authenticated")
    let Cache = await SESSION.GetCache(sessionID)
    try{
      console.log("******PrepaidTopup_TopupMenu_Wh******", JSON.stringify(Cache));
      if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
              //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
              return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
      }
      if(Cache["MaxisNakedFiber"]  == "Olo"){
        return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
      }
      let cusData = await getservicebalance(msisdn, sessionID); 
      console.log("customer data working*****", cusData);
      if(cusData==null){
        return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
      }
      let expiry_date=cusData["expiry"];
      let credit_balance=cusData["creditBalance"];
      let grace_date=cusData["graceExpiry"];
      let rate_plan=cusData["ratePlan"]["name"];
      balance=(credit_balance/100).toFixed(2);
      curr_date = new Date();
      expiryDate= new Date(expiry_date);
      date = expiryDate;
      year = date.getFullYear().toString().slice(2);
      month = date.getMonth()+1;
      dt = date.getDate();

      if (dt < 10) {
        dt = '0' + dt;
      }
      if (month < 10) {
        month = '0' + month;
      }
      date=dt+'-' + month + '-'+year

      Edate = new Date(expiry_date);
      Edate.setDate(Edate.getDate()-3);
      
      terminationDate= new Date(grace_date);
      termination_date = terminationDate;
      termination_dateyear = termination_date.getFullYear().toString().slice(2);
      termination_datemonth = termination_date.getMonth()+1;
      termination_datedt = termination_date.getDate();

      if (termination_datedt < 10) {
        termination_datedt = '0' + termination_datedt;
      }
      if (termination_datemonth < 10) {
        termination_datemonth = '0' + termination_datemonth;
      }
      termination_date=termination_datedt+'-' + termination_datemonth + '-'+termination_dateyear
      Tdate = new Date(grace_date);
      Tdate.setDate(Tdate.getDate()-3);
    
      if(curr_date.getTime() >= Edate.getTime()){
        //plan is about to expire,expired,about to terminate
        let diff=Math.abs(curr_date - expiryDate);
        let diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
        if (diffDays <=3){
            console.log("BOT responds - the account is about to expire, NBA to Top Up")
            let responseToUser="I noticed your Hotlink validity is about to end on "+date+" and outgoing services will be INTERRUPTED.\nWould you like to Top Up now to continue using the service?"
          return UTIL.ComposeResult("","PrepaidTopup_CheckValidity" , {"MSISDN": msisdn, "ratePlan": rate_plan, "creditBal": balance, "expiryDate": date, "responseToUser": responseToUser});
          }
        else if (curr_date.getTime() > expiryDate.getTime() && curr_date.getTime() <= Tdate.getTime()){
            console.log("BOT responds - the account is inactive, NBA to Top Up")
            let responseToUser="I noticed your Hotlink account is in INACTIVE status and your outgoing services are currently interrupted.\nWould you like to Top Up now to reactive your account to continue using the service?"
          return UTIL.ComposeResult("","PrepaidTopup_CheckValidity" , {"MSISDN": msisdn, "ratePlan": rate_plan, "creditBal": balance, "expiryDate": date, "responseToUser": responseToUser});
        }
        else { console.log("BOT responds - the account is about to be terminated, NBA to Top Up")
        let responseToUser="I noticed your Hotlink number is about to EXPIRE on "+termination_date+" and all services will be disabled.\nWould you like to Top Up now to reactive your account to continue using the service?"
        return UTIL.ComposeResult("","PrepaidTopup_CheckValidity" , {"MSISDN": msisdn, "ratePlan": rate_plan, "creditBal": balance, "expiryDate": date, "responseToUser": responseToUser});
      }
        } 

      else {
        // plan is still active
        console.log("plan is still active")
        if (balance < 10.00)
        {
          console.log("BOT notifies low balance, NBA to Top Up")
          let responseToUser="I noticed your Hotlink credit balance is low. Let me help you perform a Top Up now. ";
          return UTIL.ComposeResult("","PrepaidTopup_LowBalance" , {"MSISDN": msisdn, "ratePlan": rate_plan, "creditBal": balance, "expiryDate": date, "responseToUser": responseToUser});
        }
        else{
          console.log("BOT offers to Top-Up or View Top-Up History")
          let responseToUser="What would you like to do?";
          return UTIL.ComposeResult("","PrepaidTopup_CheckLowBalance" , {"MSISDN": msisdn, "ratePlan": rate_plan, "creditBal": balance, "expiryDate": date, "responseToUser": responseToUser});

        }
          }
          }
    catch
    {
      return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
    }

   
}

// 👇 hitting amdocs api to fetch credit balance and validity
// async function getAccountDetails(msisdn) {
//   let url  = `${HOST.CUSTOMER[HOST.TARGET]}/billing/api/v4.0/bills/accounts?checkfssp=true&checkroaming=true`;
//   let head = {
//       "method" : "GET",
//       "headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT", "languageid":"en-US"}
//   };
  
//   let data = await UTIL.GetUrl(url,head,msisdn);
//   console.log(`Data fetched!!! ${data}`)
//   return data.responseData;
// }


// exports.PrepaidTopup_iShare_Wh =  async function (event) 
// {

//     console.log("PrepaidTopup.ishare flow started. Got msisdn!!")

//     //🔐EXECUTE AUTHENTICATION
//     //------------------------------------------------------------------------------
//     let redirectToEvent = await UTIL.Authenticate(event,msisdn);
//     if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
//     //-------------------------------------------------------------------------------    

//     console.log("TAC Authenticated")
//     let Cache   = await SESSION.GetCache(msisdn); // navigates to handler Session.js
//     // let cusData = await getAccountDetails(msisdn);
//     let cusData= { "MSISDN" : "60175476",
//                 "Rate Plan": "Hotlink Prepaid Unlimited",
//                 "Credit Balance": "RM20.00", 
//                 "Expires on":"05-02-22"
//                 };
//     let expiry_date=cusData["Expires on"];
//     let credit_balance=cusData["Credit Balance"];
//     console.log("BOT displays Credit Balance: "+credit_balance+ "RMX.XX Expires on "+expiry_date)
//     return UTIL.ComposeResult("","PrepaidTopup_iShare_FAQ" , {"creditBal":credit_balance, "expiryDate": expiry_date});
//   }

  // 👇 UserStory_PerformTopup
 
// exports.PrepaidTopup_PerformTopup_Wh =  async function (event) 
// {
//     console.log("PrepaidTopup.perform topup menu flow started. Got msisdn!!")

//     //🔐EXECUTE AUTHENTICATION
//     //------------------------------------------------------------------------------
//     let redirectToEvent = await UTIL.Authenticate(event,msisdn);
//     if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
//     //-------------------------------------------------------------------------------    

//     console.log("TAC Authenticated")
//     let Cache   = await SESSION.GetCache(msisdn); // navigates to handler Session.js
//     // let cusData = await getAccountDetails(msisdn);
//     let cusData= { "MSISDN" : "60175476",
//                 "Rate Plan": "Hotlink Prepaid Unlimited",
//                 "Credit Balance": "RM20.00", 
//                 "Expires on":"05-02-22"
//                 };
//     let expiry_date=cusData["Expires on"];
//     let credit_balance=cusData["Credit Balance"];
//     console.log("BOT displays Credit Balance: "+credit_balance+ " RMX.XX Expires on "+expiry_date)
//     return UTIL.ComposeResult("","PrepaidTopup_PerformTopup_ProvideLink" , {"creditBal":credit_balance, "expiryDate": expiry_date});
//   }


exports.PrepaidTopup_iShare_FAQ_Query = async function(event){
  let sessionID = UTIL.GetSessionID(event);
  let msisdn =await SESSION.GetMSISDN(sessionID)
    //------------------------------------------------------------------------------
    // let redirectToEvent = await UTIL.Authenticate(event,msisdn, sessionID);
    // if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
    //-------------------------------------------------------------------------------    
    return UTIL.ComposeResult("","PrepaidTopup_iShare_FAQ");
}
