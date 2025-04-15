// 📢 General Reference And Declaration
//---------------------------------------------------------------------------------------
// const FETCH         = require('node-fetch');
const moment = require('moment');
const MomentBusinessTime = require('moment-business-time');

const FETCH = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { performance } = require('perf_hooks'); // 👈 must be lowercase
// const ABORT = require("abort-controller");
const CALLER = require('caller-id');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'ap-southeast-1' });
const S3 = new AWS.S3();
const UUID = require('uuid');
const fs = require('fs');
const momentTimezone = require('moment-timezone');
const SESSION = require('./Handler_Session');
const CONSTANTS = require('./Constants');
const HOST = require('./Handler_Host');
const { TAC } = require('./Handler_Host');

const CHANNEL_WHATSAPP_SOURCE_DEV = '6297694e0e69dc98dd29d8f9';
const CHANNEL_WHATSAPP_SOURCE_STAGE = '5df896505267225d441d7d26';
const CHANNEL_WHATSAPP_SOURCE_PROD = '5ce51eea799fc276b79ad240';

const CHANNEL_FACEBOOK_HOTLNK_SOURCE_DEV = '6204e8fc52672237474e36eb';
const CHANNEL_FACEBOOK_HOTLNK_SOURCE_STAGE = '6204e8fc52672237474e36eb';
const CHANNEL_FACEBOOK_HOTLNK_SOURCE_PROD = '6204e8fc52672237474e36eb';

const CHANNEL_FACEBOOK_MAXIS_SOURCE_DEV = '620e46a5dbddbb34ecb076f8';
const CHANNEL_FACEBOOK_MAXIS_SOURCE_STAGE = '620e4796dbddbb27a478d94b';
const CHANNEL_FACEBOOK_MAXIS_SOURCE_PROD = '6204e8cc5267223745bd2349';

const CHANNEL_TWITTER_SOURCE_DEV = '620e4c235267220a4d7b1381';
const CHANNEL_TWITTER_SOURCE_STAGE = '620e4c235267220a4d7b1381';
const CHANNEL_TWITTER_MAXIS_SOURCE_PROD = '';

const CHANNEL_TWITTER_HOTLNK_SOURCE_PROD = '';

const CHANNEL_LIVE_CHAT_SOURCE_DEV = '62bc64a502833d02fd8388c7';
const CHANNEL_LIVE_CHAT_SOURCE_STAGE = '62bc64a502833d02fd8388c7';
const CHANNEL_LIVE_CHAT_MAXIS_SOURCE_PROD = '';

const CHANNEL_LIVE_CHAT_HOTLINK_SOURCE_PROD = '';

exports.GCP_PROJECT_ID = null;
exports.RC_DIMELO_SECRET = null;

exports.RC_ACCESS_TOKEN = null;
exports.RC_VERFICATION_TOKEN = null;

// By deafult refer to Dev values
exports.GCP_PROJECT_ID = CONSTANTS.GCP_PROJECT_ID_DEV;
exports.GCP_CREDENTIALS_KEY = CONSTANTS.GCP_SECRET_KEY_NAME_DEV;
exports.GCP_KNOWLEDGE_MAXIS_ID = CONSTANTS.GCP_KNOWLEDGE_MAXIS_DEV;
exports.GCP_KNOWLEDGE_HOTLINK_ID = CONSTANTS.GCP_KNOWLEDGE_HOTLINK_DEV;
exports.RC_ACCESS_TOKEN_KEY = CONSTANTS.RC_ACCESS_TOKEN_SECRET_KEY;
exports.RC_VERIFICATION_TOKEN_KEY = CONSTANTS.RC_VERIFICATION_TOKEN_SECRET_KEY_DEV;

exports.getChannelBySource = function (sourceId) {
  let channelName = '';
  switch (sourceId) {
    case CHANNEL_WHATSAPP_SOURCE_DEV:
    case CHANNEL_WHATSAPP_SOURCE_STAGE:
    case CHANNEL_WHATSAPP_SOURCE_PROD:
      channelName = CONSTANTS.CHANNEL_NAME_WHATSAPP;
      break;
    case CHANNEL_FACEBOOK_HOTLNK_SOURCE_DEV:
    case CHANNEL_FACEBOOK_HOTLNK_SOURCE_STAGE:
    case CHANNEL_FACEBOOK_HOTLNK_SOURCE_PROD:
      channelName = CONSTANTS.CHANNEL_NAME_FACEBOOK_HOTLINK;
      break;
    case CHANNEL_FACEBOOK_MAXIS_SOURCE_DEV:
    case CHANNEL_FACEBOOK_MAXIS_SOURCE_STAGE:
    case CHANNEL_FACEBOOK_MAXIS_SOURCE_PROD:
      channelName = CONSTANTS.CHANNEL_NAME_FACEBOOK_MAXIS;
      break;
    case CHANNEL_TWITTER_SOURCE_DEV:
    case CHANNEL_TWITTER_SOURCE_STAGE:
    case CHANNEL_TWITTER_HOTLNK_SOURCE_PROD:
      channelName = CONSTANTS.CHANNEL_NAME_TWITTER_HOTLINK;
      break;
    // case CHANNEL_TWITTER_SOURCE_DEV:
    // case CHANNEL_TWITTER_SOURCE_STAGE:
    case CHANNEL_TWITTER_MAXIS_SOURCE_PROD:
      channelName = CONSTANTS.CHANNEL_NAME_TWITTER_MAXIS;
      break;
    case CHANNEL_LIVE_CHAT_SOURCE_DEV:
    case CHANNEL_LIVE_CHAT_SOURCE_STAGE:
    case CHANNEL_LIVE_CHAT_MAXIS_SOURCE_PROD:
      channelName = CONSTANTS.CHANNEL_NAME_LIVE_CHAT;
      break;
    // case CHANNEL_LIVE_CHAT_SOURCE_DEV:
    // case CHANNEL_LIVE_CHAT_SOURCE_STAGE:
    case CHANNEL_LIVE_CHAT_HOTLINK_SOURCE_PROD:
      channelName = CONSTANTS.CHANNEL_NAME_LIVE_HOTLINK_CHAT;
      break;
    default:
      console.log(sourceId);
      break;
  }
  return channelName;
};

