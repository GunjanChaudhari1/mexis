const SESSION   = require("./Handler_Session")
const UTIL      = require("./Util")
const HOST    = require("./Handler_Host");


async function CacheHelper(sessionID,msisdn, key, value){
    
    let Cache = await SESSION.GetCache(sessionID);
    Cache[key] = value;
    await SESSION.SetCache(sessionID, Cache);
}

async function getCustomerforWifi(msisdn, sessionID) {
    let url  = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
    let head = {
        "method" : "POST",
        "headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT", "languageid":"en-US"},
        "body" : JSON.stringify( {
            "searchtype":"MSISDN",
            "searchvalue": msisdn,
            "prinSuppValue": true,
            "isGetSupplementary": true,
            "isPrincipalPlanName": false,
            "isLookupAllAccount": false,
            "isIndividual": 1,
            "isSubscription": true,
            "isIncludeOfferingConfig":false,
            "isCustomerProfile":false,
            "familyType": false
            })
    };
    
    let data = await UTIL.GetUrl(url,head,msisdn,sessionID);
    console.log(`Data fetched!!! ${data}`)
    return data.responseData;
  }


async function checkFibreStatus(msisdn, modemId) {
    // Add API to check fibre service status
    let url  = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/checkfiberstatus?modemId=${modemId}&actionType=ACCOUNT_ACTIVE&isCreateInteraction=false`;
        let head = {
            "method" : "GET",
            "headers": {"Content-Type" : "application/json", "channel": "MAXBOT"}
        };
        
        let data = await UTIL.GetUrl(url, head);
        try{
                if (data.status == "success"){
                        return true;     
                }
                else if (data.status == "fail"){
                        // return true;
                        return false;
                }
                else {
                        console.log("This fibre status API is not working as expected!!!");
                        // return true;
                        return false;        
                }
        }
        catch(err){
                console.log("This API is not working");
                return false;
        }
}  

async function checkFibreCompatibility(msisdn, modemId, fibreStatus) {
    // Add API to check if customer modem supports reboot feature
    let url  = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/settings?modemId=${modemId}&arrInfoType=FEATURES&languageId=en-US`;
    let head = {
        "method" : "GET",
        "headers": {"Content-Type" : "application/json", "channel": "MAXBOT"}
    };
    let fiberFeatures = {"periodicReboot": false, "rebootRouter": false, "wifi": false}
    
    if(fibreStatus){

        let data = await UTIL.GetUrl(url, head);


        try{
                fiberFeatures.wifi = data.responseData.featuresList.wifiInfo;
                fiberFeatures.periodicReboot = data.responseData.featuresList.periodicReboot;
                fiberFeatures.rebootRouter = data.responseData.featuresList.action[0] == "reboot";
                console.log(`Features detected for ModemID: ${modemId} - ${JSON.stringify(fiberFeatures)}`);
                return fiberFeatures;
        }
        catch(err) {
                console.log("This API is not working as expected!!! ", err);
                return fiberFeatures;        
        }
    }
    else{
        console.log("Fibre Status is false!!!");
        return fiberFeatures;        

    }
}

async function checkCPE(sessionID, msisdn, modemId, fibreStatus) {
    // Add CPE check api
    let url  = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/settings?modemId=${modemId}&arrInfoType=WIFI&languageId=en-US`;
    let head = {
        "method" : "GET",
        "headers": {"Content-Type" : "application/json", "channel": "MAXBOT"}
    };
    if(fibreStatus){
        let data = await UTIL.GetUrl(url, head);
        let wifiList = {};
        let wifiResp = "";
        if (data.status == "success"){
            for (const router in data.responseData.wifiDetlList){
                wifiResp = wifiResp + `
                    ${router.channelBand}GHz
                    WiFi Name: ${router.username}
                    WiFi Password: ${router.password}
                
                `
                wifiList[router.channelBand] = {"username": username}
            }
            await CacheHelper(sessionID, msisdn, `WifiBandList_${modemId}`, wifiList)
            console.log("Wifi details updated!!")
            return {"status": true, "wifiList": wifiResp}
        }
        else{
            console.log("CPE check not working in change WIFI flow");
            return {"status": false, "wifiList": wifiResp}
        }
    }
    else{
        console.log("Fibre Status is false!!!");
        return {"status": false, "wifiList": ""}

    }
}

async function changeWifiSettings(msisdn, modemId, channelBand, username="", password=""){    
    let url = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/settings`

    let body = {
        "modemId": modemId,
        "actionType": "WIFI",
        "channelBand": channelBand,
        "username": username
    }

    if (password != ""){
        body["password"] = password
    }

    let head = {
        method :"PUT",
        body : JSON.stringify(body),
        headers: {"Content-Type" : "application/json", "channel": "MAXBOT"}
    };

    let data = await UTIL.GetUrl(url,head);

    return data.status == "fail" ? false : true;
}

function getList(object){
  
    let items = [];

    object.forEach(e => {
      items.push({"plan":e.plan.name, "serviceId": e.serviceId});
    });
  
    return items;
}

