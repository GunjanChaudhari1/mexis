const fs = require("fs");
const FormData = require("form-data");
const DF = require("./Handler_DialogFlow");
const SESSION = require("./Handler_Session");
const RC = require("./Handler_RingCentral");
const HOST = require("./Handler_Host");
const CALLBACKCONTEXT = require("./CallbackContext");
const tt = require("./translate_txt");

const FETCH = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function CaseAttachment(caseId, imageName) {
  var formdata = new FormData();
  formdata.append("attachmentTitle", "MyTitle");
  formdata.append("attachmentDescription", "MyDescription");
  formdata.append("file", fs.createReadStream(`/tmp/${imageName}`));

  var requestOptions = {
    method: "POST",
    headers: { channel: "MAXBOT", languageid: "en-US" },
    body: formdata,
    redirect: "follow",
  };

  let fetchData = await FETCH(
    `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/${caseId}/attachment`,
    requestOptions
  );
  let getResponse = await fetchData.text();
  console.log("getResponse", getResponse);
  return getResponse;
}

exports.AddAttachmentLocatePayment = async function (event) {
  console.log(
    "🚗 New changes Has enterred from call back AddAttachmentLocatePayment -> ",
    event
  );
  let msisdn = event.msisdn; // use msisdn in production
  console.log("This is the msisdn ---  > ", msisdn);
  let sessionID = event.sessionID; // use session ID in stage
  console.log("This is the sessionID ---  > ", sessionID);
  let filename = event.filename; // use session ID in stage
  console.log("This is the filename ---  > ", filename);
  let fetchUrl = event.fetchUrl; // use fetchUrl in stage
  console.log("This is the fetchUrl ---  > ", fetchUrl);
  let caseId = event.caseId; // use caseId in stage
  console.log("This is the caseId ---  > ", caseId);
  let replyId = await SESSION.getMessageId(sessionID);
  let cache = await SESSION.GetCache(sessionID);
  let context = await SESSION.GetContext(sessionID);
  console.log("🐛 This is the cache -> ", cache);

  try {
    let file = fs.createWriteStream(`/tmp/${filename}`);
    console.log("🚗 FETCHURL - > ", fetchUrl);
    await FETCH(fetchUrl).then(
      (res) =>
        new Promise((resolve, reject) => {
          res.body.pipe(file);
          res.body.on("end", () => resolve("it worked"));
          file.on("error", reject);
        })
    );
    let Result = await CaseAttachment(caseId, filename);
    console.log(JSON.parse(Result).status == "success", "3");
    if (JSON.parse(Result).status == "success") {
      console.log("success if");
      cache["enableLocateFlag"] = false;
      await SESSION.SetCache(sessionID, cache);
      followupevent = "Billing_AccountStatus_LocatePaymentReceipt_CaseCreation";
      let text1 = `Thanks for that. Your case number is ${caseId} and you'll be notified via SMS once your request has been processed`;
      let text2 = `Alternatively, you can also view the case progress from our Maxis Care portal https://care.maxis.com.my`;
      let text3 = `Would you like to explore the other products and services we have to offer?\n\n1️⃣ Continue exploring\n2️⃣ Not right now. Thanks \n*️⃣ Go back to the main menu\n\nTo continue, just select a number from the list`;

      await SESSION.SetLastEvent(sessionID, {
        event: followupevent,
        param: { caseId },
      });

      await SESSION.SetContext(
        sessionID,
        CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET]
      );

      // Hanlde BM language response
      if (cache["Language"] === 1) {
        text1 = await tt.translateText(text1, "en", "ms")
        text2 = await tt.translateText(text2, "en", "ms")
        text3 = await tt.translateText(text3, "en", "ms")
      }

      await RC.Call(replyId, text1);
      await RC.Call(replyId, text2);
      await RC.Call(replyId, text3);
    } else {
      console.log("fail else");
      followupevent = "Shared_Tech_IssueServicing";
      let DfReply = await DF.Call(followupevent, sessionID, msisdn, context);
      let messages = DfReply["queryResult"]["fulfillmentMessages"].filter(
        (e) => e.text.text[0] != ""
      );
      console.log("messages---->", messages, JSON.stringify(messages));
      let msgCount = messages.length;
      for (let i = 0; i < msgCount; i++) {
        let text = messages[i].text.text[0];
        await RC.Call(replyId, text);
        console.log(`📞 RingCentral: [${msisdn}]`);
      }
    }
  } catch (e) {
    console.log(e);
    followupevent = "Shared_Tech_IssueServicing";
    let DfReply = await DF.Call(followupevent, sessionID, msisdn, context);
    let messages = DfReply["queryResult"]["fulfillmentMessages"].filter(
      (f) => f.text.text[0] != ""
    );
    console.log("messages---->", messages, JSON.stringify(messages));
    let msgCount = messages.length;
    for (let i = 0; i < msgCount; i++) {
      let text = messages[i].text.text[0];
      await RC.Call(replyId, text);
      console.log(`📞 RingCentral: [${msisdn}]`);
    }
  }
};
