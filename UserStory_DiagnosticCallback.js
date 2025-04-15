const UTIL = require('./Util');
const SESSION = require('./Handler_Session');
const HOST = require('./Handler_Host');

// Roshani: 15/12/2022 -> 7.  Callback perform a diagnostic test
const irCaseCreateAttachment = async (casebody, msisdn, trueIntent, falseIntent, sessionID) => {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

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

async function createInteration(body) {
  const url = `${HOST.INTERACTION[HOST.TARGET]}/interaction/api/v4.0/interaction`;

  const head = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', channel: 'MAXBOT' },
  };

  const data = await UTIL.GetUrl(url, head);
  return data.responseData;
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

async function createLead(msisdn) {
  const url = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;

  const body = {
    customerName: null,
    email: null,
    msisdn,
    leadCatId: 'PRD0000162',
    sourceId: 'MAXBOT',
    channelCode: 'MAXBOT',
    dealerCode: 'MAXBOT',
    userId: 'MAXBOT',
  };

  const head = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  };

  const data = await UTIL.GetUrl(url, head);
  return data.status == 'fail';
}

exports.Callback = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    console.log('befor settime out sessionID >> ', sessionID);

    let Cache = await SESSION.GetCache(sessionID);
    let summaryRes = Cache['DiagnosticSummary']
    console.log('Summary >> ', summaryRes);
    let i = 0;
    while (i < 1) {
      Cache = await SESSION.GetCache(sessionID);
      if (Cache.DiagnosticSummary) {
        i++;
        Cache.IRDiagnosticResults = true;

        const Summary = Cache.DiagnosticSummary;
        const diagnosticResult = Summary.Result;
        console.log('Callback diagnosticResult >> ', diagnosticResult);

        if (diagnosticResult == 'goodSignal' || diagnosticResult == 'poorSignal' || diagnosticResult == 'wrongFrequency' || diagnosticResult == 'tooManyDevices') {
          Cache.possitveDiagnosticResult = true;
          await SESSION.SetCache(sessionID, Cache);
        } else {
          Cache.negativeDiagnosticResult = true;
          await SESSION.SetCache(sessionID, Cache);
        }

        if (diagnosticResult == 'goodSignal' && Summary.Dev24Ghz != '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_GoodSignal_With2_4Ghz', { dev5ghz: Summary.Dev5Ghz, dev2_4ghz: Summary.Dev24Ghz, connectedDevice: Summary.ConnectedDevice });
        } if (diagnosticResult == 'goodSignal' && Summary.Dev24Ghz == '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_GoodSignal_Without2_4Ghz', { dev5ghz: Summary.Dev5Ghz, connectedDevice: Summary.ConnectedDevice });
        } if (diagnosticResult == 'poorSignal' && Summary.Dev24Ghz != '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_PoorSignal_With2_4Ghz', {
            dev5ghz: Summary.Dev5Ghz, dev2_4ghz: Summary.Dev24Ghz, connectedDevice: Summary.ConnectedDevice, signalDevice: Summary.PoorCount5 + Summary.PoorCount24, frequencyDevice: Summary.allSignalCount24,
          });
        } if (diagnosticResult == 'poorSignal' && Summary.Dev24Ghz == '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_PoorSignal_Without2_4Ghz', {
            dev5ghz: Summary.Dev5Ghz, connectedDevice: Summary.ConnectedDevice, signalDevice: Summary.PoorCount5 + Summary.PoorCount24, frequencyDevice: Summary.allSignalCount24,
          });
        } if (diagnosticResult == 'wrongFrequency' && Summary.Dev24Ghz != '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_WrongFrequency_With2_4Ghz', {
            dev5ghz: Summary.Dev5Ghz, dev2_4ghz: Summary.Dev24Ghz, connectedDevice: Summary.ConnectedDevice, signalDevice: Summary.allSignalCount24, frequencyDevice: Summary.allSignalCount24,
          });
        } if (diagnosticResult == 'wrongFrequency' && Summary.Dev24Ghz == '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_WrongFrequency_Without2_4Ghz', {
            dev5ghz: Summary.Dev5Ghz, connectedDevice: Summary.ConnectedDevice, signalDevice: Summary.allSignalCount24, frequencyDevice: Summary.allSignalCount24,
          });
        } if (diagnosticResult == 'tooManyDevices' && Summary.Dev24Ghz != '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_TooManyDevices_With2_4Ghz', { dev5ghz: Summary.Dev5Ghz, dev2_4ghz: Summary.Dev24Ghz, connectedDevice: Summary.ConnectedDevice });
        } if (diagnosticResult == 'tooManyDevices' && Summary.Dev24Ghz == '') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_TooManyDevices_Without2_4Ghz', { dev5ghz: Summary.Dev5Ghz, connectedDevice: Summary.ConnectedDevice });
        } if (diagnosticResult == 'CPE_Offline_HasCase') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Nok_HasCase');
        } if (diagnosticResult == 'CPE_Offline_NoCase') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Nok_NoCase');
        } if (diagnosticResult == 'Internet_Down_HasCase') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Nok_HasCase');
        } if (diagnosticResult == 'Internet_Down_NoCase') {
          console.log('Entered the IR Down - > ', Summary);
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Nok_NoCase');
        } if (diagnosticResult == 'Wifi_Down_HasCase') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Nok_HasCase');
        } if (diagnosticResult == 'Wifi_Down_NoCase') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Nok_NoCase');
        } if (diagnosticResult == 'RouterOffline') {
          return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_RouterOffline');
        }
        return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
      }
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

