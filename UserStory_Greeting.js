const UTIL = require("./Util")
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

async function getCustomer(msisdn, sessionID) {
  let CustomerType = await SESSION.GetCustomerType(sessionID);
  console.log("customer type fetched from session ", CustomerType);

  if (CustomerType == undefined || Object.keys(CustomerType).length == 0 || (CustomerType.subType=="" && CustomerType.accType=="")) {
    let url = `${HOST.CUSTOMER[HOST.TARGET]}/customer/api/v4.0/customer/query2`;
    let head = {
      headers: { "Content-Type": "application/json", "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
      method: "POST",
      body: JSON.stringify({
        "searchtype": "MSISDN",
        "searchvalue": msisdn,
        "prinSuppValue": "",
        "isGetSupplementary": false,
        "isPrincipalPlanName": false,
        "isLookupAllAccount": false,
        "isIndividual": 1,
        "isSubscription": true,
        "isIncludeOfferingConfig": false,
        "isCustomerProfile": false,
        "familyType": false
      })
    };

    try {
      console.log(`get url data header before get url${head}, sessionID${sessionID}, msisdn${msisdn}`);
      let data = await UTIL.GetUrl(url, head, msisdn, sessionID);
      console.log("*********data api*****", data);
      data = data.responseData;
      if (data != null && Object.keys(data).length > 0) {
        let isSuspended = data.accounts[0].msisdns.filter(x => x.serviceId == msisdn)[0].status == "suspended";
        let subType = data.accounts[0].subType;
        let accType = data.accounts[0].msisdns.filter(x => x.serviceId == msisdn)[0].plan.prinSuppIndicator;
        let cusType = data.accounts[0].type;
        let planName = data.accounts[0].msisdns.filter(x => x.serviceId == msisdn)[0].plan.name;
        let accountStatus = data.accounts[0].status;
        let accountNo = data.accounts[0].accountNo;
        let CRMName = data.customer.name;

        CustomerType = { "subType": subType, "accType": accType, "cusType": cusType, "planName": planName, "status": accountStatus, "accountNo": accountNo, "isSuspended": isSuspended, "CRMName": CRMName };
        console.log("Customer found in CRM ", CustomerType);
      } else {
        console.log("Customer not found");
        CustomerType = { "subType": "", "accType": "", "cusType": "", "planName": "", "status": "", "isSuspended": false, "CRMName": "" };
        console.log(CustomerType);
      }

      await SESSION.SetCustomerType(sessionID, CustomerType);
    } catch (err) {
      console.log("Customer Info Error 🔻---->", err);
    }
  }

  return CustomerType;
}

function FiveDotFiveHelper(queryText) {
  let result = {};

  let cleanText = queryText.replace(/\n/g, '')
  if (/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5} \[.+\].+$/.test(cleanText)) {
    // result["dealerCode"] = queryText.match(/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5}/)[0]; // dealerCode
    // result["campaignName"] = queryText.match(/\[.+\]/)[0]; // campaign

    const dealerCodeTemp = queryText.match(/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5}/)[0]; // dealerCode
    result["dealerCode"] = dealerCodeTemp;
    const campaignNameTemp = queryText.match(/\[.+\]/)[0]; // campaign
    result["campaignName"] = campaignNameTemp; // campaign
    result["campaignTitle"] = queryText.split(']')[1].trim(); // text
  }

  return result;
}

async function nameFilter(UserProfileName) {
  const specialChars = /[@]/;
  if (specialChars.test(UserProfileName)) {
    console.log("if part working***********");
    let spilt_name = UserProfileName.split('@')
    // UserProfileName =spilt_name[0];
    const UserProfileNameTemp =spilt_name[0];
    UserProfileName = UserProfileNameTemp;
    console.log("if part working for @***********", UserProfileName);
    UserProfileName = UserProfileName.trim();
    let constantArray= ['Bin', 'Binti', 'Bt', 'A/L', 'A/P', 'D/O', 'S/O', '@']
    let x = UserProfileName.split(" ")

    let flag1;
    let flag2;
    for (let i=0;i<constantArray.length;i++) {
      flag1 = x.findIndex((searchItem)=>{
        if (searchItem.toLocaleLowerCase()==constantArray[i].toLocaleLowerCase()) {
          return searchItem.toLocaleLowerCase()==constantArray[i].toLocaleLowerCase();
        }
        // else {
        //   flag1=-1
        // }
      });
      if(flag1>-1) {
        flag2=flag1;
        break;
      };
    }
    let name='';
    for(let j =0;j<flag1;j++) {
      if(j==0) {
        name=name+x[j]
      } else {
        name=name+" "+x[j]
      }
    }
    console.log(name);
    if(name) {
      UserProfileName=name.trim();
    } else {
      UserProfileName=UserProfileName.trim();
    }
    console.log("name return here s/o***", UserProfileName);

    return UserProfileName;
  } else {
    console.log("else");
    let constantArray= ['Bin', 'Binti', 'Bt', 'A/L', 'A/P', 'D/O', 'S/O', '@']
    let x = UserProfileName.split(" ")

    let flag1;
    let flag2;
    for(let i=0;i<constantArray.length;i++) {
      flag1 = x.findIndex((searchItem)=>{
        if(searchItem.toLocaleLowerCase()==constantArray[i].toLocaleLowerCase()) {
          return searchItem.toLocaleLowerCase()==constantArray[i].toLocaleLowerCase()
        }
        // else {
        //   flag1=-1
        // }
      });
      if(flag1>-1) {
        flag2=flag1;
        break;
      };
    }
    let name='';
    for(let j =0;j<flag1;j++) {
      if(j==0) {
        name=name+x[j]
      } else {
        name=name+" "+x[j]
      }
    }
    console.log(name);
    if(name) {
      UserProfileName=name.trim();
    } else {
      UserProfileName=UserProfileName.trim();
    }
    console.log("name return here s/o***", UserProfileName);
    return UserProfileName;
  }
}

