const fs = require('fs');
const chromium = require('chrome-aws-lambda');
const { SES } = require("aws-sdk");
const isEmpty = require("lodash/isEmpty");
const CRYPTO = require("crypto-js");
const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");
const { Fallback } = require("./UserStory_ValidationFallback");

const FALLBACK_MESSAGE = process.env.FALLBACK_MESSAGE;

async function getCustomerNakedFiber(searchtype, searchvalue) {
  let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  let head = {
    headers: { "Content-Type": "application/json", "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
    method: "POST",
    body: JSON.stringify({
      "searchtype": searchtype,
      "searchvalue": searchvalue,
      "prinSuppValue": "",
      "isGetSupplementary": true,
      "isPrincipalPlanName": true,
      "isLookupAllAccount": true,
      "isIndividual": 1,
      "isSubscription": true,
      "isIncludeOfferingConfig": false,
      "isCustomerProfile": false,
      "familyType": false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getCustomer(msisdn) {
  let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  let head = {
    headers: { "Content-Type": "application/json", "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
    method: "POST",
    body: JSON.stringify({
      "searchtype": "MSISDN",
      "searchvalue": msisdn,
      "prinSuppValue": "",
      "isGetSupplementary": true,
      "isPrincipalPlanName": true,
      "isLookupAllAccount": false,
      "isIndividual": 1,
      "isSubscription": true,
      "isIncludeOfferingConfig": false,
      "isCustomerProfile": false,
      "familyType": false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}
async function getCustomerByAccId(accountId) {
  let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  let head = {
    headers: { "Content-Type": "application/json", "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
    method: "POST",
    body: JSON.stringify({
      "searchtype": "ACCOUNT",
      "searchvalue": accountId,
      "prinSuppValue": "",
      "isGetSupplementary": true,
      "isPrincipalPlanName": true,
      "isLookupAllAccount": false,
      "isIndividual": 1,
      "isSubscription": true,
      "isIncludeOfferingConfig": false,
      "isCustomerProfile": false,
      "familyType": false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getDirectDebit(msisdn, accountNo) {
  let url = `${HOST.DIRECT_DEBIT[HOST.TARGET]}/directdebit/api/v3.0/directdebit`;
  let head = { headers: { "channel": "MAXBOT", "languagecode": "en-US","msisdn": msisdn, "accountno": accountNo } };
  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getBills(msisdn="", accountNo="") {
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bill?`;
  if (msisdn != "" && accountNo == "") url += `msisdn=${msisdn}`
  if (accountNo != "" && msisdn == "") url += `accountno=${accountNo}`
  if (msisdn != "" && accountNo != "") url += `accountno=${accountNo}&msisdn=${msisdn}`
  let head = {
    "method": "GET",
    "headers": { "Content-Type": "application/json", "msisdn": msisdn, "channel": "MAXBOT", "languageid": 1 }
  };

  let data = await UTIL.GetUrl(url,head); //ðŸ‘ˆ un-cache this api call.
  data = data.responseData;
  console.log(`PayBill | GetBills | response: ${JSON.stringify(data)}`);
  return data;
}

function GenerateLink(barId, accountNo) {
  // ðŸ‘‡ stuff to encrypt
  // let key      = "1Y6BV0s7m45Y0IU53M9GKtxGCHYh9NI5";
  let key = process.env.PAYBILL_ENCRYPTION_KEY;
  let sourceId = "2";
  let dateTime = new Date().toISOString().slice(2,10).replace(/-/g,"");
  // let barId    = cusData.accounts[0].baId;

  let plainText = `${accountNo}|${sourceId}|${dateTime}|${barId}`;

  let password = CRYPTO.enc.Utf8.parse(key);
  password = CRYPTO.SHA256(password);

  return CRYPTO.AES.encrypt(plainText, password, { iv: "", mode: CRYPTO.mode.ECB }).toString();

  // console.log("plain text ðŸ‘‰: " + plainText);
  // console.log("encrypted  ðŸ‘‰: " + encryptedText);
}

exports.MakePayment = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  //ðŸ”EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  console.log("******exports.MakePayment******", JSON.stringify(Cache));
  if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
    //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }
  if (Cache["MaxisNakedFiber"] == "Olo") {
    return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
  }
  let mobileNo = "";
  let mobileOrServiceNo = "";
  let cusData = '';
  if (Cache['customerData']['responseData']==null) {
    console.log("***Card Number****", Cache['cardNumber']);
    cusData = await getCustomerNakedFiber( Cache['cardNumber'][0], Cache['cardNumber'][1])
    let accountNo = cusData.accounts[0].accountNo;
    let encryptedText = GenerateLink(cusData.accounts[0].baId, accountNo);
    let paymentUrl = `${HOST.PAYBILL[HOST.TARGET]}/CPN/showBill?p=` + encryptedText;

    return UTIL.ComposeResult("","Billing_MakePayment_Link", { "paymentUrl": paymentUrl });
  } else {
    console.log("***else condition for card number***")
    cusData = await getCustomer(msisdn);
  }


  let accountNo = cusData.accounts[0].accountNo;
  let debData = await getDirectDebit(msisdn, accountNo);

  if (debData == undefined || debData == null) {
    return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
  }

  let encryptedText = GenerateLink(cusData.accounts[0].baId, accountNo);
  let paymentUrl = `${HOST.PAYBILL[HOST.TARGET]}/CPN/showBill?p=` + encryptedText;

  let serviceId = "";

  if (cusData.accounts[0].msisdns.filter(x => x.serviceType=="GSM").length > 0) {
    serviceId = cusData.accounts[0].msisdns.filter(x => x.serviceType=="GSM")[0].serviceId;
  } else {
    serviceId = cusData.accounts[0].msisdns.filter(x => x.serviceType!="GLP")[0].serviceId;
  }

  mobileOrServiceNo = serviceId;
  billData = await getBills(serviceId, accountNo);

  let payBill_accountNo = cusData.accounts[0].accountNo
  let payBill_msisdn = mobileOrServiceNo
  let payBill_osAmount = UTIL.ToCurrency(billData["billAmountDue"])

  let followUpEvent = "";
  if (debData.isEnabled) {
    followUpEvent = "Billing_MakePayment_Link";
    return UTIL.ComposeResult("",followUpEvent, { "paymentUrl": paymentUrl });
  } else {
    followUpEvent = "billing_MakePayment_Link_direct_debit";
    // return UTIL.ComposeResult("",followUpEvent, { "paymentUrl": paymentUrl, "payBill_accountNo": payBill_accountNo, "payBill_msisdn": payBill_msisdn, "payBill_osAmount": payBill_osAmount });
    return UTIL.ComposeResult("",followUpEvent, { "paymentUrl": paymentUrl, "payBill_accountNo": payBill_accountNo, "payBill_msisdn": msisdn, "payBill_osAmount": payBill_osAmount });
  }

  // return UTIL.ComposeResult("",followUpEvent, {"paymentUrl" : paymentUrl}, returnParam);
}

exports.SelectOtherPayment = async function(event) {
  return UTIL.ComposeResult("","Billing_PayBill_MakeOtherPayment");
}

exports.RetryCheckNric = async function(event) {
  return UTIL.ComposeResult("","Billing_PayBill_Terminated_CheckNric");
}

exports.Paybilss_Topup_Menu = async function(event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  // EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  let CustomerType = await getCustomer(msisdn, sessionID);
  let followUpEvent="";
  try {
    // if(CustomerType==null)
    // {
    //         if(!Cache["MaxisNakedFiber"]) {
    //                 console.log("*****OLO Menu******");
    //                 followUpEvent = "main_menu_olo1";
    //         }
    //         else
    //         {
    //                 console.log("*****Naked Fiber Menu******");
    //                 followUpEvent = "greetings_mainMenu_NakedFiber";
    //         }

    // }
    // else
    // {
    //         console.log("CustomerType.subType ---> ", CustomerType.accounts[0].subType);
    //         console.log("CustomerType.cusType ----> ", CustomerType.accounts[0].type);
    if (CustomerType!=null && CustomerType.accounts[0].subType == "Individual") {
      if (CustomerType.accounts[0].type == "Consumer") {
        followUpEvent = "Paybill_prepaid";
      } else { //
        followUpEvent = "Paybill_olo";
      }
    } else if (Cache['MaxisNakedFiber'] == "Olo") {
      followUpEvent = "Paybill_olo";
    } else {
      followUpEvent = "paybillmenu_maxis";
    }
    // }
  } catch (err) {
    console.log("Error Handling flow is triggered!!! ", err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }

  Cache['lastIntentBeforeTAC'] = followUpEvent;
  SESSION.SetCache(sessionID, Cache);

  console.log("******exports.Paybilss_Topup_Menu******", JSON.stringify(Cache));
  if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
    // return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }

  return UTIL.ComposeResult("", followUpEvent);
}

exports.SelectAccount_Tac = async function(event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  if (Cache["MaxisNakedFiber"] == "Olo") {
    return UTIL.ComposeResult("","Billing_PayBill_SelectAccount_Olo");
  } else {
    return UTIL.ComposeResult("","Billing_PayBill_SelectAccount");
  }
}

exports.Olo_Tac = async function(event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  // ðŸ”EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  console.log("******exports.olo_Tac******", JSON.stringify(Cache));
  if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
    // return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }
  return UTIL.ComposeResult("","Billing_PayBill_MakeOtherPayment");
}

exports.OtherAccount = async function(event){
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
   //------------------------------------------------------------------------------
  //ðŸ”EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache   = await SESSION.GetCache(sessionID);
  console.log("******exports.OtherAccount******", JSON.stringify(Cache));
  if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
          //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
          return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }
  //ðŸ– accountId can be an actual account no or mssidn (mobile number). 
  let accountId  = UTIL.GetParameterValue(event,"payBill_otherAccID");   //ðŸ‘ˆ Use accountId as MSISDN
  
  let paymentUrl  = "";
  let returnParam = {};
  let pattern     = RegExp('^[0-9]{10,11}$');
  let cusData     = null;
  let mobileNo    = "";
  let mobileOrServiceNo = "";
  console.log('account Id>>>>>>>>>>>',accountId, (accountId.startsWith("601")), (accountId.startsWith("01")), pattern.test(accountId))
  if ((accountId.startsWith("601") || (accountId.startsWith("01")) && pattern.test(accountId)) )
  {
          console.log("if working account Id>>>>>>>>>>>");
          mobileNo  =  accountId.startsWith("01") ? "6" + accountId : accountId;
          console.log("if working account Id>>>>>>>>>>>", mobileNo);
          cusData   = await getCustomer(mobileNo);   
  }
  else if (/^\d+$/.test(accountId))
  {
          console.log("else****",accountId);
          cusData   = await getCustomerByAccId(accountId);
  }
  else{
          console.log("tritd*********");
          return UTIL.ComposeResult("","Billing_PayBill_MakeOtherPayment_Retry");
  }
  
  try {
          console.log(`PayBill | OtherAccount | cusData: ${JSON.stringify(cusData)}`);
          if (cusData != null && Object.keys(cusData).length > 0 && "accounts" in cusData)
          {
                  let accountNo = cusData.accounts[0].accountNo;
                  // let faStatus = cusData.accounts[0].status;
                  let encryptedText = GenerateLink(cusData.accounts[0].baId, accountNo);
                  paymentUrl = `${HOST.PAYBILL[HOST.TARGET]}/CPN/showBill?p=` + encryptedText;
                  let billData = "";
                  
                  //TARGET: Mobile Number
                  if (mobileNo != "")
                  {
                          billData = await getBills(mobileNo, ""); 
                          mobileOrServiceNo = mobileNo;
                  }
                  //TARGET: Account Number
                  else
                  {
                          let serviceId = "";
                          if(cusData.accounts[0].msisdns){
                                  if (cusData.accounts[0].msisdns.filter(x => x.serviceType=="GSM").length > 0)
                                  {
                                          serviceId = cusData.accounts[0].msisdns.filter(x => x.serviceType=="GSM")[0].serviceId;
                                  }
                                  else
                                  {
                                          serviceId = cusData.accounts[0].msisdns.filter(x => x.serviceType!="GLP")[0].serviceId;
                                  }
                                  mobileOrServiceNo = serviceId;
                          }

                          billData = await getBills(serviceId, accountNo);
                  }

                  if(billData["accountStatus"] == 'Cancelled'){
                          Cache["AccountNo"] = billData["accountNo"];
                          Cache["FAstatus"] = billData["accountStatus"];
                          Cache["OutstandingAmount"] = billData["billAmountDue"];
                          await SESSION.SetCache(sessionID, Cache);
                          console.log(`PayBill | OtherAccount | to DF ask 4 digit NRIC: ${JSON.stringify(Cache)}`);
                          return UTIL.ComposeResult("","Billing_Payment_TerminatedAcc_Verification");          
                  }

                  returnParam = {
                          "payBill_accountNo" : cusData.accounts[0].accountNo ,
                          "payBill_msisdn" : mobileOrServiceNo,
                          "payBill_osAmount":UTIL.ToCurrency(billData["billAmountDue"]) ,
                          "payBill_payLink": paymentUrl,
                          "payBill_dueDate" : UTIL.ToDD_MMM_YYYY(billData["billPaymentDueDateText"])
                  };
          }
          else{
                  return UTIL.ComposeResult("","Billing_PayBill_MakeOtherPayment_Retry");
          }
          
          if (paymentUrl!="") //Success!
          {       
                  return UTIL.ComposeResult("","Billing_PayBill_Other_Payment",returnParam);

          }
          else
          {
                  return UTIL.ComposeResult("","Billing_PayBill_MakeOtherPayment_Retry");
          }
          
                           
  }
  catch(err){
          console.log("Error Handling flow is triggered!!! ", err);
          return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
}

async function getAccountBalance(queryType, accountNo) {
    let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/account/balance?accountNumber=${accountNo}&queryType=${queryType}`;
    let head = {
            headers: { "Content-Type": "application/json", "channel": "MAXBOT", "languagecode": "en-US" },
            method: "GET"
    };

    let data = await UTIL.GetUrl(url,head);
    console.log(`Paybill | getAccountBalance | response: ${JSON.stringify(data.responseData[0])}`);
    return data.responseData[0];
}

exports.Billing_AgentHandover = async function(event){
  console.log(`PayBill | Billing_AgentHandover | START : ${JSON.stringify(event)}`)
  // Check NRIC/PassPortNo in Cache
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache   = await SESSION.GetCache(sessionID);
  let returnParam = {}

  try {
    return UTIL.ComposeResult("","Billing_Payment_TerminatedAcc_Verified_AgentAssistOffer",returnParam);
  } catch (error) {
    
  }
}

async function getAccountBalance(queryType, accountNo){
        let url  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/account/balance?accountNumber=${accountNo}&queryType=${queryType}`;
        let head = {
        headers: {"Content-Type" : "application/json", "channel" : "MAXBOT", "languagecode":"en-US"},
        method : "GET"
        };
        
        let data = await UTIL.GetUrl(url,head);
        console.log(`Paybill | getAccountBalance | response: ${JSON.stringify(data.responseData[0])}`);
        return data.responseData[0];
}


async function getWriteOffDetails(resourceType, resourceValue){
  let url  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/account/writeoff?resourceType=${resourceType}&resourceValue=${resourceValue}`;
  let head = {
  headers: {"Content-Type" : "application/json", "channel" : "MAXBOT", "languagecode":"en-US"},
  method : "GET"
  };
  
  let data = await UTIL.GetUrl(url,head);
  console.log(`Paybill | getWriteOffDetails | response: ${JSON.stringify(data.responseData[0])}`);
  return data.responseData[0];
}


exports.verifyLast4DigitNric = async function(event){
  console.log(`PayBill | verifyLast4DigitNric | START : ${JSON.stringify(event)}`)
  // Check NRIC/PassPortNo in Cache
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache   = await SESSION.GetCache(sessionID);
  let nric4digit  = UTIL.GetParameterValue(event,"payBill_nric4digit");
  console.log(`PayBill | verifyLast4DigitNric | user input nric : ${nric4digit}`) 
  let fullNric = ''
  let cusData;
  let returnParam = {}
  let pattern = /^[0-9]{4}$/

  try {
      if(!pattern.test(nric4digit)){
        console.log(`PayBill | verifyLast4DigitNric | Invalid NRIC Input : ${nric4digit}`);
        let returnParam = {
          text: "I didn’t quite get that."
        }
        return UTIL.ComposeResult("", "Billing_Payment_TerminatedAcc_Verification", returnParam);
      }
          if(!Cache['getCustomerforNRICPassport']){
                  fullNric = Cache['getCustomerforNRICPassport'];
  
          } else {
                  cusData = await getCustomerByAccId(Cache["AccountNo"]);
                  Cache["getCustomerforNRICPassport"] = cusData["customer"]["documentNumber"];
                  await SESSION.SetCache(sessionID, Cache);
                  fullNric = cusData["customer"]["documentNumber"];
          }  
          console.log(`PayBill | verifyLast4DigitNric | fullNric from CRM : ${fullNric}`) 
          let last4digit = fullNric.slice(fullNric.length - 4);
          if(last4digit == nric4digit){
                  console.log(`PayBill | verifyLast4DigitNric | NRIC match`) 
                  let queryType = 'ALL'
                  let accBalanceInfo = await getAccountBalance(queryType, Cache["AccountNo"]);
                  let collectionStatus = accBalanceInfo["collectionStatus"];
                  let writeOffStatus = accBalanceInfo["writeOffStatus"];
                  let OutstandingAmount = parseInt(Cache["OutstandingAmount"]);
                  console.log(`Outstanding Amount : ${OutstandingAmount}`);
                  console.log(`Collection Status : ${collectionStatus}`);
                  console.log(`Write Off Status : ${writeOffStatus}`);
  
                  let encryptedText = GenerateLink(cusData.accounts[0].baId, Cache["AccountNo"]);
                  let paymentUrl = `${HOST.PAYBILL[HOST.TARGET]}/CPN/showBill?p=` + encryptedText;

                  Cache["collectionStatus"] = collectionStatus;
                  Cache["writeOffStatus"] = writeOffStatus;
                  await SESSION.SetCache(sessionID, Cache);
  
                  if(OutstandingAmount > 0){
                          //has outstanding
                          console.log(`PayBill | verifyLast4DigitNric | has Outstanding`) 
                          returnParam = {
                                  "payBill_accountNo" : Cache["AccountNo"],
                                  "payBill_osAmount":UTIL.ToCurrency(Cache["OutstandingAmount"]) ,
                                  "payBill_payLink": paymentUrl
                          }; 
  
                          if(collectionStatus == 'O' || collectionStatus == 'R' || collectionStatus == 'L' || collectionStatus == 'S' ||  collectionStatus == 'F' || collectionStatus == 'D'){
                                  console.log(`PayBill | verifyLast4DigitNric | has Outstanding | has collection status`)
                                  return UTIL.ComposeResult("","Billing_Payment_TerminatedAcc_Verified_PresentBillDetails_NoWriteOff_HasLODSummon",returnParam);
                          }
  
                          return UTIL.ComposeResult("","Billing_Payment_TerminatedAcc_Verified_PresentBillDetails_NoWriteOff",returnParam);
                  } else {
                          //No Outstanding
                          console.log(`PayBill | verifyLast4DigitNric | no Outstanding`) 
  
                          if(writeOffStatus == 'Y'){
                                  console.log(`PayBill | verifyLast4DigitNric | no Outstanding | has write off status`) 
                                  //has Write Off 
                                  let resourceType = 'FA_ID'
                                  let writeOffInfo = await getWriteOffDetails(resourceType,Cache["AccountNo"]);
                                  let writeOffAmount =  writeOffInfo.writeOff.balance.amount;
                                  console.log(`PayBill | verifyLast4DigitNric | writeOffAmount: ${writeOffAmount}`) 
                                  returnParam = {
                                          "payBill_accountNo" : Cache["AccountNo"],
                                          "payBill_writeoffAmount":UTIL.ToCurrency(writeOffAmount),
                                          "payBill_payLink": paymentUrl
                                  }; 
                                  
                                  if(collectionStatus == 'O' || collectionStatus == 'R' || collectionStatus == 'L' || collectionStatus == 'S' ||  collectionStatus == 'F' || collectionStatus == 'D'){
                                          console.log(`PayBill | verifyLast4DigitNric | no Outstanding | has write off status | has collection status`) 
                                      
                                          return UTIL.ComposeResult("","Billing_Payment_TerminatedAcc_Verified_PresentBillDetails_HasWriteOff_HasLODSummon",returnParam);
                                  }

                                  return UTIL.ComposeResult("","Billing_Payment_TerminatedAcc_Verified_PresentBillDetails_HasWriteOff",returnParam);
                          } else {
                                  // No Write Off
                                  console.log(`PayBill | verifyLast4DigitNric | no Outstanding | no write off status`) 
                                  returnParam = {
                                          "payBill_accountNo" : Cache["AccountNo"],
                                          "payBill_osAmount":UTIL.ToCurrency(Cache["OutstandingAmount"])
                                  }; 
                                  return UTIL.ComposeResult("","Billing_Payment_TerminatedAcc_Verified_PresentBillDetails_NoWriteOff_NoOutstanding",returnParam);
                          }
                  }
          } else {
                  //NRIC not Match
                  console.log(`PayBill | verifyLast4DigitNric | NRIC not match : ${fullNric}`) 
                  return UTIL.ComposeResult("", "Billing_Payment_TerminatedAcc_Verification_Failed"); 
          }  
  } catch (error) {
          console.log("Error Handling flow is triggered!!! ", error);
          return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
}

async function getRedirectLinkMSSP(msisdn, accountNo, languageId) {
  let url = `${HOST.REDIRECTION_URL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/dd?msisdn=${msisdn}&accountNumber=${accountNo}`;
  let head = { headers: { "channel": "MAXBOT", "languageid": languageId } };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getRedirectLinkHSSP(msisdn, languageId) {
  let url = `${HOST.REDIRECTION_URL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/dd?msisdn=${msisdn}`;
  let head = { headers: { "channel": "MAXBOT", "languageid": languageId } };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

exports.Billing_MakePayment_DirectDebitOffer_Yes = async function (event, followUpEvent) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);

  let languageId = Cache.Language == 1 ? "ms-MY" : "en-US";
  let cusType = await SESSION.GetCustomerType(sessionID);
  let accountNo = cusType["accountNo"];
  let subType = cusType["subType"];
  let Redirectlink = "";
  let serviceName = "";
  try {
    if (subType == "Maxis Individual") {
      Redirectlink = await getRedirectLinkMSSP(msisdn, accountNo, languageId);
      // Redirectlink = `${HOST.DIRECT_DEBIT_MAXIS[HOST.TARGET]}`;
      console.log("Maxis Redirectlink" + Redirectlink)
      serviceName = "Maxis Care";
    } else {
      // Redirectlink =  `${HOST.DIRECT_DEBIT_HOTLINK[HOST.TARGET]}`;
      Redirectlink = await getRedirectLinkHSSP(msisdn, languageId)
      console.log("Hotlink Redirectlink" + Redirectlink)
      serviceName = "Hotlink Self Serve";
    }

    return UTIL.ComposeResult("", followUpEvent, { "redirectLink": Redirectlink, "serviceName": serviceName });
  } catch (err) {
    console.log("Error in Paybill Flow direct debit redirect link!!", err);
    if (subType =="Maxis Individual") {
      return UTIL.ComposeResult("","Shared_Tech_IssueServicingMaxis");
    } else {
      return UTIL.ComposeResult("","Shared_Tech_IssueServicingHotlink");
    }
  }
}


// ----------------------------------------------------------------------------------------
// Retrieve Payment
async function getPaymentReceipt(msisdn) {
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/payments`;
  let head = { "headers": { "Content-Type": "application/json", "msisdn": msisdn, "maxis_channel_type": "MAXBOT", "languageid": "en-US", "uuid": "dcd5b0ae-7266-443d-a7e0-12f2776cdc4e" } };
  let data = await UTIL.GetUrl(url, head); //ðŸ‘ˆ un-cache this api call.
  data = data.responseData;
  let paymentlist = data.paymentlist;
  let paymentByMonthYear = {}
  for (const payment of paymentlist) {
    let paymentDate = UTIL.String_To_MMM_YYYY(payment["paymentdate"])
    try {
      paymentByMonthYear[paymentDate].push(payment)
    } catch {
      paymentByMonthYear[paymentDate] = [payment]
    }
  }
  return paymentByMonthYear;
}

exports.Billing_RetrievePaymentReceipts = async function (event,retry=false) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  //------------------------------------------------------------------------------
  // ðŸ”EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
  //-------------------------------------------------------------------------------
  msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);

  try {
    console.log("******exports.Billing_RetrievePaymentReceipts******", JSON.stringify(Cache));
    if (Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
      //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
      return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }
    if (Cache["MaxisNakedFiber"] == "NF" || Cache["MaxisNakedFiber"] == "Olo") {
      return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    }
    let paymentByMonthYear = await getPaymentReceipt(msisdn);
    if (!isEmpty(paymentByMonthYear)) {
      Cache["paymentList"] = paymentByMonthYear;
      await SESSION.SetCache(sessionID, Cache);

      let monthYearSet = UTIL.GetNumberedMenu(Object.keys(paymentByMonthYear));

      if (!retry) {
        return UTIL.ComposeResult("","Billing_RetrievePaymentReceipts_Wh", { "monthYearList": monthYearSet });
      } else {
        return UTIL.ComposeResult("","Billing_RetrievePaymentReceipts_Wh_Retry", { "monthYearList": monthYearSet });
      }
    } else {
      console.log('📂 No Receipts Returned');
      return UTIL.ComposeResult("", "Billing_RetrievePaymentReceipts_NoPaymentRecord_END");
    }
  } catch (err) {
    console.log("Error handling flow triggered!!!", err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing")
  }
}

exports.Billing_RetrievePaymentReceipts_Duration = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let monthYearSelection = UTIL.GetParameterValue(event,"monthYearSelection");
  let paymentByMonthYear = await getPaymentReceipt(msisdn);
  let monthYearList = Object.keys(paymentByMonthYear);
  let monthYear = monthYearList[monthYearSelection - 1];
  console.log("Month Year Data in list", monthYear);
  try {
    if (monthYear != undefined) {
      let paymentDetails = paymentByMonthYear[monthYear];
      let cusData = await getCustomer(msisdn);
      // Add function to send image to ringcentral
      // This function should convert HTML into png and send png file in base64 and
      // rc2orchestrator should be able to fetch
      // from s3 bucket just like banner is fetched and sent to whatsapp
      if (paymentDetails.length > 0) {
        return UTIL.ComposeResult("", "Billing_RetrievePaymentReceipts_CreateReceipt",
          { "paymentDetails": paymentDetails, "accountNo": cusData.accounts[0].accountNo, "cusName": cusData.customer.name });
      } else {
        console.log(`Payment details not found for ${monthYear}: Error Handling flow is trigerred!!`);
        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
      }
    } else {
      console.log("Inside else when month year is undefined!!");
      let monthYearSet = UTIL.GetNumberedMenu(Object.keys(paymentByMonthYear));
      console.log("Inside else when month year is undefined!!",monthYearSet);
      return UTIL.ComposeResult("","Billing_RetrievePaymentReceipts_Wh", { "monthYearList": monthYearSet, "fallbackMessage": FALLBACK_MESSAGE });
    }
  } catch (err) {
    console.log("Error handling flow is triggered");
    console.log(err);
    return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
  }
}


async function apiCallingGeneratingRetrievePayment(event) {
  try {
    let cusName = UTIL.GetParameterValue(event, "cusName");
    let accountNo = UTIL.GetParameterValue(event, "accountNo");
    let paymentDetails = UTIL.GetParameterValue(event, "paymentDetails");
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let apiId = HOST.TARGET == 0 ? "nx5rbzdio4" : "avezebzouc";
    let apiky = HOST.TARGET == 0 ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin" : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
    let url = HOST.TARGET == 0 ? "https://maxbot-uat.maxis.com.my/dev/MaxisCallback" : "https://maxbot.maxis.com.my/prod/diagnostic";
    //let apiky = HOST.TARGET == 0 ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin" : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
    //let url = HOST.TARGET == 0 ? "https://utjb3ztdua.execute-api.ap-southeast-1.amazonaws.com/dev/MaxisCallback" : "https://maxbot.maxis.com.my/prod/diagnostic";


    let head = {
      "headers": { "x-apigw-api-id": apiId, "x-api-key": apiky },
      "method": "POST",
      "body": JSON.stringify({
        "cusName": cusName,
        "accountNo": accountNo,
        "paymentDetails": paymentDetails,
        "msisdn": msisdn,
        "generatingReceipt": true,
        "PaymentReceipt": "PaymentReceipt",
        "sessionID": sessionID,
      })
    };

    let data = await UTIL.GetUrl(url, head);
    return data;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
}

exports.Billing_RetrievePaymentReceipts_CreateReceipt = async function (event) {
  try {
    await apiCallingGeneratingRetrievePayment(event);
    return UTIL.ComposeResult("","Retrieve_payment_InProgress")
  } catch (err) {
    console.log("Error handling flow is triggered", err);
    return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
  }
}