exports.AssistanceYes = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  const cusData = await getCustomerforWifi(sessionID, msisdn);
  const Cache = await SESSION.GetCache(sessionID);
  const { IRDiagnosticResults } = Cache;
  const { IRImageUp } = Cache;
  const { No_IR_FirstImageUp_Invalid } = Cache;
  const modemId = Cache.SelectedModemId;
  const cusDataOLO = Cache.getCustomerforNRICPassport.responseData;
  console.log('cusDataOLO >> ', cusDataOLO);

  const diagnosticResult = Cache.DiagnosticSummary.Result;

  let ratePlanName = '';
  if (cusDataOLO) {
    ratePlanName = cusDataOLO.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
  } else {
    ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
  }

  Cache.DiagnosticResult = true;
  await SESSION.SetCache(sessionID, Cache);

  console.log('IRDiagnosticResults >> ', IRDiagnosticResults, ' IRImageUp >> ', IRImageUp, ' modemId >> ', modemId, 'Is First image is Uploaded With diagnostic Results & NoIR', No_IR_FirstImageUp_Invalid);

  try {
    const intentName = 'Network.Fibre.SlowWifi.DiagnosticCheck.DiagnosticError.AssistanceYes';

    if (IRDiagnosticResults == true && IRImageUp == true) {
      const casebody = {
        // "idType": "MSISDN",
        // "idValue": msisdn,
        idType: 'MSISDN',
        idValue: cusDataOLO ? modemId : msisdn,
        msisdn,
        caseType1: 'Self Serve',
        caseType2: CaseTypeText(diagnosticResult),
        caseType3: 'BOT Escalation',
        description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
        isUpdateCBR: 'false',
      };

      await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);

      return UTIL.ComposeResult('', 'lms_creation_inprogress');
    } if (IRDiagnosticResults == true && IRImageUp == true && No_IR_FirstImageUp_Invalid == true) {
      const casebody = {
        // "idType": "MSISDN",
        // "idValue": msisdn,
        idType: 'MSISDN',
        idValue: cusDataOLO ? modemId : msisdn,
        msisdn,
        caseType1: 'Self Serve',
        caseType2: CaseTypeText(diagnosticResult),
        caseType3: 'BOT Escalation',
        description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
        isUpdateCBR: 'false',
      };

      await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);

      return UTIL.ComposeResult('', 'IRTR_DiagnostiResult_InvalidImage_CaseCreation');
    }
    if (IRDiagnosticResults != true && IRImageUp == true) {
      const casebody = {
        // "idType": "MSISDN",
        // "idValue": msisdn,
        idType: 'MSISDN',
        idValue: cusDataOLO ? modemId : msisdn,
        msisdn,
        caseType1: 'Self Serve',
        caseType2: CaseTypeText(diagnosticResult),
        caseType3: 'BOT Escalation',
        description: `Reason: WA MSISDN: ${msisdn}, Rate Plan: ${ratePlanName}, Modem ID: ${modemId}, Diagnostic Result: No, DF Intent Name: ${intentName},Attachement :Yes`,
        isUpdateCBR: 'false',
      };

      await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);

      return UTIL.ComposeResult('', 'lms_creation_inprogress');
    } if (IRDiagnosticResults == true && IRImageUp != true) {
      const { NoIREnableDiagnostic } = Cache;
      if (NoIREnableDiagnostic == true) {
        return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_DiagnosticCheck_WithoutRouterPhoto_OfferUploadRouterPhoto');
      }
      const body = {
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

      const caseResult = await createCase(body);

      if ('caseId' in caseResult) {
        Cache.LastCaseId = caseResult.caseId;
        const { caseId } = caseResult;
        await SESSION.SetCache(sessionID, Cache);
        return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify', { caseId });
      }
    }
  } catch (err) {
    console.log('🔻 Error: Assistance Yes');
    console.log(err);
    return UTIL.ComposeResult('', 'MAXbot_TroubleshootHomeWifiFailedCaseCreation');
  }


};

