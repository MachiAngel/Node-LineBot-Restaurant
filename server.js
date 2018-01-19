const linebot = require('linebot')
const express = require('express')
const HandleIncoing = require('./HandleIncoming/HandleIncoing')



const app = express()
const bot = linebot({
    channelId: '1533402623',
    channelSecret: '2538033a97c555c83c3c69b7c5d23c9d',
    channelAccessToken: '3/3u9eaUXuum5u3pfmQ1LYIoE+030PJgcDK/bSA5VT5dE1tCSLMD1JR1Jb4O3rRaUxeOJjVzY24G9l2Xtp6Kg/BNd6rMPpx0O7YmWL6qiizW3dT5cv6XUbAgRed6lLm6B2bsTB9Qql/Yb2M9c6CpwAdB04t89/1O/w1cDnyilFU='
});

const linebotParser = bot.parser()

bot.on('message', function(event) {
    // 把收到訊息的 event 印出來
    console.log(event)
    switch (event.message.type) {
        case 'text':
            event.reply({
                "type": "template",
                "altText": "this is a carousel template",
                "template": {
                    "type": "carousel",
                    "columns": [
                        {
                            "thumbnailImageUrl": "https://graph.facebook.com/475688475921038/picture?width=400&height=400",
                            "imageBackgroundColor": "#FFFFFF",
                            "title": "店名",
                            "text": "評價",
                            "actions": [
                                {
                                    "type": "postback",
                                    "label": "Buy",
                                    "data": "action=buy&itemid=111"
                                },
                                {
                                    "type": "postback",
                                    "label": "Add to cart",
                                    "data": "action=add&itemid=111"
                                },
                                {
                                    "type": "uri",
                                    "label": "View detail",
                                    "uri": "http://example.com/page/111"
                                }
                            ]
                        },
                        {
                            "thumbnailImageUrl": "https://graph.facebook.com/475688475921038/picture?width=400&height=400",
                            "imageBackgroundColor": "#000000",
                            "title": "this is menu",
                            "text": "description",
                            "actions": [
                                {
                                    "type": "postback",
                                    "label": "Buy",
                                    "data": "action=buy&itemid=222"
                                },
                                {
                                    "type": "postback",
                                    "label": "Add to cart",
                                    "data": "action=add&itemid=222"
                                },
                                {
                                    "type": "uri",
                                    "label": "View detail",
                                    "uri": "http://example.com/page/222"
                                }
                            ]
                        }
                    ],
                    "imageAspectRatio": "rectangle",
                    "imageSize": "cover"
                }
            })
            
            break
        case 'location':
            
            HandleIncoing.getFacebookRestaurantData(event.message.latitude,event.message.longitude,1000)
                .then(result =>{
                    //console.log(result)
                    const template = HandleIncoing.parseFbDataToLineTemplate(result)
                    event.reply(template)
                    
                }).catch(e => {
                
            })
            //https://graph.facebook.com/475688475921038/picture?width=400&height=400
            //https://graph.facebook.com/${}/picture?width=400&height=400
            // https://www.facebook.com/
            break;
        case 'sticker':
            event.reply({
                type: 'sticker',
                packageId: 1,
                stickerId: 1
            });
            break
        default:
            event.reply('Unknow message: ' + JSON.stringify(event));
            break;
    }
    
    
});


bot.on('follow', function (event) {
    event.reply('follow: ' + event.source.userId);
});

bot.on('unfollow', function (event) {
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
    console.log(event);
    event.reply('postback: ' + event.postback.data);
});

bot.on('beacon', function (event) {
    event.reply('beacon: ' + event.beacon.hwid);
});


app.post('/webhook', linebotParser);

// 在 localhost 走 8080 port
let server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log("My Line bot App running on port", port);
});