exports.Greeting_Start1 = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  console.log("msisdn************",msisdn);
  let CustomerType = await getCustomer(msisdn, sessionID);
  console.log("CustomerType******", JSON.stringify(CustomerType));
  let Cache = await SESSION.GetCache(sessionID);
  let dealerObj = FiveDotFiveHelper(event.queryResult.queryText);
  let UserProfileName =Cache['displayNameChannel'];
  let IsAuth = await SESSION.GetIsAuthenticated(sessionID)
  if (Cache['getChannelName']=='whats_app') {
    if (CustomerType.accType == "Supplementary") {
      console.log("****************[Supplementary]**********************");
      UserProfileName = Cache['displayNameChannel'];
    } else {
      console.log("****************[CRM]**********************", CustomerType['CRMName']);
      if (CustomerType['CRMName'] != "") {
        console.log("****************[CRM defined]**********************");
        UserProfileName = CustomerType['CRMName']
      } else {
        console.log("****************[CRM undefined]**********************");
        UserProfileName = Cache['displayNameChannel'];
        console.log("****************[CRM undefined]**********************");
      }
    }
  } else {
    console.log("social media***********");
    UserProfileName = Cache['displayNameChannel'];
  }

  console.log("UserProfileName last ----> before", UserProfileName, Cache.displayNameChannel)
  if (UserProfileName==undefined) {
    // UserProfileName=UserProfileName;
    console.log('UserProfileName : ', UserProfileName);
  } else {
    UserProfileName= await nameFilter(UserProfileName);
  }

  console.log("UserProfileName last ----> after", UserProfileName, Cache.displayNameChannel)

  if (/^[A-Za-z0-9\s]*$/.test(UserProfileName)) {
    if (/^[0-9\s]*$/.test(UserProfileName)) {
      UserProfileName = "Hi"
    } else {
      console.log("Greeting_Start1 ")
      if(UserProfileName==undefined) {
        UserProfileName = "Hi"
      } else {
        let trimSpace = UserProfileName.trim();
        UserProfileName = `Hi ${trimSpace}`
      }
    }
  } else {
    UserProfileName = "Hi"
  }
  console.log("UserProfileName last After regx---->", UserProfileName)

  if (Object.keys(dealerObj).length > 0) {
    console.log("ðŸ‘‰ Dealer Net Detected! Stored in Session")

    Cache["dealerObj"] = dealerObj;
    console.log("**********************sessionID*******************", sessionID);
    await SESSION.SetCache(sessionID, Cache);
  }
  console.log("********!!!!IsAuth",IsAuth);
  if (IsAuth===false) {
    console.log("Name filtered false********", UserProfileName);
    let menuAppearSession = await SESSION.getMenuAppear(sessionID)
    console.log("menuAppearSession************", menuAppearSession)
    if (menuAppearSession==true) {
      console.log("menuAppearSession************ true", menuAppearSession)
      return UTIL.ComposeResult("", "greetings_commonMenu", { 'name': UserProfileName });
    } else {
      console.log("menuAppearSession************ false", menuAppearSession)
      return UTIL.ComposeResult("", "greetings_commonMenu_displayName", { 'name': UserProfileName });
    }
  } else if (IsAuth===true) {
    let followUpEvent="";
    try {
      console.log("*********[true working fine]******************");
      if (CustomerType.accType == "Principal") {
        console.log("*********[true working fine Principal]******************");
        followUpEvent = "greetings_mainMenu_Maxis";
      } else if (CustomerType.accType == "Supplementary") {
        console.log("*********[true working fine Supplementary]******************");
        followUpEvent = "greetings_mainMenu_supplementary"
      } else if (CustomerType.subType == "Dealer") { // "main_menu_maxis_supplementary";
        console.log("*********[true working fine Dealer]******************");
        followUpEvent = "main_menu_olo1";
      } else if (CustomerType.isSuspended) {
        console.log("*********[true working fine suspended]******************");
        followUpEvent = "main_menu_olo1";
      } else if (CustomerType.subType == "Individual") {
        console.log("*********[true working fine Individual]******************");
        if (CustomerType.cusType == "Consumer") {
          followUpEvent = "greetings_mainMenu_hotlinkprepaid";
          console.log("*********[true working fine Consumer]******************");
        } else {
          console.log("*********[true working fine olo1]******************");
          followUpEvent = "main_menu_olo1";
        }
        // else if (CustomerType.subType == "Maxis Individual") {
        //   console.log("*********[true working fine Maxis Individuall]******************");
        //   if (CustomerType.cusType == "Consumer") {
        //     followUpEvent = "greetings_mainMenu_hotlinkprepaid";
        //     console.log("*********[true working fine Consumer]******************");
        //   } else {
        //     console.log("*********[true working fine olo1]******************");
        //     followUpEvent = "main_menu_olo1";
        //   }
        // } 
      } else if (Cache["MaxisNakedFiber"] && Cache["MaxisNakedFiber"] == "NF") {
        return UTIL.ComposeResult("", "greetings_mainMenu_NakedFiber");
      } else if (Cache["MaxisNakedFiber"] && Cache["MaxisNakedFiber"] == "Olo") {
        return UTIL.ComposeResult("", "main_menu_olo1");
      } else {
        console.log("*********[true working fine olo2]******************");
        followUpEvent = "main_menu_olo1";
      }
    } catch {
      console.log("*********[true working fine olo3]******************");
      followUpEvent = "main_menu_olo1";
    }
    console.log("followUpEvent>>>>>",followUpEvent);
    if(followUpEvent == "main_menu_olo1") {
      if(Cache["MaxisNakedFiber"] && Cache["MaxisNakedFiber"] == "NF") {
        return UTIL.ComposeResult("", "greetings_mainMenu_NakedFiber");
      } else if(Cache["MaxisNakedFiber"] && Cache["MaxisNakedFiber"] == "Olo") {
        return UTIL.ComposeResult("", "main_menu_olo1");
      } else {
        return UTIL.ComposeResult("", "Authentication_OLO_Multichannel");
      }
    } else {
      console.log("Name filtered true ********", UserProfileName);
      return UTIL.ComposeResult("", followUpEvent, { 'name': UserProfileName });
    }
  } else {
    console.log("Name filtered else ********", UserProfileName);
    let menuAppearSession = await SESSION.getMenuAppear(sessionID)
    console.log("menuAppearSession************1", menuAppearSession)

    if(menuAppearSession==true) {
      console.log("menuAppearSession************ true1", menuAppearSession)
      return UTIL.ComposeResult("", "greetings_commonMenu", { 'name': UserProfileName });
    } else {
      console.log("menuAppearSession************ false1", menuAppearSession)
      return UTIL.ComposeResult("", "greetings_commonMenu_displayName", { 'name': UserProfileName });
    }
    // return UTIL.ComposeResult("", "greetings_commonMenu", { 'name': UserProfileName });
  };
}

