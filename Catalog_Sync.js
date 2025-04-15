const loadsh = require('lodash');
const redis = require('redis');
const constants = require('./CacheConstants');
const util = require('./CacheUtil');

// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fetch = (...args) => import('node-fetch').then(({ default: fetchs }) => fetchs(...args));
const HOST = require('./Handler_Host');

const PLAN_NAME_PRINCIPAL = 'Principal';
const PLAN_NAME_SUPLEMENTARY = 'Supplementary';
const PLAN_NAME_FAMILY = 'Family';
const PLAN_NAME_PRINCIPAL_SUPLEMENTARY = 'PrincipalSupplementary';
const PLAN_NAME_HOME_FIBRE = 'Home Fibre_Plan';
const PLAN_NAME_HOME_4G_WIFI = 'Home 4G Wifi_Plan';
const PLAN_NAME_HOME_WIFI = 'home-wifi';
const HOT_LINK_FIBRE_Broadband_PLANS = ['Maxis Fibre 800Mbps', 'Maxis Fibre 500Mbps', 'Maxis Fibre 300Mbps', 'Maxis Fibre 100Mbps', 'Maxis Fibre 30Mbps'];
const HOT_LINK_FIBRE_Bundled_PLANS = ['Hotlink Postpaid 60 + Maxis Fibre 800Mbps', 'Hotlink Postpaid 60 + Maxis Fibre 500Mbps', 'Hotlink Postpaid 60 + Maxis Fibre 300Mbps', 'Hotlink Postpaid 60 + Maxis Fibre 100Mbps', 'Hotlink Postpaid 60 + Maxis Fibre 30Mbps'];
const CACHE_EXPIRY_HOURS = 25;
const CACHE_EXPIRY_DURATION = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

//= =================================== MAXIS PRINCIPAL PLANS ===================================================
async function getPrincipalPlans(PrincipalPlans) {
  console.log('processing mobile principal plans');
  const requestOptions = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
    redirect: 'follow',
  };
  const maxisMobilePlans = await fetch(`${HOST.HOTLINK_POSTPAID_DEVICES_MVP4[HOST.TARGET]}/prodcatalog/api/v4.0/plans?familyType=MOP&bundleType=NA&serviceType=GSM`, requestOptions);
  const maxisMobileData = await maxisMobilePlans.json();
  const apiresList = maxisMobileData.responseData.plan.map((plan) => ({
    planName: plan.name,
    planId: `${plan.uxfAttributes.productSpecRelationId}_${plan.uxfAttributes.billingOfferId}`,
  }));
  return util.GetCommonPlans(PrincipalPlans, apiresList);
}

//= ================================== Maxis Family PLANS=======================================================
async function getFamilyPlans(familyPlans) {
  console.log('processing mobile family plans');
  const requestOptions = {
    method: 'GET',
    headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' },
    redirect: 'follow',
  };
  const maxisMobilePlans = await fetch(`${HOST.HOTLINK_POSTPAID_DEVICES_MVP4[HOST.TARGET]}/prodcatalog/api/v4.0/plans?familyType=MXSFAMILY&bundleType=ONEFAMILY&serviceType=GSM`, requestOptions);
  const maxisMobileData = await maxisMobilePlans.json();
  const apiresList = maxisMobileData.responseData.plan.map((plan) => ({
    planName: plan.name,
    planId: `${plan.uxfAttributes.productSpecRelationId}_${plan.uxfAttributes.billingOfferId}`,
  }));
  return util.GetCommonPlans(familyPlans, apiresList);
}

// ==================================   URL for Maxis mobile plans  ==========================================

