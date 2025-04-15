const { default: async } = require("async");
const AWS = require("aws-sdk");
const redis = require('redis');
const _ = require('lodash');

const UTIL = require("./Util");
const DEVICE_DISCOVERY = require("./UserStory_DeviceDiscovery");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");
const redisCache = require('./CacheConstants');
const redisData = require('./CacheUtil');

let stock_avaliablity = false;

const location = new AWS.Location();
// const FALLBACK_MESSAGE_SALES = process.env.FALLBACK_MESSAGE_SALES;
const { FALLBACK_MESSAGE_SALES } = process.env;
// const FALLBACK_MESSAGE = process.env.FALLBACK_MESSAGE;

//----------------------------------------------------------------------------------------
// 👇 helper functions intended for the currect usecase
//----------------------------------------------------------------------------------------
function TechIssueEnd() {
  return "Shared_Tech_Issue";
}

function HotlinkTechIssueEnd() {
  return "Shared_HotlinkPostpaid_Tech_Issue"
}

function MaxisTechIssueEnd() {
  return "Shared_Tech_IssueServicingMaxis";
}

function AssignFallBack(param) {
  return param["fallbackMessage"] = FALLBACK_MESSAGE_SALES;
}

// for getting the value using the key from redis
var client = redis.createClient({ url: process.env.REDIS_CLUSTER_URL });
client.connect();

async function CustomerVerification(event) {
  let followUpEvent = "main_menu_olo";
  try {
    let sessionID = UTIL.GetSessionID(event);
    let customerType = await SESSION.GetCustomerType(sessionID);
    console.log("customerType***********", customerType, customerType["accType"], customerType["accType"] == "Principal");
    if (customerType["accType"] == "Principal") {
      followUpEvent = "Greeting_MainMenu";
      return followUpEvent;
    }
    if (customerType["accType"] == "Supplementary") {
      followUpEvent = "main_menu_maxis_supplementary";
      return followUpEvent;
    }
    if (customerType["subType"] == "Dealer") {
followUpEvent = "main_menu_olo";
      return followUpEvent;
    }
    if (customerType["isSuspended"]) {
followUpEvent = "main_menu_olo";
      return followUpEvent;
    }
    if (customerType["subType"] === "Maxis Individual") {
      if (customerType["cusType"] == "Consumer") {
        followUpEvent = "main_menu_prepaid";
        return followUpEvent;
      } else {
        followUpEvent = "main_menu_olo";
        return followUpEvent;
      }
    }
    return followUpEvent;
  } catch (err) {
    console.log(err);
    followUpEvent = "main_menu_olo";
    return followUpEvent;
  }
}

