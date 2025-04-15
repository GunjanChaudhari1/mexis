const FormData = require('form-data');

const FETCH = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const https = require('https');
const JIMP = require('jimp');
const PATH = require('path');
const { Util } = require('@google-cloud/storage/build/src/nodejs-common/util');
const { flowRight } = require('lodash');
const request = require('request');
const imageToBase64 = require('image-to-base64');
const { Console, assert } = require('console');
const { exit } = require('process');
const RC = require('./Handler_RingCentral');
const UTIL = require('./Util');
const HOST = require('./Handler_Host');
const SESSION = require('./Handler_Session');
const DF = require('./Handler_DialogFlow');
const CALLBACKCONTEXT = require('./CallbackContext');
const tt = require("./translate_txt");

const { FALLBACK_MESSAGE_SALES } = process.env;
const { IMAGE_FALLBACK_MESSAGE_GUIDELINE } = process.env;

// Roshani: 15/12/2022 -> 7.  Callback perform a diagnostic test
const irCaseCreateAttachment = async (casebody, msisdn, trueIntent, falseIntent, sessionID) => {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0
      ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin'
      : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0
      ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback'
      : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        msisdn,
        casebody,
        trueIntent,
        falseIntent,
        sessionID,
        irCaseCreateAttachmentAsync: 'irCaseCreateAttachmentAsync',
      }),
    };

    const data = await UTIL.GetUrl(url, head);
    return data;
  } catch (err) {
    console.log('Maxis IR callback failed with error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

async function createCase(body) {
  const url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`;

  const head = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', channel: 'MAXBOT', uuid: '123123' },
  };

  const data = await UTIL.GetUrl(url, head);
  return data.responseData;
}

// async function CaseAttachment(caseId, imageName) {
//   console.log('Case ID >> ', caseId, ' Image Name >> ', imageName);
//   let formdata = new FormData();
//   formdata.append('attachmentTitle', 'MyTitle');
//   formdata.append('attachmentDescription', 'MyDescription');
//   formdata.append('file', fs.createReadStream(`/tmp/${imageName}`));

//   const requestOptions = {
//     method: 'POST',
//     headers: { channel: 'MAXBOT', languageid: 'en-US' },
//     body: formdata,
//     redirect: 'follow',
//   };

//   let fetchData = await FETCH(
//     `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/${caseId}/attachment`,
//     requestOptions
//   );
//   let getResponse = await fetchData.text();
//   console.log('getResponse', getResponse);
//   return getResponse;
// }

// const addAttacment_NoIR = async (caseId, sessionID) => {
async function addAttacmentNoIR(caseId, sessionID, msisdn) {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        caseId,
        sessionID,
        msisdn,
        addAttacmentNoIRInvalidSecondRouterImage: 'addAttacmentNoIRInvalidSecondRouterImage',
      }),
    };

    const data = await UTIL.GetUrl(url, head);
    return data;
  } catch (err) {
    console.log('Maxis IR callback failed with error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

async function getCustomerforWifi(sessionID, msisdn) {
  const url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  const head = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', msisdn, maxis_channel_type: 'MAXBOT', languageid: 'en-US',
    },
    body: JSON.stringify({
      searchtype: 'MSISDN',
      searchvalue: msisdn,
      prinSuppValue: true,
      isGetSupplementary: true,
      isPrincipalPlanName: false,
      isLookupAllAccount: false,
      isIndividual: 1,
      isSubscription: true,
      isIncludeOfferingConfig: false,
      isCustomerProfile: false,
      familyType: false,
    }),
  };

  const data = await UTIL.GetUrl(url, head, msisdn, sessionID);

  return data.responseData;
}

function CaseTypeText(string) {
  let caseText = 'Check Throughput Status';

  if (string.toString().startsWith('CPE_Offline')) caseText = 'Check CPE Status';
  if (string.toString().startsWith('Internet')) caseText = 'Check Internet Status';
  if (string.toString().startsWith('Wifi')) caseText = 'Check WiFi Status';
  if (string.toString().startsWith('goodSignal')) caseText = 'Good Signal';
  if (string.toString().startsWith('poorSignal')) caseText = 'Poor Signal';
  if (string.toString().startsWith('wrongFrequency')) caseText = 'Wrong Frequency';
  if (string.toString().startsWith('tooManyDevices')) caseText = 'Too Many Devices';

  return caseText;
}

function DiagnosticResultHelper(string) {
  let caseText = 'Slow Throughput';

  if (string.startsWith('CPE_Offline')) caseText = 'CPE Offline';
  if (string.startsWith('Internet')) caseText = 'Internet Down';
  if (string.startsWith('Wifi')) caseText = 'WiFi Down';

  return caseText;
}

function AssignFallBack(param) {
  return param.fallbackMessage = FALLBACK_MESSAGE_SALES;
}

exports.Shared_Invalid_IR_lastEvent = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  let lastEvent = await SESSION.GetLastEvent(sessionID);
  const Cache = await SESSION.GetCache(sessionID);
  console.log('Cache >> ', Cache);
  lastEvent = lastEvent.event;
  const fallbackMessage = FALLBACK_MESSAGE_SALES;
  const modemId = Cache.SelectedModemId;
  console.log('modemid>>>>', modemId);
  if (lastEvent === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights' || lastEvent === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_InvalidImage' || lastEvent === 'IRTR_Network_Fibre_SlowWifi_DiagnosticCheck_Yes_AttemptsExceeded') {
    if (Cache.IRAttempts === undefined) {
      Cache.IRAttempts = 1;
    } else {
      Cache.IRAttempts += 1;
    }
    if (Cache.IRAttempts > 2) {
      lastEvent = 'IRTR_Network_Fibre_SlowWifi_DiagnosticCheck_Yes_AttemptsExceeded';
      Cache.IRAttemptsExceeded = true;
    } else {
      // lastEvent = lastEvent;
      console.log('lastEvent : ', lastEvent);
    }

    await SESSION.SetCache(sessionID, Cache);
    console.log('lastEvent >> ', lastEvent);
  }
  await SESSION.SetLastEvent(sessionID, { event: lastEvent, param: { fallbackMessage, modemId } });
  return UTIL.ComposeResult('', lastEvent, { fallbackMessage, modemId });
};

exports.AddImageAttachmentToCase = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const cache = await SESSION.GetCache(sessionID);
    const caseId = UTIL.GetParameterValue(event, 'CaseID');
    const filename = UTIL.GetParameterValue(event, 'Filename');
    const file = fs.createWriteStream(`/tmp/${filename}`);
    const validAttachment = cache.LocatePayment.filter((payment) => payment.caseCreated === true);
    console.log('ðŸ“Case Id => ', caseId);
    console.log('ðŸ“filename => ', filename);
    if (validAttachment[0]) {
      const fetchUrl = validAttachment[0].url;
      console.log('ðŸš— FETCHURL - > ', fetchUrl);
      await FETCH(fetchUrl)
        .then(
          (res) => new Promise((resolve, reject) => {
            res.body.pipe(file);
            res.body.on('end', () => resolve('it worked'));
            file.on('error', reject);
          }),
        );
      // let Result = await CaseAttachment(caseId, filename)
      // let Result = await CaseAttachment(caseId, filename)
      // console.log(JSON.parse(Result).status == "success", "3");
      // if (JSON.parse(Result).status == "success") {
      // console.log("success if");
      // cache['enableLocateFlag'] = false;
      // await SESSION.SetCache(sessionID, cache);
      // followupevent = "IRTR_Network_Fibre_Wifi_DiagnosticCheck_NegativeResult_UploadRouterPhoto_AgentAssist";
      // return UTIL.ComposeResult("", followupevent, { "caseId": caseId });
      // }
      // else {
      // console.log("fail else");
      // followupevent = "Shared_Tech_IssueServicing";
      // return UTIL.ComposeResult("", followupevent);
      // }
    } else {
      console.log('success else');
      followupevent = 'Shared_Tech_IssueServicing';
      return UTIL.ComposeResult('', followupevent);
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

exports.IRTR_UploadFirstPhoto_WithoutIR_API_Call = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    console.log('Session IDðŸ‘‰', sessionID);

    // let followupEvent = "IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR"

    await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR', param: {} });

    return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR');
  } catch (err) {
    console.log('ðŸ”»Error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

exports.IRTR_NoIR_FirstPhoto_AttachementCheck_Start = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  // const msisdn = await SESSION.GetMSISDN(sessionID);
  const LastEvent = await SESSION.GetLastEvent(sessionID);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  // LastEvent = LastEvent.event;

  return new Promise((resolve) => {
    const delay = (milliseconds) => new Promise((resolves) => {setTimeout(resolves, milliseconds)});
    // const delay = (milliseconds) => new Promise((resolves) => setTimeout(resolves, milliseconds));
    delay(2200)
      .then(async () => await SESSION.GetCache(sessionID))
      .then(async (Cache) => {
        const FirstRouterImageFile = Cache.DiagnosticResult_FirstRouterImage[0];
        console.log('This is First Router Image file', FirstRouterImageFile);
        Cache.enableFirstRouterImageFlag = false;

        console.log('logging Cache First Router Image attachement details', FirstRouterImageFile.filename, FirstRouterImageFile.size, FirstRouterImageFile.url);
        const { filename } = FirstRouterImageFile;
        console.log('FileName', filename);

        if (filename.match('[^\\s]+(.*?)\\.(jpg|jpeg|png|JPG|JPEG|PNG)$')) {
          request(FirstRouterImageFile.url).pipe(fs.createWriteStream(`/tmp/${FirstRouterImageFile.filename}`));
          await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR', param: {} });
          const fileurl = `/tmp/${filename}`;
          const imageUrlArray = [];
          imageUrlArray.push(fileurl);
          console.log('Image Array', imageUrlArray);
          Cache.imageUrlArray = imageUrlArray;
          const content = fs.readFileSync(new URL(`file:///${fileurl}`));
          Cache.IRImageUp = true;
          Cache.No_IR_FirstImageUp_Invalid = false;
          Cache.DiagnosticResultFirstRouterImageUploaded = false;
          await SESSION.SetCache(sessionID, Cache);
          resolve(UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR'));
        } else {
          Cache.IRImageUp = true;
          Cache.No_IR_FirstImageUp_Invalid = true;
          Cache.DiagnosticResultFirstRouterImageUploaded = false;
          // await SESSION.SetCache(sessionID, Cache);
          // resolve(UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR_InvalidFormat'));
          let casebody = '';

          const { negativeDiagnosticResult } = Cache;
          const { possitveDiagnosticResult } = Cache;

          const cusData = Cache.customerData; // await getCustomerforWifi(sessionID, msisdn);
          const cusDataOLO = Cache.getCustomerforNRICPassport.responseData;
          const modemId = Cache.SelectedModemId;
          console.log(' modemId >> ', modemId);
          console.log('cusDataOLO >> ', cusDataOLO);

          let ratePlanName = '';
          if (cusDataOLO) {
            ratePlanName = cusDataOLO.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
          } else {
            ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
          }
          const diagnosticResult = Cache.DiagnosticSummary.Result;
          let intentName = '';
          // let followupEvent = '';
          const fallbackMessage = IMAGE_FALLBACK_MESSAGE_GUIDELINE;

          if (possitveDiagnosticResult === true && negativeDiagnosticResult !== true) {
            // await SESSION.SetContext(
            //   sessionID,
            //   CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET]
            // );
            intentName = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END';

            casebody = {
              // "idType": "MSISDN",
              // "idValue": msisdn,
              idType: 'MSISDN',
              idValue: cusDataOLO ? modemId : msisdn,
              msisdn,
              caseType1: 'Self Serve',
              caseType2: CaseTypeText(diagnosticResult),
              caseType3: 'BOT Escalation',
              description: `Reason: WA MSISDN: ${msisdn}, Modem ID: ${modemId}, Rate Plan: ${ratePlanName}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName}`,
              isUpdateCBR: 'false',
            };
            const caseResult = await createCase(casebody);
            if ('caseId' in caseResult) {
              Cache.LastCaseId = caseResult.caseId;
              await SESSION.SetCache(sessionID, Cache);
              const { caseId } = caseResult;
              console.log('caseId 11 > ', caseId);
              console.log('sessionID 11 >> ', sessionID);
              const replyId = await SESSION.getMessageId(sessionID);
              const queryTextValue = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END';
              let text1 = fallbackMessage;
              let text2 = `Got it! I've notified our team and you will be contacted within our ops hours from 8.00am to 10.00pm to assist you further. Please look out for their call.\n\nHere's your case number ${caseId} \nYou can also view the case progress from our Maxis Care portal https://care.maxis.com.my. \nThanks.`;
              let text3 = 'Would you like to explore the other products and services we have to offer?\n\n1️⃣ Continue exploring\n2️⃣ Not right now. Thanks \n*️⃣ Go back to the main menu\n\nTo continue, just select a number from the list';
              await SESSION.SetLastEvent(sessionID, {
                event: 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END',
                param: { caseId },
              });
              await SESSION.SetContext(
                sessionID,
                CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET],

              );

              // Hanlde BM language response
              if (Cache["Language"] === 1) {
                text1 = await tt.translateText(text1, "en", "ms")
                text2 = await tt.translateText(text2, "en", "ms")
                text3 = await tt.translateText(text3, "en", "ms")
              }

              await RC.Call(replyId, text1);
              await RC.Call(replyId, text2);
              await RC.Call(replyId, text3);
              console.log(`📞 RingCentral: [${msisdn}]`);

              resolve('success ', caseId);
              process.exit();
              // resolve(UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END', { 'caseId': caseId, 'fallbackMessageImage': fallbackMessage }));
            } else {
              await SESSION.SetCache(sessionID, Cache);
              resolve(UTIL.ComposeResult('', 'MAXbot_TroubleshootHomeWifiFailedCaseCreation'));
            }

            // followupEvent = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END';
          } else {
            await SESSION.SetContext(
              sessionID,
              CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET],
            );
            intentName = 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify';
            casebody = {
              // "idType": "MSISDN",
              // "idValue": msisdn,
              idType: 'MSISDN',
              idValue: cusDataOLO ? modemId : msisdn,
              msisdn,
              caseType1: 'Self Serve',
              caseType2: CaseTypeText(diagnosticResult),
              caseType3: 'BOT Escalation',
              description: `Reason: WA MSISDN: ${msisdn}, Modem ID: ${modemId}, Rate Plan: ${ratePlanName}, Diagnostic Result: ${DiagnosticResultHelper(diagnosticResult)}, Callback: Yes, DF Intent Name: ${intentName}`,
              isUpdateCBR: 'false',
            };
            const caseResult = await createCase(casebody);

            // followupEvent = 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify';
            if ('caseId' in caseResult) {
              Cache.LastCaseId = caseResult.caseId;
              await SESSION.SetCache(sessionID, Cache);
              const { caseId } = caseResult;
              console.log('caseId > ', caseId);
              await SESSION.SetContext(
                sessionID,
                CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET],

              );
              resolve(UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify', { caseId, fallbackMessageImage: fallbackMessage }));
            } else {
              await SESSION.SetCache(sessionID, Cache);
              resolve(UTIL.ComposeResult('', 'MAXbot_TroubleshootHomeWifiFailedCaseCreation'));
            }
          }
        }
      }).catch((e) => {
        // let Cache = await SESSION.GetCache(sessionID)
        // Cache.DiagnosticResultFirstRouterImageUploaded = false;
        // await SESSION.SetCache(sessionID, Cache);
        console.log('ðŸ”»This is the error --->', e);
      });
  });
};

