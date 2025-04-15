const UTIL = require("./Util")
const SESSION = require("./Handler_Session");


exports.Closure = async function(event) {
	let displayName = "";

	return UTIL.ComposeResult("", "Shared_Closure_Helpful", { "displayName": displayName, "intentName": "" });
}

exports.CheckCaseStatus_TroubleshootMobile_Query = async function(event) {
	let sessionID = UTIL.GetSessionID(event);
    let msisdn =await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID)

    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
     let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
     if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------
    msisdn    = await SESSION.GetMSISDN(sessionID);
    Cache   = await SESSION.GetCache(sessionID);  
    console.log("******CheckCaseStatus_TroubleshootMobile_Query******", JSON.stringify(Cache));
    
    if(Cache['customerData']['responseData']==null && !Cache["MaxisNakedFiber"]) {
            //return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
            return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
    }

    if(Cache["MaxisNakedFiber"]  == "NF" || Cache["MaxisNakedFiber"]  == "Olo"){
          return UTIL.ComposeResult("","Authentication_MenuAccessRestriction"); 
    }

	return UTIL.ComposeResult("","CheckCaseStatus_TroubleshootMobile"); 
}

exports.ClosureEntry =  async function (event) {
    
	let sessionID = UTIL.GetSessionID(event);    

    //let textResponse = event.queryResult.fulfillmentText
	let textResponses = event.queryResult.fulfillmentMessages
	if (textResponses == undefined){
		console.log("textResponses is undefined")
		return UTIL.ComposeResult("","Shared_Closure_Entry_Webhook");
	}
	else{
		return UTIL.ComposeResult("","Shared_Closure_Entry_Webhook",{"textResponse1":textResponses[0], "textResponse2":textResponses[1], "textResponse3":textResponses[2], 
									"textResponse4":textResponses[3], "textResponse5":textResponses[4], "textResponse6":textResponses[5], "textResponse7":textResponses[6]});
	}
}

exports.ClosureEntryBM =  async function (event) {
    
    //let textResponse = event.queryResult.fulfillmentText
	let textResponses = event.queryResult.fulfillmentMessages
	if (textResponses == undefined){
		console.log("textResponses is undefined")
		return UTIL.ComposeResult("","Shared_Closure_Entry_Webhook_BM");
	}
	else{
		return UTIL.ComposeResult("","Shared_Closure_Entry_Webhook_BM",{"textResponse1":textResponses[0], "textResponse2":textResponses[1], "textResponse3":textResponses[2], 
									"textResponse4":textResponses[3], "textResponse5":textResponses[4], "textResponse6":textResponses[5], "textResponse7":textResponses[6]});
	}
}

exports.HelpfulYesNo = async function(event) {
	let sessionID = UTIL.GetSessionID(event);
	let msisdn = await SESSION.GetMSISDN(sessionID);
	let originalIntentName = await SESSION.GetLastIntent(sessionID);

	//let cusData             = await getCustomer(msisdn);
	let CustomerType = await SESSION.GetCustomerType(sessionID);
	let displayName = "";
	let startTime = await SESSION.getStartTime(sessionID);
	let threadId = await SESSION.getThreadId(sessionID);
	let helpfulYesText = UTIL.GetParameterValue(event, "helpfulYesText");

	let followUpEvent = "Shared_Closure_OLO";
	let subType = "";
	let maxis = "Y";
	let product = "";
	let ratePlan = "";
	let principalSupplementary = "";
	let accountStatus = "";
	let eBillSubscription = "N";
	let directDebitSubscription = "N";
	let fibreSubscription = "N";
	let lastExitMenu = event.queryResult.queryText;
	let dfIntentName = "";
	let crmInteractionID = "-";
	let crmCaseID = "";

	try {
		principalSupplementary = CustomerType.accType;
		subType = CustomerType.subType;
		cusType = CustomerType.cusType;
		ratePlan = CustomerType.planName;
		accountStatus = CustomerType.status;
		dfIntentName = originalIntentName;

		console.log("This was the closure intent -> " + dfIntentName)

		if (subType == "Maxis Individual") { followUpEvent = "Shared_Closure_MaxisApp" };
		if (subType == "Hotlink Individual") { followUpEvent = "Shared_Closure_HotlinkApp" };
		// if (subType == "Individual")         {maxis = "N"; followUpEvent = "Shared_Closure_OLO"};
		if (subType == "Individual") {
			if (cusType == "Consumer") {
				followUpEvent = "Shared_Closure_PrepaidApp";
			}
			else {
				maxis = "N"; followUpEvent = "Shared_Closure_OLO";
			}
		}

	}
	catch (err) {
		console.log("🔻 HelpfulYesNo Error");
		console.log(err);

		maxis = "N";
		followUpEvent = "Shared_Closure_OLO";
	}
	await SESSION.SetLastEvent(sessionID, { "event": undefined, "param": {} });
	await SESSION.SetClose(sessionID, true);

	let qEed = {
		"channel": "WA BOT",
		"startSessionTimestamp": UTIL.ToYYY_MM_DD_HH_MM_SS(new Date(startTime).addHours(8)),
		"endSessionTimestamp": UTIL.ToYYY_MM_DD_HH_MM_SS(new Date().addHours(8)),
		"sessionID": threadId,
		"msisdn": msisdn,
		"maxis": maxis,
		"dfIntentName": dfIntentName
	}

	let Cache = await SESSION.GetCache(sessionID);
	if ("LastCaseId" in Cache) {
		qEed["crmCaseID"] = Cache.LastCaseId;
	}

	if (followUpEvent == "Shared_Closure_PrepaidApp") {
		let link = "https://feedback.maxis.com.my/jfe/form/SV_b160RueoJqNMmpM?Q_EED=" + Buffer.from(JSON.stringify(qEed)).toString('base64');
		return UTIL.ComposeResult("", followUpEvent, { "displayName": displayName, "feedbackUrl": link, "helpfulYesText": helpfulYesText });
	}
	else {
		let link = "https://feedback.maxis.com.my/jfe/form/SV_3U8Cuo1UPRPOPTE?Q_EED=" + Buffer.from(JSON.stringify(qEed)).toString('base64');
		return UTIL.ComposeResult("", followUpEvent, { "displayName": displayName, "feedbackUrl": link, "helpfulYesText": helpfulYesText });
	}
}
