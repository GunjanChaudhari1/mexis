const { parse } = require('uuid');
const { MD5 } = require('crypto-js');
// const { SES } = require("aws-sdk");
const redis = require('redis');
const UTIL = require('./Util');
const SESSION = require('./Handler_Session');
const HOST = require('./Handler_Host');
const redisCache = require('./CacheConstants');
const redisData = require('./CacheUtil');
const DF = require('./Handler_DialogFlow');
const RC = require('./Handler_RingCentral');
const { Color } = require('./UserStory_DiscoveryPurchase');

// const FALLBACK_MESSAGE_SALES = process.env.FALLBACK_MESSAGE_SALES;
const { FALLBACK_MESSAGE_SALES } = process.env;

//----------------------------------------------------------------------------------------
// ðŸ‘‡ helper functions intended for the currect usecase
//----------------------------------------------------------------------------------------
async function getmaxisPostpaidContractTabletWear(skuID) {
  const url = `${HOST.Product_wearable_tablet[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&filterPlans=MOP,TABLET`;
  const head = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
  };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    const plans = [];
    data.responseData[0].plan.map((item, index) => {
      item.contract.map((itemChild, indexChild) => {
        if (itemChild.name == 'Zerolution') {
          itemChild.tenure = parseInt(itemChild.tenure) + 1;
        }
        itemChild.name = (itemChild.name).replace('K2', 'Normal Contract');
        plans.push(`${itemChild.name} ${itemChild.tenure}-Months Contract`);
      });
    });
    return [...new Set(plans)];
  }
  return false;
}

async function lmscreateLeadRatePlansApi(msisdn, LeadCatalogID, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, IntentNameTrue, IntentNameFalse, sessionID) {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        LeadCatalogID,
        PlanType,
        SelectedPlan,
        RegisterType,
        IntentName,
        SkuSummary,
        msisdn,
        MaxisPostpaidPlansLeadCreation: 'MaxisPostpaidPlansLeadCreation',
        IntentNameTrue,
        IntentNameFalse,
        sessionID,
      }),
    };

    const data = await UTIL.GetUrl(url, head);
    return data;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

// msisdn, LeadCatalogID,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary
async function lmscreateLeadApi(msisdn, LeadCatalogID, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, IntentNameTrue, IntentNameFalse, sessionID) {
  try {
    const apiId = HOST.TARGET == 0 ? 'nx5rbzdio4' : 'avezebzouc';
    const apiky = HOST.TARGET == 0 ? 'XSi74sSunK5UBHf6dxQe84nh8vZEFNKW4onBCsin' : 'InKPNV6dSX7zXX3jJgohi9duwXcuvHfF59JDdHBr';
    const url = HOST.TARGET == 0 ? 'https://maxbot-uat.maxis.com.my/dev/MaxisCallback' : 'https://maxbot.maxis.com.my/prod/diagnostic';

    const head = {
      headers: { 'x-apigw-api-id': apiId, 'x-api-key': apiky },
      method: 'POST',
      body: JSON.stringify({
        LeadCatalogID,
        PlanType,
        SelectedPlan,
        RegisterType,
        IntentName,
        SkuSummary,
        msisdn,
        HotLinkLeadCreation: 'HotLinkLeadCreation',
        IntentNameTrue,
        IntentNameFalse,
        sessionID,
      }),
    };

    const data = await UTIL.GetUrl(url, head);
    return data;
  } catch (err) {
    console.log('Maxis callback failed with error', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
}

function TechIssueEnd() {
  return 'Shared_Tech_Issue';
}

function HotlinkTechIssueEnd() {
  return 'Shared_HotlinkPostpaid_Tech_Issue';
}

function MaxisTechIssueEnd() {
  return 'Shared_Tech_IssueServicingMaxis';
}

function AssignFallBack(param) {
  return param.fallbackMessage = FALLBACK_MESSAGE_SALES;
}

function Proper(str) {
  const newstr = str.split(' ').map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase()).join(' ');
  return newstr;
}

async function BotSalesLastEvent(sessionID) {
  return await SESSION.GetIdleLastEvent(sessionID);
}

// for getting the value using the key from redis
const client = redis.createClient({ url: process.env.REDIS_CLUSTER_URL });
client.connect();

/**
 * Api calling for bot for mvp4
 * @param {String} skuID
 * @returns array of plan[ 'K2 12-Months Contract', 'K2 24-Months Contract' ]
 */
exports.gethotlinkPostpaidContract = async function (skuID) {
  const url = `${HOST.HOTLINK_POSTPAID_DEVICES_MVP4[HOST.TARGET]}/prodcatalog/api/v4.0/device/plans?languageId=1&customerType=C&customerSubType=H&serviceType=GSM&familyType=FLEX&sku=${skuID}`;
  const head = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
  };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    const plans = [];
    data.responseData[0].plan.map((item, index) => {
      item.contract.map((itemChild, indexChild) => {
        itemChild.name = (itemChild.name).replace('K2', 'Normal Contract');
        console.log('contract..........:', itemChild.name);
        plans.push(`${itemChild.name} ${itemChild.tenure}-Months`);
      });
    });
    console.log('00000000000000000000000000000Plans------->', plans);
    return [...new Set(plans)];// k2-12-Months? Normal contract 12-Monts
  }
  return false;
};

async function getRatePlanHotlinkPostpaid(skuID, contract) {
  const url = `${HOST.HOTLINK_POSTPAID_DEVICES_MVP4[HOST.TARGET]}/prodcatalog/api/v4.0/device/plans?languageId=1&customerType=C&customerSubType=H&serviceType=GSM&familyType=FLEX&sku=${skuID}`;
  const head = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
  };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    // let plans = [];
    contract = contract.replace('Normal Contract', 'K2');
    const firstValue = contract.split(' ')[0];
    const secondValue = contract.split(' ')[1];
    const yearTenure = secondValue.split('-')[0];
    const plans = data.responseData[0].plan.map((item, index) => ({
      planName: item.name,
      planId: `${item.uxfAttributes.productSpecRelationId}_${item.uxfAttributes.billingOfferId}`,
    }));
    console.log('plans', JSON.stringify(plans));
    return plans;
  }
  return false;
}

/**
 *
 * @param {String} skuID
 * @returns true if data avaliable, false if data is not avaliable
 */
