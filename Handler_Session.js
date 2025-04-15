const AWS = require('aws-sdk');
const CONSTANTS = require('./Constants');

AWS.config.update({ region: 'ap-southeast-1' });
const DB = new AWS.DynamoDB.DocumentClient();

// -------------------------------------------------------------------------------------------------
const TARGET = CONSTANTS.DYNAMODB_TABLE_NAME_SESSION;
// -------------------------------------------------------------------------------------------------

exports.KeepAlive = async function (sessionData) {
  const ttl = 60;
  const EXPIRE = (Math.floor(Date.now() / 1000)) + (ttl * 60);

  // 👇check if supplied sessionID exists
  const param = { TableName: TARGET, Key: { SessionID: sessionData.session_id } };
  const result = await DB.get(param).promise();

  // 👇create session if sessionID does NOT exists otherwise update TTL
  if (result == undefined || Object.keys(result).length === 0) {
    const params = {
      TableName: TARGET,
      Item: {
        SessionID: sessionData.session_id,
        MSISDN: sessionData.msisdn,
        IsAuthenticated: false,
        Cache: {},
        LastContext: JSON.stringify([]),
        LastIntent: '',
        RcMessageId: sessionData.message_id,
        TTL: EXPIRE,
        IsClosed: false,
        CustomerType: {},
        HandOver: {},
        RcThreadId: sessionData.session_id,
        RcAuthorId: sessionData.author_id,
        SessionStartTime: new Date().toUTCString(),
        StartTime: new Date().toUTCString(),
        FiberDiagnosis: '',
        ChannelID: sessionData.channel_id,
        ChannelName: sessionData.channel_name,
        ApiGatewayRequestId: sessionData.api_request_id,
        LastAccessTime: Math.floor(Date.now() / 1000),
        AgentAssistTransfer: false,
        IdleLastEvent: '',
        IdlePlanType: '',
        idlelastEventParam: '',
        TacCount: 0,
        SessionBlockDateTime: 0,
        menuAppear: true,
        IdleTimeOutNotify: false,
      },
    };

    await DB.put(params).promise();
  } else {
    const params = {
      TableName: TARGET,
      Key: { SessionID: sessionData.session_id },
      UpdateExpression: 'set #TS=:A, #TR=:B, #MS=:C,#LAT=:D,#MA=:E ',
      ExpressionAttributeValues: {
        ':A': EXPIRE,
        ':B': sessionData.session_id,
        ':C': sessionData.message_id,
        ':D': Math.floor(Date.now() / 1000),
        ':E': false,
      },
      ExpressionAttributeNames: {
        '#TS': 'TTL',
        '#TR': 'RcThreadId',
        '#MS': 'RcMessageId',
        '#LAT': 'LastAccessTime',
        '#MA': 'menuAppear',
      },
    };

    await DB.update(params).promise();
  }

  return true;
};

exports.getStartTime = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  return 'StartTime' in result.Item ? result.Item.StartTime : '';
};

exports.getThreadId = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  return 'RcThreadId' in result.Item ? result.Item.RcThreadId : '';
};

exports.getMessageId = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  return 'RcMessageId' in result.Item ? result.Item.RcMessageId : '';
};

exports.SetClose = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set IsClosed =:A, StartTime=:B',
    ExpressionAttributeValues: {
      ':A': value,
      ':B': new Date().toUTCString(),
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.GetClose = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  return result.Item.IsClosed;
};

exports.SetContext = async function (sessionID, context) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set LastContext =:A',
    ExpressionAttributeValues: {
      ':A': JSON.stringify(context),
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.GetContext = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  let context = [];

  if (result.Item != undefined && 'LastContext' in result.Item) {
    const LastContext = JSON.parse(result.Item.LastContext);

    if (Object.keys(LastContext).length > 0) context = LastContext;
  }

  return context;
};

exports.SetHandOver = async function (sessionID, object) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set HandOver =:A',
    ExpressionAttributeValues: {
      ':A': object,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.GetHandOver = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  return result.Item.HandOver == undefined ? { IsHandOver: false } : result.Item.HandOver;
};

exports.SetCache = async function (sessionID, object) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set Cache =:A',
    ExpressionAttributeValues: {
      ':A': object,
    },
  };

  const a = await DB.update(param).promise();

  return a;
};

exports.GetCache = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return {};
  return 'Cache' in result.Item ? result.Item.Cache : {};
};

exports.GetIsAuthenticated = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) {
    return false;
  }
  return ('IsAuthenticated' in result.Item) ? result.Item.IsAuthenticated : false;
};

exports.SetIsAuthenticated = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set IsAuthenticated =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