exports.IRTR_No_IR_Case_Addattachment = async function (event) {
  const msisdn = UTIL.GetMSISDN(event);
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  const CaseId = Cache.LastCaseId;
  const { imageUrlArray } = Cache;
  console.log('ðŸ‘‰Case Id:', CaseId);
  console.log("ðŸ‘‰ðŸ‘‰Array with Router image File url's", imageUrlArray);
  const filename = UTIL.GetParameterValue(event, 'Filename');
  const file = fs.createWriteStream(`/tmp/${filename}`);
};

// Rajesh: 19/12/2022 : No IR upload second image
// exports.IRTR_NoIR_SecondPhoto_AttachementCheck_Start = async function (event) {
//   try {
//     const sessionID = UTIL.GetSessionID(event);
//     const msisdn = await SESSION.GetMSISDN(sessionID);
//     console.log('MSISDN', msisdn, 'sessionid', sessionID);
//     const Cache = await SESSION.GetCache(sessionID);
//     let LastEvent = await SESSION.GetLastEvent(sessionID);
//     LastEvent = LastEvent.event;
//     const cusData = await getCustomerforWifi(sessionID, msisdn);

//     const modemId = Cache.SelectedModemId;
//     const ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH')[0].plan.name;
//     const diagnosticResult = Cache.DiagnosticSummary.Result;

