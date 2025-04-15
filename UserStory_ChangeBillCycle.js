const UTIL     = require("./Util")
const SESSION  = require("./Handler_Session");
const HOST     = require("./Handler_Host");

async function getBillCycle(msisdn) {
        let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/billcycle?status=&numMonth=3`;
        let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

        let data = await UTIL.GetUrl(url,head);
        return data.responseData;
}

async function getBills(msisdn) {
        let url  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills`;
        let head = { headers: {"Content-Type":"application/json", "maxis_channel_type" : "MAXBOT", "languageid":"1","msisdn": msisdn} };

        let data = await UTIL.GetUrl(url,head);
        return data.responseData;
}

async function getCase(msisdn, desc) {
        let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`;
        let head = { 
                headers: {"Content-Type":"application/json", "channel" : "MAXBOT", "uuid":"123123"},
                "method" : "POST",
                "body"   : JSON.stringify( {
                        "idType": "MSISDN",
                        "idValue": msisdn,
                        "msisdn": msisdn,
                        "caseType1": "Enquiry_Request-Account Related",
                        "caseType2": "Change Bill Cycle",
                        "caseType3": "To Process",
                        "description":desc,
                        "isUpdateCBR": "false"
                })
        };

        let data = await UTIL.GetUrl(url,head);
        return data;
}

function stringOrdinal (number) { 
        let no = number.toString();

        if (no.slice(-1) == 1) return no + "st";
        if (no.slice(-1) == 2) return no + "nd";    
        if (no.slice(-1) == 3) return no + "rd";    

        return no + "th";    
}

exports.CurrentBillCycle =  async function (event) {
    
        
        let sessionID = UTIL.GetSessionID(event);
        let msisdn   = await SESSION.GetMSISDN(sessionID);
        //------------------------------------------------------------------------------
        //🔐EXECUTE AUTHENTICATION
        //------------------------------------------------------------------------------
        let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
        if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
        //-------------------------------------------------------------------------------
        let Cache = await SESSION.GetCache(sessionID)

        console.log("******CurrentBillCycle******", JSON.stringify(Cache));
        if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
                //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
                return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
        }
        msisdn   =await SESSION.GetMSISDN(sessionID);
        //
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
        //

        let casData  = await getBillCycle(msisdn);
        

        if (casData.caseList.length == 0)
        {
                let bilData = await getBills(msisdn);
                
                let menuList = [7,10,14,17,21,24,28].filter(e=>e != bilData.billCycle).map(e=>stringOrdinal(e));

                let menu     = UTIL.GetNumberedMenu(menuList);
                return UTIL.ComposeResult("","change_bill_cycle_current_bc",{"currentBC": stringOrdinal(bilData.billCycle),"billCycleMenu":menu});
        }
        else
        {
                return UTIL.ComposeResult("","change_bill_cycle_existing_case");
        }
}

exports.QueryBillCycle = async function(event) {
        let sessionID = UTIL.GetSessionID(event);
        let msisdn = await SESSION.GetMSISDN(sessionID);
        const Cache = await SESSION.GetCache(sessionID);
        if (Cache.customerData.responseData == null) {
                const accData = Cache.getCustomerforNRICPassport.responseData;
                const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
                if (serviceId.length !== 0) {
                msisdn = serviceId[0].serviceId;
                } else {
                msisdn = accData.accounts[0].msisdns[0].serviceId;
                }
        }

        let bilData = await getBills(msisdn);
        let dateNumber = UTIL.GetParameterValue(event,"dateNumber");

        //perform validation
        if ( dateNumber > [7,10,14,17,21,24,28].length - 1)
        {
                let menuList = [7,10,14,17,21,24,28].filter(e=>e != bilData.billCycle).map(e=>stringOrdinal(e));
                let menu     = UTIL.GetNumberedMenu(menuList);

                return UTIL.ComposeResult("","change_bill_cycle_current_bc", {"currentBC": stringOrdinal(bilData.billCycle),"billCycleMenu":menu, "fallbackMessage":"I didn't quite get that. Would you mind choosing a number next to your preferred choice?"});
        }
        

        if (bilData.currentBillDate == "-")
        {
                return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
        }

        let lookup = [7,10,14,17,21,24,28].filter(e=>e != bilData.billCycle);
        let monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
       
        let currentBC      = bilData.billCycle; 
        let currentBCDate  = new Date(bilData.currentBillDate).addHours(8);
        let newBC          = lookup[dateNumber-1];
        let today          = new Date();
        
        let effectiveDate  = "";

        if (today > new Date(`${newBC}-${monthName[currentBCDate.getMonth()]}-${currentBCDate.getFullYear()}`))
        {
                effectiveDate  = new Date(`${newBC}-${monthName[currentBCDate.getMonth()+1]}-${currentBCDate.getFullYear()}`);     
        }
        else
        {
                effectiveDate = new Date(`${newBC}-${monthName[currentBCDate.getMonth()]}-${currentBCDate.getFullYear()}`)
        }

        let startDate1     = currentBCDate;
        
        let diff             = Math.ceil((effectiveDate - currentBCDate) / (1000 * 60 * 60 * 24)); // in days
        let daysInMonth      = new Date(currentBCDate.getFullYear(), currentBCDate.getMonth() + 1,0).getDate();

        let endDate1   = ""; 

        if (diff >= 28)
                endDate1   = new Date(currentBCDate.getTime() + ((daysInMonth - 1) * 24 * 60 * 60 * 1000));
        else
                endDate1   = new Date(currentBCDate.getTime() + ((diff- 1) * 24 * 60 * 60 * 1000) );
        

        let startDate2 = new Date(endDate1.getTime() + (1 * 24 * 60 * 60 * 1000));
        let daysInStartDate2  = new Date(startDate2.getFullYear(), startDate2.getMonth() + 1,0).getDate();

        let endDate2   = "";

        if (diff >= 28)
                endDate2 = new Date(effectiveDate.getTime() - (1 * 24 * 60 * 60 * 1000));
        else
               endDate2 = new Date(startDate2.getTime() +  ((daysInStartDate2 - 1) * 24 * 60 * 60 * 1000));

        let returnParam = {
                "currentBC"      : currentBC,
                "newBC"          : newBC,
                "startDate1"     : UTIL.ToDD_MMM_YY(startDate1),
                "endDate1"       : UTIL.ToDD_MMM_YY(endDate1),
                "startDate2"     : UTIL.ToDD_MMM_YY(startDate2),
                "endDate2"       : UTIL.ToDD_MMM_YY(endDate2),
                "effectiveDate"  : UTIL.ToDD_MMM_YY(effectiveDate),
        }

        console.log(returnParam);

        return UTIL.ComposeResult("","change_bill_cycle_query_result",returnParam);
}


exports.ConfirmChange = async function(event) {

        let sessionID = UTIL.GetSessionID(event);
        let msisdn = await SESSION.GetMSISDN(sessionID);
        const Cache = await SESSION.GetCache(sessionID);
        if (Cache.customerData.responseData == null) {
        const accData = Cache.getCustomerforNRICPassport.responseData;
        const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
        if (serviceId.length !== 0) {
        msisdn = serviceId[0].serviceId;
        } else {
        msisdn = accData.accounts[0].msisdns[0].serviceId;
        }
        }
        let currentBC    = UTIL.GetParameterValue(event,"currentBC");
        let newBC = UTIL.GetParameterValue(event,"newBC");

        let description = `Reason (From Chatbot): WA MSISDN: ${msisdn}, Current Bill Cycle: ${currentBC}, New Bill Cycle: ${newBC}, DF Intent Name: Billing.ChangeBillCycle.ConfirmChange`;        
        await getCase(msisdn, description);

        return UTIL.ComposeResult("","change_bill_cycle_case_creation");
}