async function getMaxisMobilePlans(client) {
  console.log('Processing Maxis mobile plans', `${HOST.MAXIS_MOBILE_PLANS[HOST.TARGET]}`);
  const maxisMobile = await fetch(`${HOST.MAXIS_MOBILE_PLANS[HOST.TARGET]}`);
  const maxisMobileData = await maxisMobile.json();
  const plans = maxisMobileData.plansList;
  const mobilePlans = {
    Principal: [], Supplementary: [], Family: [], PrincipalSupplementary: [],
  };

  for (const index in plans) {
    const plan = plans[index].planDetails;
    if (plan.isNotCommerce == 'false' || plan.isNotCommerce == undefined) {
      if (plan.isSupplementary == 'true' && plan.isFamilyPlan == undefined) {
        mobilePlans.Supplementary.push(plans[index].planGroup);
      } else if (plan.isSupplementary == 'false' && plan.isFamilyPlan == undefined) {
        mobilePlans.Principal.push({
          planName: plans[index].planGroup,
          planId: plans[index].planId,
        });
      } else if (plan.isFamilyPlan == 'true' && plan.isSupplementary == undefined) {
        mobilePlans.Family.push({
          planName: plans[index].planGroup,
          planId: plans[index].planId,
        });
      }
    }
    if ((plan.isNotCommerce == 'false' || plan.isNotCommerce == undefined) && (plan.isSupplementary == 'true' || plan.isSupplementary == 'false') && (plan.isFamilyPlan == undefined)) {
      mobilePlans.PrincipalSupplementary.push({
        planName: plans[index].planGroup,
        planId: plans[index].planId,
      });
    }
  }

  const principalPlanList = await getPrincipalPlans(mobilePlans.Principal);
  const FamilyPlansList = await getFamilyPlans(mobilePlans.Family);

  client.set(util.getMaxisRatePlans(PLAN_NAME_PRINCIPAL), JSON.stringify(principalPlanList.reverse()));
  client.expire(util.getMaxisRatePlans(PLAN_NAME_PRINCIPAL), CACHE_EXPIRY_DURATION);
  client.set(util.getMaxisRatePlans(PLAN_NAME_SUPLEMENTARY), JSON.stringify(mobilePlans.Supplementary));
  client.expire(util.getMaxisRatePlans(PLAN_NAME_SUPLEMENTARY), CACHE_EXPIRY_DURATION);
  client.set(util.getMaxisRatePlans(PLAN_NAME_FAMILY), JSON.stringify(FamilyPlansList));
  client.expire(util.getMaxisRatePlans(PLAN_NAME_FAMILY), CACHE_EXPIRY_DURATION);
  client.set(util.getMaxisRatePlans(PLAN_NAME_PRINCIPAL_SUPLEMENTARY), JSON.stringify(mobilePlans.PrincipalSupplementary));
  client.expire(util.getMaxisRatePlans(PLAN_NAME_PRINCIPAL_SUPLEMENTARY), CACHE_EXPIRY_DURATION);
}

// ========================================== URL for maxis Fiber plans =========================================

async function getMaxisFibrePlans(client) {
  console.log('Processing Maxis fibre plans');
  const maxisFibre = await fetch(`${HOST.MAXIS_FIBRE_PLANS[HOST.TARGET]}`);
  const maxisFibreData = await maxisFibre.json();
  const plans = maxisFibreData.plansList;
  const fiberPlans = { HomeFibre: [], Home4GWifi: [] };

  for (const index in plans) {
    const plan = plans[index].planDetails;
    if (plan.deviceType != PLAN_NAME_HOME_WIFI) fiberPlans.HomeFibre.push(plans[index].planGroup);
    else fiberPlans.Home4GWifi.push(plans[index].planGroup);
  }
  client.set(util.getMaxisBroadbandPlans(PLAN_NAME_HOME_FIBRE), JSON.stringify(fiberPlans.HomeFibre.reverse()));
  client.expire(util.getMaxisBroadbandPlans(PLAN_NAME_HOME_FIBRE), CACHE_EXPIRY_DURATION);
  client.set(util.getMaxisBroadbandPlans(PLAN_NAME_HOME_4G_WIFI), JSON.stringify(fiberPlans.Home4GWifi));
  client.expire(util.getMaxisBroadbandPlans(PLAN_NAME_HOME_4G_WIFI), CACHE_EXPIRY_DURATION);
}

//= =========================================== URL for HOtlink Postpaid mobile plans ================================
async function getHotlinkPostpaidMobilePlans(client) {
  console.log('Processing Hotlink Postpaid mobile plans');
  const hotlinkPostpaidMobile = await fetch(`${HOST.HOTLINK_POSTPAID_MOBILE_PLANS[HOST.TARGET]}`);
  const hotlinkPostpaidMobileData = await hotlinkPostpaidMobile.json();
  const hotlinkFlexPlans = hotlinkPostpaidMobileData.plansList;
  const flexPlans = { Plans: [], PlanDetails: [] };

  for (const index in hotlinkFlexPlans) {
    flexPlans.Plans.push(hotlinkFlexPlans[index].planGroup);
    flexPlans.PlanDetails.push({
      planName: hotlinkFlexPlans[index].planGroup,
      planId: hotlinkFlexPlans[index].planId,
    });
  }

  client.set(constants.Hotlink_Postpaid_Mobile_Plan_Key, JSON.stringify(flexPlans.Plans.reverse()));
  client.expire(constants.Hotlink_Postpaid_Mobile_Plan_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Hotlink_Postpaid_Mobile_Plan_Details_Key, JSON.stringify(flexPlans.PlanDetails));
  client.expire(constants.Hotlink_Postpaid_Mobile_Plan_Details_Key, CACHE_EXPIRY_DURATION);
}

//= =========================================== URL for Hotlink Postpaid Fibre  Broadband  Plans ================================

