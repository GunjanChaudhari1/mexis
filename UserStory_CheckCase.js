const UTIL = require("./Util");
const HOST = require("./Handler_Host");
const SESSION = require('./Handler_Session');


async function getCase(msisdn) {
  let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/?conditionType=OPEN&numMonth=2`;
  let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

  let data = await UTIL.GetUrl(url,head);
  return data.responseData;
}

async function getCheckCpeStatus(msisdn) {
  let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checkcpestatus?conditionType=OPEN&numMonth=3`;
  let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

  let data = await UTIL.GetUrl(url,head);
  return data = data.responseData;
}

async function getCheckInetStatus(msisdn) {
  let url  = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checkinetstatus?conditionType=OPEN&numMonth=3`;
  let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

  let data = await UTIL.GetUrl(url,head);
  return data = data.responseData;
}

async function getCheckTputStat(msisdn) {
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checktputstat?conditionType=OPEN&numMonth=3`;
  let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

  let data = await UTIL.GetUrl(url,head);
  return data = data.responseData;
}

async function getCheckWifiStat(msisdn) {
  let url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/checkwifistat?conditionType=OPEN&numMonth=3`;
  let head = { headers: {"channel" : "MAXBOT", "languagecode":"en-US","msisdn": msisdn} };

  let data = await UTIL.GetUrl(url,head);
  return data = data.responseData;
}

async function populateCaseList(dataObject) {
  let arrayVar = [];

  for (let i=0; i < dataObject.length; i++ ) {
    let caseId  = dataObject[i].caseId;
    let dated = UTIL.ToDD_MMM_YY(dataObject[i].creationDate);
    let _msisdn = UTIL.ToMobileNumber(dataObject[i].msisdn);
    let desc = await UTIL.CaseType(dataObject[i].title);
    //  let status = dataObject[i].status;
    let { status } = dataObject[i];

    arrayVar.push(`Case ID: ${caseId.toString().replace(" ","")}, Dated: ${dated} for ${_msisdn}\n${desc}\nStatus: ${status}\n`);
  }

  return arrayVar;
}

async function getAccounts(msisdn) {
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/accounts?checkfssp=true&checkroaming=true`;
  let head = {"headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT"}};

  let data = await UTIL.GetUrl(url,head);
  data = data.responseData;
  return data;
}

