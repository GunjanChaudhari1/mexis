// const async = require('async');
const UTIL = require('./Util');
const SESSION = require('./Handler_Session');
const HOST = require('./Handler_Host');
const DF = require('./Handler_DialogFlow');

async function getPenalty(msisdn) {
  const url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/querymobilerecontractinfo?queryType=msisdn&queryValue=${msisdn}`;
  const head = {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain', maxis_channel_type: 'MAXBOT' },
  };

  const data = await UTIL.GetUrl(url, head);

  return data.responseData;
}

async function getUnbilled(msisdn, accountno) {
  const url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/linecharges/unbilled?accountno=${accountno}&msisdn=${msisdn}`;

  const head = {
    headers: {
      'Content-Type': 'application/json', maxis_channel_type: 'MAXBOT', languageid: 'en-US', uuid: 'dcd5b0ae-7266-443d-a7e0-12f2776cdc4e',
    },
  };

  let data = await UTIL.GetUrl(url, head);
  data = data.responseData;

  if (data == undefined) data = { totalUnbilledAmount: 0 };

  return data;
}

async function getBills(msisdn, accountNo) {
  const url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bill?accountno=${accountNo}&msisdn=${msisdn}`;
  const head = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json', msisdn, channel: 'MAXBOT', languageid: 1,
    },

  };

  let data = await UTIL.GetUrl(url, head);
  data = data.responseData;
  return data;
}

async function getPayment(msisdn) {
  const url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/payments`;
  const head = {
    headers: {
      'Content-Type': 'application/json', msisdn, maxis_channel_type: 'MAXBOT', languageid: 'en-US', uuid: 'dcd5b0ae-7266-443d-a7e0-12f2776cdc4e',
    },
  };

  let data = await UTIL.GetUrl(url, head);
  data = data.responseData;
  return data;
}

async function getBillingInfoURL_HSSP(msisdn, languageId) {
  const url = `${HOST.BILLING_INFO_URL[HOST.TARGET]}/urlredirection/api/v1.0/selfserve/url/cb?msisdn=${msisdn}`;

  const head = { headers: { languageid: languageId, channel: 'MAXBOT' } };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    return data.responseData;
  }
  return 'https://selfserve.hotlink.com.my/en/auth';
}
async function getBillingInfoURL_MSSP(msisdn, accountNo, languageId) {
  console.log('getBillingInfoURL_MSSP', msisdn, accountNo, languageId);
  const url = `${HOST.BILLING_INFO_URL[HOST.TARGET]}/urlredirection/api/v1.0/care/url/cb?msisdn=${msisdn}&accountNumber=${accountNo}`;

  const head = { headers: { languageid: languageId, channel: 'MAXBOT' } };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    return data.responseData;
  }
  return 'https://care.maxis.com.my/en/auth';
}