async function getHotlinkPostpaidFibreBroadbandPlans(client) {
  console.log('Processing Hotlink Postpaid fibre plans');
  client.set(constants.Hotlink_Postpaid_Fibre_Broadband_Plan_key, JSON.stringify(HOT_LINK_FIBRE_Broadband_PLANS.reverse()));
  client.expire(constants.Hotlink_Postpaid_Fibre_Broadband_Plan_key, CACHE_EXPIRY_DURATION);
}

//= =========================================== URL for Hotlink Postpaid Fibre  Bundled  Plans ================================

async function getHotlinkPostpaidFibreBundledPlans(client) {
  console.log('Processing Hotlink Postpaid fibre plans');
  client.set(constants.Hotlink_Postpaid_Fibre_Bundled_Plan_key, JSON.stringify(HOT_LINK_FIBRE_Bundled_PLANS.reverse()));
  client.expire(constants.Hotlink_Postpaid_Fibre_Bundled_Plan_key, CACHE_EXPIRY_DURATION);
}

//= ========================================== URL for Hotlink Prepaid Rate Plans =================================================

async function getHotlinkPostpaidRatePlans(client) {
  console.log('Processing Hotlink Prepaid mobile plans');
  const hotlinkPrepaidRate = await fetch(`${HOST.HOTLINK_PREPAID_RATE_PLANS[HOST.TARGET]}`);
  const hotlinkPrepaidRateData = await hotlinkPrepaidRate.json();
  const hotlinkPrepaidMobilePlans = hotlinkPrepaidRateData.plansList;
  const prepaidPlans = { Plans: [] };
  for (const index in hotlinkPrepaidMobilePlans) {
    if (!hotlinkPrepaidMobilePlans[index].planDetails.isPortIn) prepaidPlans.Plans.push(`Hotlink ${hotlinkPrepaidMobilePlans[index].planDetails.name}`);
  }
  client.set(constants.Hotlink_Prepaid_Mobile_Plan_Key, JSON.stringify(prepaidPlans.Plans));
  client.expire(constants.Hotlink_Prepaid_Mobile_Plan_Key, CACHE_EXPIRY_DURATION);
}

// ====================================== FOr option switch to HOtlink prepaid ======================================

async function getHotlinkprepaidSwitchPlans(client) {
  console.log('Processing Hotlink Prepaid switch plans');
  const hotlinkPrepaidSwitch = await fetch(`${HOST.HOTLINK_PREPAID_RATE_PLANS[HOST.TARGET]}`);
  const hotlinkPrepaidSwitchData = await hotlinkPrepaidSwitch.json();
  const hotlinkPrepaidSwitchPlans = hotlinkPrepaidSwitchData.plansList;
  const prepaidSwitchPlans = { Plans: [] };

  for (const index in hotlinkPrepaidSwitchPlans) {
    if (hotlinkPrepaidSwitchPlans[index].planDetails.isPortIn) prepaidSwitchPlans.Plans.push(`Hotlink ${hotlinkPrepaidSwitchPlans[index].planDetails.name}`);
  }
  client.set(constants.Hotlink_Prepaid_Switch_Plan_Key, JSON.stringify(prepaidSwitchPlans.Plans));
  client.expire(constants.Hotlink_Prepaid_Switch_Plan_Key, CACHE_EXPIRY_DURATION);
}

//= =============================================== stores =====================================================

async function getStores(client) {
  console.log('Processing stores data');
  const store = await fetch(`${HOST.STORES[HOST.TARGET]}`);
  const storesData = await store.json();
  const states = [];
  for (let i = 0; i < storesData.length; i++) {
    const stores = [];
    states.push(storesData[i].state);
    for (let j = 0; j < storesData[i].stores.length; j++) {
      if ((storesData[i].stores[j].realViewCode.startsWith('MC')) || (storesData[i].stores[j].realViewCode.startsWith('R'))) {
        stores.push(storesData[i].stores[j].realViewCode);
      }
    }
    client.set(util.getStoresByState(storesData[i].state), JSON.stringify(stores));
    client.expire(util.getStoresByState(storesData[i].state), CACHE_EXPIRY_DURATION);
  }
  client.set(constants.States_List_Key, JSON.stringify(states));
  client.expire(constants.States_List_Key, CACHE_EXPIRY_DURATION);
}

//= =============================================== getallMaxisStores =====================================================

async function getallMaxisStores(client) {
  console.log('Processing all maxis stores data');
  const store = await fetch(`${HOST.STORES[HOST.TARGET]}`);
  const storesData = await store.json();
  const stores = [];
  for (let i = 0; i < storesData.length; i++) {
    for (let j = 0; j < storesData[i].stores.length; j++) {
      if ((storesData[i].stores[j].realViewCode.startsWith('MC')) || (storesData[i].stores[j].realViewCode.startsWith('R'))) {
        stores.push(storesData[i].stores[j]);
      }
    }
  }
  client.set(constants.Store_List, JSON.stringify(stores));
  client.expire(constants.Store_List, CACHE_EXPIRY_DURATION);
}