//     const { negativeDiagnosticResult } = Cache;
//     const { possitveDiagnosticResult } = Cache;

//     console.log('Logging Last Event Name', LastEvent);
//     console.log('This is the IR cache -> ', Cache);
//     console.log('modemId >> ', modemId, ' ratePlanName >> ', ratePlanName, ' diagnosticResult >> ', diagnosticResult);

//     Cache.NoIREnableDiagnostic = true;
//     const SecondRouterImageFile = Cache.DiagnosticResult_SecondRouterImage[0];
//     console.log('This is Second Router Image file', SecondRouterImageFile);

//     Cache.enableSecondRouterImageFlag = false;
//     console.log('logging Cache Second Router Image attachement details', SecondRouterImageFile.filename, SecondRouterImageFile.size, SecondRouterImageFile.url);
//     const { filename } = SecondRouterImageFile;
//     console.log('FileName', filename);
//     console.log('ðŸ‘‰FileName Type:ðŸ‘‰', typeof filename);
//     let casebody = '';
//     const intentName = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_No';
//     console.log(
//       'ðŸ–¨ï¸ðŸ–¨ï¸possitveDiagnosticResult >> ',
//       possitveDiagnosticResult,
//       ' negativeDiagnosticResult >> ',
//       negativeDiagnosticResult,
//     );
//     if (possitveDiagnosticResult == true && negativeDiagnosticResult != true) {
//       casebody = {
//         idType: 'MSISDN',
//         idValue: msisdn,
//         msisdn,
//         caseType1: 'Self Serve',
//         caseType2: CaseTypeText(diagnosticResult),
//         caseType3: 'BOT Escalation',
//         description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
//         isUpdateCBR: 'false',
//       };
//     } else {
//       casebody = {
//         idType: 'MSISDN',
//         idValue: msisdn,
//         msisdn,
//         caseType1: 'Self Serve',
//         caseType2: CaseTypeText(diagnosticResult),
//         caseType3: 'BOT Escalation',
//         description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
//         isUpdateCBR: 'false',
//       };
//     }