exports.populateEnvironmentKeys = function () {
  if (process.env.HOST_TARGET == CONSTANTS.ENV_VAR_STAGE) {
    this.GCP_PROJECT_ID = CONSTANTS.GCP_PROJECT_ID_STAGE;
    this.GCP_KNOWLEDGE_MAXIS_ID = CONSTANTS.GCP_KNOWLEDGE_MAXIS_STAGE;
    this.GCP_KNOWLEDGE_HOTLINK_ID = CONSTANTS.GCP_KNOWLEDGE_HOTLINK_STAGE;
    this.GCP_CREDENTIALS_KEY = CONSTANTS.GCP_SECRET_KEY_NAME_STAGE;
    this.RC_VERIFICATION_TOKEN_KEY = CONSTANTS.RC_VERIFICATION_TOKEN_SECRET_KEY_STAGE;
  } else if (process.env.HOST_TARGET == CONSTANTS.ENV_VAR_PROD) {
    this.GCP_PROJECT_ID = CONSTANTS.GCP_PROJECT_ID_PROD;
    this.GCP_KNOWLEDGE_MAXIS_ID = CONSTANTS.GCP_KNOWLEDGE_MAXIS_PROD;
    this.GCP_KNOWLEDGE_HOTLINK_ID = CONSTANTS.GCP_KNOWLEDGE_HOTLINK_PROD;
    this.GCP_CREDENTIALS_KEY = CONSTANTS.GCP_SECRET_KEY_NAME_PROD;
    this.RC_VERIFICATION_TOKEN_KEY = CONSTANTS.RC_VERIFICATION_TOKEN_SECRET_KEY_PROD;
  } else if (process.env.HOST_TARGET == CONSTANTS.ENV_VAR_MC) {
    this.GCP_PROJECT_ID = CONSTANTS.GCP_PROJECT_ID_MC;
    this.GCP_CREDENTIALS_KEY = CONSTANTS.GCP_SECRET_KEY_NAME_MC;
    this.RC_VERIFICATION_TOKEN_KEY = CONSTANTS.RC_VERIFICATION_TOKEN_SECRET_KEY_MC; // DCCMaxBotRCVerificationTokenMC
  }
};

//---------------------------------------------------------------------------------------
Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
};

exports.getSystemsParamsValue = async function (paramKey) {
  const ssmClient = new AWS.SSM({
    apiVersion: '2014-11-06',
    region: 'ap-southeast-1',
  });

  let secretValue = null;

  await ssmClient.getParameter({ Name: paramKey, WithDecryption: true }).promise()
    .then((data) => { secretValue = data.Parameter.Value; })
    .catch((err) => { console.error(`Cannot get secret ${paramKey} from parameter store`, err); });
  return secretValue;
};

exports.populateRCAccessTokenSecret = async function () {
  this.RC_ACCESS_TOKEN = await this.getSystemsParamsValue(this.RC_ACCESS_TOKEN_KEY);
};

exports.populateRCVerficationTokenSecret = async function () {
  this.RC_VERFICATION_TOKEN = await this.getSystemsParamsValue(this.RC_VERIFICATION_TOKEN_KEY);
};

exports.populateGCPCredentialsSecret = async function () {
  const secretKeyName = this.GCP_CREDENTIALS_KEY;
  const secretValue = await this.getSystemsParamsValue(secretKeyName);
  if (secretValue) {
    const unique_credentials_id = UUID.v4();
    fs.writeFile(`/tmp/key_${unique_credentials_id}.json`, secretValue, (err) => {
      if (err) {
        console.error(`Cannot create GCP credentials for ${gcpCredentialsKey}`, err);
      } else {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = `/tmp/key_${unique_credentials_id}.json`;
      }
    });
  }
};
exports.populateRCDimeloSecret = async function () {
  this.RC_DIMELO_SECRET = await this.getSystemsParamsValue(CONSTANTS.RC_DIMELO_SECRET_KEY);
};