exports.getStockavailabiltiyhotlinkPostpaid = async function (skuID) {
  try {
    const url = `${HOST.HOTLINK_STOCK_AVAILABILITY[HOST.TARGET]}/offline/api/v1.0/inventories/PJ07/${skuID}?senderId=MC&source=SAP&type=shipping&isStockPickupRealTime=false`;
    console.log('url>>>>>>>>>>>>.', url);
    const head = {
      method: 'GET',
      headers: { apikey: 'D58C1567-92A8-4F8F-8C16-DDF16ECDBA39', maxis_channel_type: 'MAXBOT', Cookie: 'visid_incap_2600589=yutE28MSQCyu65yNblPi8qUSZGEAAAAAQUIPAAAAAACXwZY' },
    };
    const data = await UTIL.GetUrl(url, head);
    console.log('data', JSON.stringify(data));
    if (data.status == 'success') {
      // let stockAvaliable = data['responseData']['productAvailability'].filter((item) => { return (item['stockType'] == 1 && item['balance'] > 0); })
      const stockAvaliable = data.responseData.productAvailability.filter((item) => (item.stockType == 1 && item.balance > 0));
      console.log('Stockavailable', stockAvaliable);
      if (stockAvaliable.length > 0) {
        return true;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.log('error', err);
    throw err;
  }
};

exports.Idle_AgentAssist_verify_Wh = async function (event) {
  console.log('event', JSON.stringify(event));
  const sessionID = UTIL.GetSessionID(event);
  const Idlelastevent = await BotSalesLastEvent(sessionID);

  const returnParam = await SESSION.GetIdlelastEventParam(sessionID);

  if (returnParam == '') {
    return UTIL.ComposeResult('', Idlelastevent);
  }
  return UTIL.ComposeResult('', Idlelastevent, returnParam);
};

exports.Shared_Idle_AgentAssist = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const IdlePlanType = await SESSION.GetIdlePlantype(sessionID);

  if (IdlePlanType == 'Hotlink-DeviceDiscovery') {
    console.log('🐛 Condition 1 -> ');
    return UTIL.ComposeResult('', 'Handover_Telesales_Agent_Device_Discovery');
  } if (IdlePlanType == 'Hotlink-RatePlan-DeviceDiscovery') {
    console.log('🐛 Condition 2 -> ');
    return UTIL.ComposeResult('', 'Hotlink_RatePlan_DeviceDiscovery_Idle');
  } if (IdlePlanType == 'Hotlink-MobileRatePlan') {
    console.log('🐛 Condition 2 -> ');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_DTS_WA');
  } if (IdlePlanType == 'Hotlink-BroadbandBundledPlan') {
    console.log('🐛 Condition 4 -> ');
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_BradbandPlan_TeleSalesAgent_MaxbotIdle');
  } if (IdlePlanType == 'Hotlink-PrepaidMobileRatePlan') {
    console.log('🐛 Condition 5 -> ');
    return UTIL.ComposeResult('', 'Idle_Handover_Telesales_Agent_PrepaidMobileRatePlan');
  } if (IdlePlanType == 'Maxis-DeviceDiscovery') {
    console.log('🐛 Condition 6 -> ');
    return UTIL.ComposeResult('', 'Handover_Telesales_Agent_Device');
  } if (IdlePlanType == 'Maxis-BotSales') {
    console.log('🐛 Condition 7 -> ');
    return UTIL.ComposeResult('', 'Bypass_Plans_Idle');
  } if (IdlePlanType == 'Maxis-BotSalesFiber') {
    console.log('🐛 Condition 8 -> ');
    return UTIL.ComposeResult('', 'Bypass_Broadband_Idle');
  }
  console.log('flow came to this unhandled flow ----- > ', IdlePlanType);
  return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
};

// -------------------------------------------------------------------//
//                    Hotlink Post-Paid                             //
// ------------------------------------------------------------------//

exports.DeviceDiscovery = async function (event, isFallBack, intentName) {
  let followUpEvent = 'main_menu_olo';
  const sessionID = UTIL.GetSessionID(event);
  // try {
  const customerType = await SESSION.GetCustomerType(sessionID);
  console.log(customerType.accType, customerType.subType, customerType.cusType);
  console.log('🐛 customerrrr ---- > ', customerType);
  if (customerType.accType == 'Principal') {
    followUpEvent = 'Greeting_MainMenu';
  } else if (customerType.accType == 'Supplementary') {
    followUpEvent = 'main_menu_maxis_supplementary';
  } else if (customerType.subType == 'Dealer') {
    followUpEvent = 'main_menu_olo';
  } else if (customerType.isSuspended) {
    followUpEvent = 'main_menu_olo';
  } else if (customerType.subType == 'Individual') {
    if (customerType.cusType == 'Consumer') {
      followUpEvent = 'main_menu_prepaid';
    } else {
      followUpEvent = 'main_menu_olo';
    }
  } else {
    followUpEvent = 'main_menu_olo';
  }

  // } catch (err) {
  // console.log("Error handling flow is triggered", err);
  // followUpEvent = "main_menu_olo";
  // return followUpEvent;
  // } finally {
  console.log('🐛 This is the intent name ---- > ', intentName);
  if (followUpEvent == 'Greeting_MainMenu') { // POSTPAID CUSTOMER
    console.log('🐛 Finally condition 1 - > ', followUpEvent);
    if (intentName == 'MaxisPostpaid') {
      await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
      await SESSION.SetIdleLastEvent(sessionID, 'Greeting_DeviceDiscoverAndPurchase');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'Greeting_DeviceDiscoverAndPurchase');// --return to 2.1
    } if ((intentName == 'HotlinkPostpaid')) {
      await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
      await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_Menu');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_Menu'); // --return to 2.2
    }
    console.log('🐛 Finally condition 1 coming to else handled ', followUpEvent);
  } else if (followUpEvent == 'main_menu_prepaid' || followUpEvent == 'main_menu_olo') { // PREPAID/OLO CUSTOMER
    // if (intentName == "MaxisPostpaid" || intentName == "HotlinkPostpaid") return UTIL.ComposeResult("", "DeviceDiscoveryOLOMenu");//--return to 2.3 & 2.4
    console.log('🐛 Finally condition 2 - > ', followUpEvent);
    if (intentName == 'MaxisPostpaid') {
      await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
      await SESSION.SetIdleLastEvent(sessionID, 'DeviceDiscoveryOLOMenu');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'DeviceDiscoveryOLOMenu'); // --return to 2.3 & 2.4
    }
    // intentName == "HotlinkPostpaid"
    // returns OLO-HotlinkPostPaid Menu
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    await SESSION.SetIdleLastEvent(sessionID, 'DeviceDiscovery_Hotlink_PostPaid_OLOMenu');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'DeviceDiscovery_Hotlink_PostPaid_OLOMenu');
  } else if (followUpEvent == 'main_menu_maxis_supplementary') {
    if (intentName == 'MaxisPostpaid') {
      // const sessionID = UTIL.GetSessionID(event);
      console.log('🐛 Going to maxis postpaid supplementary menu-- > ');
      await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
      await SESSION.SetIdleLastEvent(sessionID, 'Greeting_DeviceDiscoverAndPurchase');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'Greeting_DeviceDiscoverAndPurchase');
    }
    // const sessionID = UTIL.GetSessionID(event);
    console.log('🐛 Going to hotlink postpaid supplementary menu-- > ');
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_Menu');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_Menu');// --return to 2.2
  } else {
    console.log('🐛 Finally condition 3 coming to else handled ', followUpEvent);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
  // }
};
// ***MainMenu-DeviceDiscovery */
exports.DiscoverMaxisProductServices_Menu_Output = async function (event) {
  try {
    console.log('Trying');
    console.log('**********working channel DiscoverMaxisProductServices_Menu_Output***************');
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Menu');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.Sales_DiscoverMaxisProductServices_HotlinkPostpaid_Menu_Output = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_Sales_DiscoverMaxisProductServices_HotlinkPostpaid_Menu');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_Sales_DiscoverMaxisProductServices_HotlinkPostpaid_Menu');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.Hotlink_Explore_Device_Brand = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    const Indexbrand = UTIL.GetParameterValue(event, 'brandNumber');
    const aselection = UTIL.GetParameterValue(event, 'aselection');
    console.log('aselection : ', aselection);

    if (Indexbrand === 'Shared.Idle.AgentAssist' || event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const brand_list = await client.get(redisCache.HotlinkPostpaid_Brand_Key);

    const Cache = await SESSION.GetCache(sessionID);
    Cache.brand_list = brand_list;
    Cache.HotlinkbrandNumber = Indexbrand;
    Cache.aselection = aselection;
    Cache.firstTime = false;
    await SESSION.SetCache(sessionID, Cache);
    const menu_brand_list = UTIL.GetNumberedMenu(JSON.parse(brand_list));

    const returnParam = { menuBrand: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_BrandSelectionOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_BrandSelectionOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.Hotlink_Explore_Device_Promo = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    IndexPromo = UTIL.GetParameterValue(event, 'PromoNumber');
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    const promo_list = await client.get(redisCache.HotlinkPostpaid_Promo_Key);
    if (IndexPromo === 'Shared.Idle.AgentAssist' || event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    Cache.promo_list = promo_list;
    await SESSION.SetCache(sessionID, Cache);
    const menuPromo = UTIL.GetNumberedMenu(JSON.parse(promo_list));
    const returnParam = { menuPromo }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoSelectionOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoSelectionOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.Hotllink_Explore_Device_Promo_Brand = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    arrPromo = JSON.parse(Cache.promo_list);

    let promoName = '';

    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexPromo = UTIL.GetParameterValue(event, 'promoNumber');
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexPromo) || IndexPromo <= 0 || IndexPromo > arrPromo.length) {
          return exports.Hotlink_Explore_Device_Promo(event, true);
        }
        promoName = arrPromo[IndexPromo - 1];
        Cache.SelectedPromo = promoName;

        const brand_list = await client.get(redisData.getBrandsByHotlinkPostpaidPromo(promoName));
        Cache.brand_list = brand_list;
        await SESSION.SetCache(sessionID, Cache);
        const menu_brand_list = UTIL.GetNumberedMenu(JSON.parse(brand_list));
        const returnParam = { menuBrand: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);

        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandOutput');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);

        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandOutput', returnParam);
      }
      let menu_brand_list = Cache.brand_list;
      menu_brand_list = UTIL.GetNumberedMenu(JSON.parse(menu_brand_list));
      const returnParam = { menuBrand: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandOutput');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandOutput', returnParam);
    }
    const brand_list_menu = UTIL.GetNumberedMenu(JSON.parse(Cache.brand_list));
    const returnParam = { menuBrand: brand_list_menu }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»', err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaid_Promo_Model = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = JSON.parse(Cache.brand_list);
    const promoName = Cache.SelectedPromo;
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    let brandName = '';
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'brandNumber');

        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.Hotllink_Explore_Device_Promo_Brand(event, true);
        }
        brandName = arrBrand[Indexbrand - 1];
        Cache.SelectedBrand = brandName;
      }
      const model_list = await client.get(redisData.getBrandsByHotlinkPostpaidPromoBrand(promoName, brandName));
      Cache.model_list = model_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
      const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output', returnParam);
    }
    model_list = Cache.model_list;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
    const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»', err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.Hotlink_Explore_Device_Brand_SelectDevice = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = JSON.parse(Cache.brand_list);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    let brandName = '';
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'brandNumber');

        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.Hotlink_Explore_Device_Brand(event, true);
        }
        brandName = arrBrand[Indexbrand - 1];
        Cache.SelectedBrand = brandName;
      }
      const model_list = await client.get(redisData.getModelsByHotlinkPostpaidBrand(brandName));
      Cache.model_list = model_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
      const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output', returnParam);
    }
    model_list = Cache.model_list;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
    const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_PostpaidBroadband_Device_Brand_Models_Output', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostExploreDeviceBrandSelectCapacity = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrModel = JSON.parse(Cache.model_list);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    let modelName = '';
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexModel = UTIL.GetParameterValue(event, 'modelNumber');
        // VALIDATION: go back to brand if brand index is outside range
        if ((isNaN(IndexModel)) || (IndexModel <= 0) || (IndexModel > arrModel.length)) {
          return exports.Hotlink_Explore_Device_Brand_SelectDevice(event, true);
        }
        modelName = arrModel[IndexModel - 1];
        let image_path = await client.get(redisData.getHotlinkImagePathByBrandAndModel(modelName));
        console.log('image_path-->', image_path);
        image_path = image_path.trim();
        console.log('trimmed image path-->', image_path);
        image_path = image_path.replace(/"/g, '');
        console.log('new image_path-->', image_path);
        Cache.image_path = image_path;
        await SESSION.SetCache(sessionID, Cache);
        Cache.SelectedModel = modelName;
      }
      const capacity_list = await client.get(redisData.getStoragesByHotlinkPostpaidModel(modelName));
      // capacity_list=JSON.parse(capacity_list).map(e=>e.replace('gb','GB'))
      Cache.capacity_list = capacity_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(capacity_list));
      const returnParam = { capacityMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_CapacityOutput');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_CapacityOutput', returnParam);
    }
    capacity_list = Cache.capacity_list;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(capacity_list));
    const returnParam = { capacityMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_CapacityOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_CapacityOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidExploreDevcieGetColors = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    let arrCapacity = Cache.capacity_list;

    const modelName = Cache.SelectedModel;

    let storage = '';
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexCapacity = UTIL.GetParameterValue(event, 'capacityNumber');
        // VALIDATION: go back to brand if brand index is outside range
        console.log('type', typeof IndexCapacity);
        if (isNaN(IndexCapacity) || IndexCapacity <= 0 || IndexCapacity > JSON.parse(arrCapacity).length) {
          console.log('arraylenth>>>>>..', arrCapacity.length);
          return exports.HotlinkPostExploreDeviceBrandSelectCapacity(event, true);
        }
        arrCapacity = JSON.parse(arrCapacity);
        storage = arrCapacity[IndexCapacity - 1];
        Cache.SelectedCapacity = storage;
      }
      const color_list = await client.get(redisData.getColoursHotlinkPostpaidModelStorage(modelName, storage));
      Cache.color_list = color_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(color_list));
      const returnParam = { colorMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ColourOutput');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ColourOutput', returnParam);
    }
    const { color_list } = Cache;
    const menuList = UTIL.GetNumberedMenu(color_list);
    const returnParam = { colorMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ColourOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ColourOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

//* * Stock Availabilty enabled */
exports.HotlikPostpaidStockavailability = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    let Colors = '';
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    const { aselection } = Cache;
    let arrColor = Cache.color_list;
    console.log('Array Color', arrColor);
    console.log('Type of array', typeof arrColor);
    const modelName = Cache.SelectedModel;
    const Storage = Cache.SelectedCapacity;
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }

    if (isFallBack != true) {
      if (isFallBack == false) {
        let IndexColor = UTIL.GetParameterValue(event, 'colorNumber');
        // IndexColor =parseInt(IndexColor)
        console.log('arryalength', JSON.parse(arrColor).length, 'IndexColor', IndexColor);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexColor) || IndexColor <= 0 || IndexColor > JSON.parse(arrColor).length) {
          return exports.HotlinkPostpaidExploreDevcieGetColors(event, true);
        } else {
          IndexColor = UTIL.GetParameterValue(event, 'colorNumber');
          arrColor = JSON.parse(arrColor);
          Colors = arrColor[parseInt(IndexColor) - 1];
          Cache.SelectedColor = Colors;
        }
      }

      // if (aselection == 3) {
      // return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_Channel");
      // }
      console.log('ModelName', modelName, 'Storage:', Storage, 'Color', Colors);
      let sku_id = await client.get(redisData.getSkuIdByHotlinkPostpaidDeviceSelection(modelName, Storage, Colors));
      sku_id = sku_id.replace(/"/g, '');
      console.log(sku_id);
      Cache.sku_id = sku_id;
      if (aselection == 3) {
        await SESSION.SetCache(sessionID, Cache);
        console.log('sku_id : ', Cache.sku_id);
        return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_Channel');
      }
      const contract_list = await this.gethotlinkPostpaidContract(sku_id);
      Cache.contract_list = contract_list;
      const stock_avaliablity = await this.getStockavailabiltiyhotlinkPostpaid(sku_id);
      console.log('Stockavailabiliey', stock_avaliablity);
      console.log('Log1>>>>>>>>>>>>>>>>.......', contract_list);

      Cache['Stock Availability'] = stock_avaliablity;
      await SESSION.SetCache(sessionID, Cache);

      if (stock_avaliablity == true) {
        const contractMenu = UTIL.GetNumberedMenu(contract_list);

        const returnParam = { contractMenu }; if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract', returnParam);
      } if (stock_avaliablity == false) {
        console.log('Log3>>>>>>>>>>>>>>>>.......');
        await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe');
      }
    } else {
      const { contract_list } = Cache;
      const stock_avaliablity = Cache['Stock Availability'];
      if (stock_avaliablity == true) {
        const SelectedColor_Color = Cache.SelectedColor;
        console.log(modelName, Storage, SelectedColor_Color, '');
        let sku_id = await client.get(redisData.getSkuIdByHotlinkPostpaidDeviceSelection(modelName, Storage, SelectedColor_Color));
        sku_id = sku_id.replace(/"/g, '');
        const contract_list_hotlinkPost = await this.gethotlinkPostpaidContract(sku_id);

        Cache.contract_list = contract_list_hotlinkPost;
        Cache.sku_id = sku_id;

        Cache['Stock Availability'] = stock_avaliablity;
        await SESSION.SetCache(sessionID, Cache);

        const contractMenu = UTIL.GetNumberedMenu(contract_list_hotlinkPost);

        const returnParam = { contractMenu }; if (isFallBack) AssignFallBack(returnParam);

        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract', returnParam);
      } if (stock_avaliablity == false) {
        await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe');
      }
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract', returnParam);
    }
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidRetrieverRatePlan = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    const arrContract = Cache.contract_list;
    const { sku_id } = Cache;

    console.log('skuid:', sku_id);
    let Contract = '';
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexContract = UTIL.GetParameterValue(event, 'contractNumber');
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexContract) || IndexContract <= 0 || IndexContract > arrContract.length) {
          return exports.HotlikPostpaidStockavailability(event, true);
        }
        Contract = arrContract[IndexContract - 1];
        Cache.SelectedContract = Contract;

        const API_ratePlan_list = await getRatePlanHotlinkPostpaid(sku_id, Contract);
        const Cacheplanlist = await client.get(redisCache.Hotlink_Postpaid_Mobile_Plan_Details_Key);
        const CommonRatePlans = redisData.GetCommonPlans(JSON.parse(Cacheplanlist), API_ratePlan_list);
        Cache.ratePlan_list = CommonRatePlans;
        await SESSION.SetCache(sessionID, Cache);
        ratePlanMenu = UTIL.GetNumberedMenu(CommonRatePlans);
        const returnParam = { ratePlanMenu }; if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_RatePlantSelectionOutput');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_RatePlantSelectionOutput', returnParam);
      }
    }
    const { ratePlan_list } = Cache;

    ratePlanMenu = UTIL.GetNumberedMenu(ratePlan_list);
    const returnParam = { ratePlanMenu }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_RatePlantSelectionOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_RatePlantSelectionOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostPaidSkuSummary = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    const arrRatePlan = Cache.ratePlan_list;
    const brandName = Cache.SelectedBrand;
    const modelName = Cache.SelectedModel;
    let Storage = Cache.SelectedCapacity;
    const { sku_id } = Cache;
    Storage = Storage.replace('gb', 'GB');
    console.log('Storage', Storage);
    let color = Cache.SelectedColor;
    color = Proper(color.trim());
    const Contract = Cache.SelectedContract;
    let ratePlanName = '';
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexratePlan = UTIL.GetParameterValue(event, 'ratePlanNumber');
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexratePlan) || IndexratePlan <= 0 || IndexratePlan > arrRatePlan.length) {
          return exports.HotlinkPostpaidRetrieverRatePlan(event, true);
        }
        ratePlanName = arrRatePlan[IndexratePlan - 1];
        Cache.SelectedRatePlan = ratePlanName;
        const SkuSummary = {
          DeviceName: modelName,
          DeviceCapacity: Storage,
          DeviceColor: color,
          ContractType: Contract,
          RatePlan: ratePlanName,
        };
        Cache.SkuSummary = SkuSummary;
        await SESSION.SetCache(sessionID, Cache);

        ratePlanName = Cache.SelectedRatePlan;
        const returnParam = {
          brandName, modelName, contractName: Contract, CapacityName: Storage, color, ratePlanName,
        }; if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_SKUSummaryOutput');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_SKUSummaryOutput', returnParam);
      }
    } else {
      ratePlanName = Cache.SelectedRatePlan;
      const returnParam = {
        brandName, modelName, contractName: Contract, CapacityName: Storage, color, ratePlanName,
      }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_SKUSummaryOutput');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_SKUSummaryOutput', returnParam);
    }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidDeviceDiscovery_WA_PH_Menu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_DTS_Preferred_Contact_Menu');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_DTS_Preferred_Contact_Menu');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostPaidMainMenuOutput = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ExploreAll');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ExploreAll');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.LatestPromotinsExploreDeviceMenu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestPromoExploreDeviceYes');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestPromoExploreDeviceYes');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidDeviceDiscoveryCheckout = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');

    const Cache = await SESSION.GetCache(sessionID, event);
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexCheckout = UTIL.GetParameterValue(event, 'CheckoutNumber');

        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexCheckout) || IndexCheckout <= 0 || IndexCheckout != 1) {
          return exports.HotlinkPostPaidSkuSummary(event, true);
        }
        returnParam = ''; if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_Device_CheckOutOrCallBack_HotlinkPostapaid');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_Device_CheckOutOrCallBack_HotlinkPostapaid');
      }
      returnParam = ''; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_Device_CheckOutOrCallBack_HotlinkPostapaid');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_Device_CheckOutOrCallBack_HotlinkPostapaid');
    }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostPaidDeviceURL = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const brandName = Cache.SelectedBrand;
    const modelName = Cache.SelectedModel;
    const Contract = Cache.SelectedContract;
    const { sku_id } = Cache;
    const Category = 'mobiles';

    url = await UTIL.HotlinkDeviceURL(brandName, modelName, sku_id, Contract, Category);
    console.log('url:', url);
    const returnParam = { url }; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult('', 'DeviceDiscovery_SelectedDevice_URL', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidNotifymeExploreDeivce = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ExploreAll');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ExploreAll');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostPaidMobileRatePlanOutput = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-MobileRatePlan');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    const result_rate_plan = await client.get(redisCache.Hotlink_Postpaid_Mobile_Plan_Key);
    Cache.mobileRatePlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);

    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));

    const returnParam = { mobileRatePlanMenu: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);

    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlanOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlanOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidStoreMobileRatePlan = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-MobileRatePlan');
    const arrRatePlan = JSON.parse(Cache.mobileRatePlanlist);

    let ratePlan = '';
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexratePlan = UTIL.GetParameterValue(event, 'ratePlanNumber');
        console.log('Index', IndexratePlan);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexratePlan) || IndexratePlan <= 0 || IndexratePlan > arrRatePlan.length) {
          return exports.HotlinkPostPaidMobileRatePlanOutput(event, true);
        }
        ratePlan = arrRatePlan[IndexratePlan - 1];
        Cache.Selected_mobileRatePlan = ratePlan;

        await SESSION.SetCache(sessionID, Cache);
        if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_RegisterType');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_RegisterType');
      }
    } else {
      if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_RegisterType');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_RegisterType');
    }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.MobilePlanURL = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);

    const ratePlan = Cache.Selected_mobileRatePlan;
    const intention = 1;
    const planType = 'postPaid';

    url = await UTIL.configURL(ratePlan, intention, planType);
    console.log('url', url);
    const returnParam = { url }; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOut_HOSURL', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.DeviceDiscoveryPhoneCallLeadsCreation = async function (event, isFallBack = false) {
  try {
    let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
    inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn);
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }
    console.log(`this is the captured msisdn -> ${msisdn}`);
    const Cache = await SESSION.GetCache(sessionID);

    const PlanType = 'N/A';
    const SelectedPlan = Cache.SelectedRatePlan;
    const RegisterType = 'N/A';
    const IntentName = 'MaxBotIdle.DiscoverMaxisProductServices.HotlinkPostpaid.DeviceDiscovery.DTS.PhoneCall';

    let { SkuSummary } = Cache;
    SkuSummary = JSON.stringify(SkuSummary);
    SkuSummary = SkuSummary.replace(/,/g, '|');
    console.log('Skusummary', SkuSummary, 'Type:', typeof SkuSummary);
    const leadCatId = UTIL.GetParameterValue(event, 'leadCatId');
    await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'MultiCampaign.DiscoverMaxisProductServices.Postpaid.Device.DTS.Callback.END', 'DeviceDiscovery.Noleads.HandoverTelesales', sessionID);
    // await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, "MultiCampaign.DiscoverMaxisProductServices.Postpaid.Device.DTS.Callback.END", "Bypass Bot - DiscoverMaxisProductServices.MaxisPostpaid.Device.DTS.Preferred Contact-Whp-LMS", sessionID)
    return UTIL.ComposeResult('', 'lms_creation_inprogress');
    /** lmsStatus = await lmscreateLead(msisdn, leadCatId,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)
    console.log("LMS Status",lmsStatus)
    if (lmsStatus == true) {
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_DeviceDiscovery_HotlinkPostpaid_Device_PhoneCallLeads");
    }
    else {
      return UTIL.ComposeResult("", "DeviceDiscovery_Noleads_HandoverTelesales");
    }* */// MultiCampaign.DiscoverMaxisProductServices.Postpaid.Device.DTS.Callback.END
    //
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidSignUpWhatsupMenu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-MobileRatePlan');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOutCallbackSignupWA_Ph');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOutCallbackSignupWA_Ph');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.SwitchToHotlinkPostpaid_WA_Menu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-MobileRatePlan');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MRP_DTS_Preferred_Contact');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MRP_DTS_Preferred_Contact');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidMoblileRatePlanSighnUp = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-MobileRatePlan');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOutCallbackOptions');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOutCallbackOptions');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.MobileRatePlanSignupForNewNumberPhoneCallLeadsCreation = async function (event, isFallBack = false) {
  try {
    let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
    inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn);
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }
    console.log(`this is the captured msisdn -> ${msisdn}`);
    const Cache = await SESSION.GetCache(sessionID);

    const leadCatId = UTIL.GetParameterValue(event, 'leadCatId');
    const PlanType = 'MobileRatePlan-HotlinkPostpaid';
    const SelectedPlan = Cache.Selected_mobileRatePlan;
    const RegisterType = 'SignUp for New Number';
    const IntentName = 'DiscoverMaxisProductServices.HotlinkPostpaid.MobilePlan.CheckOutCallbackSignupNewNumber';
    const SkuSummary = 'N/A';

    await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'DiscoverMaxisProductServices.HotlinkPostpaid.DTS.Callback.MoblileRatePlan.END', 'DiscoverMaxisProductServices.MobilerRatePlans.Noleads.HandoverTelesales', sessionID);
    return UTIL.ComposeResult('', 'lms_creation_inprogress');
    // lmsStatus = await lmscreateLead(msisdn, leadCatId,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)
    // console.log("lmsstatus:",lmsStatus)
    // if (lmsStatus == true) {
    //   return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_DTS_Callback_MoblileRatePlan_END");

    // }
    // else {
    //   return UTIL.ComposeResult("", "DiscoverMaxisProductServices_MobilerRatePlans_Noleads_HandoverTelesales");
    // }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.MobileRatePlanSwitchtoHotlinkPostpaidLeadsCreation = async function (event, isFallBack = false) {
  try {
    let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
    inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn);
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }
    console.log(`this is the captured msisdn -> ${msisdn}`);
    const Cache = await SESSION.GetCache(sessionID);

    // et leadCatId = UTIL.GetParameterValue(event, "leadCatId");
    const leadCatId = 'PRD1000983';
    console.log('leadcatid', leadCatId);
    const PlanType = 'MobileRatePlan-HotlinkPostpaid';
    const SelectedPlan = Cache.Selected_mobileRatePlan;
    const RegisterType = 'SwitchHotlinkPostpaid keep your Existing Number';
    const IntentName = 'DiscoverMaxisProductServices.HotlinkPostpaid.MobileRatePlan.DTS.PhoneCall';
    const SkuSummary = 'N/A';
    await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'DiscoverMaxisProductServices.HotlinkPostpaid.DTS.Callback.MoblileRatePlan.END', 'DiscoverMaxisProductServices.MobilerRatePlans.Noleads.HandoverTelesales', sessionID);
    return UTIL.ComposeResult('', 'lms_creation_inprogress');
    // lmsStatus = await lmscreateLead(msisdn, leadCatId,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)
    // console.log("LMS Status",lmsStatus)
    // if (lmsStatus == true) {
    //   return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_DTS_Callback_MoblileRatePlan_END");

    // }
    // else {
    //   return UTIL.ComposeResult("", "DiscoverMaxisProductServices_MobilerRatePlans_Noleads_HandoverTelesales");
    // }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.MobileRatePlanUpgradeHotlinkPrepaidLeadsCreation = async function (event, isFallBack = false) {
  try {
    let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
    inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn);
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }
    console.log(`this is the captured msisdn -> ${msisdn}`);
    const Cache = await SESSION.GetCache(sessionID);

    const leadCatId = UTIL.GetParameterValue(event, 'leadCatId');
    const PlanType = 'MobileRatePlan-HotlinkPostpaid';
    const SelectedPlan = Cache.Selected_mobileRatePlan;
    const RegisterType = 'Upgrade from HotlinkPrepaid';
    const IntentName = 'DiscoverMaxisProductServices.HotlinkPostpaid.MobileRatePlan.UpgradeHotlinkPrepaid.PhoneCall';
    const SkuSummary = 'N/A';
    await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'DiscoverMaxisProductServices.HotlinkPostpaid.DTS.Callback.MoblileRatePlan.END', 'DiscoverMaxisProductServices.MobilerRatePlans.Noleads.HandoverTelesales', sessionID);
    return UTIL.ComposeResult('', 'lms_creation_inprogress');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};
