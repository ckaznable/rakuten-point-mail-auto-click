import fs from "fs"
import readline from "readline"
import {google} from "googleapis"
import dotenv from "dotenv"

dotenv.config()

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly', 
  'https://www.googleapis.com/auth/gmail.modify'
]

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = process.env.TOKEN_PATH

async function getCredentials() {
  return new Promise((resolve, reject) => {
    fs.readFile(process.env.CREDENTIALS_PATH, async (err, content) => {
      if (err) return reject('Error loading client secret file:', err)
      resolve(JSON.parse(content))
    })
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err)
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client)
    })
  })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @returns {Promise<google.auth.OAuth2>}
 */
export default function authorize() {
  // Check if we have previously stored a token.
  return new Promise(async (resolve) => {
    // Load client secrets from a local file.
    const credentials = await getCredentials()

    const {client_secret, client_id, redirect_uris} = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0])

    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, resolve)
      oAuth2Client.setCredentials(JSON.parse(token))
      resolve(oAuth2Client)
    })
  })
}