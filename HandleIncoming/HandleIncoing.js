const axios = require('axios')
const FB = require('fb')
const util = require('util')



const FB_KEYWORD_RESTAURANT = 'FB_KEYWORD_RESTAURANT'
const FB_KEYWORD_HOT_POT = 'FB_KEYWORD_HOT_POT'
const FB_KEYWORD_BRUNCH = 'FB_KEYWORD_BRUNCH'
const FB_KEYWORD_BBQ = 'FB_KEYWORD_BBQ'

const cloumnDesDict = {
    FB_KEYWORD_RESTAURANT:{
        title:'餐廳',
        subTitle:'搜尋所有種類餐廳',
        imageUrl:'https://i.imgur.com/khDyHSr.jpg'
    },
    FB_KEYWORD_HOT_POT:{
        title:'火鍋',
        subTitle:'搜尋火鍋',
        imageUrl:'https://i.imgur.com/9dXDIu5.jpg'
    },
    FB_KEYWORD_BRUNCH:{
        title:'早午餐',
        subTitle:'搜尋早午餐',
        imageUrl:'https://i.imgur.com/1lhXimE.jpg'
    },
    FB_KEYWORD_BBQ:{
        title:'燒烤',
        subTitle:'搜尋燒烤',
        imageUrl:'https://i.imgur.com/Ni1hCF0.jpg'
    }
}


const prepareSearchActions = (searchType, location) => {
    
    const postbackDict1 = {
        action:'search',
        data:{
            latitude:`${location.latitude}`,
            longitude:`${location.longitude}`,
            distance:10000,
            queryType:'rate',
            q:`${cloumnDesDict[searchType].title}`
        }
    }
    const action1 = {
        "type":"postback",
        "label":"評分最高(10公里內)",
        "data":JSON.stringify(postbackDict1)
    }
    
    const postbackDict2 = {
        action:'search',
        data:{
            latitude:location.latitude,
            longitude:location.longitude,
            distance:10000,
            queryType:'checkin',
            q:`${cloumnDesDict[searchType].title}`
        }
    }
    const action2 = {
        "type":"postback",
        "label":"最多打卡(10公里內)",
        "data":JSON.stringify(postbackDict2)
    }
    const postbackDict3 = {
        action:'search',
        data: {
            latitude:location.latitude,
            longitude:location.longitude,
            distance:5000,
            queryType:'all',
            q:`${cloumnDesDict[searchType].title}`
        }
    }
    
    const action3 = {
        "type":"postback",
        "label":"最近地標(5公里內)",
        "data":JSON.stringify(postbackDict3)
    }
    return [action1,action2,action3]
}

