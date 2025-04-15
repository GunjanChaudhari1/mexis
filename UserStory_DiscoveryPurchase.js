const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");

var _ProductCatalog = {};
var _ProductDetail = {};

const FALLBACK_MESSAGE = process.env.FALLBACK_MESSAGE;
const CAT_ID_ENG = "63451497dbddbb4dccbfd555"
const CAT_ID_BM = "634514b8dbddbb0e95e7f2df"

//----------------------------------------------------------------------------------------
// 👇 helper functions intended for the currect usecase
//----------------------------------------------------------------------------------------
function TechIssueEnd() {
  return "Shared_Tech_Issue";
}

async function getProductCatalog() {
  // 👇 cached in container
  let url = `${HOST.PRODUCT_CATALOG[HOST.TARGET]}/bin/commerce/product-catalogue.json`;

  if (Object.keys(_ProductCatalog).length == 0)
    _ProductCatalog = await UTIL.GetUrl(url);

  return _ProductCatalog.results;
}

async function getProductDetail(a,b) {
  // 😓CANNOT BE CACHED!

  // THIS IS FROM TESTING
  let url = `${HOST.PRODUCT_DETAIL[HOST.TARGET]}/content/commerce/devices/${a}/${b}/jcr:content/root/responsivegrid/product_details.model.json`;

  _ProductDetail = await UTIL.GetUrl(url);
  return _ProductDetail.product_details;
}

async function getProductDetail_Capacity(brand, device) {
  let data = await getProductDetail(brand,device);
  data = await JSON.parse(data)

  return data[device].storages.map(e=>UTIL.ToUpperGB(e));
}

async function getProductDetail_Color(brand, device) {
  let data = await getProductDetail(brand,device);
  data = JSON.parse(data)
  data = data[device].colours;

  let all = [];

  for (item in data) {
    all.push({"key" : item, "value" : data[item].colourName});
  }

  return all;
}

async function getProductDetail_SKU(brand, device, color, capacity) {
  let data = await getProductDetail(brand,device);
  data = JSON.parse(data)
  data = data[device].pricingDetails;

  let result = "";

  for (let i=0; i< data.length; i++) {
    if (data[i].colour == color && UTIL.ToUpperGB(data[i].storageType) == capacity) {
      result = data[i].skuId;
      break;
    }
  }

  return result;
}

async function getProductCatalog_Brand() {
  let all = [];
  let array = await getProductCatalog();

  array.forEach(element => {
    if (element.deviceType=="mobiles") {
      all.push({"key" : element.brand, "value" : element.brandTitle});
    }
  });

  return all.filter((value,index,self)=> {return self.map(e=>{return e.key}).indexOf(value.key) === index});
}

async function getProductCatalog_DeviceByBrand(brand) {
  let all = [];
  let array = await getProductCatalog();

  array.forEach(element => {
    if (element.brand == brand && element.deviceType == "mobiles") {
      all.push({"key" : element.device, "value" : element.deviceTitle});
    }
  });

  return all;
}

async function getProductCatalog_ContractByDevice(device) {
  let all = [];
  let array = await getProductCatalog();

  array.forEach(element => {
    if (element.device == device) {
      for (let i=0; i< element.contractType.length; i++) {
        all.push(element.contractType[i]);
      }
      return;
    }
  });
  console.log(all);
  return all;
}

async function getProductCatalog_Device() {
  let all = [];
  let array = await getProductCatalog();

  array.forEach(element => {
    if (element.topOrder != undefined) {
      all.push(`${element.deviceTitle} - ${HOST.PRODUCT_LATEST_DEVICE[HOST.TARGET]}/productdetails/category/mobiles/${element.brand}/${element.device} \n\n`);
    }
  });

  return all;
}