exports.MoblieRatePlanUpgaradeHotlinkPrepaid_WA_Menu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-MobileRatePlan');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlan_UpgradeHotlinkPrepaid');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlan_UpgradeHotlinkPrepaid');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostPaidBroadbandLeadsCreation = async function (event) {
  try {
    let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
    inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn);
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }
    console.log(`this is the captured msisdn -> ${msisdn}`);
    const Cache = await SESSION.GetCache(sessionID);
    const PlanType = 'Broadband';
    const SelectedPlan = Cache.Selected_BroadbandPlan;
    const RegisterType = 'N/A';
    const IntentName = 'DiscoverMaxisProductServices.HotlinkPostpaid.BradbandPhoneCall';
    const leadCatId = UTIL.GetParameterValue(event, 'leadCatId');
    const SkuSummary = 'N/A';
    await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'DiscoverMaxisProductServices.HotlinkPostpaid.Bundled.Broadband.LeadsSuccesfull', 'Bypass Bot - DiscoverMaxisProductServices.HotlinkPostpaid.BroadbandBundled.TeleSalesAgent', sessionID);
    return UTIL.ComposeResult('', 'lms_creation_inprogress');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkBundledPlanLeadsCreation = async function (event, isFallBack = false) {
  try {
    let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
    inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn);
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }
    console.log(`this is the captured msisdn -> ${msisdn}`);
    const Cache = await SESSION.GetCache(sessionID);
    const PlanType = 'Bundled';
    const SelectedPlan = Cache.Selected_BundledPlan;
    const RegisterType = 'N/A';
    const IntentName = 'DiscoverMaxisProductServices.HotlinkPostpaid.BradbandPhoneCall';
    const leadCatId = UTIL.GetParameterValue(event, 'leadCatId');
    const SkuSummary = 'N/A';

    await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'DiscoverMaxisProductServices.HotlinkPostpaid.Bundled.Broadband.LeadsSuccesfull', 'Bypass Bot - DiscoverMaxisProductServices.HotlinkPostpaid.BroadbandBundled.TeleSalesAgent', sessionID);
    return UTIL.ComposeResult('', 'lms_creation_inprogress');
    // lmsStatus = await lmscreateLead(msisdn, leadCatId,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)
    // console.log("LMS Status",lmsStatus);
    // if (lmsStatus == true) {
    //   return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Bundled_Broadband_END");
    // }
    // else {
    //   return UTIL.ComposeResult("", "DiscoverMaxisProductServices_BroadbandBundaled_Noleads_HandoverTelesales");
    // }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidBroanbandPlanMainMenu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-BroadbandBundledPlan');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan');
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostPaidRetireveBroadbandPlan = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-BroadbandBundledPlan');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const result_rate_plan = await client.get(redisCache.Hotlink_Postpaid_Fibre_Broadband_Plan_key);
    Cache.broadbandPlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);

    await SESSION.SetCache(sessionID, Cache);
    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));

    const returnParam = { broadbandMenu: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);

    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_BroadbandOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_BroadbandOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkStoreBroadbandPlan = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrPlan = JSON.parse(Cache.broadbandPlanlist);
    ratePlan = '';
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexPlan = UTIL.GetParameterValue(event, 'planNumber');
        console.log('Index', IndexPlan);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexPlan) || IndexPlan <= 0 || IndexPlan > arrPlan.length) {
          return exports.HotlinkPostPaidRetireveBroadbandPlan(event, true);
        }
        const ratePlan = arrPlan[IndexPlan - 1];
        Cache.Selected_BroadbandPlan = ratePlan;

        await SESSION.SetCache(sessionID, Cache);
        if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_iscoverMaxisProductServices_Hotlink_Postpaid_Broadband_WA_Ph');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'MaxBotIdle_iscoverMaxisProductServices_Hotlink_Postpaid_Broadband_WA_Ph');
      }
      if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_iscoverMaxisProductServices_Hotlink_Postpaid_Broadband_WA_Ph');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'MaxBotIdle_iscoverMaxisProductServices_Hotlink_Postpaid_Broadband_WA_Ph');
    }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};