exports.Greet = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let displayName = await SESSION.GetDisplayName(sessionID);
  let CustomerType = await getCustomer(msisdn, sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  // DealerNet 5DOT5 --------------------------------------------------
  let dealerObj = FiveDotFiveHelper(event.queryResult.queryText);
  let UserProfileName = Cache['displayNameChannel'];
  if (/^[A-Za-z0-9\s]*$/.test(UserProfileName)) {
    UserProfileName = `Hi ${Cache['displayNameChannel']}`
  } else {
    UserProfileName = "Hi"
  }
  if (Object.keys(dealerObj).length > 0) {
    console.log("ðŸ‘‰ Dealer Net Detected! Stored in Session")

    Cache["dealerObj"] = dealerObj;
    console.log("**********************sessionID*******************", sessionID);
    await SESSION.SetCache(sessionID, Cache);
  }
  //------------------------------------------------------------------

  if (displayName == "") {
    return UTIL.ComposeResult("", "Shared_Profile_DisplayName", { 'name': UserProfileName });
  } else {
    let followUpEvent = "main_menu_olo_DisplayName";
    if (Cache['getChannelName'] == 'whats_app') {
      console.log("********************** [if What's app channel]**********************")
      try {
        if (CustomerType.accType == "Principal") followUpEvent = "Greeting_MainMenu_DisplayName";
        if (CustomerType.accType == "Supplementary") followUpEvent = "main_menu_maxis_supplementary";
        if (CustomerType.subType == "Dealer") followUpEvent = "main_menu_olo_DisplayName";
        if (CustomerType.isSuspended) followUpEvent = "main_menu_olo_DisplayName";
        if (CustomerType.subType == "Individual") {
          if (CustomerType.cusType == "Consumer") {
            followUpEvent = "main_menu_prepaid_DisplayName";
          } else {
            followUpEvent = "main_menu_olo_DisplayName";
          }
        }
      } catch {
        followUpEvent = "main_menu_olo_DisplayName";
      }
    } else {
      console.log("**********************[other channel apart from whats app]**********************")
      followUpEvent = "main_menu_olo_DisplayName";
    }

    // ðŸ‘‡display name is an object, eg { name: 'Jivan' } for PERSON datatype, however dialogflow KNOWS
    //  how to handle this object, so there's no need to use the NAME key.

    console.log("Name filtered ********", UserProfileName);
    return UTIL.ComposeResult("", followUpEvent, { 'name': UserProfileName });
  }
}

