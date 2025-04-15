const SESSION   = require("./Handler_Session")
const UTIL      = require("./Util")
const HOST      = require("./Handler_Host");


exports.iPhone13_En_CustomerDetails_Wh = async function(event, isBM=false){
        let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
        let customerName        = UTIL.GetParameterValue(event,"customerName");
        let alternateContact    = UTIL.GetParameterValue(event,"alternateContact");
        let customerType        = UTIL.GetParameterValue(event,"customerType");
        let model               = UTIL.GetParameterValue(event,"model");
        let agentStartDay       = UTIL.GetParameterValue(event,"agentStartDay");
        let agentEndDay         = UTIL.GetParameterValue(event,"agentEndDay");
        let agentStartTime      = UTIL.GetParameterValue(event,"agentStartTime");
        let agentEndTime        = UTIL.GetParameterValue(event,"agentEndTime");
        let shortStartTime      = UTIL.GetParameterValue(event,"shortStartTime");
        let shortEndTime        = UTIL.GetParameterValue(event,"shortEndTime");
        let onlineMessage       = UTIL.GetParameterValue(event,"onlineMessage");
        let offlineMessage      = UTIL.GetParameterValue(event,"offlineMessage");
        let agentCategoryId     = UTIL.GetParameterValue(event,"agentCategoryId");

        if (isBM)
                customerType = customerType.toUpperCase() == "NEW" ? "Pelanggan Baru" : "Sedia Ada";
        else
                customerType = customerType.toUpperCase() == "NEW" ? "New Customer" : "Existing Customer";

        let phoneModel   = UTIL.GetParameterValue(event,"model" + model);       
        let returnEvent = isBM ? "iPhone13_Bm_Closing" : "iPhone13_En_Closing"; 
        
        if ( UTIL.IsAgentOnline2(agentStartDay, agentEndDay, agentStartTime, agentEndTime, shortStartTime, shortEndTime))
        {
                param = onlineMessage;
        }
        else
        {
                param = offlineMessage;
        }

        //console.log("agent cat id",agentCategoryId);
        
        await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentCategoryId.replace(" ","")});

        return UTIL.ComposeResult("", returnEvent, {"closingMessage":param, "phoneModel":phoneModel, "customerName": customerName, "alternateContact":alternateContact, "customerType":customerType, "msisdn" : msisdn});
}