// When we test intents directly from DialogFlow, it uses MSISDN from aws environment
// variable and TTL is not getting updated. It leaves orphan records in dynamodb
// hence updating TTL will trigger garbage collector to clean up the records.
exports.SetLastIntent = async function (sessionID, value) {
  const EXPIRE = (Math.floor(Date.now() / 1000)) + (60 * 60);
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set #TS=:A, #TR=:B',
    ExpressionAttributeValues: {
      ':A': EXPIRE,
      ':B': value,
    },
    ExpressionAttributeNames: {
      '#TS': 'TTL',
      '#TR': 'LastIntent',
    },
  };
  await DB.update(param).promise();

  return true;
};

exports.SetLastIntentForDf = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set #TR=:B',
    ExpressionAttributeValues: {
      ':B': value,
    },
    ExpressionAttributeNames: {
      '#TR': 'LastIntent',
    },
  };
  await DB.update(param).promise();

  return true;
};

exports.SetCurrentIntent = async function (sessionID, value) {
	let param = {
		TableName: TARGET,
		Key: { "SessionID": sessionID },
		UpdateExpression: "set CurrentIntent =:A",
		ExpressionAttributeValues: {
			":A": value
		},
	};

	await DB.update(param).promise();
	return true;
}

exports.GetCurrentIntent = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.CurrentIntent;
};

exports.GetLastIntent = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  if (result == undefined || Object.keys(result).length == 0) return 'Greeting.Start1';
  return result.Item.LastIntent;
};

exports.SetLastEvent = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set LastEvent =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.GetLastEvent = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.LastEvent;
};

exports.SetAuthenticationCount = async function (sessionID) {
  let value = await exports.GetAuthenticationCount(sessionID);
  value += 1;

  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set AuthenticationCount =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.ResetAuthenticationCount = async function (sessionID) {
  const value = 1;

  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set AuthenticationCount =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.GetAuthenticationCount = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();
  if (result == undefined || Object.keys(result).length == 0) return 1;
  return ('AuthenticationCount' in result.Item) ? result.Item.AuthenticationCount : 1;
};

exports.GetCustomerType = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return ('CustomerType' in result.Item) ? result.Item.CustomerType : undefined;
};

exports.SetCustomerType = async function (sessionID, object) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set CustomerType =:A',
    ExpressionAttributeValues: {
      ':A': object,
    },
  };

  await DB.update(param).promise();
  return true;
};

exports.DeleteSession = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  await DB.delete(param).promise();
};

exports.DeleteProfile = async function (sessionID) {
  const param = {
    TableName: CONSTANTS.DYNAMODB_TABLE_NAME_PROFILE,
    Key: { SessionID: sessionID },
  };

  await DB.delete(param).promise();
};
exports.GetMSISDN = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return ('MSISDN' in result.Item) ? result.Item.MSISDN : undefined;
};

exports.SetMSISDN = async function (sessionID, object) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set MSISDN =:A',
    ExpressionAttributeValues: {
      ':A': object,
    },
  };

	await DB.update(param).promise();
	return true;
}

exports.GetPrimaryMSISDN = async function (sessionID) {

	let param = {
		TableName: TARGET,
		Key: { "SessionID": sessionID },
	};

	let result = await DB.get(param).promise();

	if (result == undefined || Object.keys(result).length == 0)
		return undefined;
	else
		return ("Primary_MSISDN" in result.Item) ? result.Item.Primary_MSISDN : undefined;
}


exports.SetPrimaryMSISDN = async function (sessionID, object) {

	let param = {
		TableName: TARGET,
		Key: { "SessionID": sessionID },
		UpdateExpression: "set Primary_MSISDN =:A",
		ExpressionAttributeValues: {
			":A": object
		},
	};

	await DB.update(param).promise();
	return true;
}
// ----------------------------------for locate payment -------------
exports.GetCaseType = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return ('CaseType' in result.Item) ? result.Item.CaseType : undefined;
};

exports.SetCaseType = async function (sessionID, object) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set CaseType =:A',
    ExpressionAttributeValues: {
      ':A': object,
    },
  };

  await DB.update(param).promise();
  return true;
};

//-------------------------------------------------------------------------
// âœ‹ TROUBLESHOOT WIFI CALLBACK
//-------------------------------------------------------------------------
exports.UpdateFiberDiagnosis = async function (sessionID, requestId, actionType) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set FiberDiagnosis=:A',
    ExpressionAttributeValues: {
      ':A': `${actionType}_${requestId}`,
    },
  };

  await DB.update(param).promise();
  return true;
};

