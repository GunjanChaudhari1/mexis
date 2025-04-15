const UTIL = require("./Util");
const HOST = require("./Handler_Host");
const DF = require("./Handler_DialogFlow");
const SESSION = require("./Handler_Session");
const RC = require("./Handler_RingCentral");


async function getBills(msisdn, accountNo){
    const url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bill?accountno=${accountNo}&msisdn=${msisdn}`;
    const head = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json', msisdn, channel: 'MAXBOT', languageid: 1,
      },
  
    };
  
    let data = await UTIL.GetUrl(url, head); //
    // data = data;
    // console.log("Get Bills >> ", data)
    return data;
}

async function getUnbilled(msisdn, accountNo){
    const url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/linecharges/unbilled?accountno=${accountNo}&msisdn=${msisdn}`;

  const head = {
    headers: {
      'Content-Type': 'application/json', maxis_channel_type: 'MAXBOT', languageid: 'en-US', uuid: 'dcd5b0ae-7266-443d-a7e0-12f2776cdc4e',
    },
  };

  let data = await UTIL.GetUrl(url, head);
//   data = data;

  if (data == undefined) data = { totalUnbilledAmount: 0 };
  // console.log("Get Unbills >> ", data)
  return data;

}

async function getPayment(msisdn){
    const url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/payments`;
    const head = {
        headers: {
        'Content-Type': 'application/json', msisdn, maxis_channel_type: 'MAXBOT', languageid: 'en-US', uuid: 'dcd5b0ae-7266-443d-a7e0-12f2776cdc4e',
        },
    };

    let data = await UTIL.GetUrl(url, head);
    // data = data;
    // console.log("Get Payment >> ", data)
    return data;

}


async function getCase(msisdn) {
    let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/?conditionType=OPEN&numMonth=2`;
    let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

    let data = await UTIL.GetUrl(url,head);
    return data.responseData;
}

async function getCheckCpeStatus(msisdn) {
    let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checkcpestatus?conditionType=OPEN&numMonth=3`;
    let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

    let data = await UTIL.GetUrl(url,head);
    return data = data.responseData;
}

async function getCheckInetStatus(msisdn) {
    let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checkinetstatus?conditionType=OPEN&numMonth=3`;
    let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

    let data = await UTIL.GetUrl(url,head);
    return data = data.responseData;
}

async function getCheckTputStat(msisdn) {
    let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checktputstat?conditionType=OPEN&numMonth=3`;
    let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

    let data = await UTIL.GetUrl(url,head);
    return data = data.responseData;
}

async function getCheckWifiStat(msisdn) {
    let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checkwifistat?conditionType=OPEN&numMonth=3`;
    let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

    let data = await UTIL.GetUrl(url,head);
    return data = data.responseData;
}

