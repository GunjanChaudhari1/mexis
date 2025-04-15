const DF = require("./Handler_DialogFlow");
const SESSION = require("./Handler_Session");
const UTIL = require("./Util");
const HOST = require("./Handler_Host");

const knowledgeCrawlerAttachmentCheckCall = async (msisdn, fileUrl) => {
  try {
    let apiId = HOST.TARGET == 0 ? "nx5rbzdio4" : "avezebzouc";
    let apiky =
      HOST.TARGET == 0
        ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin"
        : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
    let url =
      HOST.TARGET == 0
        ? "https://maxbot-uat.maxis.com.my/dev/MaxisCallback"
        : "https://maxbot.maxis.com.my/prod/diagnostic";

    let head = {
      headers: { "x-apigw-api-id": apiId, "x-api-key": apiky },
      method: "POST",
      body: JSON.stringify({
        msisdn,
        fileUrl,
        voiceAttachmentCheck: "voiceAttachmentCheck",
      }),
    };

    let data = await UTIL.GetUrl(url, head);
    return data;
  } catch (err) {
    console.log("Maxis callback failed --- > ", err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
};

exports.KnowledgeCrawler_Restart = async function (event) {
  console.log("Knowledge Crawler Option Selected for Maxis");
  return UTIL.ComposeResult("", "Start_Knowledge_Crawler");
};

exports.KnowledgeCrawler_Maxis_Start = async function (event) {
  console.log("Knowledge Crawler Option Selected for Maxis");
  return UTIL.ComposeResult("", "Knowledge_Crawler_Maxis");
};

exports.KnowledgeCrawler_Hotlink_Start = async function (event) {
  console.log("Knowledge Crawler Option Selected for Hotlink");
  return UTIL.ComposeResult("", "Knowledge_Crawler_Hotlink");
};

exports.KnowledgeCrawler_Selected = async function (event) {
  console.log("Enterred Knowledge Crawler => ");
  console.log("🐛 This is the event => ", event);
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  console.log("This is the msisdn -> ", msisdn);
  let context = await SESSION.GetContext(sessionID);
  console.log("🐛 This is the context -> ", context);
  let searchedText = event.queryResult.queryText;

  let DfReply = await DF.Call(searchedText,sessionID, msisdn);
  console.log("🔍This is the searched text - > ", searchedText);
  console.log("✍ Df response - > ", DfReply);
  let knowledgeAnswer = DfReply.queryResult.fulfillmentText;
  console.log("🐛 Got this from df reply -> ", knowledgeAnswer);

  console.log("fallback message received ->", DfReply.queryResult.parameters.fields.fallbackMessage.stringValue)
  if (knowledgeAnswer == DfReply.queryResult.parameters.fields.fallbackMessage.stringValue) {
    knowledgeAnswer = "Sorry! We didn't get anything related to your search";
  }

  return UTIL.ComposeResult("", "Knowledge_Crawler_Response", {
    knowledgeAnswer,
  });
};

exports.KnowledgeCrawler_Maxis_Yes = async function (event) {
  console.log("User wants to ask another question in Maxis FAQ");
  return UTIL.ComposeResult("", "Knowledge_Crawler_Maxis_Start");
};

exports.KnowledgeCrawler_Hotlink_Yes = async function (event) {
  console.log("User wants to ask another question in Hotlink FAQ");
  return UTIL.ComposeResult("", "Knowledge_Crawler_Hotlink_Start");
};

exports.KnowledgeCrawler_NoAnswer_Maxis = async function (event) {
  console.log("No Answer found, prompting user to continue");
  return UTIL.ComposeResult("", "Knowledge_Crawler_NoAnswer_Maxis");
};

exports.KnowledgeCrawler_NoAnswer_Hotlink = async function (event) {
  console.log("No Answer found, prompting user to continue");
  return UTIL.ComposeResult("", "Knowledge_Crawler_NoAnswer_Hotlink");
};

exports.KnowledgeCrawler_No = async function (event) {
  console.log("User dont want to ask anymore question ");
  return UTIL.ComposeResult("", "Greeting_Start1");
};

exports.KnowledgeCrawler_Continue_Maxis = async function (event) {
  console.log("Asking user if continue in Maxis FAQ?");
  let knowledgeAnswer = event.queryResult.fulfillmentText;
  if (!knowledgeAnswer) {
    knowledgeAnswer = "Sorry! We didn't get anything related to your search";
  }
  return UTIL.ComposeResult("", "Knowledge_Crawler_Continue_Maxis", {
    knowledgeAnswer,
  });
};

exports.KnowledgeCrawler_Continue_Hotlink = async function (event) {
  console.log("Asking user if continue in Hotlink FAQ?");
  let knowledgeAnswer = event.queryResult.fulfillmentText;
  if (!knowledgeAnswer) {
    knowledgeAnswer = "Sorry! We didn't get anything related to your search";
  }
  return UTIL.ComposeResult("", "Knowledge_Crawler_Continue_Hotlink", {
    knowledgeAnswer,
  });
};

exports.KnowledgeCrawler_Attachment_Check = async function (event) {
  console.log("🚗 Has enterred KnowledgeCrawler_Attachment_Check -> ");
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let cache = await SESSION.GetCache(sessionID);
  console.log("🐛 This is the cache -> ", cache);
  let attachment = cache["AudioAttachment"];
  let fileUrl = attachment[0].url;

  console.log("💚 kb call maxis before ->");
  await knowledgeCrawlerAttachmentCheckCall(msisdn, fileUrl);
  console.log("💖 kb call maxis after ->");
  return UTIL.ComposeResult("", "Knowledge_Crawler_SpeechToText_Inprogress");
};

exports.KnowledgeCrawler_Webhook = async function (event) {
  console.log("🐛 Enterrred Webhook callll ----- > ", event);
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  // let cache = await SESSION.GetCache(msisdn);
  let searchedText = UTIL.GetParameterValue(event, "transcribedText");
  console.log("THe get text coming from param ----- > ", searchedText);
  // let searchedText = cache["transcribedText"];
  // let searchedText = "What is postpaid";

  console.log("🔍This is the searched text - > ", searchedText);
  let DfReply = await DF.Call(searchedText,sessionID, msisdn);
  console.log("✍ Df response - > ", DfReply);
  let knowledgeAnswer = DfReply.queryResult.fulfillmentText;
  console.log("🐛 Got this from df reply -> ", knowledgeAnswer);

  if (!knowledgeAnswer) {
    knowledgeAnswer = "Sorry! We didn't get anything related to your search";
  }

  return UTIL.ComposeResult("", "Knowledge_Crawler_Response", {
    knowledgeAnswer,
  });
};
