const redis = require('redis');
const UTIL = require('./Util');
const SESSION = require('./Handler_Session');
const HOST = require('./Handler_Host');

// redis
const redisCache = require('./CacheConstants');
const redisData = require('./CacheUtil');

const client = redis.createClient({ url: process.env.REDIS_CLUSTER_URL });
client.connect();
const brandDevicesKey = redisCache.Brand_Devices_Key;

let _ProductCatalog = {};
let _ProductDetail = {};

const FALLBACK_MESSAGE = process.env.FALLBACK_MESSAGE_SALES;

//----------------------------------------------------------------------------------------
// 👇 helper functions intended for the currect usecase
//----------------------------------------------------------------------------------------
function TechIssueEnd() {
  return 'Shared_Tech_Issue';
}

async function getProductCatalog() {
  // 👇 cached in container
  const url = `${HOST.PRODUCT_CATALOG[HOST.TARGET]}/bin/commerce/product-catalogue.json`;

  if (Object.keys(_ProductCatalog).length === 0) _ProductCatalog = await UTIL.GetUrl(url);

  console.log('_ProductDetail in getProductCatalog: ', _ProductDetail);
  return _ProductCatalog.results;
}

async function getProductDetail(a, b) {
  // 😓CANNOT BE CACHED!

  // THIS IS FROM TESTING
  const url = `${HOST.PRODUCT_DETAIL[HOST.TARGET]}/content/commerce/devices/${a}/${b}/jcr:content/root/responsivegrid/product_details.model.json`;
  // let url = `https://productcatalog.maxis.com.my/content/commerce/devices/${a}/${b}/jcr:content/root/responsivegrid/product_details.model.json`;
  _ProductDetail = await UTIL.GetUrl(url);

  console.log('_ProductDetail in getProductDetail: ', _ProductDetail);
  if (!_ProductDetail) {
    return false;
  }

  return _ProductDetail.product_details;
}

async function getProductDetail_Color(brand, device) {
  let data = await getProductDetail(brand, device);

  if (!data) {
    return false;
  }

  data = JSON.parse(data);
  data = data[device].colours;

  const all = [];

  for (const item in data) {
    all.push({ key: item, value: data[item].colourName });
  }

  return all;
}

async function getProductDetail_Capacity(req, brand, device) {
  let data = await getProductDetail(brand, device);

  if (!data) {
    return false;
  }

  data = await JSON.parse(data);

  // latest changes for Hybrid

  console.log('latest changes get memory');
  // let cache1   = await SESSION.GetCache(msisdn);
  const sessionID = UTIL.GetSessionID(req);
  const cache1 = await SESSION.GetCache(sessionID);

  cache1.sessionMemory = data[device].storages;
  await SESSION.SetCache(sessionID, cache1);

  const cache2 = await SESSION.GetCache(sessionID);
  const temp = cache2.sessionMemory;
  console.log('Memory Temp', temp);

  console.log('check for cache in memory ', cache2);
  //

  return data[device].storages.map((e) => UTIL.ToUpperGB(e));
}

async function getProductDetail_SKU(brand, device, color, capacity) {
  let data = await getProductDetail(brand, device);

  if (!data) {
    return false;
  }

  data = JSON.parse(data);
  data = data[device].pricingDetails;
  let result = '';
  capacity = capacity.replace(' ', '').toLowerCase();
  console.log('data ', data);
  console.log('color : ', color);
  console.log('capacity : ', capacity);
  for (let i = 0; i < data.length; i++) {
    if (data[i].colour === color && data[i].storageType === capacity) {
      result = data[i].skuId;
      break;
    }
  }
  console.log('Result ', result);
  return result;
}

// async function getProductCatalog_Brand() {
//     let all = [];
//     let array = await getProductCatalog();

//     array.forEach(element => {
//         if (element.deviceType === "mobiles") {
//             all.push({ "key": element.brand, "value": element.brandTitle });
//         }
//     });

//     return all.filter((value, index, self) => { return self.map(e => { return e.key }).indexOf(value.key) === index });
// }

async function getProductCatalog_DeviceByBrand(brand) {
  const all = [];
  const array = await getProductCatalog();

  array.forEach((element) => {
    if (element.brand === brand && element.deviceType === 'mobiles') {
      all.push({ key: element.device, value: element.deviceTitle });
    }
  });

  return all;
}

async function getPlanBySKURatePlan(sku, req) {
  const url = `${HOST.PRODUCT_PLAN_SKU[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${sku}&serviceType=GSM&familyType=MOP`;
  //  MAXBOT - Production
  // SSP    - Development
  let head = '';

  if (HOST.TARGET === 0) {
    head = {
      headers: {
        channel: 'ssp', 'x-apigw-api-id': 'goiwi3vpib', 'x-api-key': '6badd2d9-6fdf-49b2-bc79-d67534feb7e3', maxis_channel_type: 'MAXBOT', languageid: 'en-US',
      },
    };
  } else {
    head = { headers: { maxis_channel_type: 'MAXBOT', languageid: 'en-US' } };
  }
  let data = await UTIL.GetUrl(url, head);

  if (!data.responseData[0].plan) {
    return UTIL.ComposeResult('', 'contractType', req.queryResult.parameters);
  }

  data = data.responseData[0].plan;
  const all = { plan: [], contract: [] };

  data.forEach((element) => {
    const _plan = `${element.uxfAttributes.productSpecRelationId}_${element.uxfAttributes.billingOfferId}`;
    all.plan.push({ key: _plan, value: element.name });
  });

  all.contract = data[0].contract.map((a) => a.name);
  return all;
}