async function getAccounts(msisdn)
{
    let url  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/accounts?checkfssp=true&checkroaming=true`;
    let head = {"headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT"}};
    
    let data = await UTIL.GetUrl(url,head);
        data = data.responseData;
    return data;
}


exports.customerAccountDetailsAPIData = async function (event) {
    console.log("MSISDN", event.sessionID, event.msisdn)
    let Cache = await SESSION.GetCache(event.sessionID);

    let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
    let head = {
        "method": "POST",
        "headers": { "Content-Type": "application/json", "msisdn": event.msisdn, "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
        "body": JSON.stringify({
            "searchtype": "MSISDN",
            "searchvalue": event.msisdn,
            "prinSuppValue": true,
            "isGetSupplementary": true,
            "isPrincipalPlanName": false,
            "isLookupAllAccount": false,
            "isIndividual": 1,
            "isSubscription": true,
            "isIncludeOfferingConfig": false,
            "isCustomerProfile": false,
            "familyType": null
        })
    };

    let data = await UTIL.GetUrl(url, head, event.msisdn, event.sessionID);
    let ReturnData = data;
    Cache["customerData"] = ReturnData;
    if(!Cache["MaxisNakedFiber"]) {
    Cache['getCustomerforNRICPassport'] = ReturnData;
    }
    data = data.responseData;
    if (data != null && Object.keys(data).length > 0) {
        let isSuspended = data.accounts[0].msisdns.filter(x => x.serviceId == event.msisdn)[0].status == "suspended";
        let subType = data.accounts[0].subType;
        let accType = data.accounts[0].msisdns.filter(x => x.serviceId == event.msisdn)[0].plan.prinSuppIndicator;
        let cusType = data.accounts[0].type;
        let planName = data.accounts[0].msisdns.filter(x => x.serviceId == event.msisdn)[0].plan.name;
        let accountStatus = data.accounts[0].status;
        let accountNo = data.accounts[0].accountNo;
        let CRMName = data.customer.name;

        CustomerType = { "subType": subType, "accType": accType, "cusType": cusType, "planName": planName, "status": accountStatus, "accountNo": accountNo, "isSuspended": isSuspended, "CRMName": CRMName };
        console.log("Customer found in CRM ", CustomerType);

        let getCaseData = await getCase(event.msisdn);
        let getCpeData = await getCheckCpeStatus(event.msisdn);
        let getIneData = await getCheckInetStatus(event.msisdn);
        let getTpuData = await getCheckTputStat(event.msisdn);
        let getWifData = await getCheckWifiStat(event.msisdn);
        let getAccData = await getAccounts(event.msisdn);

        console.log(" Cache111 New Data >> ", Cache);
        console.log("getBillData New Data ",getCaseData);
        Cache = await SESSION.GetCache(event.sessionID)

        Cache["caseData"] = getCaseData;
        Cache["cpeData"] = getCpeData;
        Cache["ineData"] = getIneData;
        Cache["tpuData"] = getTpuData;
        Cache["wifData"] = getWifData;
        Cache["accData"] = getAccData;
        await SESSION.SetCache(event.sessionID,Cache)
    }
    else {
        console.log("Customer not found");
        CustomerType = { "subType": "", "accType": "", "cusType": "", "planName": "", "status": "", "isSuspended": false, "CRMName": "" };
        console.log(CustomerType);
    }
    Cache = await SESSION.GetCache(event.sessionID)
    await SESSION.SetCustomerType(event.sessionID, CustomerType);
    console.log("customer Account Details API Data Success: " + JSON.stringify(ReturnData));
    Cache["customerData"] = ReturnData;
    if(!Cache["MaxisNakedFiber"]) {
        Cache['getCustomerforNRICPassport'] = ReturnData;
    }
    await SESSION.SetCache(event.sessionID, Cache);
    console.log("customer Account Details API Data profile set  DB" );
    return ReturnData;


}

exports.customerAccountDetailsAPIDataAccount = async function (event) {
    console.log("MSISDN", event.sessionID, event.msisdn)
    let Cache = await SESSION.GetCache(event.sessionID);

    let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
    let head = {
        "method": "POST",
        "headers": { "Content-Type": "application/json", "msisdn": event.msisdn, "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
        "body": JSON.stringify({
            "searchtype": "MSISDN",
            "searchvalue": event.msisdn,
            "prinSuppValue": true,
            "isGetSupplementary": false,
            "isPrincipalPlanName": false,
            "isLookupAllAccount": false,
            "isIndividual": 1,
            "isSubscription": true,
            "isIncludeOfferingConfig": true,
            "isCustomerProfile": false,
            "familyType": false
        })
    };

    let data = await UTIL.GetUrl(url, head, event.msisdn, event.sessionID);
    let ReturnData = data;
    Cache["customerData"] = ReturnData;
    if(!Cache["MaxisNakedFiber"]) {
    Cache['getCustomerforNRICPassport'] = ReturnData;
    }
    data = data.responseData;

    

    if (data != null && Object.keys(data).length > 0) {
        let isSuspended = data.accounts[0].msisdns.filter(x => x.serviceId == event.msisdn)[0].status == "suspended";
        let subType = data.accounts[0].subType;
        let accType = data.accounts[0].msisdns.filter(x => x.serviceId == event.msisdn)[0].plan.prinSuppIndicator;
        let cusType = data.accounts[0].type;
        let planName = data.accounts[0].msisdns.filter(x => x.serviceId == event.msisdn)[0].plan.name;
        let accountStatus = data.accounts[0].status;
        let accountNo = data.accounts[0].accountNo;
        let CRMName = data.customer.name;
 
        CustomerType = { "subType": subType, "accType": accType, "cusType": cusType, "planName": planName, "status": accountStatus, "accountNo": accountNo, "isSuspended": isSuspended, "CRMName": CRMName };
        console.log("Customer found in CRM ", CustomerType);

        //const { accountNo } = data.accounts[0];
        let getCaseData = await getCase(event.msisdn);
        let getCpeData = await getCheckCpeStatus(event.msisdn);
        let getIneData = await getCheckInetStatus(event.msisdn);
        let getTpuData = await getCheckTputStat(event.msisdn);
        let getWifData = await getCheckWifiStat(event.msisdn);
        let getAccData = await getAccounts(event.msisdn);

        let getBillData = await getBills(event.msisdn, accountNo);

        let getUnbilledData = await getUnbilled(event.msisdn, accountNo);
        
        let getPaymentData = await getPayment(event.msisdn);

        // console.log(" Cache111 New Data >> ", Cache);
        // console.log("getBillData New Data ",getBillData);
        // console.log("getUnbilledData New Data ", getUnbilledData);
        // console.log("getPaymentData New Data ", getPaymentData);
        Cache = await SESSION.GetCache(event.sessionID)
        Cache["caseData"] = getCaseData;
        Cache["cpeData"] = getCpeData;
        Cache["ineData"] = getIneData;
        Cache["tpuData"] = getTpuData;
        Cache["wifData"] = getWifData;
        Cache["accData"] = getAccData;

        Cache["billData"] = getBillData;
        Cache["unBillData"] = getUnbilledData;
        Cache["paymentData"] = getPaymentData;
        await SESSION.SetCache(event.sessionID,Cache)
    
    }
    else {
        console.log("Customer not found");
        CustomerType = { "subType": "", "accType": "", "cusType": "", "planName": "", "status": "", "isSuspended": false, "CRMName": "" };
        console.log(CustomerType);
    }
    await SESSION.GetCache(event.sessionID,Cache)

    await SESSION.SetCustomerType(event.sessionID, CustomerType);
    console.log("customer Account Details API Data Success: " + JSON.stringify(ReturnData));
    Cache["customerData"] = ReturnData;
    if(!Cache["MaxisNakedFiber"]) {
        Cache['getCustomerforNRICPassport'] = ReturnData;
    }
    await SESSION.SetCache(event.sessionID, Cache);
    console.log("customer Account Details API Data profile set  DB" );
    return ReturnData;


}

exports.getBills= async function(event)
{
    let Cache = await SESSION.GetCache(event.sessionID);
    //let url  = 'http://api-digital-uat2.isddc.men.maxis.com.my/billing/api/v4.0/bills/statements';
    let url  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/statements`;
    let head = {"headers": {"Content-Type":"application/json", "msisdn":event.msisdn, "maxis_channel_type":"MAXBOT", "languageid":"en-US", "uuid":"dcd5b0ae-7266-443d-a7e0-12f2776cdc4e"}};
    
    let data = await UTIL.GetUrl(url,head);
        data = data.responseData;

    let all = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    data.forEach(function(item){
      
      let date = new Date(item.billCloseDate);
      let key  = monthNames[date.getMonth()] + " " + date.getFullYear();
      all.push({"key" : key, "value" : item.billNumber});
    })

  console.log("fist api works");
    let urlACC  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/accounts?checkfssp=true&checkroaming=true`;
    let headACC = {"headers": {"Content-Type" : "application/json", "msisdn" : event.msisdn, "maxis_channel_type" : "MAXBOT"}};
    
    let dataACC= await UTIL.GetUrl(urlACC,headACC);
    dataACC = dataACC.responseData;
    console.log("second api works");
    Cache = await SESSION.GetCache(event.sessionID);
    Cache['userBillAccountData']=dataACC
    Cache['userBillData']=all;
    await SESSION.SetCache(event.sessionID, Cache);
    return;    
}


exports.getAccounts = async function(event)
{
    ;
    await SESSION.SetCache(event.sessionID, Cache);
    return;  
}




exports.Get_Customer_Billing_Data= async function(event)
{
    
    let Cache = await SESSION.GetCache(event.sessionID);
    let msisdn = event.msisdn;
    let accountNo = event.accountNo;


    if(Cache['lastIntent'] == 'CaseStatus.Start') {
    
        
        let getCaseData = await getCase(msisdn);
        let getCpeData = await getCheckCpeStatus(msisdn);
        let getIneData = await getCheckInetStatus(msisdn);
        let getTpuData = await getCheckTputStat(msisdn);
        let getWifData = await getCheckWifiStat(msisdn);
        let getAccData = await getAccounts(msisdn);

        Cache = await SESSION.GetCache(event.sessionID);
        Cache["caseData"] = getCaseData;
        Cache["cpeData"] = getCpeData;
        Cache["ineData"] = getIneData;
        Cache["tpuData"] = getTpuData;
        Cache["wifData"] = getWifData;
        Cache["accData"] = getAccData;
        await SESSION.SetCache(event.sessionID, Cache);

        let getBillData = await getBills(msisdn, accountNo);
        let getUnbilledData = await getUnbilled(msisdn, accountNo);    
        let getPaymentData = await getPayment(msisdn);

    
        Cache = await SESSION.GetCache(event.sessionID);
        Cache["billData"] = getBillData;
        Cache["unBillData"] = getUnbilledData;
        Cache["paymentData"] = getPaymentData;
        //if(Cache["MaxisNakedFiber"] !== undefined) {Cache['MaxisNakedFiber'] = Cache.MaxisNakedFiber;}
        Cache['MaxisNakedFiber'] = 'NF';
        await SESSION.SetCache(event.sessionID, Cache);

    } else {

        let getBillData = await getBills(msisdn, accountNo);
        let getUnbilledData = await getUnbilled(msisdn, accountNo);    
        let getPaymentData = await getPayment(msisdn);

    
        Cache = await SESSION.GetCache(event.sessionID);
        Cache["billData"] = getBillData;
        Cache["unBillData"] = getUnbilledData;
        Cache["paymentData"] = getPaymentData;
        Cache['MaxisNakedFiber'] = 'NF';
        await SESSION.SetCache(event.sessionID, Cache);

        
        let getCaseData = await getCase(msisdn);
        let getCpeData = await getCheckCpeStatus(msisdn);
        let getIneData = await getCheckInetStatus(msisdn);
        let getTpuData = await getCheckTputStat(msisdn);
        let getWifData = await getCheckWifiStat(msisdn);
        let getAccData = await getAccounts(msisdn);

        Cache = await SESSION.GetCache(event.sessionID);
        Cache["caseData"] = getCaseData;
        Cache["cpeData"] = getCpeData;
        Cache["ineData"] = getIneData;
        Cache["tpuData"] = getTpuData;
        Cache["wifData"] = getWifData;
        Cache["accData"] = getAccData;
        await SESSION.SetCache(event.sessionID, Cache);
    }

    // let getCaseData = await getCase(msisdn);
    // let getCpeData = await getCheckCpeStatus(msisdn);
    // let getIneData = await getCheckInetStatus(msisdn);
    // let getTpuData = await getCheckTputStat(msisdn);
    // let getWifData = await getCheckWifiStat(msisdn);
    // let getAccData = await getAccounts(msisdn);

    // let getBillData = await getBills(msisdn, accountNo);

    // let getUnbilledData = await getUnbilled(msisdn, accountNo);
    
    // let getPaymentData = await getPayment(msisdn);

   
    // Cache = await SESSION.GetCache(event.sessionID);
    // Cache["caseData"] = getCaseData;
    // Cache["cpeData"] = getCpeData;
    // Cache["ineData"] = getIneData;
    // Cache["tpuData"] = getTpuData;
    // Cache["wifData"] = getWifData;
    // Cache["accData"] = getAccData;

    // Cache["billData"] = getBillData;
    // Cache["unBillData"] = getUnbilledData;
    // Cache["paymentData"] = getPaymentData;
    // if(Cache["MaxisNakedFiber"] !== undefined) {Cache['MaxisNakedFiber'] = Cache.MaxisNakedFiber;}
   
    
    // await SESSION.SetCache(event.sessionID, Cache);

    console.log(" Cache New Data", Cache)
    return;    
}

exports.Get_Customer_ContractContext_Data= async function(event)
{
    //let event = event;
    let msisdn = event.msisdn;
    let sessionID = event.sessionID;

    console.log("Event >> ", event)
    console.log("MSISDN >> ", msisdn)
    console.log("sessionID >> ", sessionID)

    // let queryTextValue = 'Billing.AccountStatus.Active.ContractInfo'
    // context = await SESSION.GetContext(event.sessionID);
    // console.log("context >> ",context)
    // let DfReply = await DF.Call(queryTextValue, event.sessionID, event.msisdn, context);
    // console.log('DfReply=====>', JSON.stringify(DfReply));
    // await SESSION.SetContext(event.sessionID, DfReply['queryResult']['outputContexts']);
    
}