exports.SetProfile = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let CustomerType = await getCustomer(msisdn, sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  let displayName = UTIL.GetParameterValue(event, "displayName");
  await SESSION.SetProfile(sessionID, displayName);
  let UserProfileName= "";
  let followUpEvent = "main_menu_olo_DisplayName";

  try {
    if(Cache['getChannelName']=='whats_app') {
      if (CustomerType.accType == "Principal") {
        console.log("****************[Principal]**********************");
        if (CustomerType['CRMName'] != "" || CustomerType['CRMName'] != undefined) {
          console.log("****************[Principal if]**********************");
          UserProfileName = CustomerType['CRMName']
        } else {
          console.log("****************[Principal else]**********************");
          UserProfileName = Cache['displayNameChannel'];
        }
        followUpEvent = "Greeting_MainMenu_DisplayName";
      }
      if (CustomerType.accType == "Supplementary") {
        console.log("****************[Supplementary]**********************");
        UserProfileName = Cache['displayNameChannel'];
        followUpEvent = "main_menu_maxis_supplementary_DisplayName";
      }
      if (CustomerType.subType == "Individual") {
        if (CustomerType.cusType == "Consumer") {
          console.log("****************[prepaid]**********************");
          if (CustomerType['CRMName'] != "" || CustomerType['CRMName'] != undefined) {
            UserProfileName = CustomerType['CRMName']
          } else {
            console.log("****************[OLO 3]**********************");
            UserProfileName = Cache['displayNameChannel'];
          }
          followUpEvent = "main_menu_prepaid_DisplayName";
        } else {
          UserProfileName = Cache['displayNameChannel'];
          followUpEvent = "main_menu_olo_DisplayName";
        }
      } else {
        UserProfileName = Cache['displayNameChannel'];
        followUpEvent = "main_menu_olo_DisplayName";
      }
    } else{
      UserProfileName = Cache['displayNameChannel'];
      followUpEvent = "main_menu_olo_DisplayName";
    }
  } catch {
    UserProfileName = Cache['displayNameChannel'];
    followUpEvent = "main_menu_olo_DisplayName";
  }
  UserProfileName = Cache['displayNameChannel'];
  if (/^[A-Za-z0-9\s]*$/.test(UserProfileName)) {
    UserProfileName = `Hi ${UserProfileName}`
  } else {
    UserProfileName = "Hi"
  }
  return UTIL.ComposeResult("", followUpEvent, { "name": UserProfileName });
}

exports.Greeting_ManageMyProfile = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  console.log("calling first Greeting_ManageMyProfile********");
  try {
    //------------------------------------------------------------------------------
  // 🔐EXECUTE AUTHENTICATION
  //------------------------------------------------------------------------------
    let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
    if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
    //-------------------------------------------------------------------------------
    let customerType = await SESSION.GetCustomerType(sessionID);
    let Cache = await SESSION.GetCache(sessionID);

    if(Cache["MaxisNakedFiber"] == "Olo") {
      return UTIL.ComposeResult("","Authentication_MenuAccessRestriction");
    }

    if(!Cache["MaxisNakedFiber"]) {
      console.log("false naked************")
      let eventReturn= await UTIL.UserVerifyProfile(customerType, "Authentication_OLO_Multichannel", 'Authentication_MenuAccessRestriction', "Greeting_ManageMyProfile")
      console.log("followUpEvent***************", eventReturn);
      return UTIL.ComposeResult("",eventReturn);
    } else{
      console.log("false true************")
      return UTIL.ComposeResult("", "Manage_profile_naked");
    }
  } catch(error) {
    console.log("[error]******", error);
  }
}