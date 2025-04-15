//------------------------------------------------------------------------------------------------------------------------------------------
// ✨ Program: Dialogflow To Orchestrator: WebHook
//------------------------------------------------------------------------------------------------------------------------------------------

const {performance} = require('perf_hooks');
const LOGGER = require("./Handler_Logger");
const SESSION = require("./Handler_Session");
const DF = require("./Handler_DialogFlow");
const INTENT = require("./IntentMapper");
const UTIL = require("./Util");

// new latest changes for Sentiment
// Added logger - variables
let score = "";
let magnitude = "";
//
const sentimentCheck = require('./UserStory_SentimentCheck')
//

// Shared Intent Prefixes
//------------------------------------------------------------------------------------------------
const SHARED_INTENT = ["Bypass", "SharedAgent"];
//🌄 Environment Variables
//------------------------------------------------------------------------------------------------
const TIMEOUT_RETRY_COUNT = process.env.TIMEOUT_RETRY_COUNT;
const MULTILINGUIAL_OUTPUT_INTENT = "Hybrid.Select.Language"

// 🚁Helper function
//------------------------------------------------------------------------------------------------
async function webHookTimeLimit(task) {
  try {
    let timeLimit = 3850;
    let timeout;
    const timeoutPromise = new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        resolve(-1);
      }, timeLimit);
    });
    const response = await Promise.race([task, timeoutPromise]);
    if (timeout) {
      clearTimeout(timeout);
    }

    return response;
  } catch (error) {
    console.log("error webhook time limit", error);
    return error;
  }
  // let timeLimit = 3850 / TIMEOUT_RETRY_COUNT;
}

// 👇primary entry point from DialogFlow. Sample event object 
//----------------------------------------------------------------------------------------------------

exports.handler = async (event, context, callback) => {
  console.log("DialogFlow Event", JSON.stringify(event));
  // Populate GCP credentials and RC access token in the entry point itself
  UTIL.populateEnvironmentKeys();
  await UTIL.populateRCAccessTokenSecret();
  await UTIL.populateGCPCredentialsSecret();

  const Task = INTENT.Map();
  console.log("DialogFlow Event", JSON.stringify(event.body));
  let body = JSON.parse(event.body); //👈use this for live (lambda proxing is enabled)
  let Intent = DF.GetIntent(body);
  let sessionID = UTIL.GetSessionID(body);
  let msisdn = UTIL.GetMSISDN(body);
  let queryText = body.queryResult.queryText;
  let StartTime = new Date().addHours(8).toUTCString();
  let output = {};
  let result = {};

  // new latest changes for sentiment
  let valueSentiment = await sentimentCheck.SentimentCheck(body, sessionID);
  // Added logger
  if (body.queryResult.sentimentAnalysisResult) {
    score = body.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    magnitude = body.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
  }
  //
  if (valueSentiment) {
    console.log("i am in if of valueSentiment DF : ", valueSentiment);
    return UTIL.CreateJsonResponse(valueSentiment);
  } else {
    console.log("i am in else of valueSentiment DF")
  }
  //

  try {
    // Saving IntentName for non-Shared Intent!
    if (Intent.displayName.startsWith("Shared") == false) {
      await SESSION.SetLastIntent(sessionID, Intent.displayName);
    }

    // 👇 perform webhook tasks ------------------------------------------------------------------------
    for (let i = 0; i < TIMEOUT_RETRY_COUNT; i++) {
      console.log(`🟢 REQ 🤞Attempt ${i + 1}: [${sessionID}][${queryText}][${Intent.displayName}]`);

      let A = performance.now();

      //---------------------------------------------------------------------------------------------            
      // check if intent's displayname is part of Shared eg ByPass. if found, invoke
      // shared name otherwise invoke full intent name
      let SharedIntent = SHARED_INTENT.filter(e => Intent.displayName.toUpperCase().startsWith(e.toUpperCase()));
      console.log("SharedIntent Data >>>>> ", SharedIntent);
      console.log("SharedIntent Length >>>>> ", SharedIntent.length);
      if (SharedIntent.length > 0) {
        // for Shared or ByPass
        console.log("webHookTimeLimit bypass");
        result = await webHookTimeLimit(Task[SharedIntent[0]](body));
      } else {
        // for Multi-Campagin
        console.log("for Multi-Campagin");
        if (Intent.displayName.toUpperCase().startsWith("MULTICAMPAIGN")) {
          result = await webHookTimeLimit(Task["MultiCampaign"](body));
        } else {
          console.log("else part webhook---->", Intent.displayName, Task[Intent.displayName], JSON.stringify(body));
          result = await webHookTimeLimit(Task[Intent.displayName](body));
        }
        // for Everything Else
      }
      console.log("webhook result ", JSON.stringify(result));
      //---------------------------------------------------------------------------------------------
      let B = performance.now();
      let C = B - A;
      let SEC = (C / 1000).toFixed(3);
      let perfText = "";
      if (C > 3000)
        perfText = `🐌 ⏲: ${SEC}s`;
      else
        perfText = `🐇 ⏲: ${SEC}s`;
      console.log(`🔴 RES 🤞Attempt ${i + 1}: [${sessionID}][${queryText}],${perfText}`);
      if (result == -1) {
        console.log(`🚫 TIMEOUT 🤞 Attempt ${i + 1}: [${sessionID}][${queryText}]`);
      }
      else {
        output = DF.CreateFullfillmentResponse(result);
        break;
      }
    }
    //👆 end of webhook tasks ------------------------------------------------------------------------
  }
  catch (err) {
    output = err;
    console.error(`🔻 ERROR: Webhook [${sessionID}]`, JSON.stringify(err))
  }
  finally {
    if (Intent.displayName == MULTILINGUIAL_OUTPUT_INTENT) {
      let EndTime = new Date().addHours(8).toUTCString();
      let RcThreadId = await SESSION.getThreadId(sessionID);
      let RcMessageId = await SESSION.getMessageId(sessionID);
      // No BOT response will be available for webhook request in dialogflow 
      let botMessage = "";
      //Added logger - > "|" + score + "|" + magnitude
      let ChannelName = await SESSION.getChannelName(sessionID)
      msisdn = await SESSION.GetMSISDN(sessionID)
      console.log("Writing to logger:",ChannelName + "|"+ RcMessageId + "|" + sessionID + "|" + queryText + "|" + Intent.displayName + "|" + StartTime + "|" + EndTime + "|" + RcThreadId + "|" + botMessage + "|" + score + "|" + magnitude);
      await LOGGER.WriteReport(RcMessageId,ChannelName, msisdn, queryText, Intent.displayName, StartTime, EndTime, false, RcThreadId, botMessage, score, magnitude);
    }
  }

  console.log("🤮 Dialogfloe output from WebHook:", JSON.stringify(output));
  return UTIL.CreateJsonResponse(output);
  //return output;
}