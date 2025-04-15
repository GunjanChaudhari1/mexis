const UTIL      = require("./Util")
const SESSION   = require("./Handler_Session");
const HOST      = require("./Handler_Host");

const FALLBACK_MESSAGE = process.env.FALLBACK_MESSAGE;

async function getFSSPlink(msisdn,accountNumber, cusName, cusEmail, modemId) {
        let url  = `${HOST.DIRECT_DEBIT[HOST.TARGET]}/fibre/api/v1.0/fibre/url`;
        let head = {
            "method" : "POST",
            "headers": {"Content-Type" : "application/json", "languageid":"en-US"},
            "body" : JSON.stringify( 
                {
                    "accountNo": accountNumber,
                    "cbr": "",
                    "customerName": cusName,
                    "email": cusEmail,
                    "modemId": modemId,
                    "msisdn": "",
                    "uuid": ""
                   }
                )
        };
        
        let data = await UTIL.GetUrl(url, head);
        console.log(`Data fetched!!! ${data}`)
        return data.responseData.url;
    }
async function getCustomerforWifi(sessionID, msisdn) {
        let url  = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
        let head = {
            "method" : "POST",
            "headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT", "languageid":"en-US"},
            "body" : JSON.stringify( {
                "searchtype":"MSISDN",
                "searchvalue": msisdn,
                "isPrincipalPlanName": true,
                "isLookupAllAccount": true,
                "isIndividual": 1,
                "isSubscription": true,
                "isGetSupplementary": true,
                "isIncludeOfferingConfig": false,
                "serviceType": "FTTH"
                })
        };
        
        let data = await UTIL.GetUrl(url,head,msisdn,sessionID);
        console.log(`Data fetched!!! ${data}`)
        return data.responseData;
    }

function getList(object){
  
        let items = [];

        object.forEach(e => {
          items.push({"plan":e.plan.name, "serviceId": e.serviceId});
        });
      
        return items;
}

exports.ManageRouter_Start_Wh =  async function (event,manageFibreServices) {
            
            
            let sessionID = UTIL.GetSessionID(event);
            let msisdn = await SESSION.GetMSISDN(sessionID);
            let Cache   = await SESSION.GetCache(sessionID);
            console.log("Manage router flow started. Got msisdn!!", msisdn);
        if (Cache.getCustomerforNRICPassport){
                try{
                        console.log("if*****************");
                let ftths   = Cache.getCustomerforNRICPassport.responseData.accounts[0].msisdns.filter(x => x.serviceType=="FTTH" && x.status=="active");
                console.log("ftths*****************",ftths);
                if (ftths.length > 1){
                        // to use in next RouterReboot_fibreId
                        console.log("Routing to fibre account list!!!")
                        let modemArr  = getList(ftths);
                        Cache["modemArr"] = modemArr;
                        await SESSION.SetCache(sessionID, Cache);

                        let modemList = UTIL.GetNumberedMenu(modemArr.map(e=>`${e.serviceId} - ${e.plan}`));

                        return UTIL.ComposeResult("","RouterReboot_FibreAccountList", {"fibreIdList": modemList,"accountNo":Cache.getCustomerforNRICPassport.responseData.accounts[0]['accountNo'],"cusname": Cache.getCustomerforNRICPassport.responseData.customer.name, "cusEmail": Cache.getCustomerforNRICPassport.responseData.customer.customerEmail, "manageFibreServices":manageFibreServices})
                }
                else if (ftths.length == 1){    
                        console.log("else Fitth****************", msisdn,Cache.getCustomerforNRICPassport.responseData.accounts[0]['accountNo'] , Cache.getCustomerforNRICPassport.responseData.customer.name , Cache.getCustomerforNRICPassport.responseData.customer.customerEmail ,ftths[0].serviceId); 
                    //hit the fssp redirection API  
                    let url = await getFSSPlink(`==>${Cache.getCustomerforNRICPassport.responseData.accounts[0]['accountNo']} , ==>${Cache.getCustomerforNRICPassport.responseData.customer.name} , ==>${Cache.getCustomerforNRICPassport.responseData.customer.customerEmail} ,==>${ftths[0].serviceId}`)
                    url = url + "&referral=MAXBOT"
                    if (manageFibreServices=="3")
                            { return UTIL.ComposeResult("","RouterRebootSetting_FibreAccountSelect_RedirectFSSPMicrosite" , {"url":url}) }//new intent

                    else if (manageFibreServices=="4")
                            { return UTIL.ComposeResult("","ChangeWifi_Setting_FibreAccountSelect_RedirectFSSPMicrosite" , {"url":url}) }//new intent
                } else {
                        return UTIL.ComposeResult("","RouterRebootSetting_NoRecord_MaxisFibre");
                }
                
        }
        catch (err) {
                console.log("Error handling flow is triggered");
                console.log(err);
                if ( err.toString().includes("TypeError"))
                {
                        console.log("No modem Found!!");
                        return UTIL.ComposeResult("","RouterRebootSetting_NoRecord_MaxisFibre");
                }
                return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
        }
        } else{
                console.log("else part working here*********************");
                //🔐EXECUTE AUTHENTICATION
            //------------------------------------------------------------------------------
            let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
            if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
            //-------------------------------------------------------------------------------    
            
            console.log("TAC Authenticated");
            let cusData = await getCustomerforWifi(sessionID, msisdn);
            try {
            let ftths   = cusData.accounts[0].msisdns.filter(x => x.serviceType=="FTTH" && x.status=="active");
            
            console.log(`Fibre list info ${ftths} : `, ftths);
  
           
                if (ftths.length > 1){
                        // to use in next RouterReboot_fibreId
                        console.log("Routing to fibre account list!!!")
                        let modemArr  = getList(ftths);
                        Cache["modemArr"] = modemArr;
                        await SESSION.SetCache(sessionID, Cache);

                        let modemList = UTIL.GetNumberedMenu(modemArr.map(e=>`${e.serviceId} - ${e.plan}`));

                        return UTIL.ComposeResult("","RouterReboot_FibreAccountList", {"fibreIdList": modemList,"accountNo":cusData.accounts[0].accountNo,"cusname": cusData.customer.name, "cusEmail": cusData.customer.customerEmail, "manageFibreServices":manageFibreServices})
                }
                else if (ftths.length == 1){     
                    //hit the fssp redirection API  
                    let url = await getFSSPlink(msisdn,cusData.accounts[0].accountNo , cusData.customer.name , cusData.customer.customerEmail ,ftths[0].serviceId)
                    url = url + "&referral=MAXBOT"
                    if (manageFibreServices=="3")
                            { return UTIL.ComposeResult("","RouterRebootSetting_FibreAccountSelect_RedirectFSSPMicrosite" , {"url":url}) }//new intent

                    else if (manageFibreServices=="4")
                            { return UTIL.ComposeResult("","ChangeWifi_Setting_FibreAccountSelect_RedirectFSSPMicrosite" , {"url":url}) }//new intent
                }
                else {
                        console.log("No modem Found!!");
                        return UTIL.ComposeResult("","RouterRebootSetting_NoRecord_MaxisFibre");
                }
        }
        catch (err) {
                console.log("Error handling flow is triggered");
                console.log(err);
                return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
        }
        }
            
            
    }