//     if (filename.match('[^\\s]+(.*?)\\.(jpg|jpeg|png|JPG|JPEG|PNG)$')) {
//       Cache.IRImageUp = true;
//       await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);
//       await SESSION.SetCache(sessionID, Cache);
//       return UTIL.ComposeResult('', 'lms_creation_inprogress');
//     }
//     Cache.IRImageUp = true;
//     await SESSION.SetCache(sessionID, Cache);
//     return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR_InvalidFormat');
//   } catch (err) {
//     console.log('errðŸ”»', err);
//     return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
//   }
// };

exports.IRTR_NoIR_SecondPhoto_AttachementCheck_Start = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  return new Promise((resolve) => {
    // const delay = (milliseconds) => new Promise((resolves) => setTimeout(resolves, milliseconds));
    const delay = (milliseconds) => new Promise((resolves) => {setTimeout(resolves, milliseconds)});
    // need to return fro the promise itself mah
    delay(2200)
      .then(async () => await SESSION.GetCache(sessionID))
      .then(async (Cache) => {
        // const cusData = await getCustomerforWifi(sessionID, msisdn);
        const cusData = Cache.customerData;
        const cusDataOLO = Cache.getCustomerforNRICPassport.responseData;
        const modemId = Cache.SelectedModemId;
        const { negativeDiagnosticResult } = Cache;
        const { possitveDiagnosticResult } = Cache;
        Cache.NoIREnableDiagnostic = true;
        const SecondRouterImageFile = Cache.DiagnosticResult_SecondRouterImage[0];
        console.log('This is Second Router Image file', SecondRouterImageFile);
        Cache.enableSecondRouterImageFlag = false;
        const { filename } = SecondRouterImageFile;
        console.log('FileName', filename);
        let casebody = '';
        let ratePlanName = '';
        const diagnosticResult = Cache.DiagnosticSummary.Result;
        const intentName = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_No';
        console.log('cusData from authenitication', cusData);
        if (cusDataOLO) {
          ratePlanName = cusDataOLO.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
        } else {
          ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
          console.log('ratePlan', ratePlanName);
        }
        if (possitveDiagnosticResult === true && negativeDiagnosticResult !== true) {
          casebody = {
            idType: 'MSISDN',
            idValue: cusDataOLO ? modemId : msisdn,
            msisdn,
            caseType1: 'Self Serve',
            caseType2: CaseTypeText(diagnosticResult),
            caseType3: 'BOT Escalation',
            description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
            isUpdateCBR: 'false',
          };
        } else {
          casebody = {
            idType: 'MSISDN',
            idValue: cusDataOLO ? modemId : msisdn,
            msisdn,
            caseType1: 'Self Serve',
            caseType2: CaseTypeText(diagnosticResult),
            caseType3: 'BOT Escalation',
            description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
            isUpdateCBR: 'false',
          };
        }
        if (filename.match('[^\\s]+(.*?)\\.(jpg|jpeg|png|JPG|JPEG|PNG)$')) {
          Cache.IRImageUp = true;
          Cache.No_IR_SecondImage_Invalid = false;
          await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);
          Cache.DiagnosticResultSecondRouterImageUploaded = false;
          await SESSION.SetCache(sessionID, Cache);
          resolve(UTIL.ComposeResult('', 'lms_creation_inprogress'));
        } else {
          Cache.IRImageUp = true;
          Cache.No_IR_SecondImage_Invalid = true;
          const { imageUrlArray } = Cache;
          const FirstRouterImageFile = Cache.DiagnosticResult_FirstRouterImage[0];
          const filenames = FirstRouterImageFile.filename;
          console.log('FileName', filenames, 'firstRouterImageFiel', JSON.stringify(FirstRouterImageFile), 'ImageUrlArray', imageUrlArray);
          console.log(casebody);
          // const caseResult = await createCase(casebody);
          const fallbackMessage = IMAGE_FALLBACK_MESSAGE_GUIDELINE;

          if (possitveDiagnosticResult === true && negativeDiagnosticResult !== true) {
            console.log(casebody);
            const caseResult = await createCase(casebody);
            if ('caseId' in caseResult) {
              Cache.LastCaseId = caseResult.caseId;
              await SESSION.SetCache(sessionID, Cache);
              const { caseId } = caseResult;
              console.log('caseId > ', caseId);
              /// /////attachment code
              if (FirstRouterImageFile) {
                // const file = fs.createWriteStream(`/tmp/${filename}`);
                // console.log('👓filename>>>', file);
                // const fetchUrl = FirstRouterImageFile.url;
                // console.log('🚗 FETCHURL - > ', fetchUrl);
                // await FETCH(fetchUrl)
                //   .then(
                //     res =>
                //       new Promise((resolve, reject) => {
                //         res.body.pipe(file);
                //         res.body.on('end', () => resolve('it worked'));
                //         file.on('error', reject);
                //       }),
                //   );

                // let Result = await CaseAttachment(caseId, filename);
              }
              await addAttacmentNoIR(caseId, sessionID, msisdn);
              Cache.DiagnosticResultSecondRouterImageUploaded = false;
              await SESSION.SetCache(sessionID, Cache);
              await SESSION.SetLastEvent(sessionID, { event: 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END', param: { caseId, fallbackMessageImage: fallbackMessage } });
              resolve(UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END', { caseId, fallbackMessageImage: fallbackMessage }));
            } else {
              Cache.DiagnosticResultSecondRouterImageUploaded = false;
              await SESSION.SetCache(sessionID, Cache);
              resolve(UTIL.ComposeResult('', 'MAXbot_TroubleshootHomeWifiFailedCaseCreation'));
            }
            // await SESSION.SetCache(sessionID, Cache)
            // let { filename } = image[0];
            // let file = fs.createWriteStream(`/tmp/${filename}`)
            // resolve(UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR_InvalidFormat'));
          } else if (possitveDiagnosticResult !== true && negativeDiagnosticResult === true) {
            // resolve(UTIL.ComposeResult('', 'IRTR_NegativeDiagnostiResult_NoIR_InvalidImage_CaseCreation'));
            await SESSION.SetContext(
              sessionID,
              CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET],
            );
            const caseResult = await createCase(casebody);

            // followupEvent = 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify';
            if ('caseId' in caseResult) {
              Cache.LastCaseId = caseResult.caseId;
              await SESSION.SetCache(sessionID, Cache);
              const { caseId } = caseResult;
              console.log('caseId > ', caseId);
              /// ////////////attachement code
              if (FirstRouterImageFile) {
                // const fetchUrl = FirstRouterImageFile.url;
                // console.log('🚗 FETCHURL - > ', fetchUrl);
                // let file = fs.createWriteStream(`/tmp/${filename}`);
                // console.log('👓filename>>>',file);
                // await FETCH(fetchUrl)
                //   .then(
                //     res =>
                //       new Promise((resolve, reject) => {
                //         res.body.pipe(file);
                //         res.body.on('end', () => resolve('it worked'));
                //         file.on('error', reject);
                //       })
                //   );

                // let Result = await CaseAttachment(caseId, filename);
                await addAttacmentNoIR(caseId, sessionID, msisdn);
                Cache.DiagnosticResultSecondRouterImageUploaded = false;
                await SESSION.SetCache(sessionID, Cache);
              }
              await SESSION.SetContext(
                sessionID,
                CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET],
              );

              Cache.DiagnosticResultSecondRouterImageUploaded = false;
              await SESSION.SetCache(sessionID, Cache);
              resolve(UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify', { caseId, fallbackMessageImage: fallbackMessage }));
            } else {
              Cache.DiagnosticResultSecondRouterImageUploaded = false;
              await SESSION.SetCache(sessionID, Cache);
              resolve(UTIL.ComposeResult('', 'MAXbot_TroubleshootHomeWifiFailedCaseCreation'));
            }
          }
        }
      }).catch((e) => {
        // let Cache = await SESSION.GetCache(sessionID);
        // Cache.DiagnosticResultSecondRouterImageUploaded = false;
        // await SESSION.SetCache(sessionID, Cache);
        console.log('ðŸ”»This is the error --->', e);
        resolve(UTIL.ComposeResult('', 'Shared_Tech_IssueServicing'));
      });
  });
};