async function getPlanBySKU(sku, req) {
  const url = `${HOST.PRODUCT_PLAN_SKU[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${sku}&serviceType=GSM&familyType=MOP`;
  // MAXBOT - Production
  // SSP    - Development
  // let head = "";

  // if (HOST.TARGET === 0)
  // {
  //   head = {"headers":{"channel":"ssp", "x-apigw-api-id":"goiwi3vpib", "x-api-key":"6badd2d9-6fdf-49b2-bc79-d67534feb7e3"}};
  // }
  // else
  // {
  //   head = {"headers":{"maxis_channel_type":"MAXBOT", "languageid":"en-US" }};
  // }
  // let data = await UTIL.GetUrl(url,head);

  // if(!data.responseData[0].plan){
  //     return UTIL.ComposeResult("", "contractType", req.queryResult.parameters);
  // }

  // data = data.responseData[0].plan;
  // let all = {"plan":[], "contract":[]};

  // data.forEach(element => {
  //     let _plan = element.uxfAttributes.productSpecRelationId + "_" + element.uxfAttributes.billingOfferId;
  //     all["plan"].push({"key": _plan, "value": element.name });
  // });

  // all["contract"] = data[0].contract.map(a=>a.name);
  // return all;
  // "headers": { "maxis_channel_type": "MAXBOT", "languageid": "en-US" },

  const head = {
    method: 'GET',
    headers: {
      channel: 'ssp',
      'x-apigw-api-id': 'goiwi3vpib',
      'x-api-key': '6badd2d9-6fdf-49b2-bc79-d67534feb7e3',
      maxis_channel_type: 'MAXBOT',
      languageid: 'en-US',
    },
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

async function getProductAvailability(sku) {
  const url = `${HOST.PRODUCT_STOCK[HOST.TARGET]}/inventories/PJ06/${sku}?senderId=MC&source=SAP&type=both&isStockPickupRealTime=false`;
  // MAXBOT - Production
  // SSP    - Development
  // let head = {"headers":{"apikey": "D58C1567-92A8-4F8F-8C16-DDF16ECDBA39","maxis_channel_type":"MAXBOT","languageid":"en-US"}};
  let head = '';

  if (HOST.TARGET === 0) {
    head = { headers: { 'x-api-key': '6badd2d9-6fdf-49b2-bc79-d67534feb7e3', channel: 'ssp', 'x-apigw-api-id': 'goiwi3vpib' } };
  } else {
    head = { headers: { apikey: 'D58C1567-92A8-4F8F-8C16-DDF16ECDBA39', maxis_channel_type: 'MAXBOT', languageid: 'en-US' } };
  }

  let data = await UTIL.GetUrl(url, head);
  data = data.responseData.productAvailability;

  let result = false;

  data.forEach((element) => {
    if (element.balance != null && element.balance > 0) {
      result = true;
    }
  });

  return result;
}

//-----------------------------------------------------------------------------------------
// 👇Hybrid model implementation functions --> latest changes for Hybrid
//-----------------------------------------------------------------------------------------

async function checkForNumericInput (req, userInput, detect_intent) {
  let arrayIndex = 0
  if (Number(userInput)>= 1) {
    arrayIndex = Number(userInput)-1
  }

  // let cache2    = await SESSION.GetCache(msisdn);
  let sessionID = UTIL.GetSessionID(req);
  let cache2 = await SESSION.GetCache(sessionID);

  console.log("checkForNumericInput ",cache2)

  if (detect_intent === 'provides.brand') {
    console.log("i am in provides.brand")
    let sessionBrands = await cache2["sessionBrands"]
    console.log("sessionBrands", sessionBrands)
    if (sessionBrands.length>arrayIndex) {
      return (await sessionBrands[arrayIndex].toLowerCase())
    } 
    return false
    
  } if (detect_intent === 'provides.model') {
    let sessionModel = cache2["sessionModel"]
    console.log("sessionModel", sessionModel)
    if (sessionModel.length>arrayIndex) {
      return (await sessionModel[arrayIndex].key)
    } 
    return false
    
  } if (detect_intent === 'provides.memory') {
    // let sessionMemory = cache2["sessionMemory"]
    let { sessionMemory } = cache2
    console.log("sessionMemory", sessionMemory)
    if (sessionMemory.length>arrayIndex) {
      return (await sessionMemory[arrayIndex])
    } 
    return false
    
  } if (detect_intent === 'provides.color') {
    // let sessionColor = cache2["sessionColor"]
    let { sessionColor } = cache2
    console.log("sessionColor", sessionColor)
    if (sessionColor.length>arrayIndex) {
      return (await sessionColor[arrayIndex].value)
    } 
    return false
    
  } if (detect_intent === 'provides.contractType') {
    // let sessionContractType = cache2["sessionContractType"]
    let { sessionContractType } = cache2
    console.log("sessionContractType", sessionContractType)
    if (sessionContractType.length>arrayIndex) {
      console.log("sessionContractType.length ", sessionContractType.length)
      return (await sessionContractType[arrayIndex])
    } 
    return false
    
  } if (detect_intent === 'provides.ratePlan') {
    // let sessionRatePlan = cache2["sessionRatePlan"]
    let { sessionRatePlan } = cache2
    console.log("sessionRatePlan", sessionRatePlan)
    if (sessionRatePlan.length>arrayIndex) {
      // return(await sessionRatePlan[arrayIndex].value)
      return (await sessionRatePlan[arrayIndex])
    } else {
      return false;
    }
  } else {
    console.log("All session are present in check for brand function");
  }
}

// 👇Hybrid model converstional text handle functions --> latest changes for Hybrid
//-----------------------------------------------------------------------------------------
// 👇Hybrid model converstional text handle functions --> latest changes for Hybrid
//---
// async function checkForConverstionalText (fullData, userText){

//     console.log("checkForConverstionalText")
//     console.log("fullData : ", fullData)
//     console.log("userText : ", userText)
//     let sortedArray = fullData.map((e) => {
//         return e.key
//     })

//     console.log("sortedArray : ", sortedArray)

//     if(sortedArray.includes(userText)){
//         console.log("checkForConverstionalText if ",userText)
//         return userText
//     }
//     else if(userText.includes(" ")){
//         let splitedText = userText.split(' ')
//         let flag1 = false

//         splitedText.map((eachEle) => {
//           if(sortedArray.includes(eachEle)){
//             console.log(eachEle)
//             flag1 =  eachEle
//           }
//           return ''
//         })

//         if(flag1){
//           console.log("checkForConverstionalText if in flag1 ",flag1)
//           return flag1
//         }
//         else{
//           console.log("checkForConverstionalText else in flag1 splitedText",splitedText)
//           return false
//         }
//     }
//     else{
//         console.log("checkForConverstionalText else in flag1 sortedArray",sortedArray)
//         return false
//     }
// }

//-----------------------------------------------------------------------------------------
// 👇 getter setter for isFallBackHybrid
//-----------------------------------------------------------------------------------------
async function getIsFallBackHybrid(sessionID) {
  const cacheIsFallBackHybrid = await SESSION.GetCache(sessionID);
  return cacheIsFallBackHybrid.isFallBackHybrid;
}
async function setIsFallBackHybrid(sessionID, value) {
  const cacheIsFallBackHybrid = await SESSION.GetCache(sessionID);
  cacheIsFallBackHybrid.isFallBackHybrid = value;
  await SESSION.SetCache(sessionID, cacheIsFallBackHybrid);
}
//-----------------------------------------------------------------------------------------
// 👇intent implementation functions
//-----------------------------------------------------------------------------------------
async function get_Brand(req) {
  try {
    // let result  = await getProductCatalog_Brand();
    // menuList  = UTIL.GetNumberedMenu(result.map(e=>{return e.value}));

    // bget rands from redis cache
    let result = await client.get(brandDevicesKey);
    result = JSON.parse(result);
    console.log('brand_Redis : ', result);
    const menuList = UTIL.GetNumberedMenu(result.map((e) => e));
    //

    console.log('latest changes get brand');
    // let cache1   = await SESSION.GetCache(msisdn);
    const sessionID = UTIL.GetSessionID(req);
    const cache1 = await SESSION.GetCache(sessionID);
    cache1.sessionBrands = result;
    // await SESSION.SetCache(msisdn, cache1)
    await SESSION.SetCache(sessionID, cache1);

    // let cache2    = await SESSION.GetCache(msisdn);
    // let temp = cache2["sessionBrands"]
    // console.log("Brand Temp", temp)
    // console.log("check for cache in brand ",cache2)

    const returnParam = { brandMenu: menuList };
    //
    const isFallBackHybrid = await getIsFallBackHybrid(sessionID);
    if (!isFallBackHybrid) {
      returnParam.fallbackMessage = '';
      console.log('returnParam : ', returnParam);
      await setIsFallBackHybrid(sessionID, false);
      return UTIL.ComposeResult('', 'followupevent_brandMenuList', returnParam);
    }
    await setIsFallBackHybrid(sessionID, false);
    returnParam.fallbackMessage = FALLBACK_MESSAGE;
    console.log('returnParam : ', returnParam);
    return UTIL.ComposeResult('', 'followupevent_brandMenuList', returnParam);
  } catch (err) {
    console.log('Discovery Brand Error 🔻');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
}

async function get_Model_Data_Redis(brandName) {
  try {
    brandNameNew = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    const deviceType = 'Devices';
    if (brandName.toLowerCase() === 'oppo') {
      brandNameNew = 'OPPO';
    }
    console.log('get_Model_Data_Redis brandNameNew : ', brandNameNew);
    let model_Redis = await client.get(redisData.getModelsByMaxisBrand(deviceType, brandNameNew));
    console.log('model_Redis : ', model_Redis);
    model_Redis = JSON.parse(model_Redis);

    const modelDataRedis = model_Redis.map((eachModel) => {
      eachModel = eachModel.split('-');
      if (eachModel.length > 2) {
        let updateStr = '';
        for (let i = 1; i < eachModel.length; i++) {
          if (i === 1) {
            updateStr += eachModel[i];
          } else {
            updateStr = `${updateStr}-${eachModel[i]}`;
          }
        }
        eachModel = updateStr.trim();
        console.log(eachModel, 'true');
      } else {
        eachModel = eachModel[1].trim();
      }

      let formattedModel = eachModel;
      if (eachModel.includes('(')) {
        formattedModel = eachModel.split('(');
        formattedModel = formattedModel[0].trim();
      }

      const keyModel = formattedModel.split(' ').join('-').toLowerCase();
      return { value: eachModel, key: keyModel };
    });
    console.log(' final Model : ', modelDataRedis);
    return modelDataRedis;
  } catch (err) {
    console.log('Error in getting model data from redis 🔻');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
}

async function verifyModelNo(req, modelNo, brandName) {
  // let cache2    = await SESSION.GetCache(msisdn);
  const sessionID = UTIL.GetSessionID(req);
  const cache2 = await SESSION.GetCache(sessionID);

  if (!brandName || !isNaN(brandName)) {
    return get_Brand(req);
  }
  let sessionModelTemp = cache2.sessionModel;
  console.log('sessionModel verifyModelNo', sessionModelTemp);

  if (!sessionModelTemp) {
    // sessionModelTemp = await getProductCatalog_DeviceByBrand(brandName);
    sessionModelTemp = await get_Model_Data_Redis(brandName);
    cache2.sessionModel = sessionModelTemp;
    await SESSION.SetCache(sessionID, cache2);
  }
  console.log('sessionModelTemp : ', sessionModelTemp);

  let sortedModelArray;
  if (sessionModelTemp) {
    sortedModelArray = sessionModelTemp.map((e) => e.key);
  }
  console.log('sortedModelArray verifyModelNo : ', sortedModelArray);
  console.log(modelNo);

  // plus changes
  if (modelNo.includes('-plus')) {
    modelNo = modelNo.replace('-plus', '+');
  }
  //

  if (!sortedModelArray.includes(modelNo)) return false;
  return true;
}

async function get_Model(req, brandName) {
  try {
    if (!brandName || !isNaN(brandName)) {
      return get_Brand(req);
    }
    // let arrDevice = await getProductCatalog_DeviceByBrand(brandName);
    // let menuList = UTIL.GetModelNumberedMenu(arrDevice.map(e => { return e.value }), brandName);

    // radis cache
    // for getting the value using the key from redis
    const arrDevice = await get_Model_Data_Redis(brandName);
    const menuList = UTIL.GetModelNumberedMenu(arrDevice.map((e) => e.value), brandName);

    console.log('latest changes get model');
    // let cache1   = await SESSION.GetCache(msisdn);
    const sessionID = UTIL.GetSessionID(req);
    const cache1 = await SESSION.GetCache(sessionID);

    cache1.sessionModel = arrDevice;
    await SESSION.SetCache(sessionID, cache1);

    // let cache2    = await SESSION.GetCache(msisdn);
    // let temp = cache2["sessionModel"]
    // console.log("Model Temp", temp)
    // console.log("check for cache in model ",cache2)

    const returnParam = { modelMenu: menuList };
    const isFallBackHybrid = await getIsFallBackHybrid(sessionID);
    if (!isFallBackHybrid) {
      await setIsFallBackHybrid(sessionID, false);
      console.log('returnParam : ', returnParam);
      return UTIL.ComposeResult('', 'followupevent_ModelMenuList', returnParam);
    }
    await setIsFallBackHybrid(sessionID, false);
    returnParam.fallbackMessage = FALLBACK_MESSAGE;
    console.log('returnParam : ', returnParam);
    return UTIL.ComposeResult('', 'followupevent_ModelMenuList', returnParam);
  } catch (err) {
    console.log('Discovery Model Error 🔻');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
}

// async function get_Memory_Data_Redis(req, new_model_no) {

//     try {
//         //  Redis cache
//         // for getting the memory from redis
//         console.log("new_model_no : ", new_model_no)
//         let modelNameNew = new_model_no.split('-')
//         let tempArr = []
//         modelNameNew.forEach(e => {tempArr.push( e.charAt(0).toUpperCase() + e.slice(1))})
//         modelNameNew = tempArr.join(' ')
//         console.log("modelNameNew : ", modelNameNew)
//         if(modelNameNew.includes('Iphone')){
//             modelNameNew = modelNameNew.replace('Iphone','iPhone')
//         }
//         if(modelNameNew.includes('5g')){
//             modelNameNew = modelNameNew.replace('5g','5G')
//         }
//         console.log("modelNameNew : ", modelNameNew)

//         let arrCapacity = await client.get(redisData.getStoragesByMaxisModel(modelNameNew))
//         console.log("arrCapacity", arrCapacity);

//         // setting in session
//         let sessionID = UTIL.GetSessionID(req);
//         console.log('latest changes get memory')
//         let cache1   = await SESSION.GetCache(sessionID);

//         cache1["sessionMemory"] = arrCapacity
//         await SESSION.SetCache(sessionID, cache1)

//         let cache2    = await SESSION.GetCache(sessionID);
//         let temp = cache2["sessionMemory"]
//         console.log("Memory Temp", temp)

//         console.log("check for cache in memory ",cache2)

//         return arrCapacity;
//     }
//     catch (err) {
//         console.log("Error in getting memory data from redis 🔻");
//         console.log(err);
//         return UTIL.ComposeResult("", TechIssueEnd());
//     }
// }

async function verifyMemory(req, brandName, modelNo, memory) {
  // let cache2    = await SESSION.GetCache(msisdn);
  const sessionID = UTIL.GetSessionID(req);
  const cache2 = await SESSION.GetCache(sessionID);

  let sessionMemoryTemp = cache2.sessionMemory;
  console.log('sessionMemory verifyMemory', sessionMemoryTemp);

  if (!sessionMemoryTemp) {
    sessionMemoryTemp = await getProductDetail(brandName, modelNo);
    // sessionMemoryTemp = await get_Memory_Data_Redis(req,new_model_no)
    sessionMemoryTemp = await JSON.parse(sessionMemoryTemp);
    console.log('sessionMemoryTemp inside 2nd', sessionMemoryTemp);
    sessionMemoryTemp = sessionMemoryTemp[modelNo].storages;
    cache2.sessionMemory = sessionMemoryTemp;
    await SESSION.SetCache(sessionID, cache2);
  }

  let sortedMemoryArray;
  if (sessionMemoryTemp) {
    sortedMemoryArray = sessionMemoryTemp.map((e) => e.replace(/-|\s/g, '').toLowerCase());
  }
  console.log('sortedMemoryArray verifyMemoryNo : ', sortedMemoryArray);

  if (!sortedMemoryArray.includes(memory.replace(/-|\s/g, '').toLowerCase())) return false;
  return true;
}

async function get_Memory(req, brandName, new_model_no) {
  try {
    const arrCapacity = await getProductDetail_Capacity(req, brandName, new_model_no);
    // let arrCapacity = await get_Memory_Data_Redis(req,new_model_no)

    //

    if (!arrCapacity) {
      return get_Model(req, brandName);
    }

    const menuList = UTIL.GetNumberedMenu(arrCapacity);

    const sessionID = UTIL.GetSessionID(req);

    const returnParam = { memoryMenu: menuList };
    const isFallBackHybrid = await getIsFallBackHybrid(sessionID);
    if (!isFallBackHybrid) {
      await setIsFallBackHybrid(sessionID, false);
      console.log('returnParam : ', returnParam);
      return UTIL.ComposeResult('', 'followupevent_MemoryMenuList', returnParam);
    }
    await setIsFallBackHybrid(sessionID, false);
    returnParam.fallbackMessage = FALLBACK_MESSAGE;
    console.log('returnParam : ', returnParam);
    return UTIL.ComposeResult('', 'followupevent_MemoryMenuList', returnParam);
  } catch (err) {
    console.log('Capacity Error 🔻');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
}

async function get_Color(req, brandName, new_model_no, storage) {
  try {
    const verifyCapacity = await verifyMemory(req, brandName, new_model_no, storage);
    if (!verifyCapacity) {
      const sessionID = UTIL.GetSessionID(req);
      // await setIsFallBackHybrid(sessionID, true)
      return get_Memory(req, brandName, new_model_no);
    }

    const arrColor = await getProductDetail_Color(brandName, new_model_no);
    console.log('arrColor : ', arrColor);
    if (!arrColor) {
      const params = req.queryResult.parameters;
      params.model = '';
      return get_Model(req, keyBrand);
    }
    const menuList = UTIL.GetNumberedMenu(arrColor.map((e) => e.value));

    // latest changes for Hybrid

    console.log('latest changes get Color');
    // let cache1   = await SESSION.GetCache(msisdn);
    const sessionID = UTIL.GetSessionID(req);
    const cache1 = await SESSION.GetCache(sessionID);

    cache1.sessionColor = arrColor;
    await SESSION.SetCache(sessionID, cache1);

    const cache2 = await SESSION.GetCache(sessionID);
    const temp = cache2.sessionColor;
    console.log('Color Temp', temp);

    //

    const returnParam = { colorMenu: menuList };
    const isFallBackHybrid = await getIsFallBackHybrid(sessionID);
    if (!isFallBackHybrid) {
      await setIsFallBackHybrid(sessionID, false);
      console.log('returnParam : ', returnParam);
      return UTIL.ComposeResult('', 'followupevent_ColorMenuList', returnParam);
    }
    await setIsFallBackHybrid(sessionID, false);

    returnParam.fallbackMessage = FALLBACK_MESSAGE;
    console.log('returnParam : ', returnParam);
    return UTIL.ComposeResult('', 'followupevent_ColorMenuList', returnParam);
  } catch (err) {
    console.log('Color Error 🔻');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
}

async function get_Contract(req, keyBrand, keyDevice, keyCapacity, keyColor) {
  try {
    const arrColor = await getProductDetail_Color(keyBrand, keyDevice);
    if (!arrColor) {
      const params = req.queryResult.parameters;
      params.model = '';
      return get_Model(req, keyBrand);
    }
    console.log('arrColor : ', arrColor);
    console.log('Before keyColor : ', keyColor);
    const copyColor = keyColor;
    keyColor = arrColor.filter((e) => { if (e.value === keyColor.toLowerCase()) { return e.key; } });
    console.log('just After keyColor : ', keyColor);
    if (keyColor.length >= 1) {
      keyColor = keyColor[0].key;
      console.log('inside if After keyColor : ', keyColor);
    } else {
      // await setIsFallBackHybrid(msisdn, true)
      return get_Color(req, keyBrand, keyDevice, keyCapacity);
    }
    console.log('last After keyColor : ', keyColor);
    const sku = await getProductDetail_SKU(keyBrand, keyDevice, keyColor, keyCapacity);
    console.log('sku get_Contract : ', sku);
    if (!sku) {
      const verifyCapacity = await verifyMemory(req, keyBrand, keyDevice, keyCapacity);
      if (!verifyCapacity) {
        const sessionID = UTIL.GetSessionID(req);
        await setIsFallBackHybrid(sessionID, true);
        return get_Memory(req, keyBrand, keyDevice);
      }

      // let params = req.queryResult.parameters;
      // params["model"] = ''
      // return get_Model(req,keyBrand)

      // return UTIL.ComposeResult("", "discover_device_out_of_stock");
      return UTIL.ComposeResult('', 'Maxis_Postpaid_StockAvailableNoByBrand');
    }
    const sessionID = UTIL.GetSessionID(req);
    const cacheSkuId = await SESSION.GetCache(sessionID);
    cacheSkuId.sku_id = sku;
    await SESSION.SetCache(sessionID, cacheSkuId);

    const PlanContract = await getPlanBySKU(sku, req);
    console.log('PlanContract get_Contract', PlanContract);
    // let contractList = PlanContract;

    const isAvailable = await getProductAvailability(sku);
    // console.log("getProductAvailability get_Contract : ", isAvailable)
    // let isAvailable = true; // comment to check stock

    // if(!sku){
    //     let verifyCapacity = await verifyMemory(req, keyBrand,keyDevice,keyCapacity)
    //     if(!verifyCapacity){
    //         await setIsFallBackHybrid(msisdn, true)
    //         return get_Memory(req,keyBrand, keyDevice)
    //     }

    //     let params = req.queryResult.parameters;
    //     params["model"] = ''
    //     return get_Model(req,keyBrand)
    // }

    if (isAvailable) {
      // let contractText = { "K2": "Normal Contract", "Zerolution360": "Zerolution 360 Contract", "Zerolution": "Zerolution Contract" }
      const contractText = PlanContract;
      // let menuList     = UTIL.GetNumberedMenu(contractList.map(e=>contractText[e]));
      // let emoji = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟",
      // "1️⃣1️⃣","1️⃣2️⃣","1️⃣3️⃣","1️⃣4️⃣","1️⃣5️⃣","1️⃣6️⃣","1️⃣7️⃣",
      // "1️⃣8️⃣","1️⃣9️⃣","2️⃣0️⃣","2️⃣1️⃣","2️⃣2️⃣","2️⃣3️⃣","2️⃣4️⃣"];

      // let menuList =  PlanContract.map( (eachEle, index) => {
      //     let text = eachEle.charAt(0).toUpperCase() + eachEle.slice(1);
      //     return emoji[index]+' '+text
      // })
      const menuList = UTIL.GetNumberedMenu(PlanContract.map((e) => e));
      // latest changes for Hybrid
      console.log('contractText', contractText);

      console.log('latest changes get ContractType');
      // let cache1   = await SESSION.GetCache(msisdn);
      // const sessionID = UTIL.GetSessionID(req);
      const cache1 = await SESSION.GetCache(sessionID);

      // cache1["sessionContractType"] = Object.values(contractText)
      cache1.sessionContractType = contractText;
      await SESSION.SetCache(sessionID, cache1);

      const cache2 = await SESSION.GetCache(sessionID);
      const temp = cache2.sessionContractType;
      console.log('ContractType Temp', temp);

      //

      const returnParam = { contractTypeMenu: menuList };
      const isFallBackHybrid = await getIsFallBackHybrid(sessionID);
      if (!isFallBackHybrid) {
        await setIsFallBackHybrid(sessionID, false);
        console.log('returnParam : ', returnParam);
        return UTIL.ComposeResult('', 'followupevent_ContractTypeMenuList', returnParam);
      }
      await setIsFallBackHybrid(sessionID, false);

      returnParam.fallbackMessage = FALLBACK_MESSAGE;
      console.log('returnParam : ', returnParam);
      return UTIL.ComposeResult('', 'followupevent_ContractTypeMenuList', returnParam);
    }
    // return UTIL.ComposeResult("", "discover_device_out_of_stock");
    return UTIL.ComposeResult('', 'Maxis_Postpaid_StockAvailableNoByBrand');
  } catch (err) {
    console.log('Contract Error🔻');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
}

async function get_RatePlan(req, keyBrand, keyDevice, keyCapacity, keyColor) {
  try {
    const arrColor = await getProductDetail_Color(keyBrand, keyDevice);
    if (!arrColor) {
      const params = req.queryResult.parameters;
      params.model = '';
      return get_Model(req, keyBrand);
    }
    console.log('arrColor : ', arrColor);
    console.log('Before keyColor : ', keyColor);
    // let copyColor = keyColor
    keyColor = arrColor.filter((e) => { if (e.value === keyColor.toLowerCase()) { return e.key; } });
    console.log('just After keyColor : ', keyColor);
    if (keyColor.length >= 1) {
      keyColor = keyColor[0].key;
      console.log('inside if After keyColor : ', keyColor);
    } else {
      // await setIsFallBackHybrid(msisdn, true)
      return get_Color(req, keyBrand, keyDevice, keyCapacity);
    }
    console.log('last After keyColor : ', keyColor);
    const sku = await getProductDetail_SKU(keyBrand, keyDevice, keyColor, keyCapacity);
    if (!sku) {
      const verifyCapacity = await verifyMemory(req, keyBrand, keyDevice, keyCapacity);
      if (!verifyCapacity) {
        const sessionID = UTIL.GetSessionID(req);
        await setIsFallBackHybrid(sessionID, true);
        return get_Memory(req, keyBrand, keyDevice);
      }

      const params = req.queryResult.parameters;
      params.model = '';
      return get_Model(req, keyBrand);
    }

    const sessionID = UTIL.GetSessionID(req);
    const cacheSkuId = await SESSION.GetCache(sessionID);
    if (!cacheSkuId.sku_id) {
      cacheSkuId.sku_id = sku;
      await SESSION.SetCache(sessionID, cacheSkuId);
    }

    const PlanContract = await getPlanBySKURatePlan(sku, req);
    let AdvertisedPlan = await UTIL.GetUrl('https://productcatalog.maxis.com.my/bin/commerce/plans.json');
    AdvertisedPlan = AdvertisedPlan.plansList.map((x) => x.planGroup);
    const arrPlan = PlanContract.plan;

    let sortedArray = arrPlan.filter((e) => AdvertisedPlan.includes(e.value)).map((e) => e.value);
    sortedArray = sortedArray.sort(new Intl.Collator('en', { numeric: true, sensitivity: 'accent' }).compare);
    console.log('sortedArray RatePlan : ', sortedArray);
    const menuList = UTIL.GetNumberedMenu(sortedArray.map((e) => e));
    // let menuList = UTIL.GetNumberedMenu(arrPlan.filter(e => AdvertisedPlan.includes(e.value)).map(e => { return e.value }));

    // latest changes

    console.log('latest changes get RatePlan');
    // let cache1   = await SESSION.GetCache(msisdn);
    const cache1 = await SESSION.GetCache(sessionID);

    // cache1["sessionRatePlan"] = arrPlan.filter(e => AdvertisedPlan.includes(e.value))
    cache1.sessionRatePlan = sortedArray;
    await SESSION.SetCache(sessionID, cache1);

    const cache2 = await SESSION.GetCache(sessionID);
    const temp = cache2.sessionRatePlan;
    console.log('RatePlan Temp', temp);

    //

    const returnParam = { ratePlanMenu: menuList };
    const isFallBackHybrid = await getIsFallBackHybrid(sessionID);
    if (!isFallBackHybrid) {
      await setIsFallBackHybrid(sessionID, false);
      console.log('returnParam : ', returnParam);
      return UTIL.ComposeResult('', 'followupevent_RatePlanMenuList', returnParam);
    }
    await setIsFallBackHybrid(sessionID, false);

    returnParam.fallbackMessage = FALLBACK_MESSAGE;
    console.log('returnParam : ', returnParam);
    return UTIL.ComposeResult('', 'followupevent_RatePlanMenuList', returnParam);
  } catch (err) {
    console.log('RatePlan Error 🔻');
    console.log(err);
    return UTIL.ComposeResult('', TechIssueEnd());
  }
}

//-----------------------------------------------------------------------------------------
// Slot Filling implementation functions
//-----------------------------------------------------------------------------------------

const get_context_prefix = (query_result) => {
  //   gets the prefix string which is sent to the webhook for all output context objects'''
  const output_contexts = query_result.outputContexts;
  const first_output_context = output_contexts[0];
  // context_prefix = (String(first_output_context.name).rsplit('/', 1))[0]
  const context_prefix = String(first_output_context.name).split('/').slice(0, -1).join('/');
  return context_prefix;
};

const get_session_vars = (query_result) => {
  // get the session-vars object. In the first webhook call, it will be empty. This is because the session-vars is "populated" only after the webhook call returns
  let session_vars = null;
  const output_contexts = query_result.outputContexts;

  const session_vars_iter = [];
  output_contexts.forEach((context) => {
    if (String(context.name).endsWith('/session-vars')) {
      session_vars_iter.push(context);
    }
  });

  if (session_vars_iter.length > 0) {
    // session_vars = session_vars_iter[0];
    const sessionVarsTemp = session_vars_iter[0];
    session_vars = sessionVarsTemp;
  }
  return session_vars;
};

const get_params_from_session_vars = (session_vars) => {
  // get the list of parameters from the session-vars object. We need to "repopulate" this into the output context
  const params_from_session_vars = [];
  if (session_vars) {
    for (const [key, value] of Object.entries(session_vars.parameters)) {
      if ((String(value).trim() != '') && (!String(key).endsWith('.original'))) {
        params_from_session_vars.push(key);
      }
    }
  }
  return params_from_session_vars;
};

const get_filled_params = (params, params_from_session_vars) => {
  // find the list of parameters which have already been populated and combine the parameters which were extracted in the current step and the parameters which were extracted in the previous steps
  const filled_params = [];

  for (const [key, value] of Object.entries(params)) {
    if ((String(value).trim() != '') && (!String(key).endsWith('.original'))) {
      if (!params_from_session_vars.includes(key)) {
        filled_params.push(String(key).trim());
      }
    }
  }
  filled_params.push(...params_from_session_vars);
  return filled_params;
};

const get_first_unfilled_slot = (filled_params, ordered_slots) => {
  // calculate the first unfilled slot
  let first_unfilled_slot = 'completed';
  for (const slot in ordered_slots) {
    if (!filled_params.includes(ordered_slots[slot])) {
      first_unfilled_slot = ordered_slots[slot];
      break;
    }
  }
  return first_unfilled_slot;
};

const check_slots = async (req) => {
  // set a parameter value in an output context and trigger a follow up event (custom event)

  let context_prefix; let error_str; let first_unfilled_slot; let ordered_slots;
  let params; let query_result; let result; let
    session_vars;
  let filled_params = [];
  let params_from_session_vars = [];

  try {
    ordered_slots = ['brand', 'model', 'memory', 'color', 'contractType', 'ratePlan'];
    query_result = req.queryResult;
    params = query_result.parameters;
    context_prefix = get_context_prefix(query_result);
    session_vars = get_session_vars(query_result);
    params_from_session_vars = get_params_from_session_vars(session_vars);
    filled_params = get_filled_params(params, params_from_session_vars);

    // latest changes for Hybrid

    const detect_intent = req.queryResult.intent.displayName;
    let brandName = session_vars.parameters.brand;
    brandName = brandName.toLowerCase();
    let modelNo = session_vars.parameters.model;
    new_model_no = modelNo.split(' ').join('-').toLowerCase();
    // // plus changes
    if (new_model_no.includes('+')) {
      new_model_no = new_model_no.replace('+', '-plus');
    }
    //

    const storage = session_vars.parameters.memory;
    const { color } = session_vars.parameters;
    const contract = session_vars.parameters.contractType;
    const { ratePlan } = session_vars.parameters;

    const iphone = 'iphone';
    const galaxy = 'galaxy';
    if (brandName.toLowerCase().includes(iphone)
            || query_result.queryText.toLowerCase().includes(iphone)) {
      brandName = 'apple';
      params.brand = 'apple';
    }
    if (modelNo.toLowerCase().includes(iphone)) {
      brandName = 'apple';
      params.brand = 'apple';
      filled_params = get_filled_params(params, params_from_session_vars);

      modelNo = modelNo.substring(modelNo.indexOf(iphone));

      if (modelNo.toLowerCase() === iphone) {
        params.model = '';
        modelNo = '';
        filled_params = get_filled_params(params, params_from_session_vars);
        return UTIL.ComposeResult('', 'model', req.queryResult.parameters);
      }

      if (/[1-9]/g.test(Number(modelNo[6]))) {
        const tempModelNoVar = modelNo.split('');
        tempModelNoVar.splice(6, 0, '-');
        modelNo = tempModelNoVar.join('');
        params.model = modelNo;
      }
    }
    if (modelNo.toLowerCase().includes(galaxy)) {
      brandName = 'samsung';
      params.brand = 'samsung';
      filled_params = get_filled_params(params, params_from_session_vars);
    }

    if (modelNo === '*' || brandName === '*' || ratePlan === '*'
            || brandName.toLowerCase() === 'phone' || query_result.queryText === '*') {
      return UTIL.ComposeResult('', 'greetings_commonMenu_displayName', req.queryResult.parameters);
    }

    if ((modelNo.toLowerCase().includes('bill')
           || brandName.toLowerCase().includes('bill')
           || ratePlan.toLowerCase().includes('bill')
           || query_result.queryText.toLowerCase().includes('bill'))
           && detect_intent != 'Hybrid.MovingTo.PayMyBills - no') {
      return UTIL.ComposeResult('', 'Hybrid_MovingTo_PayMyBills', req.queryResult.parameters);
    }

    // if (detect_intent === 'PreviousMenu' || detect_intent === 'Hybrid.MovingTo.PayMyBills - no' ){
    //     if(ratePlan.toLowerCase().includes('bill')){
    //         get_RatePlan(req, brandName, new_model_no, storage, color )
    //     }
    // }

    if (modelNo === '#' || modelNo.replace(' ', '').toLowerCase() === 'goback'
            || brandName === '#' || brandName.replace(' ', '').toLowerCase() === 'goback'
            || ratePlan === '#' || ratePlan.replace(' ', '').toLowerCase() === 'goback'
            || modelNo.toLowerCase() === 'back' || brandName.toLowerCase() === 'back'
            || ratePlan.toLowerCase() === 'back' || color === '#' || contract === '#' || storage === '#') {
      if (brandName === '#') {
        params.brand = '';
      }
      if (modelNo === '#') {
        params.model = '';
      }
      if (ratePlan === '#') {
        params.ratePlan = '';
      }
      if (color === '#') {
        params.color = '';
      }
      if (storage === '#') {
        params.memory = '';
      }
      if (contract === '#') {
        params.contractType = '';
      }
      ordered_slots = ['brand', 'model', 'memory', 'color', 'contractType', 'ratePlan'];
      const filled = [];
      ordered_slots.forEach((i) => {
        if (filled_params.includes(i)) {
          filled.push(i);
        }
      });
      filled.pop();
      console.log('filled_params ', filled);
      // console.log("filled_params "+JSON.stringify(filled))
      filled_params = filled;
    }

    first_unfilled_slot = get_first_unfilled_slot(filled_params, ordered_slots);
    console.log(`params ${JSON.stringify(params)}`);
    console.log(`context_prefix ${context_prefix}`);
    console.log(`session_vars ${JSON.stringify(session_vars)}`);
    console.log(`params_from_session_vars ${JSON.stringify(params_from_session_vars)}`);
    console.log(`filled_params ${JSON.stringify(filled_params)}`);
    console.log(`first_unfilled_slot ${first_unfilled_slot}`);

    console.log('check slot : ');
    console.log('brandName, modelNo, storage, color, contract, ratePlan');
    console.log('brandName : ', brandName);
    console.log('modelNo : ', modelNo);
    console.log('storage : ', storage);
    console.log('color : ', color);
    console.log('contract : ', contract);
    console.log('ratePlan : ', ratePlan);
    console.log('check slot detect intent : ', detect_intent);

    // let cache2    = await SESSION.GetCache(msisdn);
    const sessionID = UTIL.GetSessionID(req);
    const cache2 = await SESSION.GetCache(sessionID);

    // let numberOutOfList = false

    if (detect_intent === 'provides.brand') {
      // if(Number.isInteger(Number(brandName))){
      if (!isNaN(brandName)) {
        const validatedValue = await checkForNumericInput(req, brandName, detect_intent);
        if (validatedValue) {
          params.brand = validatedValue;
        } else {
          params.brand = '';
          // numberOutOfList = true
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'brand', req.queryResult.parameters);
        }
      } else {
      // else{
      //     console.log('brand in else to verify user input')
      //     let sessionBrandsTemp = cache2["sessionBrands"]
      //     console.log("sessionBrands verify user input", sessionBrandsTemp)

        //     let brandValue = await checkForConverstionalText(sessionBrandsTemp, brandName)
        //     console.log("brandValue", brandValue)

        //     if(!brandValue){
        //         params["brand"] = ''
        //         await setIsFallBackHybrid(msisdn, true)
        //         return UTIL.ComposeResult("", "brand", req.queryResult.parameters);
        //     }else{
        //         params["brand"] = brandValue
        //     }
        // }

        console.log('Brands in else to verify user input');
        const sessionBrandsTemp = cache2.sessionBrands;
        console.log('sessionBrands verify user input', sessionBrandsTemp);

        let sortedBrandsArray;
        if (sessionBrandsTemp) {
          sortedBrandsArray = sessionBrandsTemp.map((e) => e.toLowerCase());
        }

        console.log('sortedBrandsArray ', sortedBrandsArray);

        if (!sortedBrandsArray.includes(brandName.toLowerCase())) {
          params.Brands = '';
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'brand', req.queryResult.parameters);
        }
      }
    } else if (detect_intent === 'provides.model') {
      // if(Number.isInteger(Number(modelNo))){
      if (!isNaN(modelNo)) {
        const validatedValue = await checkForNumericInput(req, modelNo, detect_intent);
        if (validatedValue) {
          params.model = validatedValue;
        } else {
          params.model = '';
          // numberOutOfList = true
          await setIsFallBackHybrid(sessionID, true);
          return await get_Model(req, brandName);
          // return UTIL.ComposeResult("", "model", req.queryResult.parameters);
        }
      } else if (modelNo === '#') {
        params.model = '';
        return UTIL.ComposeResult('', 'brand', req.queryResult.parameters);
      } else {
        console.log('Model in else to verify user input');
        const sessionModelTemp = cache2.sessionModel;
        console.log('sessionModel verify user input', sessionModelTemp);

        let sortedModelArray;
        if (sessionModelTemp) {
          sortedModelArray = sessionModelTemp.map((e) => e.key);
        }

        console.log('sortedModelArray ', sortedModelArray);
        // plus changes
        if (new_model_no.includes('-plus')) {
          new_model_no = new_model_no.replace('-plus', '+');
        }
        //
        if (!sortedModelArray.includes(new_model_no)) {
          params.model = '';
          await setIsFallBackHybrid(sessionID, true);
          // return UTIL.ComposeResult("", "model", req.queryResult.parameters);
          return await get_Model(req, brandName);
        }
      }
    } else if (detect_intent === 'provides.memory') {
      console.log('provides.memory i am in ');
      // if(Number.isInteger(Number(storage))){
      if (!isNaN(storage)) {
        const validatedValue = await checkForNumericInput(req, storage, detect_intent);
        if (validatedValue) {
          params.memory = validatedValue;
        } else {
          params.memory = '';
          // numberOutOfList = true
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'memory', req.queryResult.parameters);
        }
      } else if (storage === '#') {
        params.memory = '';
        return UTIL.ComposeResult('', 'model', req.queryResult.parameters);
      } else {
        console.log('Memory in else to verify user input');
        const sessionMemoryTemp = cache2.sessionMemory;
        console.log('sessionMemory verify user input', sessionMemoryTemp);

        let sortedMemoryArray;
        if (sessionMemoryTemp) {
          sortedMemoryArray = sessionMemoryTemp.map((e) => e.replace(/-|\s/g, '').toLowerCase());
        }

        console.log('sortedMemoryArray ', sortedMemoryArray);

        if (!sortedMemoryArray.includes(storage.replace(/-|\s/g, '').toLowerCase())) {
          params.memory = '';
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'memory', req.queryResult.parameters);
        }
      }
    } else if (detect_intent === 'provides.color') {
      // if(Number.isInteger(Number(color))){
      if (!isNaN(color)) {
        const validatedValue = await checkForNumericInput(req, color, detect_intent);
        if (validatedValue) {
          params.color = validatedValue;
        } else {
          params.color = '';
          // numberOutOfList = true
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'color', req.queryResult.parameters);
        }
      } else if (color === '#') {
        params.color = '';
        return UTIL.ComposeResult('', 'memory', req.queryResult.parameters);
      } else {
        console.log('Color in else to verify user input');
        const sessionColorTemp = cache2.sessionColor;
        console.log('sessionColor verify user input', sessionColorTemp);

        let sortedColorArray;
        if (sessionColorTemp) {
          sortedColorArray = sessionColorTemp.map((e) => e.value.replace(/-|\s/g, '').toLowerCase());
        }

        console.log('sortedColorArray ', sortedColorArray);

        if (!sortedColorArray.includes(color.replace(/-|\s/g, '').toLowerCase())) {
          console.log('failed color ', color);
          params.color = '';
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'color', req.queryResult.parameters);
        }
      }
    } else if (detect_intent === 'provides.contractType') {
      // if(Number.isInteger(Number(contract))){
      if (!isNaN(contract)) {
        const validatedValue = await checkForNumericInput(req, contract, detect_intent);
        if (validatedValue) {
          params.contractType = validatedValue;
        } else {
          params.contractType = '';
          // numberOutOfList = true
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'contractType', req.queryResult.parameters);
        }
      } else if (contract === '#') {
        params.contractType = '';
        return UTIL.ComposeResult('', 'color', req.queryResult.parameters);
      } else {
        console.log('ContractType in else to verify user input');
        const sessionContractTypeTemp = cache2.sessionContractType;
        console.log('sessionContractType verify user input', sessionContractTypeTemp);

        let sortedContractTypeArray;
        if (sessionContractTypeTemp) {
          sortedContractTypeArray = sessionContractTypeTemp.map((e) => e.replace(/-|\s/g, '').toLowerCase());
        }

        console.log('sortedContractTypeArray ', sortedContractTypeArray);

        if (!sortedContractTypeArray.includes(contract.replace(/-|\s/g, '').toLowerCase())) {
          console.log('sortedContractTypeArray ', contract.replace(/-|\s/g, '').toLowerCase());
          params.contractType = '';
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'contractType', req.queryResult.parameters);
        }
      }
    } else if (detect_intent === 'provides.ratePlan') {
      // if(Number.isInteger(Number(ratePlan))){
      if (!isNaN(ratePlan)) {
        const validatedValue = await checkForNumericInput(req, ratePlan, detect_intent);
        if (validatedValue) {
          params.ratePlan = validatedValue;
        } else {
          params.ratePlan = '';
          // numberOutOfList = true
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'ratePlan', req.queryResult.parameters);
        }
      } else if (ratePlan === '#') {
        params.ratePlan = '';
        return UTIL.ComposeResult('', 'contractType', req.queryResult.parameters);
      } else {
        console.log('RatePlan in else to verify user input');
        const sessionRatePlanTemp = cache2.sessionRatePlan;
        console.log('sessionRatePlan verify user input', sessionRatePlanTemp);

        let sortedRatePlanArray;
        if (sessionRatePlanTemp) {
          sortedRatePlanArray = sessionRatePlanTemp.map((e) => e.toLowerCase());
        }

        console.log('sortedRatePlanArray ', sortedRatePlanArray);

        // if(!sortedRatePlanArray.includes(ratePlan.replace(/-|\s/g,"").toLowerCase())){
        if (!sortedRatePlanArray.includes(ratePlan.toLowerCase())) {
          console.log('sortedRatePlanArray ', ratePlan.toLowerCase());
          params.ratePlan = '';
          await setIsFallBackHybrid(sessionID, true);
          return UTIL.ComposeResult('', 'ratePlan', req.queryResult.parameters);
        }
      }
    } else {
      console.log('All params are present in check slot');
    }

    console.log('params before sending ', params);

    //
    result = {
      Text: '',
      Context:
                {
                  name: `${context_prefix}/session-vars`,
                  lifespanCount: 50,
                  parameters: params,
                },
      FollowUpEvent: first_unfilled_slot,
      Parameters: params,

    };

    console.log(`result: ${JSON.stringify(result)}`);

    return result;
  } catch (e) {
    error_str = JSON.stringify(e);
    return `Error-${error_str}`;
  }
};