exports.RouterReboot_fibreId = async function (event) {
        let sessionID = UTIL.GetSessionID(event);
        let msisdn    = await SESSION.GetMSISDN(sessionID);
        console.log("msisdn**************", msisdn);
        let modemSelection = UTIL.GetParameterValue(event,"fibreSelection");
        let accountNo = UTIL.GetParameterValue(event,"accountNo");
        let cusname = UTIL.GetParameterValue(event,"cusname");
        let cusEmail = UTIL.GetParameterValue(event,"cusEmail");
        console.log(`modemSelection=>${modemSelection}, accountNo=>${accountNo}, cusname=>${cusname}, cusEmail=>${cusEmail}`);
        let cache     = await SESSION.GetCache(sessionID)
        let modemArr  = cache.modemArr;
        console.log(`modemArr==>${modemArr}`);
        let modemItem = modemArr[modemSelection-1];
         
        let manageFibreServices = UTIL.GetParameterValue(event, "manageFibreServices");
        
        if (modemSelection == "*")
                return UTIL.ComposeResult("","Greeting_Start1");
                
        if (modemItem != undefined){
                let url = await getFSSPlink(msisdn, accountNo , cusname , cusEmail ,modemItem.serviceId)
                url = url + "&referral=MAXBOT"
                if (manageFibreServices==3)
                        { return UTIL.ComposeResult("","RouterRebootSetting_FibreAccountSelect_RedirectFSSPMicrosite" , {"url":url}) }//new intent
                else if (manageFibreServices==4)
                        { return UTIL.ComposeResult("","ChangeWifi_Setting_FibreAccountSelect_RedirectFSSPMicrosite" , {"url":url}) }//new intent
                // let [followUpEvent, returnParams] = await routeIntents(modemItem.serviceId, reschduleReboot);
                // return UTIL.ComposeResult("", followUpEvent, returnParams); 
        }       
        else{
                let modemList = UTIL.GetNumberedMenu(modemArr.map(e=>`${e.serviceId} - ${e.plan}`));
                return UTIL.ComposeResult("","RouterReboot_FibreAccountList", {"accountNo":accountNo,"cusname": cusname, "cusEmail": cusEmail, "manageFibreServices":manageFibreServices,"fibreIdList" : modemList, fallbackMessage: FALLBACK_MESSAGE});
        }
        
      }