const LOGGER = require('./Handler_Logger');
const SESSION = require('./Handler_Session');

// getter and setter for counter
async function getAgentAssistCounter(sessionID) {
  const cacheCounter = await SESSION.GetCache(sessionID);
  return cacheCounter.agentAssistCounter;
}
async function setAgentAssistCounter(sessionID, value) {
  const cacheCounter = await SESSION.GetCache(sessionID);
  cacheCounter.agentAssistCounter = value;
  await SESSION.SetCache(sessionID, cacheCounter);
}

// getter and setter for flag
async function getAgentAssistFlag(sessionID) {
  const cacheFlag = await SESSION.GetCache(sessionID);
  return cacheFlag.agentAssist30MinsFlag;
}
async function setAgentAssistFlag(sessionID, value) {
  const cacheFlag = await SESSION.GetCache(sessionID);
  cacheFlag.agentAssist30MinsFlag = value;
  await SESSION.SetCache(sessionID, cacheFlag);
}

// getter and setter for startTime
async function getStartTime(sessionID) {
  const cacheStartTime = await SESSION.GetCache(sessionID);
  return cacheStartTime.agentAssistStartTime;
}
async function setStartTime(sessionID, value) {
  const cacheStartTime = await SESSION.GetCache(sessionID);
  cacheStartTime.agentAssistStartTime = value;
  await SESSION.SetCache(sessionID, cacheStartTime);
}

// getter and setter for intent
// async function getAgentAssistIntent (msisdn){
//   let cacheIntent   = await SESSION.GetCache(msisdn);
//   return cacheIntent["agentAssistIntent"]
// }

async function setAgentAssistIntent(sessionID, value) {
  const cacheIntent = await SESSION.GetCache(sessionID);
  cacheIntent.agentAssistIntent = value;
  await SESSION.SetCache(sessionID, cacheIntent);
}

exports.SentimentCheck = async function (event, sessionID) {
  console.log('event ', event);
  console.log('event.queryResult ', event.queryResult);
  let StartTime = new Date().addHours(8).toUTCString();

  if (event.queryResult.action && event.queryResult.action !== 'input.unknown'
                              && !event.queryResult.action.includes('fallback')) {
    console.log('agent action name : ',event.queryResult.action);
    await setAgentAssistIntent(sessionID, event.queryResult.action);
  }

  if (event.queryResult.sentimentAnalysisResult && isNaN(event.queryResult.queryText)) {
    // let score = event.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    // let magnitude = event.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
    let { score } = event.queryResult.sentimentAnalysisResult.queryTextSentiment;
    let { magnitude } = event.queryResult.sentimentAnalysisResult.queryTextSentiment;
    // let thresholdScore = -0.89
    // let thresholdMagnitude = 0.89
    // let thresholdTime = 10
    let thresholdScore = process.env.THRESHOLD_SCORE;
    let thresholdMagnitude = process.env.THRESHOLD_MAGNITUDE;
    let thresholdTime = process.env.THRESHOLD_TIME;

    console.log('score ', score);
    console.log('magnitude ', magnitude);

    let tempArray = await getAgentAssistCounter(sessionID);
    console.log('tempArray : ', tempArray);

    // Adding logger
    let RcThreadId = await SESSION.getThreadId(sessionID);
    let RcMessageId = await SESSION.getMessageId(sessionID);
    // let queryText = event.queryResult.queryText;
    // let displayName = event.queryResult.intent.displayName;
    let { queryText } = event.queryResult;
    let { displayName } = event.queryResult.intent;
    let EndTime = new Date().addHours(8).toUTCString();
    // No BOT response will be available for webhook request in dialogflow
    let botMessage = '';
    let ChannelName = await SESSION.getChannelName(sessionID);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let lastIntentSaved = await SESSION.GetLastIntent(sessionID);
    console.log('This is the last intent saved before logging -> ' + lastIntentSaved);
    if (displayName === 'Shared.Closure.Entry.Webhook') {
      console.log('Writing to logger in sentiment',ChannelName + '|'+ RcMessageId + '|' + queryText + '|' + lastIntentSaved + '|' + StartTime + '|' + EndTime + '|' + RcThreadId + '|' + botMessage + '|' + score + '|' + magnitude +'|' + sessionID);
      await LOGGER.WriteReport(RcMessageId,ChannelName, msisdn, queryText, lastIntentSaved, StartTime, EndTime, false, RcThreadId, botMessage, score, magnitude);
    } else {
      console.log('Writing to logger in sentiment',ChannelName + '|'+ RcMessageId + '|' + queryText + '|' + displayName + '|' + StartTime + '|' + EndTime + '|' + RcThreadId + '|' + botMessage + '|' + score + '|' + magnitude +'|' + sessionID);
      await LOGGER.WriteReport(RcMessageId,ChannelName, msisdn, queryText, displayName, StartTime, EndTime, false, RcThreadId, botMessage, score, magnitude);
    }
    let checkStartTime = await getStartTime(sessionID);
    console.log('checkStartTime : ', checkStartTime);
    if (!checkStartTime) {
      let startDateTime = new Date();
      let startTime = startDateTime.getTime();
      await setStartTime(sessionID, startTime);
      console.log('startTime : ', startTime);
    }

    if (score<=thresholdScore && magnitude>=thresholdMagnitude) {
      console.log('Welcome !! check !tempArray : ', !tempArray);

      if (!tempArray || tempArray.length<1) {
        let newArray = [];
        newArray.push(score);
        await setAgentAssistCounter(sessionID,newArray);
        console.log('updated counter in !tempArray with ');
      } else if (tempArray.length >= 1) {
        let agentAssistFlag = await getAgentAssistFlag(sessionID);
        console.log('before agentAssistFlag', agentAssistFlag);

        let startTime = await getStartTime(sessionID);
        let endDateTime = new Date();
        let endTime = endDateTime.getTime();

        let calc30mins = Math.round((endTime-startTime)/60000);
        console.log('i am out calc30mins endTime : ', endTime);
        console.log('i am out calc30mins StartTime : ', startTime);
        console.log('i am out calc30mins : ', calc30mins);

        if (!agentAssistFlag || calc30mins >= thresholdTime) {
          console.log('call agent assist and counter got reset');
          console.log('i am in calc30mins endTime : ', endTime);
          console.log('i am in calc30mins StartTime : ', startTime);
          console.log('i am in calc30mins : ', calc30mins);
          tempArray = [];
          await setAgentAssistCounter(sessionID,tempArray);
          await setStartTime(sessionID,endTime);
          await setAgentAssistFlag(sessionID,true);

          let text = 'Please confirm with Yes, if you to connect to an Agent';
          console.log('getAgentAssistFlag : ', await getAgentAssistFlag(sessionID));

          return {
            'fulfillmentMessages': [
              {
                'text' : {
                  'text' : [
                    text
                  ]
                }
              }
            ],
            followupEventInput: {
              'name': 'AgentHandover_Sentiment_AgentAssist_Offer',
              'languageCode': 'en-US',
              parameters: event.queryResult.parameters
            }
          };
        }
      }
    } else {
      tempArray = [];
      await setAgentAssistCounter(sessionID,tempArray);
      console.log(' counter reset in if  ');
    }
  } else if ((event.queryResult.intent.displayName.includes('Greeting.MainMenu') &&
           (event.queryResult.queryText !== '*' || isNaN(event.queryResult.queryText)))
  ) {
    console.log(' sentiment is in Greeting.MainMenu ');
  } else {
    let tempArray = [];
    await setAgentAssistCounter(sessionID,tempArray);
    console.log(' sentiment counter resetting in else inside checksentiment');
  }

  return false;
};