exports.HotlinkPostPadiRetriveBundledPlan = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-BroadbandBundledPlan');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const result_rate_plan = await client.get(redisCache.Hotlink_Postpaid_Fibre_Bundled_Plan_key);
    Cache.bundledPlanlist = result_rate_plan;

    await SESSION.SetCache(sessionID, Cache);

    const bundled_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));

    const returnParam = { bundledMenu: bundled_plan_list }; if (isFallBack) AssignFallBack(returnParam);

    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_BundledOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_BundledOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkStoreBundledPlan = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-BroadbandBundledPlan');
    const arrPlan = JSON.parse(Cache.bundledPlanlist);
    let ratePlan = '';
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexPlan = UTIL.GetParameterValue(event, 'planNumber');

        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexPlan) || IndexPlan <= 0 || IndexPlan > arrPlan.length) {
          return exports.HotlinkPostPadiRetriveBundledPlan(event, true);
        }
        ratePlan = arrPlan[IndexPlan - 1];
        Cache.Selected_BundledPlan = ratePlan;

        await SESSION.SetCache(sessionID, Cache);
        if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BundledPlan_WA_Ph');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BundledPlan_WA_Ph');
      }
      if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BundledPlan_WA_Ph');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_BundledPlan_WA_Ph');
    }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidLatestDevicesKey = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const broadbandPlanKey = await client.get(redisCache.HotlinkPostpaid_LatestDevices_Key);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    let urlPromo = '';
    JSON.parse(broadbandPlanKey).map((item, index) => { urlPromo += item; });
    const returnParam = { latestDevice: urlPromo }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestDevicesOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestDevicesOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»', err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.HotlinkPostpaidLatestPromotionsKey = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery');
    const broadbandPlanKey = await client.get(redisCache.HotlinkPostpaid_LatestPromotions_Key);

    const returnParam = { latestPromo: broadbandPlanKey }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestPromoOutput');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestPromoOutput', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»', err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

// ------------------------------------------//
//     Maxis Postpaid & Broadband           //
// -----------------------------------------//
async function retriveArrayDevice(deviceType) {
  arrayRetriveDevice = await client.get(deviceType);
  // arrayRetriveDevice = ['ContractDevice1','ContractDevice2']; //example
  return arrayRetriveDevice;
}

async function retriveBransName(deviceType) {
  console.log(deviceType);
  const arrayRetriveBrand = await client.get(deviceType);
  console.log(arrayRetriveBrand);
  return arrayRetriveBrand;
}

async function retrievebrandname(aselection, bselection) {
  let brand_device;
  if ((aselection == '1' && bselection == '1') || (aselection == '4' && bselection == '1')) {
    getDeviceType = redisCache.Brand_Devices_Key;
    brand_device = await retriveBransName(getDeviceType);
  } else if ((aselection == '1' && bselection == '2') || (aselection == '4' && bselection == '2')) {
    getDeviceType = redisCache.Brand_Tablets_Key;
    brand_device = await retriveBransName(getDeviceType);
  } else if ((aselection == '1' && bselection == '3') || (aselection == '4' && bselection == '3')) {
    getDeviceType = redisCache.Brand_Wearables_Key;
    brand_device = await retriveBransName(getDeviceType);
  }
  console.log('brand_device', brand_device);
  return brand_device;
}
async function retrieveContractname(aselection, bselection) {
  let arrayContractType;
  if (aselection == '2' && bselection == '1') {
    getContractType = redisCache.Contract_Devices_Key;
    arrayContractType = await retriveArrayDevice(getContractType);
  } else if (aselection == '2' && bselection == '2') {
    getContractType = redisCache.Contract_Tablets_Key;
    arrayContractType = await retriveArrayDevice(getContractType);
  } else if (aselection == '2' && bselection == '3') {
    getContractType = redisCache.Contract_Wearables_Key;
    arrayContractType = await retriveArrayDevice(getContractType);
  }
  console.log('arrayContractType>>>>>>>>.', arrayContractType);
  return arrayContractType;
}

async function retrievePromoname(aselection, bselection) {
  let arrayContractType;
  if (aselection == '3' && bselection == '1') {
    getContractType = redisCache.Promo_Devices_Key;
    arrayContractType = await retriveArrayDevice(getContractType);
  } else if (aselection == '3' && bselection == '2') {
    getContractType = redisCache.Promo_Tablets_Key;
    arrayContractType = await retriveArrayDevice(getContractType);
  } else if (aselection == '3' && bselection == '3') {
    getContractType = redisCache.Promo_Wearables_key;
    arrayContractType = await retriveArrayDevice(getContractType);
  }
  console.log('arrayContractType>>>>>>>>.', arrayContractType);
  return arrayContractType;
}
exports.getmaxisPostpaidContract = async function (skuID) {
  console.log('skuid:', skuID, 'type', typeof skuID);
  const url = `${HOST.PRODUCT_PLAN_SKU[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&familyType=MOP`;
  let head = '';

  if (HOST.TARGET == 0) {
    head = { headers: { channel: 'ssp', 'x-apigw-api-id': 'goiwi3vpib', 'x-api-key': '6badd2d9-6fdf-49b2-bc79-d67534feb7e3' } };
  } else {
    head = { headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' } };
  }
  const data = await UTIL.GetUrl(url, head);
  console.log('data.status   ', data.status);
  console.log('data  ', data);
  if (data.status == 'success') {
    const plans = [];
    console.log('data.responseData   ', data.responseData);
    if (data.responseData.length > 0) {
      data.responseData[0].plan.map((item, index) => {
        item.contract.map((itemChild, indexChild) => {
          if (itemChild.name == 'Zerolution') {
            itemChild.tenure = parseInt(itemChild.tenure) + 1;
          }
          itemChild.name = (itemChild.name).replace('K2', 'Normal Contract');
          plans.push(`${itemChild.name} ${itemChild.tenure}-Months Contract`);
        });
      });
    }
    return [...new Set(plans)];
  }
  return false;
};

/**
 *
 * @param {String} skuID
 * @param {String} planNames
 * @returns [ 'Hotlink Postpaid 30', 'Hotlink Postpaid 40' ]
 */
async function getRatePlanMaxisPostpaid(skuID, contract) {
  const url = `${HOST.PRODUCT_PLAN_SKU[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&familyType=MOP`;
  let head = '';

  if (HOST.TARGET == 0) {
    head = { headers: { channel: 'ssp', 'x-apigw-api-id': 'goiwi3vpib', 'x-api-key': '6badd2d9-6fdf-49b2-bc79-d67534feb7e3' } };
  } else {
    head = { headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' } };
  }
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    // let plans = [];
    // let firstValue = contract.split(" ")[0];
    // let secondValue = contract.split(" ")[1]
    // let yearTenure = secondValue.split("-")[0]
    const plans = data.responseData[0].plan.map((item, index) => ({ planName: item.name, planId: `${item.uxfAttributes.productSpecRelationId}_${item.uxfAttributes.billingOfferId}` }));
    console.log('plans', JSON.stringify(plans));
    return plans;
  }
  return false;
}

async function getRatePlanMaxisPostpaidTablet(skuID, contract) {
  const url = `${HOST.Product_wearable_tablet[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&filterPlans=MOP,TABLET`;
  const head = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
  };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    const plans = data.responseData[0].plan.map((item, index) => ({
      planName: item.name,
      planId: `${item.uxfAttributes.productSpecRelationId}_${item.uxfAttributes.billingOfferId}`,
    }));
    console.log('plans', JSON.stringify(plans));
    return plans;
  }
  return false;
}

/**
 *
 * @param {String} skuID
 * @returns true if data avaliable, false if data is not avaliable
 */
exports.getStockavailabiltiymaxisPostpaid = async function (skuID) {
  try {
    const url = `${HOST.HOTLINK_STOCK_AVAILABILITY[HOST.TARGET]}/offline/api/v1.0/inventories/PJ07/${skuID}?senderId=MC&source=SAP&type=shipping&isStockPickupRealTime=false`;
    console.log('url>>>>>>>>>>>>.', url);
    const head = {
      method: 'GET',
      headers: { apikey: 'D58C1567-92A8-4F8F-8C16-DDF16ECDBA39', maxis_channel_type: 'MAXBOT', Cookie: 'visid_incap_2600589=yutE28MSQCyu65yNblPi8qUSZGEAAAAAQUIPAAAAAACXwZY' },
    };
    const data = await UTIL.GetUrl(url, head);
    console.log('data', JSON.stringify(data));
    if (data.status == 'success') {
      const stockAvaliable = data.responseData.productAvailability.filter((item) => (item.stockType == 1 && item.balance > 0));
      console.log('Stockavailable', stockAvaliable);
      if (stockAvaliable.length > 0) {
        return true;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.log('error', err);
    throw err;
  }
};
let _ProductCatalog = {};
async function getProductCatalog() {
  // 👇 cached in container
  const url = `${HOST.PRODUCT_CATALOG[HOST.TARGET]}/bin/commerce/product-catalogue.json`;

  if (Object.keys(_ProductCatalog).length == 0) _ProductCatalog = await UTIL.GetUrl(url);

  return _ProductCatalog.results;
}

async function getProductCatalog_Device() {
  const all = [];
  const array = await getProductCatalog();

  array.forEach((element) => {
    if (element.topOrder != undefined) {
      all.push(`${element.deviceTitle} - ${HOST.PRODUCT_LATEST_DEVICE[HOST.TARGET]}/productdetails/category/mobiles/${element.brand}/${element.device} \n\n`);
    }
  });

  return all;
}

async function getRatePlanMaxisPostpaidwear(skuID, contract) {
  const url = `${HOST.Product_wearable[HOST.TARGET]}/accessory/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&familyType=MOP`;
  const head = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
  };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    // let plans = [];
    const firstValue = contract.split(' ')[0];
    const secondValue = contract.split(' ')[1];
    const yearTenure = secondValue.split('-')[0];
    const plans = data.responseData[0].plan.map((item, index) => ({

      planName: item.name,

      planId: `${item.uxfAttributes.productSpecRelationId}_${item.uxfAttributes.billingOfferId}`,

    }));
    console.log('plans', JSON.stringify(plans));
    return plans;
  }
  return false;
}
async function getmaxisPostpaidContractwear(skuID) {
  console.log('skuid:', skuID, 'type', typeof skuID);
  const url = `${HOST.Product_wearable[HOST.TARGET]}/accessory/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&familyType=MOP`;
  const head = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
  };
  const data = await UTIL.GetUrl(url, head);
  if (data.status == 'success') {
    const plans = [];
    data.responseData[0].plan.map((item, index) => {
      item.contract.map((itemChild, indexChild) => {
        if (itemChild.name == 'Zerolution') {
          itemChild.tenure = parseInt(itemChild.tenure) + 1;
        }
        itemChild.name = (itemChild.name).replace('K2', 'Normal Contract');
        plans.push(`${itemChild.name} ${itemChild.tenure}-Months Contract`);
      });
    });
    return [...new Set(plans)];
  }
  return false;
}

// mvp1 functions

exports.LatestPromo = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const url = `${HOST.PRODUCT_PROMO[HOST.TARGET]}/content/commerce/devices/jcr:content/root/responsivegrid/herobanner.model.json`;
    const data = await UTIL.GetUrl(url);

    const products = (JSON.parse(data.herobanner)).heroBanners;
    let text = '';

    const rex = /(<([^>]+)>)/ig;
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    products.forEach((element) => {
      text += `${element.headline.replace(rex, '').replace('\n', '')} - ${element.bannerUrl.replace(rex, '').replace('\n', '')} \n\n`;
    });
    await SESSION.SetIdleLastEvent(sessionID, 'discover_latest_promo');
    await SESSION.SetIdlelastEventParam(sessionID, { latestPromoMenu: text });
    return UTIL.ComposeResult('', 'discover_latest_promo', { latestPromoMenu: text });
  } catch (err) {
    console.log('Latest Promo Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
};

exports.LatestDevice = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const result = await getProductCatalog_Device();
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    await SESSION.SetIdleLastEvent(sessionID, 'discover_latest_devices');
    await SESSION.SetIdlelastEventParam(sessionID, { latestDeviceMenu: result.join('\n') });
    return UTIL.ComposeResult('', 'discover_latest_devices', { latestDeviceMenu: result.join('\n') });
  } catch (err) {
    console.log('Latest Device Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
};

// current functionality

exports.MaxisBrand_Explore_Device_Brand = async function (event, isFallBack = false) {
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  if (isFallBack != true) {
    const aselection = UTIL.GetParameterValue(event, 'aselection');
    console.log('aselection', aselection);
    const bselection = UTIL.GetParameterValue(event, 'bselection');
    console.log('bselection', bselection);

    try {
      const brand_list = await retrievebrandname(aselection, bselection);
      console.log('brands list', brand_list);
      Cache.aselection = aselection;
      Cache.bselection = bselection;
      Cache.brand_list = brand_list;
      Cache.firstTime = false;
      console.log('list of brands storing', Cache);
      await SESSION.SetCache(sessionID, Cache);
      await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
      if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
        return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
      }
      const menu_brand_list = UTIL.GetNumberedMenu(JSON.parse(brand_list));
      console.log('logging rate plan list:', menu_brand_list);
      const returnParam = { brandMenu: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
      console.log('logging parameters', menu_brand_list);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByBrand');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByBrand', returnParam);
    } catch (err) {
      console.log('Discovery Brand Error Ã°Å¸â€Â»');
      console.log(err);
      return UTIL.ComposeResult('', MaxisTechIssueEnd());
    }
  } else {
    brand_list = Cache.brand_list;
    const menu_brand_list = UTIL.GetNumberedMenu(JSON.parse(brand_list));
    const returnParam = { brandMenu: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByBrand');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByBrand', returnParam);
  }
};