exports.GetDateDiffInDays = function (earlierDate, laterDate) {
  const diffTime = Math.abs(laterDate - earlierDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

exports.GetDateDiffInMonths = function (laterDate, earlierDate) {
  let months = 0;
  months = (laterDate.getFullYear() - earlierDate.getFullYear()) * 12;
  months -= earlierDate.getMonth();
  months += laterDate.getMonth();
  return months <= 0 ? 0 : months;
};

exports.IsAgentOnline = function (startDay, endDay, startTime, endTime) {
  // let dayInt = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sDay = startDay; // dayInt.indexOf(startDay);
  const eDay = endDay; // dayInt.indexOf(endDay);
  const today = new Date().getDay();

  const sTime = parseInt(startTime.substr(0, 2)) * 60 + parseInt(startTime.substr(2, 2));
  const eTime = parseInt(endTime.substr(0, 2)) * 60 + parseInt(endTime.substr(2, 2));
  const GMT = 8;
  const now = (new Date().getHours() + GMT) * 60 + new Date().getMinutes();

  if ((today >= sDay && today <= eDay) && (sTime <= now && now <= eTime)) return true;
  return false;
};

exports.IsAgentOnline2 = function (startDay, endDay, startTime, endTime, shortStartTime, shortEndTime) {
  // let dayInt  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sDay = startDay; // dayInt.indexOf(startDay);
  const eDay = endDay; // dayInt.indexOf(endDay);
  const today = new Date().getDay();

  const sTime = parseInt(startTime.substr(0, 2)) * 60 + parseInt(startTime.substr(2, 2));
  const eTime = parseInt(endTime.substr(0, 2)) * 60 + parseInt(endTime.substr(2, 2));

  const GMT = 8;
  let hourNow = new Date().getHours() + GMT;
  hourNow = hourNow >= 24 ? hourNow - 24 : hourNow;

  const now = (hourNow) * 60 + new Date().getMinutes();

  const shortSTime = parseInt(shortStartTime.substr(0, 2)) * 60 + parseInt(shortStartTime.substr(2, 2));
  const shortETime = parseInt(shortEndTime.substr(0, 2)) * 60 + parseInt(shortEndTime.substr(2, 2));

  // if ((today >= sDay && today <= eDay) && (sTime <= now && now <= eTime))
  //   return true;
  // else
  //   return false;

  if (today >= sDay && today <= eDay) {
    if ((sDay != 6 && (sTime <= now && now <= eTime)) || (sDay == 6 && (shortSTime <= now && now <= shortETime))) {
      return true;
    }
  }

  return false;
};

exports.GetContextValue = function (event, contextName, paramName) {
  let result;

  if (event.queryResult.outputContexts && event.queryResult.outputContexts.length > 0) {
    const data = event.queryResult.outputContexts;

    data.forEach((element) => {
      if (element.name.endsWith(contextName)) {
        result = element.parameters[paramName];
      }
    });
  }

  if (isNaN(result) == false) result = parseInt(result);

  return result;
};
exports.GetDateDiffInMonths = function (laterDate, earlierDate) {
  let months = 0;
  months = (laterDate.getFullYear() - earlierDate.getFullYear()) * 12;
  months -= earlierDate.getMonth();
  months += laterDate.getMonth();
  return months <= 0 ? 0 : months;
};

exports.IsAgentOnline = function (startDay, endDay, startTime, endTime) {
  // let dayInt = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sDay = startDay; // dayInt.indexOf(startDay);
  const eDay = endDay; // dayInt.indexOf(endDay);
  const today = new Date().getDay();

  const sTime = parseInt(startTime.substr(0, 2)) * 60 + parseInt(startTime.substr(2, 2));
  const eTime = parseInt(endTime.substr(0, 2)) * 60 + parseInt(endTime.substr(2, 2));
  const GMT = 8;
  const now = (new Date().getHours() + GMT) * 60 + new Date().getMinutes();
  if ((today >= sDay && today <= eDay) && (sTime <= now && now <= eTime)) return true;
  return false;
};

exports.IsAgentOnline2 = function (startDay, endDay, startTime, endTime, shortStartTime, shortEndTime) {
  // let dayInt = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sDay = startDay; // dayInt.indexOf(startDay);
  const eDay = endDay; // dayInt.indexOf(endDay);
  const today = new Date().getDay();

  const sTime = parseInt(startTime.substr(0, 2)) * 60 + parseInt(startTime.substr(2, 2));
  const eTime = parseInt(endTime.substr(0, 2)) * 60 + parseInt(endTime.substr(2, 2));

  const GMT = 8;
  let hourNow = new Date().getHours() + GMT;
  hourNow = hourNow >= 24 ? hourNow - 24 : hourNow;

  const now = (hourNow) * 60 + new Date().getMinutes();

  const shortSTime = parseInt(shortStartTime.substr(0, 2)) * 60 + parseInt(shortStartTime.substr(2, 2));
  const shortETime = parseInt(shortEndTime.substr(0, 2)) * 60 + parseInt(shortEndTime.substr(2, 2));

  // if ((today >= sDay && today <= eDay) && (sTime <= now && now <= eTime))
  //   return true;
  // else
  //   return false;

  if (today >= sDay && today <= eDay) {
    if ((sDay != 6 && (sTime <= now && now <= eTime)) || (sDay == 6 && (shortSTime <= now && now <= shortETime))) {
      return true;
    }
  }

  return false;
};

exports.GetUrl = async function (url, header = undefined, msisdn = undefined, sessionID = undefined) {
  console.log('exports.GetUrl calling', url, header, msisdn, sessionID);
  const { functionName } = CALLER.getData();
  let data = {};
  let isUsingCache = false;

  const msisdnText = `${msisdn == undefined ? '' : ` [${msisdn}] `}`;

  console.log(`🤞 fetching:${msisdnText}[${url}] [${JSON.stringify(header)}]`);
  const A = performance.now();

  try {
    // 👇 if msisdn is supplied, then check if cache exist
    if (msisdn != undefined) {
      const cache = await SESSION.GetCache(sessionID);
      const dataCache = cache[functionName];

      if (dataCache != undefined && Object.keys(dataCache).length > 0) {
        isUsingCache = true;
        data = dataCache;
      }
    }

    if (isUsingCache == false) {
      if (header != undefined && Object.keys(header).length > 0) {
        data = await FETCH(url, header);
      } else {
        data = await FETCH(url);
      }
      data = await data.json();

      // 👇 if msisdn is supplied, then cache into session
      if (msisdn != undefined && data.status == 'success') {
        const cache = await SESSION.GetCache(sessionID);
        cache[functionName] = data;
        await SESSION.SetCache(sessionID, cache);
      }
    }
  } catch (err) {
    console.log(`🔻 ERROR: Fetching URL ${functionName}, ${err}`);
    data = undefined;
  } finally {
    const B = performance.now();
    const C = B - A;
    const SEC = (C / 1000).toFixed(3);

    if (C <= 1000) {
      console.log(`🐇 ${isUsingCache ? '🏃‍♀️' : '☁'}${msisdnText}: ${functionName} [${SEC}s]`);
    } else {
      console.log(`🐌 ${isUsingCache ? '🏃‍♀️' : '☁'}${msisdnText}: ${functionName} [${SEC}s]`);
    }

    exports.Dump(data, url, header, msisdnText);
  }
  return data;
};

exports.ComposeResult = function (text, followUpEvent = '', returnParam = {}, context = undefined) {
  console.log('composeresult ', {
    Text: text, FollowUpEvent: followUpEvent, Parameters: returnParam, Context: context,
  });
  return {
    Text: text, FollowUpEvent: followUpEvent, Parameters: returnParam, Context: context,
  };
};

exports.GetContextValue = function (event, contextName, paramName) {
  let result;

  if (event.queryResult.outputContexts && event.queryResult.outputContexts.length > 0) {
    const data = event.queryResult.outputContexts;

    data.forEach((element) => {
      if (element.name.endsWith(contextName)) {
        result = element.parameters[paramName];
      }
    });
  }

  if (isNaN(result) == false) result = parseInt(result);

  return result;
};

exports.GetParameterValue = function (event, paramName) {
  console.log('GetParameterValue=>>>', JSON.stringify(event));
  try {
    const parseEvent = JSON.parse(JSON.stringify(event));
    console.log('if loop get parameter');
    return parseEvent.queryResult.parameters[paramName];
  } catch {
    console.log('else loop get parameter');
    return '';
  }
};

exports.IsContainFallbackMessage = function (queryResult) {
  try {
    return queryResult.parameters.fields.fallbackMessage.stringValue != '';
  } catch {
    return false;
  }
};

exports.GetActionParameters = function (fullfillmentResponse) {
  try {
    const rawParam = fullfillmentResponse.parameters;

    if (rawParam == undefined || Object.keys(rawParam).length == 0) {
      return {};
    }
    const cleanParam = {};

    const paramKeys = Object.keys(rawParam.fields);

    for (let i = 0; i < paramKeys.length; i++) {
      if ('structValue' in rawParam.fields[paramKeys[i]]) {
        cleanParam[paramKeys[i]] = rawParam.fields[paramKeys[i]].structValue.fields.name.stringValue;
      }

      if ('stringValue' in rawParam.fields[paramKeys[i]]) {
        cleanParam[paramKeys[i]] = rawParam.fields[paramKeys[i]].stringValue;
      }
    }

    cleanParam.fallbackMessage = "I didn't quite get that. Would you mind choosing a number next to your preferred choice?";

    return cleanParam;
  } catch {
    return {};
  }
};

exports.GetAction = function (fullfillmentResponse) {
  try {
    return fullfillmentResponse.action == '' ? undefined : fullfillmentResponse.action;
  } catch {
    return undefined;
  }
};

async function userProfileSet(sessionID, msisdn) {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        msisdn,
        sessionID,
        customerAccountDetailsAPI: 'customerAccountDetailsAPI',
      }),
    };
    console.log('customer API calling start');
    const data = await exports.GetUrl(url, head);
    console.log('customer API calling end');
    return true;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