//= ============================================MAXIS POSTPAID MODELS ================================================
async function getProductModelDetails(type, deviceBrand, deviceModel, client) {
  const maxisPostpaidDeviceCatalog = await fetch(`${HOST.MAXIS_POSTPAID_MODEL[HOST.TARGET]}/${type}/${deviceBrand}/${deviceModel}/jcr:content/root/responsivegrid/product_details.model.json`);

  if (maxisPostpaidDeviceCatalog != undefined && maxisPostpaidDeviceCatalog != '') {
    const maxisPostpaidDeviceCatalogData = await maxisPostpaidDeviceCatalog.json();
    const productDetails = JSON.parse(maxisPostpaidDeviceCatalogData.product_details);
    const product = productDetails[deviceModel];
    const modelName = productDetails[deviceModel].deviceTitle;
    const maxisStorages = JSON.stringify(productDetails[deviceModel].storages);
    client.set(util.getStoragesByMaxisModel(modelName), maxisStorages.toLocaleUpperCase());
    client.expire(util.getStoragesByMaxisModel(modelName), CACHE_EXPIRY_DURATION);

    const sizes = productDetails[deviceModel].storages;
    for (let size of sizes) {
      size = size.toUpperCase();
      let colours = loadsh.filter(product.pricingDetails, { storageType: size.toLowerCase() });
      colours = colours.map((colour) => {
        const selectedColour = product.colours[colour.colour].colourName;
        // logging SKUID based on colour and storage
        client.set(util.getSkuIdByMaxisDeviceSelection(modelName, size, selectedColour), JSON.stringify(colour.skuId));
        client.expire(util.getSkuIdByMaxisDeviceSelection(modelName, size, selectedColour), CACHE_EXPIRY_DURATION);

        return selectedColour;
      });
      // logging colours list based on storage selection
      client.set(util.getColoursByMaxisModelStorage(modelName, size), JSON.stringify(colours));
      client.expire(util.getColoursByMaxisModelStorage(modelName, size), CACHE_EXPIRY_DURATION);
    }
  }
}

// =========================================== MAXIS POSTPAID DEVIES======================================