exports.MaxisContract_Explore_Device_Contract = async function (event, isFallBack = false) {
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  if (isFallBack != true) {
    const aselection = UTIL.GetParameterValue(event, 'aselection');
    const bselection = UTIL.GetParameterValue(event, 'bselection');

    // let cselection = UTIL.GetParameterValue(event, "cselection");

    try {
      let contract_list = await retrieveContractname(aselection, bselection);
      console.log('contract list', contract_list);
      Cache.bselection = bselection;
      contract_list = JSON.parse(contract_list);
      Cache.contract_list = contract_list;
      console.log('list of contracts storing', Cache);
      await SESSION.SetCache(sessionID, Cache);
      await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
      if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
        return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
      }
      const menu_brand_list = UTIL.GetNumberedMenu(contract_list);
      console.log('logging rate plan list:', menu_brand_list);
      const returnParam = { contractMenu: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
      console.log('logging parameters', menu_brand_list);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByContract');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByContract', returnParam);
    } catch (err) {
      console.log('Discovery Brand Error Ã°Å¸â€Â»');
      console.log(err);
      return UTIL.ComposeResult('', MaxisTechIssueEnd());
    }
  } else {
    contract_list = Cache.contract_list;
    const menu_brand_list = UTIL.GetNumberedMenu(contract_list);
    const returnParam = { contractMenu: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByContract');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByContract', returnParam);
  }
};

exports.MaxisContract_Explore_Device_Contract_Menu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = Cache.contract_list;
    const { bselection } = Cache;
    let deviceType = '';
    if (bselection == 1) {
      deviceType = 'Devices';
    } else if (bselection == 2) {
      deviceType = 'tablets';
    } else if (bselection == 3) {
      deviceType = 'wearables';
    }
    console.log('selectionb', deviceType);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    let contractName = '';
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexContract = UTIL.GetParameterValue(event, 'cselection');
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexContract) || IndexContract <= 0 || IndexContract > arrBrand.length) {
          return exports.MaxisContract_Explore_Device_Contract(event, true);
        }
        contractName = arrBrand[IndexContract - 1];
        Cache.SelectedContract = contractName;
      }
      const contract_brand_menu = await client.get(redisData.getBrandsByMaxisContract(deviceType, contractName));
      Cache.contract_brand_menu = contract_brand_menu;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(contract_brand_menu));
      const returnParam = { brandMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      // return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand", returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByContract_Brands');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByContract_Brands', returnParam);
    }
    contract_brand_menu = Cache.contract_brand_menu;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(contract_brand_menu));
    const returnParam = { brandMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByContract_Brands');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByContract_Brands', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisContract_Explore_Device_Promo = async function (event, isFallBack = false) {
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  if (isFallBack != true) {
    const aselection = UTIL.GetParameterValue(event, 'aselection');
    const bselection = UTIL.GetParameterValue(event, 'bselection');
    // let cselection = UTIL.GetParameterValue(event, "cselection");
    try {
      let promo_list = await retrievePromoname(aselection, bselection);
      console.log('promo_list outer parse', JSON.parse(promo_list.length));
      console.log('promo list lentgh', promo_list.length);
      console.log('promo list', promo_list);
      await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
      if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
        return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
      }
      if ((promo_list.length) == 2) {
        console.log('promo_list inner', promo_list.length);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_EmptyPromo');
      }
      Cache.bselection = bselection;
      promo_list = JSON.parse(promo_list);
      Cache.promo_list = promo_list;

      console.log('list of promo storing', Cache);
      await SESSION.SetCache(sessionID, Cache);
      const menu_brand_list = UTIL.GetNumberedMenu(promo_list);
      console.log('logging rate plan list:', menu_brand_list);
      const returnParam = { promoMenu: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
      console.log('logging parameters', menu_brand_list);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByPromo');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByPromo', returnParam);
    } catch (err) {
      console.log('Discovery Brand Error Ã°Å¸â€Â»');
      console.log(err);
      return UTIL.ComposeResult('', MaxisTechIssueEnd());
    }
  } else {
    promo_list = Cache.promo_list;
    const menu_brand_list = UTIL.GetNumberedMenu(promo_list);
    const returnParam = { promoMenu: menu_brand_list }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByPromo');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByPromo', returnParam);
  }
};

