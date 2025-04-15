const UTIL    = require("./Util")
const SESSION = require("./Handler_Session");
const { isEmpty } = require('lodash')

exports.Fallback =  async function (event) {
  
  let result    = "";
  let sessionID = UTIL.GetSessionID(event);
  let LastEvent = await SESSION.GetLastEvent(sessionID);
  //let LastContext = await SESSION.GetContext(msisdn);
  // The logic to pull the last event is the issue with the sharedFallback helpful yes issue
  // RN the session object has a key with empty value, so when it check the object length it passes the check
  console.log("🐛THIS IS LAST EVENT : ", LastEvent)

  const isLastEventEmpty = LastEvent != undefined && Object.keys(LastEvent).length > 0 && !isEmpty(LastEvent.param)

  if (isLastEventEmpty)
  {
    result = UTIL.ComposeResult("",LastEvent.event, LastEvent.param);
  }
  else
  {
    var Handle = require("./UserStory_Greeting");
    result = await Handle.Greeting_Start1(event);
  }
  
  console.log("⚡ fallback:", JSON.stringify(result));    
  return result;
}