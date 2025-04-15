/**
 * TODO(developer): Uncomment these variables before running the sample.
 */

// const text = 'text to translate';
// s3://maxbot-orchestrator/glossary_bot.csv
// https://maxbot-orchestrator.s3.ap-southeast-1.amazonaws.com/glossary_bot.csv
// Imports the Google Cloud Translation library
const { TranslationServiceClient } = require('@google-cloud/translate');
const UTIL = require("./Util");
const CONSTANTS = require("./Constants");

// Instantiates a client
const translationClient = new TranslationServiceClient();

// async function createGlossary() {
//   // Construct glossary
//   const glossary = {
//     languageCodesSet: {
//       languageCodes: ['en', 'es'],
//     },
//     inputConfig: {
//       gcsSource: {
//         inputUri: 'gs://cloud-samples-data/translation/glossary.csv',
//       },
//     },
//     name: `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`,
//   };
//   // Construct request
//   const request = {
//     parent: `projects/${projectId}/locations/${location}`,
//     glossary: glossary,
//   };

//   // Create glossary using a long-running operation
//   const [operation] = await translationClient.createGlossary(request);

//   // Wait for the operation to complete
//   await operation.promise();

//   console.log('Created glossary:');
//   console.log(`InputUri ${request.glossary.inputConfig.gcsSource.inputUri}`);
// }

exports.translateText = async function (text, sourceLang, targetLang) {
  // Construct request
  UTIL.populateEnvironmentKeys();
  await UTIL.populateRCAccessTokenSecret();
  await UTIL.populateGCPCredentialsSecret();
  await UTIL.populateRCVerficationTokenSecret();

  const projectId = UTIL.GCP_PROJECT_ID;
  const location = 'us-central1';
  const glossaryId = CONSTANTS.GCP_GLOSSARY_ID;

  console.log("Inside Translation!!!");

  console.log(`projects/${projectId}/locations/${location}/glossaries/${glossaryId}`)
  const glossaryConfig = {
    glossary: `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`,
  };

  let request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: sourceLang,
    targetLanguageCode: targetLang,
    glossaryConfig: glossaryConfig
  };

  // Run request
  const [response] = await translationClient.translateText(request);
  console.log(response);

  const translation = response.glossaryTranslations[0];
  console.log(`Translation: ${translation.translatedText}`);

  // let translatedText = translation.translatedText
  let { translatedText } = translation;
  return translatedText.replace(/<[^>]*>?/gm, '');

  // for (const translation of response.glossaryTranslations) {
  //   console.log(`Translation: ${translation.translatedText}`);
  //   // Strip tranlsated text
  //   let translatedText = translation.translatedText
  //   return translatedText.replace(/<[^>]*>?/gm, '');
  //   // return translation.translatedText;
  // }
};

// translateText("apa khabar di sana");
