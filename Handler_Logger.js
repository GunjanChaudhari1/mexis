const AWS = require('aws-sdk');
const CONSTANTS = require("./Constants");

//-------------------------------------------------------------------------------------------------------

AWS.config.update({ region: 'ap-southeast-1' });
const DB = new AWS.DynamoDB.DocumentClient();

//-------------------------------------------------------------------------------------------------------
const TARGET = CONSTANTS.DYNAMODB_TABLE_NAME_LOG; //👈 name of dynomodb table

//-------------------------------------------------------------------------------------------------------

//✋context data contract:
//-------------------------------------------------------------------------------------------------------
exports.WriteLog = async function (category="", message="", event={}, elapsed="") {

  const timeElapsed = Date.now();
  const today = new Date(timeElapsed);

  var params = {
      TableName: TARGET,
      Item: {
        'Entry'    : today.getTime().toString(),
        'Category' : category,
        'Event'    : JSON.stringify(event),
        'Message'  : message,
        'Elapsed'  : elapsed
      },
  };

  await DB.put(params).promise();
    
}

exports.WriteReport = async function (ringCentralId,channelName, msisdn, message, intentName, requestTimeStamp, responseTimeStamp,agentTransferStatus,threadId, botMessage="", score="", magnitude="") {

  let LogEntry = new Date().getTime().toString();
  var params = {
      TableName: TARGET,
      Item: {
        'Entry'       : LogEntry,
        'Category'    : "REPORT",
        'ChatId'      : ringCentralId,
        'Msisdn'      : msisdn,
        'IsAuthenticated': false,
        'HumanLine'     : message.substr(0,200).replace("\n","").replace(",",""),
        'Intent'  : intentName,
        'RequestTimeStamp' : requestTimeStamp,
        'ReponseTimeStamp' : responseTimeStamp,
        'Channel'     : channelName,
        'ResolutionStatus' : true,
        'AgentTransferStatus' : agentTransferStatus,
        'PageTransferStatus' : false,
        'SessionId'          : threadId,
        "BotLine" : botMessage.replace("\n","").replace(",",""),
        "Score":score, 
        "Magnitude":magnitude
      },
  };
  
  await DB.put(params).promise();
  console.log(`📝 Log Entry: ${LogEntry}`);
}
