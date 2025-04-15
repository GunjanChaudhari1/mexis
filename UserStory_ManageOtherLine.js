const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

function getValidSubscriptionList(msisdns) {
  const excludePlans = [
    "MaxisONE Prime 4G Backup",
    "Mobile New Standard Plan",
    "New Standard Plan",
    "Maxis 4G Backup",
    "Maxis Family Plan Fibre 800Mbps",
    "Maxis Fibre - Voice",
    "Maxis Family Plan Fibre 4G Backup",
  ];

  let validSubscriptionList = msisdns
    .filter((m) => m.status == "active")
    .filter((m) => !excludePlans.includes(m.plan.name));

  console.log("🐛 Filtered SubscriptionList", validSubscriptionList);
  return validSubscriptionList;
}

async function getCustomerByAccId(accountId) {
  let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
  let head = {
    headers: {
      "Content-Type": "application/json",
      maxis_channel_type: "MAXBOT",
      languageid: "en-US",
    },
    method: "POST",
    body: JSON.stringify({
      searchtype: "ACCOUNT",
      searchvalue: accountId,
      prinSuppValue: "",
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

  let data = await UTIL.GetUrl(url, head);
  return data.responseData;
}

// Retrives subscription lines under umbrella NRIC
exports.Manage_OtherLine_Start = async function (event) {
  console.log(`Manage Other Line | START : ${JSON.stringify(event)}`);
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);

  try {
    //------------------------------------------------------------------------------
    //🔐EXECUTE AUTHENTICATION
    //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event, msisdn, sessionID);
    if (redirectToEvent != undefined)
      return UTIL.ComposeResult("", redirectToEvent);
    //-------------------------------------------------------------------------------

    let customerType = await SESSION.GetCustomerType(sessionID);
    console.log("👨 Customer Type ", customerType, customerType.accType);

    if (customerType.accType === "Principal") {
      return UTIL.ComposeResult("", "Manage_OtherLine_Principal_Yes");
    } else {
      return UTIL.ComposeResult("", "Manage_OtherLine_Principal_No");
    }
  } catch (error) {
    console.log("Error Handling flow is triggered!!! ", error);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }

  // TODO: Get the subscription list of lines from cache for primary msisdn
  // TODO: if no cache, call the customer api
  // TODO: Store response in cache,
  // TODO: Else not principle, redirect to not principle intent
};

exports.Manage_OtherLine_Principal_Yes = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let Cache = await SESSION.GetCache(sessionID);
  let customerData = Cache["customerData"];
  let subscriptionList;
  let returnEvent;

  try {
    if (!customerData) {
      // Call Api to retrive the data and store in cache
      // Need to do the async call
      return UTIL.ComposeResult("In progress to fetch the customer");
    } else {
      subscriptionList = getValidSubscriptionList(
        customerData.responseData.accounts[0].msisdns
      );
      Cache["AccountNo"] = customerData.responseData.accounts[0].accountNo;
      Cache["subscriptionList"] = subscriptionList;
      if (subscriptionList.length > 1) {
        returnEvent = "Manage_OtherLine_Check_Last6Digit_NRIC";
      } else {
        returnEvent = "less than 1 intent";
      }

      await SESSION.SetCache(sessionID, Cache);
      console.log("Saved in cache ---- > ", Cache);
      return UTIL.ComposeResult("", returnEvent);
    }
  } catch (error) {
    console.log("Error Handling flow is triggered!!! ", error);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
  // TODO: if more than 1 line exist redirect to promopt last 6 digit nric intent
  // TODO: else prompt to no line intent redirection
};

exports.Manage_OtherLine_Check_Last6Digit_NRIC = async function (event) {
  console.log(
    `Other Line | verifyLast6DigitNric | START : ${JSON.stringify(event)}`
  );
  // Check NRIC/PassPortNo in Cache
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  let nric6digit = UTIL.GetParameterValue(event, "nric6digit");
  console.log(
    `Other Line | verifyLast6DigitNric | user input nric : ${nric6digit}`
  );
  let fullNric = "";
  let cusData;
  let subscriptionList = Cache["subscriptionList"];
  console.log("This the cacheee ---- > ", Cache);
  try {
    if (!Cache["getCustomerforNRICPassport"]) {
      fullNric = Cache["getCustomerforNRICPassport"];
    } else {
      cusData = await getCustomerByAccId(Cache["AccountNo"]);
      Cache["getCustomerforNRICPassport"] =
        cusData["customer"]["documentNumber"];
      await SESSION.SetCache(sessionID, Cache);
      fullNric = cusData["customer"]["documentNumber"];
    }
    console.log(
      `Other Line | verifyLast6DigitNric | fullNric from CRM : ${fullNric}`
    );
    let last6digit = fullNric.slice(fullNric.length - 6);
    if (last6digit == nric6digit) {
      const subscriptionMSISDNS = UTIL.GetNumberedMenu(
        subscriptionList.map((m) => m.serviceId)
      );
      console.log("Other Line | verifyLast6DigitNric | NRIC match");
      // Need to pass the list of subscription as param to the intent
      return UTIL.ComposeResult("", "Manage_OtherLine_Selection", {
        subscriptionMSISDNS,
      });
    } else {
      // NRIC not Match
      console.log(
        `Other Line | verifyLast6DigitNric | NRIC not match : ${fullNric}`
      );
      return UTIL.ComposeResult(
        "",
        "Billing_PayBill_Terminated_CheckNric_Retry"
      );
    }
  } catch (error) {
    console.log("Error Handling flow is triggered!!! ", error);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
  // TODO: Check NRIC with primary msisdn from cache
  // TODO: Call api if no data in cache, and store the response in cache
  // TODO: If success, redirect to success intent
  // TODO: Else, redicrect to incorrect NRIC intent
};

exports.Manage_OtherLine_Switch_MSISDN = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let Cache = await SESSION.GetCache(sessionID);
  let subscriptionList = Cache["subscriptionList"];

  try {
    let subscriptionSelection = UTIL.GetParameterValue(
      event,
      "subscriptionSelection"
    );
    subscriptionList = parseInt(subscriptionList) - 1;
    let subscriptionMSISDNS = subscriptionList.map((m) => m.serviceId);
    console.log(
      "This is the subscription selection ----- >",
      subscriptionSelection
    );
    console.log(
      "This is the subscription subscriptionMSISDNS ----- >",
      subscriptionMSISDNS
    );

    const selectedMSISDN = subscriptionMSISDNS[subscriptionList];

    console.log("🐛 selectedMSISDN Detail => ", selectedMSISDN);

    await SESSION.SetMSISDN(sessionID, selectedMSISDN);
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }
    console.log(`this is the captured msisdn -> ${msisdn}`);
    return UTIL.ComposeResult("", "redirect to success intent");
  } catch (error) {
    console.log("Error Handling flow is triggered!!! ", error);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
  // TODO: Get the user chosen msisdn option and find from the sent cache response
  // TODO: Update the msisdn with the chosen msisdn
  // TODO: Redirect the user to the success switch intent
  // TODO: Else redirect to tech error (since the chosen option cant go wrong, unless invalid input. It will be handled at df)
};