//-----------------------------------------------------------------------------------------
// Menu Creation implementation functions
//-----------------------------------------------------------------------------------------

const fetch_menu = async (req) => {
  console.log('inside fetch menu');
  const detect_intent = req.queryResult.intent.displayName;
  session_vars = get_session_vars(req.queryResult);
  let brandName = session_vars.parameters.brand;
  brandName = brandName.toLowerCase();
  const modelNo = session_vars.parameters.model;
  new_model_no = modelNo.split(' ').join('-').toLowerCase();
  // plus changes
  if (new_model_no.includes('+')) {
    new_model_no = new_model_no.replace('+', '-plus');
  }
  //
  let storage = session_vars.parameters.memory;
  const { color } = session_vars.parameters;
  const contract = session_vars.parameters.contractType;
  const { ratePlan } = session_vars.parameters;
  const context_prefix = get_context_prefix(req.queryResult);

  if (typeof (storage) !== 'string') {
    // storage = storage[0];
    const storageTemp = storage[0];
    storage = storageTemp;
  }

  // __
  let params = req.queryResult.parameters;

  console.log(`params inside fetch menu : ${JSON.stringify(params)}`);
  console.log(`context_prefix inside fetch menu : ${context_prefix}`);
  console.log(`session_vars inside fetch menu : ${JSON.stringify(session_vars)}`);

  console.log('fetch menu : ');
  console.log('inside fetch menu brandName, modelNo, storage, color, contract, ratePlan');
  console.log('inside fetch menu brandName : ', brandName);
  console.log('inside fetch menu modelNo : ', new_model_no);
  console.log('inside fetch menu storage : ', storage);
  console.log('inside fetch menu color : ', color);
  console.log('inside fetch menu contract : ', contract);
  console.log('inside fetch menu ratePlan : ', ratePlan);
  console.log('inside fetch menu check slot detect intent : ', detect_intent);

  // --

  console.log('detect_intent : ', detect_intent);
  if (detect_intent === 'followupevent.brand') {
    return get_Brand(req);
  } if (detect_intent === 'followupevent.model') {
    return get_Model(req, brandName);
  } if (detect_intent === 'followupevent.memory') {
    if (brandName && new_model_no) {
      const verifyModel = await verifyModelNo(req, new_model_no, brandName);
      console.log('verifyModel in memory', verifyModel);
      if (isNaN(new_model_no) && verifyModel) {
        return get_Memory(req, brandName, new_model_no);
      }
      return get_Model(req, brandName);
    }
  } else if (detect_intent === 'followupevent.color') {
    if (brandName && new_model_no) {
      const verifyModel = await verifyModelNo(req, new_model_no, brandName);
      console.log('verifyModel in color', verifyModel);
      if (isNaN(new_model_no) && verifyModel) {
        if (storage) {
          return get_Color(req, brandName, new_model_no, storage);
        }
        return get_Memory(req, brandName, new_model_no);
      }
      return get_Model(req, brandName);
    }
  } else if (detect_intent === 'followupevent.contractType') {
    console.log('inside fetch menu followupevent.contractType : ', detect_intent);
    if (brandName && new_model_no && storage && color) {
      console.log('inside followupevent.contractType passed first cond: ', new_model_no);
      const verifyModel = await verifyModelNo(req, new_model_no, brandName);
      console.log('verifyModel in contract', verifyModel);
      if (isNaN(new_model_no) && verifyModel) {
        return get_Contract(req, brandName, new_model_no, storage, color);
      }
      return get_Model(req, brandName);
    }
  } else if (detect_intent === 'followupevent.ratePlan') {
    if (brandName && new_model_no && storage && color) {
      // if(!Number.isInteger(Number(new_model_no))){
      const verifyModel = await verifyModelNo(req, new_model_no, brandName);
      console.log('verifyModel in ratePlan', verifyModel);
      if (isNaN(new_model_no) && verifyModel) {
        return get_RatePlan(req, brandName, new_model_no, storage, color);
      }
      return get_Model(req, brandName);
    }
  } else {
    console.log('All params are present');
    if (brandName && modelNo && storage && color) {
      console.log('brandName && modelNo && storage && color');
      if (ratePlan.toLowerCase().includes('bill')) {
        console.log('All params are bill');
        return get_RatePlan(req, brandName, new_model_no, storage, color);
        // return UTIL.ComposeResult("", "ratePlan", req.queryResult.parameters);
      }
    }

    // let SkuSummary = {
    //     DeviceName: modelNo,
    //     DeviceCapacity: storage,
    //     DeviceColor: color,
    //     ContractType: Contract,
    //     RatePlan: ratePlan
    //   }
    // Cache["SkuSummary"] = SkuSummary
    // await SESSION.SetCache(msisdn, Cache);

    // exports.HotlinkPostPaidDeviceURL = async function (event, isFallBack = false) {
    //     try {
    //       let brandName = Cache["SelectedBrand"];
    //       let modelName = Cache["SelectedModel"];
    //       let Contract = Cache["SelectedContract"];
    //       let sku_id = Cache["sku_id"];
    //       let Category = "mobiles"
    const newBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    // let modelName1 = newBrand +' '+ modelNo;
    const newColor = color.charAt(0).toUpperCase() + color.slice(1);
    const sessionID = UTIL.GetSessionID(req);
    const Cache = await SESSION.GetCache(sessionID);
    storage = storage.toUpperCase();
    Cache.SelectedBrand = brandName;
    Cache.SelectedModel = modelNo;
    Cache.SelectedContract = contract;
    Cache.SelectedCapacity = storage;
    Cache.SelectedColor = newColor;
    Cache.ratePlan_list = ratePlan;
    Cache.SelectedRatePlan = ratePlan;
    await SESSION.SetCache(sessionID, Cache);
    console.log(' Cache befor moving to menu based approach : ', Cache);

    const returnParam = {
      brandName: newBrand,
      modelName: modelNo,
      contractName: contract,
      CapacityName: storage,
      color: newColor,
      ratePlanName: ratePlan, 
    };
    // return UTIL.ComposeResult("","MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_SKUSummaryOutput",returnParam);
    return UTIL.ComposeResult('', 'Maxis_Postpaid_SKUByBrand', returnParam);
  }
  // return UTIL.ComposeResult("you have missed some parameters, \npress # to go back ", "", req.queryResult.parameters);
  return get_Model(req, brandName);
};

