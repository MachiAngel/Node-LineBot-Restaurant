require('dotenv').config()
const linebot = require('linebot')
const express = require('express')
const HandleIncoing = require('./HandleIncoming/HandleIncoming_Location')
const bodyParser = require('body-parser')
const util = require('util')


const avoidDict = {}

const app = express()

const parser = bodyParser.json({
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf.toString(encoding);
    }
});

const bot = linebot({
    channelId: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN
});

//線上
// const bot = linebot({
//     channelId: '1533402623',
//     channelSecret: '2538033a97c555c83c3c69b7c5d23c9d',
//     channelAccessToken: '3/3u9eaUXuum5u3pfmQ1LYIoE+030PJgcDK/bSA5VT5dE1tCSLMD1JR1Jb4O3rRaUxeOJjVzY24G9l2Xtp6Kg/BNd6rMPpx0O7YmWL6qiizW3dT5cv6XUbAgRed6lLm6B2bsTB9Qql/Yb2M9c6CpwAdB04t89/1O/w1cDnyilFU='
// });

const linebotParser = bot.parser()

bot.on('message', function(event) {
    // 把收到訊息的 event 印出來
    // console.log(event)
    switch (event.message.type) {
        case 'text':
            console.log()
            event.reply(event.message.text)
            break
        case 'location':
            console.log(event.message)
            if (event.message.latitude === undefined || event.message.longitude === undefined) {
                event.reply('未獲取到經緯度，無法提供服務')
                return
            }
            
            const searchTemplate = HandleIncoing.getSearchTemplate({latitude:event.message.latitude,longitude:event.message.longitude})
            // console.log(util.inspect(searchTemplate, false, null))
            event.reply(searchTemplate)
            // HandleIncoing.getFacebookRestaurantData(event.message.latitude,event.message.longitude,10000)
            //     .then(result =>{
            //         const template = HandleIncoing.parseFbDataToLineTemplate(result)
            //         //console.log(template)
            //         //console.log(util.inspect(template, false, null))
            //         return event.reply(template)
            //     }).then((data) => {
            //         console.log('Success',data)
            //     }).catch(e => {
            //      console.log(e.message)
            // });
 
            break;
        
        default:
            //event.reply('Unknow message: ' + JSON.stringify(event));
            break;
    }
    
    
});

//加入 跟 解除封鎖
bot.on('follow', function (event) {
    event.reply('follow: ' + event.source.userId);
});

bot.on('unfollow', function (event) {
    console.log('被封鎖' + event.source.userId)
    event.reply('unfollow: ' + event.source.userId);
});

bot.on('join', function (event) {
    event.reply('join: ' + event.source.groupId);
});

bot.on('leave', function (event) {
    event.reply('leave: ' + event.source.groupId);
});

//按鈕回傳 使用者不用再打字
bot.on('postback', function (event) {
    
    console.log(`postback event:${event}`);
    console.log(`postback event source:${event.source}`);
    
    //event.reply('postback: ' + event.postback.data);
    const resultDict = JSON.parse(event.postback.data)
    if (resultDict.action === 'search') {
        //加個機制不讓別人一直按
        if (event.source.type = 'user') {
            if (avoidDict[event.source.userId] !== undefined) {
                return event.reply('收尋中請稍後')
            }else {
                avoidDict[event.source.userId] = event.source.userId
            }
        }
        
        //拿到自定義action 的 data
        const {latitude, longitude, distance ,queryType ,q} = resultDict.data
        console.log(`queryType:${queryType}`)
        HandleIncoing.getFacebookRestaurantData(latitude, longitude, distance, q)
            .then(result =>{
                
                const sortedPlaceArray = HandleIncoing.getResultOfsortedFBData(result,queryType)
                const template = HandleIncoing.parseFbDataToLineTemplate(sortedPlaceArray)
                //console.log(template)
                //console.log(util.inspect(template, false, null))
                
                avoidDict[event.source.userId] = undefined
                return event.reply([{type:'text',text:'搜尋結果如下:'},template])
            }).then((data) => {
                console.log('Success',data)
            }).catch(e => {
             console.log(e.message)
        });
    }
  
    // console.log(`resultDict:${util.inspect(searchDict, false, null)}`)
});




//The parser assumes that the request body has never been parsed by any body parser before,
// so it must be placed BEFORE any generic body parser e.g. app.use(bodyParser.json());

//app.post('/webhook', linebotParser);
app.post('/webhook', parser, function (req, res) {
    if (!bot.verify(req.rawBody, req.get('X-Line-Signature'))) {
        return res.sendStatus(400);
    }
    console.log('------')
    bot.parse(req.body);
    // console.log(req.body)
    console.log('------')
    return res.json({});
});



// 在 localhost 走 8080 port
let server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log("My Line bot App running on port", port);
});


