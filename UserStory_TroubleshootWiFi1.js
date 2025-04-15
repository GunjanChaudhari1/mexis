const UTIL    = require("./Util")
const SESSION = require("./Handler_Session");
const HOST    = require("./Handler_Host");

const FALLBACK_MESSAGE = process.env.FALLBACK_MESSAGE;

function AssignFallBack(param) {
  return param["fallbackMessage"] = FALLBACK_MESSAGE;
}

async function createLead(msisdn, lmsCategoryId, sessionID)
{
    let url  = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;
   
    let body = {
        "customerName": null,
        "email": null,
        "msisdn": msisdn,
        "leadCatId": lmsCategoryId,
        "sourceId": "MAXBOT",
        "channelCode": "MAXBOT",        
        "dealerCode": "MAXBOT",
        "userId": "MAXBOT",
        "otherComment": "ROI for Maxis MESH Wifi"
    };

    let head = {
      method :"POST",
      body   : JSON.stringify(body),
      headers: {"Content-Type" : "application/json"}
    };
    
    let data = await UTIL.GetUrl(url,head,msisdn, sessionID);

    try
    {
      if (data.status == "fail")
      {
          return data.violations[0].code == 102 ? "Duplicate" : "General";
      }
      else
      {
          return "Success";
      }
    }
    catch
    {
      return "General";
    }
}


async function InvokeFiberDiagnostic(sessionID, msisdn) {
  //0 - Development
  //1 - Production
  
  let apiId = HOST.TARGET == 0  ? "nx5rbzdio4" : "avezebzouc";
  let apiky = HOST.TARGET == 0  ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin" : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
  let url   =  HOST.TARGET == 0 ? "https://maxbot-uat.maxis.com.my/dev/MaxisCallback" : "https://maxbot.maxis.com.my/prod/diagnostic";
  
  let head = {
    "headers": {"x-apigw-api-id" : apiId,"x-api-key": apiky},
    "method" : "POST",
    "body"   : JSON.stringify({
      "requestID":"-1",
      "actionType":"-1",
      "status":"-1",
      "msisdn":msisdn,
      "FiberDiagnostic":"FiberDiagnostic",
      "sessionID":sessionID
    }) 
  };

  let data = await UTIL.GetUrl(url,head,);
  return data;

}

async function getCustomerforWifi(sessionID, msisdn) {
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
      
  return data.responseData;
}

function getList(object){
  let items = [];
  object.forEach(e => {
    items.push({"plan":e.plan.name, "serviceId": e.serviceId});
  });
  return items;
}


exports.DiagnosticCheck =  async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache   = await SESSION.GetCache(sessionID);
  console.log("******exports.DiagnosticCheck before******", JSON.stringify(Cache));
  if (Cache.getCustomerforNRICPassport) {
    try{
        let ftths   = Cache.getCustomerforNRICPassport.responseData.accounts[0].msisdns.filter(x => x.serviceType=="FTTH" && x.status=="active");
        console.log("******exports.DiagnosticCheck after******", JSON.stringify(Cache));
        if (ftths.length == 0)
        {
          return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_NoFibreService");
        }

        if (ftths.length > 1)      
        {
          let modemArr  = getList(ftths);

          Cache["modemArr"] = modemArr;
          //await SESSION.SetCache(sessionID,Cache);

          let modemList = UTIL.GetNumberedMenu(modemArr.map(e=>`${e.serviceId} - ${e.plan}`));
          Cache["modemlist"] = modemList
          await SESSION.SetCache(sessionID,Cache)


          return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_ModemId", {"modemIdList": modemList })
        }
        else
        {
          Cache.SelectedModemId=ftths[0].serviceId
          await SESSION.SetCache(sessionID,Cache)
          return UTIL.ComposeResult("","IRTR_RouterImageToEaseTroubleshooting_ImageGuideLine",{"modemId": ftths[0].serviceId})
          //return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_Confirmation", {"modemId": ftths[0].serviceId})
        }
      }
      catch (err) {
        console.log("Error handling flow is triggered");
        console.log(err);
        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
      }
  }
  else {
    
      //------------------------------------------------------------------------------
      //🔐EXECUTE AUTHENTICATION
      //------------------------------------------------------------------------------
      let redirectToEvent = await UTIL.Authenticate(event,msisdn, sessionID);
      if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
      //-------------------------------------------------------------------------------
      msisdn = await SESSION.GetMSISDN(sessionID);
      let cusData = await getCustomerforWifi(sessionID, msisdn);
      
      console.log("****************[cusData]************", cusData);
      if(cusData==null){
        return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_NoFibreService");
      }
      let ftths   = cusData.accounts[0].msisdns.filter(x => x.serviceType=="FTTH");
      console.log("****************[ftths]************", ftths);
      if (ftths.length == 0)
      {
        console.log("****************[ftths]************", 0000);
        return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_NoFibreService");
      }

      if (ftths.length > 1)      
      {
        console.log("****************[ftths]************", 2222);
        let modemArr  = getList(ftths);

        Cache["modemArr"] = modemArr;

        let modemList = UTIL.GetNumberedMenu(modemArr.map(e=>`${e.serviceId} - ${e.plan}`));
        Cache["modemlist"] = modemList
        await SESSION.SetCache(sessionID,Cache);


        return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_ModemId", {"modemIdList": modemList })
      }
      else
      {
        Cache.SelectedModemId=ftths[0].serviceId
        await SESSION.SetCache(sessionID,Cache)
        console.log("****************[ftths]************", 3333);
        return UTIL.ComposeResult("","IRTR_RouterImageToEaseTroubleshooting_ImageGuideLine",{"modemId": ftths[0].serviceId})
        //return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_Confirmation", {"modemId": ftths[0].serviceId})
      }
  }
  }
 

