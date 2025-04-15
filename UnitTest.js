// eval(process.argv[2])();

function GenerateLink(barId) {
  // 👇 stuff to encrypt
  // let key      = "1Y6BV0s7m45Y0IU53M9GKtxGCHYh9NI5";
  let key = process.env.PAYBILL_ENCRYPTION_KEY;
  let sourceId = "2";
  let dateTime = new Date().toISOString().slice(2,10).replace(/-/g,"");
  // let barId    = cusData.accounts[0].baId;
  let plainText = `${accountNo}|${sourceId}|${dateTime}|${barId}`;

  let password = CRYPTO.enc.Utf8.parse(key);
  password = CRYPTO.SHA256(password);

  return CRYPTO.AES.encrypt(plainText, password, {iv: "", mode: CRYPTO.mode.ECB}).toString();

  // console.log("plain text 👉: " + plainText);
  // console.log("encrypted  👉: " + encryptedText);
}

async function createLead(msisdn, catId) {
  let url = `${HOST.ELIGIBILITY[HOST.TARGET]}/leads/api/v1.0/leads`;

  let body = {
    "customerName": null,
    "email": null,
    "msisdn": msisdn,
    "leadCatId": catId,
    "sourceId": "MAXBOT",
    "channelCode": "MAXBOT",
    "dealearCode": "MAXBOT",
    "userId": "MAXBOT"
  };

  console.log(body);

  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {"Content-Type": "application/json"}
  };

  let data = await UTIL.GetUrl(url,head);

  if (data.status == "fail") {
    return data.violations[0].code == 102 ? "Duplicate" : "General";
  } else {
    return "Success";
  }
}

async function Test01() {
  let queryText=`CNTRL.00010 [Maxis_SME_Grant] Hi. I would like to know more about the SME Digitalisation Grant.
    Hi. Saya berminat untuk mengetahui lebih lanjut mengenai Geran Pendigitalan PKS.`;
  let cleanText = queryText.replace(/\n/g,'');
  console.log(cleanText);
  if (/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5} \[.+\].+$/.test(cleanText)) {
    console.log("yes");
    // result["dealerCode"] = queryText.match(/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5}/)[0]; // dealerCode
    const dealerCodeTemp = queryText.match(/^[a-zA-Z0-9]{5}[.][a-zA-Z0-9]{5}/)[0]; // dealerCode
    result["dealerCode"] = dealerCodeTemp; // dealerCode
    // result["campaignName"] = queryText.match(/\[.+\]/)[0]; // campaign
    const campaignNameTemp = queryText.match(/\[.+\]/)[0]; // campaign
    result["campaignName"] = campaignNameTemp; // campaign
    result["campaignTitle"] = queryText.split(']')[1].trim(); // text
  }
}
