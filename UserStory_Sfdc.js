const SESSION   = require("./Handler_Session")
const UTIL      = require("./Util")
const HOST      = require("./Handler_Host");



async function createLead(msisdn, body,sessionID)
{
    let url  = `${HOST.SFDC[HOST.TARGET]}/leads/api/v1.0/leads/enterprise`;

    let head = {
      method :"POST",
      body   : JSON.stringify(body),
      headers: {"Content-Type" : "application/json"}
    };
    
    let data = await UTIL.GetUrl(url,head,msisdn,sessionID);

    return data.status == "fail" ? false : true;
}

async function CacheHelper(sessionID, msisdn,value,key)
{
        let Cache = await SESSION.GetCache(sessionID);
        Cache[value] = key;
        await SESSION.SetCache(sessionID,Cache);
}

exports.Sfdc_CompanyEligibility_Wh =  async function (event, isBM=false) {
        let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);

        let eligibility = UTIL.GetParameterValue(event, "eligibility");
        
        await CacheHelper(sessionID, msisdn,"eligibility",UTIL.GetParameterValue(event,"eligibility" + eligibility))

        if (isBM)
                return UTIL.ComposeResult("", "Sfdc_Bm_CompanyRegion");       
        else
                return UTIL.ComposeResult("", "Sfdc_En_CompanyRegion");       
}

exports.Sfdc_CompanyRegion_Wh= async function(event, isBM=false){
        let region   = UTIL.GetParameterValue(event, "region");
        
        regionEnEvents = ["","Sfdc_En_CompanyRegionCentral","Sfdc_En_CompanyRegionSouthern","Sfdc_En_CompanyRegionNorthern","Sfdc_En_CompanyRegionEastCoast", "Sfdc_En_CompanyRegionSabah","Sfdc_En_CompanyDetails"];
        regionBmEvents = ["","Sfdc_Bm_CompanyRegionCentral","Sfdc_Bm_CompanyRegionSouthern","Sfdc_Bm_CompanyRegionNorthern","Sfdc_Bm_CompanyRegionEastCoast", "Sfdc_Bm_CompanyRegionSabah","Sfdc_Bm_CompanyDetails"];
        
        if (isBM)
                return UTIL.ComposeResult("", regionBmEvents[region]);       
        else
                return UTIL.ComposeResult("",  regionEnEvents[region]);       
}

exports.Sfdc_CompanyRegionCentral_Wh= async function(event, isBM=false){
        let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);

        let state   = UTIL.GetParameterValue(event, "state");
        await CacheHelper(sessionID, msisdn,"state",UTIL.GetParameterValue(event,"state" + state))

        if (isBM)
                return UTIL.ComposeResult("", "Sfdc_Bm_CompanyDetails");       
        else
                return UTIL.ComposeResult("", "Sfdc_En_CompanyDetails");  
     
}

exports.Sfdc_CompanyDetails= async function(event, isBM=false){
        let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);

        let customerName        = UTIL.GetParameterValue(event,"customerName");
        let companyName         = UTIL.GetParameterValue(event,"companyName");
        let companyAddress      = UTIL.GetParameterValue(event,"companyAddress");
        let contactNumber       = UTIL.GetParameterValue(event,"contactNumber");
        let eligibleMessage     = UTIL.GetParameterValue(event,"eligibleMessage");
        let agentStartDay       = UTIL.GetParameterValue(event,"agentStartDay");
        let agentEndDay         = UTIL.GetParameterValue(event,"agentEndDay");
        let agentStartTime      = UTIL.GetParameterValue(event,"agentStartTime");
        let agentEndTime        = UTIL.GetParameterValue(event,"agentEndTime");
        let shortStartTime      = UTIL.GetParameterValue(event,"shortStartTime");
        let shortEndTime        = UTIL.GetParameterValue(event,"shortEndTime");
        let onlineMessage       = UTIL.GetParameterValue(event,"onlineMessage");
        let offlineMessage      = UTIL.GetParameterValue(event,"offlineMessage");
        
        let compaignId          = UTIL.GetParameterValue(event,"sfCampaignId");
        let areaOfInterest      = UTIL.GetParameterValue(event,"sfProductOfInterestEligible");
        let salesOpportunity    = UTIL.GetParameterValue(event,"sfProductGroupEligible");
        
         //check for Close Intervention----------------------------------------------------------------------------
         let closeIntervention=UTIL.GetParameterValue(event,"closeIntervention");
         closeIntervention=closeIntervention == undefined || closeIntervention == "" ? "FALSE" : closeIntervention; //default is FALSE
 

         let Cache       = await SESSION.GetCache(sessionID);
         let eligibility = Cache["eligibility"];
         let state       = Cache["state"];
         
        

        let param = UTIL.IsAgentOnline2(agentStartDay, agentEndDay, agentStartTime, agentEndTime, shortStartTime, shortEndTime) ? onlineMessage : offlineMessage
        
        if (eligibility.toUpperCase() == "NO") {
                eligibleMessage  =  "";
                salesOpportunity = UTIL.GetParameterValue(event,"sfProductGroupNonEligible");
                areaOfInterest   = UTIL.GetParameterValue(event,"sfProductOfInterestNonEligible");     
        } 
        
        let returnParam = {"closingMessage":param,"eligibleMessage" : eligibleMessage }

        let body = {
        "organization": {
                "name": companyName,                     
                "location": state,                      
        },
        "contactPerson": {
                "name": customerName,
                "mobileNumber": contactNumber
        },
        "salesChannel": "MAXBOT",                     
        "salesOpportunity": salesOpportunity,
        "campaignId": compaignId,
        "areaOfInterest": areaOfInterest
        }; 
       
        let isSuccess = await createLead(msisdn,body, sessionID);

        if (isSuccess)
        {
                if (closeIntervention.toUpperCase() == "TRUE")
                {
                        //Once Ring-Central "Close" api is called. You can no longer reply text to this tread id. Therefore, no bye bye message is sent.
                        await SESSION.SetClose(sessionID, true);
                }
                
                return UTIL.ComposeResult("", isBM ? "Sfdc_Bm_Closing" : "Sfdc_En_Closing" , returnParam);       
        }
        else
        {
                //return UTIL.ComposeResult("", isBM ? "Sfdc_Bm_Closing" : "Sfdc_En_Closing" , returnParam);       
                return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");       
        }

        
}