// exports.IRTR_NoIR_SecondPhoto_AttachementCheck_Start = async function (event) {
//   const sessionID = UTIL.GetSessionID(event);
//   const msisdn = await SESSION.GetMSISDN(sessionID);
//   const Cache = await SESSION.GetCache(sessionID);
//   return new Promise(async (resolve) => {
//     const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
//     // need to return fro the promise itself mah
//     await delay(1500)
//       .then(async () => await SESSION.GetCache(sessionID))
//       .then(async (Cache) => {
//       const cusData = await getCustomerforWifi(sessionID, msisdn);
//       const modemId = Cache.SelectedModemId;
//       const ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH')[0].plan.name;
//       const diagnosticResult = Cache.DiagnosticSummary.Result;
//       const { negativeDiagnosticResult } = Cache;
//       const { possitveDiagnosticResult } = Cache;
//       Cache.NoIREnableDiagnostic = true;
//       const SecondRouterImageFile = Cache.DiagnosticResult_SecondRouterImage[0];
//       console.log('This is Second Router Image file', SecondRouterImageFile);
//       Cache.enableSecondRouterImageFlag = false;
//       const { filename } = SecondRouterImageFile;
//       console.log('FileName', filename);
//       let casebody = '';
//       const intentName = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_No';
//       if (possitveDiagnosticResult === true && negativeDiagnosticResult !== true) {
//         casebody = {
//           idType: 'MSISDN',
//           idValue: msisdn,
//           msisdn,
//           caseType1: 'Self Serve',
//           caseType2: CaseTypeText(diagnosticResult),
//           caseType3: 'BOT Escalation',
//           description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
//           isUpdateCBR: 'false',
//         };
//       } else {
//         casebody = {
//           idType: 'MSISDN',
//           idValue: msisdn,
//           msisdn,
//           caseType1: 'Self Serve',
//           caseType2: CaseTypeText(diagnosticResult),
//           caseType3: 'BOT Escalation',
//           description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
//           isUpdateCBR: 'false',
//         };
//       }
//       if (filename.match('[^\\s]+(.*?)\\.(jpg|jpeg|png|JPG|JPEG|PNG)$')) {
//         Cache.IRImageUp = true;
//         Cache.No_IR_SecondImage_Invalid = false;
//         await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);
//         await SESSION.SetCache(sessionID, Cache);
//         resolve(UTIL.ComposeResult('', 'lms_creation_inprogress'));
//       }
//       else {
//         Cache.IRImageUp = true;
//         Cache.No_IR_SecondImage_Invalid = true;
//         await SESSION.SetCache(sessionID, Cache);
//         //possitveDiagnosticResult === true && negativeDiagnosticResult !== true
//         if (possitveDiagnosticResult === true && negativeDiagnosticResult !== true){
//           resolve(UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR_InvalidFormat'));
//         } else if (possitveDiagnosticResult !== true && negativeDiagnosticResult === true){
//           resolve(UTIL.ComposeResult('', 'IRTR_NegativeDiagnostiResult_NoIR_InvalidImage_CaseCreation'));
//         }
//       }
//     }).catch((e) => {
//       console.log('ðŸ”»This is the error --->', e);
//       resolve(UTIL.ComposeResult('', 'Shared_Tech_IssueServicing'));
//     });
// });
// };