const getSearchTemplate = (location) => {
    return {
        "type": "template",
        "altText": "carousel template",
        "template": {
            "type": "carousel",
            "columns": prepareSearchColumns(location),
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }
}

const prepareSearchColumns = (location) => {
    const column1 = getColumn(FB_KEYWORD_RESTAURANT,location)
    const column2 = getColumn(FB_KEYWORD_BBQ,location)
    const column3 = getColumn(FB_KEYWORD_BRUNCH,location)
    const column4 = getColumn(FB_KEYWORD_HOT_POT,location)
    return [column1, column2, column3, column4]
    
}

const getColumn = (searchType,location) => {
    
    const actions = prepareSearchActions(searchType, location)
    
    const column = {
        "thumbnailImageUrl": `${cloumnDesDict[searchType].imageUrl}`,
        "imageBackgroundColor": "#FFFFFF",
        "title": `${cloumnDesDict[searchType].title}`,
        "text": `${cloumnDesDict[searchType].subTitle}`,
        "actions": actions
    }
    return column
}
// console.log(cloumnDesDict[FB_KEYWORD_RESTAURANT])
// const testColumn = getColumn(FB_KEYWORD_RESTAURANT,{latitude:'23.1211',longitude:'124.33213'})
// console.log(testColumn)






//Seach api
const getFacebookRestaurantData = async (lat,lon,distance,q='restaurant') => {
    
    try {
        const fieldObject = {
            fields:['name','checkins','picture','phone','rating_count','single_line_address','website','overall_star_rating','category_list','location'],
            access_token:process.env.FB_ACCESSTOKEN
        }
        
        const result = await FB.api(`/search?type=place&q=${q}&center=${lat}, ${lon}&locale=zh-TW&limit=50&distance=${distance}`,fieldObject)
        console.log(util.inspect(result, false, null))
        const restaurants = result.data
        
        let next
        if (result.paging !== undefined) {
            next = result.paging.next
        }
        
        while (next !== undefined) {
            console.log(next)
            console.log(`restaurants:${restaurants.length}`)
            const result2 = await axios.get(next)
            restaurants.push.apply(restaurants, result2.data.data)
            if (result2.data.paging === undefined) {
                next = undefined
            }else {
                next = result2.data.paging.next
            }

        }
        
        console.log(`restaurants:${restaurants.length}`)
        return restaurants
        
    }catch (e){
        throw e
    }
}

const getResultOfsortedFBData = (resultData,qType) => {
    if (qType === 'rate') {
      const filteredOfNoRatingCountArray = resultData.filter((place) => {
          if (place.rating_count >= 200 && place.overall_star_rating >= 4) {
              return true
          }else {
              return false
          }
      })
      const sortedRatingArray = filteredOfNoRatingCountArray.sort((a,b) => {
          return b.overall_star_rating - a.overall_star_rating
      })
      return sortedRatingArray
      
    }else if (qType === 'checkin'){
        
        const sortedArray = resultData.sort((a,b) => {
            
            return b.checkins - a.checkins
        })
        return sortedArray
    }else {
        
        return resultData
    }
}

const parseFbDataToLineTemplate = (resultData) => {
    //console.log('resultData:' + resultData)
    const columns = resultData.map((shop) => {
        
        //handle para..
        let title = ''
        if (shop.name.length > 40) {
            title = shop.name.replace(/[a-zA-z]/g,'')
        }else {
            title = shop.name
        }
        
        const actions = getActionsOfColumn(shop.id,shop.location,shop.phone)
        let description = `FB評分:無\n打卡人數:${shop.checkins}人`
        if (shop.overall_star_rating !== 0 && shop.rating_count !== 0) {
            description = `FB評分:${shop.overall_star_rating}分/${shop.rating_count}人\n打卡人數:${shop.checkins}人`
        }
        const column = {
            "thumbnailImageUrl": `https://graph.facebook.com/${shop.id}/picture?width=400&height=200`,
            "imageBackgroundColor": "#FFFFFF",
            "title": `${title}`,
            "text": description,
            "actions":actions
        }
        
        return column
    })
    
    //檢查回傳數量
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
}

const getActionsOfColumn = (id,location,phone) => {
    
    //const actions = []
    const action1 = {
        "type": "uri",
        "label": "FB粉絲專頁",
        "uri": `https://www.facebook.com/${id}`
    }
    const action2 = {
        "type": "uri",
        "label": "店家位置",
        "uri": `https://www.google.com.tw/maps/place/${location.latitude},${location.longitude}`
    }
    
    const action3 = {}
    action3['type'] = 'uri'
    
    if (phone != undefined) {
        //console.log(phone.replace(' ','').replace('-',''))
        action3['label'] = '店家電話'
        action3['uri'] = `tel://${phone.replace(/[^0-9]/g,"")}`
    }else {
        action3['label'] = '無提供電話'
        action3['uri'] = `tel://無提供電話`
    }
    
    
    return [action1, action2, action3 ]
}

// getFacebookRestaurantData('24.141727','120.646669','1000')
//     .then((result) => {
//         console.log(result)
//     }).catch(e => {
//     console.log(e)
// })

const getDistance = async (originLocation,destinationLocation) => {
    // 24.142474,120.651377
    
    try {
        const result = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLocation.latitude},${originLocation.longitude}&destinations=${destinationLocation.latitude},${destinationLocation.longitude}&key=AIzaSyCUmuZgHc1wAdmjbVF3QJEtH475OAI6H1g`)
        if (result.data.rows[0].elements[0].status === 'OK') {
            console.log('xxxxx')
            return result.data.rows[0].elements[0].distance.value
        }else {
            return undefined
        }
    }catch (e){
        return undefined
    }
    
}

// getDistance({latitude:24.142474,longitude:120.651377},{latitude:24.143474,longitude:120.655377})
//     .then(result => {
//         console.log(result)
//     })



function distance(lat1, lon1, lat2, lon2, unit) {
    const radlat1 = Math.PI * lat1/180
    const radlat2 = Math.PI * lat2/180
    const theta = lon1-lon2
    const radtheta = Math.PI * theta/180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="M") { dist = dist * 0.8684 }
    return dist
}

console.log(distance(24.142474,120.651377,24.143474,120.655377,'K'))


module.exports.getFacebookRestaurantData = getFacebookRestaurantData
module.exports.parseFbDataToLineTemplate = parseFbDataToLineTemplate
module.exports.getSearchTemplate = getSearchTemplate
module.exports.getResultOfsortedFBData = getResultOfsortedFBData
