const axios = require('axios')
// var graph = require('fbgraph');

// axios.get('https://graph.facebook.com/v2.11/search?type=place&q=cafe&center=40.7304,-73.9921&distance=1000&fields=name,checkins,picture&access_token=427733294327044|PBJzzi3HOKZEwddou90mcVgFAls\n')
//     .then(result => {
//         console.log(result)
//     }).catch(e => {
//         console.log(e.message)
// })


const getFacebookRestaurantData = async (lat,lon,distance) => {
    try {
        const result = await axios.get(`https://graph.facebook.com/v2.11/search?type=place&q=restaurant&center=${lat}, ${lon}&locale:zh-TW&distance=${distance}&fields=name,checkins,picture,phone,rating_count,single_line_address,website,overall_star_rating,category_list,location&access_token=427733294327044|b48f1b21f09b3d1a9b7931ee2ac1c32c`)
        return result.data
        //console.log(result.data)
        //console.log(`searchCount:${result.data.data.length}`)
    }catch (e){
        throw e
    }
}

const parseFbDataToLineTemplate = (resultData) => {
    
    const columns = resultData.data.map((shop) => {
        let title = ''
        if (shop.name.length > 40) {
            title = shop.name.replace(/[a-zA-z]/g,'')
        }else {
            title = shop.name
        }
        //${shop.name}
        //
        const column = {
            "thumbnailImageUrl": `https://graph.facebook.com/${shop.id}/picture?width=400&height=200`,
            "imageBackgroundColor": "#FFFFFF",
            "title": `${title}`,
            "text": `FB評分:${shop.overall_star_rating}分/${shop.rating_count}人`,
            "actions":[
                {
                    "type": "uri",
                    "label": "FB粉絲專頁",
                    "uri": `https://www.facebook.com/${shop.id}`
                },
                {
                    "type": "uri",
                    "label": "店家位置",
                    "uri": `https://www.google.com.tw/maps/place/${shop.location.latitude},${shop.location.longitude}`
                },
                {
                    "type": "uri",
                    "label": "店家電話",
                    "uri": `tel://${shop.phone}`
                }
            ]
        }
        
        return column
    })
    
    
    let limitColumns = []
    if (columns.length > 10) {
        limitColumns = columns.slice(0,10)
    }else {
        limitColumns = columns
    }
    
    const carouselTemplate = {
        "type": "template",
        "altText": "carousel template",
        "template": {
            "type": "carousel",
            "columns":limitColumns,
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }
    
    return carouselTemplate
    
    // [
    //     {
    //         "thumbnailImageUrl": "https://graph.facebook.com/475688475921038/picture?width=400&height=400",
    //         "imageBackgroundColor": "#FFFFFF",
    //         "title": "店名",
    //         "text": "評價",
    //         "actions": [
    //             {
    //                 "type": "postback",
    //                 "label": "Buy",
    //                 "data": "action=buy&itemid=111"
    //             },
    //             {
    //                 "type": "postback",
    //                 "label": "Add to cart",
    //                 "data": "action=add&itemid=111"
    //             },
    //             {
    //                 "type": "uri",
    //                 "label": "View detail",
    //                 "uri": "http://example.com/page/111"
    //             }
    //         ]
    //     },
    //     {
    //         "thumbnailImageUrl": "https://graph.facebook.com/475688475921038/picture?width=400&height=400",
    //         "imageBackgroundColor": "#000000",
    //         "title": "this is menu",
    //         "text": "description",
    //         "actions": [
    //             {
    //                 "type": "postback",
    //                 "label": "Buy",
    //                 "data": "action=buy&itemid=222"
    //             },
    //             {
    //                 "type": "postback",
    //                 "label": "Add to cart",
    //                 "data": "action=add&itemid=222"
    //             },
    //             {
    //                 "type": "uri",
    //                 "label": "View detail",
    //                 "uri": "http://example.com/page/222"
    //             }
    //         ]
    //     }
    // ]
    
    
}

// getFacebookRestaurantData('24.141727','120.646669','1000')
//     .then((result) => {
//         console.log(result)
//     }).catch(e => {
//     console.log(e)
// })

module.exports.getFacebookRestaurantData = getFacebookRestaurantData
module.exports.parseFbDataToLineTemplate = parseFbDataToLineTemplate

// axios.get('https://graph.facebook.com/oauth/access_token?client_id=427733294327044&client_secret=b48f1b21f09b3d1a9b7931ee2ac1c32c&grant_type=client_credentials')
//     .then(result => {
//         console.log(result)
//     }).catch(e => {
//     console.log(e.message)
// })