async function userProfileSetAccount(sessionID, msisdn) {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        msisdn,
        sessionID,
        customerAccountDetailsAPIAccount: 'customerAccountDetailsAPIAccount',
      }),
    };
    console.log('customer API calling start');
    const data = await exports.GetUrl(url, head);
    console.log('customer API calling end');
    return true;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

async function getBills(msisdn, accountNo, sessionID) {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        msisdn,
        accountNo,
        sessionID,
        customerGetBillsAPIData: 'customerGetBillsAPIData',
      }),
    };
    // console.log('customer API calling start');
    const data = await exports.GetUrl(url, head);
    // console.log('customer API calling end');
    return true;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    // return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

// async function getUnbilled(msisdn, accountNo) {
//   try {
//     const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
//     const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
//     const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

//     const head = {
//       headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
//       method: 'POST',
//       body: JSON.stringify({
//         msisdn,
//         accountNo,
//         customerGetUnbilledAPIData: 'customerGetUnbilledAPIData',
//       }),
//     };
//     // console.log('customer API calling start');
//     const data = await exports.GetUrl(url, head);
//     // console.log('customer API calling end');
//     return true;
//   } catch (err) {
//     console.log('Maxis callback failed with error', err);
//     // return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
//   }
// }

// async function getPayment(msisdn) {
//   try {
//     const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
//     const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
//     const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

//     const head = {
//       headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
//       method: 'POST',
//       body: JSON.stringify({
//         msisdn,
//         customerGetPaymentAPIData: 'customerGetPaymentAPIData',
//       }),
//     };
//     // console.log('customer API calling start');
//     const data = await exports.GetUrl(url, head);
//     // console.log('customer API calling end');
//     return true;
//   } catch (err) {
//     console.log('Maxis callback failed with error', err);
//     // return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
//   }
// }