// Rajesh: 19/12/2022 Check router on/off

exports.IRTR_RouterSwitchedon_Connection_Not_Restored = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo', param: {} });
  return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo');
};

// Roshani: 15/12/2022 -> 6. perform a diagnostic test = NO create CaseID
exports.IRTR_Perform_DiagnosticTest_No = async function (event) {
  // console.log("ðŸ¤™ðŸ¤™ CALL IRTR_Perform_DiagnosticTest_No >>>")
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  const Cache = await SESSION.GetCache(sessionID);
  const modemId = Cache.SelectedModemId;
  let cusData = Cache.getCustomerforNRICPassport.responseData;
  const cusDataOLO = cusData;

  let ratePlanName = '';
  if (cusDataOLO) {
    ratePlanName = cusDataOLO.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH').filter((x) => x.serviceId === modemId)[0].plan.name;
  } else {
    cusData = await getCustomerforWifi(sessionID, msisdn);
    ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH').filter((x) => x.serviceId === modemId)[0].plan.name;
  }

  let diagnosticResult = '';

  if (!Cache.DiagnosticSummary) {
    diagnosticResult = '';
  } else {
    diagnosticResult = Cache.DiagnosticSummary.Result;
  }

  const intentName = 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist';

  const casebody = {
    idType: 'MSISDN',
    idValue: cusDataOLO ? modemId : msisdn,
    msisdn,
    caseType1: 'Self Serve',
    caseType2: CaseTypeText(diagnosticResult),
    caseType3: 'BOT Escalation',
    description: `Reason: WA MSISDN: ${msisdn}, Rate Plan: ${ratePlanName}, Modem ID: ${modemId},  Diagnostic Result: No, DF Intent Name: ${intentName},Attachement :Yes`,
    isUpdateCBR: 'false',
  };

  await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);

  return UTIL.ComposeResult('', 'lms_creation_inprogress');
};