async function getMaxisPostpaidDevices(client) {
  console.log('Processing Maxis postpaid devices data');
  const maxisPostpaidCatalog = await fetch(`${HOST.MAXIS_POSTPAID_DEVICES[HOST.TARGET]}`);
  const maxisPostpaidCatalogData = await maxisPostpaidCatalog.json();
  const devicesList = maxisPostpaidCatalogData.results;
  const list = [];
  const maxisPostpaidDevices = {
    mobiles_brand: [],
    mobiles_promo: [],
    mobiles_contract: [],
    tablets_brand: [],
    tablets_promo: [],
    tablets_contract: [],
    wearables_brand: [],
    wearables_promo: [],
    wearables_contract: [],
  };
  for (const index in devicesList) {
    if (devicesList[index].isPreOrder == false && devicesList[index].hideDevice == false && devicesList[index].hideOnPLP == false
      && (devicesList[index].deviceType == 'mobiles' || devicesList[index].deviceType == 'wearables' || devicesList[index].deviceType == 'tablets')) {
      list.push(devicesList[index]);
    }
  }
  for (const index in list) {
    const brandAndModel = `${list[index].brandTitle} - ${list[index].deviceTitle}`;
    client.set(util.getImagePathByBrandAndModel(brandAndModel), JSON.stringify(list[index].imagePath));
    client.expire(util.getImagePathByBrandAndModel(brandAndModel), CACHE_EXPIRY_DURATION);
  }
  let type;
  for (const model in list) {
    if (list[model].deviceType == 'mobiles') {
      type = 'devices';
    } else {
      type = list[model].deviceType;
    }
    const deviceBrand = list[model].brand;
    const deviceModel = list[model].device;

    const modelsData = await getProductModelDetails(type, deviceBrand, deviceModel, client);
  }
  const deviceTypes = loadsh.groupBy(list, 'deviceType');
  let brands;
  const tags = [];
  let contractSet = [];
  for (const i in deviceTypes) {
    for (const j in deviceTypes[i]) {
      if (deviceTypes[i][j].tagName != '') {
        tags.push({ tagName: deviceTypes[i][j].tagName });
      }
    }
    brands = loadsh.groupBy(deviceTypes[i], 'brandTitle');
    for (const brand in brands) {
      const brandTitles = [];
      if (brand) {
        brands[brand].map((a) => {
          brandTitles.push(`${a.brandTitle} - ${a.deviceTitle}`);
        });
        // loging all models for particular brand
        if (i == 'mobiles') {
          client.set(util.getModelsByMaxisBrand('Devices', brand), JSON.stringify(brandTitles));
          client.expire(util.getModelsByMaxisBrand('Devices', brand), CACHE_EXPIRY_DURATION);
        } else {
          client.set(util.getModelsByMaxisBrand(i, brand), JSON.stringify(brandTitles));
          client.expire(util.getModelsByMaxisBrand(i, brand), CACHE_EXPIRY_DURATION);
        }
      }
    }
    const deviceTags = loadsh.groupBy(deviceTypes[i], 'tagName');
    for (const tag in deviceTags) {
      let brands2 = {};
      if (tag) {
        brands2 = loadsh.groupBy(deviceTags[tag], 'brandTitle');
        for (const brand in brands2) {
          const brandTitles = [];
          if (brand) {
            brands2[brand].map((a) => {
              brandTitles.push(`${a.brandTitle} - ${a.deviceTitle}`);
            });
            // loging all models for particular tag with brand
            if (i == 'mobiles') {
              client.set(util.getModelsByMaxisPromoBrand('Devices', tag, brand), JSON.stringify(brandTitles));
              client.expire(util.getModelsByMaxisPromoBrand('Devices', tag, brand), CACHE_EXPIRY_DURATION);
            } else {
              client.set(util.getModelsByMaxisPromoBrand(i, tag, brand), JSON.stringify(brandTitles));
              client.expire(util.getModelsByMaxisPromoBrand(i, tag, brand), CACHE_EXPIRY_DURATION);
            }
          }
        }
      }
      // logging list of brandslist based on tag/promo selection
      if (i == 'mobiles') {
        client.set(util.getBrandsByMaxisPromo('Devices', tag), JSON.stringify(Object.keys(brands2)));
        client.expire(util.getBrandsByMaxisPromo('Devices', tag), CACHE_EXPIRY_DURATION);
      } else {
        client.set(util.getBrandsByMaxisPromo(i, tag), JSON.stringify(Object.keys(brands2)));
        client.expire(util.getBrandsByMaxisPromo(i, tag), CACHE_EXPIRY_DURATION);
      }
    }
    if (i == 'mobiles') {
      maxisPostpaidDevices.mobiles_brand.push(Object.keys(brands));
      const tags2 = Object.keys(deviceTags);

      const tagsList = [];
      for (let j = 0; j < tags2.length; j++) {
        if (tags2[j] != '') {
          tagsList.push(tags2[j]);
        }
      }
      maxisPostpaidDevices.mobiles_promo.push(tagsList);
    } else if (i == 'tablets') {
      maxisPostpaidDevices.tablets_brand.push(Object.keys(brands));
      const tags2 = Object.keys(deviceTags);
      const tagsList = [];
      for (let j = 0; j < tags2.length; j++) {
        if (tags2[j] != '') {
          tagsList.push(tags2[j]);
        }
      }
      maxisPostpaidDevices.tablets_promo.push(tagsList);
    } else if (i == 'wearables') {
      maxisPostpaidDevices.wearables_brand.push(Object.keys(brands));
      const tags2 = Object.keys(deviceTags);
      const tagsList = [];
      for (let j = 0; j < tags2.length; j++) {
        if (tags2[j] != '') {
          tagsList.push(tags2[j]);
        }
      }
      maxisPostpaidDevices.wearables_promo.push(tagsList);
    }
    contractSet = new Set();
    const groupedContracts = {};
    for (const j of deviceTypes[i]) {
      for (let contract of j.contractType) {
        if (contract == 'K2') {
          contract = 'Normal Contract';
          j.contractType.push(contract);
        }
        if (!groupedContracts[contract]) groupedContracts[contract] = [];
        groupedContracts[contract].push(j);
        contractSet.add(contract);
      }
    }
    for (const contract of Array.from(contractSet)) {
      const brandSet = new Set();
      const models = {};
      for (const model of groupedContracts[contract]) {
        if (!models[model.brandTitle]) models[model.brandTitle] = [];
        models[model.brandTitle].push(`${model.brandTitle} - ${model.deviceTitle}`);
        brandSet.add(model.brandTitle);
      }
      // logging all the brand names based on contract selection
      if (i == 'mobiles') {
        client.set(util.getBrandsByMaxisContract('Devices', contract), JSON.stringify(Array.from(brandSet)));
        client.expire(util.getBrandsByMaxisContract('Devices', contract), CACHE_EXPIRY_DURATION);
      } else {
        client.set(util.getBrandsByMaxisContract(i, contract), JSON.stringify(Array.from(brandSet)));
        client.expire(util.getBrandsByMaxisContract(i, contract), CACHE_EXPIRY_DURATION);
      }
      for (const model in models) {
        // logging list of models based on contract and brand
        if (i == 'mobiles') {
          client.set(util.getModelsByMaxisContractBrand('Devices', contract, model), JSON.stringify(models[model]));
          client.expire(util.getModelsByMaxisContractBrand('Devices', contract, model), CACHE_EXPIRY_DURATION);
        } else {
          client.set(util.getModelsByMaxisContractBrand(i, contract, model), JSON.stringify(models[model]));
          client.expire(util.getModelsByMaxisContractBrand(i, contract, model), CACHE_EXPIRY_DURATION);
        }
      }
    }
    //  console.log("logging contracts list from the devices json", Array.from(contractSet))
    if (i == 'mobiles') { maxisPostpaidDevices.mobiles_contract.push(Array.from(contractSet)); } else if (i == 'tablets') { maxisPostpaidDevices.tablets_contract.push(Array.from(contractSet)); } else if (i == 'wearables') { maxisPostpaidDevices.wearables_contract.push(Array.from(contractSet)); }
  }

  client.set(constants.Brand_Devices_Key, JSON.stringify(maxisPostpaidDevices.mobiles_brand[0]));
  client.expire(constants.Brand_Devices_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Brand_Tablets_Key, JSON.stringify(maxisPostpaidDevices.tablets_brand[0]));
  client.expire(constants.Brand_Tablets_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Brand_Wearables_Key, JSON.stringify(maxisPostpaidDevices.wearables_brand[0]));
  client.expire(constants.Brand_Wearables_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Promo_Devices_Key, JSON.stringify(maxisPostpaidDevices.mobiles_promo[0]));
  client.expire(constants.Promo_Devices_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Promo_Tablets_Key, JSON.stringify(maxisPostpaidDevices.tablets_promo[0]));
  client.expire(constants.Promo_Tablets_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Promo_Wearables_key, JSON.stringify(maxisPostpaidDevices.wearables_promo[0]));
  client.expire(constants.Promo_Wearables_key, CACHE_EXPIRY_DURATION);
  client.set(constants.Contract_Devices_Key, JSON.stringify(maxisPostpaidDevices.mobiles_contract[0]));
  client.expire(constants.Contract_Devices_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Contract_Tablets_Key, JSON.stringify(maxisPostpaidDevices.tablets_contract[0]));
  client.expire(constants.Contract_Tablets_Key, CACHE_EXPIRY_DURATION);
  client.set(constants.Contract_Wearables_Key, JSON.stringify(maxisPostpaidDevices.wearables_contract[0]));
  client.expire(constants.Contract_Wearables_Key, CACHE_EXPIRY_DURATION);
}

