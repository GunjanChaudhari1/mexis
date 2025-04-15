const UTIL      = require("./Util");
const HOST      = require("./Handler_Host");
const SESSION = require('./Handler_Session');

async function getCase(msisdn) {
        let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/?conditionType=OPEN&numMonth=2`;
        let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US", "msisdn": msisdn} };

        let data = await UTIL.GetUrl(url,head);
        return data.responseData;
}
exports.Start =  async function (event) {
    
        
        let sessionID = UTIL.GetSessionID(event);
        let msisdn    =await SESSION.GetMSISDN(sessionID);
        //------------------------------------------------------------------------------
        //🔐EXECUTE AUTHENTICATION
        //------------------------------------------------------------------------------
        let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
        if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
        //-------------------------------------------------------------------------------
        let Cache = await SESSION.GetCache(sessionID)

        console.log("******Proactive case******", JSON.stringify(Cache));
        if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
                //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
                return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
        }

        if(Cache["MaxisNakedFiber"]  == "Olo"){
                return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
          }

          let accData = '';

  if (Cache.customerData.responseData == null) {
    accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
        msisdn = serviceId[0].serviceId;
    } else {
        msisdn = accData.accounts[0].msisdns[0].serviceId;
    }

  }

        try
        {
                let casData = await getCase(msisdn);
                let ListA = [];
                let ListB = [];

                
                //casData.caseList = casData.caseList.filter(e=>e.status != "Closed");
                let caseListA = casData.caseList.filter(e=>e.status != "Closed" && e.msisdn == msisdn);
                let caseListB = casData.caseList.filter(e=>e.status != "Closed" && e.msisdn != msisdn);       

                //if (casData.caseList.length > 0)
                if (caseListA.length > 0)
                {
                        //for (let i=0; i < casData.caseList.length; i++ )
                        for (let i=0; i < caseListA.length; i++ )
                        {
                                let caseId      = caseListA[i].caseId;
                                let dated       = UTIL.ToDD_MMM_YY(caseListA[i].creationDate);
                                let _msisdn     = caseListA[i].msisdn;
                                let desc        = await UTIL.CaseType(caseListA[i].title);
                                let status      = caseListA[i].status;

                                ListA.push(`Case ID:${caseId}, Dated:${dated} for ${_msisdn}\n${desc}\nStatus:${status}\n`);        
                        }
                
                }
                if (caseListB.length > 0)
                {
                        for (let i=0; i < caseListB.length; i++ )
                        {
                                let caseId      = caseListB[i].caseId;
                                let dated       = UTIL.ToDD_MMM_YY(caseListB[i].creationDate);
                                let _msisdn     = caseListB[i].msisdn;
                                let desc        = await UTIL.CaseType(caseListB[i].title);
                                let status      = caseListB[i].status;

                                ListB.push(`Case ID: ${caseId.toString().replace(" ","")}, Dated: ${dated} for ${_msisdn}\n${desc}\nStatus: ${status}\n`);        
                        }
                }

                if (ListA.length > 0 || ListB.length > 0)
                {
                        return UTIL.ComposeResult("","ProactiveCaseUpdate_Present", {"proactiveCaseList":ListA.join("\n"), "checkCaseListNonMsisdn":ListB.join("\n")});
                }
                else
                {
                        return UTIL.ComposeResult("","ProactiveCaseUpdate_AgentHandover_CustomerServiceQuery");
                }
        }
        catch (err)
        {       
                console.log("🔻 error!")
                console.log(err);
                return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
        }

}

exports.CsHandOver = async function(event){
        return UTIL.ComposeResult("","ProactiveCaseUpdate_AgentHandover_CustomerServiceQuery");
}

exports.CustomerServiceQuery = async function(event){
        return UTIL.ComposeResult("","Shared_Agent_Network_Handover");
}