async function getPlanBySKU(sku) {
  let url = `${HOST.PRODUCT_PLAN_SKU[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${sku}&serviceType=GSM&familyType=MOP`;
  // MAXBOT - Production
  // SSP    - Development
  let head = "";

  if (HOST.TARGET == 0) {
    head = {"headers":{"channel":"ssp", "x-apigw-api-id":"goiwi3vpib", "x-api-key":"6badd2d9-6fdf-49b2-bc79-d67534feb7e3"}};
  } else {
    head = {"headers":{"maxis_channel_type":"MAXBOT", "languageid":"en-US" }};
  }

  let data = await UTIL.GetUrl(url,head);
  data = data.responseData[0].plan;
  let all = {"plan":[], "contract":[]};

  data.forEach(element => {
    let _plan = element.uxfAttributes.productSpecRelationId + "_" + element.uxfAttributes.billingOfferId;
    all["plan"].push({"key": _plan, "value": element.name });
  });

  all["contract"] = data[0].contract.map(a=>a.name);

  return all;
}

async function getProductAvailability(sku) {
  let url = `${HOST.PRODUCT_STOCK[HOST.TARGET]}/inventories/PJ06/${sku}?senderId=MC&source=SAP&type=both&isStockPickupRealTime=false`;
  // MAXBOT - Production
  // SSP    - Development
  // let head = {"headers":{"apikey": "D58C1567-92A8-4F8F-8C16-DDF16ECDBA39","maxis_channel_type":"MAXBOT","languageid":"en-US"}};
  let head = "";

  if (HOST.TARGET == 0) {
    head = {"headers":{"x-api-key": "6badd2d9-6fdf-49b2-bc79-d67534feb7e3","channel":"ssp","x-apigw-api-id": "goiwi3vpib"}};
  } else {
    head = {"headers":{"apikey": "D58C1567-92A8-4F8F-8C16-DDF16ECDBA39","maxis_channel_type":"MAXBOT","languageid":"en-US"}};
  }

  let data = await UTIL.GetUrl(url,head);
  data = data.responseData.productAvailability;

  let result = false;

  data.forEach(element => {
    if (element.balance != null && element.balance > 0) {
      result = true;
      return;
    }
  });

  return result;
}

function AssignFallBack(param) {
  return param["fallbackMessage"] = FALLBACK_MESSAGE;
}