exports.MaxisContract_Explore_Device_Promo_Menu = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = Cache.promo_list;
    let { bselection } = Cache;
    let deviceType = '';
    if (bselection == 1) {
      deviceType = 'Devices';
    } else if (bselection == 2) {
      deviceType = 'tablets';
    } else if (bselection == 3) {
      deviceType = 'wearables';
    }
    let promoName = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const IndexPromo = UTIL.GetParameterValue(event, 'dselection');
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(IndexPromo) || IndexPromo <= 0 || IndexPromo > arrBrand.length) {
          return exports.MaxisContract_Explore_Device_Promo(event, true);
        }
        promoName = arrBrand[IndexPromo - 1];
        Cache.SelectedPromo = promoName;
      }
      const promo_brand_menu = await client.get(redisData.getBrandsByMaxisPromo(deviceType, promoName));
      Cache.promo_brand_menu = promo_brand_menu;
      Cache.bselection = bselection;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(promo_brand_menu));
      const returnParam = { brandMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByPromo_Brands');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByPromo_Brands', returnParam);
    }
    promo_brand_menu = Cache.promo_brand_menu;
    bselection = Cache.bselection;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(promo_brand_menu));
    const returnParam = { brandMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByPromo_Brands');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByPromo_Brands', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.Maxis_Explore_Device_Brand_SelectModel = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    let deviceType = '';
    const Cache = await SESSION.GetCache(sessionID);
    const { bselection } = Cache;
    if (bselection == 1) {
      deviceType = 'Devices';
    } else if (bselection == 2) {
      deviceType = 'tablets';
    } else if (bselection == 3) {
      deviceType = 'wearables';
    }
    const arrBrand = JSON.parse(Cache.brand_list);
    let brandName = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'brand');
        console.log('Index', Indexbrand);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.MaxisBrand_Explore_Device_Brand(event, true);
        }
        brandName = arrBrand[Indexbrand - 1];
        Cache.SelectedBrand = brandName;
      }
      const model_list = await client.get(redisData.getModelsByMaxisBrand(deviceType, brandName));
      Cache.model_list = model_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
      const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_ModelSelectionByBrand');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_ModelSelectionByBrand', returnParam);
    }
    model_list = Cache.model_list;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
    const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_ModelSelectionByBrand');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_ModelSelectionByBrand', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.Maxis_Explore_Device_Contract_SelectModel = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    let deviceType = '';
    const Cache = await SESSION.GetCache(sessionID);
    const { bselection } = Cache;
    if (bselection == 1) {
      deviceType = 'Devices';
    } else if (bselection == 2) {
      deviceType = 'tablets';
    } else if (bselection == 3) {
      deviceType = 'wearables';
    }
    const arrBrand = JSON.parse(Cache.contract_brand_menu);
    const contractName = Cache.SelectedContract;
    let brandName = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'brand');
        console.log('Index', Indexbrand);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.MaxisContract_Explore_Device_Contract_Menu(event, true);
        }
        brandName = arrBrand[Indexbrand - 1];
        Cache.SelectedBrand = brandName;
      }

      const model_list = await client.get(redisData.getModelsByMaxisContractBrand(deviceType, contractName, brandName));
      Cache.model_list = model_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
      const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByContract_Models');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByContract_Models', returnParam);
    }
    model_list = Cache.model_list;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
    const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByContract_Models');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByContract_Models', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.Maxis_Explore_Device_Promo_SelectModel = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    let deviceType = '';

    const Cache = await SESSION.GetCache(sessionID);
    const { bselection } = Cache;
    if (bselection == 1) {
      deviceType = 'Devices';
    } else if (bselection == 2) {
      deviceType = 'tablets';
    } else if (bselection == 3) {
      deviceType = 'wearables';
    }
    const arrBrand = JSON.parse(Cache.promo_brand_menu);
    const promoName = Cache.SelectedPromo;
    let brandName = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'brand');
        console.log('Index', Indexbrand);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.MaxisContract_Explore_Device_Promo_Menu(event, true);
        }
        brandName = arrBrand[Indexbrand - 1];
        Cache.SelectedBrand = brandName;
      }

      const model_list = await client.get(redisData.getModelsByMaxisPromoBrand(deviceType, promoName, brandName));
      Cache.model_list = model_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
      const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByPromo_Models');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByPromo_Models', returnParam);
    }
    model_list = Cache.model_list;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(model_list));
    const returnParam = { modelMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SelectionByPromo_Models');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SelectionByPromo_Models', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostExploreDeviceBrandSelectCapacity = async function (event, isFallBack, Reqcomingfrom) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const { bselection } = Cache;
    const arrBrand = JSON.parse(Cache.model_list);
    console.log('list of models', arrBrand);
    let modelName = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'model');
        console.log('Index', Indexbrand);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          if (Reqcomingfrom == 'MaxisPostpaidContract') {
            return exports.Maxis_Explore_Device_Contract_SelectModel(event, true);
          } if (Reqcomingfrom == 'MaxisPostpaidPromo') {
            return exports.Maxis_Explore_Device_Promo_SelectModel(event, true);
          } if (Reqcomingfrom == 'MaxisPostpaidNormal') {
            return exports.Maxis_Explore_Device_Brand_SelectModel(event, true);
          }
        } else {
          modelName = arrBrand[Indexbrand - 1];
          let image_path = await client.get(redisData.getImagePathByBrandAndModel(modelName));
          console.log('image_path-->', image_path);
          image_path = image_path.trim();
          console.log('trimmed image path-->', image_path);
          image_path = image_path.replace(/"/g, '');
          console.log('new image_path-->', image_path);
          Cache.image_path = image_path;
          await SESSION.SetCache(sessionID, Cache);
          modelName = modelName.split('-');
          if (modelName.length > 2) {
            let updateStr = '';
            for (let i = 1; i < modelName.length; i++) {
              if (i == 1) {
                updateStr += modelName[i];
              } else {
                updateStr = `${updateStr}-${modelName[i]}`;
              }
            }
            modelName = updateStr.trim();
            console.log(modelName, 'true');
          } else {
            // modelName = modelName[1];
            const modelNameTemp = modelName[1];
            modelName = modelNameTemp;
            modelName = modelName.trim();
            console.log(modelName);
          }
          Cache.SelectedModel = modelName;
        }
      }
      const capacity_list = await client.get(redisData.getStoragesByMaxisModel(modelName));
      console.log('capacity_lis', capacity_list);
      Cache.capacity_list = capacity_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(capacity_list));
      const returnParam = { capacityMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      if (bselection == 1 || bselection == 2) {
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_CapacitySelectionByBrand');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_CapacitySelectionByBrand', returnParam);
      } if (bselection == 3) {
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_CapacitySelectionByBrandWearables');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_CapacitySelectionByBrandWearables', returnParam);
      }
    } else {
      capacity_list = Cache.capacity_list;
      // { capacity_list } = Cache;
      const menuList = UTIL.GetNumberedMenu(JSON.parse(capacity_list));
      const returnParam = { capacityMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      if (bselection == 1 || bselection == 2) {
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_CapacitySelectionByBrand');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_CapacitySelectionByBrand', returnParam);
      } if (bselection == 3) {
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_CapacitySelectionByBrandWearables');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_CapacitySelectionByBrandWearables', returnParam);
      }
    }
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostpaidExploreDevcieGetColors = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = JSON.parse(Cache.capacity_list);
    const modelName = Cache.SelectedModel;
    let storage = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'capacity');
        console.log('Index', Indexbrand);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.MaxisPostExploreDeviceBrandSelectCapacity(event, true);
        }
        storage = arrBrand[Indexbrand - 1];
        Cache.SelectedCapacity = storage;
      }
      console.log('modelName', modelName);
      console.log('storage', storage);
      const color_list = await client.get(redisData.getColoursByMaxisModelStorage(modelName, storage));
      console.log('color list', color_list);
      Cache.color_list = color_list;
      await SESSION.SetCache(sessionID, Cache);
      const menuList = UTIL.GetNumberedMenu(JSON.parse(color_list));
      const returnParam = { colorMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_ColorSelectionByBrand');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_ColorSelectionByBrand', returnParam);
    }
    color_list = Cache.color_list;
    const menuList = UTIL.GetNumberedMenu(JSON.parse(color_list));
    const returnParam = { colorMenu: menuList }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_ColorSelectionByBrand');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_ColorSelectionByBrand', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostpaidStockavailability = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const { aselection } = Cache;
    const { firstTime } = Cache;
    let { bselection } = Cache;
    const arrBrand = JSON.parse(Cache.color_list);
    const modelName = Cache.SelectedModel;
    const Storage = Cache.SelectedCapacity;
    let Colors = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'color');
        console.log('Index', Indexbrand, arrBrand.length);
        console.log('ifcondition', isNaN(Indexbrand), Indexbrand <= 0, Indexbrand > arrBrand.length);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          console.log('coming to 2nd if');
          return exports.MaxisPostpaidExploreDevcieGetColors(event, true);
        }
        console.log('coming to else color');
        Colors = arrBrand[Indexbrand - 1];
        Cache.SelectedColor = Colors;
      }

      let sku_id = await client.get(redisData.getSkuIdByMaxisDeviceSelection(modelName, Storage, Colors));
      sku_id = sku_id.replace(/"/g, '');
      console.log('sku_id:', sku_id);
      Cache.sku_id = sku_id;
      // firstTime = true
      if (aselection == 4 && firstTime == false) {
        Cache.firstTime = true;
        await SESSION.SetCache(sessionID, Cache);
        console.log('sku_id : ', Cache.sku_id);
        return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_Channel');
      }
      const stock_avaliablity = await this.getStockavailabiltiymaxisPostpaid(sku_id);
      Cache['Stock Availability'] = stock_avaliablity;
      let contract_list_available = null;
      console.log('bselection', bselection);
      if (bselection == 1) {
        console.log('we are in if loop===>');
        contract_list_available = await this.getmaxisPostpaidContract(sku_id);
        console.log('we are in if loop===>', contract_list_available);
      } else if (bselection == 2) {
        contract_list_available = await getmaxisPostpaidContractTabletWear(sku_id);
      } else if (bselection == 3) {
        contract_list_available = await getmaxisPostpaidContractwear(sku_id);
      }
      Cache.contract_list_available = contract_list_available;
      await SESSION.SetCache(sessionID, Cache);
      if (stock_avaliablity == true) {
        console.log('list of Contracts:----->', contract_list_available);
        console.log('stock_avaliablity------>', stock_avaliablity);
        console.log('list of contracts------->', contract_list_available);
        contractMenu = UTIL.GetNumberedMenu(contract_list_available);
        const returnParam = { skuid: sku_id, contractMenu }; if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_ContractSelectionByBrand');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_ContractSelectionByBrand', returnParam);
      } if (stock_avaliablity == false) {
        console.log('stock_avaliablity One', stock_avaliablity);
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_StockAvailableNoByBrand');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'Maxis_Postpaid_StockAvailableNoByBrand');
      }
    } else {
      const stock_avaliablity = Cache['Stock Availability'];
      sku_id = Cache.sku_id;
      bselection = Cache.bselection;
      if (stock_avaliablity == true || Cache.flowInfo == 'notifyMe') {
        let contract_list_available = null;
        console.log('bselection', bselection);
        // if (bselection == 1 || bselection == 2) {
        //   console.log("we are in if loop 1,2")
        if (Cache.flowInfo == 'notifyMe') {
          contract_list_available = await getmaxisPostpaidContractTabletWear(sku_id);
        } else if (bselection == 2) {
          contract_list_available = await getmaxisPostpaidContractTabletWear(sku_id);
        } else if (bselection == 1) {
          contract_list_available = await this.getmaxisPostpaidContract(sku_id);
          console.log('we are in if loop contract_list_available', contract_list_available);
        } else if (bselection == 3) {
          contract_list_available = await getmaxisPostpaidContractwear(sku_id);
          console.log('contract_list_available bSelection', contract_list_available);
          // }
        }
        console.log('contract_list_available---------------------------->', contract_list_available);
        Cache.contract_list_available = contract_list_available;
        await SESSION.SetCache(sessionID, Cache);
        contractMenu = UTIL.GetNumberedMenu(contract_list_available);
        const returnParam = { skuid: sessionID, contractMenu }; if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_ContractSelectionByBrand');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_ContractSelectionByBrand', returnParam);
      } if (stock_avaliablity == false) {
        console.log('stock_avaliablity two------------>', stock_avaliablity);
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_StockAvailableNoByBrand');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'Maxis_Postpaid_StockAvailableNoByBrand');
      }
      contract_list_available = Cache.contract_list_available;
      contractMenu = UTIL.GetNumberedMenu(contract_list_available);
      const returnParam = { skuid: sku_id, contractMenu }; if (isFallBack) AssignFallBack(returnParam);

      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_ContractSelectionByBrand');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_ContractSelectionByBrand', returnParam);
    }
  } catch (err) {
    console.log('Discovery Brand Error ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};
exports.MaxisPostpaidRetrieverRatePlan = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const { bselection } = Cache;
    const arrBrand = Cache.contract_list_available;
    const { sku_id } = Cache;
    let Contract_available = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'contractavailable');
        console.log('Index', Indexbrand);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.MaxisPostpaidStockavailability(event, true);
        }
        Contract_available = arrBrand[Indexbrand - 1];
        Cache.SelectedContractAvailable = Contract_available;
      }
      let API_ratePlan_list = null;
      // if (bselection == 1 || bselection == 2) {
      // console.log("we are in if loop API 1,2")
      // getRatePlanMaxisPostpaidTablet
      if (Cache.flowInfo == 'notifyMe') {
        API_ratePlan_list = await getRatePlanMaxisPostpaidTablet(sku_id);
      } else if (bselection == 2) {
        API_ratePlan_list = await getRatePlanMaxisPostpaidTablet(sku_id);
      } else if (bselection == 1) {
        API_ratePlan_list = await getRatePlanMaxisPostpaid(sku_id, Contract_available);
      } else if (bselection == 3) {
        API_ratePlan_list = await getRatePlanMaxisPostpaidwear(sku_id, Contract_available);
      }
      console.log('API RatePlanList:', API_ratePlan_list);
      console.log('type API RatePlanList:', typeof API_ratePlan_list);
      const Cacheplanlist = await client.get(redisData.getMaxisRatePlans('PrincipalSupplementary'));
      console.log('type RatePlanList:', typeof Cacheplanlist);

      let CommonRatePlans = redisData.GetCommonPlans(JSON.parse(Cacheplanlist), API_ratePlan_list);
      console.log('RatePlanList:', CommonRatePlans);
      CommonRatePlans = CommonRatePlans.reverse();
      CommonRatePlans.push(CommonRatePlans.shift());
      Cache.ratePlan_list = CommonRatePlans;
      await SESSION.SetCache(sessionID, Cache);
      ratePlanMenu = UTIL.GetNumberedMenu(CommonRatePlans);
      const returnParam = { ratePlanMenu }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_RatePlanSelectionByBrand');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_RatePlanSelectionByBrand', returnParam);
    }
    CommonRatePlans = Cache.ratePlan_list;
    ratePlanMenu = UTIL.GetNumberedMenu(CommonRatePlans);
    const returnParam = { ratePlanMenu }; if (isFallBack) AssignFallBack(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_RatePlanSelectionByBrand');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_RatePlanSelectionByBrand', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostPaidSkuSummary = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = Cache.ratePlan_list;
    // let arrBrand = JSON.parse(Cache["ratePlan_list"]);
    const brandName = Cache.SelectedBrand;
    const modelName = Cache.SelectedModel;
    const Storage = Cache.SelectedCapacity;
    let color = Cache.SelectedColor;
    color = Proper(color.trim());
    const ContractSelected = Cache.SelectedContractAvailable;
    let ratePlanName = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack != true) {
      if (isFallBack == false) {
        const Indexbrand = UTIL.GetParameterValue(event, 'ratePlanNumber');
        console.log('Index', Indexbrand);
        // VALIDATION: go back to brand if brand index is outside range
        if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
          return exports.MaxisPostpaidRetrieverRatePlan(event, true);
        }
        ratePlanName = arrBrand[Indexbrand - 1];
        Cache.SelectedRatePlan = ratePlanName;
        const SkuSummary = {
          DeviceName: `${brandName}-${modelName}`,
          DeviceCapacity: Storage,
          DeviceColor: color,
          ContractType: ContractSelected,
          RatePlan: ratePlanName,
        };
        Cache.SkuSummary = SkuSummary;
        Cache.flowInfo = '';
        await SESSION.SetCache(sessionID, Cache);

        ratePlanName = Cache.SelectedRatePlan;
        const returnParam = {
          brandName, modelName, contractName: ContractSelected, CapacityName: Storage, color, ratePlanName,
        }; if (isFallBack) AssignFallBack(returnParam);
        await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SKUByBrand');
        await SESSION.SetIdlelastEventParam(sessionID, returnParam);
        return UTIL.ComposeResult('', 'Maxis_Postpaid_SKUByBrand', returnParam);
      }
    } else {
      Cache.flowInfo = '';
      await SESSION.SetCache(sessionID, Cache);
      ratePlanName = Cache.SelectedRatePlan;
      const returnParam = {
        brandName, modelName, contractName: ContractSelected, CapacityName: Storage, color, ratePlanName,
      }; if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'Maxis_Postpaid_SKUByBrand');
      await SESSION.SetIdlelastEventParam(sessionID, returnParam);
      return UTIL.ComposeResult('', 'Maxis_Postpaid_SKUByBrand', returnParam);
    }
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»', err);
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MenuTriggering = async function (event, isFallBack = false) {
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-Botsales');

  const { bselection } = Cache;
  if (isFallBack != true) {
    if (isFallBack == false) {
      const IndexCheckout = UTIL.GetParameterValue(event, 'CheckoutNumber');

      // VALIDATION: go back to brand if brand index is outside range
      if (isNaN(IndexCheckout) || IndexCheckout <= 0 || IndexCheckout != 1) {
        return exports.MaxisPostPaidSkuSummary(event, true);
      }
      returnParam = ''; if (isFallBack) AssignFallBack(returnParam);
      console.log('bselection in menu triggering', bselection);
      if (bselection == 1) {
        await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Device_CheckOut');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Device_CheckOut');
      } if (bselection == 2 || bselection == 3) {
        await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact');
        await SESSION.SetIdlelastEventParam(sessionID, '');
        return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact');
      }
    }
    returnParam = ''; if (isFallBack) AssignFallBack(returnParam);
    console.log('bselection in menu triggering', bselection);
    if (bselection == 1) {
      await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Device_CheckOut');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Device_CheckOut');
    } if (bselection == 2 || bselection == 3) {
      await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact');
    }
  }
};
// -------------------Bot sales Flow----------------------------//
exports.DeviceTelesales = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-Botsales');
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact');
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};
exports.MainMenuMaxis = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-Botsales');
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_PostpaidBroadband_Menu');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_PostpaidBroadband_Menu');
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};
exports.MaxisPostPaidDeviceURL = async function (event, isFallBack = false) {
  try {
    let deviceType = '';
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const { bselection } = Cache;
    const brandName = Cache.SelectedBrand;
    const modelName = Cache.SelectedModel;
    let Contract = Cache.SelectedContractAvailable;
    Contract = Contract.replace('Normal Contract', 'K2');
    const Plan = Cache.SelectedRatePlan;
    const { sku_id } = Cache;
    if (bselection == 1) {
      deviceType = 'mobiles';
    } else if (bselection == 2) {
      deviceType = 'tablets';
    } else if (bselection == 3) {
      deviceType = 'wearables';
    }
    console.log('brand', brandName);
    console.log('model', modelName);
    console.log('skuid', sku_id);
    console.log('contract:', Contract);
    let Contracttype = '';
    let Contracttenure = '';
    let FinalContract = '';
    if (Contract != null) {
      // Contracttype = Contract.split(' ')[0];
      const contracttypeTemp = Contract.split(' ')[0];
      Contracttype = contracttypeTemp;
      // Contracttenure = Contract.split(' ')[1];
      const contracttenureTemp = Contract.split(' ')[1];
      Contracttenure = contracttenureTemp;
      FinalContract = Contracttype + Contracttenure;
      // FinalContract = FinalContract.split('-')[0];
      const finalContractTemp = FinalContract.split('-')[0];
      FinalContract = finalContractTemp;
    }
    console.log('finalContract', FinalContract);
    url = await UTIL.MaxisDeviceURL(deviceType, brandName, modelName, sku_id, Plan, FinalContract);
    console.log('url:', url);
    const returnParam = { urlDevice: url }; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Device_CheckOutLink', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostPaidMobileRatePlanPrincipal = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const result_rate_plan = await client.get(redisData.getMaxisRatePlans('Principal'));
    console.log('pricipal plans', result_rate_plan);
    Cache.mobileRatePlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);

    // let moblile_rate_plan_list  = result_rate_plan.map(e=>{return e});
    console.log(typeof result_rate_plan);
    console.log(typeof JSON.parse(result_rate_plan));
    console.log(JSON.parse(result_rate_plan));
    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));
    // moblile_rate_plan_list  = UTIL.GetNumberedMenu(result_rate_plan.map(e=>{return e}));
    console.log('logging rate plan list:', moblile_rate_plan_list);
    const returnParam = { principalPlan: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);
    console.log('logging parameters', returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Principal_PlanSelection');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);

    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Principal_PlanSelection', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};
exports.MaxisPostpaidStoreMobileRatePlanPrincipalRegisterType = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = JSON.parse(Cache.mobileRatePlanlist);
    let ratePlan = '';
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    if (isFallBack == false) {
      const Indexbrand = UTIL.GetParameterValue(event, 'ratePlanNumber');
      console.log('Index', Indexbrand);
      // VALIDATION: go back to brand if brand index is outside range
      if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
        return exports.MaxisPostPaidMobileRatePlanPrincipal(event, true);
      }
      ratePlan = arrBrand[Indexbrand - 1];
      Cache.Selected_mobileRatePlan = ratePlan;

      await SESSION.SetCache(sessionID, Cache);
      if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Principal_RegisterType');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Principal_RegisterType');
    }
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostPaidMobileRatePlanSupplementary = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    // let result_rate_plan =client.get(redisCache.Hotlink_Postpaid_Mobile_Plan_Key);
    const result_rate_plan = await client.get(redisData.getMaxisRatePlans('Supplementary'));
    // let result_rate_plan =[HotlinkPospaid-20,HotlinkPospaid-40];
    console.log(result_rate_plan);
    Cache.mobileRatePlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);

    // let moblile_rate_plan_list  = result_rate_plan.map(e=>{return e});
    console.log(typeof result_rate_plan);
    console.log(typeof JSON.parse(result_rate_plan));
    console.log(JSON.parse(result_rate_plan));
    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));
    // moblile_rate_plan_list  = UTIL.GetNumberedMenu(result_rate_plan.map(e=>{return e}));
    console.log('logging rate plan list:', moblile_rate_plan_list);
    const returnParam = { supplementaryPlan: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);
    console.log('logging parameters', returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Supplementary_PlanSelection');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Supplementary_PlanSelection', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostpaidStoreMobileRatePlanSupplementaryRegisterType = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    const arrBrand = JSON.parse(Cache.mobileRatePlanlist);
    console.log('mobileRatePlanlist', arrBrand);
    if (isFallBack == false) {
      const Indexbrand = UTIL.GetParameterValue(event, 'ratePlanNumber');
      console.log('Index', Indexbrand);
      // VALIDATION: go back to brand if brand index is outside range
      if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
        return exports.MaxisPostPaidMobileRatePlanSupplementary(event, true);
      }
      ratePlan = arrBrand[Indexbrand - 1];
      Cache.Selected_mobileRatePlan = ratePlan;

      console.log('Selected mobeil Rate plan in Cache:', ratePlan);
      await SESSION.SetCache(sessionID, Cache);
      console.log('logging parameters', ratePlan);
      if (isFallBack) AssignFallBack(returnParam);
      await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Supplementary_RegisterType');
      await SESSION.SetIdlelastEventParam(sessionID, '');
      return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Supplementary_RegisterType');
    }
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostPaidMobileRatePlanFamily = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    // let result_rate_plan =client.get(redisCache.Hotlink_Postpaid_Mobile_Plan_Key);
    const result_rate_plan = await client.get(redisData.getMaxisRatePlans('Family'));
    // let result_rate_plan =[HotlinkPospaid-20,HotlinkPospaid-40];
    console.log(result_rate_plan);
    Cache.mobileRatePlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);

    // let moblile_rate_plan_list  = result_rate_plan.map(e=>{return e});
    console.log(typeof result_rate_plan);
    console.log(typeof JSON.parse(result_rate_plan));
    console.log(JSON.parse(result_rate_plan));
    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));
    // moblile_rate_plan_list  = UTIL.GetNumberedMenu(result_rate_plan.map(e=>{return e}));
    console.log('logging rate plan list:', moblile_rate_plan_list);
    const returnParam = { familyPlan: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);
    console.log('logging parameters', returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Family_PlanSelection');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlan_Family_PlanSelection', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.RatePlanMenu = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_MobilePlanType');
  await SESSION.SetIdlelastEventParam(sessionID, '');
  return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlanType');
};