exports.DiagnosticCheck_ModemId = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let Cache   = await SESSION.GetCache(sessionID);
  let modemSelection = UTIL.GetParameterValue(event, "modemSelection");
  let modemlist=Cache["modemlist"]
  console.log("modemlist👓",modemlist)

  if (isNaN(modemSelection) ||modemSelection<=0 || modemSelection>modemlist.length){
    return exports.DiagnosticCheck(event)
  }
  
  let modemArr = Cache.modemArr;
  let modemItem = modemArr[modemSelection - 1];
  Cache.SelectedModemId = modemItem.serviceId
  await SESSION.SetCache(sessionID, Cache)
  return UTIL.ComposeResult("","IRTR_RouterImageToEaseTroubleshooting_ImageGuideLine",{"modemId": modemItem.serviceId})
  //return UTIL.ComposeResult("","Network_Fibre_SlowWifi_DiagnosticCheck_Confirmation", {"modemId": modemItem.serviceId})
}

exports.DiagnosticCheck_Yes = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn  = await SESSION.GetMSISDN(sessionID);
  let Cache     = await SESSION.GetCache(sessionID);
  let VirusResult = Cache.ImageVirus
  let IRImageUp =Cache['IRImageUp']
  let IRAttemptsExceeded =Cache["IRAttemptsExceeded"]
  let followupEvent ="Network_Fibre_SlowWifi_DiagnosticCheck_InProgress"
  let modemId =''

  if(Cache.DiagnosticSummary){
    console.log("Cache Before >> ", Cache.DiagnosticSummary)
    Cache.DiagnosticSummary = undefined;
    await SESSION.SetCache(sessionID, Cache);
    console.log("Cache After >> ", Cache.DiagnosticSummary)
  }

  if(VirusResult != undefined && VirusResult == true){
    modemId =Cache.SelectedModemId
    followupEvent = 'Shared_Image_Attachement_Virus'
  } else if(IRImageUp!=true){
    modemId = UTIL.GetParameterValue(event, "modemId");
    Cache["SelectedModemId"] = modemId;
    Cache['NoIREnableDiagnostic'] = true
    console.log("ModemID Image not uploaded",modemId);
    if (IRAttemptsExceeded== true){
      console.log("modemid when exceeded attempts",modemId);
      followupEvent ="IRTR_Network_Fibre_SlowWifi_DiagnosticCheck_AttemptsExceeded_InProgress"
      
    }
    await SESSION.SetCache(sessionID,Cache)
  
  }else{
    
    modemId =Cache["SelectedModemId"]
    console.log("modemId when Image uploaded");
    console.log("IRAttemptes>>>>>>>>>",IRAttemptsExceeded)
    if (IRAttemptsExceeded== true){
      modemId = UTIL.GetParameterValue(event, "modemId");
      console.log("modemid when exceeded attempts",modemId);
      followupEvent ="IRTR_Network_Fibre_SlowWifi_DiagnosticCheck_AttemptsExceeded_InProgress"
      
    }
    console.log("ModemID",modemId);
  }
  console.log("final modem id",modemId);
  await InvokeFiberDiagnostic(sessionID,msisdn); 
  console.log("followupEvent",followupEvent);
  
  return UTIL.ComposeResult("",followupEvent)
  
}

exports.TooManyDevices_MeshWifi = async function (event) {
  
  let sessionID = UTIL.GetSessionID(event);
  let msisdn  = await SESSION.GetMSISDN(sessionID);
  let lmsCategoryId       = UTIL.GetParameterValue(event,"lmsCategoryId");
  let agentStartDay       = UTIL.GetParameterValue(event,"agentStartDay");
  let agentEndDay         = UTIL.GetParameterValue(event,"agentEndDay");
  let agentStartTime      = UTIL.GetParameterValue(event,"agentStartTime");
  let agentEndTime        = UTIL.GetParameterValue(event,"agentEndTime");
  let shortStartTime      = UTIL.GetParameterValue(event,"shortStartTime");
  let shortEndTime        = UTIL.GetParameterValue(event,"shortEndTime");
  let onlineMessage       = UTIL.GetParameterValue(event,"onlineMessage");
  let offlineMessage      = UTIL.GetParameterValue(event,"offlineMessage");
  let param = "";

  let result = await createLead(msisdn,lmsCategoryId, sessionID);

  if ( UTIL.IsAgentOnline2(agentStartDay, agentEndDay, agentStartTime, agentEndTime, shortStartTime, shortEndTime))
  {
          param = onlineMessage;
  }
  else
  {
          param = offlineMessage;
  }
  
  let returnEvent = "Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_TooManyDevices_Telesales";
  if (result == "Duplicate") returnEvent = "Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_TooManyDevices_Duplicate";
  if (result == "General")   returnEvent = "Shared_Tech_IssueServicing";


  return UTIL.ComposeResult("",returnEvent,{message:param});
  
}

