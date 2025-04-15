//------------------------------------------------------------------------------------------------------------------------------------------
// ✨ Program: Maxis Diagnostic Callback To Orchestrator
//------------------------------------------------------------------------------------------------------------------------------------------
// X-Dimelo-Secret = r#uJ!MEyD7D7buVs74m4UazncUQh?#

const SESSION = require('./Handler_Session');
const DF = require('./Handler_DialogFlow');
const RC = require('./Handler_RingCentral');
const UTIL = require('./Util');
const HOST = require('./Handler_Host');
const { mode } = require('crypto-js');

const ERROR_CODES = [
  {key:'403', value:'CPE_Offline'},
  {key:'405', value:'Internet_Down'},
  {key:'406', value:'Wifi_Down'},
  {key:'409', value:'Wifi_Down'},
  {key:'407', value:'Wifi_Down'},
  {key:'414', value:'Wifi_Down'},
  {key:'412', value:'Wifi_Down'},
  {key:'413', value:'Wifi_Down'},
  {key:'411', value:'Wifi_Down'},
  {key:'417', value:'Wifi_Down'},
  {key:'410', value:'Wifi_Down'},
  {key:'408', value:'Wifi_Down'},
  {key:'504', value:'RouterOffline'},
];

async function getFiberDiagnosticFeaturesWifiConnectedDevices(modemId) {
  // API TEST: Sheet 32
  let url = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/settings?modemId=${modemId}&arrInfoType=FEATURES,WIFI,CONNECTED_DEVICES`;
  let head = {'headers': {'channel':'MAXBOT'}};

  let data = await UTIL.GetUrl(url,head);

  return data.responseData;
}

async function getFiberDiagnosticWifi(modemId) {
  // API TEST: Sheet 32
  let url = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/settings?modemId=${modemId}&arrInfoType=WIFI`;
  let head = {'headers': {'channel':'MAXBOT'}};

  let data = await UTIL.GetUrl(url,head);

  return data;
}