//= =====================================HOTLINK POSTPAID MODELS DATA===========================================================

async function getHotlinkProductModelDetails(hotlinkType, deviceBrand, deviceModel, client) {
  console.log('Processing Hotlink postpaid Model Data');
  try {
    const hotlinkPostpaidCatalog = await fetch(`${HOST.HOTLINK_POSTPAID_MODEL[HOST.TARGET]}/${hotlinkType}/${deviceBrand}/${deviceModel}/jcr:content/root/responsivegrid/product_details.model.json`);
    if (hotlinkPostpaidCatalog != undefined || hotlinkPostpaidCatalog != '') {
      const hotlinkPostpaidCatalogData = await hotlinkPostpaidCatalog.json();
      const productDetails = JSON.parse(hotlinkPostpaidCatalogData.product_details);
      const product = productDetails[deviceModel];
      const modelName = `${productDetails[deviceModel].brandTitle} - ${productDetails[deviceModel].deviceTitle}`;
      const { pricingDetails } = productDetails[deviceModel];
      const stotrageList = loadsh.groupBy(pricingDetails, 'storageType');
      // logging list of storages for particular model
      client.set(util.getStoragesByHotlinkPostpaidModel(modelName), JSON.stringify(Object.keys(stotrageList).map((stotrageListItem) => stotrageListItem.toUpperCase())));
      client.expire(util.getStoragesByHotlinkPostpaidModel(modelName), CACHE_EXPIRY_DURATION);
      const sizes = Object.keys(stotrageList).map((stotrageListItem) => stotrageListItem.toUpperCase());
      for (const size of sizes) {
        let colours = loadsh.filter(product.pricingDetails, { storageType: size.toLowerCase() });
        colours = colours.map((colour) => {
          // logging all the skuids based on storage and colour
          client.set(util.getSkuIdByHotlinkPostpaidDeviceSelection(modelName, size, product.colours[colour.colour].colourName), JSON.stringify(colour.skuId));
          client.expire(util.getSkuIdByHotlinkPostpaidDeviceSelection(modelName, size, product.colours[colour.colour].colourName), CACHE_EXPIRY_DURATION);
          return product.colours[colour.colour].colourName;
        });
        // logging all the colours based on storage selection
        client.set(util.getColoursHotlinkPostpaidModelStorage(modelName, size), JSON.stringify(colours));
        client.expire(util.getColoursHotlinkPostpaidModelStorage(modelName, size), CACHE_EXPIRY_DURATION);
      }
    }
  } catch (error) {
    console.log(`${HOST.HOTLINK_POSTPAID_MODEL[HOST.TARGET]}/${hotlinkType}/${deviceBrand}/${deviceModel}/jcr:content/root/responsivegrid/product_details.model.json`, Date.now());
  }
}