//-----------------------------------------------------------------------------------------
// Webhook implementation functions
//-----------------------------------------------------------------------------------------
exports.hybrid = async function (req) {
  console.log(`event: ${JSON.stringify(req)}`);
  const detect_intent = req.queryResult.intent.displayName;
  console.log(`Intent Detected: ${JSON.stringify(detect_intent)}`);

  //  map the the intent with a function to perform that functionality for that intent
  let result;
  const arr = ['followupevent.brand', 'followupevent.model', 'followupevent.memory', 'followupevent.color',
    'followupevent.contractType', 'followupevent.ratePlan', 'followupevent.completed'];

  if (arr.includes(detect_intent)) {
    // Menu Creation
    result = await fetch_menu(req);
  } else if (detect_intent === 'PayMaxisBilllHybrid') {
    // let sessionBrandsForBills = cache1["sessionBrands"]

    const session_vars = await get_session_vars(req.queryResult);
    // if(sessionBrandsForBills && session_vars){
    if (session_vars) {
      // Moving to Different Flow - Pay Bill
      return UTIL.ComposeResult('', 'Hybrid_MovingTo_PayMyBills', req.queryResult.parameters);
    }
    return UTIL.ComposeResult('', 'Paybill_Menu_Query', req.queryResult.parameters);
  } else if (detect_intent === 'Hybrid.MovingTo.PayMyBills - no') {
    // else if (detect_intent === "PayMaxisBilllHybrid - no") {
    // Moving to Different Flow - Pay Bill - no
    console.log('back in  Hybrid.MovingTo.PayMyBills - no');
    return await check_slots(req);
  } else if (detect_intent === 'Hybrid.MovingTo.PayMyBills - yes') {
    // Moving to Different Flow - Pay Bill - yes
    return UTIL.ComposeResult('', 'Paybill_Menu_Query', req.queryResult.parameters);
  } else {
    // Slot Filling Call
    result = await check_slots(req);
  }
  console.log(`final log result${result}`);

  return result;
};