exports.Authenticate = async function (fullfillmentRequest, msisdn, sessionID, account = '') {
  const Cache = await SESSION.GetCache(sessionID);
  console.log('Util | Authenticate | START');
  try {
    let result;

    const IsAuthenticated = await SESSION.GetIsAuthenticated(sessionID);
    if (!Cache.MaxisNakedFiber)
    {
      if (account === '') {
        console.log('if part');
        const userProfile = await userProfileSet(sessionID, msisdn);
      } else {
        console.log('else part');
        const userProfile = await userProfileSetAccount(sessionID, msisdn);
        // if (Cache.customerData !== undefined && Cache.customerData.responseData !== null) {
        //   const accData = Cache.customerData.responseData;
        //   const { accountNo } = accData.accounts[0];
        //   const bilData = await getBills(msisdn, accountNo, sessionID);
        // }
        
      }
    } else {
      // if (account === '') {
      //   console.log('NF user if >> ', Cache.MaxisNakedFiber);
      // } else {
      //   console.log('NF user else >> ', Cache.MaxisNakedFiber);
      //   const accData = Cache.getCustomerforNRICPassport.responseData;

      //   const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
      //   console.log("serviceId >> ", serviceId.length)
      //   if (serviceId.length !== 0) {
      //       msisdn = serviceId[0].serviceId;
      //   } else {
      //       msisdn =  accData.accounts[0].msisdns[0].serviceId;
      //   }
      //   const { accountNo } = accData.accounts[0];
      //   const bilData = await getBills(msisdn, accountNo, sessionID);
      // }
      
    }
    

    const cache = await SESSION.GetCache(sessionID);
    if (IsAuthenticated == false) {
      try {
        const IntentName = await SESSION.GetLastIntent(sessionID);
        cache.lastIntent = IntentName;
        SESSION.SetCache(sessionID, cache);
        // 👇 Send TAC CODE via SMS
        if (cache.getChannelName != 'whats_app') {
          result = 'Greeting_Authentication_MobileNo_Input';
        } else {
          // can put MSISDN checker in this block
          let fullMsisdn = msisdn;
          fullMsisdn = fullMsisdn.startsWith('01') ? `6${fullMsisdn}` : fullMsisdn;
          console.log(`Util | Authenticate | new fullMsisdn ${fullMsisdn}`);
          // let userProfile =  await userProfileSet(sessionID,msisdn);
          const tacUrl = `${HOST.TAC[HOST.TARGET]}/tac/api/v1.0/tac`;
          const head = {
            headers: {
              msisdn: fullMsisdn, tactype: '1', languageId: 'en-US', channel: 'MAXBOT',
            },
          };
          const data = await exports.GetUrl(tacUrl, head);
          if (data.status == 'fail' && data.violations[0].code == 'TAC0001') {
            result = 'Shared_Auth_ExistingTAC';
          } else {
            console.log(`🔑 💬 TAC: Send To [${fullMsisdn}]`);

            result = 'Shared_Auth_EnterTAC';
          }
        }
      } catch (err) {
        console.log('Authentication Error 🔻'); console.log(err);
        // result = "Shared_Auth_Fail";  // Removed the old menu auth fail
        result = 'Shared_Tech_IssueServicing';
      }
    }

    return result;
  } catch (error) {
    console.log('error****************', error);
  }
};

exports.CreateJsonResponse = function (body) {
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
};

exports.CreateJsonInvalidResponse = function (body) {
  return {
    statusCode: 400,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
};

exports.GetParameterValue = function (event, paramName) {
  try {
    return event.queryResult.parameters[paramName];
  } catch {
    return '';
  }
};

exports.IsContainFallbackMessage = function (queryResult) {
  try {
    return queryResult.parameters.fields.fallbackMessage.stringValue != '';
  } catch {
    return false;
  }
};

exports.GetActionParameters = function (fullfillmentResponse) {
  try {
    const rawParam = fullfillmentResponse.parameters;

    if (rawParam == undefined || Object.keys(rawParam).length == 0) {
      return {};
    }
    const cleanParam = {};

    const paramKeys = Object.keys(rawParam.fields);

    for (let i = 0; i < paramKeys.length; i++) {
      if ('structValue' in rawParam.fields[paramKeys[i]]) {
        cleanParam[paramKeys[i]] = rawParam.fields[paramKeys[i]].structValue.fields.name.stringValue;
      }

      if ('stringValue' in rawParam.fields[paramKeys[i]]) {
        cleanParam[paramKeys[i]] = rawParam.fields[paramKeys[i]].stringValue;
      }
    }

    cleanParam.fallbackMessage = "I didn't quite get that. Would you mind choosing a number next to your preferred choice?";

    return cleanParam;
  } catch {
    return {};
  }
};

exports.GetAction = function (fullfillmentResponse) {
  try {
    return fullfillmentResponse.action == '' ? undefined : fullfillmentResponse.action;
  } catch {
    return undefined;
  }
};

// var GetSessionID = exports.GetSessionID = function (fullfillmentRequest) {
exports.GetSessionID = function (fullfillmentRequest) {
  let result;

  try {
    result = fullfillmentRequest.originalDetectIntentRequest.payload.sessionID;
  } catch {
    result = undefined;
  }
  if (result == undefined || result == '') result = 'DialogFlowTesting';

  return result;
};

exports.GetMSISDN = function (fullfillmentRequest) {
  let result;

  try {
    result = fullfillmentRequest.originalDetectIntentRequest.payload.msisdn;
  } catch {
    result = undefined;
  }
  // 60127384174
  // 60127378795 -- modem
  // 60127375476 -- ammar
  // 60121815074 -- account having multiple fibre lines
  if (result == undefined || result == '') result = process.env.MSISDN;

  return result;
  // return "601112127577"
};

exports.CreateJsonResponse = function (body) {
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
};

exports.CreateJsonInvalidResponse = function (body) {
  return {
    statusCode: 400,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
};

exports.CreateTextResponse = function (body) {
  return {
    statusCode: 200,
    headers: {
      'content-type': 'text/html',
    },
    body,
    isBase64Encoded: false,
  };
};

exports.GetIntentDisplayName = function (fullfillmentRequest) {
  return fullfillmentRequest.queryResult.intent.displayName;
};

exports.ToCurrency = function (string) {
  if (string == '' || string == undefined || string == '-') return '0.00';

  try {
    return parseFloat(string).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  } catch {
    return string;
  }
};

exports.ToCapitalize = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

exports.ToUpperGB = function (string) {
  return string.replace('gb', 'GB');
};

exports.ToYYY_MM_DD_HH_MM_SS = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const _date = new Date(string);
    const result = `${_date.getFullYear().toString()}-${
      (_date.getMonth() + 1).toString().padStart(2, '0')}-${
      _date.getDate().toString().padStart(2, '0')} ${
      _date.getHours()}:${
      _date.getMinutes().toString().padStart(2, '0')}:${
      _date.getSeconds().toString().padStart(2, '0')}`;

    return result;
  } catch {
    return string;
  }
};

exports.ToDD_MM_YY = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const _date = new Date(string);
    const result = `${_date.getDate().toString().padStart(2, '0')}-${(_date.getMonth() + 1).toString().padStart(2, '0')}-${_date.getFullYear().toString().slice(2)}`;
    return result;
  } catch {
    return string;
  }
};

