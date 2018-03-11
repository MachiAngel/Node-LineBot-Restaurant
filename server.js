require('dotenv').config()
const {ACTION_TEXT_BANK_RATE, ACTION_TEXT_BEST_RATE, ACTION_TEXT_WORNG_COMMAND, ACTION_TEXT_PASS, ACTION_TEXT_NO_MATCH, ACTION_TEXT_YAHOO_MOVIE, ACTION_TEXT_DRAW_BEAUTY,ACTION_TEXT_SEARCH_PTT_MOVIE} = require('./util/constant')
const linebot = require('linebot')
const express = require('express')
const HandleIncoming_TEXT = require('./HandleIncoming/HandleIncoming_Text')
const HandleIncoming_Location = require('./HandleIncoming/HandleIncoming_Location')
const bodyParser = require('body-parser')
const util = require('util')
const {firebaseManager} = require('./db/fetchFirebase')
const beautyManager = require('./manager/fetchBeautyManager')
const pttMovieManager = require('./manager/fetchMoiveManager')
const beauty = require('./controller/beauty')

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
    console.log(event.message)
    switch (event.message.type) {
        case 'text':
            const originalString = event.message.text
            const messageObject = HandleIncoming_TEXT.switchIncomingType(originalString)
            switch (messageObject.type) {
                case ACTION_TEXT_YAHOO_MOVIE:
                    pttMovieManager.getYahooMovieDataTemplate()
                        .then(resultTemplate => {
                            event.reply(resultTemplate)
                    }).catch(e => {
                            replayTextMessage(event, e.message)
                    })
                    break
                case ACTION_TEXT_SEARCH_PTT_MOVIE:
                    const queryString = messageObject.value
                    pttMovieManager.getPttMoiveTemplate(queryString).then(resultTemplate => {
                        event.reply(resultTemplate)
                        console.log(resultTemplate);
                    }).catch(e => {
                        console.log('ACTION_TEXT_SEARCH_PTT_MOVIE error')
                        replayTextMessage(event, e.message)
                    })
                    break
                case ACTION_TEXT_BANK_RATE:
                    //TODO收尋條件
                    console.log(`messageObject.value:${messageObject.value}`);
                    firebaseManager.getFireBaseDataByBankCode(messageObject.value)
                      .then(resultString => {
                        replayTextMessage(event, resultString)
                    }).catch(e => {
                        console.log('ACTION_TEXT_BANK_RATE error')
                        replayTextMessage(event, e.message)
                    })
                    break
                case ACTION_TEXT_BEST_RATE:
    
                    firebaseManager.getFireBaseBestRateByCurrency(messageObject.value)
                        .then((resultString) => {
                            replayTextMessage(event, resultString)
                        }).catch(e => {
                            replayTextMessage(event, e.message)
                    })
    
                    break
                case ACTION_TEXT_WORNG_COMMAND:
                    event.reply('此條件查無此資料，更多使用方式請輸入/help').then((data) => {
    
                    }).catch((error) => {
    
                    });
                    break
                case ACTION_TEXT_PASS:
                    break
                case ACTION_TEXT_NO_MATCH:
                    break
                case ACTION_TEXT_DRAW_BEAUTY:
                    const drawValue =  messageObject.value
                    if (drawValue === 1) {
                        beautyManager.getOneRandomImageTemplate(drawValue).then(imageTemplateArray => {
                            event.reply(imageTemplateArray)
                        }).catch(e => {
                            event.reply(e.message)
                        })
                    }else if (drawValue < 6 && drawValue > 0) {
                        beautyManager.getRandomImagesTemplate(drawValue).then(imageTemplateArray => {
                            event.reply(imageTemplateArray)
                        }).catch(e => {
                            event.reply(e.message)
                        })
                    }else {
                        event.reply(`最多只能抽五張~.~`)
                    }
                    break
            }
            break
        case 'location':
            console.log(event.message)
            if (event.message.latitude === undefined || event.message.longitude === undefined) {
                event.reply('未獲取到經緯度，無法提供服務')
                return
            }

            const searchTemplate = HandleIncoming_Location.getSearchTemplate({latitude:event.message.latitude,longitude:event.message.longitude})
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

    // console.log(`postback event:${event}`);
    // console.log(`postback event source:${event.source}`);

    //event.reply('postback: ' + event.postback.data);
    const resultDict = JSON.parse(event.postback.data)
    if (resultDict.action === 'search') {
        //加個機制不讓別人一直按
        if (event.source.type = 'user') {
            if (avoidDict[event.source.userId] !== undefined) {
                return event.reply('搜尋中請稍後')
            }else {
                avoidDict[event.source.userId] = event.source.userId
            }
        }
        //拿到自定義action 的 data
        const {latitude, longitude, distance ,queryType ,q} = resultDict.data
        console.log(`queryType:${queryType}`)
        HandleIncoming_Location.getFacebookRestaurantData(latitude, longitude, distance, q)
            .then(result =>{

                const sortedPlaceArray = HandleIncoming_Location.getResultOfsortedFBData(result,queryType)

                const template = HandleIncoming_Location.parseFbDataToLineTemplate(sortedPlaceArray)
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
    
    if(resultDict.action === 'ptt_movie_article') {
        //拿到自定義action 的 data
        const {title, title_s} = resultDict.data
        pttMovieManager.getPttMovieArticlesTemplate(title, title_s).then(resultTemplate => {
            event.reply(resultTemplate)
        })
    }
    
});


const replayTextMessage = (event,text) => {
    event.reply(text).then((data) => {

    }).catch((error) => {

    })
}

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
    return res.json({})
});


app.get('/beautyarticles', (req,res) => {beauty.getBeautyArticles(req,res)})
app.get('/randomimage', (req,res) => {beauty.getRandomImage(req,res)})
app.get('/beautyarticles/:id', (req,res) => {beauty.getBeautyArticleById(req,res)})

// 在 localhost 走 8080 port
let server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log("My Line bot App running on port", port);
    console.log(`process env : ${process.env}`)
});
