const UTIL      = require("./Util")
const SESSION   = require("./Handler_Session");



exports.HandOver =  async function (event, isBM = false) {
    let sessionID = UTIL.GetSessionID(event);
    let agentStartDay   = UTIL.GetParameterValue(event,"agentStartDay");
    let agentEndDay     = UTIL.GetParameterValue(event, "agentEndDay");
    let agentStartTime  = UTIL.GetParameterValue(event,"agentStartTime");
    let agentEndTime    = UTIL.GetParameterValue(event,"agentEndTime");
    let agentId         = UTIL.GetParameterValue(event,"agentCategoryId");
        
    if ( UTIL.IsAgentOnline(agentStartDay, agentEndDay, agentStartTime, agentEndTime) )
    {
        await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId});
      
        if (isBM)
            return UTIL.ComposeResult("","continue_bahasa_malaysia");
        else
            return UTIL.ComposeResult("","Shared_Agent_Servicing_Online");
    }
    else
    {
        let param = {
            "agentStartDay"  : agentStartDay,
            "agentEndDay"    : agentEndDay,
            "agentStartTime" : agentStartTime,
            "agentEndTime"   : agentEndTime,
        };
        
        await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId});

        if (isBM)
            return UTIL.ComposeResult("","continue_bahasa_malaysia");
        else
            return UTIL.ComposeResult("","Shared_Agent_Servicing_Offline",param);
    }
}

exports.NetworkHandOver =  async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let agentStartDay   = UTIL.GetParameterValue(event,"agentStartDay");
    let agentEndDay     = UTIL.GetParameterValue(event, "agentEndDay");
    let agentStartTime  = UTIL.GetParameterValue(event,"agentStartTime");
    let agentEndTime    = UTIL.GetParameterValue(event,"agentEndTime");
    let agentId         = UTIL.GetParameterValue(event,"agentCategoryId");
    
    if ( UTIL.IsAgentOnline(agentStartDay, agentEndDay, agentStartTime, agentEndTime) )
    {
        await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId});
        return UTIL.ComposeResult("","Shared_Agent_Network_Online");
    }
    else
    {
        let param = {
            "agentStartDay"  : agentStartDay,
            "agentEndDay"    : agentEndDay,
            "agentStartTime" : agentStartTime,
            "agentEndTime"   : agentEndTime,
        };
        
        await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId});
        return UTIL.ComposeResult("","Shared_Agent_Network_Offline",param);
    }
}