exports.ToDD_MM_YYYY = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const _date = new Date(string);
    const result = `${_date.getDate().toString().padStart(2, '0')}-${(_date.getMonth() + 1).toString().padStart(2, '0')}-${_date.getFullYear().toString()}`;
    return result;
  } catch {
    return string;
  }
};

exports.ToMM_YYYY = function (string) {
  try {
    const _date = new Date(string);
    const result = `${(_date.getMonth() + 1).toString().padStart(2, '0')}/${_date.getFullYear()}`;
    return result;
  } catch {
    return string;
  }
};

exports.String_To_MMM_YYYY = function (string) {
  // Only used to convert this kind of date in string format "20210128105552"
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // let _date  = new Date(string);
    const result = `${monthName[parseInt(string.slice(4, 6)) - 1]}-${string.slice(0, 4)}`;
    return result;
  } catch {
    return string;
  }
};

exports.String_ToDD_MM_YYYY = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const result = `${string.slice(6, 8)}/${string.slice(4, 6)}/${string.slice(0, 4)}`;
    return result;
  } catch {
    return string;
  }
};

exports.ToDD_MMM_YY = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const _date = new Date(string);
    const result = `${_date.getDate().toString().padStart(2, '0')}-${monthName[_date.getMonth()]}-${_date.getFullYear().toString().slice(2)}`;
    return result;
  } catch {
    return string;
  }
};

exports.ToDD_MMM_YYYY = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const _date = new Date(string);
    const result = `${_date.getDate().toString().padStart(2, '0')}-${monthName[_date.getMonth()]}-${_date.getFullYear().toString()}`;
    return result;
  } catch {
    return string;
  }
};

exports.ToHH_MM = function (string) {
  try {
    const _date = new Date(string);
    const result = `${_date.getHours().toString().padStart(2, '0')}:${_date.getUTCMinutes().toString().padStart(2, '0')}`;
    return result;
  } catch {
    return string;
  }
};

exports.ToLocalDateTime = function (string) {
  try {
    const _date = new Date(string);

    if (string.toUpperCase().includes('Z')) {
      return _date.addHours(8);
    }
    return _date;
  } catch {
    return string;
  }
};

exports.hasActiveDeviceContract = function (contractEndDate) {
  let activeContract = false;
  const date = new Date(contractEndDate);
  activeContract = new Date(date.toDateString()) > new Date(new Date().toDateString());

  console.log(`Util | hasActiveDeviceContract | has activeContract: ${activeContract}`);
  return activeContract;
};

exports.ToMobileNumber = function (string) {
  // return  string.slice(1,4) + "-" + string.slice(4,7) + " " + string.slice(7);
  return string;
};

exports.ToCapitalize = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

exports.ToUpperGB = function (string) {
  return string.replace('gb', 'GB');
};

exports.ToYYY_MM_DD_HH_MM_SS = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const _date = new Date(string);
    const result = `${_date.getFullYear().toString()}-${
      (_date.getMonth() + 1).toString().padStart(2, '0')}-${
      _date.getDate().toString().padStart(2, '0')} ${
      _date.getHours()}:${
      _date.getMinutes().toString().padStart(2, '0')}:${
      _date.getSeconds().toString().padStart(2, '0')}`;

    return result;
  } catch {
    return string;
  }
};

exports.ToDD_MM_YY = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const _date = new Date(string);
    const result = `${_date.getDate().toString().padStart(2, '0')}-${(_date.getMonth() + 1).toString().padStart(2, '0')}-${_date.getFullYear().toString().slice(2)}`;
    return result;
  } catch {
    return string;
  }
};

exports.ToDD_MM_YYYY = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const _date = new Date(string);
    const result = `${_date.getDate().toString().padStart(2, '0')}-${(_date.getMonth() + 1).toString().padStart(2, '0')}-${_date.getFullYear().toString()}`;
    return result;
  } catch {
    return string;
  }
};

exports.GetNumberedMenu = function (array) {
  if (typeof array === 'string') {
    array = JSON.parse(array);
  }
  const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
    '1️⃣1️⃣', '1️⃣2️⃣', '1️⃣3️⃣', '1️⃣4️⃣', '1️⃣5️⃣', '1️⃣6️⃣', '1️⃣7️⃣',
    '1️⃣8️⃣', '1️⃣9️⃣', '2️⃣0️⃣', '2️⃣1️⃣', '2️⃣2️⃣', '2️⃣3️⃣', '2️⃣4️⃣', '2️⃣5️⃣', '2️⃣6️⃣', '2️⃣7️⃣', '2️⃣8️⃣'];

  for (let i = 0; i < array.length; i++) {
    array[i] = (array[i]).trim();
    const text = array[i].charAt(0).toUpperCase() + array[i].slice(1);
    array[i] = `${emoji[i]} ${text}`;
  }

  return array.join('\n');
};

exports.GetModelNumberedMenu = function (array, brandName) {
  if (typeof array === 'string') {
    array = JSON.parse(array);
  }
  const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
    '1️⃣1️⃣', '1️⃣2️⃣', '1️⃣3️⃣', '1️⃣4️⃣', '1️⃣5️⃣', '1️⃣6️⃣', '1️⃣7️⃣',
    '1️⃣8️⃣', '1️⃣9️⃣', '2️⃣0️⃣', '2️⃣1️⃣', '2️⃣2️⃣', '2️⃣3️⃣', '2️⃣4️⃣', '2️⃣5️⃣', '2️⃣6️⃣', '2️⃣7️⃣',
    '2️⃣8️⃣', '2️⃣9️⃣', '3️⃣0️⃣', '3️⃣1️⃣', '3️⃣2️⃣', '3️⃣3️⃣', '3️⃣4️⃣', '3️⃣5️⃣'];

  for (let i = 0; i < array.length; i++) {
    array[i] = (array[i]).trim();
    const text = array[i].charAt(0).toUpperCase() + array[i].slice(1);
    brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    array[i] = `${emoji[i]} ${brandName} - ${text}`;
  }

  return array.join('\n');
};

