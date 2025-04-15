const CONSTANTS = require("./Constants");
    
let TARGET = process.env.HOST_TARGET == CONSTANTS.ENV_VAR_PROD ? 1 : 0

//0 - Development
//1 - Production
//---------------------------------------------------------------------------------------------------------
module.exports = {

    TARGET,

    BILLING: [
        "http://api-digital-uat2.isddc.men.maxis.com.my",
        "http://api-digital.isddc.men.maxis.com.my"
    ],

    CASE: [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],

    CUSTOMER: [
        "http://dealerapi-uat.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],

    TAC: [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],

    PRODUCT_CATALOG: [
        "http://10.156.3.36:25046",
        "https://productcatalog.maxis.com.my"
    ],

    PRODUCT_DETAIL: [
        "http://10.156.3.36:25046",
        "https://productcatalog.maxis.com.my"
    ],

    PRODUCT_LATEST_DEVICE: [
        "http://d1x3lgvt4o8f7h.cloudfront.net",
        "https://store.maxis.com.my"
    ],

    PRODUCT_PLAN_SKU: [
        "https://api-digital-uat.maxis.com.my/uat/api/v4.0/catalog",
        "http://api-digital2.isddc.men.maxis.com.my/prodcatalog/api/v4.0"
    ],
    Product_wearable  : [
        "http://api-digital-uat2.isddc.men.maxis.com.my/prodcatalog/api/v4.0",
        "http://api-digital2.isddc.men.maxis.com.my/prodcatalog/api/v4.0"

    ],
    Product_wearable_tablet  : [
        "http://api-digital-uat2.isddc.men.maxis.com.my/prodcatalog/api/v4.0",
        "http://api-digital2.isddc.men.maxis.com.my/prodcatalog/api/v4.0"

    ],
    PRODUCT_STOCK: [
        "https://api-digital-uat.maxis.com.my/uat/api/v1.0",
        "http://api-digital.isddc.men.maxis.com.my/offline/api/v1.0"
    ],

    PRODUCT_PROMO: [
        "http://10.156.3.36:25046",
        "https://productcatalog.maxis.com.my"
    ],

    PRODUCT_CHECKOUT: [
        "http://d1x3lgvt4o8f7h.cloudfront.net",
        "https://store.maxis.com.my"
    ],

    DIRECT_DEBIT: [
        "http://api-digital-uat2.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],


    DIRECT_DEBIT_MAXIS: [
        "https://care-uat.maxis.com.my/en/auth",
        "https://care.maxis.com.my/en/auth"
    ],

    DIRECT_DEBIT_HOTLINK: [
        "https://selfserve-uat.hotlink.com.my/en/auth",
        "https://selfserve.hotlink.com.my/en/auth"
    ],

    VIEW_CREDIT_BALANCE_PREPAID_TOPUP: [
        "http://dealerapi-uat.isddc.men.maxis.com.my/servicebalance/api/v1.0/servicebalance",
        "http://dealerapi.isddc.men.maxis.com.my/servicebalance/api/v1.0/servicebalance"
    ],

    REDIRECTION_URL : [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],

    PAYBILL: [
        "https://pay-staging.maxis.com.my",
        "https://pay.maxis.com.my"
    ],

    FIBER_DIAGNOSIS: [
        "http://api-digital-uat4.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],

    DCB: [
        "http://api-digital-uat4.isddc.men.maxis.com.my/dcb",
        "http://api-digital2.isddc.men.maxis.com.my/dcb"
    ],

    INTERACTION: [
        "http://api-digital-uat4.isddc.men.maxis.com.my",
        "http://api-digital-uat4.isddc.men.maxis.com.my"
    ],

    ELIGIBILITY: [
        "http://api-digital-uat4.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],

    LEAD: [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],

    SFDC: [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],
    PORTIN_INFO: [
        "http://api-digital-uat4.isddc.men.maxis.com.my",
        "http://api-digital3.isddc.men.maxis.com.my"
    ],
    MAXIS_MOBILE_PLANS: [
        "http://productcatalog-staging.maxis.com.my/bin/commerce/plans.json",
        "https://productcatalog.maxis.com.my/bin/commerce/plans.json"
    ],

    MAXIS_FIBRE_PLANS: [
        "http://productcatalog-staging.maxis.com.my/bin/commerce/fibreplans.json",
        "https://productcatalog.maxis.com.my/bin/commerce/fibreplans.json"
    ],

    HOTLINK_POSTPAID_MOBILE_PLANS: [
        "http://productcatalog-staging.maxis.com.my/bin/commerce/flexplans.en.json",
        "https://productcatalog.maxis.com.my/bin/commerce/flexplans.en.json"
    ],

    HOTLINK_PREPAID_RATE_PLANS: [
        "http://productcatalog-staging.maxis.com.my/bin/commerce/hotlinkplans.en.json",
        "https://productcatalog.maxis.com.my/bin/commerce/hotlinkplans.en.json"
    ],

    STORES: [
        "http://productcatalog-staging.maxis.com.my/bin/commerce/stores.json",
        "https://productcatalog.maxis.com.my/bin/commerce/stores.json"
    ],

    MAXIS_POSTPAID_DEVICES: [
        "http://productcatalog-staging.maxis.com.my/bin/commerce/product-catalogue.json",
        "https://productcatalog.maxis.com.my/bin/commerce/product-catalogue.json"
    ],

    MAXIS_POSTPAID_MODEL: [
        "http://productcatalog-staging.maxis.com.my/content/commerce",
        "https://productcatalog.maxis.com.my/content/commerce"
    ],
    HOTLINK_POSTPAID_DEVICES: [
        "http://productcatalog-staging.maxis.com.my/bin/commerce/hotlink-product-catalogue.en.json",
        "https://productcatalog.maxis.com.my/bin/commerce/hotlink-product-catalogue.en.json"
    ],

    HOTLINK_POSTPAID_MODEL: [
        "http://productcatalog-staging.maxis.com.my/content/commerce-flex/en",
        "https://productcatalog.maxis.com.my/content/commerce-flex/en"
    ],

    HOTLINK_POSTPAID_LATEST_PROMOTIONS: [
        "http://productcatalog-staging.maxis.com.my/content/commerce/hotlink-plans/en/jcr:content/root/responsivegrid/herobanner.model.json",
        "https://productcatalog.maxis.com.my/content/commerce/hotlink-plans/en/jcr:content/root/responsivegrid/herobanner.model.json"
    ],

    HOTLINK_POSTPAID_LATEST_DEVICES: [
        "http://d3o4kqj8excmsv.cloudfront.net",
        "https://store.hotlink.com.my"
    ],
    HOTLINK_POSTPAID_DEVICES_MVP4: [
        "http://api-digital-uat2.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],
    HOTLINK_STOCK_AVAILABILITY: [
        "http://api-digital-uat.isddc.men.maxis.com.my",
        "http://api-digital.isddc.men.maxis.com.my"
    ],
    CHECKPUKURL: [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],
    MANAGE_APP_STORE_URL: [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],
    OPT_E_BILL_URL: [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"],

  NOTIFY_ME : [ "https://api-digital-uat.maxis.com.my/uat/api/v1.0/roi",
              "https://api-digital.maxis.com.my/prod/api/v1.0/roi"
             ],
    MANAGE_DID_URL : [
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
    ],
      BILLING_INFO_URL:[
        "http://api-digital-uat3.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
      ],
      PREPAID_UNBLOCK_TOPUP : [
        "http://api-digital-uat4.isddc.men.maxis.com.my",
        "http://api-digital2.isddc.men.maxis.com.my"
      ],
      PREPAID_UNBLOCK_TOPUP_CHECK_NRIC_PASSPORT_NUMBER : [
        "http://dealerapi-uat.isddc.men.maxis.com.my/customer/api/v4.0/customer",
        "http://api-digital2.isddc.men.maxis.com.my/customer/api/v4.0/customer"
      ],
}