async function getCustomerBillingAddress(msisdn,accountNo, sessionID) {
  let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/contact?msisdn=${msisdn}&accountno=${accountNo}`;
  let head = {"headers": {"maxis_channel_type" : "MAXBOT", "languageid":"en-US"}};

  let data = await UTIL.GetUrl(url, head, msisdn,sessionID);
  return data.responseData;
}

async function getOnlineStock(sku_id) {
  let url = `${HOST.HOTLINK_STOCK_AVAILABILITY[HOST.TARGET]}/offline/api/v1.0/inventories/PJ07/${sku_id}?senderId=MC&source=SAP&type=shipping&isStockPickupRealTime=false`;
  let head = {"headers": {"apikey": "D58C1567-92A8-4F8F-8C16-DDF16ECDBA39", "maxis_channel_type" : "MAXBOT"}};

  let data = await UTIL.GetUrl(url, head);
  return data.responseData.productAvailability;
}

async function getStoreStock(sku_id) {
  try {
    let url = `${HOST.HOTLINK_STOCK_AVAILABILITY[HOST.TARGET]}/offline/api/v1.0/inventories/PJ07/${sku_id}?senderId=MC&source=SAP&type=storepickup&isStockPickupRealTime=false`;
    let head = {"headers": {"apikey": "D58C1567-92A8-4F8F-8C16-DDF16ECDBA39", "maxis_channel_type" : "MAXBOT"}};

    let data = await UTIL.GetUrl(url, head);
    if (data.status == "success") {
      let stockAvailable = data['responseData']['productAvailability'].filter((item) => item['balance'] > 0)

      return stockAvailable;
    } else {
      return [];
    }
  } catch (err) {
    console.log("error 🛑", err);
    throw err;
  }
}

async function getmaxisPostpaidContractwear(skuID) {
  let url = `${HOST.Product_wearable[HOST.TARGET]}/accessory/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&familyType=MOP`;
  let head = {
    "method": "GET",
    "headers": { "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
  };
  let data = await UTIL.GetUrl(url, head);
  if (data.status == "success") {
    let plans = [];
    data['responseData'][0]['plan'].map((item, index) => {
      item.contract.map((itemChild, indexChild) => {
        if (itemChild.name =="Zerolution") {
          itemChild.tenure = parseInt(itemChild.tenure)+1;
        }
        itemChild.name = (itemChild.name).replace("K2","Normal Contract")
        plans.push(`${itemChild.name} ${itemChild.tenure}-Months Contract`);
      });
    })
    return [...new Set(plans)];
  } else {
    return false;
  }
}

async function getmaxisPostpaidContractTabletWear(skuID) {
  let url = `${HOST.Product_wearable_tablet[HOST.TARGET]}/device/plans?languageId=1&customerType=C&customerSubType=M&sku=${skuID}&serviceType=GSM&filterPlans=MOP,TABLET`;
  let head = {
    "method": "GET",
    "headers": { "maxis_channel_type": "MAXBOT", "languageid": "en-US" },
  };
  let data = await UTIL.GetUrl(url, head);
  if (data.status == "success") {
    let plans = [];
    data['responseData'][0]['plan'].map((item, index) => {
      item.contract.map((itemChild, indexChild) => {
        if (itemChild.name =="Zerolution") {
          itemChild.tenure = parseInt(itemChild.tenure)+1;
        }
        itemChild.name = (itemChild.name).replace("K2","Normal Contract")
        plans.push(`${itemChild.name} ${itemChild.tenure}-Months Contract`);
      })
    })
    return [...new Set(plans)];
  } else {
    return false;
  }
}

const withinRadius = (point, interest) => {
  ("use strict");
  let R = 6371;
  let deg2rad = (n) => {
    return Math.tan(n * (Math.PI / 180));
  };

  let dLatitude = deg2rad(interest.latitude - point.latitude);
  let dLongitude = deg2rad(interest.longitude - point.longitude);

  let a =
    Math.sin(dLatitude / 2) * Math.sin(dLatitude / 2) +
    Math.cos(deg2rad(point.latitude)) *
      Math.cos(deg2rad(interest.latitude)) *
      Math.sin(dLongitude / 2) *
      Math.sin(dLongitude / 2);
  let c = 2 * Math.asin(Math.sqrt(a));
  let d = R * c;
  return {
    ...interest,
    distance: d,
  };
};

const findCoordinates = (searchedText) => {
  let params = {
    // TODO: PlaceIndex name should configure according to the env
    IndexName: "checkDeviceGeocoding",
    Text: searchedText,
    FilterCountries: ['MYS'],
  };
  return new Promise((resolve, reject) => {
    location.searchPlaceIndexForText(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          longitude: data.Results[0].Place.Geometry.Point[0],
          latitude: data.Results[0].Place.Geometry.Point[1],
        });
      }
    });
  });
};

const findNearbyStores = (coordinates, maxisStores) => {
  const filterRadiusKm = 30;
  const returnCount = 10
  let mappedStore = maxisStores
    .map((store) => withinRadius(coordinates, store))
    .filter((store) => store.distance <= filterRadiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, returnCount);
  console.log("🏪 Stores => ", mappedStore);

  return mappedStore;
};

const formatStores = (stores) => {
  return UTIL.GetNumberedMenu(stores.map((store) => `${store.storeName} (Distance: ${store.distance.toFixed(2)}KM)`));
}

const getPlacePoint = (param) => {
  return new Promise((resolve, reject) => {
    let queryLocation = param["location"];
    let queryAddress = param["fullAddress"];
    const pointFromLongLat = new Promise((resolves) => {
      if (queryLocation) {
        resolves({
          longitude: parseFloat(queryLocation ? queryLocation.longitude : param.longitude),
          latitude: parseFloat(queryLocation ? queryLocation.latitude : param.latitude),
        });
      }
    });

    const pointFromSearch = new Promise((resolves, rejects) => {
      if (queryAddress) {
        findCoordinates(queryAddress)
          .then((res) => resolves(res))
          .catch((e) => rejects(e));
      }
    });

    Promise.race([pointFromLongLat, pointFromSearch])
      .then((res) => resolve(res))
      .catch((e) => reject(e));
  });
};

const getNearbyStores = async (event, fullAddress, locations) => {
  let sessionID = UTIL.GetSessionID(event);
  let Cache = await SESSION.GetCache(sessionID);
  let allMaxisStores = await client.get(redisCache.Store_List);
  allMaxisStores = JSON.parse(allMaxisStores)

  let storeResponse;

  const locationParam = {
    location: locations,
    fullAddress
  };

  await getPlacePoint(locationParam)
    .then((coordinates) => {
      return findNearbyStores(coordinates, allMaxisStores);
    })
    .then(async (stores) => {
      if (stores.length > 0) {
        Cache['nearbyStores'] = stores;
        await SESSION.SetCache(sessionID, Cache);
        console.log('💾 Saved stores in cache => ', stores)
        return formatStores(stores);
      }
    })
    .then((response) => storeResponse = response)
    .catch((e) => console.error(e));
  return storeResponse;
}

exports.DiscoverMaxisProductServices_CheckDeviceStock_Channel_Store = async function (event) {
  let sessionID = UTIL.GetSessionID(event);
  let Cache = await SESSION.GetCache(sessionID);
  let aselection = Cache["aselection"];
  if (aselection==4) {intentName= "MaxisPostpaid";} else if (aselection==3) {intentName= "HotlinkPostpaid";}
  console.log("intentName******",intentName);
  let followUpEvent = await CustomerVerification(event);
  console.log("followUpEvent******",followUpEvent);
  try {
    if (followUpEvent == "Greeting_MainMenu") {// POSTPAID CUSTOMER
      console.log("first***********");
      if (intentName == "MaxisPostpaid" || intentName == "HotlinkPostpaid") {
        console.log("second***********");
        // let sessionID = UTIL.GetSessionID(event);
        let msisdn = await SESSION.GetMSISDN(sessionID);
        // let Cache = await SESSION.GetCache(sessionID);
        // 🔐EXECUTE AUTHENTICATION
        //------------------------------------------------------------------------------
        let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
        if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
        //-------------------------------------------------------------------------------
        return UTIL.ComposeResult("", "CheckDeviceStock_PreferredAddressSelection");// --return to 3.1.1_10
      }
    } else if (followUpEvent == "main_menu_prepaid" || followUpEvent == "main_menu_olo") {// OLO CUSTOMER
      console.log("third***********");
      // if (intentName == "MaxisPostpaid" || intentName == "HotlinkPostpaid") return UTIL.ComposeResult("", "DeviceDiscoveryOLOMenu");//--return to 2.3 & 2.4
      // let sessionID = UTIL.GetSessionID(event);
      let msisdn = await SESSION.GetMSISDN(sessionID);
      // let Cache = await SESSION.GetCache(sessionID);
      // 🔐EXECUTE AUTHENTICATION
      //------------------------------------------------------------------------------
      let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
      if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
      //-------------------------------------------------------------------------------
      return UTIL.ComposeResult("", "AddressInputSelection_OLO");// --return to 3.1.1_21
    } else {
      return UTIL.ComposeResult("","Shared_Tech_IssueServicing");
    }
  } catch (err) {
    console.log(err);
  }
}

exports.DiscoverMaxisProductServices_CheckDeviceStock_Channel_Online = async function (event , isFallBack = false) {
  let sessionID = UTIL.GetSessionID(event);
  let Cache = await SESSION.GetCache(sessionID);
  let arrBrand = JSON.parse(Cache["color_list"]);
  let modelName = Cache["SelectedModel"];
  let Storage = Cache["SelectedCapacity"];
  let Color = "";
  // let aselection = Cache["aselection"];
  // let bselection = Cache["bselection"];
  let { aselection } = Cache;
  let { bselection } = Cache;
  if (aselection==4) {
    intentName= "MaxisPostpaid";
    await SESSION.SetIdlePlanType(sessionID, "Maxis-DeviceDiscovery")
  } else if (aselection==3) {
    intentName= "HotlinkPostpaid";
    await SESSION.SetIdlePlanType(sessionID, 'Hotlink-DeviceDiscovery')
  }

  if (event.queryResult.queryText==='Shared.Idle.AgentAssist') {
    return UTIL.ComposeResult("","Shared_Idle_AgentAssist")
  }

  // let followUpEvent = await CustomerVerification(event);

  try {
    // if (followUpEvent == "Greeting_MainMenu") {//POSTPAID CUSTOMER
    if (intentName == "MaxisPostpaid") { // --return to 2.1.3_6
      if (isFallBack!=true) {
        if (isFallBack == false) {
          let color = Cache["SelectedColor"];
          let Indexbrand = arrBrand.indexOf(color);
          // VALIDATION: go back to brand if brand index is outside range
          if (isNaN(Indexbrand) || Indexbrand < 0 || Indexbrand > arrBrand.length) {
            return DEVICE_DISCOVERY.MaxisPostpaidExploreDevcieGetColors(event, true);
          } else {
            Color = arrBrand[Indexbrand]
            Cache["SelectedColor"] = Color
          }
        }

        let sku_id = await client.get(redisData.getSkuIdByMaxisDeviceSelection(modelName, Storage, Color))
        sku_id = sku_id.replace(/"/g, "")
        Cache["sku_id"] = sku_id;

        stock_avaliablity = await DEVICE_DISCOVERY.getStockavailabiltiymaxisPostpaid(sku_id)
        if (stock_avaliablity == true) {
          let contract_list_available; //= await DEVICE_DISCOVERY.getmaxisPostpaidContract(sku_id)
          if (bselection == 3) {
            contract_list_available = await getmaxisPostpaidContractwear(sku_id)
          } else if (bselection == 2) {
            Cache["flowInfo"] = "notifyMe";
            contract_list_available = await getmaxisPostpaidContractTabletWear(sku_id)
          } else {
            contract_list_available = await DEVICE_DISCOVERY.getmaxisPostpaidContract(sku_id)
          }
          Cache["contract_list_available"] = contract_list_available;
          await SESSION.SetCache(sessionID, Cache);
          contractMenu = UTIL.GetNumberedMenu(contract_list_available);
          let returnParam = { "skuid": sku_id, "contractMenu": contractMenu }; if (isFallBack) AssignFallBack(returnParam);
          await SESSION.SetIdleLastEvent(sessionID, "Maxis_Postpaid_ContractSelectionByBrand")
          await SESSION.SetIdlelastEventParam(sessionID, returnParam)
          return UTIL.ComposeResult("", "Maxis_Postpaid_ContractSelectionByBrand", returnParam);
        } else if (stock_avaliablity == false) {
          await SESSION.SetIdleLastEvent(sessionID, "Maxis_Postpaid_StockAvailableNoByBrand")
          await SESSION.SetIdlelastEventParam(sessionID, "")
          return UTIL.ComposeResult("","Maxis_Postpaid_StockAvailableNoByBrand");
        }
      } else {
        console.log("DiscoverMaxisProductServices_CheckDeviceStock_Channel_Online");
        if (stock_avaliablity == true) {
          let contract_list_available = await this.getmaxisPostpaidContract(sku_id)
          Cache["contract_list_available"] = contract_list_available;
          await SESSION.SetCache(sessionID, Cache);
          contractMenu = UTIL.GetNumberedMenu(contract_list_available);
          let returnParam = { "skuid": sku_id, "contractMenu": contractMenu }; if (isFallBack) AssignFallBack(returnParam);

          await SESSION.SetIdleLastEvent(sessionID, "Maxis_Postpaid_ContractSelectionByBrand")
          await SESSION.SetIdlelastEventParam(sessionID, returnParam)
          return UTIL.ComposeResult("", "Maxis_Postpaid_ContractSelectionByBrand", returnParam);
        } else if (stock_avaliablity == false) {
          await SESSION.SetIdleLastEvent(sessionID, "Maxis_Postpaid_StockAvailableNoByBrand")
          await SESSION.SetIdlelastEventParam(sessionID, "")
          return UTIL.ComposeResult("","Maxis_Postpaid_StockAvailableNoByBrand");
        }
      }
    } else if (intentName == "HotlinkPostpaid") { // --return to 2.2.3_5
      if (isFallBack!=true) {
        if (isFallBack == false) {
          let color = Cache["SelectedColor"];
          let Indexbrand = arrBrand.indexOf(color);
          // VALIDATION: go back to brand if brand index is outside range
          if (isNaN(Indexbrand) || Indexbrand < 0 || Indexbrand > arrBrand.length) {
            return DEVICE_DISCOVERY.HotlinkPostpaidExploreDevcieGetColors(event, true);
          } else {
            Color = arrBrand[Indexbrand]
            Cache["SelectedColor"] = Color
          }
        }
        let sku_id = await client.get(redisData.getSkuIdByHotlinkPostpaidDeviceSelection(modelName, Storage, Color))
        sku_id = sku_id.replace(/"/g, "")
        Cache["sku_id"] = sku_id;
        let contract_list = await DEVICE_DISCOVERY.gethotlinkPostpaidContract(sku_id)
        Cache["contract_list"] = contract_list;
        stock_avaliablity = await DEVICE_DISCOVERY.getStockavailabiltiyhotlinkPostpaid(sku_id)
        Cache["Stock Availability"] = stock_avaliablity
        await SESSION.SetCache(sessionID, Cache);

        if (stock_avaliablity == true) {
          let contractMenu = UTIL.GetNumberedMenu(contract_list);
          let returnParam = { "contractMenu": contractMenu }; if (isFallBack) AssignFallBack(returnParam);
          await SESSION.SetIdleLastEvent(sessionID, "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract")
          await SESSION.SetIdlelastEventParam(sessionID, returnParam)
          return UTIL.ComposeResult("", "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract", returnParam);
        } else if (stock_avaliablity == false) {
          await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe")
          await SESSION.SetIdlelastEventParam(sessionID, "")
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe");
        }
        await SESSION.SetIdleLastEvent(sessionID, "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract")
        await SESSION.SetIdlelastEventParam(sessionID,returnParam)
        return UTIL.ComposeResult("", "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract", returnParam);
      } else {
        let { contract_list } = Cache;
        stock_avaliablity = Cache["Stock Availability"]
        if (stock_avaliablity == true) {
          let contract_list2 = await this.gethotlinkPostpaidContract(sku_id)
          Cache["contract_list"] = contract_list2;
          Cache["sku_id"] = sku_id;

          Cache["Stock Availability"] = stock_avaliablity
          await SESSION.SetCache(sessionID, Cache);

          let contractMenu = UTIL.GetNumberedMenu(contract_list2);

          let returnParam = { "contractMenu": contractMenu }; if (isFallBack) AssignFallBack(returnParam);

          await SESSION.SetIdleLastEvent(sessionID, "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract")
          await SESSION.SetIdlelastEventParam(sessionID, returnParam)
          return UTIL.ComposeResult("", "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract", returnParam);
        } else if (stock_avaliablity == false) {
          await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe")
          await SESSION.SetIdlelastEventParam(sessionID, "")
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_OutofStock_NotifyMe");
        }
        await SESSION.SetIdleLastEvent(sessionID, "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract")
        await SESSION.SetIdlelastEventParam(sessionID,returnParam)
        return UTIL.ComposeResult("", "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract", returnParam);
      }
    }
  } catch (err) {
    console.log(err);
  }
}


exports.DiscoverMaxisProductServices_CheckDeviceStock_Channel_Store_PreferredAddress_Billing = async function (event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let msisdn = await SESSION.GetMSISDN(sessionID);
    let Cache = await SESSION.GetCache(sessionID);
    let CustomerBillingAddress;
    if (Cache['getCustomer']) {
      CustomerBillingAddress=await getCustomerBillingAddress(msisdn,Cache['getCustomer']['responseData']['accounts'][0]['accountNo'],sessionID);
    } else {
      CustomerBillingAddress=await getCustomerBillingAddress(msisdn,Cache['customerData']['responseData']['accounts'][0]['accountNo'],sessionID);
    }

    let Billingaddress = CustomerBillingAddress.address.fullAddress;
    let onlineStoreList = await getNearbyStores(event, Billingaddress);
    await SESSION.SetIdlelastEventParam(sessionID, "")
    if (onlineStoreList) {
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_MaxisCentreSelection", {"OnlineStoreList": onlineStoreList});
    } else {
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadban_Device_CheckDeviceStock_MaxisCentre_NoSearchResult");
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult("", MaxisTechIssueEnd());
  }
}

exports.Coordinates_Check = async function(event) {
  // Pindrop Location Will Come Here
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);

    let pinLocation = Cache["Coordinates"];
    let onlineStoreList= await getNearbyStores(event, "", pinLocation);
    await SESSION.SetIdlelastEventParam(sessionID, "")
    if (onlineStoreList) {
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_MaxisCentreSelection", {"OnlineStoreList": onlineStoreList});
    } else {
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadban_Device_CheckDeviceStock_MaxisCentre_NoSearchResult");
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult("", MaxisTechIssueEnd());
  }
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreSelection_Input = async function (event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);
    let CustomerType = await SESSION.GetCustomerType(sessionID);
    let subType = ""
    // let sku_id = Cache["sku_id"];
    // let aselection = Cache["aselection"];
    // let nearbyStores = Cache["nearbyStores"] // Taking the nearebyStores object array response frm cache

    let { sku_id } = Cache;
    let { aselection } = Cache;
    let { nearbyStores } = Cache; 
    let storeSelection = UTIL.GetParameterValue(event, "storeSelection");

    // storeSelection = parseInt(storeSelection) - 1
    // storeSelection =(storeSelection - 1)

    if (!isNaN(storeSelection)) {
      storeSelection =(storeSelection - 1)
      Cache['storeSelection'] = storeSelection;
    }

    await SESSION.SetCache(sessionID, Cache);
    if (storeSelection<0 || isNaN(storeSelection) || storeSelection > (nearbyStores.length-1)) { // store length
      let onlineStoreList = formatStores(nearbyStores)

      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_MaxisCentreSelection", {"OnlineStoreList": onlineStoreList, fallbackMessage: FALLBACK_MESSAGE_SALES});
    }
    let onlineStockAvailability = await getOnlineStock(sku_id);
    let onlineStockStoreCodes = onlineStockAvailability.map((s) => s.store.storeCode).flat();

    if (onlineStockAvailability[0].balance>0) {
    // refer to 3.1.1_12
      if (aselection==3) {
        await SESSION.SetIdlePlanType(sessionID, "Hotlink-DeviceDiscovery")
        await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_OfferProceedOnlineStore")
        await SESSION.SetIdlelastEventParam(sessionID, "")
        return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_OfferProceedOnlineStore");
      } else if (aselection==4) {
        await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales')
        await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_OfferProceedOnlineStore")
        await SESSION.SetIdlelastEventParam(sessionID, "")
        return UTIL.ComposeResult("", "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_OfferProceedOnlineStore");
      }
    } else {
      let storeStockAvailability = await getStoreStock(sku_id);
      let offlineStockStoreCodes = storeStockAvailability.map((s) => s.store.storeCode).flat();

      if (storeStockAvailability.length > 0) {
      // refer to 3.1.1_17
        console.log('🐛 Flow 3.1.1.17 🐛')
        let userSelectedStore = nearbyStores[storeSelection]
        const stockExists = offlineStockStoreCodes.some((code) => code === userSelectedStore.realViewCode);
        if (stockExists) {
          let param = {
            "storeName": userSelectedStore.storeName,
            "storeAddress": userSelectedStore.address,
            "openingHours": UTIL.GetFormattedOpeningHours(userSelectedStore.openingHours),
            "locationMap": userSelectedStore.googleMapLink,
          }
          if (aselection==3) {
            await SESSION.SetIdlePlanType(sessionID, "Hotlink-DeviceDiscovery")
            await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreAddressDetails")
            await SESSION.SetIdlelastEventParam(sessionID, "")
          } else if (aselection==4) {
            await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales')
            await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreAddressDetails")
            await SESSION.SetIdlelastEventParam(sessionID, param)
          }
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreAddressDetails", param);
        } else {
          subType = CustomerType.subType;

          if (subType == "Maxis Individual") {
            return UTIL.ComposeResult("", "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
          } else if (subType == "Hotlink Individual") {
            return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
            // refer to 3.1.1_20
            // return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
          } else {
            return UTIL.ComposeResult("", "DiscoverMaxisProductServices_Olo_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
          }
        }
      } else {
        subType = CustomerType.subType;


        if (subType == "Maxis Individual") {
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
        } else if (subType == "Hotlink Individual") {
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
          // refer to 3.1.1_20
          // return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
        } else {
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_Olo_Device_CheckDeviceStock_MaxisCentre_OutOfStock_NotifyMe");
        }
      }
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult("", MaxisTechIssueEnd());
  }
}


exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_OfferProceedStore = async function (event) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);
    let sku_id = Cache["sku_id"];
    let aselection = Cache["aselection"];
    // let nearbyStores = Cache["onlineStoreList"]
    let nearbyStores = Cache["nearbyStores"]
    let storeStockAvailability = await getStoreStock(sku_id);
    let onlineStockStoreCodes = storeStockAvailability.map((s) => s.store.storeCode).flat();

    let storeSelection = Cache['storeSelection']
    await SESSION.SetLastIntentForDf(sessionID, '');
    if (storeStockAvailability.length > 0) {
    // refer to 3.1.1_17

      let userSelectedStore = nearbyStores[storeSelection]

      const stockExists = onlineStockStoreCodes.some((code) => code === userSelectedStore['realViewCode']);
      if (stockExists) {
        let param = {
          storeName: userSelectedStore.storeName,
          storeAddress: userSelectedStore.address,
          openingHours: UTIL.GetFormattedOpeningHours(userSelectedStore.openingHours),
          locationMap: userSelectedStore.googleMapLink,
        }

        if (aselection==3) {
          await SESSION.SetIdlePlanType(sessionID, "Hotlink-DeviceDiscovery")
          await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreAddressDetails")
          await SESSION.SetIdlelastEventParam(sessionID, "")
        } else if (aselection==4) {
          await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales')
          await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreAddressDetails")
          await SESSION.SetIdlelastEventParam(sessionID, "")
        }
        return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreAddressDetails",param);
      } else {
        if (aselection==3) {
          await SESSION.SetIdlePlanType(sessionID, "Hotlink-DeviceDiscovery")
          await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_Online");
          await SESSION.SetIdlelastEventParam(sessionID, "")
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_Online");
        } else if (aselection==4) {
          await SESSION.SetIdlePlanType(sessionID, 'Maxis-DeviceDiscovery')

          await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_OnlineOne");
          await SESSION.SetIdlelastEventParam(sessionID, "")
          return UTIL.ComposeResult("", "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_OnlineOne");
        }
      }
    } else {
      // refer to 3.1.1_19
      if (aselection==3) {
        await SESSION.SetIdlePlanType(sessionID, "Hotlink-DeviceDiscovery")
        await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_Online");
        await SESSION.SetIdlelastEventParam(sessionID, "")
        return UTIL.ComposeResult("", "DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_Online");
      } else if (aselection==4) {
        await SESSION.SetIdlePlanType(sessionID, 'Maxis-BotSales')
        await SESSION.SetIdleLastEvent(sessionID, "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_OnlineOne");
        await SESSION.SetIdlelastEventParam(sessionID, "")
      }
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_MaxisPostpaid_Device_CheckDeviceStock_MaxisCentre_OutOfStock_OnlineOne");
    }
  } catch (err) {
    console.log('Enterred the catch bug 🐛', err)
    return UTIL.ComposeResult("", MaxisTechIssueEnd());
  }
}

exports.DiscoverMaxisProductServices_PostpaidBroadban_Device_CheckDeviceStock_Address_ManualInput_Wh = async function (event) {
  // Manual Address Input Will Come Here
  try {
    let houseNum = UTIL.GetParameterValue(event, "houseNo");
    let streetAddress = UTIL.GetParameterValue(event, "address");
    let buildingName = UTIL.GetParameterValue(event, "buildingName");
    let city = UTIL.GetParameterValue(event, "city");
    let postalCode = UTIL.GetParameterValue(event, "PostalCode");
    let state = UTIL.GetParameterValue(event, "state");
    let fullAddress = UTIL.GetFormattedAddress(houseNum, streetAddress, buildingName, city, postalCode, state)
    let onlineStoreList = await getNearbyStores(event, fullAddress);
    let sessionID = UTIL.GetSessionID(event);
    await SESSION.SetIdlelastEventParam(sessionID, "")
    if (onlineStoreList) {
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_MaxisCentreSelection", {"OnlineStoreList": onlineStoreList});
    } else {
      return UTIL.ComposeResult("", "DiscoverMaxisProductServices_PostpaidBroadban_Device_CheckDeviceStock_MaxisCentre_NoSearchResult");
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult("", MaxisTechIssueEnd());
  }
}

exports.DiscoverMaxisProductServices_Postpaid_MaxBotIdle_DTS_WA = async function(event, isBM = false) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);
    let aselection = Cache["aselection"];
    let bselection = Cache["bselection"];

    let agentStartDay = UTIL.GetParameterValue(event,"agentStartDay");
    let agentEndDay = UTIL.GetParameterValue(event, "agentEndDay");
    let agentStartTime = UTIL.GetParameterValue(event,"agentStartTime");
    let agentEndTime = UTIL.GetParameterValue(event,"agentEndTime");
    let agentId = "";
    if (aselection == 4) {
      agentId = "632d535f52672238577e43d2"
    } else {
      agentId = "632d5d120e69dc33b801d361"
    }

    // let agentId         = UTIL.GetParameterValue(event,"agentCategoryId");

    let SelectedBrand = Cache["SelectedBrand"];
    let SelectedColor = Cache["SelectedColor"];
    let SelectedModel = Cache["SelectedModel"];
    // let SelectedCase = Cache["SelectedCase"];
    let SelectedCapacity = Cache["SelectedCapacity"];

    SelectedColor = _.startCase(_.toLower(SelectedColor)); // Capitalizing the first letter of the color

    let response;
    if (bselection != 3) {
      response = `Brand: ${SelectedBrand}\nModel: ${SelectedModel}\nCapacity: ${SelectedCapacity}\nColour: ${SelectedColor}`
    } else {
      response = `Brand: ${SelectedBrand}\nModel: ${SelectedModel}\nColour: ${SelectedColor}\nCase: ${SelectedCapacity}`
    }

    // TODO : To confirm with the team regarding the commmented if-else part of codes
    if ( UTIL.IsAgentOnline(agentStartDay, agentEndDay, agentStartTime, agentEndTime) ) {
      await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId});
      if (isBM)
        return UTIL.ComposeResult("","continue_bahasa_malaysia");
      else if (aselection == 4) {
        // To go to maxis postpaid - 3.1.1_18
        return UTIL.ComposeResult("","DiscoverMaxisProductServices_MaxisPostpaid_CheckDeviceStock_MaxisCentre_AgentAssist_Online",{"response": response});
      } else if (aselection == 3) {
        // To go to hotlink postpaid - 3.1.1_18
        return UTIL.ComposeResult("","DiscoverMaxisProductServices_HotlinkPostpaid_CheckDeviceStock_MaxisCentre_AgentAssist_Online",{"response": response});
      } else
        return UTIL.ComposeResult("","Shared_Agent_Servicing_Online");
    } else {
      await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentId});
      if (aselection == 4) {
      // To go to maxis postpaid - 3.1.1_18
        return UTIL.ComposeResult("","DiscoverMaxisProductServices_MaxisPostpaid_CheckDeviceStock_MaxisCentre_AgentAssist_Offline",{"response": response});
      } else if (aselection == 3) {
      // To go to hotlink postpaid - 3.1.1_18
        return UTIL.ComposeResult("","DiscoverMaxisProductServices_HotlinkPostpaid_CheckDeviceStock_MaxisCentre_AgentAssist_Offline",{"response": response});
      }
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult("", MaxisTechIssueEnd());
  }
}
exports.MaxbotIdle_Postpaid_CheckDeviceStock_ContractSelection = async function(event, isFallBack = false) {
  try {
    let sessionID = UTIL.GetSessionID(event);
    let Cache = await SESSION.GetCache(sessionID);
    let aselection = Cache["aselection"];
    let sku_id = Cache["sku_id"];
    let bselection = Cache["bselection"];
    let contract_list_available;
    if (aselection == 4) {
      if (bselection == 1) {
        contract_list_available = await DEVICE_DISCOVERY.getmaxisPostpaidContract(sku_id)
      } else if (bselection == 2) {
        Cache['flowInfo']='notifyMe';
        await SESSION.SetCache(sessionID, Cache);
        contract_list_available = await getmaxisPostpaidContractTabletWear(sku_id)
      } else {
        contract_list_available = await getmaxisPostpaidContractwear(sku_id);
      }


      Cache["contract_list_available"] = contract_list_available;
      await SESSION.SetCache(sessionID, Cache);

      contractMenu = UTIL.GetNumberedMenu(contract_list_available);
      let returnParam = { "skuid": sku_id, "contractMenu": contractMenu };

      await SESSION.SetIdleLastEvent(sessionID, "Maxis_Postpaid_ContractSelectionByBrand")
      await SESSION.SetIdlelastEventParam(sessionID, returnParam)
      return UTIL.ComposeResult("", "Maxis_Postpaid_ContractSelectionByBrand", returnParam);
    } else if (aselection == 3) {
      let contract_list = await DEVICE_DISCOVERY.gethotlinkPostpaidContract(sku_id)
      Cache["contract_list"] = contract_list;
      Cache["sku_id"] = sku_id;
      if (stock_avaliablity == true) {
        Cache["Stock Availability"] = stock_avaliablity;
      }
      await SESSION.SetCache(sessionID, Cache);
      let contractMenu = UTIL.GetNumberedMenu(contract_list);
      let returnParam = { "contractMenu": contractMenu }; if (isFallBack) AssignFallBack(returnParam);

      await SESSION.SetIdleLastEvent(sessionID, "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract")
      await SESSION.SetIdlelastEventParam(sessionID, returnParam)
      return UTIL.ComposeResult("", "MaxBotIdle_DiscoverMaxisProductServices_HotlinkPostpaid_Device_ContractSelectContract", returnParam);
    }
  } catch (err) {
    console.log(err);
    return UTIL.ComposeResult("", MaxisTechIssueEnd());
  }
}