exports.Dump = function (object, text = '', head = '', msisdn = '') {
  console.log(`🚽 Dumping${msisdn} [${text}][${JSON.stringify(head)}] ${JSON.stringify(object)}`);
};

exports.CaseType = async function (string) {
  try {
    let stringToMatch = string.split('_')[1];
    stringToMatch = string.match(`^.+${stringToMatch}`);

    if (stringToMatch == null || stringToMatch == undefined) {
      // return string;
      return 'Others'; // Kafai Request: 3/Jun/2021 9:30PM
    }
    // stringToMatch = stringToMatch[0];
    const stringToMatchTemp = stringToMatch[0];
    stringToMatch = stringToMatchTemp;

    const content = await S3.getObject(
      {
        Bucket: process.env.S3_BUCKET,
        Key: 'CaseTypeConfig.json',
      },
    ).promise();

    const data = JSON.parse(content.Body.toString('utf-8'));
    const result = data.filter((e) => stringToMatch.toUpperCase().startsWith(e.KEY.toUpperCase()));

    if (result.length > 0) {
      return result[0].VALUE;
    }
    // return string;
    return 'Others'; // Kafai Request: 3/Jun/2021 9:30PM
  } catch (err) {
    console.log('🔻 ERROR: Reading CaseTypeConfig.json in S3:maxbot-orchestrator-prod', JSON.stringify(err));
    return string;
  }
};

exports.IsJson = function (str) {
  try {
    return (JSON.parse(str) && !!str);
  } catch (e) {
    return false;
  }
};

exports.IOSDateFormat = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';

  try {
    const result = `${string.slice(0, 4)}-${string.slice(4, 6)}-${string.slice(6, 8)}T${string.slice(8, 10)}:${string.slice(10, 12)}:${string.slice(12, 14)}`;
    return result;
  } catch {
    return string;
  }
};

exports.DateFormat = function (string) {
  if (string == '' || string == undefined || string == '-') return '-';
  try {
    const result = `${string.slice(6, 8)}-${string.slice(4, 6)}-${string.slice(0, 4)},${string.slice(8, 10)}:${string.slice(10, 12)}`;
    return result;
  } catch {
    return string;
  }
};

async function isBusinessHoursElapsed(startTime, businessHoursLimit) {
  let isElapsed = false;
  let endTime = momentTimezone.tz('Asia/Kuala_Lumpur');
  endTime = moment(endTime).format('YYYY-MM-DDTHH:mm:ss');
  const content = await S3.getObject(
    {
      Bucket: process.env.S3_BUCKET,
      Key: `MaxisHolidays/${moment(endTime).year()}/HolidayList.txt`,
    },
  ).promise();
  const contentHours = await S3.getObject(
    {
      Bucket: process.env.S3_BUCKET,
      Key: 'MaxisHolidays/MaxisBusinessHours.txt',
    },
  ).promise();
  const businesshours = contentHours.Body.toString('utf-8');
  const MaxisHours = businesshours.toString().replace(/\r\n/g, '\n');
  const data = content.Body.toString('utf-8');
  const maxisHolidays = data.toString().replace(/\r\n/g, '\n').split('\n');
  moment.locale('en', {
    workinghours: { MaxisHours },
  });
  moment.locale('en', {
    holidays: maxisHolidays,

  });

  try {
    const result = moment(endTime).workingDiff(startTime, 'minutes');
    isElapsed = result > businessHoursLimit * 60;
  } catch (err) {
    console.error('Unable to calculate business hours', err);
  }
  return isElapsed;
}
exports.is12BusinessHoursElapsed = async function (startTime) {
  return await isBusinessHoursElapsed(startTime, 12);
};

exports.is2BusinessHoursElapsed = async function (startTime) {
  return await isBusinessHoursElapsed(startTime, 2);
};

/**
 * Device discovery
 */
async function RatePlan(plan) {
  const plansInfo = ['Maxis Postpaid 98', 'Maxis Home 4G Wifi', 'Maxis Postpaid 128', 'Maxis Postpaid 158', 'Maxis Postpaid 188', 'Maxis Postpaid Share 48', 'Hotlink Postpaid Plan 30', 'Hotlink Postpaid Plan 40', 'Hotlink Postpaid Plan 60', 'Maxis Postpaid 28 Tablet', 'Maxis Postpaid 18 Tablet', 'Hotlink SIM Pack + 10GB High-Speed Internet Pass', 'Hotlink SIM Pack + Unlimited Monthly Pass (3Mbps)', 'Hotlink SIM Pack + Unlimited Monthly Pass (6Mbps)', 'Hotlink Prepaid Fast', 'Hotlink Prepaid Unlimited'];
  const plansId = ['4062257_4000127',
    '56682778_56682688',
    '4052097_4000147',
    '4047017_4000157',
    '4072417_4085816',
    '4001157_4000117',
    '4361047_4360927',
    '84151112_84128712',
    '4361057_4360937',
    '35627_37987',
    '30547_37977',
    'hotlink-internet-365',
    'hotlink-prepaid-unlimited-40',
    'hotlink-prepaid-unlimited-50',
    '56724538_56724258',
    '430874565_430917465'];
  const planIndex = plansInfo.findIndex((planName) => planName == plan);
  return plansId[planIndex];
}
exports.configURL = async (planName, intension, planType) => {
  const url = HOST.TARGET == 0 ? 'http://d3o4kqj8excmsv.cloudfront.net/plandetails' : 'https://store.hotlink.com.my/plandetails';
  const planID = await RatePlan(planName);
  let intensionValue;

  if (intension == 1) {
    intensionValue = 'newline';
  } else {
    intensionValue = 'switchtohotlink';
  }

  let planTypeValue;
  if (planType == 'postPaid') {
    planTypeValue = 'postpaidPlans';
  } else {
    planTypeValue = 'prepaidPlans';
  }

  return `${url}/?plan=${planID}&plantype=${planTypeValue}&intension=${intensionValue}&channel=MaxBot`;
};
exports.configURLMaxis = async (planName, intension) => {
  const url = HOST.TARGET == 0 ? 'http://d1x3lgvt4o8f7h.cloudfront.net/plandetails' : 'https://store.maxis.com.my/plandetails';
  const planID = await RatePlan(planName);
  let intensionValue;

  if (intension == 1) {
    intensionValue = 'newline';
  } else {
    intensionValue = 'switchtohotlink';
  }
  return `${url}/?plan=${planID}&intension=${intensionValue}&channel=MaxBot`;
};

