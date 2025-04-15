const ENV_VAR_DEV = "DEV";
const ENV_VAR_STAGE = "STAGE";
const ENV_VAR_PROD = "PROD";
const ENV_VAR_MC = "MC";

// const DYNAMODB_TABLE_NAME_SESSION = "MultiChannelSessionStore";
// const DYNAMODB_TABLE_NAME_PROFILE = "MultiChannelProfile";
// const DYNAMODB_TABLE_NAME_LOG = "Log";

const CHANNEL_NAME_WHATSAPP = "WhatsApp";
const CHANNEL_NAME_FACEBOOK_MAXIS = "Facebook Maxis";
const CHANNEL_NAME_FACEBOOK_HOTLINK = "Facebook Hotlink";
const CHANNEL_NAME_TWITTER_MAXIS = "Twitter Maxis";
const CHANNEL_NAME_TWITTER_HOTLINK = "Twitter Hotlink";
const CHANNEL_NAME_LIVE_CHAT = "Live Chat Maxis";
const CHANNEL_NAME_LIVE_HOTLINK_CHAT = "Live Chat Hotlink";

const RC_ACCESS_TOKEN_SECRET_KEY = "DCCMaxBotRCAccessToken";

const RC_VERIFICATION_TOKEN_SECRET_KEY_DEV = "DCCMaxBotRCVerificationTokenDev";
const RC_VERIFICATION_TOKEN_SECRET_KEY_STAGE = "DCCMaxBotRCVerificationTokenStage";
const RC_VERIFICATION_TOKEN_SECRET_KEY_PROD = "DCCMaxBotRCVerificationToken";
const RC_VERIFICATION_TOKEN_SECRET_KEY_MC = "DCCMaxBotRCVerificationTokenMC";

const GCP_SECRET_KEY_NAME_DEV = "DCCMaxBotGCPAccountKeyDev";
const GCP_PROJECT_ID_DEV = "mxs-mxb-dcc-dev";
const GCP_KNOWLEDGE_MAXIS_DEV = "MTQ0ODA0OTgzMTg4MjE1NTYyMjQ";
const GCP_KNOWLEDGE_HOTLINK_DEV = "NzY1NzI0ODAxNTIxNTc1NTI2NA";

const GCP_SECRET_KEY_NAME_STAGE = "DCCMaxBotGCPAccountKeyStage";
const GCP_PROJECT_ID_STAGE = "mxs-coe-whatsapp-chatbot-stage";
const GCP_KNOWLEDGE_MAXIS_STAGE = "ODc4NDUzNTUwNTczMjYzMjU3Ng";
const GCP_KNOWLEDGE_HOTLINK_STAGE = "NTQxMjM3MjkyNTc2MjI0MDUxMg";

const GCP_SECRET_KEY_NAME_PROD = "DCCMaxBotGCPAccountKey";
const GCP_PROJECT_ID_PROD = "mxs-coe-whatsapp-chatbot-prod";
const GCP_KNOWLEDGE_MAXIS_PROD = "MTEzMzMzMTEyMTEwNTY5MjI2MjQ";
const GCP_KNOWLEDGE_HOTLINK_PROD = "MTgyMjgxODE1MDMwNzI3OTY2NzI";

const GCP_SECRET_KEY_NAME_MC = "DCCMaxBotGCPAccountKeyMC";
const GCP_PROJECT_ID_MC = "mxs-coe-whatsapp-chatbot-mc";

//
const RC_DIMELO_SECRET_KEY = "DCCMaxBotDimeloSecretDev";

const DYNAMODB_TABLE_NAME_SESSION = process.env.HOST_TARGET == ENV_VAR_STAGE ? "MultiChannelSessionStoreStage" : "MultiChannelSessionStore";
const DYNAMODB_TABLE_NAME_PROFILE = process.env.HOST_TARGET == ENV_VAR_STAGE ? "MultiChannelProfileStage" : "MultiChannelProfilee";
const DYNAMODB_TABLE_NAME_LOG = "Log";

const GCP_GLOSSARY_ID = process.env.HOST_TARGET == ENV_VAR_DEV ? "glossary_bot_" + ENV_VAR_DEV : "glossary_bot";