exports.IRTR_UploadSecondImage_IR_AttachementCheck = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const cache = await SESSION.GetCache(sessionID);
  let LastEvent = await SESSION.GetLastEvent(sessionID);
  LastEvent = LastEvent.event;
  console.log('IRTR_UploadSecondImage_IR_AttachementCheck LastEvent >> ', LastEvent);
  console.log('Cache.DiagnosticResultSecondRouterImageUploaded 11 >> ', cache.DiagnosticResultSecondRouterImageUploaded);
  if ((LastEvent === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_ValidFirstSecondPhoto_OfferDiagnosticCheck' && cache.DiagnosticResultSecondRouterImageUploaded === false) || (LastEvent === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_InvalidFormat' && cache.DiagnosticResultSecondRouterImageUploaded === false)) {
    console.log('Cache.DiagnosticResultSecondRouterImageUploaded 22 >> ', cache.DiagnosticResultSecondRouterImageUploaded);
    console.log('IRTR_UploadSecondImage_IR_AttachementCheck Already CALLED');
  } else {
    return new Promise((resolve) => {
      // const delay = (milliseconds) => new Promise((resolves) => setTimeout(resolves, milliseconds));
      const delay = (milliseconds) => new Promise((resolves) => {setTimeout(resolves, milliseconds)});
      // need to return fro the promise itself mah
      delay(1900)
        .then(async () => await SESSION.GetCache(sessionID))
        .then(async (Cache) => {
          console.log('Cache.DiagnosticResultSecondRouterImageUploaded 33 >> ', Cache.DiagnosticResultSecondRouterImageUploaded);
          console.log('Ã°Å¸Ââ€º This is the cache -> ', Cache);
          // let locatePaymentFile = cache.LocatePayment[0];
          const imageRecognitionFile = Cache.ImageRecognition[0];
          const SecondRouterImageFile = Cache.DiagnosticResult_SecondRouterImage_IR[0];
          console.log('This is Second Router Image file', SecondRouterImageFile);
          console.log('Ã°Å¸â€œÂ This is the imageRecognitionFile file -> ', imageRecognitionFile);
          Cache.enableSecondRouterImageFlag_IR = false;
          console.log('logging Cache Second Router Image attachement details', SecondRouterImageFile.filename, SecondRouterImageFile.size, SecondRouterImageFile.url);
          const { filename } = SecondRouterImageFile;
          console.log('FileName', filename);
          console.log('ðŸ‘‰FileName Type:ðŸ‘‰', typeof filename);
          await SESSION.SetCache(sessionID, Cache);
          const followupEvent = '';
          if (filename.match('[^\\s]+(.*?)\\.(jpg|jpeg|png|JPG|JPEG|PNG)$')) {
            const imageUrlArray = [imageRecognitionFile.url, SecondRouterImageFile.url];
            const imageArray = [imageRecognitionFile, SecondRouterImageFile];
            console.log('imageUrlArray >> ', imageUrlArray);
            Cache.imageUrlArray = imageUrlArray;
            Cache.imageArray = imageArray;
            Cache.IRImageUp = true;
            Cache.DiagnosticResultSecondRouterImageUploaded = false;
            // followupEvent = 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_ValidFirstSecondPhoto_OfferDiagnosticCheck';
            await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_ValidFirstSecondPhoto_OfferDiagnosticCheck', param: {} });
            await SESSION.SetCache(sessionID, Cache);
            resolve(UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_ValidFirstSecondPhoto_OfferDiagnosticCheck'));
          } else {
            Cache.IRImageUp = true;
            Cache.DiagnosticResultSecondRouterImageUploaded = false;
            console.log('ðŸ‘ŽðŸ‘ŽInvalid Image');
            // followupEvent = 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_InvalidFormat';
            await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_InvalidFormat', param: {} });
            await SESSION.SetCache(sessionID, Cache);
            resolve(UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_InvalidFormat'));
          }
        }).catch((e) => {
          console.log('ðŸ”»This is the error --->', e);
        });
    });
  }
};

// Roshani : 13/12/2022 -> 1. upload first image check image upload attempts
exports.IRTR_RouterImageUploadYes_Check_Attempts = async function (event) {
  console.log('IRTR_RouterImageUploadYes_Check_Attempts >>>>>>>>>> ');

  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  // const msisdn = await SESSION.GetMSISDN(sessionID);
  // const modemId = UTIL.GetParameterValue(event, 'modemId');
  // console.log("modemId >>>> ", modemId)
  let LastEvent = await SESSION.GetLastEvent(sessionID);
  LastEvent = LastEvent.event;
  const modemId = Cache.SelectedModemId;
  await SESSION.SetCache(sessionID, Cache);
  const attemptCache = Cache.IRAttempts;
  console.log('Cache >>> ', Cache);
  console.log('attemptCache Cache >>> ', attemptCache);

  if (attemptCache === undefined || attemptCache < 2) {
    console.log('Customer not exceeded 2 attempts >>> ', attemptCache);
    await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights', param: {} });
    return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights');
  }
  if (LastEvent === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_InvalidFormat' && attemptCache === 2) {
    // Cache.IRAttempts = 1
    // await SESS
    await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights', param: {} });
    return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights');
  } if (LastEvent === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_InvalidFormat' && attemptCache === 2) {
    await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights', param: {} });
    return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights');
  }

  // const modemId = Cache.SelectedModemId;

  console.log('Customer exceeded 2 attempts >>> ', attemptCache);
  // await SESSION.SetLastEvent(sessionID, { "event": "IRTR_RouterImageUpload_AttemptsExceeded", "param": {} });

  Cache.IRAttemptsExceeded = true;

  await SESSION.SetCache(sessionID, Cache);

  return UTIL.ComposeResult('', 'IRTR_Network_Fibre_SlowWifi_DiagnosticCheck_Yes_AttemptsExceeded', { modemId });
  // return UTIL.ComposeResult("", "IRTR_RouterImageUpload_AttemptsExceeded", { "modemId": modemId });
};

// Roshani : 13/12/2022 -> 3. if file extension is image type then Callback for trigger IR
async function triggerIRAPI(sessionID, msisdn, LastEvent, imageRecognitionFile) {
  console.log('CALL triggerIRAPI >> ');
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        msisdn,
        TriggerIRAPI: 'TriggerIRAPI',
        sessionID,
        LastEvent,
        imageRecognitionFile,

      }),
    };
    await UTIL.GetUrl(url, head);
    return true;
  } catch (err) {
    console.log('Maxis callback failed with IR error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

function search(searchArr) {
    return (name) => searchArr.includes(name);
  }

// Roshani : 13/12/2022 -> 4. if prediction score > 0.5 and got prediction result then Check prediction conditions for IR first image
exports.IRTR_Trigger_Result = async function (event) {
  console.log('CALL IRTR_Trigger_Result >> ');
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  let LastEvent = await SESSION.GetLastEvent(sessionID);
  // const imageRecognitionFile = Cache.ImageRecognition[0];
  LastEvent = LastEvent.event;
  // console.log('Callback Cache >> ', Cache);

  if (Cache.IRAttempts === undefined) {
    Cache.IRAttempts = 1;
  } else {
    Cache.IRAttempts += 1;
  }
  await SESSION.SetCache(sessionID, Cache);

  let i = 0;
  while (i <= 1) {
    Cache = await SESSION.GetCache(sessionID);

    if (Cache.PredictionImageResult != undefined) {
      i++;

      PredictionImageResult = Cache.PredictionImageResult;

      displayNameCheck = ['HUAWEI', 'KAON', 'TPLink'];
      displayPowerOffCheck = ['Power_Off'];
      displayPowerOnCheck = ['Power_On'];
    //   resultdisplayNameCheck = PredictionImageResult.some((name) => displayNameCheck.includes(name));
    //   resultdisplayPowerOnCheck = PredictionImageResult.some((poweron) => displayPowerOnCheck.includes(poweron));
    //   resultdisplayPowerOffCheck = PredictionImageResult.some((poweroff) => displayPowerOffCheck.includes(poweroff));

      resultdisplayNameCheck = PredictionImageResult.some(search(displayNameCheck));
      resultdisplayPowerOnCheck = PredictionImageResult.some(search(displayPowerOnCheck));
      resultdisplayPowerOffCheck = PredictionImageResult.some(search(displayPowerOffCheck));

      if (resultdisplayNameCheck == true && resultdisplayPowerOnCheck == true) {
        Cache.ImageRecognitionFirstPhotoUploaded = false;
        await SESSION.SetCache(sessionID, Cache);
        await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo', param: {} });
        return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo');
      }
      if (resultdisplayNameCheck == true && resultdisplayPowerOffCheck == true) {
        Cache.ImageRecognitionFirstPhotoUploaded = false;
        await SESSION.SetCache(sessionID, Cache);
        await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_Offline_AdvisePowerOn', param: {} });
        return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_Offline_AdvisePowerOn');
      }

      Cache.ImageRecognitionFirstPhotoUploaded = false;
      Cache.ImageRecognition = undefined;
      await SESSION.SetCache(sessionID, Cache);
      await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_InvalidImage', param: {} });
      return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_InvalidImage');
    }
  }
};

exports.IRTR_RouterImageGuideline = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    console.log('sessionID >> ', sessionID);
    console.log('IRTR_RouterImageGuideline 22 >> ');
    return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_Confirmation');
  } catch (err) {
    console.log('ðŸ”»Maxis callback failed with IR error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

exports.IRTR_trigger = async function (event) {
  console.log('CALL IRTR_trigger >> ');
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  let LastEvent = await SESSION.GetLastEvent(sessionID);

  console.log('LastEvent >> ', LastEvent);
  console.log('Cache.ImageRecognitionFirstPhotoUploaded 11 >> ', Cache.ImageRecognitionFirstPhotoUploaded);
  if ((LastEvent === 'IRTR_FristRouterImage_IR_API_Initiate' && Cache.ImageRecognitionFirstPhotoUploaded === false) || (LastEvent === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_InvalidFormat' && Cache.ImageRecognitionFirstPhotoUploaded === false)) {
    console.log('IRTR_UploadSecondImage_IR_AttachementCheck Already CALLED');
    console.log('Cache.ImageRecognitionFirstPhotoUploaded 22 >> ', Cache.ImageRecognitionFirstPhotoUploaded);
  } else {
    Cache = await SESSION.GetCache(sessionID);
    console.log('Cache.ImageRecognitionFirstPhotoUploaded 33 >> ', Cache.ImageRecognitionFirstPhotoUploaded);

    const imageRecognitionFile = Cache.ImageRecognition[0];
    LastEvent = LastEvent.event;

    const attemptCache = Cache.IRAttempts;

    if (attemptCache === undefined || attemptCache < 2) {
      Cache.enableImageRecognitionFlag = false;
      await SESSION.SetCache(sessionID, Cache);

      const { filename } = imageRecognitionFile;
      const checkCaseCreated = Cache.ImageRecognition.filter((image) => image.caseCreated === true);

      if (filename.match('[^\\s]+(.*?)\\.(jpg|jpeg|png|JPG|JPEG|PNG)$')) {
        Cache.IRImageUp = true;
        await triggerIRAPI(sessionID, msisdn, LastEvent, imageRecognitionFile);
        // console.log('Then function CALL');
        await SESSION.SetLastEvent(sessionID, { event: 'IRTR_FristRouterImage_IR_API_Initiate', param: {} });
        await SESSION.SetCache(sessionID, Cache);
        return UTIL.ComposeResult('', 'IRTR_FristRouterImage_IR_API_Initiate');
      }

      Cache = await SESSION.GetCache(sessionID);
      if (Cache.IRAttempts === undefined) {
        Cache.IRAttempts = 1;
      } else {
        Cache.IRAttempts += 1;
      }

      Cache.IRImageUp = true;
      Cache.ImageRecognitionFirstPhotoUploaded = false;
      await SESSION.SetCache(sessionID, Cache);
      await SESSION.SetLastEvent(sessionID, { event: 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_InvalidFormat', param: {} });
      return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_InvalidFormat');
    }

    const modemId = Cache.SelectedModemId;

    Cache.IRAttemptsExceeded = true;
    Cache.modemId = modemId;
    Cache.ImageRecognitionFirstPhotoUploaded = false;
    await SESSION.SetCache(sessionID, Cache);

    return UTIL.ComposeResult('', 'IRTR_Network_Fibre_SlowWifi_DiagnosticCheck_Yes_AttemptsExceeded', { modemId });
  }
};