async function getCustomerNakedFiber(searchtype, searchvalue) {
  const url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  const head = {
    headers: { 'Content-Type': 'application/json', maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
    method: 'POST',
    body: JSON.stringify({
      searchtype,
      searchvalue,
      prinSuppValue: '',
      isGetSupplementary: true,
      isPrincipalPlanName: true,
      isLookupAllAccount: true,
      isIndividual: 1,
      isSubscription: true,
      isIncludeOfferingConfig: false,
      isCustomerProfile: false,
      familyType: false,
    }),
  };

  const data = await UTIL.GetUrl(url, head);
  return data.responseData;
  // return data
}

async function getCustomer(msisdn, sessionID) {
  const url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  const head = {
    headers: { 'Content-Type': 'application/json', maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
    method: 'POST',
    body: JSON.stringify({
      searchtype: 'MSISDN',
      searchvalue: msisdn,
      prinSuppValue: '',
      isGetSupplementary: true,
      isPrincipalPlanName: true,
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

function Proper(str) {
  const newstr = str.split(' ').map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase()).join(' ');
  return newstr;
}


async function getCustomerNRICPassportContractInfo (event, returnParam) {
  console.log("Running getCustomerNRICPassportContractInfo 222")
  const sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  const Cache = await SESSION.GetCache(sessionID);

    let cusData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = cusData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
        msisdn = serviceId[0].serviceId;
    } else {
        msisdn = cusData.accounts[0].msisdns[0].serviceId;
    }

  const languageId = Cache.Language === 1 ? 'ms-MY' : 'en-US';
  const CustomerType = await SESSION.GetCustomerType(sessionID);

  const { accountNo } = cusData.accounts[0];
  let subType = '';
  subType = await CustomerType.subType;
  console.log('SubType', subType);

  const urlMessage = '';
  let followUpEvent = '';
  const serviceStatusID = UTIL.GetParameterValue(event, 'serviceStatus');
  const serviceStatusText = {
    Active: 'A',
    Barred: 'B',
    Suspended: 'S',
  };

  let accData = cusData;
  
  const penData = await getPenalty(msisdn);
  let serviceStatus = serviceStatusText[serviceStatusID];

  const { suspensionStatus } = cusData.accounts[0].msisdns[0];

  if (suspensionStatus.includes('Barred')) {
    serviceStatus = 'B';
  }

  let url;
  if (serviceStatus === 'A') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>1', url);
      followUpEvent = 'Billing_AccountStatus_Active_ContractInfo';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      console.log('url>>>>>>>>>>>2', url);
      followUpEvent = 'Billing_AccountStatus_Active_ContractInfo_Hotlink';
    }
  } else if (serviceStatus === 'B' && suspensionStatus === 'Barred-Collection') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>3', url);
      followUpEvent = 'Billing_AccountStatus_Barred';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      console.log('url>>>>>>>>>>>4', url);
      followUpEvent = 'Billing_AccountStatus_Barred_Hotlink';
    }
  } else if (serviceStatus === 'B' && suspensionStatus !== 'Barred-Collection') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>5', url);
      followUpEvent = 'Billing_AccountStatus_Barred_Credit';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      console.log('url>>>>>>>>>>>6', url);
      followUpEvent = 'Billing_AccountStatus_Barred_Credit_Hotlink';// not triggering
    }
  } else if (serviceStatus === 'S') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>6', url);
      followUpEvent = 'Billing_AccountStatus_Suspended';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      followUpEvent = 'Billing_AccountStatus_Suspended_Hotlink';
    }
  } else {
    if (subType === 'Maxis Individual') {
      console.log('Account Status Error ðŸ”»');
      url = 'https://care.maxis.com.my/en/auth';
    } else {
      url = 'https://selfserve.hotlink.com.my/en/auth';
    }
    console.log('1111111111111111111111111111111111*************7');
    followUpEvent = 'Shared_Tech_IssueServicing';
  }

  const serviceStatus_Text = {
    A: 'Active',
    B: 'Barred',
    S: 'Suspended',
  };
  console.log('1111111111111111111111111111111111*************8');
  if (accData == null || penData == null) {
    console.log('1111111111111111111111111111111111*************9');
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }

  let deviceName = '';
  let contractType = '';
  let contractStartDate = '';
  let contractEndDate = '';
  let contractDuration = '';
  let entryPlan = '-';
  let earlyTerminationFee = '';
  let extendedDate = '-';
  let contractTypeText = '';

  const contractText = { K2: 'Normal Contract', Zerolution360: 'Zerolution 360 Contract', Zerolution: 'Zerolution Contract' };

  if ('device' in accData.accounts[0].msisdns[0]) {
    deviceName = accData.accounts[0].msisdns[0].device.name;
    contractType = accData.accounts[0].msisdns[0].device.contractType;
    contractTypeText = contractText[contractType];
    contractStartDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractStartDate);
    contractEndDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractEndDate);

    if ('deviceReturnEndDate' in accData.accounts[0].msisdns[0].device && accData.accounts[0].msisdns[0].device.deviceReturnEndDate !== undefined && accData.accounts[0].msisdns[0].device.deviceReturnEndDate !== '') {
      const ReturnEndDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.deviceReturnEndDate);
      extendedDate = ReturnEndDate;

      if (contractType === 'Zerolution') contractEndDate = ReturnEndDate;
    }

    contractDuration = accData.accounts[0].msisdns[0].device.contractDuration;
    console.log('contractDuration', contractDuration);
    
    if (penData.contractPenalty.penalties.length > 0) {
      if (penData.contractPenalty.penalties[0].contractAttributes.attributes.length > 0) {
        const planName = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter((e) => e.name === 'EntryPointPlanName');
        if (planName.length > 0) {
          entryPlan = planName[0].value;
        }
      }

      earlyTerminationFee = "• Early Termination Fee: RM" + UTIL.ToCurrency(penData.contractPenalty.penalties[0].etfAmount);
      const nonReturnFeeList = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter((e) => e.name === 'Device_Non-Return_Fee');
      if (nonReturnFeeList.length > 0){
          earlyTerminationFee = earlyTerminationFee + "\n• Device Non Return Fee: RM" + UTIL.ToCurrency(nonReturnFeeList[0].value);
      }
    }
  }
  const updateUrl = url;
  console.log('>>>>>url', updateUrl);
  
  const returnParams = {
    serviceStatus: serviceStatus_Text[serviceStatus],
    ratePlanName: returnParam.ratePlanName,
    accountNo,
    billCreditLimit: returnParam.billCreditLimit,
    billCurrentCharges: returnParam.billCurrentCharges,
    billOverdueCharge: returnParam.billOverdueCharge,
    totalUnbilledAmount: returnParam.totalUnbilledAmount,
    billAmountDue: returnParam.billAmountDue,

    lastPaymentAmount: returnParam.lastPaymentAmount,
    billDueDate: returnParam.billDueDate,
    lastPaymentDate: returnParam.lastPaymentDate,
    paymentMethod: returnParam.paymentMethod,

    msisdn: UTIL.ToMobileNumber(msisdn),
    deviceName,
    contractType,
    contractStartDate: UTIL.ToDD_MM_YY(contractStartDate),
    contractEndDate: UTIL.ToDD_MM_YY(contractEndDate),
    contractDuration,
    contractTypeText,
    durationLeft: UTIL.GetDateDiffInMonths(new Date(contractEndDate), new Date()),
    earlyTerminationFee,
    urlMessage,
  };

  if (entryPlan !== '-' || entryPlan !== '') {
    returnParams.entryPlan = entryPlan;
  }

  if (contractType === 'Zerolution360') {
    returnParams.extendedDate = UTIL.ToDD_MM_YY(extendedDate);
  }
  if (penData.hasDeviceContract === false) {
    returnParams.msisdn = null;
    returnParams.deviceName = null;
    returnParams.contractTypeText = null;
    returnParams.contractStartDate = null;
    returnParams.contractEndDate = null;
    returnParams.extendedDate = null;
    returnParams.entryPlan = null;
    returnParams.earlyTerminationFee = null;
  }
  returnParams.url = updateUrl;
  returnParams.urlMessage = urlMessage;

  
    console.log('event 11 >>>>>>>>>>', event);
    console.log('event.outputContexts 11>>>>>>>>>>', event.queryResult.outputContexts);
    console.log('EventName 11', followUpEvent, JSON.stringify(returnParams));
    console.log('Parameters 11', returnParams);

  return UTIL.ComposeResult('', followUpEvent, returnParams);

};


