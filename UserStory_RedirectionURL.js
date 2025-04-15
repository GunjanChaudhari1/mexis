const UTIL = require("./Util")
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");


async function get_manage_app_store_URL_HSSP(msisdn, languageId) {

    let url = `${HOST.MANAGE_APP_STORE_URL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/mb?msisdn=${msisdn}`;
    console.log("languageid", languageId);

    let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
    let data = await UTIL.GetUrl(url, head);
    data = data.responseData;

    return data

}

async function get_manage_app_store_url_MSSP(msisdn, accountNo, languageId) {

    let url = `${HOST.MANAGE_APP_STORE_URL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/mb?msisdn=${msisdn}&accountNumber=${accountNo}`;
    console.log("languageid", languageId);

    let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
    let data = await UTIL.GetUrl(url, head);
    data = data.responseData;
    return data

}

async function get_DID_URL_HSSP(msisdn, languageId) {

    let url = `${HOST.MANAGE_DID_URL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/mid?msisdn=${msisdn}`;
    console.log("languageid", languageId);

    let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
    let data = await UTIL.GetUrl(url, head);
    data = data.responseData;

    return data

}

async function get_DID_url_MSSP(msisdn, accountNo, languageId,sessionID) {

    let url = `${HOST.MANAGE_DID_URL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/mid?msisdn=${msisdn}&accountNumber=${accountNo}`;
    console.log("languageid", languageId);

    let head = { "headers": { "languageid": languageId, "channel": "MAXBOT" } };
    let data = await UTIL.GetUrl(url, head,msisdn, sessionID);
    data = data.responseData;
    return data

}

exports.PresentManageAppStore = async function (event) {

    
    let sessionID = UTIL.GetSessionID(event);
    let msisdn =await SESSION.GetMSISDN(sessionID);

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event, msisdn,sessionID);
    if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    let Cache = await SESSION.GetCache(sessionID)
    console.log("******PresentManageAppStore******", JSON.stringify(Cache));
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
            //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
            return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }
    let languageId = Cache.Language == 1 ? "ms-MY" : "en-US";

    let CustomerType = await SESSION.GetCustomerType(sessionID);
    let appnumber = UTIL.GetParameterValue(event, "appNumber")
    console.log("App Number", appnumber, "Type", typeof appnumber);
    let accountNo = Cache["customerData"]["responseData"]["accounts"][0]["accountNo"]
    console.log("AccNo", accountNo);
    let subType = ""

    
    try {
        subType = await CustomerType.subType;
        console.log("Subtype", subType, "type", typeof subType)
        let url = ""
        let urlMessage=""
        if (subType == "Maxis Individual") {
            try {
                console.log("fetching maxis url");
                url = await get_manage_app_store_url_MSSP(msisdn, accountNo, languageId)
                urlMessage="Once you have enabled your App Store Billing service, you may want to set-up your Digital Spend Limit in the Maxis Care portal. To do that, just click the link!"

            } catch {
                url = "https://care.maxis.com.my/en/auth"
            }


        } else if (subType == "Hotlink Individual") {
            try {
                console.log("fetching hotlink ");
                url = await get_manage_app_store_URL_HSSP(msisdn, languageId)
                urlMessage="Once you have enabled your App Store Billing service, you may want to set-up your Digital Spend Limit in the Hotlink Self Serve portal. To do that, just click the link!"

            } catch {
                url = "https://selfserve.hotlink.com.my/en/auth"
            }

        }
        console.log("url", url);
        url = url.trim()
        urlMessage=urlMessage.trim()
        console.log("urlMessage",urlMessage);

        let returnParam = { "url": `${url}`,"urlMessage":`${urlMessage}`};
        if (appnumber == 1) {
            return UTIL.ComposeResult("", "google_play", returnParam);

        }
        else if (appnumber == 2) {
            return UTIL.ComposeResult("", "apple_store", returnParam);

        }
        else if (appnumber == 3) {
            return UTIL.ComposeResult("", "huawei_gallery", returnParam);
        }
    }
    catch
    {
        return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }

}

exports.DID_RedirectionURL = async function (event) {
    try {
        
        let sessionID = UTIL.GetSessionID(event);
        let msisdn =await SESSION.GetMSISDN(sessionID)
        

        //------------------------------------------------------------------------------
        //🔐EXECUTE AUTHENTICATION
        //------------------------------------------------------------------------------
        let redirectToEvent = await UTIL.Authenticate(event, msisdn,sessionID);
        if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
        //-------------------------------------------------------------------------------
        let Cache = await SESSION.GetCache(sessionID)
        console.log("******DID_RedirectionURL******", JSON.stringify(Cache));
        if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
                //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
                return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
        }
        
        let CustomerType = await SESSION.GetCustomerType(sessionID);
        console.log("CustomerType >> ", CustomerType)
        let accountNo = ''
        if(Cache["customerData"]["responseData"] != null) {
            accountNo = Cache["customerData"]["responseData"]["accounts"][0]["accountNo"]
        } 
        else {
            accountNo = Cache["getCustomerforNRICPassport"]["responseData"]["accounts"][0]["accountNo"]
        }
        
        console.log("AccNo", accountNo);
        let subType = ""
        subType = await CustomerType.subType;
        console.log("Subtype", subType, "type", typeof subType)

        let url = ""
        let urlMessage = ""
        let languageId = ""
        if(Cache.Language) {
            languageId = Cache.Language == 1 ? "ms-MY" : "en-US";
        } else {
            languageId = "en-US";
        }
        if (subType == "Maxis Individual") {
            try {
                url = await get_DID_url_MSSP(msisdn, accountNo, languageId, sessionID)
            } catch {
                url = "https://care.maxis.com.my/en/auth"
            }

            urlMessage = "You can manage your Maxis ID via our Maxis Care portal. Click the link to access and manage your Maxis ID and subscriptions from the Maxis Care portal"
        } else if (subType == "Hotlink Individual") {
            try {
                url = await get_DID_URL_HSSP(msisdn, languageId)

            } catch {
                url = "https://selfserve.hotlink.com.my/en/auth"
            }

            urlMessage = "You can manage your Maxis ID via our Hotlink Self Serve portal. Click the link to access and manage your Maxis ID and subscriptions from the Hotlink Self Serve portal"

        }
        let url2 = "https://www.youtube.com/watch?v=qtNv1U4XzEE&list=PLbl2ILY0ZTYvvYJa0VSXrWNHev64sCYfg&index=2"
        url = url.trim()
        url2 = url2.trim()
        urlMessage.trim()
        console.log("url", url);
        let returnParam = { "url": `${url}`, "urlMessage": `${urlMessage}`, "url2": `${url2}` };
        return UTIL.ComposeResult("", "Profile_DID_SelfServe", returnParam);
    }
    catch {
        return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
    }
}