exports.AssistanceNo = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  const cusData = await getCustomerforWifi(sessionID, msisdn);
  const Cache = await SESSION.GetCache(sessionID);

  const modemId = Cache.SelectedModemId;
  const ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH')[0].plan.name;
  const diagnosticResult = Cache.DiagnosticSummary.Result;
  const intentName = 'Network.Fibre.SlowWifi.DiagnosticCheck.DiagnosticError.AssistanceNo';

  const body = {
    ids: [{ idValue: modemId, idType: 'SERVICE_ID' }],
    interactionType: 'Inbound',
    categories: 'APP',
    reasonLevel1: 'Self Serve',
    reasonLevel2: CaseTypeText(diagnosticResult),
    eventResult: 'None',
    additionalInformation: `WA MSISDN:${msisdn}, Modem ID: ${modemId}, Rate Plan: ${ratePlanName}, Diagnostic Result: ${DiagnosticResultHelper(diagnosticResult)}, Callback: No, DF Intent Name: ${intentName}`,
  };

  const interationResult = await createInteration(body);

  return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceNo_Notify');
};

exports.TooManyDevices_MeshWifi = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);

  try {
    const isfail = await createLead(msisdn);
    return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_Result_Ok_TooManyDevices_Telesales');
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

exports.DiagonsticResultNoErrorCRM = async function (event) {
  console.log('CALL DiagonsticResultNoErrorCRM 222222 >>');
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  const Cache = await SESSION.GetCache(sessionID);
  const cusData = await getCustomerforWifi(sessionID, msisdn);
  const cusDataOLO = Cache.getCustomerforNRICPassport.responseData;
  console.log('cusDataOLO >> ', cusDataOLO);

  const { IRDiagnosticResults } = Cache;
  const { IRImageUp } = Cache;
  const modemId = Cache.SelectedModemId;
  let ratePlanName = '';
  if (cusDataOLO) {
    ratePlanName = cusDataOLO.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
  } else {
    ratePlanName = cusData.accounts[0].msisdns.filter((x) => x.serviceType == 'FTTH').filter((x) => x.serviceId == modemId)[0].plan.name;
  }

  Cache.possitveDiagnosticResult = true;
  await SESSION.SetCache(sessionID, Cache);
  // eslint-disable-next-line camelcase
  const { No_IR_FirstImageUp_Invalid } = Cache;

  console.log('IRDiagnosticResults >> ', IRDiagnosticResults, ' IRImageUp >> ', IRImageUp, ' modemId >> ', modemId, 'Is First image is uploaded with out IR?', No_IR_FirstImageUp_Invalid);

  const diagnosticResult = Cache.DiagnosticSummary.Result;


  try {
    const intentName = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_No';

    if (IRDiagnosticResults == true && IRImageUp == true) {
      console.log('🖨️🖨️ IR Images uploaded and tested diagnostic result >> ');
      const casebody = {
        // "idType": "MSISDN",
        // "idValue": msisdn,
        idType: 'MSISDN',
        idValue: cusDataOLO ? modemId : msisdn,
        msisdn,
        caseType1: 'Self Serve',
        caseType2: CaseTypeText(diagnosticResult),
        caseType3: 'BOT Escalation',
        description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
        isUpdateCBR: 'false',
      };

      await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);

      return UTIL.ComposeResult('', 'lms_creation_inprogress');
    } if (IRDiagnosticResults == true && IRImageUp == true && No_IR_FirstImageUp_Invalid == true) {
      console.log('🖨️🖨️ IR Images uploaded and tested diagnostic result >> ');
      const casebody = {
        // "idType": "MSISDN",
        // "idValue": msisdn,
        idType: 'MSISDN',
        idValue: cusDataOLO ? modemId : msisdn,
        msisdn,
        caseType1: 'Self Serve',
        caseType2: CaseTypeText(diagnosticResult),
        caseType3: 'BOT Escalation',
        description: `Reason: WA MSISDN: ${msisdn},  Rate Plan: ${ratePlanName},Modem ID: ${modemId}, Diagnostic Result: ${CaseTypeText(diagnosticResult)}, DF Intent Name: ${intentName},Attachement:Yes`,
        isUpdateCBR: 'false',
      };

      await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);

      return UTIL.ComposeResult('', 'IRTR_DiagnostiResult_InvalidImage_CaseCreation');
    }
    if (IRDiagnosticResults != true && IRImageUp == true) {
      console.log('🖨️🖨️ IR Images uploaded and not tested diagnostic result >> ');
      const casebody = {
        // "idType": "MSISDN",
        // "idValue": msisdn,
        idType: 'MSISDN',
        idValue: cusDataOLO ? modemId : msisdn,
        msisdn,
        caseType1: 'Self Serve',
        caseType2: CaseTypeText(diagnosticResult),
        caseType3: 'BOT Escalation',
        description: `Reason: WA MSISDN: ${msisdn}, Rate Plan: ${ratePlanName}, Modem ID: ${modemId}, Diagnostic Result: No, DF Intent Name: ${intentName},Attachement :Yes`,
        isUpdateCBR: 'false',
      };

      await irCaseCreateAttachment(casebody, msisdn, 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist', 'MAXbot.TroubleshootHomeWifiFailedCaseCreation', sessionID);

      return UTIL.ComposeResult('', 'lms_creation_inprogress');
    } if (IRDiagnosticResults == true && IRImageUp != true) {
      console.log('🖨️🖨️ IR Images not uploaded and tested diagnostic result >> ');
      const { NoIREnableDiagnostic } = Cache;
      if (NoIREnableDiagnostic == true) {
        return UTIL.ComposeResult('', 'IRTR_Network_Fibre_Wifi_DiagnosticCheck_WithoutRouterPhoto_OfferUploadRouterPhoto');
      }
      const body = {
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

      const caseResult = await createCase(body);

      if ('caseId' in caseResult) {
        Cache.LastCaseId = caseResult.caseId;
        const { caseId } = caseResult;
        await SESSION.SetCache(sessionID, Cache);
        return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_No_END', { caseId });
      }
    }

  } catch (err) {
    console.log('🔻 Error: Diagonstic Result NoError CRM Creation');
    console.log(err);
    return UTIL.ComposeResult('', 'MAXbot_TroubleshootHomeWifiFailedCaseCreation');
  }

  //return UTIL.ComposeResult('', 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_No_END');
};

exports.IRTR_DiagnosticCheck_NoIR_CaseCreation = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = await SESSION.GetMSISDN(sessionID);
  const Cache = await SESSION.GetCache(sessionID);
  // let cusData = ''
  let casebody = '';

  const { negativeDiagnosticResult } = Cache;
  const { possitveDiagnosticResult } = Cache;

  const cusData = await getCustomerforWifi(sessionID, msisdn);
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
  let followupEvent = '';
  try {
    if (possitveDiagnosticResult == true && negativeDiagnosticResult != true) {
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
      followupEvent = 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END';
    } else {
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
      followupEvent = 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify';
    }
    const caseResult = await createCase(casebody);

    if ('caseId' in caseResult) {
      Cache.LastCaseId = caseResult.caseId;
      await SESSION.SetCache(sessionID, Cache);
    }
    const { caseId } = caseResult;
    console.log('caseId > ', caseId);
    return UTIL.ComposeResult('', followupEvent, { caseId });
  } catch (err) {
    console.log('🔻Unable To Create the Case DiagnosticCallback', err);
    console.log('👉📞Handovering to RingCentral agent');
    return UTIL.ComposeResult('', 'MAXbot_TroubleshootHomeWifiFailedCaseCreation');
  }
};