exports.AccountStatus = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  //------------------------------------------------------------------------------
  // ðŸ”EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  Cache['accountStatus'] = 'Account';
  await SESSION.SetCache(sessionID, Cache);
  const redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID, 'Account');
  if (redirectToEvent !== undefined) return UTIL.ComposeResult('', redirectToEvent);
  //------------------------------------------------------------------------------

  let followUpEvent = 'Billing_AccountStatus_Active_End';
  let returnParam = {};
  try {

    const paymentTextMap = {
      check: 'Cheque',
      cash: 'Cash',
      tokenizedcard: 'Credit Card',
      '-': '-',
    };

    Cache = await SESSION.GetCache(sessionID);

    if (Cache['customerData']['responseData'] == null && !Cache.MaxisNakedFiber) {
      return UTIL.ComposeResult('', 'Authentication_OLO_Multichannel');
    }

    let accData = '';
    if (Cache['customerData']['responseData'] == null) {
      accData = Cache.getCustomerforNRICPassport.responseData;
    } else {
      accData = Cache.customerData.responseData;
    }

    let { accountNo } = accData.accounts[0];
    const ratePlanName = accData.accounts[0].msisdns[0].plan.name;
    let serviceStatus = accData.accounts[0].msisdns[0].status;
    serviceStatus = Proper(serviceStatus);

    msisdn = accData.accounts[0].msisdns[0].serviceId;
    console.log('********************[msisdn]*************', msisdn);

    console.log("Cache Account 11 >> ", Cache);

    let bilData = '';
    let ublData = '';
    let payData = '';
    let i = 0;
    while (i < 2) {
      Cache = await SESSION.GetCache(sessionID);
      if (Cache.paymentData !== undefined) {
        i++;
        bilData = Cache.billData.responseData;
        ublData = Cache.unBillData.responseData;
        if (ublData === undefined || ublData == null) ublData = { totalUnbilledAmount: 0 };
        payData = Cache.paymentData.responseData;
      }
    }

    let lastPaymentDate = payData.paymentlist.length > 0 ? payData.paymentlist[0].paymentdate : '-';

    if (lastPaymentDate !== '-') lastPaymentDate = `${lastPaymentDate.substr(6, 2)}-${lastPaymentDate.substr(4, 2)}-${lastPaymentDate.substr(2, 2)}`;

    let paymentMethodText = payData.paymentlist.length > 0 ? payData.paymentlist[0].paymentMethodDesc : '-';
    paymentMethodText = paymentTextMap[paymentMethodText.toLowerCase()];

    returnParam = {
      serviceStatus,
      ratePlanName,
      accountNo,
      billCreditLimit: UTIL.ToCurrency(bilData.billCreditLimit),
      billCurrentCharges: UTIL.ToCurrency(bilData.billCurrentCharges),
      billOverdueCharge: UTIL.ToCurrency(bilData.billOverdueCharge),
      totalUnbilledAmount: UTIL.ToCurrency(ublData.totalUnbilledAmount),
      billAmountDue: UTIL.ToCurrency(bilData.billAmountDue),
      lastPaymentAmount: payData.paymentlist.length > 0 ? UTIL.ToCurrency(payData.paymentlist[0].paymentamount) : '0.00',
      billDueDate: UTIL.ToDD_MM_YY(bilData.billPaymentDueDateText),
      lastPaymentDate,
      paymentMethod: paymentMethodText,
    };

    if (Cache['customerData']['responseData'] == null) {
      console.log("Running getCustomerNRICPassportContractInfo 11");
      //await getCustomerNRICPassportContractInfo (event, returnParam);


      
      // const sessionID = UTIL.GetSessionID(event);
      // let msisdn = await SESSION.GetMSISDN(sessionID);
      // const Cache = await SESSION.GetCache(sessionID);

      let cusData = Cache.getCustomerforNRICPassport.responseData;
      const serviceId = cusData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
      if (serviceId.length !== 0) {
        msisdn = serviceId[0].serviceId;
      } else {
        msisdn = cusData.accounts[0].msisdns[0].serviceId;
      }

      const languageId = Cache.Language === 1 ? 'ms-MY' : 'en-US';
      const CustomerType = await SESSION.GetCustomerType(sessionID);

      accountNo = cusData.accounts[0].accountNo;
      let subType = '';
      subType = await CustomerType.subType;
      console.log('SubType', subType);

      const urlMessage = '';
      followUpEvent = '';
      const serviceStatusID = serviceStatus;
      const serviceStatusText = {
        Active: 'A',
        Barred: 'B',
        Suspended: 'S',
      };

      //let accData = cusData;

      const penData = await getPenalty(msisdn);
      serviceStatus = serviceStatusText[serviceStatusID];

      const { suspensionStatus } = cusData.accounts[0].msisdns[0];

      if (suspensionStatus.includes('Barred')) {
        serviceStatus = 'B';
      }

      let url;
      if (serviceStatus === 'A') {
        if (subType === 'Maxis Individual') {
          url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
          console.log('url>>>>>>>>>>>1', url);
          followUpEvent = 'Billing_AccountStatus_Active_ContractInfo';
        } else if (subType === 'Hotlink Individual') {
          url = await getBillingInfoURL_HSSP(msisdn, languageId);
          console.log('url>>>>>>>>>>>2', url);
          followUpEvent = 'Billing_AccountStatus_Active_ContractInfo_Hotlink';
        }
      } else if (serviceStatus === 'B' && suspensionStatus === 'Barred-Collection') {
        if (subType === 'Maxis Individual') {
          url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
          console.log('url>>>>>>>>>>>3', url);
          followUpEvent = 'Billing_AccountStatus_Barred';
        } else if (subType === 'Hotlink Individual') {
          url = await getBillingInfoURL_HSSP(msisdn, languageId);
          console.log('url>>>>>>>>>>>4', url);
          followUpEvent = 'Billing_AccountStatus_Barred_Hotlink';
        }
      } else if (serviceStatus === 'B' && suspensionStatus !== 'Barred-Collection') {
        if (subType === 'Maxis Individual') {
          url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
          console.log('url>>>>>>>>>>>5', url);
          followUpEvent = 'Billing_AccountStatus_Barred_Credit';
        } else if (subType === 'Hotlink Individual') {
          url = await getBillingInfoURL_HSSP(msisdn, languageId);
          console.log('url>>>>>>>>>>>6', url);
          followUpEvent = 'Billing_AccountStatus_Barred_Credit_Hotlink';// not triggering
        }
      } else if (serviceStatus === 'S') {
        if (subType === 'Maxis Individual') {
          url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
          console.log('url>>>>>>>>>>>6', url);
          followUpEvent = 'Billing_AccountStatus_Suspended';
        } else if (subType === 'Hotlink Individual') {
          url = await getBillingInfoURL_HSSP(msisdn, languageId);
          followUpEvent = 'Billing_AccountStatus_Suspended_Hotlink';
        }
      } else {
        if (subType === 'Maxis Individual') {
          console.log('Account Status Error ðŸ”»');
          url = 'https://care.maxis.com.my/en/auth';
        } else {
          url = 'https://selfserve.hotlink.com.my/en/auth';
        }
        console.log('1111111111111111111111111111111111*************7');
        followUpEvent = 'Shared_Tech_IssueServicing';
      }

      const serviceStatus_Text = {
        A: 'Active',
        B: 'Barred',
        S: 'Suspended',
      };
      console.log('1111111111111111111111111111111111*************8');
      if (accData == null || penData == null) {
        console.log('1111111111111111111111111111111111*************9');
        return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
      }

      let deviceName = '';
      let contractType = '';
      let contractStartDate = '';
      let contractEndDate = '';
      let contractDuration = '';
      let entryPlan = '-';
      let earlyTerminationFee = '';
      let extendedDate = '-';
      let contractTypeText = '';

      const contractText = { K2: 'Normal Contract', Zerolution360: 'Zerolution 360 Contract', Zerolution: 'Zerolution Contract' };

      if ('device' in accData.accounts[0].msisdns[0]) {
        deviceName = accData.accounts[0].msisdns[0].device.name;
        contractType = accData.accounts[0].msisdns[0].device.contractType;
        contractTypeText = contractText[contractType];
        contractStartDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractStartDate);
        contractEndDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractEndDate);

        if ('deviceReturnEndDate' in accData.accounts[0].msisdns[0].device && accData.accounts[0].msisdns[0].device.deviceReturnEndDate !== undefined && accData.accounts[0].msisdns[0].device.deviceReturnEndDate !== '') {
          const ReturnEndDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.deviceReturnEndDate);
          extendedDate = ReturnEndDate;

          if (contractType === 'Zerolution') contractEndDate = ReturnEndDate;
        }

        contractDuration = accData.accounts[0].msisdns[0].device.contractDuration;
        console.log('contractDuration', contractDuration);

        if (penData.contractPenalty.penalties.length > 0) {
          if (penData.contractPenalty.penalties[0].contractAttributes.attributes.length > 0) {
            const planName = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter((e) => e.name === 'EntryPointPlanName');
            if (planName.length > 0) {
              entryPlan = planName[0].value;
            }
          }

          earlyTerminationFee = "• Early Termination Fee: RM" + UTIL.ToCurrency(penData.contractPenalty.penalties[0].etfAmount);
          const nonReturnFeeList = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter((e) => e.name === 'Device_Non-Return_Fee');
          if (nonReturnFeeList.length > 0){
              earlyTerminationFee = earlyTerminationFee + "\n• Device Non Return Fee: RM" + UTIL.ToCurrency(nonReturnFeeList[0].value);
          }
        }
      }
      const updateUrl = url;
      console.log('>>>>>url', updateUrl);

      const returnParams = {
        serviceStatus: serviceStatus_Text[serviceStatus],
        ratePlanName: returnParam.ratePlanName,
        accountNo,
        billCreditLimit: returnParam.billCreditLimit,
        billCurrentCharges: returnParam.billCurrentCharges,
        billOverdueCharge: returnParam.billOverdueCharge,
        totalUnbilledAmount: returnParam.totalUnbilledAmount,
        billAmountDue: returnParam.billAmountDue,

        lastPaymentAmount: returnParam.lastPaymentAmount,
        billDueDate: returnParam.billDueDate,
        lastPaymentDate: returnParam.lastPaymentDate,
        paymentMethod: returnParam.paymentMethod,

        msisdn: UTIL.ToMobileNumber(msisdn),
        deviceName,
        contractType,
        contractStartDate: UTIL.ToDD_MM_YY(contractStartDate),
        contractEndDate: UTIL.ToDD_MM_YY(contractEndDate),
        contractDuration,
        contractTypeText,
        durationLeft: UTIL.GetDateDiffInMonths(new Date(contractEndDate), new Date()),
        earlyTerminationFee,
        urlMessage,
      };

      if (entryPlan !== '-' || entryPlan !== '') {
        returnParams.entryPlan = entryPlan;
      }

      if (contractType === 'Zerolution360') {
        returnParams.extendedDate = UTIL.ToDD_MM_YY(extendedDate);
      }
      if (penData.hasDeviceContract === false) {
        returnParams.msisdn = null;
        returnParams.deviceName = null;
        returnParams.contractTypeText = null;
        returnParams.contractStartDate = null;
        returnParams.contractEndDate = null;
        returnParams.extendedDate = null;
        returnParams.entryPlan = null;
        returnParams.earlyTerminationFee = null;
      }
      returnParams.url = updateUrl;
      returnParams.urlMessage = urlMessage;


      console.log('event 11 >>>>>>>>>>', event);
      console.log('event.outputContexts 11>>>>>>>>>>', event.queryResult.outputContexts);
      console.log('EventName 11', followUpEvent, JSON.stringify(returnParams));
      console.log('Parameters 11', returnParams);

      return UTIL.ComposeResult('', followUpEvent, returnParams);

    }

    console.log('event 22 >>>>>>>>>>', event);
    console.log('event.outputContexts 22>>>>>>>>>>', event.queryResult.outputContexts);
    console.log('EventName 22', followUpEvent, JSON.stringify(returnParam));
    console.log('Parameters 22', returnParam);

    return UTIL.ComposeResult('', followUpEvent, returnParam);

  } catch (err) {
    console.log('Account Status Error ðŸ”»'); console.log(err);
    followUpEvent = 'Shared_Tech_IssueServicing';
    return UTIL.ComposeResult('', followUpEvent, returnParam);
  }

};