module.exports.ENV_VAR_DEV = ENV_VAR_DEV;
module.exports.ENV_VAR_STAGE = ENV_VAR_STAGE;
module.exports.ENV_VAR_PROD = ENV_VAR_PROD;
module.exports.ENV_VAR_MC = ENV_VAR_MC;

module.exports.RC_ACCESS_TOKEN_SECRET_KEY = RC_ACCESS_TOKEN_SECRET_KEY;
module.exports.GCP_SECRET_KEY_NAME_DEV = GCP_SECRET_KEY_NAME_DEV;
module.exports.GCP_PROJECT_ID_DEV = GCP_PROJECT_ID_DEV;
module.exports.GCP_KNOWLEDGE_MAXIS_DEV = GCP_KNOWLEDGE_MAXIS_DEV;
module.exports.GCP_KNOWLEDGE_HOTLINK_DEV = GCP_KNOWLEDGE_HOTLINK_DEV;
module.exports.GCP_SECRET_KEY_NAME_STAGE = GCP_SECRET_KEY_NAME_STAGE;
module.exports.GCP_PROJECT_ID_STAGE = GCP_PROJECT_ID_STAGE;
module.exports.GCP_KNOWLEDGE_MAXIS_STAGE = GCP_KNOWLEDGE_MAXIS_STAGE;
module.exports.GCP_KNOWLEDGE_HOTLINK_STAGE = GCP_KNOWLEDGE_HOTLINK_STAGE;
module.exports.GCP_SECRET_KEY_NAME_PROD = GCP_SECRET_KEY_NAME_PROD;
module.exports.GCP_PROJECT_ID_PROD = GCP_PROJECT_ID_PROD;
module.exports.GCP_KNOWLEDGE_MAXIS_PROD = GCP_KNOWLEDGE_MAXIS_PROD;
module.exports.GCP_KNOWLEDGE_HOTLINK_PROD = GCP_KNOWLEDGE_HOTLINK_PROD;
module.exports.GCP_SECRET_KEY_NAME_MC = GCP_SECRET_KEY_NAME_MC;
module.exports.GCP_PROJECT_ID_MC = GCP_PROJECT_ID_MC;
module.exports.DYNAMODB_TABLE_NAME_SESSION = DYNAMODB_TABLE_NAME_SESSION;
module.exports.DYNAMODB_TABLE_NAME_PROFILE = DYNAMODB_TABLE_NAME_PROFILE;
module.exports.DYNAMODB_TABLE_NAME_LOG = DYNAMODB_TABLE_NAME_LOG;

module.exports.CHANNEL_NAME_WHATSAPP = CHANNEL_NAME_WHATSAPP;
module.exports.CHANNEL_NAME_FACEBOOK_MAXIS = CHANNEL_NAME_FACEBOOK_MAXIS;
module.exports.CHANNEL_NAME_FACEBOOK_HOTLINK = CHANNEL_NAME_FACEBOOK_HOTLINK;
module.exports.CHANNEL_NAME_TWITTER_MAXIS = CHANNEL_NAME_TWITTER_MAXIS;
module.exports.CHANNEL_NAME_TWITTER_HOTLINK = CHANNEL_NAME_TWITTER_HOTLINK;
module.exports.CHANNEL_NAME_LIVE_CHAT = CHANNEL_NAME_LIVE_CHAT;
module.exports.CHANNEL_NAME_LIVE_HOTLINK_CHAT = CHANNEL_NAME_LIVE_HOTLINK_CHAT;
module.exports.RC_VERIFICATION_TOKEN_SECRET_KEY_DEV = RC_VERIFICATION_TOKEN_SECRET_KEY_DEV;
module.exports.RC_VERIFICATION_TOKEN_SECRET_KEY_STAGE = RC_VERIFICATION_TOKEN_SECRET_KEY_STAGE;
module.exports.RC_VERIFICATION_TOKEN_SECRET_KEY_PROD = RC_VERIFICATION_TOKEN_SECRET_KEY_PROD;

module.exports.GCP_GLOSSARY_ID = GCP_GLOSSARY_ID;

module.exports.RC_VERIFICATION_TOKEN_SECRET_KEY_MC = RC_VERIFICATION_TOKEN_SECRET_KEY_MC;
module.exports.RC_DIMELO_SECRET_KEY = RC_DIMELO_SECRET_KEY;