exports.ManageRouter_Start_Wh =  async function (event) {
        
    
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    console.log("Change Wifi flow started. Got msisdn!!");
    

    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
    if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
    //-------------------------------------------------------------------------------    
    msisdn = await SESSION.GetMSISDN(sessionID);
    console.log("TAC Authenticated")
    let Cache = await SESSION.GetCache(sessionID)

    console.log("******ManageRouter_Start_Wh******", JSON.stringify(Cache));
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
            //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
            return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }
    
    let cusData = await getCustomerforWifi(msisdn,sessionID);
    let ftths   = cusData.accounts[0].msisdns.filter(x => x.serviceType=="FTTH");
    
    console.log(`Customer data info ${cusData.accounts}`);
    console.log(`Fibre list info ${ftths}`);
    
    // if (ftths.length == 0)
    // {       
    //         console.log("Routing to NRIC!!")
    //         return UTIL.ComposeResult("","RouterReboot_NoFibre_NRIC");
    // }
    try {
            if (ftths.length > 1)      
            {
                    // to use in next RouterReboot_fibreId
                    console.log("Routing to fibre account list!!!")
                    let modemArr  = getList(ftths);

                    Cache["modemArr"] = modemArr;
                    await SESSION.SetCache(sessionID,Cache);

                    let modemList = UTIL.GetNumberedMenu(modemArr.map(e=>`${e.plan} - ${e.serviceId}`));

                    return UTIL.ComposeResult("","ChangeWifi_Setting_FibreAccountList", {"fibreIdList": modemList})
            }
            else if (ftths.length == 1){

                    // Add API to check fibre service status
                    let fibreStatus = await checkFibreStatus(msisdn, ftths[0].serviceId) // return true/ false
                    // Add API to check if customer modem supports reboot feature
                    let fibreCompatibility = await checkFibreCompatibility(msisdn, ftths[0].serviceId, fibreStatus) // return true/ false
                    // Add CPE check api
                    let cpe = await checkCPE(sessionID,msisdn, ftths[0].serviceId, fibreCompatibility.wifi) // return true/ false

                    if (cpe.status == true && fibreStatus == true && fibreCompatibility.wifi == true){
                        console.log("Routed to manage router select in fibre ID intent");
                        return UTIL.ComposeResult("","ChangeWifi_Settings", {"fibreId": ftths[0].serviceId, "WifiList": cpe.wifiList})
                    }
                    else{
                        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
                    }      
                    
            }
            else {
                console.log("No modem Found!!");
                // return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
            }
    }
    catch(err){
        console.log("Error handling flow is triggered");
        console.log(err);
        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
    }
}

exports.ChangeWifi_fibreId = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
    let modemSelection = UTIL.GetParameterValue(event,"fibreSelection");
    let cache     = await SESSION.GetCache(sessionID)
    let modemArr  = cache.modemArr;
    let modemItem = modemArr[modemSelection-1];

    if (modemSelection == "*")
      return UTIL.ComposeResult("","Greeting_Start1");
  
  
    if (modemItem != undefined)
    {
    
        // Add API to check fibre service status
        let fibreStatus = await checkFibreStatus(msisdn, modemItem.serviceId) // return true/ false
        // Add API to check if customer modem supports reboot feature
        let fibreCompatibility = await checkFibreCompatibility(msisdn,modemItem.serviceId, fibreStatus) // return true/ false
        // Add CPE check api
        let cpe = await checkCPE(sessionID,msisdn, modemItem.serviceId, fibreCompatibility.wifi) // return true/ false

        // Add API to get Wifi band name and password list using fibreid or msisdn    
        if (cpe.status == true && fibreStatus == true && fibreCompatibility.wifi == true){
            console.log("Routed to manage router select in fibre ID intent");
            return UTIL.ComposeResult("","ChangeWifi_Settings", {"fibreId": modemItem.serviceId, "WifiList": cpe.wifiList})
        }
        else{
            return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
        }
    }       
    else
    {
      let modemList = UTIL.GetNumberedMenu(modemArr.map(e=>`${e.plan} - ${e.serviceId}`));
      return UTIL.ComposeResult("","ChangeWifi_Setting_FibreAccountList", {"fibreIdList" : modemList, fallbackMessage: FALLBACK_MESSAGE});
    }

  }

exports.ChangeWifi_Password_NewPassword_Confirm_Wh = async function (event, isBM=false) {
    let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
    let newpwd = UTIL.GetParameterValue(event, "newpwd");
    let GHz = UTIL.GetParameterValue(event, "GHz");
    let fibreId = UTIL.GetParameterValue(event, "fibreId");
    
    let Cache = await SESSION.GetCache(sessionID);
    
    let wifiList = Cache[`WifiBandList_${fibreId}`]
    let newName = wifiList[GHz].username;

    let fibreBand = GHz == "2.4" ? 0 : 1;
    console.log(`Fibre band ${fibreBand} for ${GHz} Ghz`);
    //add ACS update api to add password entered by user
    let isUpdate = await changeWifiSettings(msisdn, fibreId, fibreBand, newName, newpwd);
    
    let followUpEvent = isUpdate ? "ChangeWifi_Password_Updated_END" : "Shared_Tech_IssueServicing"

    return UTIL.ComposeResult("", followUpEvent);
}


exports.ChangeWifi_Name_NewName_Confirm_Wh = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
    let newName = UTIL.GetParameterValue(event, "newNm");
    let GHz = UTIL.GetParameterValue(event, "GHz");
    let fibreId = UTIL.GetParameterValue(event, "fibreId");
    
    let fibreBand = GHz == "2.4" ? 0 : 1;
    console.log(`Fibre band ${fibreBand} for ${GHz} Ghz`);
    
    // Add ACS update to change name
    let isUpdate = await changeWifiSettings(msisdn, fibreId, fibreBand, newName);
    // let followUpEvent = isUpdate ? "ChangeWifi_Name_Updated_END" : "Shared_Tech_IssueServicing"
    
    if (isUpdate)
        return UTIL.ComposeResult("", "ChangeWifi_Name_Updated_END", {"newNm": newName});
    else
        return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    
}


// ------------------------------------------------------------------------------------------