async function ContractID(contract) {
  const contractInfo = ['Zerolution 24 months', 'Zerolution 36 months', 'Normal Contract 24-Months', 'Normal Contract 12-Months'];

  const contractId = ['Zerolution24', 'Zerolution36', '24', '12'];
  const contractIndex = contractInfo.findIndex((contractInfor) => contractInfor == contract);
  return contractId[contractIndex];
}

async function converLowerStr(str) {
  const lowerStr = str.toLowerCase();

  return lowerStr.replace(/ /g, '-');
}

function convertBrandModeltoModel(brandName, modelName) {
  brandName = brandName.toLowerCase();
  modelName = modelName.toLowerCase();
  modelName = modelName.replace(brandName, '');
  modelName = modelName.replace('-', ' ');
  modelName = modelName.trim();
  modelName = modelName.replace(' ', '-');
  return modelName;
}

exports.HotlinkDeviceURL = async function (brandName, modelName, skuID, tenureContract, Category) {
  const url = HOST.TARGET == 0 ? 'http://d3o4kqj8excmsv.cloudfront.net/devicedetails/category' : 'https://store.hotlink.com.my/devicedetails/category';
  const brand = await converLowerStr(brandName);
  const model = convertBrandModeltoModel(brandName, modelName);
  const ContractPeriod = await ContractID(tenureContract);
  return `${url}/${Category}/${brand}/${model}?skuid=${skuID}&tenure=${ContractPeriod}&channel=MaxBot`;
};

exports.MaxisDeviceURL = async function (deviceType, brandName, modelName, skuID, planName, Contract) {
  const url = HOST.TARGET == 0 ? 'http://d1x3lgvt4o8f7h.cloudfront.net/productdetails/category' : 'https://store.maxis.com.my/productdetails/category';

  const planID = await RatePlan(planName);

  const maxisdevicetype = await converLowerStr(deviceType);
  const brand = await converLowerStr(brandName);
  const model = await converLowerStr(modelName);
  return `${url}/${maxisdevicetype}/${brand}/${model}?skuid=${skuID}&plan=${planID}&contractType=${Contract}&channel=MaxBot`;
};

/**
 * Check Device Stock
 */
exports.GetFormattedAddress = function (houseNum, streetAddress, buildingName, city, postalCode, state) {
  const formatStr = (word) => {
    let str = word.trim();
    if (str.endsWith(', ')) {
      str = str.slice(0, -1);
    }
    return str;
  };

  const fullAddress = [
    houseNum,
    streetAddress,
    buildingName,
    city,
    postalCode,
    state,
  ].map((field) => formatStr(field))
    .join(',');

  return fullAddress;
};

exports.GetFormattedOpeningHours = function (text) {
  const regex = /(<([^>]+)>)/gi;
  const newLineRgx = /(\r\n|\r|\n)/gi;
  const andRgx = /(&amp;)/g;
  const nbspRgx = /(:&nbsp;)/g;
  const textsArray = text.split('</p>');
  const titleText = textsArray[0].replace(newLineRgx, '').replace(regex, '');
  const bodyText = textsArray
    .slice(1)
    .join('')
    .replace(newLineRgx, '')
    .replace(regex, '')
    .replace(andRgx, '&')
    .replace(nbspRgx, ': ');
  const arrOpeningHours = `${bodyText}`.split('pm');
  let OpeningHoursStr = '';
  arrOpeningHours.map((item, index) => {
    if (index < arrOpeningHours.length - 1) {
      OpeningHoursStr += `${arrOpeningHours[index]}pm `;
    } else {
      OpeningHoursStr += `${arrOpeningHours[index]}`;
    }
  });
  return `${titleText}: ${OpeningHoursStr}`;
};

exports.CreateUnAuthorized = function () {
  return {
    statusCode: 401,
    headers: {
      'content-type': 'text/html',
    },
    body: 'Unauthorized',
    isBase64Encoded: false,
  };
};

exports.CreateNotSupported = function () {
  return {
    statusCode: 405,
    headers: {
      'content-type': 'text/html',
    },
    body: 'Not supprted event method',
    isBase64Encoded: false,
  };
};
exports.UserVerifyProfile = async function (customerType, oloMenu = 'Authentication_MenuAccessRestriction', prepaidMenu = 'Authentication_MenuAccessRestriction', postPaidMenu = 'Authentication_MenuAccessRestriction') {
  console.log('data coming from user story*********', oloMenu, prepaidMenu, postPaidMenu);
  let followUpEvent = '';
  if (customerType.accType == 'Principal') {
    console.log('log postpaid working*************');
    followUpEvent = postPaidMenu;
  } else if (customerType.subType === 'Individual') {
    console.log('log prepaid working************* true 1');
    if (customerType.cusType == 'Consumer') {
      console.log('log prepaid working************* true 2');
      followUpEvent = prepaidMenu;
    } else {
      console.log('log olo working************* true 1');
      followUpEvent = oloMenu;
    }
  } else {
    console.log('log olo working************* true  else 1');
    followUpEvent = oloMenu;
  }
  console.log('followUpEvent event update here', followUpEvent);
  return followUpEvent;
};