exports.RatePlanCheckOutMenu = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const RegisterType = UTIL.GetParameterValue(event, 'registerType');
  const Cache = await SESSION.GetCache(sessionID);
  Cache.registerType = RegisterType;
  await SESSION.SetCache(sessionID, Cache);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_MobilePlan_CheckOutCallbackOptions');
  await SESSION.SetIdlelastEventParam(sessionID, '');
  return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlan_CheckOutCallbackOptions');
};
exports.RatePlanTelesales1 = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const RegisterType = UTIL.GetParameterValue(event, 'registerType');
  const Cache = await SESSION.GetCache(sessionID);

  Cache.registerType = RegisterType;
  await SESSION.SetCache(sessionID, Cache);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  await SESSION.SetIdleLastEvent(sessionID, 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_DTS_PreferredContact');
  await SESSION.SetIdlelastEventParam(sessionID, '');
  return UTIL.ComposeResult('', 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_DTS_PreferredContact');
};
exports.RatePlanTelesales2 = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  await SESSION.SetIdleLastEvent(sessionID, 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_DTS_PreferredContact2');
  await SESSION.SetIdlelastEventParam(sessionID, '');
  return UTIL.ComposeResult('', 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_DTS_PreferredContact2');
};
exports.RatePlanFamilyTelesales = async function (event, isFallBack = false) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  const Cache = await SESSION.GetCache(sessionID);

  const arrBrand = JSON.parse(Cache.mobileRatePlanlist);

  console.log('mobileRatePlanlist', arrBrand);

  if (isFallBack == false) {
    const Indexbrand = UTIL.GetParameterValue(event, 'FamilyPlan');

    console.log('Index', Indexbrand);

    // VALIDATION: go back to brand if brand index is outside range

    if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
      return exports.MaxisPostPaidMobileRatePlanFamily(event, true);
    }
    ratePlan = arrBrand[Indexbrand - 1];

    Cache.Selected_mobileRatePlan = ratePlan;

    console.log('Selected mobeil Rate plan in Cache:', ratePlan);
    await SESSION.SetCache(sessionID, Cache);
    await SESSION.SetIdleLastEvent(sessionID, 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_Family_DTS_PreferredContact');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_Family_DTS_PreferredContact');
  }
};
exports.BroadbandPlanFiberTelesales = async function (event, isFallBack = false) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  const Cache = await SESSION.GetCache(sessionID);
  const arrBrand = JSON.parse(Cache.mobileRatePlanlist);
  console.log('mobileRatePlanlist', arrBrand);
  if (isFallBack == false) {
    const Indexbrand = UTIL.GetParameterValue(event, 'HomeFiber');
    console.log('Index', Indexbrand);
    // VALIDATION: go back to brand if brand index is outside range
    if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
      return exports.MaxisPostPaidBroadbandPlanHomeFiber(event, true);
    }
    ratePlan = arrBrand[Indexbrand - 1];
    Cache.Selected_mobileRatePlan = ratePlan;

    console.log('Selected mobeil Rate plan in Cache:', ratePlan);
    await SESSION.SetCache(sessionID, Cache);
    await SESSION.SetIdleLastEvent(sessionID, 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_BroadbandHome_DTS_PreferredContact');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_BroadbandHome_DTS_PreferredContact');
  }
};
exports.FiberMenu = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_BroadbandHomeFibre_PlanSelection');
  await SESSION.SetIdlelastEventParam(sessionID, '');
  return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_BroadbandHomeFibre_PlanSelection');
};

exports.BroadbandPlanFamilyTelesales = async function (event, isFallBack = false) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  const Cache = await SESSION.GetCache(sessionID);

  const arrBrand = JSON.parse(Cache.mobileRatePlanlist);

  console.log('mobileRatePlanlist', arrBrand);

  if (isFallBack == false) {
    const Indexbrand = UTIL.GetParameterValue(event, 'FamilyPlan');

    console.log('Index', Indexbrand);

    // VALIDATION: go back to brand if brand index is outside range

    if (isNaN(Indexbrand) || Indexbrand <= 0 || Indexbrand > arrBrand.length) {
      return exports.MaxisPostPaidBroadbandPlanFamily(event, true);
    }
    ratePlan = arrBrand[Indexbrand - 1];

    Cache.Selected_mobileRatePlan = ratePlan;

    console.log('Selected mobeil Rate plan in Cache:', ratePlan);
    await SESSION.SetCache(sessionID, Cache);
    await SESSION.SetIdleLastEvent(sessionID, 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_FamilyPlan_DTS_PreferredContact');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_FamilyPlan_DTS_PreferredContact');
  }
};
exports.BroadbandPlanWifiCheckout = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  Cache.Selected_mobileRatePlan = 'Maxis Home 4G Wifi';
  console.log('RatePan', JSON.stringify(Cache));
  await SESSION.SetCache(sessionID, Cache);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Device_CheckOut2');
  await SESSION.SetIdlelastEventParam(sessionID, '');
  return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Device_CheckOut2');
};

exports.BroadbandPlanWifiTelesales = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
  if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
  }
  await SESSION.SetIdleLastEvent(sessionID, 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact2');
  await SESSION.SetIdlelastEventParam(sessionID, '');
  return UTIL.ComposeResult('', 'MultiCampaign_DiscoverMaxisProductServices_Postpaid_Device_DTS_PreferredContact2');
};
exports.MaxisPostPaidBroadbandPlanHomeFiber = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const result_rate_plan = await client.get(redisData.getMaxisBroadbandPlans('Home Fibre_Plan'));
    console.log(result_rate_plan);
    Cache.mobileRatePlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);

    console.log(typeof result_rate_plan);

    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));
    console.log('logging rate plan list:', moblile_rate_plan_list);
    const returnParam = { fiberPlan: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);
    console.log('logging parameters', returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_HomeFibre_PlanType');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_HomeFibre_PlanType', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostPaidBroadbandPlan4GWifi = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    // let result_rate_plan =client.get(redisCache.Hotlink_Postpaid_Mobile_Plan_Key);
    const result_rate_plan = await client.get(redisData.getMaxisBroadbandPlans('Home 4G Wifi_Plan'));
    // let result_rate_plan =[HotlinkPospaid-20,HotlinkPospaid-40];
    console.log(result_rate_plan);

    console.log('plan modified', result_rate_plan);
    Cache.mobileRatePlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);

    // let moblile_rate_plan_list  = result_rate_plan.map(e=>{return e});
    console.log(typeof result_rate_plan);
    console.log(typeof JSON.parse(result_rate_plan));
    console.log(JSON.parse(result_rate_plan));
    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));
    // moblile_rate_plan_list  = UTIL.GetNumberedMenu(result_rate_plan.map(e=>{return e}));
    console.log('logging rate plan list:', moblile_rate_plan_list);
    const returnParam = { broadbandPlan: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);
    console.log('logging parameters', returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_Broadband_PlanType');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_Broadband_PlanType', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostPaidBroadbandPlanFamily = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSalesFiber');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const Cache = await SESSION.GetCache(sessionID);
    const result_rate_plan = await client.get(redisData.getMaxisBroadbandPlans('MaxisPostpaid_Broadband_Family_Plans'));
    console.log(result_rate_plan);
    Cache.mobileRatePlanlist = result_rate_plan;
    await SESSION.SetCache(sessionID, Cache);
    // let moblile_rate_plan_list  = result_rate_plan.map(e=>{return e});
    console.log(typeof result_rate_plan);
    console.log(typeof JSON.parse(result_rate_plan));
    console.log(JSON.parse(result_rate_plan));
    const moblile_rate_plan_list = UTIL.GetNumberedMenu(JSON.parse(result_rate_plan));
    // moblile_rate_plan_list  = UTIL.GetNumberedMenu(result_rate_plan.map(e=>{return e}));
    console.log('logging rate plan list:', moblile_rate_plan_list);
    const returnParam = { broadbandfamilyPlan: moblile_rate_plan_list }; if (isFallBack) AssignFallBack(returnParam);
    console.log('logging parameters', returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'DiscoverMaxisProductServices_Postpaid_BroadbandHome_Family_PlanType');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_BroadbandHome_Family_PlanType', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxisPostpaidPlansLeadCreation = async function (event) {
  let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
  inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetMSISDN(sessionID, inputMsisdn);

  let msisdn = UTIL.GetMSISDN(event);
  if (msisdn == process.env.MSISDN) {
    msisdn = await SESSION.GetMSISDN(sessionID);
  }

  console.log(`this is the captured msisdn -> ${msisdn}`);

  const Cache = await SESSION.GetCache(sessionID);
  const SelectedPlan = Cache.Selected_mobileRatePlan;
  const LeadCatalogID = 'PRD1000980';
  const PlanType = 'Maxis RatePlans';
  let RegisterType = Cache.registerType;
  console.log('Type', typeof RegisterType);
  if (RegisterType == 1) {
    RegisterType = 'Sign up for new number';
  }
  if (RegisterType == 2) {
    RegisterType = 'Switch to Maxis and keep your existing number';
  }
  if (RegisterType == 3) {
    RegisterType = 'Upgrade from Hotlink Postpaid';
  }
  if (RegisterType == 4) {
    RegisterType = 'Upgrade from Hotlink Prepaid';
  }
  const IntentName = 'MaxbotIdle.DiscoverMaxisProductServices.Postpaid.MobilePlan.DTS.PreferredContact';
  const SkuSummary = 'N/A';
  // let lmsstatus = await lmscreateLeadRatePlans(msisdn, LeadCatalogID,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)
  await lmscreateLeadRatePlansApi(msisdn, LeadCatalogID, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'MultiCampaign.DiscoverMaxisProductServices.Postpaid.MobilePlan.DTS.Callback.END', 'Bypass Bot - DiscoverMaxisProductServices.MaxisPostpaid.Device.DTS.Preferred Contact-Whp-LMS', sessionID);
  return UTIL.ComposeResult('', 'lms_creation_inprogress');
  // console.log("status lms",lmsstatus);
  // if (lmsstatus == true) {
  //   console.log("going in if loop lms");
  //   return UTIL.ComposeResult("", "MultiCampaign_DiscoverMaxisProductServices_Postpaid_MobilePlan_DTS_Callback_END");
  // }
  // else {
  //   console.log("going in else loop lms");
  //   return UTIL.ComposeResult("", "Bypass_Plans_LMS");
  // }
};

