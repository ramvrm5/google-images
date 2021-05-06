const functions = require('firebase-functions');
const admin = require('firebase-admin');
var firebase = require('firebase');
require('firebase/auth');
require('firebase/database');
require('firebase/storage');
var serviceAccount = require("./permissions.json");
var metadata = {
    contentType: 'image/jpeg',
};

var firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    apiKey: "AIzaSyD4AJqmbR53bqkvFjBKyXQ5qBfE0cuz47s",
    authDomain: "autofeed2020.firebaseapp.com",
    databaseURL: "https://autofeed2020.firebaseio.com",
    projectId: "autofeed2020",
    storageBucket: "autofeed2020.appspot.com",
    messagingSenderId: "1058552734780",
    appId: "1:1058552734780:web:32cae402102183ea668f39",
    measurementId: "G-M5CPTXRXFV"
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Database
const db = firebase.firestore();

db.settings({ ignoreUndefinedProperties: true })

const request = require('request');
const axios = require('axios');
const cheerio = require("cheerio");
const Jimp = require('jimp');
const moment = require('moment');

const express = require('express');
const cors = require('cors');
const { endianness } = require('os');
const { url } = require('inspector');
const { urlencoded, json } = require('body-parser');
const { Stream } = require('stream');
const { response } = require('express');
const app = express();

app.use(cors({ origin: true }));

let googleSearchImagesArray = [{
    idOfDocument: "",
    title: ""
}];
let tags = []



async function getAlltags() {
    try {
        let query = await db.collection('usuarios');
        await query.get()
            .then(async function (querySnapshot) {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    if (doc.data().tags) {
                        for (let tag of doc.data().tags) {
                            if(tag){
                                let tempTags = tag.split(";")
                                for (let i = 0; tempTags.length > i; i++) {
                                    tags.push(tempTags[i]);
                                }
                            }
                        }
                    }
                }
                getDefaultImages()
            });
    } catch (error) {
        console.log(error);
    }
}

async function getDefaultImages() {
    for (let m = 0; tags.length > 0;) {
        console.log("tag " + tags[m])
        console.log("index " + m)
        if (tags[m] && tags[m].length > 0) {
            const snapshot = await db.collection('tags_img').where("tag", "==", tags[m]).get()
            if (snapshot.empty) {
                console.log("No matching documents");
                //let getGoogleImageURL = "https://www.google.com/search?q=" + tags[m] + "&source=lnms&tbm=isch"
                //let getGoogleImageURL = "https://www.google.com/search?q=" + tags[m] + "&tbm=isch&tbs=isz:l"
                //let getGoogleImageURL = "https://duckduckgo.com/?q=" + tags[m] + "&t=h_&iar=images&iaf=size%3ALarge&iax=images&ia=images"
                let getGoogleImageURL = "https://th.bing.com/th?q=" + tags[m] + "&w=500&h=500&c=1&rs=1&p=0&o=80&pid=1.7&mkt=en-IN&adlt=moderate"
                    let image = getGoogleImageURL;
                    console.log(image)
                    await Jimp.read(image)
                        .then(async image => {
                            console.log("enter")
                            image.write('default_img/' + tags[m] + '.png'); // save
                            console.log("convertedImage")
                             await db.collection('tags_img2').doc(tags[m]).set({
                                 default_image: "http://35.195.38.33/img_tag/default_img/" + tags[m] + '.png',
                                 tag: tags[m] + '.png'
                             }).then(async () => {
                                 await console.log("image added in tags_img")
                                 m++
                             }).catch(async error => {
                                 await console.log("google Image search function error" + error)
                                 m++
                             })
                }).catch(async error => {
                    await console.log("Image not found" + error)
                    m++
                })
            } else {
                if (tags.length == m) {
                    console.log("tags.length  " + m)
                    console.log("break  " + m)
                    break
                } else {
                    console.log("increase outter  " + m)
                    m++
                }
            }
        } else {
            if (tags.length == m) {
                console.log("tags.length  " + m)
                console.log("break  " + m)
                break
            } else {
                console.log("increase outter  " + m)
                m++
            }
        }
    }
}

const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

getAlltags();

exports.app = functions.https.onRequest(app);