//= =============================================HOTLINK POSTPAID DEVICES======================================
async function getHotlinkPostpaidDevices(client) {
  console.log('Processing Hotlink postpaid devices data');
  const hotlinkPostpaidCatalog = await fetch(`${HOST.HOTLINK_POSTPAID_DEVICES[HOST.TARGET]}`);
  const hotlinkPostpaidCatalogData = await hotlinkPostpaidCatalog.json();
  const hotlinkdevicesList = hotlinkPostpaidCatalogData.results;
  const hotlinkList = [];
  const hotlinkPostpaidDevices = {
    HotlinkPostpaid_brand: [], HotlinkPostpaid_Promo: [],
  };
  for (const index in hotlinkdevicesList) {
    if (hotlinkdevicesList[index].contractType.includes('K2') || hotlinkdevicesList[index].contractType.includes('Normal Contract')) {
      if (hotlinkdevicesList[index].isPreOrder == false && hotlinkdevicesList[index].hideDevice == false && hotlinkdevicesList[index].hideOnPLP == false) {
        hotlinkList.push(hotlinkdevicesList[index]);
      }
    }
  }
  for (const index in hotlinkList) {
    const brandAndModel = `${hotlinkList[index].brandTitle} - ${hotlinkList[index].deviceTitle}`;
    client.set(util.getHotlinkImagePathByBrandAndModel(brandAndModel), JSON.stringify(hotlinkList[index].imagePath));
    client.expire(util.getHotlinkImagePathByBrandAndModel(brandAndModel), CACHE_EXPIRY_DURATION);
  }
  let hotlinkType;
  for (const model in hotlinkList) {
    if (hotlinkList[model].deviceType == 'mobiles') {
      hotlinkType = 'devices';
    } else {
      hotlinkType = hotlinkList[model].deviceType;
    }
    const deviceBrand = hotlinkList[model].brand;
    const deviceModel = hotlinkList[model].device;

    const hotlinkModelData = await getHotlinkProductModelDetails(hotlinkType, deviceBrand, deviceModel, client);
  }
  const hotlinkdeviceTypes = loadsh.groupBy(hotlinkList, 'deviceType');
  let hotlinkbrands;
  const hotlinktags = [];
  for (const i in hotlinkdeviceTypes) {
    for (const j in hotlinkdeviceTypes[i]) {
      if (hotlinkdeviceTypes[i][j].tagName != '') {
        hotlinktags.push({ tagName: hotlinkdeviceTypes[i][j].tagName });
      }
    }
    hotlinkbrands = loadsh.groupBy(hotlinkdeviceTypes[i], 'brandTitle');
    hotlinkPostpaidDevices.HotlinkPostpaid_brand.push(Object.keys(hotlinkbrands));

    // logging all the hotlinkbrands list
    client.set(constants.HotlinkPostpaid_Brand_Key, JSON.stringify(hotlinkPostpaidDevices.HotlinkPostpaid_brand[0]));
    client.expire(constants.HotlinkPostpaid_Brand_Key, CACHE_EXPIRY_DURATION);

    for (const brand in hotlinkbrands) {
      const brandTitles = [];
      if (brand) {
        hotlinkbrands[brand].map((a) => {
          brandTitles.push(`${a.brandTitle} - ${a.deviceTitle}`);
        });
        // loging all models for particular brand
        client.set(util.getModelsByHotlinkPostpaidBrand(brand), JSON.stringify(brandTitles));
        client.expire(util.getModelsByHotlinkPostpaidBrand(brand), CACHE_EXPIRY_DURATION);
      }
    }
    const tagnames = loadsh.groupBy(hotlinktags, 'tagName');
    hotlinkPostpaidDevices.HotlinkPostpaid_Promo.push(Object.keys(tagnames));
    // logging all the Promo list
    client.set(constants.HotlinkPostpaid_Promo_Key, JSON.stringify(hotlinkPostpaidDevices.HotlinkPostpaid_Promo[0]));
    client.expire(constants.HotlinkPostpaid_Promo_Key, CACHE_EXPIRY_DURATION);
    const deviceTags = loadsh.groupBy(hotlinkdeviceTypes[i], 'tagName');
    for (const tag in deviceTags) {
      let brands = {};
      if (tag) {
        brands = loadsh.groupBy(deviceTags[tag], 'brandTitle');
        for (const brand in brands) {
          const brandTitles = [];
          if (brand) {
            brands[brand].map((a) => {
              brandTitles.push(`${a.brandTitle} - ${a.deviceTitle}`);
            });
            // loging all models for particular tag with brand
            client.set(util.getBrandsByHotlinkPostpaidPromoBrand(tag, brand), JSON.stringify(brandTitles));
            client.expire(util.getBrandsByHotlinkPostpaidPromoBrand(tag, brand), CACHE_EXPIRY_DURATION);
          }
        }
      }
      // logging list of brands bsed on tag/promo
      client.set(util.getBrandsByHotlinkPostpaidPromo(tag), JSON.stringify(Object.keys(brands)));
      client.expire(util.getBrandsByHotlinkPostpaidPromo(tag), CACHE_EXPIRY_DURATION);
    }
  }
}