exports.RateplanFamilyLMS = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const msisdn = UTIL.GetMSISDN(event);
  const Cache = await SESSION.GetCache(sessionID);
  const SelectedPlan = Cache.Selected_mobileRatePlan;
  const LeadCatalogID = 'PRD1000980';
  const PlanType = 'Maxis Rateplan';
  const RegisterType = 'N/A';
  const IntentName = 'MaxbotIdle.DiscoverMaxisProductServices.Postpaid.MobilePlan.DTS.PreferredContact';
  const SkuSummary = 'N/A';
  // let lmsstatus = await lmscreateLeadRatePlans(msisdn, LeadCatalogID,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)

  // if (lmsstatus == true) {
  //   return UTIL.ComposeResult("", "MultiCampaign_DiscoverMaxisProductServices_Postpaid_BroadbandHome_DTS_Callback_END");
  // }
  // else {
  //   return UTIL.ComposeResult("", "Bypass_Broadband_LMS");
  // }
  const lmsstatus = await lmscreateLeadRatePlansApi(msisdn, LeadCatalogID, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'MultiCampaign.DiscoverMaxisProductServices.Postpaid.BroadbandHome.DTS.Callback.END', 'Bypass Bot - DiscoverMaxisProductServices.MaxisPostpaid.Device.DTS.Preferred Contact-Whp-LMS', sessionID);
  return UTIL.ComposeResult('', 'lms_creation_inprogress');
};
exports.MaxisPostpaidBroadbandLeadCreation = async function (event) {
  let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
  inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
  const sessionID = UTIL.GetSessionID(event);
  await SESSION.SetMSISDN(sessionID, inputMsisdn);

  let msisdn = UTIL.GetMSISDN(event);
  if (msisdn == process.env.MSISDN) {
    msisdn = await SESSION.GetMSISDN(sessionID);
  }

  console.log(`this is the captured msisdn -> ${msisdn}`);

  const Cache = await SESSION.GetCache(sessionID);
  const SelectedPlan = Cache.Selected_mobileRatePlan;
  const LeadCatalogID = 'PRD1000981';
  const PlanType = 'Maxis Broadband';
  const RegisterType = 'N/A';
  const IntentName = 'MaxBotIdle.DiscoverMaxisProductServices.Postpaid.BroadbandHome.DTS.Callback.END.Query';
  const SkuSummary = 'N/A';
  const lmsstatus = await lmscreateLeadRatePlansApi(msisdn, LeadCatalogID, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'MultiCampaign.DiscoverMaxisProductServices.Postpaid.BroadbandHome.DTS.Callback.END', 'Bypass Bot - DiscoverMaxisProductServices.MaxisPostpaid.BradbandPlan.TeleSalesAgent.LMS', sessionID);
  return UTIL.ComposeResult('', 'lms_creation_inprogress');
  // let lmsstatus = await lmscreateLeadRatePlans(msisdn, LeadCatalogID,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)

  // if (lmsstatus == true) {
  //   return UTIL.ComposeResult("", "MultiCampaign_DiscoverMaxisProductServices_Postpaid_BroadbandHome_DTS_Callback_END");
  // }
  // else {
  //   return UTIL.ComposeResult("", "Bypass_Broadband_LMS");
  // }
};

exports.MaxisPostpaidDevicesLeadCreation = async function (event) {
  try {
    let inputMsisdn = UTIL.GetParameterValue(event, 'msisdn').toString();
    inputMsisdn = inputMsisdn.startsWith('01') ? `6${inputMsisdn}` : inputMsisdn;
    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn);

    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID);
    }

    console.log(`this is the captured msisdn -> ${msisdn}`);

    const Cache = await SESSION.GetCache(sessionID);

    const PlanType = 'N/A';
    const SelectedPlan = Cache.SelectedRatePlan;
    const RegisterType = 'N/A';
    const IntentName = 'MaxbotIdle.MultiCampaign.DiscoverMaxisProductServices.Postpaid.Device.DTS.PreferredContact';

    let { SkuSummary } = Cache;

    if (SkuSummary == null) {
      const leadCatId = 'PRD1000982';
      await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'MultiCampaign.DiscoverMaxisProductServices.Postpaid.Device.DTS.Callback.END', 'Bypass Bot - DiscoverMaxisProductServices.MaxisPostpaid.BradbandPlan.TeleSalesAgent.LMS', sessionID);
      return UTIL.ComposeResult('', 'lms_creation_inprogress');
    }
    SkuSummary = JSON.stringify(SkuSummary);
    SkuSummary = SkuSummary.replace(/,/g, '|');
    const leadCatId = 'PRD1000982';
    await lmscreateLeadApi(msisdn, leadCatId, PlanType, SelectedPlan, RegisterType, IntentName, SkuSummary, 'MultiCampaign.DiscoverMaxisProductServices.Postpaid.Device.DTS.Callback.END', 'DiscoverMaxisProductServices.MaxisPostpaid.Device.DTS.Preferred Contact-Whp-LMS1', sessionID);
    return UTIL.ComposeResult('', 'lms_creation_inprogress');

    // lmsStatus = await lmscreateLead(msisdn, leadCatId,PlanType,SelectedPlan,RegisterType,IntentName,SkuSummary)
    // console.log("LMS Status",lmsStatus)
    // if (lmsStatus == true) {
    //   return UTIL.ComposeResult("", "MultiCampaign_DiscoverMaxisProductServices_Postpaid_Device_DTS_Callback_END");
    // }

    // else {
    //   return UTIL.ComposeResult("", "Bypass_Plans_LMS");
    // }
  } catch (err) {
    console.log('Discovery Brand Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

exports.MaxispostpaidURL = async function (event) {
  try {
    const sessionID = UTIL.GetSessionID(event);

    const Cache = await SESSION.GetCache(sessionID);
    const ratePlan = Cache.Selected_mobileRatePlan;
    console.log('Wifi', ratePlan);
    const intention = 1;
    console.log('Selected Rate Plan:', ratePlan);
    url = await UTIL.configURLMaxis(ratePlan, intention);
    console.log('url', url);
    const returnParam = { urlPrincipal: url };
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Postpaid_MobilePlan_CheckOut', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error Ã°Å¸â€Â»');
    console.log(err);
    return UTIL.ComposeResult('', MaxisTechIssueEnd());
  }
};

// -----------------------------------------------//
//              Hotlink Prepaid                  //
// ----------------------------------------------//

exports.MaxBotIdleDiscoverMaxisProductServices_HotlinkPrepaidMenu_Input = async function (event) {
  try {
    console.log('working for MaxBotIdleDiscoverMaxisProductServices_HotlinkPrepaidMenu_Input*****');

    const sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-PrepaidMobileRatePlan');
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPrepaidMenu');
    await SESSION.SetIdlelastEventParam(sessionID, '');
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPrepaidMenu');
  } catch (err) {
    console.log('Discovery Brand Error for here');
    console.log(err);
    return UTIL.ComposeResult('', HotlinkTechIssueEnd());
  }
};

exports.MaxBotIdleHotlinkPrepaidMobileRatePlanInfo = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-PrepaidMobileRatePlan');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const MobilePlan = redisCache.Hotlink_Prepaid_Mobile_Plan_Key;
    const Plans = await client.get(MobilePlan);
    console.log('Plans', typeof Plans);
    console.log(Plans);
    const listArray = [];
    JSON.parse(Plans).map((item, index) => {
      listArray.push(item);
    });
    console.log('listArray', listArray);
    Cache.Hotlink_Prepaid_Mobile_Plan_Key = listArray;
    await SESSION.SetCache(sessionID, Cache);
    const result = UTIL.GetNumberedMenu(listArray);
    console.log('result', result);
    const returnParam = { PlanMenu: result }; if (isFallBack) AssignFallBack(returnParam);
    console.log(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPrepaid_PlanType');
    console.log('idle');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPrepaid_PlanType', returnParam);
  } catch (err) {
    console.log('Mobile RatePlan Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPrepaid__MobileRatePlanHotlinkPrepaid_SystemError');
  }
};
// Switch to Hotlink
exports.MaxBotIdleHotlinkPrepaidSwitchInfo = async function (event, isFallBack = false) {
  try {
    const sessionID = UTIL.GetSessionID(event);
    const Cache = await SESSION.GetCache(sessionID);
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-PrepaidMobileRatePlan');
    if (event.queryResult.queryText === 'Shared.Idle.AgentAssist') {
      return UTIL.ComposeResult('', 'Shared_Idle_AgentAssist');
    }
    const SwitchInfo = redisCache.Hotlink_Prepaid_Switch_Plan_Key;
    const Plans = await client.get(SwitchInfo);
    console.log('Plans', typeof Plans);
    console.log(Plans);
    const HotlinkPrepaidSwitch = JSON.parse(Plans).map((item, index) => `${item}`);
    Cache.Hotlink_Prepaid_Switch_Plan_Key = HotlinkPrepaidSwitch;
    await SESSION.SetCache(sessionID, Cache);
    const result = UTIL.GetNumberedMenu(HotlinkPrepaidSwitch);
    const returnParam = { SwitchMenu: result }; if (isFallBack) AssignFallBack(returnParam);
    console.log(returnParam);
    await SESSION.SetIdleLastEvent(sessionID, 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPrepaid__SwitchtoHotlinkPrepaid');
    console.log('Idle');
    await SESSION.SetIdlelastEventParam(sessionID, returnParam);
    return UTIL.ComposeResult('', 'MaxBotIdle_DiscoverMaxisProductServices_HotlinkPrepaid__SwitchtoHotlinkPrepaid', returnParam);
  } catch (err) {
    console.log('Switch Error ðŸ”»');
    console.log(err);
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_HotlinkPrepaid__SwitchtoHotlinkPrepaid_SystemError');
  }
};
// URL
exports.DiscoverMaxisProductServices_HotlinkPrepaidPlanType_wh = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await SESSION.GetCache(sessionID);
  const PlanName = Cache.Hotlink_Prepaid_Mobile_Plan_Key;
  const PlanSelect = UTIL.GetParameterValue(event, 'PlanSelection');
  if (PlanName.length >= PlanSelect) {
    console.log('PlanSelect', PlanSelect);
    const SelectedPlan = PlanName[PlanSelect - 1];
    const url = await UTIL.configURL(SelectedPlan, 1, 'prepaidPlans');
    const returnParam = { url };
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Prepaid_MobilePlan_CheckOut', returnParam);
  }
  console.log('false intent');
  // return UTIL.ComposeResult("","DiscoverMaxisProductServices_HotlinkPrepaid_RatePlansError", returnParam)
  return exports.MaxBotIdleHotlinkPrepaidMobileRatePlanInfo(event, true);
};

exports.DiscoverMaxisProductServices_HotlinkPrepaidSwitchtoHotlinkPrepaid_wh = async function (event) {
  const sessionID = UTIL.GetSessionID(event);
  const Cache = await (sessionID);
  const PlanName = Cache.Hotlink_Prepaid_Switch_Plan_Key;
  const SwitchSelect = UTIL.GetParameterValue(event, 'SwitchSelection');
  if (PlanName.length >= SwitchSelect) {
    console.log('SwitchSelect', SwitchSelect);
    // let planName = ["Prepaid Fast", "UNLIMITED INTERNET"]; Prepaid Unlimited
    const SelectedPlan = PlanName[SwitchSelect - 1];
    console.log('SelectedPlan', SelectedPlan);
    const url = await UTIL.configURL(SelectedPlan, 2, 'prepaidPlans');
    console.log('url>>>>>>>>>>>', url);
    console.log('url', url);
    const returnParam = { url };
    return UTIL.ComposeResult('', 'DiscoverMaxisProductServices_Prepaid_SwitchtoHotlink_CheckOut', returnParam);
  }
  console.log('false switch');
  // return UTIL.ComposeResult("","DiscoverMaxisProductServices_HotlinkPrepaid_SwitchError")
  return exports.MaxBotIdleHotlinkPrepaidSwitchInfo(event, true);
};

exports.DeviceDiscoveryClosure = async function (event) {
  return UTIL.ComposeResult('', 'DeviceDiscovery_Closure2');
};