exports.GetIdentityByFiberDiagnosis = async function (requestId, actionType) {
  // let WifiObject = {"Status":"", "Ack":"success", "actionType":actionType, "RequestId":requestId};

  const params = {
    TableName: TARGET,
    FilterExpression: 'FiberDiagnosis=:Val',
    ExpressionAttributeValues: {
      ':Val': `${actionType}_${requestId}`,
    },

  };

  const scanResults = [];
  let query;

  do {
    query = await DB.scan(params).promise();
    query.Items.forEach((item) => scanResults.push(item));
    params.ExclusiveStartKey = query.LastEvaluatedKey;
  } while (typeof query.LastEvaluatedKey !== 'undefined');

  // let query  = await DB.scan(params).promise();
  // console.log(`FiberDiagnosis RequestId: ${requestId}, found: ${query.Items.length}`);
  // let result = query.Items[0];

  console.log(`FiberDiagnosis RequestId: ${requestId}, found: ${scanResults.length}`);
  const result = scanResults[0];

  if (result != undefined && Object.keys(result).length > 0) {
    return { msisdn: result.MSISDN, sessionID: result.SessionID, messageId: result.RcMessageId };
  }
  return undefined;
};

//-------------------------------------------------------------------------
// âœ‹ PROFILE
//-------------------------------------------------------------------------
exports.SetProfile = async function (sessionID, displayName) {
  const min = 60; // 1 Hours
  const EXPIRE = (Math.floor(Date.now() / 1000)) + (min * 60);

  const param = {
    TableName: CONSTANTS.DYNAMODB_TABLE_NAME_PROFILE,
    Item: {
      SessionID: sessionID,
      DisplayName: displayName,
      TTL: EXPIRE,
    },
  };

  await DB.put(param).promise();
  return true;
};

exports.GetDisplayName = async function (sessionID) {
  const param = {
    TableName: CONSTANTS.DYNAMODB_TABLE_NAME_PROFILE,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return '';
  return ('DisplayName' in result.Item) ? result.Item.DisplayName : '';
};

exports.getIdleUsers = async function () {
  const getParam = {
    TableName: TARGET,
    ExpressionAttributeValues: {
      ':LastIntent': 'Greeting',
    },
    ExpressionAttributeNames: {
      '#LI': 'LastIntent',
    },
  };
  console.log('getParam handler session file', getParam);
  const result = await DB.query().promise();
  return result;
};

// IdleLastEvent
exports.SetIdleLastEvent = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set IdleLastEvent =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.GetIdleLastEvent = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.IdleLastEvent;
};

exports.GetIdlePlantype = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.IdlePlanType;
};

exports.SetIdlePlanType = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set IdlePlanType =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.GetIdlelastEventParam = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.idlelastEventParam;
};

exports.SetIdlelastEventParam = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set idlelastEventParam =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.Get10MinsIdleTimeSession = async function (idleTimeInMins, intentPrefix) {
  const EXPIRE = (Math.floor(Date.now() / 1000)) - (idleTimeInMins * 60);

  const userSessions = [];
  const params = {
    TableName: TARGET,
    FilterExpression: 'begins_with(LastIntent, :LastIntent) AND IdleTimeOutNotify =:IdleTimeOutNotify AND LastAccessTime <=:LastAccessTime',
    ExpressionAttributeValues: {
      ':LastIntent': intentPrefix,
      ':IdleTimeOutNotify': false,
      ':LastAccessTime': EXPIRE,
    },
  };

  do {
    query = await DB.scan(params).promise();
    query.Items.forEach((item) => userSessions.push(item));
    params.ExclusiveStartKey = query.LastEvaluatedKey;
  } while (typeof query.LastEvaluatedKey !== 'undefined');

  return userSessions;
};

exports.SetAgentAssistTransfer = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set AgentAssistTransfer =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.SetIdleTimeOutNotify = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set IdleTimeOutNotify =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.getAuthTime = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.SessionBlockDateTime;
};

exports.SetAuthTime = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set SessionBlockDateTime =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.getAuthCount = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.TacCount;
};

exports.SetAuthCount = async function (sessionID, value) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
    UpdateExpression: 'set TacCount =:A',
    ExpressionAttributeValues: {
      ':A': value,
    },
  };

  await DB.update(param).promise();

  return true;
};

exports.getMenuAppear = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.menuAppear;
};

exports.getChannelName = async function (sessionID) {
  const param = {
    TableName: TARGET,
    Key: { SessionID: sessionID },
  };

  const result = await DB.get(param).promise();

  if (result == undefined || Object.keys(result).length == 0) return undefined;
  return result.Item.ChannelName;
};