//-----------------------------------------------------------------------------------------
// 👇intent implementation functions
//-----------------------------------------------------------------------------------------
exports.LatestPromo = async function (event) {
  try {
    let url = `${HOST.PRODUCT_PROMO[HOST.TARGET]}/content/commerce/devices/jcr:content/root/responsivegrid/herobanner.model.json`;
    let data = await UTIL.GetUrl(url);

    let products =(JSON.parse(data.herobanner)).heroBanners;
    let text = "";

    let rex = /(<([^>]+)>)/ig;

    products.forEach(element => {
      text += `${element.headline.replace(rex , "").replace("\n","")} - ${element.bannerUrl.replace(rex , "").replace("\n","")} \n\n`;
    });

    return UTIL.ComposeResult("","discover_latest_promo1",{"latestPromoMenu": text});
  } catch (err) {
    console.log("Latest Promo Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.LatestDevice = async function (event) {
  try {
    let result = await getProductCatalog_Device();
    return UTIL.ComposeResult("","discover_latest_devices1",{"latestDeviceMenu":result.join("\n")});
  } catch (err) {
    console.log("Latest Device Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.LatestPromoSelection = async function (event, isFallBack=false) {
  try {
    let result = await getProductCatalog_Brand();
    result = UTIL.GetNumberedMenu(result.map(e=>{return e.value}));

    let returnParam = {"brandMenu":result}; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult("","Sales_PurchaseDevice_LatestPromo_DeviceMenu", returnParam);
  } catch (err) {
    console.log("Discovery Promo Selection 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.DiscoveryBrand = async function (event, isFallBack=false) {
  try {
    let result = await getProductCatalog_Brand();
    result = UTIL.GetNumberedMenu(result.map(e=>{return e.value}));

    let returnParam = {"brandMenu":result}; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand", returnParam);
  } catch (err) {
    console.log("Discovery Brand Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.DeviceList = async function (event, isFallBack=false) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);
    let arrBrand = await getProductCatalog_Brand();

    if (isFallBack==false) {
      let IdxBrand = UTIL.GetParameterValue(event,"brandNumber");

      // VALIDATION: go back to brand if brand index is outside range
      if (isNaN(IdxBrand) || IdxBrand <= 0 || IdxBrand > arrBrand.length ) {
        return exports.DiscoveryBrand(event,true);
      } else {
        Cache["SelectedBrand"] = arrBrand[IdxBrand-1]
        await SESSION.SetCache(sessionID, Cache);
      }
    }

    let SelectedKey = Cache["SelectedBrand"].key;
    let arrDevice = await getProductCatalog_DeviceByBrand(SelectedKey);
    let menuList = UTIL.GetNumberedMenu(arrDevice.map(e=>{return e.value}));

    let returnParam = {"modelMenu":menuList}; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand_ModelMenu", returnParam);
  } catch (err) {
    console.log("Discovery Brand Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.Capacity = async function (event, isFallBack=false) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let IdxDevice = UTIL.GetParameterValue(event,"modelNumber");
    // console.log("idxDevice: ", IdxDevice);

    let Cache = await SESSION.GetCache(sessionID);

    let keyBrand = Cache["SelectedBrand"].key;
    let arrDevice = await getProductCatalog_DeviceByBrand(keyBrand);

    if (isFallBack == false) {
      // VALIDATION:
      if (isNaN(IdxDevice) || IdxDevice <=0 || IdxDevice > arrDevice.length) {
        return exports.DeviceList(event,true);
      } else {
        // ⚠ CACHE STORES STRING VALUES NOT MENU NUMBERS, eg "samsung" instead of "1";
        Cache["SelectedDevice"] = arrDevice[IdxDevice-1];
        await SESSION.SetCache(sessionID, Cache);
      }
    }

    let keyDevice = Cache["SelectedDevice"].key;
    let arrCapacity = await getProductDetail_Capacity(keyBrand, keyDevice);
    let menuList = UTIL.GetNumberedMenu(arrCapacity);

    let returnParam = {"capacityMenu":menuList}; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand_CapacityMenu",returnParam);
  } catch (err) {
    console.log("Capacity Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.Color = async function (event, isFallBack=false) {
  try {
    // ⚠ CACHE STORES STRING VALUES NOT MENU NUMBERS, eg "samsung" instead of "1";
    // Cache selection:
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);

    let keyBrand = Cache["SelectedBrand"].key;
    let keyDevice = Cache["SelectedDevice"].key;
    let IdxCapacity = UTIL.GetParameterValue(event,"capacityNumber");
    let arrCapacity = await getProductDetail_Capacity(keyBrand, keyDevice);

    if (isFallBack == false) {
      // VALIDATION:
      if (isNaN(IdxCapacity) || IdxCapacity <= 0 || IdxCapacity > arrCapacity.length) {
        return exports.Capacity(event,true);
      } else {
        // ⚠ CACHE STORES STRING VALUES NOT MENU NUMBERS, eg "samsung" instead of "1";
        Cache["SelectedCapacity"] = arrCapacity[IdxCapacity-1];
        await SESSION.SetCache(sessionID, Cache);
      }
    }

    let arrColor = await getProductDetail_Color(keyBrand, keyDevice);
    let menuList = UTIL.GetNumberedMenu(arrColor.map(e=>{return e.value}));

    let returnParam = {"colorMenu":menuList}; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand_ColorMenu",returnParam);
  } catch (err) {
    console.log("Color Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.Contract = async function(event, isFallBack=false) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);
    let keyBrand = Cache.SelectedBrand.key;
    let keyDevice = Cache.SelectedDevice.key;
    let keyCapacity = Cache.SelectedCapacity;

    let arrColor = await getProductDetail_Color(keyBrand, keyDevice);
    let IdxColor = UTIL.GetParameterValue(event,"colorNumber");

    if (isFallBack == false) {
      // VALIDATION:
      if (isNaN(IdxColor) || IdxColor <= 0 || IdxColor > arrColor.length ) {
        return exports.Color(event,true);
      } else {
        // ⚠ CACHE STORES STRING VALUES NOT MENU NUMBERS, eg "samsung" instead of "1";
        let sku = await getProductDetail_SKU(keyBrand,keyDevice,arrColor[IdxColor-1].key,keyCapacity);
        let PlanContract = await getPlanBySKU(sku);

        Cache["SelectedColor"] = arrColor[IdxColor-1];
        Cache["SelectedSku"] = sku;
        Cache["PlanList"] = PlanContract.plan;
        Cache["ContractList"] = PlanContract.contract;

        await SESSION.SetCache(sessionID, Cache);
      }
    }

    let sku = Cache["SelectedSku"];
    let contractList= Cache["ContractList"];

    let isAvailable = await getProductAvailability(sku);

    if (isAvailable) {
      let contractText = {"K2":"Normal Contract", "Zerolution360":"Zerolution 360 Contract","Zerolution":"Zerolution Contract"}
      let menuList = UTIL.GetNumberedMenu(contractList.map(e=>contractText[e]));
      let returnParam = {"contractMenu":menuList}; if (isFallBack) AssignFallBack(returnParam);
      return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand_ContractMenu",returnParam);
    } else {
      return UTIL.ComposeResult("","discover_device_out_of_stock");
    }
  } catch (err) {
    console.log("Contract Error🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.RatePlan = async function(event, isFallBack=false) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);

    let IdxContract = UTIL.GetParameterValue(event,"contractNumber");
    let arrContract = Cache.ContractList; // await getProductCatalog_ContractByDevice(KeyDevice);

    if (isFallBack == false) {
      if (isNaN(IdxContract) || IdxContract <= 0 || IdxContract > arrContract.length) {
        return exports.Contract(event,true);
      } else {
        Cache["SelectedContract"] = arrContract[IdxContract-1];
        await SESSION.SetCache(sessionID, Cache);
      }
    }

    let AdvertisedPlan = await UTIL.GetUrl("https://productcatalog.maxis.com.my/bin/commerce/plans.json");
    AdvertisedPlan = AdvertisedPlan.plansList.map(x=>x.planGroup);

    let arrPlan = Cache.PlanList;
    let menuList = UTIL.GetNumberedMenu(arrPlan.filter(e=>AdvertisedPlan.includes(e.value)).map(e=>{return e.value}));

    let returnParam = {"ratePlanMenu":menuList}; if (isFallBack) AssignFallBack(returnParam);
    return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand_RatePlanMenu",returnParam);
  } catch (err) {
    console.log("RatePlan Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.SkuSummary = async function(event, isFallBack = false){
  try {
    let sessionID = UTIL.GetSessionID(event);
    let IdxPlan = UTIL.GetParameterValue(event,"ratePlanNumber");
    let Cache = await SESSION.GetCache(sessionID);
    let arrPlan = Cache.PlanList; // await getPlanBySKU(sku);

    let AdvertisedPlan = await UTIL.GetUrl("https://productcatalog.maxis.com.my/bin/commerce/plans.json");
    AdvertisedPlan = AdvertisedPlan.plansList.map(x=>x.planGroup);
    arrPlan = arrPlan.filter(e=>AdvertisedPlan.includes(e.value))

    if (isFallBack == false) {
      if (IdxPlan <= 0 || IdxPlan > arrPlan.length) {
        return exports.RatePlan(event,true);
      } else {
        Cache["SelectedPlan"] = arrPlan[IdxPlan-1];
        await SESSION.SetCache(sessionID, Cache);
      }
    }

    let brand = Cache.SelectedBrand.key;
    let device = Cache.SelectedDevice.value;
    let capacity = Cache.SelectedCapacity; // 👈 String
    let color = Cache.SelectedColor.value;
    let contract = Cache.SelectedContract; // 👈 String

    let contractText = {"K2":"Normal Contract", "Zerolution360":"Zerolution 360 Contract","Zerolution":"Zerolution Contract"}

    let param = {
      "modelText"    : UTIL.ToCapitalize(device),
      "brandText"    : UTIL.ToCapitalize(brand),
      "capacityText" : UTIL.ToUpperGB(capacity),
      "colorText"    : UTIL.ToCapitalize(color),
      "contractText" : contractText[contract],
      "ratePlanText" : arrPlan[IdxPlan-1].value
    }

    return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand_Sku_Summary",param);
  } catch (err) {
    console.log("SKU Summary Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.SkuSummaryProceed = async function(event){
  try {
    // ⚠ CACHE STORES STRING VALUES NOT MENU NUMBERS, eg "samsung" instead of "1";
    // Cache selection:
    var cache = await SESSION.GetCache(UTIL.GetSessionID(event));
    let KeyBrand = cache.SelectedBrand.key;
    let KeyDevice = cache.SelectedDevice.key;
    let KeyColor = cache.SelectedColor.key;
    let KeyCapacity = cache.SelectedCapacity;
    let SkuId = cache.SelectedSku;
    // let skuId  = await getProductDetail_SKU(KeyBrand,KeyDevice,KeyColor,KeyCapacity);
    let result = await getProductAvailability(SkuId);
    result = result ? "Yes" : "No";

    if (result) {
      return UTIL.ComposeResult(result);
    } else {
      return UTIL.ComposeResult("","discover_device_out_of_stock");
    }
  } catch (err) {
    console.log("SKU Proceed Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}

exports.SkuSummaryProceedOptions = async function(event){
  return UTIL.ComposeResult("Sku Option!");
}

exports.SkuSummaryProceedTeleSales = async function(event){
  let sessionID = UTIL.GetSessionID(event);
  let agentStartDay = UTIL.GetParameterValue(event,"agentStartDay");
  let agentEndDay = UTIL.GetParameterValue(event, "agentEndDay");
  let agentStartTime = UTIL.GetParameterValue(event,"agentStartTime");
  let agentEndTime = UTIL.GetParameterValue(event,"agentEndTime");
  let shortStartTime = UTIL.GetParameterValue(event,"shortStartTime");
  let shortEndtime = UTIL.GetParameterValue(event,"shortEndTime");

  let agentId = UTIL.GetParameterValue(event,"agentCategoryId");
  agentId = agentId == undefined ? "6054564a0e69dc2b943b7e05" : agentId;

  // let dayInt          = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // let startDay        = dayInt.indexOf(agentStartDay);
  // let endDay          = dayInt.indexOf(agentEndDay);

  let startDay = agentStartDay;
  let endDay = agentEndDay;
  let today = new Date().getDay();

  let startTime = parseInt(agentStartTime.substr(0,2)) * 60 + parseInt(agentStartTime.substr(2,2));
  let endTime = parseInt(agentEndTime.substr(0,2)) * 60 + parseInt(agentEndTime.substr(2,2));

  shortStartTime = parseInt(shortStartTime.substr(0,2)) * 60 + parseInt(shortStartTime.substr(2,2));
  shortEndTime = parseInt(shortEndtime.substr(0,2)) * 60 + parseInt(shortEndtime.substr(2,2));

  let GMT = 8;
  let now = (new Date().getHours() + GMT) * 60 + new Date().getMinutes();

  console.log("startDay " + startDay );
  console.log("endDay " + endDay );
  console.log("today " + today );

  console.log("startTime " + startTime );
  console.log("endTime " + endTime );

  console.log("shortStartTime " + shortStartTime );
  console.log("shortEndTime " + shortEndTime );

  console.log("now " + now)


  let followUpEvent = "handover_telesales_offline";

  if (today >= startDay && today <= endDay) {
    if ((startDay !=6 && (startTime <= now && now <= endTime)) || (startDay ==6 && (shortStartTime <= now && now <= shortEndTime)) ) {
      followUpEvent = "handover_telesales_online";
    }
  }

  // 👇 always handover
  await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId});
  return UTIL.ComposeResult("",followUpEvent);
}

exports.SkuSummaryProceedCheckout = async function(event){
  try {
    // ⚠ CACHE STORES STRING VALUES NOT MENU NUMBERS, eg "samsung" instead of "1";
    // Cache selection:
    var cache = await SESSION.GetCache(UTIL.GetSessionID(event));
    let KeyBrand = cache.SelectedBrand.key;
    let KeyDevice = cache.SelectedDevice.key;
    let Sku = cache.SelectedSku; // 👈string
    let Plan = cache.SelectedPlan.key;
    let Contract = cache.SelectedContract; // 👈string

    // let url = `https://store.maxis.com.my/productdetails/category/mobiles/${KeyBrand}/${KeyDevice}?skuid=${Sku}&plan=${Plan}&contractType=${Contract}`
    let url = `${HOST.PRODUCT_CHECKOUT[HOST.TARGET]}/productdetails/category/mobiles/${KeyBrand}/${KeyDevice}?skuid=${Sku}&plan=${Plan}&contractType=${Contract}`

    return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand_Sku_Checkout",{"checkoutUrl":url});
  } catch (err) {
    console.log("SKU Proceed Checkout Error 🔻");
    console.log(err);
    return UTIL.ComposeResult("",TechIssueEnd());
  }
}




async function getExistingCategories(threadId) {
  let url = `https://maxis.api.engagement.dimelo.com/1.0/content_threads/${threadId}?access_token=${UTIL.RC_ACCESS_TOKEN}`
  let head = {method: "GET"};
  let data = await UTIL.GetUrl(url, head);
  if (data){
    return data.category_ids
  }
}

async function UpdateCategories(sessionID, catId, removedCatId) {
  try {
    let threadId = await SESSION.getThreadId(sessionID);
    let existingCatIds = await getExistingCategories(threadId)
    if (!existingCatIds){
      console.log("No existing CatIds Category Id found")
    } else {
      existingCatIds = existingCatIds.filter(e=>e != removedCatId)
      catId = catId.concat(existingCatIds)
      catId = [...new Set(catId)];
    }
    catId = catId.map(e=>"&thread_category_ids[]=" + e).join("");

    let url = `https://maxis.api.engagement.dimelo.com/1.0/content_threads/${threadId}/update_categories?access_token=${UTIL.RC_ACCESS_TOKEN}${catId}`;
    let head = {method: "PUT",headers: {"accept": "application/json"}};
    let data = await UTIL.GetUrl(url, head);
    console.log("After CatID Update Res : ", data)
  } catch (err) {
    console.error("🔻 ERROR: UpdateCategories or getExistingCategories", err);
  }
}

exports.languageSelect = async function(event) {
  console.log("Language selection intent", event);
  let sessionID = UTIL.GetSessionID(event);
  let msisdn = await SESSION.GetMSISDN(sessionID);
  let LastEvent = await SESSION.GetLastEvent(sessionID);

  console.log("Last event detected:-", LastEvent);
  let Cache = await SESSION.GetCache(sessionID);
  // 0 for Eng and 1 for Bahasa Malay
  if (Cache["Language"] == undefined || Cache["Language"] == 0){
    Cache["Language"] = 1;
    await UpdateCategories(sessionID, [CAT_ID_BM], CAT_ID_ENG)
  } else if (Cache["Language"] == 1){
    Cache["Language"] = 0;
    await UpdateCategories(sessionID, [CAT_ID_ENG], CAT_ID_BM)
  }
  await SESSION.SetCache(sessionID, Cache);
  console.log("Langauge selected!!!", Cache["Language"]);
  return UTIL.ComposeResult("", LastEvent.event);
}

exports.hybrid = async function(event) {
  console.log("Hybrid slot filling event");
  color = UTIL.GetParameterValue(event, "color");
  brandName = UTIL.GetParameterValue(event, "brandName");
  modelNo = UTIL.GetParameterValue(event, "modelNo");
  storage = UTIL.GetParameterValue(event, "storage");
  contract = UTIL.GetParameterValue(event, "contract");
  ratePlan = UTIL.GetParameterValue(event, "ratePlan");

  console.log(`Parameters are: 1. ${color} 2. ${brandName} 3. ${modelNo} 4. ${storage} 5. ${contract}`)

  if (!brandName){
    console.log(`inside brand ${brandName}`);
    text = `Alright. Let's get started.
  I'll need some info to find the best device for you. Can you tell me your preferred brand?
    1️⃣ Samsung 
    2️⃣ Apple 
    3️⃣ OPPO 
    4️⃣ Huawei 
    5️⃣ Asus 
    6️⃣ Xiaomi 
    7️⃣ Vivo 
    8️⃣ Realme 
    9️⃣ Honor 
    🔟 Lenovo
    *️⃣ Go back to main menu
    To continue, just type in the name of the brand.`
    return UTIL.ComposeResult(text, "", event.queryResult.parameters );
  } else if (!modelNo){
    console.log(`inside model ${modelNo}`);

    let arrDevice = await getProductCatalog_DeviceByBrand(brandName.toLowerCase());
    let menuList = UTIL.GetNumberedMenu(arrDevice.map(e=>{return e.value}));

    let text = `Please enter the specific model number/name that you're looking for.\n${menuList}`
    return UTIL.ComposeResult(text, "", event.queryResult.parameters);
  } else if (!color){
    console.log(`inside color ${color}`);
    let arrColor = await getProductDetail_Color(brandName, modelNo);
    let menuList = UTIL.GetNumberedMenu(arrColor.map(e=>{return e.value}));

    return UTIL.ComposeResult(`Excellent! What colour would you like that in?\n${menuList}`, "", event.queryResult.parameters);
  } else if (!storage){
    console.log(`inside storage ${storage}`);
    return UTIL.ComposeResult("Great choice! And what capacity would you like?", "", event.queryResult.parameters);
  } else if (!contract){
    console.log(`inside contract ${contract}`);
    let text = "What contract would you like? 1ï¸âƒ£ Normal 2ï¸âƒ£ Zerolution";
    return UTIL.ComposeResult(text, "", event.queryResult.parameters);
  } else if (!ratePlan) {
    console.log(`inside rate Plan ${ratePlan}`);
    let text = `Last question. Which rate plan do you prefer?\n${ratePlanMenu}\n
    *️⃣ Go back to the main menu\n\nTo continue, just select a number from the list`
    return UTIL.ComposeResult(text, "", event.queryResult.parameters);
  } 
  // else {
  console.log("All params are present");
  let text = `So let me just recap. You'd like...\n
  Device Name: ${brandName} ${modelNo}\n
  Device Capacity: ${storage}\n
  Device Colour: ${color}\n
  Contract Type: ${contract}\n
  Rate Plan: ${ratePlan}\n\n
  Would you like to proceed with this selection?\n
  1️⃣ Yes\n
  2️⃣ No\n
  *️⃣ Go back to the main menu\n\n\n
  To continue, just type Yes/No`

  return UTIL.ComposeResult(text, "", event.queryResult.parameters);
  // }
}