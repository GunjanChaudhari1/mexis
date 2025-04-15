const UTIL = require("./Util")
const HOST = require("./Handler_Host");
const SESSION = require("./Handler_Session");

async function validinput(str) {

    if ((str.length == 12 || str.length == 11 || str.length == 10) && (str.startsWith("6", 0)||str.startsWith("0", 0))) {

        console.log("length of phone number is true");

        return true

    }

    else {
        return false

    }
}                            

async function createLead(msisdn, LeadCatalogID , Name)
{
    let url  = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;
    let body = {
        "address": null,
        "channelCode": "MAXBOT",
        "concent": false,
        "customerName": Name,
        "dealerCode": "MAXBOT",
        "email": "",
        "followUpDate": null,
        "leadCatId": LeadCatalogID,
        "msisdn": msisdn,
        "product" : null,
        "state": null,
        "postcode" : null,
        "userId": "MAXBOT",
        "gaClientId": null,
        "sourceId": "MAXBOT"
    };

    let head = {
      method :"POST",
      body   : JSON.stringify(body),
      headers: {"Content-Type" : "application/json"}
    };
    
    let data = await UTIL.GetUrl(url,head);
    return data.message;
}

exports.PortIn_Initiation_Name_Wh= async function (event, intentName="MaxisPostpaid") {
    let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
    if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
    //-------------------------------------------------------------------------------
    
    // return UTIL.ComposeResult("","PortIn_MaxisPostpaid_CustomerName");

    if(intentName == "MaxisPostpaid") return UTIL.ComposeResult("","PortIn_MaxisPostpaid_CustomerName");
    else if(intentName == "MaxisHomeFibre") return UTIL.ComposeResult("","PortIn_MaxisHomeFibre_CustomerName");
    else if(intentName == "HotlinkPostpaid") return UTIL.ComposeResult("","PortIn_HotlinkPostpaid_CustomerName");
    else if(intentName == "HotlinkPrepaid") return UTIL.ComposeResult("","PortIn_HotlinkPrepaid_CustomerName");
}

exports.PortIn_Initiation_Leads_Wh_yes = async function (event) {
    try{
        let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
        let LeadCatalogID = UTIL.GetParameterValue(event, "LeadCatalogID");
        let Name = UTIL.GetParameterValue(event, "Name");

        let LeadsResult = await createLead(msisdn, LeadCatalogID ,Name );
        if(LeadsResult==null){
            console.log(`Leads Created Successfully`);
            if(LeadCatalogID == "PRD1000760") return UTIL.ComposeResult("","PortIn_MaxisPostpaid_LMSCRMLeadCreation_END");
            else if(LeadCatalogID == "PRD1000761") return UTIL.ComposeResult("","PortIn_MaxisHomeFibre_LMSCRMLeadCreation_END");
            else if(LeadCatalogID == "PRD1000762") return UTIL.ComposeResult("","PortIn_HotlinkPostpaid_LMSCRMLeadCreation_END");
            else if(LeadCatalogID == "PRD1000763") return UTIL.ComposeResult("","PortIn_HotlinkPrepaid_LMSCRMLeadCreation_END");

        }
        else if(LeadsResult=="Duplicate lead found"){
            console.log(`Duplicate Leads Creation ---inside else`);
            return UTIL.ComposeResult("","Shared_Duplicate_LMSCRMLeadSubmission");
        // if(LeadCatalogID == "PRD1000760") return UTIL.ComposeResult("","PortIn_MaxisPostpaid_Error");
            //else if(LeadCatalogID == "PRD1000761") return UTIL.ComposeResult("","PortIn_MaxisHomeFibre_Error");
            //else if(LeadCatalogID == "PRD1000762") return UTIL.ComposeResult("","PortIn_HotlinkPostpaid_Error");
            //else if(LeadCatalogID == "PRD1000763") return UTIL.ComposeResult("","PortIn_HotlinkPrepaid_Error");
        }
        else{
            return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
        }
    }
    catch (e)
    {
        console.log(e)    
        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");

    }
    }

exports.PortIn_Initiation_Leads_Wh_no = async function (event) {
    try{
        let PhoneNumber = UTIL.GetParameterValue(event, "PhoneNumber");
        let LeadCatalogID = UTIL.GetParameterValue(event, "LeadCatalogID");
        let Name = UTIL.GetParameterValue(event, "Name");
        console.log(typeof(PhoneNumber));
        console.log("Logging Phonenumber and CATID", PhoneNumber, LeadCatalogID);
        PhoneNumber = PhoneNumber.toString();
        console.log(".toString--",typeof(PhoneNumber));
        console.log(PhoneNumber);
        
        let valinp=await validinput(PhoneNumber);        
        if(valinp==true)
        {
            let LeadsResult = await createLead(PhoneNumber, LeadCatalogID , Name);
            if (LeadsResult==null){
                console.log(`Leads Created Successfully`);
                if(LeadCatalogID == "PRD1000760") return UTIL.ComposeResult("","PortIn_MaxisPostpaid_LMSCRMLeadCreation_END");
                else if(LeadCatalogID == "PRD1000761") return UTIL.ComposeResult("","PortIn_MaxisHomeFibre_LMSCRMLeadCreation_END");
                else if(LeadCatalogID == "PRD1000762") return UTIL.ComposeResult("","PortIn_HotlinkPostpaid_LMSCRMLeadCreation_END");
                else if(LeadCatalogID == "PRD1000763") return UTIL.ComposeResult("","PortIn_HotlinkPrepaid_LMSCRMLeadCreation_END");

            }
        else if(LeadsResult=="Duplicate lead found"){
            console.log(`Duplicate Leads Creation ---inside else`);
            return UTIL.ComposeResult("","Shared_Duplicate_LMSCRMLeadSubmission");
            }
        else{
                return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
            }
        }
            
        else if(valinp==false){
            console.log(`Leads Creation failed---inside else`);
            if(LeadCatalogID == "PRD1000760") return UTIL.ComposeResult("","PortIn_MaxisPostpaid_Error");
            else if(LeadCatalogID == "PRD1000761") return UTIL.ComposeResult("","PortIn_MaxisHomeFibre_Error");
            else if(LeadCatalogID == "PRD1000762") return UTIL.ComposeResult("","PortIn_HotlinkPostpaid_Error");
            else if(LeadCatalogID == "PRD1000763") return UTIL.ComposeResult("","PortIn_HotlinkPrepaid_Error");
        }
        
    }
    catch (e)
    {
        console.log(e)    
        return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
    }
}