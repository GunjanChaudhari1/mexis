const UTIL      = require("./Util")
const SESSION   = require("./Handler_Session");
const HOST      = require("./Handler_Host");

async function createLead(msisdn,catId, sessionID)
{
    let url  = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;
    
    let body = {
        "customerName": null,
        "email": null,
        "msisdn": msisdn,
        "leadCatId": catId,
        "sourceId": "MAXBOT",
        "channelCode": "MAXBOT",        
        "dealerCode": "MAXBOT",
        "userId": "MAXBOT"
    };

    console.log(body);

    let head = {
      method :"POST",
      body   : JSON.stringify(body),
      headers: {"Content-Type" : "application/json"}
    };
    
    let data = await UTIL.GetUrl(url,head,msisdn,sessionID);

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
        console.log("Issue in api");
        return "General";
    }
}

exports.HandOver =  async function (event, isBM = false) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let agentStartDay   = UTIL.GetParameterValue(event,"agentStartDay");
    let agentEndDay     = UTIL.GetParameterValue(event, "agentEndDay");
    let agentStartTime  = UTIL.GetParameterValue(event,"agentStartTime");
    let agentEndTime    = UTIL.GetParameterValue(event,"agentEndTime");
    let agentId         = UTIL.GetParameterValue(event,"agentCategoryId");
    let offlineMessage  = UTIL.GetParameterValue(event,"offlineMessage");
    let onlineMessage   = UTIL.GetParameterValue(event,"onlineMessage");
    let shortStartTime  = UTIL.GetParameterValue(event,"shortStartTime");
    let shortEndtime    = UTIL.GetParameterValue(event,"shortEndTime");

    console.log(`agentStartDay=>${agentStartDay}, agentId=${agentId}`);
    

    //check if "Handover" is required, not all sharedagent will carry this parameter. Default to TRUE if parameter not defined in dialogflow 
    //Changes for CR-24-AUG
    let handoverToRc    = UTIL.GetParameterValue(event,"handoverToRc");
        handoverToRc    = handoverToRc == undefined || handoverToRc == "" ? "TRUE" : handoverToRc; //default is TRUE

    let closeIntervention=UTIL.GetParameterValue(event,"closeIntervention");
        closeIntervention=closeIntervention == undefined || closeIntervention == "" ? "FALSE" : closeIntervention; //default is FALSE

    
    let returnEvent = "Shared_Handover_Message";
    let result = "";

    let param = {
        "agentStartDay"  : agentStartDay,
        "agentEndDay"    : agentEndDay,
        "agentStartTime" : agentStartTime,
        "agentEndTime"   : agentEndTime,
        "shortStartTime" : shortStartTime,
        "shortEndtime"   : shortEndtime
    };

    if ( UTIL.IsAgentOnline2(agentStartDay, agentEndDay, agentStartTime, agentEndTime, shortStartTime, shortEndtime))
    {
        param["message"] = onlineMessage;
    }
    else
    {
        param["message"] = offlineMessage;
    }
    
    
    if (handoverToRc.toUpperCase() == "FALSE")
    {
        let lmsCategoryId = UTIL.GetParameterValue(event,"lmsCategoryId");
        result            = await createLead(msisdn, lmsCategoryId, createLead);

        if (result == "Duplicate")
        {
            console.log("Duplicate lead created");
            returnEvent = "Shared_Error_LmsDuplicate";
        }
    }
    else
    {
        console.log("Handover to RC is True");
        let Ori = UTIL.GetIntentDisplayName(event);
        await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId, "OriginalIntent": Ori});
    }

    
    if (closeIntervention.toUpperCase() == "TRUE" && (result == "Success" || result == "Duplicate"))
    {
        //Once Ring-Central "Close" api is called. You can no longer reply text to this tread id. Therefore, no bye bye message is sent.
        console.log(`RC close thread is called`);

        await SESSION.SetClose(sessionID, true);
    }

    return UTIL.ComposeResult("",returnEvent,param);
}


