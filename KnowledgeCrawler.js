const DF = require("./Handler_DialogFlow");
const SESSION = require("./Handler_Session");
const RC = require("./Handler_RingCentral");

exports.KnowledgeCrawlerAttachmentCheck = async function (event) {
  console.log(
    "🚗 Has enterred from call back KnowledgeCrawlerAttachmentCheck -> ",
    event
  );
  let msisdn = event.msisdn;
  console.log("This is the msisdn ---  > ", msisdn);
  let replyId = await SESSION.getMessageId(msisdn);
  let cache = await SESSION.GetCache(msisdn);
  let context = await SESSION.GetContext(msisdn);
  console.log("🐛 This is the cache -> ", cache);
  console.log(
    "This is the event from callback knowledge crawler ---- > ",
    event
  );
  try {
    let fileUrl = event.fileUrl;
    console.log("File Url => ", fileUrl);
    let DfReply = await DF.SpeechCall(fileUrl, msisdn, context);
    console.log('This is the Df Replyyy ---- > ', DfReply)
    if (DfReply["queryResult"]) {
      console.log("Thisd it the df replyy- --- > ", DfReply);
      let messages = DfReply["queryResult"]["fulfillmentMessages"].filter(
        (e) => e.text.text[0] != ""
      );
      let queryText = DfReply["queryResult"]["queryText"];
      console.log(
        "from call back messages---->",
        messages,
        JSON.stringify(messages)
      );
      let msgCount = messages.length;
      let questionText = `Your Query : ${queryText}`; // Sending user their voice transcribed text
      await RC.Call(replyId, questionText);
      for (let i = 0; i < msgCount; i++) {
        let text = messages[i].text.text[0];
        await RC.Call(replyId, text);
        console.log(`📞 RingCentral: [${event.msisdn}]`);
      }
    } else {
      let noSoundFallback =
        "Sorry, we don't quite get that. Can you send the voice note again ?";
      await RC.Call(replyId, noSoundFallback);
    }
  } catch (e) {
    console.log("This is error from dg --- > ", e);
    let fallbackText = "Facing technicallity issue";
    await RC.Call(replyId, fallbackText);
    console.log(`📞 RingCentral: [${event.msisdn}]`);
  }
};