async function getCase(sessionID,modemId) {
  console.log('Entering inot getCase to check any open cases','Session ID:',sessionID,'ModemId',modemId);

  let targetmap = ['checkcpestatus','checkinetstatus', 'checkwifistat', 'checktputstat'];

  // API TEST: Sheet 22
  for (let i=0; i < targetmap.length; i++) {
    let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/${targetmap[i]}?conditionType=OPEN&numMonth=3`;
    let head = {'headers': {'channel':'MAXBOT', 'msisdn':modemId, 'languagecode':'en-US'}};

    let data = await UTIL.GetUrl(url,head);

    if (data.responseData.caseList.length > 0) {
      return true;
    }
  }

  return false;
}

async function getSummary (sessionID, msisdn) {
  let Cache = await SESSION.GetCache(sessionID);
  let modemId = Cache['SelectedModemId'];

  console.log('selected modem:', modemId);
  // CALL API 32 - Need SelectedModemId
  let wifData = await getFiberDiagnosticFeaturesWifiConnectedDevices(modemId);
  let signalStatus = '';

  if ('connectedDevicesList' in wifData) {
    let devices = wifData.connectedDevicesList.filter(e=>e.deviceInterface == 'WIFI');

    let goodSignal24 = devices.filter(e=>e.deviceBand == '2.4' && parseFloat(e.signalStrength) > -75);
    let goodSignal5 = devices.filter(e=>e.deviceBand == '5' && parseFloat(e.signalStrength) > -75);
    let poorSignal24 = devices.filter(e=>e.deviceBand == '2.4' && parseFloat(e.signalStrength) <= -75);
    let poorSignal5 = devices.filter(e=>e.deviceBand == '5' && parseFloat(e.signalStrength) <= -75);
    let allSignal24 = devices.filter(e=>e.deviceBand == '2.4');
    let allSignal5 = devices.filter(e=>e.deviceBand == '5');
    console.log('👉👉👓Signal details', 'GoodSignal24', goodSignal24, 'goodSignal5', goodSignal5, 'poorSignal24', poorSignal24, 'poorSignal5', poorSignal5, 'allSignal24', allSignal24, 'allSignal5', allSignal5);

    if (goodSignal24.length == devices.length || goodSignal5.length == devices.length)
      signalStatus = 'goodSignal';

    if (goodSignal5.length > 0 && goodSignal24.length > 0)
      signalStatus = 'wrongFrequency';

    if (poorSignal5.length > 0 || poorSignal24.length > 0)
      signalStatus = 'poorSignal';
      console.log('👉👓Signal Status', signalStatus);

    if (wifData.connectedDevice > 10 && wifData.wanDetlList[0].subscriberPackage == 30)
      signalStatus = 'tooManyDevices';
      console.log('👉Signal Status', signalStatus);

    Cache['DiagnosticSummary'] = {
      'Result': signalStatus,
      'Dev24Ghz': allSignal24.map(e=> e.deviceHostname).join('\n'),
      'Dev5Ghz': allSignal5.map(e=> e.deviceHostname).join('\n'),
      'ConnectedDevice': wifData.connectedDevice,
      'PoorCount5': poorSignal5.length,
      'PoorCount24': poorSignal24.length,
      'allSignalCount24' : allSignal24.length,
    };
  } else {
    signalStatus = 'goodSignal';
    console.log('👉👉Signal Status', signalStatus);

    Cache['DiagnosticSummary'] = {
      'Result': signalStatus,
      'Dev24Ghz': '',
      'Dev5Ghz': '',
      'ConnectedDevice': wifData.connectedDevice,
      'PoorCount5': '',
      'PoorCount24': '',
      'allSignalCount24' : '',
    };
  }

  await SESSION.SetCache(sessionID,Cache);
  return 'Network.Fibre.SlowWifi.DiagnosticCheck.Result';
}

async function getCpeOnline(modemId) {
  // let url = "http://api-digital-uat4.isddc.men.maxis.com.my/api/v4.0/fiberdiagnosis/submitFiberDiagnosis";
  let url = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/submitFiberDiagnosis`
  let head = {
    'headers': {'Content-Type': 'application/json', 'channel':'MAXBOT'},
    'method' : 'POST',
    'body'   : JSON.stringify({
      'modemId': modemId,
      'actionType':'CPE_ONLINE',
      'isCreateInteraction':false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data;
}

async function getInternetUp(modemId) {
  let url = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/submitFiberDiagnosis`
  let head = {
    'headers': {'Content-Type': 'application/json', 'channel':'MAXBOT'},
    'method' : 'POST',
    'body'   : JSON.stringify({
      'modemId': modemId,
      'actionType':'INTERNET_UP',
      'isCreateInteraction':false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data;
}

async function getWifiStatus(modemId) {
  let url = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/submitFiberDiagnosis`
  let head = {
    'headers': {'Content-Type': 'application/json', 'channel':'MAXBOT'},
    'method' : 'POST',
    'body'   : JSON.stringify({
      'modemId': modemId,
      'actionType':'WIFI_STATUS',
      'isCreateInteraction':false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data;
}

async function getThroughPut(modemId) {
  let url = `${HOST.FIBER_DIAGNOSIS[HOST.TARGET]}/fibrediagnosis/api/v4.0/fiberdiagnosis/submitFiberDiagnosis`
  let head = {
    'headers': {'Content-Type': 'application/json', 'channel':'MAXBOT'},
    'method' : 'POST',
    'body'   : JSON.stringify({
      'modemId': modemId,
      'actionType':'THROUGHPUT',
      'isCreateInteraction':false
    })
  };

  let data = await UTIL.GetUrl(url,head);
  return data;
}

async function WhenSuccess(sessionID, msisdn, body) {
  console.log('Entering  into functin When Success','SessionId',sessionID,'MSISDN',msisdn,'👉👉body',body);
  let Cache = await SESSION.GetCache(sessionID);
  let modemId = Cache['SelectedModemId'];
  console.log(`👉 ✔ checking for success: ${body.requestID} - ${body.actionType} modemId: ${modemId}`);

  if (body.actionType == 'CPE_ONLINE') {
    console.log('Action type is  >>>>>>>>CPE Online',body.actionType);
    let intData = await getInternetUp(modemId);

    await SESSION.UpdateFiberDiagnosis(sessionID,intData.responseData.requestId,'INTERNET_UP');
  } else if (body.actionType == 'INTERNET_UP') {
    console.log('Action type is  >>>>>>>>Interner type',body.actionType);
    let intData = await getWifiStatus(modemId);

    await SESSION.UpdateFiberDiagnosis(sessionID,intData.responseData.requestId,'WIFI_STATUS');
  } else if (body.actionType == 'WIFI_STATUS') {
    // 😁COMPLETE - PERFORM SUMMARY
    console.log('Action type is  >>>>>>>>WifiStatus',body.actionType);
    console.log('🚩 Tests Completed! Performing Diagnostic Summary');
    let result = await getSummary(sessionID, msisdn);
    return result;
  }

  return '';
}

async function WhenFail(sessionID,msisdn, modemId, body) {
  let queryText='Network.Fibre.SlowWifi.DiagnosticCheck.Result';
  let diagnosticResult = 'General_Error';
  console.log('👓👉ModemId for Fail Scenario',modemId);

  let errcode = body.violations[0].code;
  //   errcode = errcode.toString().split('_')[1];
  const errcodeTemp = errcode.toString().split('_')[1];
  errcode = errcodeTemp;

  console.log(`👉 ❌ checking for [${errcode}]: ${body.requestID} - ${body.actionType} `);

  let findErr = ERROR_CODES.filter(e=>e.key == errcode);

  // 👇non General Error (default is General Error)
  if (findErr.length > 0) {
    console.log('👉Session ID:',sessionID,'MSISDN:',msisdn,modemId);
    let isCase = await getCase(sessionID,modemId);
    diagnosticResult = `${findErr[0].value}_${isCase? 'HasCase' : 'NoCase'}`;
  }

  // store in case, will be reference by webhook eg. UserStory_DiagnosticCallback
  let Cache = await SESSION.GetCache(sessionID);
  Cache['DiagnosticSummary'] = {'Result':diagnosticResult};
  await SESSION.SetCache(sessionID,Cache);

  return queryText;
}

async function Check(sessionID,msisdn) {
  console.log('SessionId😊', sessionID);
  let queryText = 'Network.Fibre.SlowWifi.DiagnosticCheck.Result';
  let diagnosticResult = 'General_Error';
  // let diagnosticResult = "tooManyDevices"; //👈 was used for testing. Not required in production

  let Cache = await SESSION.GetCache(sessionID);
  let modemId = Cache['SelectedModemId'];
  console.log('ModemID',modemId);
  let fb = await getFiberDiagnosticWifi(modemId);

  if (fb.status == 'fail') {
    let errcode = fb.violations[0].code;
    // errcode = errcode.toString().split('_')[1];
    const errcodeTemp = errcode.toString().split('_')[1];
    errcode = errcodeTemp;

    console.log(`👉 ❌ checking for [${errcode}]: STEP 0 FiberDiagnostic`);

    let findErr = ERROR_CODES.filter(e=>e.key == errcode);

    // 👇non General Error (default is General Error)
    if (findErr.length > 0) {
      diagnosticResult = findErr[0].value;
    }

    console.log('👉 DiagnosticResult:' + diagnosticResult);

    // store in case, will be reference by webhook eg. UserStory_DiagnosticCallback
    Cache['DiagnosticSummary'] = {'Result':diagnosticResult};
    await SESSION.SetCache(sessionID,Cache);
  } else {
    let cpeData = await getCpeOnline(modemId);
    await SESSION.UpdateFiberDiagnosis(sessionID,cpeData.responseData.requestId,'CPE_ONLINE');
    // queryText="Network.Fibre.SlowWifi.DiagnosticCheck.InProgress";
    // queryText="";
  }

  console.log('queryText check fun>>>>>>>>>', queryText);
  return queryText;
}

// 👇primary entry point.
//----------------------------------------------------------------------------------------------------
exports.WIFiDiagnose = async (event, context) => {
  // Populate GCP credentials and RC access token in the entry point itself
  UTIL.populateEnvironmentKeys();
  await UTIL.populateRCAccessTokenSecret();
  await UTIL.populateGCPCredentialsSecret();
  UTIL.Dump(event,'Incoming RAW request');

  try {
    let queryText = '';
    let requestId = event.requestID;
    let actionType = event.actionType;
    let msisdn = '';
    let sessionID = '';
    let messageId = '';
    let modemId = '';
    let Cache = '';
    if (requestId == '-1') {
      msisdn = event.msisdn;
      sessionID = event.sessionID;
      Cache = await SESSION.GetCache(event.sessionID)
      modemId = Cache['SelectedModemId']
      messageId = await SESSION.getMessageId(sessionID);;
      console.log('👉MSISDN',msisdn,'👉SessionId',sessionID,'👉MessageID',messageId,'👉ModemId',modemId);
    } else {
      let item = await SESSION.GetIdentityByFiberDiagnosis(requestId, actionType);
      console.log('👉👉Item',item);
      console.log('Get Identity:', JSON.stringify(item));
      if (item == undefined) {
        console.log('🔻 Cannot find matching mssidn from given requestId.')
        return;
      }
      msisdn = item.msisdn;
      messageId = item.messageId;
      sessionID=item.sessionID
      Cache = await SESSION.GetCache(item.sessionID)
      modemId = Cache['SelectedModemId']
      console.log('👉item Modem id:',modemId);
    }
    console.log('👉👉eventStatus',event.status);
    if (event.status == '-1') {
      console.log('queryText status is =  -1>>>>', queryText);
      queryText = await Check(sessionID, msisdn);
    } else if (event.status=='success') { // CPE_ONLINE -- Will always be the first call
      console.log('👉👉Session Id:',sessionID,'MSISDN:',msisdn,'ModemId:',modemId);
      queryText = await WhenSuccess(sessionID, msisdn,event);
    } else {
      console.log('queryText status else>>>>', queryText);
      console.log('👉👉Session Id:',sessionID,'MSISN:',msisdn,'ModemId:',modemId);
      console.log('the event -> ', event)
      queryText = await WhenFail(sessionID, msisdn, modemId,event);
    }
    // DIALOG FLOW
    //------------------------------------------------------------------------
    console.log('❔querytText: ', queryText);
    context = await SESSION.GetContext(sessionID);
    console.log('👉👉context',context);
    if (queryText != '') {
      // 👇 call Dialogflow
      let response = await DF.Call(queryText, sessionID,msisdn, context);
      if (response != undefined && Object.keys(response).length > 0) {
        let intentName = response.queryResult.intent.displayName;
        console.log('IntentName Fiber Diagnostic: ', intentName);

        let messages = response.queryResult.fulfillmentMessages.filter(e=>e.text.text[0] != '');
        await SESSION.SetContext(sessionID, response['queryResult']['outputContexts']);
        let msgCount = messages.length;
        for(let i=0; i < msgCount; i++) {
          console.log('Tranlsation text!!!');
          var ignoreIntent = RC.GetIgnoreTranslateResponseList()
          var ignoreTranslate = intentName in ignoreIntent ? RC.IgnoreTranslateResponse(ignoreIntent[intentName], msgCount, i) : false
          let text = await RC.translateToEng(messages[i].text.text[0], msisdn,sessionID, true, intentName, ignoreTranslate);
          // let text = messages[i].text.text[0];
          // 👇 call Ring central
          await RC.Call(messageId,text);
        }
      }
    } else {
      console.log('🔻 Unrecognized callback.');
    }
  } catch (err) {
    console.log(`🔻 Error: ${err.toString()}`);
  }
}