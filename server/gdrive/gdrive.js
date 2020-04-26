const fs = require('fs');
const readline = require('readline');
const async = require('async');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';
const UPLOAD_FOLDER_NAME = 'DronePictures';

let drive;
let UPLOAD_FOLDER_ID;

// Load client secrets from a local file.
fs.readFile('gdrive/credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), initDrive);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function initDrive(auth) {
  drive = google.drive({version: 'v3', auth});
  searchForUploadFolder().then((folderId) => {
    UPLOAD_FOLDER_ID = folderId;
  }, (err) => {
    const fileMetadata = {
      'name': UPLOAD_FOLDER_NAME,
      'mimeType': 'application/vnd.google-apps.folder'
    };
    drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }, function (err, file) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        console.log('Folder Id: ', file.data.id);
        UPLOAD_FOLDER_ID = file.data.id;
      }
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function searchForUploadFolder() {
  return new Promise((resolve, reject) => { 
      drive.files.list({
      q: "name='" + UPLOAD_FOLDER_NAME + "'and mimeType = 'application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
      spaces: 'drive'
    }, (err, res) => {
      if (err) reject();
      const files = res.data.files;
      if (files.length) {
        resolve(files[0].id);
      } else {
        reject();
      }
    });
  });
}

/**
   * Upload a file to a Google Drive folder.
   * @param {string} realFolderId The folder ID.
   * @return {Promise} A promise to return a Google Drive file.
   */
async function uploadToFolder(name) {
  return new Promise((resolve, reject) => {
    const resource = {
      name: name,
      parents: [UPLOAD_FOLDER_ID],
    };
    const media = {
      mimeType: 'image/png',
      body: fs.createReadStream('pictures/' + name),
    };
    drive.files.create({
      resource,
      media,
      fields: 'id',
    }, (err, file) => {
      if (err) {
        // Handle error
        console.error(err);
        reject(err);
      } else {
        console.log('File Id: ', file.data.id);
        const resource = {"role": "reader", "type": "anyone"};
        drive.permissions.create({fileId: file.data.id, resource: resource}, (error, result)=>{
            if (error) return;
        });
        resolve(file.data.id);
      }
    });
  });
}

module.exports = {
  SCOPES,
  uploadToFolder
};