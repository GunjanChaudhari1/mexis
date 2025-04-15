const RC = require("./Handler_RingCentral");
const UTIL = require("./Util");
const SESSION = require('./Handler_Session');

//------------------------------------------------------------------------------------------------------------------------------------------
//✨ Program: Orchestrator Garbage Collector
//------------------------------------------------------------------------------------------------------------------------------------------

exports.handler = async (event, context, callback) => {
    console.log("EVENT----->", JSON.stringify(event));
    context.callbackWaitsForEmptyEventLoop = false;
	// Populate RC access token in the entry point itself
	UTIL.populateEnvironmentKeys();
    await UTIL.populateRCAccessTokenSecret();

    let record=[];
    try
    {
        for (record of event.Records)
        {
            console.log("*******************",JSON.stringify(record));
            if (record.eventName == 'REMOVE') 
            {
                let msisdn      = "";
                if (record.dynamodb.OldImage.MSISDN){
                    msisdn = record.dynamodb.OldImage.MSISDN.S;
                }
                let id          = record.dynamodb.OldImage.RcMessageId.S;
                let sessionID   = record.dynamodb.OldImage.SessionID.S;
                let isClosed    = record.dynamodb.OldImage.IsClosed.BOOL;
                let threadId    = record.dynamodb.OldImage.RcThreadId.S;
                let HandOver    = record.dynamodb.OldImage.HandOver.M;
                let intentName  = record.dynamodb.OldImage.CurrentIntent.S;
                let lastIntent  = record.dynamodb.OldImage.LastIntent.S;
                let startTime   = record.dynamodb.OldImage.StartTime.S;
                let subType     = record.dynamodb.OldImage.CustomerType.M.subType.S;
                let cusType     = record.dynamodb.OldImage.CustomerType.M.cusType.S;
                let newContext  = record.dynamodb.OldImage.LastContext.S;
                let channelName = record.dynamodb.OldImage.ChannelName.S;
                let language    = 0;
                try{
                    language    = record.dynamodb.OldImage.Cache.M.Language.N;
                }
                catch(err){
                    console.log("Default language is not set!!", err);
                    language = 0;
                }
                
                let isHandover = false;

                if (HandOver != undefined && Object.keys(HandOver).length > 0)
                {
                    if ("IsHandOver" in HandOver)
                    {
                        isHandover = HandOver.IsHandOver.BOOL;
                    }
                }

                if (isClosed == false && isHandover == false)
                {
                    if (cusType.length == 0 && subType.length == 0 && channelName == "Facebook Maxis"){
                        console.log("No Customer Data, enterring regular closing...")
                        console.log(`👋 Bye-Bye: [${threadId}]`);
                        await RC.GoodBye(id,"", language);
                        await RC.Close(threadId);
                    }
                    else{
                        console.log(`👋 Bye-Bye: [${threadId}]`);
                        // await RC.GoodBye(id,"");
                        // console.log(`👋 Bye-Bye: [${msisdn}][${threadId}]`);
                        console.log("This is the intent during bye-bye: " + intentName)
                        if (intentName == "Shared.Closure.Entry.Webhook" || intentName == "Shared.Closure.Helpful" || newContext.includes("shared-closure")){
                            let prepaidLink = false
                            let closureType = "OLO"
                            let maxis = "Y"

                            if (subType == "Maxis Individual") { closureType = "Maxis" };
                            if (subType == "Hotlink Individual") { closureType = "Hotlink"};
                            if (subType == "Individual") {
                                    if (cusType == "Consumer") {
                                        prepaidLink = true
                                        closureType = "Prepaid";
                                    }
                                    else {
                                        maxis = "N"; 
                                        closureType = "OLO";
                                    }
                            }

                            let qEed = {
                                "channel": "WA BOT",
                                "startSessionTimestamp": UTIL.ToYYY_MM_DD_HH_MM_SS(new Date(startTime).addHours(8)),
                                "endSessionTimestamp": UTIL.ToYYY_MM_DD_HH_MM_SS(new Date().addHours(8)),
                                "sessionID": threadId,
                                "msisdn": msisdn,
                                "maxis": maxis,
                                "dfIntentName": lastIntent
                            }

                            if (prepaidLink == true) {
                                let link = "https://feedback.maxis.com.my/jfe/form/SV_b160RueoJqNMmpM?Q_EED=" + Buffer.from(JSON.stringify(qEed)).toString('base64');
                                await RC.GoodByeWithLink(id,"", language, link, closureType);
                            }
                            else {
                                let link = "https://feedback.maxis.com.my/jfe/form/SV_3U8Cuo1UPRPOPTE?Q_EED=" + Buffer.from(JSON.stringify(qEed)).toString('base64');
                                await RC.GoodByeWithLink(id,"", language, link, closureType);
                            }
                        }
                        else{
                            await RC.GoodBye(id,"", language);
                        }
                        await RC.Close(threadId);
                    }
                }
                else
                {
                    console.log(`🙈 Ignore Bye-Bye: [${sessionID}] [IsClosed: ${isClosed}] [Handover: ${JSON.stringify(isHandover)}]`);
                }
            }
        }
    }
    catch(err)
    {
        console.error("🔻 ERROR: Garbage Collector", JSON.stringify(err));
    }
    callback(null,200);
}