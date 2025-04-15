const DIALOGFLOW = require('@google-cloud/dialogflow').v2beta1;
const UUID = require('uuid');
// const DIALOGFLOW = require('@google-cloud/dialogflow');
// const UUID = require('uuid');
const imageToBase64 = require('image-to-base64');
const SESSION = require("./Handler_Session");
const STRUCTJSON = require('./structjson');
const UTIL = require("./Util");

function CreateDfRequest(sessionPath, queryText, sessionID, msisdn, context) {
  // Dialogflow's v2 API uses gRPC and has a few quirks, I'll need to impliment a jsonToStructProto
  // for queryParams.payload
  let dfParameters = {
    "sessionID": sessionID
  };

  if (msisdn != undefined && msisdn != "") {
    dfParameters["msisdn"] = msisdn;
  }
  // const projectId = 'mxs-mxb-dcc-dev'
  // const knowledgeBaseId = 'ODQ2ODk4MjgxNTM4NjUwMTEyMA'
  const projectId = UTIL.GCP_PROJECT_ID;
  const knowledgeBaseId = 'None';

  //
  const knowledgeBasePath = 'projects/' + projectId + '/knowledgeBases/' + knowledgeBaseId + '';
  return {
    session: sessionPath,
    queryInput: {
      text: {
        text: queryText,
        languageCode: 'en-US',
      },
    },
    queryParams: {
      sentimentAnalysisRequestConfig: { analyzeQueryTextSentiment: true },
      // agentSettings: {enableAgentWideKnowledgeConnector: true},
      knowledgeBaseNames: [knowledgeBasePath],
      payload: STRUCTJSON.jsonToStructProto({ "msisdn": msisdn, "sessionID": sessionID }),
      contexts: context,
    },
  };
}

function CreateDfRequestMaxisKC(sessionPath, queryText, sessionID, msisdn, context) {
  let dfParameters = {
    "sessionID": sessionID
  };

  if (msisdn != undefined && msisdn != "") {
    dfParameters["msisdn"] = msisdn;
  }

  const projectId = UTIL.GCP_PROJECT_ID;
  const knowledgeBaseId = UTIL.GCP_KNOWLEDGE_MAXIS_ID;
  const knowledgeBasePath = 'projects/' + projectId + '/knowledgeBases/' + knowledgeBaseId + '';
  return {
    session: sessionPath,
    queryInput: {
      text: {
        text: queryText,
        languageCode: 'en-US',
      },
    },
    queryParams: {
      sentimentAnalysisRequestConfig: { analyzeQueryTextSentiment: true },
      // agentSettings: {enableAgentWideKnowledgeConnector: true},
      knowledgeBaseNames: [knowledgeBasePath],
      payload: STRUCTJSON.jsonToStructProto({ "msisdn": msisdn, "sessionID": sessionID }),
      contexts: context
    }
  };
}

function CreateDfRequestHotlinkKC(sessionPath, queryText, sessionID, msisdn, context) {
  let dfParameters = {
    "sessionID": sessionID
  };

  if (msisdn != undefined && msisdn != "") {
    dfParameters["msisdn"] = msisdn;
  }

  const projectId = UTIL.GCP_PROJECT_ID;
  const knowledgeBaseId = UTIL.GCP_KNOWLEDGE_HOTLINK_ID;
  const knowledgeBasePath = 'projects/' + projectId + '/knowledgeBases/' + knowledgeBaseId + '';
  return {
    session: sessionPath,
    queryInput: {
      text: {
        text: queryText,
        languageCode: 'en-US',
      },
    },
    queryParams: {
      sentimentAnalysisRequestConfig: { analyzeQueryTextSentiment: true },
      // agentSettings: {enableAgentWideKnowledgeConnector: true},
      knowledgeBaseNames: [knowledgeBasePath],
      payload: STRUCTJSON.jsonToStructProto({ "msisdn": msisdn, "sessionID": sessionID }),
      contexts: context
    }
  };
}

const CreateDfVoiceRequest = async (sessionPath, fileUrl, msisdn, context) => {
  // 🤦‍♂️Dialogflow's v2 API uses gRPC and has a few quirks, I'll need to impliment a jsonToStructProto
  // - for queryParams.payload 👇
  console.log('🚗 Inside createDf Voice Request');
  // const projectId = 'mxs-mxb-dcc-dev'
  // const projectId = 'mxs-coe-whatsapp-chatbot-stage'
  // const knowledgeBaseId = 'MTQ0ODA0OTgzMTg4MjE1NTYyMjQ' // Dev
  // const knowledgeBaseId = 'ODc4NDUzNTUwNTczMjYzMjU3Ng'
  // const knowledgeBasePath = 'projects/' + projectId + '/knowledgeBases/' + knowledgeBaseId + '';
  let audioBytes;

  await imageToBase64(fileUrl) // Image URL
    .then((response) => audioBytes = response)
    .catch((error) => {
      console.log('🐛 Error img to 64', error); // Logs an error if there was one
    });

  console.log("🐛 FInal ress --- > ", audioBytes);

  return {
    session: sessionPath,
    queryInput: {
      audioConfig: {
        audioEncoding: "AUDIO_ENCODING_OGG_OPUS",
        sampleRateHertz: 16000,
        languageCode: "en-SG", // Using Singapore English for better accuracy
      },
    },
    inputAudio: audioBytes,
    queryParams: {
      sentimentAnalysisRequestConfig: { analyzeQueryTextSentiment: true },
      // knowledgeBaseNames: [knowledgeBasePath],
      payload: STRUCTJSON.jsonToStructProto({"msisdn": msisdn}),
      contexts:context
    }
  };
};

