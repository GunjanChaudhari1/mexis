//------------------------------------------------------------------------------------------------------------------------------------------
//✨ Program: Idle Time out
// Author By WIPRO Ravik
//------------------------------------------------------------------------------------------------------------------------------------------

const SESSION = require("./Handler_Session");
const DF = require("./Handler_DialogFlow");
const RC = require("./Handler_RingCentral");
const UTIL = require("./Util");
const tt = require("./translate_txt");

exports.handler = async (event, context, callback) => {
  UTIL.populateEnvironmentKeys();
  await UTIL.populateRCAccessTokenSecret();
  await UTIL.populateGCPCredentialsSecret();

  let trainingPhrase = 'Shared.Idle.AgentAssist';
  let scanResult = await SESSION.Get10MinsIdleTimeSession(10, "MaxBotIdle");

  for (var i = 0; i < scanResult.length; i++) {
    let item = scanResult[i];
    let msisdn = item.MSISDN;
    let sessionID = item.SessionID;
    context = [];
    if (item.LastContext != undefined && item.LastContext.length > 0) {
      context = JSON.parse(item.LastContext);
    }

    let rcMessageId = item.RcMessageId;

    // Bm language idle timeout cache
    let Cache = await SESSION.GetCache(sessionID);

    DfReply = await DF.Call(trainingPhrase,sessionID, msisdn, context);

    if ("outputContexts" in DfReply.queryResult) {
      await SESSION.SetContext(sessionID, DfReply.queryResult.outputContexts);
    }
    await SESSION.SetIdleTimeOutNotify(sessionID, true);

    if (DfReply != undefined && Object.keys(DfReply).length > 0) {
      let messages = DfReply.queryResult.fulfillmentMessages.filter(e => e.text.text[0] != "");
      let msgCount = messages.length;
      for (let j = 0; j < msgCount; j++) {
        let text = messages[j].text.text[0];

        //  Bm language idle timeout
        if (Cache["Language"] === 1) {
          text = await tt.translateText(text, "en", "ms");
        } else {
          console.log(' no need to translate timeout message');
        }
        //

        await RC.Call(rcMessageId, text);
      }
    }
  }
  return;
};
