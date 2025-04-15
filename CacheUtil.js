exports.getMaxisRatePlans = function (plan) {
  console.log("Cache UTil redis plan : ", plan)
  return `${plan}_plan`;
}

exports.getMaxisBroadbandPlans = function (plan) {
  return `${plan}`;
}

// for maxis devices flow functions
exports.getBrandsByMaxisContract = function (deviceType, contractName) {
  console.log("Cache UTil redis contractName : ", contractName)
  console.log("Cache UTil redis deviceType :", deviceType)
  return `${deviceType}_${contractName}_Brand`
}

exports.getBrandsByMaxisPromo = function (deviceType, PromoName) {
  return `${deviceType}_${PromoName}_Brand`
}

exports.getModelsByMaxisBrand = function (deviceType, brandName) {
  return `${deviceType}_${brandName}_model`
}

exports.getModelsByMaxisPromoBrand = function (deviceType, PromoName, brandName) {
  return `${deviceType}_${PromoName}_${brandName}_model`
}

exports.getModelsByMaxisContractBrand = function (deviceType, ContractName, brandName) {
  console.log("Cache UTil redis deviceType : ", deviceType)
  console.log("Cache UTil redis ContractName : ", ContractName)
  console.log("Cache UTil redis brandName :", brandName)
  return `${deviceType}_${ContractName}_${brandName}_model`
}

exports.getStoragesByMaxisModel = function (modelName) {
  return `${modelName}_Storage`
}

exports.getColoursByMaxisModelStorage = function (modelName, Storage) {
  return `${modelName}_Storage_${Storage}_Colours`
}

exports.getSkuIdByMaxisDeviceSelection = function (modelName, Storage, colour) {
  return `${modelName}_Storage_${Storage}_Colours_${colour}_skuId`
}

//for hotlink Postpaid devices flow functions
exports.getModelsByHotlinkPostpaidBrand = function (brandName) {
  return `HotlinkPostpaid_${brandName}_Model`
}

exports.getBrandsByHotlinkPostpaidPromo = function (promoName) {
  return `HotlinkPostpaid_${promoName}_Brand`
}

exports.getBrandsByHotlinkPostpaidPromoBrand = function (promoName, brandName) {
  return `HotlinkPostpaid_${promoName}_${brandName}_Model `
}

exports.getStoragesByHotlinkPostpaidModel = function (modelName) {
  return `HotlinkPostpaid_${modelName}_Storage`
}

exports.getColoursHotlinkPostpaidModelStorage = function (modelName, Storage) {
  return `HotlinkPostpaid_${modelName}_Storage_${Storage}_Colours`
}

exports.getSkuIdByHotlinkPostpaidDeviceSelection = function (modelName, Storage, colour) {
  return `HotlinkPostpaid_${modelName}_Storage_${Storage}_Colours_${colour}_skuId `
}

exports.getStoresByState = function (state) {
  return `${state}_stores`
}

exports.GetCommonPlans = function (plansList, apiresList) {
  let result = []
  plansList.forEach(plan => {
    let matchedPlan = apiresList.find(apiPlan => apiPlan.planId === plan.planId)
    if (matchedPlan)
      result.push(plan.planName)
  })
  return result;
}

exports.getImagePathByBrandAndModel = function (BrandAndModel) {
  return `${BrandAndModel}_imagePath`
}

exports.getHotlinkImagePathByBrandAndModel = function (BrandAndModel) {
  return `HotlinkPostpaid_${BrandAndModel}_imagePath`
}