exports.Start = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  //------------------------------------------------------------------------------
  // 🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
  let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
  if (redirectToEvent != undefined) return UTIL.ComposeResult("", redirectToEvent);
  //-------------------------------------------------------------------------------
  Cache = await SESSION.GetCache(sessionID);

  console.log("******CheckCase******", JSON.stringify(Cache));
  if (Cache['customerData']['responseData'] == null && !Cache["MaxisNakedFiber"]) {
    // return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    return UTIL.ComposeResult("","Authentication_OLO_Multichannel");
  }

  if (Cache["MaxisNakedFiber"] == "Olo") {
    return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
  }

  msisdn = await SESSION.GetMSISDN(sessionID);

  let accData = '';

  if (Cache.customerData.responseData == null) {
    accData = Cache.getCustomerforNRICPassport.responseData;
    const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
    if (serviceId.length !== 0) {
      msisdn = serviceId[0].serviceId;
    } else {
      msisdn = accData.accounts[0].msisdns[0].serviceId;
    }
  }

  return new Promise((resolve) => {
    // const delay = (milliseconds) => new Promise((resolves) => setTimeout(resolves, milliseconds));
    const delay = (milliseconds) => new Promise((resolves) => {setTimeout(resolves, milliseconds)});
    delay(2000)
      .then(async () => await SESSION.GetCache(sessionID))
      .then(async () => {
      // .then(async (Cache) => {
        Cache = await SESSION.GetCache(sessionID);
        // let casData = await getCase(msisdn);
        let casData = Cache["caseData"];
        console.log(" Cache111 casData Data >> ", casData);

        // casData.caseList = casData.caseList.filter(e=>e.status != "Closed");
        let caseListA = casData.caseList.filter(e=>e.status != "Closed" && e.msisdn == msisdn);
        let caseListB = casData.caseList.filter(e=>e.status != "Closed" && e.msisdn != msisdn);

        if (caseListA.length == 0) {
          resolve(UTIL.ComposeResult("","CaseStatus_NoCase"));
        } else {
          let casHfsbList = [];

          // let cpeData = await getCheckCpeStatus(msisdn);
          // let ineData = await getCheckInetStatus(msisdn);
          // let tpuData = await getCheckTputStat(msisdn);
          // let wifData = await getCheckWifiStat(msisdn);
          Cache = await SESSION.GetCache(sessionID);
          //   let cpeData = Cache["cpeData"];
          //   let ineData = Cache["ineData"];
          //   let tpuData = Cache["tpuData"];
          //   let wifData = Cache["wifData"];
          let {cpeData} = Cache;
          let {ineData} = Cache;
          let {tpuData} = Cache;
          let {wifData} = Cache;

          console.log(" Cache111 cpeData Data >> ", cpeData);
          console.log(" Cache111 ineData Data >> ", ineData);
          console.log(" Cache111 tpuData Data >> ", tpuData);
          console.log(" Cache111 wifData Data >> ", wifData);

          casHfsbList = casHfsbList.concat(await populateCaseList(cpeData.caseList));
          casHfsbList = casHfsbList.concat(await populateCaseList(ineData.caseList));
          casHfsbList = casHfsbList.concat(await populateCaseList(tpuData.caseList));
          casHfsbList = casHfsbList.concat(await populateCaseList(wifData.caseList));

          checkCaseHfsbList = casHfsbList.join("\n");

          console.log("checkCaseHfsbList 👉" + checkCaseHfsbList);

          if (casHfsbList.length == 0) {
            caseListA = await populateCaseList(caseListA);
            caseListB = await populateCaseList(caseListB);

            resolve(UTIL.ComposeResult("","CaseStatus_Details_NonFibre",{"checkCaseList" : caseListA.join("\n"), "checkCaseListNonMsisdn" : caseListB.join("\n")}));
          } else {
            Cache = await SESSION.GetCache(sessionID);
            // let accData = await getAccounts(msisdn);
            accData = Cache["accData"];
            // { accData } = Cache;
            console.log(" Cache111 accData Data >> ", accData);
            let fsub = accData.modemNo;

            if (fsub == "" || fsub == undefined) {
              resolve(UTIL.ComposeResult("","CaseStatus_Details_NonFibre",{"checkCaseList" : checkCaseHfsbList}));
            } else {
              resolve(UTIL.ComposeResult("","CaseStatus_DetailsFibre",{"checkCaseList" : checkCaseHfsbList}));
            }
          }
        }
      }).catch((e) => {
        console.log('ðŸ”»This is the error --->', e);
        // resolve(UTIL.ComposeResult("","Shared_Tech_IssueServicing"));
      });
  });

  // try
  // {
  //         Cache = await SESSION.GetCache(sessionID);
  //         // let casData = await getCase(msisdn);
  //         let casData = Cache["caseData"];
  //         console.log(" Cache111 casData Data >> ", casData);

  //         //casData.caseList = casData.caseList.filter(e=>e.status != "Closed");
  //         let caseListA = casData.caseList.filter(e=>e.status != "Closed" && e.msisdn == msisdn);
  //         let caseListB = casData.caseList.filter(e=>e.status != "Closed" && e.msisdn != msisdn);

  //         if (caseListA.length == 0)
  //         {
  //                 return UTIL.ComposeResult("","CaseStatus_NoCase");
  //         }
  //         else
  //         {
  //                 let casHfsbList = [];

  //                 // let cpeData = await getCheckCpeStatus(msisdn);
  //                 // let ineData = await getCheckInetStatus(msisdn);
  //                 // let tpuData = await getCheckTputStat(msisdn);
  //                 // let wifData = await getCheckWifiStat(msisdn);
  //                 Cache = await SESSION.GetCache(sessionID);
  //                 let cpeData = Cache["cpeData"];
  //                 let ineData = Cache["ineData"];
  //                 let tpuData = Cache["tpuData"];
  //                 let wifData = Cache["wifData"];

  //                 console.log(" Cache111 cpeData Data >> ", cpeData);
  //                 console.log(" Cache111 ineData Data >> ", ineData);
  //                 console.log(" Cache111 tpuData Data >> ", tpuData);
  //                 console.log(" Cache111 wifData Data >> ", wifData);

  //                 casHfsbList = casHfsbList.concat(await populateCaseList(cpeData.caseList));
  //                 casHfsbList = casHfsbList.concat(await populateCaseList(ineData.caseList));
  //                 casHfsbList = casHfsbList.concat(await populateCaseList(tpuData.caseList));
  //                 casHfsbList = casHfsbList.concat(await populateCaseList(wifData.caseList));

  //                 checkCaseHfsbList = casHfsbList.join("\n");

  //                 console.log("checkCaseHfsbList 👉" + checkCaseHfsbList);

  //                 if (casHfsbList.length == 0)
  //                 {
  //                         caseListA = await populateCaseList(caseListA);
  //                         caseListB = await populateCaseList(caseListB);

  //                         return UTIL.ComposeResult("","CaseStatus_Details_NonFibre",{"checkCaseList" : caseListA.join("\n"), "checkCaseListNonMsisdn" : caseListB.join("\n")});
  //                 }
  //                 else
  //                 {
  //                         Cache = await SESSION.GetCache(sessionID);
  //                         // let accData = await getAccounts(msisdn);
  //                         let accData = Cache["accData"];
  //                         console.log(" Cache111 accData Data >> ", accData);
  //                         let fsub    = accData.modemNo;

  //                         if (fsub == "" || fsub == undefined)
  //                         {
  //                                 return UTIL.ComposeResult("","CaseStatus_Details_NonFibre",{"checkCaseList" : checkCaseHfsbList});
  //                         }
  //                         else
  //                         {
  //                                 return UTIL.ComposeResult("","CaseStatus_DetailsFibre",{"checkCaseList" : checkCaseHfsbList});
  //                         }
  //                 }
  //         }
  // }
  // catch
  // {
  //         return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
  // }


};