//= ========================================= HOTLINK POSTPAID LATEST DEVICES ==============================================

async function getHotlinkPostpaidLatestDevices(client) {
  console.log('Processing Hotlink Postpaid Latest devices');
  const devices = await fetch(`${HOST.HOTLINK_POSTPAID_DEVICES[HOST.TARGET]}`);
  const devicesData = await devices.json();
  const devicesList = devicesData.results;
  const latestDevicesList = [];
  for (let i = 0; i < devicesList.length; i++) {
    if (devicesList[i].topOrder != undefined) {
      latestDevicesList.push(`${devicesList[i].deviceTitle} - ${HOST.HOTLINK_POSTPAID_LATEST_DEVICES[HOST.TARGET]}/devicedetails/category/mobiles/${devicesList[i].brand}/${devicesList[i].device} \n\n`);
    }
  }
  // logging all the latest devices list
  client.set(constants.HotlinkPostpaid_LatestDevices_Key, JSON.stringify(latestDevicesList));
  client.expire(constants.HotlinkPostpaid_LatestDevices_Key, CACHE_EXPIRY_DURATION);
}
//= ================================================== HOTLINK POSTPAID LATEST PROMOTIONS =================================

async function getHotlinkPostpaidLatestPromotions(client) {
  console.log('Processing Hotlink Postpaid Latest promotions');
  const promotions = await fetch(`${HOST.HOTLINK_POSTPAID_LATEST_PROMOTIONS[HOST.TARGET]}`);
  const promotionsData = await promotions.json();
  const products = (JSON.parse(promotionsData.herobanner)).heroBanners;
  let text = '';
  const rex = /(<([^>]+)>)/ig;
  products.forEach((element) => {
    if (element.bannerUrl.startsWith('#')) {
      const bannerUrl = `https://store.hotlink.com.my/${element.bannerUrl}`;
      text += `${element.headline.replace(rex, '').replace('\n', '')} - ${bannerUrl} \n\n`;
    } else {
      text += `${element.headline.replace(rex, '').replace('\n', '')} - ${element.bannerUrl.replace(rex, '').replace('\n', '')} \n\n`;
    }
  });
  // logging all the latest promotions
  client.set(constants.HotlinkPostpaid_LatestPromotions_Key, text);
  client.expire(constants.HotlinkPostpaid_LatestPromotions_Key, CACHE_EXPIRY_DURATION);
}

//= ====================================================================================================================

async function getMaxisBroadbandFamilyPlans(client) {
  const plans = ['Maxis Family Plan for 4', 'Maxis Family Plan for 6', 'Maxis Family Plan for 8'];
  client.set(constants.MaxisPostpaid_Broadband_FamilyPlans_Key, JSON.stringify(plans));
  client.expire(constants.MaxisPostpaid_Broadband_FamilyPlans_Key, CACHE_EXPIRY_DURATION);
}

exports.handler = async (event, context, callback) => {
  console.log('Started catalogue sync process Logging reddish cluster url', process.env.REDIS_CLUSTER_URL);

  const client = redis.createClient({ url: process.env.REDIS_CLUSTER_URL });
  await client.connect();

  await getMaxisMobilePlans(client);
  await getMaxisFibrePlans(client);
  await getHotlinkPostpaidMobilePlans(client);
  await getHotlinkPostpaidFibreBroadbandPlans(client);
  await getHotlinkPostpaidFibreBundledPlans(client);
  await getHotlinkPostpaidRatePlans(client);
  await getHotlinkprepaidSwitchPlans(client);
  await getStores(client);
  await getMaxisPostpaidDevices(client);
  await getHotlinkPostpaidDevices(client);
  await getHotlinkPostpaidLatestDevices(client);
  await getHotlinkPostpaidLatestPromotions(client);
  await getallMaxisStores(client);
  await getMaxisBroadbandFamilyPlans(client);

  const responseData = {
    statuscode: 200,
    body: JSON.stringify('Completed execution of catalogue sync'),

  };
  return responseData;
};