exports.ContractInfo = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  const Cache = await SESSION.GetCache(sessionID);

  let cusData = '';
  if (Cache.customerData.responseData == null) {
    cusData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = cusData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = cusData.accounts[0].msisdns[0].serviceId;
    }
  } else {
    cusData = Cache.customerData.responseData;
  }

  const languageId = Cache.Language === 1 ? 'ms-MY' : 'en-US';
  const CustomerType = await SESSION.GetCustomerType(sessionID);

  const { accountNo } = cusData.accounts[0];
  let subType = '';
  subType = await CustomerType.subType;
  console.log('SubType', subType);

  const urlMessage = '';
  let followUpEvent = '';
  const serviceStatusID = UTIL.GetParameterValue(event, 'serviceStatus');
  const serviceStatusText = {
    Active: 'A',
    Barred: 'B',
    Suspended: 'S',
  };

  let accData = '';
  if (Cache.customerData.responseData == null) {
    accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  } else {
    accData = Cache.customerData.responseData;
  }
  const penData = await getPenalty(msisdn);
  let serviceStatus = serviceStatusText[serviceStatusID];

  const { suspensionStatus } = cusData.accounts[0].msisdns[0];

  if (suspensionStatus.includes('Barred')) {
    serviceStatus = 'B';
  }

  let url;
  if (serviceStatus === 'A') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>1', url);
      followUpEvent = 'Billing_AccountStatus_Active_ContractInfo';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      console.log('url>>>>>>>>>>>2', url);
      followUpEvent = 'Billing_AccountStatus_Active_ContractInfo_Hotlink';
    }
  } else if (serviceStatus === 'B' && suspensionStatus === 'Barred-Collection') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>3', url);
      followUpEvent = 'Billing_AccountStatus_Barred';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      console.log('url>>>>>>>>>>>4', url);
      followUpEvent = 'Billing_AccountStatus_Barred_Hotlink';
    }
  } else if (serviceStatus === 'B' && suspensionStatus !== 'Barred-Collection') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>5', url);
      followUpEvent = 'Billing_AccountStatus_Barred_Credit';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      console.log('url>>>>>>>>>>>6', url);
      followUpEvent = 'Billing_AccountStatus_Barred_Credit_Hotlink';// not triggering
    }
  } else if (serviceStatus === 'S') {
    if (subType === 'Maxis Individual') {
      url = await getBillingInfoURL_MSSP(msisdn, accountNo, languageId);
      console.log('url>>>>>>>>>>>6', url);
      followUpEvent = 'Billing_AccountStatus_Suspended';
    } else if (subType === 'Hotlink Individual') {
      url = await getBillingInfoURL_HSSP(msisdn, languageId);
      followUpEvent = 'Billing_AccountStatus_Suspended_Hotlink';
    }
  } else {
    if (subType === 'Maxis Individual') {
      console.log('Account Status Error ðŸ”»');
      url = 'https://care.maxis.com.my/en/auth';
    } else {
      url = 'https://selfserve.hotlink.com.my/en/auth';
    }
    console.log('1111111111111111111111111111111111*************7');
    followUpEvent = 'Shared_Tech_IssueServicing';
  }

  const serviceStatus_Text = {
    A: 'Active',
    B: 'Barred',
    S: 'Suspended',
  };
  console.log('1111111111111111111111111111111111*************8');
  if (accData == null || penData == null) {
    console.log('1111111111111111111111111111111111*************9');
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }

  let deviceName = '';
  let contractType = '';
  let contractStartDate = '';
  let contractEndDate = '';
  let contractDuration = '';
  let entryPlan = '-';
  let earlyTerminationFee = '';
  let extendedDate = '-';
  let contractTypeText = '';

  const contractText = { K2: 'Normal Contract', Zerolution360: 'Zerolution 360 Contract', Zerolution: 'Zerolution Contract' };

  if ('device' in accData.accounts[0].msisdns[0]) {
    deviceName = accData.accounts[0].msisdns[0].device.name;
    contractType = accData.accounts[0].msisdns[0].device.contractType;
    contractTypeText = contractText[contractType];
    contractStartDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractStartDate);
    contractEndDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.contractEndDate);

    if ('deviceReturnEndDate' in accData.accounts[0].msisdns[0].device && accData.accounts[0].msisdns[0].device.deviceReturnEndDate !== undefined && accData.accounts[0].msisdns[0].device.deviceReturnEndDate !== '') {
      const ReturnEndDate = UTIL.ToLocalDateTime(accData.accounts[0].msisdns[0].device.deviceReturnEndDate);
      extendedDate = ReturnEndDate;

      if (contractType === 'Zerolution') contractEndDate = ReturnEndDate;
    }

    contractDuration = accData.accounts[0].msisdns[0].device.contractDuration;
    console.log('contractDuration', contractDuration);

    if (penData.contractPenalty.penalties.length > 0) {
      if (penData.contractPenalty.penalties[0].contractAttributes.attributes.length > 0) {
        const planName = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter((e) => e.name === 'EntryPointPlanName');
        if (planName.length > 0) {
          entryPlan = planName[0].value;
        }
      }

      earlyTerminationFee = "• Early Termination Fee: RM" + UTIL.ToCurrency(penData.contractPenalty.penalties[0].etfAmount);
      const nonReturnFeeList = penData.contractPenalty.penalties[0].contractAttributes.attributes.filter((e) => e.name === 'Device_Non-Return_Fee');
      if (nonReturnFeeList.length > 0){
          earlyTerminationFee = earlyTerminationFee + "\n• Device Non Return Fee: RM" + UTIL.ToCurrency(nonReturnFeeList[0].value);
      }
    }
  }
  const updateUrl = url;
  console.log('>>>>>url', updateUrl);

  const returnParams = {
    serviceStatus: serviceStatus_Text[serviceStatus],
    ratePlanName: UTIL.GetParameterValue(event, 'ratePlanName'),
    accountNo,
    billCreditLimit: UTIL.GetParameterValue(event, 'billCreditLimit'),
    billCurrentCharges: UTIL.GetParameterValue(event, 'billCurrentCharges'),
    billOverdueCharge: UTIL.GetParameterValue(event, 'billOverdueCharge'),
    totalUnbilledAmount: UTIL.GetParameterValue(event, 'totalUnbilledAmount'),
    billAmountDue: UTIL.GetParameterValue(event, 'billAmountDue'),

    lastPaymentAmount: UTIL.GetParameterValue(event, 'lastPaymentAmount'),
    billDueDate: UTIL.GetParameterValue(event, 'billDueDate'),
    lastPaymentDate: UTIL.GetParameterValue(event, 'lastPaymentDate'),
    paymentMethod: UTIL.GetParameterValue(event, 'paymentMethod'),

    msisdn: UTIL.ToMobileNumber(msisdn),
    deviceName,
    contractType,
    contractStartDate: UTIL.ToDD_MM_YY(contractStartDate),
    contractEndDate: UTIL.ToDD_MM_YY(contractEndDate),
    contractDuration,
    contractTypeText,
    durationLeft: UTIL.GetDateDiffInMonths(new Date(contractEndDate), new Date()),
    earlyTerminationFee,
    urlMessage,
  };

  if (entryPlan !== '-' || entryPlan !== '') {
    returnParams.entryPlan = entryPlan;
  }

  if (contractType === 'Zerolution360') {
    returnParams.extendedDate = UTIL.ToDD_MM_YY(extendedDate);
  }
  if (penData.hasDeviceContract === false) {
    returnParams.msisdn = null;
    returnParams.deviceName = null;
    returnParams.contractTypeText = null;
    returnParams.contractStartDate = null;
    returnParams.contractEndDate = null;
    returnParams.extendedDate = null;
    returnParams.entryPlan = null;
    returnParams.earlyTerminationFee = null;
  }
  returnParams.url = updateUrl;
  returnParams.urlMessage = urlMessage;


  console.log('event>>>>>>>>>>', event);
  console.log('event.outputContexts>>>>>>>>>>', event.queryResult.outputContexts);
  console.log('EventName', followUpEvent, JSON.stringify(returnParams));
  console.log('Parameters', returnParams);

  return UTIL.ComposeResult('', followUpEvent, returnParams);

};
