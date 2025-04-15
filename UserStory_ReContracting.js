const UTIL      = require("./Util")
const SESSION   = require("./Handler_Session");
const HOST      = require("./Handler_Host");


async function getCustomerNakedFiber(searchtype, searchvalue) {
    let url  = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
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

async function getCustomerWithDevice(msisdn,sessionID) {
    let url  = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
    let head = {
        "method" : "POST",
        "headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT", "languageid":"en-US"},
        "body" : JSON.stringify( {
            "searchtype": "MSISDN",
            "searchvalue": msisdn,
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
    
    let data = await UTIL.GetUrl(url,head, msisdn,sessionID);
        
    return data.responseData;
}

async function getPenalty(msisdn) {
    let url  = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/querymobilerecontractinfo?queryType=msisdn&queryValue=${msisdn}`;
    let head = {
        "method" : "GET",
        "headers": {"Content-Type":"text/plain", "maxis_channel_type" : "MAXBOT"},
    };
    
    let data = await UTIL.GetUrl(url,head);
        
    return data.responseData;
}


exports.Start =  async function (event) {
    
    let sessionID = UTIL.GetSessionID(event);
    let msisdn  =await SESSION.GetMSISDN(sessionID);
    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
    if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
    //-------------------------------------------------------------------------------
    msisdn    = await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID)

    console.log("******ReContracting******", JSON.stringify(Cache));
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
            //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
            return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }

    if(Cache["MaxisNakedFiber"]  == "Olo"){
        return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
    }

    let accData = ''; 
    if(Cache['customerData']['responseData']==null){
            console.log("***Card Number****", Cache['cardNumber']);
            accData  = await getCustomerNakedFiber(Cache['cardNumber'][0],  Cache['cardNumber'][1])
            if(Cache["MaxisNakedFiber"]  == "NF" || Cache["MaxisNakedFiber"]  == "Olo"){
                return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
            }
    } else {
            console.log("***else condition for card number***")
            accData = await getCustomerWithDevice(msisdn,sessionID);
    }
    console.log("cusData********************");
    
    
    let penData = await getPenalty(msisdn);

    if (accData == null || penData == null)
    {
        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
    }

    let ratePlanName= accData.accounts[0].msisdns[0].plan.name;
    let contractStatus = "Recontracting_NoContract";
    
    let deviceName          = "";
    let contractType        = "";
    let contractStartDate   = "";
    let contractEndDate     = "";
    let contractDuration    = "";
    let prime               = "";
    let entryPlan           = "-";
    let earlyTerminationFee = "";
    let nonReturnFee        = "";
    let extendedDate        = "-";
    let hasActiveDeviceContract = false; 

    let contractText = {"K2":"Normal Contract", "Zerolution360":"Zerolution 360 Contract","Zerolution":"Zerolution Contract"}

    if ("device" in  accData.accounts[0].msisdns[0]) 
    {
        
        deviceName          = accData.accounts[0].msisdns[0].device.name;
        contractType        = accData.accounts[0].msisdns[0].device.contractType;
        contractStartDate   = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractStartDate);
        prime               = accData.accounts[0].msisdns[0].bundleType;  
        contractEndDate     = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractEndDate);
        
        hasActiveDeviceContract = UTIL.hasActiveDeviceContract(accData.accounts[0].msisdns[0].device.contractEndDate);
        console.log(`Recontracting | START | hasActiveDeviceContract: ${hasActiveDeviceContract}`);

        if(hasActiveDeviceContract){
            if ("deviceReturnEndDate" in accData.accounts[0].msisdns[0].device && accData.accounts[0].msisdns[0].device.deviceReturnEndDate != undefined && accData.accounts[0].msisdns[0].device.deviceReturnEndDate != "")
            {
                let ReturnEndDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.deviceReturnEndDate);
                extendedDate      = ReturnEndDate;
    
                if (contractType == "Zerolution") contractEndDate = ReturnEndDate;            
            }
        }        

        contractDuration = accData.accounts[0].msisdns[0].device.contractDuration;
        contractStatus   = "Recontracting_NoContract";

        if(hasActiveDeviceContract){
            if (contractType == "K2")           contractStatus = "Recontracting_Details_K2";
            if (contractType == "Zerolution")   contractStatus = "Recontracting_Details_Zerolution";
            if (contractType == "Zerolution360")contractStatus = "Recontracting_Details_Zerolution360";
        }


        if (penData.contractPenalty.penalties.length > 0)
        {
            if (penData.contractPenalty.penalties[0].contractAttributes.attributes.length > 0)
            {
                let planName = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter(e=>e.name == "EntryPointPlanName");
                if (planName.length > 0)
                {
                    entryPlan = planName[0].value;
                }
            }
            
            earlyTerminationFee = "• Early Termination Fee: RM" + UTIL.ToCurrency(penData.contractPenalty.penalties[0].etfAmount);
            const nonReturnFeeList = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter((e) => e.name === 'Device_Non-Return_Fee');
            if (nonReturnFeeList.length > 0){
                earlyTerminationFee = earlyTerminationFee + "\n• Device Non Return Fee: RM" + UTIL.ToCurrency(nonReturnFeeList[0].value);
            }
        }        
    }

    let returnParam = {
        "msisdn"            : UTIL.ToMobileNumber(msisdn),
        "ratePlanName"      : ratePlanName,
        "deviceName"        : deviceName,
        "contractType"      : contractType,
        "contractStartDate" : UTIL.ToDD_MMM_YYYY(contractStartDate),
        "contractEndDate"   : UTIL.ToDD_MMM_YYYY(contractEndDate),
        "contractDuration"  : contractDuration,
        "prime"             : prime == "NA" ? "No" : "Yes",
        "contractTypeText"  : contractText[contractType],
        "durationLeft"      : UTIL.GetDateDiffInMonths(new Date(contractEndDate), new Date()),
        "earlyTerminationFee" : earlyTerminationFee,
        "nonReturnFee"      : nonReturnFee,
        "extendedDate"      : UTIL.ToDD_MMM_YYYY(extendedDate)
    };

    if (entryPlan != "-" || entryPlan != "")
    {
        returnParam["entryPlan"] = entryPlan;
    }

    return UTIL.ComposeResult("",contractStatus,returnParam);

}


exports.Device_Discovery = async function(event) {

    return UTIL.ComposeResult("","Greeting_DeviceDiscoverAndPurchase");

}