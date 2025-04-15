const UTIL = require('./Util');
const HOST = require('./Handler_Host');
const SESSION = require('./Handler_Session');
const INTENT = require('./IntentMapper');
// const { default: async } = require("async");

async function getBillsBillTax(sessionID, msisdn) {
  try {
    let apiId = HOST.TARGET == 0 ? "nx5rbzdio4" : "avezebzouc";
    let apiky = HOST.TARGET == 0 ? "XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin" : "InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr";
    let url = HOST.TARGET == 0 ? "https://maxbot-uat.maxis.com.my/dev/MaxisCallback" : "https://maxbot.maxis.com.my/prod/diagnostic";


    let head = {
      "headers": { "x-apigw-api-id": apiId, "x-api-key": apiky },
      "method": "POST",
      "body": JSON.stringify({
        "msisdn": msisdn,
        "sessionID": sessionID,
        "getBilling": "getBilling",
      })
    };
    console.log("customer API calling start");
    let data = await UTIL.GetUrl(url, head);
    console.log("customer API calling end");
    return true;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
}


function VerificationNRIC(NRICNumber) {
  let nric = /^[0-9]{12,}$/;
  // let numberpattern = NRICNumber.length;

  if (nric.test(NRICNumber)) {
    return true;
  } else {
    return false
  }
}

function VerificationPassport(Passport) {
  var passport = /^(?=.*[a-zA-Z])(?=.*[0-9])[A-Za-z0-9]{6,}$/;
  if (passport.test(Passport)) {
    console.log('Passport has been accepted');
    return true;
  } else {
    console.log('Please input alphanumeric characters only');
    return false
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
    const data = await UTIL.GetUrl(url, head);
    // console.log('customer API calling end');
    return true;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    // return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

async function getCustomerforNRICPassport(idNumber, idCard, msisdn, sessionID) {
  let Cache = await SESSION.GetCache(sessionID);
  try {
    //let Cache = await SESSION.GetCache(sessionID);
    const url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`
    const head = {
      'method': 'POST',
      'headers': {
        'maxis_channel_type': 'MAXBOT',
        'languageid': 'en-US',
        'Content-Type': 'application/json'
      },

      'body': JSON.stringify({
        'searchtype': idCard,
        'searchvalue': idNumber,
        'isGetSupplementary': true,
        'isPrincipalPlanName': true,
        'isLookupAllAccount': false,
        'isIndividual': 2,
        'isSubscription': true,
        'isIncludeOfferingConfig': false
      })

    };

    let apiData = await UTIL.GetUrl(url, head);
    let data = apiData.responseData;
   // console.log('**getCustomerforNRICPassport**', apiData);

    let CustomerType = '';
    if (data != null && Object.keys(data).length > 0) {
      let isSuspended = '';
      let accType = '';
      let planName = '';
      const { subType } = data.accounts[0];
      const cusType = data.accounts[0].type;
      const { status } = data.accounts[0];
      const { accountNo } = data.accounts[0];
      const CRMName = data.customer.name;
      CustomerType = {
        subType, accType, cusType, planName, status, accountNo, isSuspended, CRMName,
      };
      if (Cache['accountStatus'] === undefined) {
        console.log('NF user if >> ', Cache);
        let serviceId = data.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
        if (serviceId.length !== 0) {
            msisdn = serviceId[0].serviceId;
        } else {
            msisdn =  accData.accounts[0].msisdns[0].serviceId;
        }
        const bilData = await getBills(msisdn, accountNo, sessionID);
        let taxBillData = await getBillsBillTax(sessionID,msisdn);
      } else {
        console.log('NF user else >> ', Cache);
        let serviceId = data.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
        if (serviceId.length !== 0) {
            msisdn = serviceId[0].serviceId;
        } else {
            msisdn =  accData.accounts[0].msisdns[0].serviceId;
        }
        const bilData = await getBills(msisdn, accountNo, sessionID);
        let TaxBillData = await getBillsBillTax(sessionID,msisdn);

      }


    } else {
      CustomerType = {
        subType: '', accType: '', cusType: '', planName: '', status: '', isSuspended: false, CRMName: '',
      };
    }
    await SESSION.SetCustomerType(sessionID, CustomerType);
    return apiData;
  } catch (err) {
    console.log('getCustomerforNRICPassport Error', err);
  }
};

exports.OLO_authentication = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  // let IsAuthenticated = await SESSION.GetIsAuthenticated(msisdn);

  let Cache = await SESSION.GetCache(sessionID);
  try {
    let getNRICPassport = Cache.getCustomerforNRICPassport;
    // let updateCBR=Cache.UpdateCbrNRICPassport;
    let menuShown = Cache.menu;
    console.log('customer found in session or not? ', getNRICPassport);
    console.log('fibre menu shown or not? ', menuShown);
    if (getNRICPassport == undefined) {
      return UTIL.ComposeResult('', 'OLO_NRICPassportSelection');
    } else if (Object.keys(getNRICPassport).length != 0) {
      if (menuShown == undefined) {
        return UTIL.ComposeResult('', 'OLO_NRICPassportSelection');

      } else if (Object.keys(menuShown).length != 0) { return UTIL.ComposeResult('', 'main_menu_olo1'); } //navigating to an intent to display the fibre services menu for OLO

    }
  } catch (err) {
    console.log('Error handling flow is triggered');
    console.log(err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

exports.OLOAuthentication_yes_input = async function (event) {
  let NRIC = UTIL.GetParameterValue(event, 'NRIC');
  let idCard = UTIL.GetParameterValue(event, 'idCard');
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  console.log(typeof (NRIC));
  console.log('Logging NRIC', NRIC);
  try {
    if (NRIC == '*') { return UTIL.ComposeResult('', 'main_menu_olo1') }

    let result = VerificationNRIC(NRIC);
    if (result == true) {
      let cusData = await getCustomerforNRICPassport(NRIC, idCard, msisdn, sessionID);
      Cache['getCustomerforNRICPassport'] = cusData;
      await SESSION.SetCache(sessionID, Cache);
      return UTIL.ComposeResult('', 'olo_validinput', { 'idCard': idCard, 'idNumber': NRIC });
    } else if (result == false) {
      return UTIL.ComposeResult('', 'nric_invalidSelecion');
    }
  } catch (err) {
    console.log('Error handling flow is triggered');
    console.log(err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

exports.OLOAuthentication_no_Passportinput = async function (event) {
  let Passport = UTIL.GetParameterValue(event, 'Passport');
  let idCard = UTIL.GetParameterValue(event, 'idCard');
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  console.log(typeof (Passport));
  console.log('Logging Passport', Passport);
  try {
    if (Passport == '*') { return UTIL.ComposeResult('', 'main_menu_olo1') }

    let result = VerificationPassport(Passport);

    if (result == true) {
      let cusData = await getCustomerforNRICPassport(Passport, idCard, msisdn, sessionID);
      Cache['getCustomerforNRICPassport'] = cusData;
      await SESSION.SetCache(sessionID, Cache);
      return UTIL.ComposeResult('', 'olo_validinput', { 'idCard': idCard, 'idNumber': Passport });
    } else if (result == false) {
      return UTIL.ComposeResult('', 'passport_invalidSelection');
    }
  } catch (err) {
    console.log('Error handling flow is triggered');
    console.log(err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

exports.OLOAuthentication_VerifyCBR = async function (event) {
  let idCard = UTIL.GetParameterValue(event, 'idCard');
  let idNumber = UTIL.GetParameterValue(event, 'idNumber');
  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID);
    //console.log(`idCard==>${idCard}, idNumber==>${idNumber} API init`);
    let cusData = '';
    if (Cache['getCustomerforNRICPassport'] !== undefined) {
      cusData = Cache['getCustomerforNRICPassport'];
    } else {
      cusData = await getCustomerforNRICPassport(idNumber, idCard, msisdn, sessionID);
    }
    
    //console.log('** cusData **', cusData);
    try {
      let cbr = cusData.responseData.customer['cbrNumber'];
      // console.log('cbr ', cbr);
      // console.log('msisdn ', msisdn);
      // console.log(typeof (cbr));
      // console.log(typeof (msisdn));

      // added  by Arpit
      // Cache['getCustomerforNRICPassport'] = cusData
      // await SESSION.SetCache(sessionID, Cache);
      //

      // if (cbr==msisdn)
      if (String(cbr).slice(-10) === String(msisdn).slice(-10)) {
        Cache['getCustomerforNRICPassport'] = cusData
        Cache['cardNumber'] = [idCard, idNumber];
        Cache['MaxisNakedFiber'] = 'NF';
        //Cache['menu'] = 'Shown';
        await SESSION.SetCache(sessionID, Cache);
        //return UTIL.ComposeResult("","Greeting_ManageFibreService");
        //console.log('******exports.OLOAuthentication_VerifyCBR******', JSON.stringify(Cache));
        let IntentName = Cache['lastIntent'];
        console.log('******Last Intent******', IntentName);
        let Task = INTENT.Map();
        result = await Task[IntentName](event);
        //console.log("result 22 >> ", result);
        return result;
      } else {
        Cache['getCustomerforNRICPassport'] = cusData;
        await SESSION.SetCache(sessionID, Cache);
        return UTIL.ComposeResult('', 'not_matched', { 'idCard': idCard, 'idNumber': idNumber });
      }
    } catch (err) {
      console.log('Error handling flow is triggered');
      console.log(err);
      //return UTIL.ComposeResult("", "retrival_notsuccessful");
      return UTIL.ComposeResult('', 'not_matched', { 'idCard': idCard, 'idNumber': idNumber });
    }
    // }
    // else if (IsAuthenticated == true){ return UTIL.ComposeResult("","Greeting_ManageFibreService"); }
  } catch (err) {
    console.log('Error handling flow is triggered');
    console.log(err);
    //return UTIL.ComposeResult("", "retrival_notsuccessful");
    return UTIL.ComposeResult('', 'not_matched', { 'idCard': idCard, 'idNumber': idNumber });
  }
};

exports.OLO_VerifyCBRFailed_FibreAccInput = async function (event) {
  let idCard = UTIL.GetParameterValue(event, 'idCard');
  let idNumber = UTIL.GetParameterValue(event, 'idNumber');
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  let fibreAccountInput = UTIL.GetParameterValue(event, 'fibreAccountInput');
  try {
    //console.log('Cache : ', Cache)
    let acc = Cache.getCustomerforNRICPassport.responseData.accounts.filter(item => item.status == 'Open');
    //console.log('**OLO_VerifyCBRFailed_FibreAccInput**', Cache);
    //console.log('**acc Data**', acc);
    let fibreAccNumber = '';
    for (var i = 0; i < acc.length; i++) {
      let ftths = acc[i].msisdns.filter(x => x.serviceType == 'FTTH' && x.status == 'active');
      console.log(ftths.length);
      if (ftths.length > 0) {
        //console.log('ftths : ', ftths);
        fibreAccNumber = acc[i].accountNo;
        break;
      }
    }
    // console.log("acc number is : ",acc[i].accountNo);

    if (fibreAccountInput == fibreAccNumber) {
      Cache['MaxisNakedFiber'] = 'NF';
      Cache['cardNumber'] = ['ACCOUNT', fibreAccountInput];
      SESSION.SetCache(sessionID, Cache);
      //console.log('******exports.OLO_VerifyCBRFailed_FibreAccInput******', JSON.stringify(Cache));
      //return UTIL.ComposeResult("","offer_update_cbr",{"idCard":idCard,"idNumber":idNumber});
      let IntentName = Cache['lastIntent'];
      console.log('******Last Intent******', IntentName);
      let Task = INTENT.Map();
      result = await Task[IntentName](event);
      return result;
    } else {
      Cache['MaxisNakedFiber'] = 'Olo';
      SESSION.SetCache(sessionID, Cache);
      return UTIL.ComposeResult('', 'fibreAccount_no', { 'idCard': idCard, 'idNumber': idNumber });
    }
  } catch (err) {
    console.log('Error handling flow is triggered OLO VerifyCBRFailed FibreAccInput', err);
    //return UTIL.ComposeResult("", "retrival_notsuccessful");
    Cache['MaxisNakedFiber'] = 'Olo';
    SESSION.SetCache(sessionID, Cache);
    return UTIL.ComposeResult('', 'fibreAccount_no', { 'idCard': idCard, 'idNumber': idNumber });
  }
};