// 👇 method to call dialog flow
//------------------------------------------------------------------------------------------------
exports.Call = async function (queryText, rcsessionID, msisdn, context = []) {
  let sessionId = UUID.v4();
  let responses = [];

  if (context.length > 0) {
    const sessionIdTemp = context[0].name.split('/')[4];
    sessionId = sessionIdTemp;
  }
  try {
    let sessionClient = new DIALOGFLOW.SessionsClient();
    let sessionPath = sessionClient.projectAgentSessionPath(UTIL.GCP_PROJECT_ID, sessionId);
    let lastIntentSaved = await SESSION.GetLastIntent(rcsessionID)
    console.log("This was the last intent saved before checking for KC -> " + lastIntentSaved)
    if (lastIntentSaved == "FAQ.Enquiry.Maxis.Start" || lastIntentSaved == "FAQ.Restart.Maxis") {
      let request = CreateDfRequestMaxisKC(sessionPath, queryText, rcsessionID, msisdn, context);
      responses = await sessionClient.detectIntent(request);
      if (!responses[0].queryResult.parameters.fields.knowledgeAnswer) {
        console.log("No knowledge answer found, redirecting to fallback for Maxis FAQ")
        request = CreateDfRequest(sessionPath, "FAQ.RetrieveSuccessful.No.Maxis.Webhook", rcsessionID, msisdn, context);
        responses = await sessionClient.detectIntent(request);
      }
    } 
    else if (lastIntentSaved == "FAQ.Enquiry.Hotlink.Start" || lastIntentSaved == "FAQ.Restart.Hotlink") {
      let request = CreateDfRequestHotlinkKC(sessionPath, queryText, rcsessionID, msisdn, context);
      responses = await sessionClient.detectIntent(request);
      if (!responses[0].queryResult.parameters.fields.knowledgeAnswer) {
        console.log("No knowledge answer found, redirecting to fallback for Hotlink FAQ")
        request = CreateDfRequest(sessionPath, "FAQ.RetrieveSuccessful.No.Hotlink.Webhook", rcsessionID, msisdn, context);
        responses = await sessionClient.detectIntent(request);
      }
    }
    else{
      let request = CreateDfRequest(sessionPath, queryText, rcsessionID, msisdn, context);
      responses = await sessionClient.detectIntent(request);
    }
  } catch (err) {
    console.error(`🔻 Dialog Flow Error: [${sessionID}] [${err.toString()}]`, JSON.stringify(err));
    if (err.toString().includes("INVALID_ARGUMENT")) {
      responses.push({ "webhookStatus": { "message": "INVALID_ARGUMENT" } });
    } else {
      console.log("err", err);
      console.log(`🔻 Dialog Flow Error: [${msisdn}] [${err.toString()}]`);
      responses.push({ "webhookStatus": { "message": "UNAVAILABLE" } });
    }
  }

  console.log("🤮 Dialogflow response: ", JSON.stringify(responses));

  return responses[0];
}

exports.SpeechCall = async function(fileUrl, msisdn, context=[]) {
  let sessionId = UUID.v4();
  let responses = [];

  if (context.length > 0) {
    // sessionId = context[0].name.split('/')[4];
    const sessionIdTemp = context[0].name.split('/')[4];
    sessionId = sessionIdTemp;
  }
  console.log("sessionId", sessionId);
  try {
    let sessionClient = new DIALOGFLOW.SessionsClient();
    console.log("sessionClient", sessionClient);
    let sessionPath = sessionClient.projectAgentSessionPath(UTIL.GCP_PROJECT_ID, sessionId);
    console.log("sessionPath", sessionPath);

    let request = await CreateDfVoiceRequest(sessionPath, fileUrl, msisdn, context)

    console.log("request", JSON.stringify(request));
    responses = await sessionClient.detectIntent(request);
    console.log("responses", JSON.stringify(responses));
  } catch (err) {
    console.log('🐛 This is the error -> ', err)
    if (err.toString().includes("INVALID_ARGUMENT")) {
      responses.push({"webhookStatus":{"message" : "INVALID_ARGUMENT"}});
    } else {
      console.log("err", err);
      console.log(`🔻 Dialog Flow Error: [${msisdn}] [${err.toString()}]`);
      responses.push({"webhookStatus":{"message" : "UNAVAILABLE"}});
    }
  }

  console.log("🤮 dialogflow response");
  console.log(JSON.stringify(responses[0]));

  return responses[0];
}

// 👇 helper method to get Intent object from fullfillment request
//------------------------------------------------------------------------------------------------
exports.CreateFullfillmentResponse = function (taskResult) {
  if (taskResult.Context == undefined) {
    return {
      "fulfillmentMessages": [
        {
          "text": {
            "text": [
              taskResult.Text
            ]
          }
        }
      ],
      followupEventInput: {
        "name": taskResult.FollowUpEvent,
        "languageCode": "en-US",
        parameters: taskResult.Parameters
      }
    };
  } else {
    return {
      "fulfillmentMessages": [
        {
          "text": {
            "text": [
              taskResult.Text
            ]
          }
        }
      ],
      "outputContexts": [
        taskResult.Context
      ],
      followupEventInput: {
        "name": taskResult.FollowUpEvent,
        "languageCode": "en-US",
        parameters: taskResult.Parameters
      }
    };
  }
};

// 👇 helper method to get Intent object from fullfillment request
//------------------------------------------------------------------------------------------------
exports.GetIntent = function (fullfillmentRequest) {
  return fullfillmentRequest.queryResult.intent;
};

// 👇 helper method to get Context object from fullfillment request
//------------------------------------------------------------------------------------------------
exports.GetContext = function (fullfillmentRequest) {
  return fullfillmentRequest.queryResult.outputContent;
};
