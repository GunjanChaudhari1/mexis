const UTIL      = require("./Util")
const SESSION   = require("./Handler_Session");
const HOST      = require("./Handler_Host");

//🔨 ALSO USED IN OTHER USER STORY: [CheckPUK, CheckAccountDetail]
async function getAccounts(msisdn,sessionID)
{
    let url  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/accounts?checkfssp=true&checkroaming=true`;
    let head = {"headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT"}};
    
    
    let data = await UTIL.GetUrl(url,head,msisdn, sessionID);
        data = data.responseData;
    return data;
}

async function get_puk_URL_HSSP(msisdn, languageId) {

    let url = `${HOST.CHECKPUKURL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/cpuk?msisdn=${msisdn}`;
    console.log("languageid",languageId);
    let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
    let data = await UTIL.GetUrl(url, head);
    data = data.responseData;

    return data 

}

async function get_puk_url_MSSP(msisdn,accountNo,languageId){

    let url = `${HOST.CHECKPUKURL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/cpuk?msisdn=${msisdn}&accountNumber=${accountNo}`;
    console.log("languageid",languageId,"type", typeof languageId);
    let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
    console.log("head",head);
    let data = await UTIL.GetUrl(url, head);
    data = data.responseData;
    return data

}

exports.PresentPUK = async function (event) {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    console.log("SessionId>>>",sessionID);
    console.log("msisdn>>>",msisdn);

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event, msisdn,sessionID);
    console.log("steps>>>>>>>>>3");
    if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    console.log("steps>>>>>>>>>4");
     msisdn =await SESSION.GetMSISDN(sessionID);
     console.log("steps>>>>>>>>>5");
    //let cusData   = await getCustomer(msisdn);
    let Cache = await SESSION.GetCache(sessionID)
    let languageId = Cache.Language == 1 ? 'ms-MY' : 'en-US';

    try 
    {
        console.log("******PresentPUK******", JSON.stringify(Cache));
        if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
                //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
                return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
        }

        if(Cache["MaxisNakedFiber"]  == "Olo"){
            return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
        }
        
        let CustomerType = await SESSION.GetCustomerType(sessionID);
        console.log("***********CustomerType********", JSON.stringify(CustomerType));

        let accountNo = '';
        if (Cache.customerData.responseData == null) {
            const accData = Cache.getCustomerforNRICPassport.responseData;
            const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
            if (serviceId.length !== 0) {
                msisdn = serviceId[0].serviceId;
            } else {
                msisdn = accData.accounts[0].msisdns[0].serviceId;
            }
            accountNo = accData.accounts[0].accountNo;
        }
        else
        {
            accountNo = Cache.customerData.responseData.accounts[0].accountNo;
        }

        
        console.log("AccNo", accountNo);
        let subType = "";

        let accData = await getAccounts(msisdn,sessionID);
        if(accData==null){
            return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
        }
        let number = UTIL.ToMobileNumber(msisdn);

        subType = await CustomerType.subType;
        console.log("Subtype", subType, "type", typeof subType)
        let pukCode = accData.pukCode;
        let url = ""
        let urlMessage = ""
        
        if (subType == "Maxis Individual") {
            try{
                url = await get_puk_url_MSSP(msisdn, accountNo,languageId)
            }catch{
                url ="https://care.maxis.com.my/en/auth"
            }
            urlMessage ="You may also view your PUK and account details at the Maxis Care portal, just click the link"


        } else if (subType == "Hotlink Individual") {
            try{
                url = await get_puk_URL_HSSP(msisdn,languageId)
            }catch{
                url ="https://selfserve.hotlink.com.my/en/auth"
            }
            urlMessage="You may also view your PUK and account details at the Hotlink Self Serve portal, just click the link"
        }
        console.log("url",url, "Message:",urlMessage);
        url=url.trim()
        urlMessage=urlMessage.trim()
        let returnParam = { "pukNo": pukCode, "msisdn": number, "url": `${url}`,"urlMessage":`${urlMessage}` };
        return UTIL.ComposeResult("", "present_puk", returnParam);

    }
    catch
    {
        return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }

}

