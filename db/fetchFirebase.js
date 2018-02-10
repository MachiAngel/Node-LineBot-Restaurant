const {FirebaseDb} = require('./firebaseDb')
const {currencyETCDict, currencyETFDict, bankNameToBankCodeDict} = require('../util/constant')



class FetchFireBaseData {
  //回傳string拿來餵給line
  async getFireBaseBestRateByCurrency(currency) {

      try {
        const snapshot = await FirebaseDb.ref(`/BestRate/${currency}`).once('value')
        const resultDict = snapshot.val()
        if (resultDict == null) {
            throw new Error('server error')
        }
        return this.bestRateResultDictToString(currency,resultDict)

      }catch (e) {
        throw e
      }

  }

  //整理firebase回傳最佳{幣別}匯率 dict to string
  bestRateResultDictToString(currencyName,{cashBuying,cashSelling,spotBuying,spotSelling}){
      const currencyChineseName = currencyETCDict[currencyName]
      let resultString = `⭐${currencyChineseName} 最佳換匯銀行⭐\n`
      resultString += `---------------------\n`
      resultString += `🔥現金交易🔥\n`
      resultString += `---------------------\n`
      resultString += `買入${currencyChineseName}最佳銀行👉${cashSelling.bankName}\n`
      resultString += `匯率:${cashSelling.cashSelling}\n`
      resultString += `1${currencyChineseName}=${cashSelling.cashSelling}台幣\n`
      resultString += `牌告時間:${cashSelling.rateTime}\n`
      resultString += `---------------------\n`
      resultString += `賣出${currencyChineseName}最佳銀行👉${cashBuying.bankName}\n`
      resultString += `匯率:${cashBuying.cashBuying}\n`
      resultString += `1${currencyChineseName}=${cashBuying.cashBuying}台幣\n`
      resultString += `牌告時間:${cashBuying.rateTime}\n`
      resultString += `---------------------\n`
      resultString += `🔥即期交易🔥\n`
      resultString += `---------------------\n`
      resultString += `買入${currencyChineseName}最佳👉${spotSelling.bankName}\n`
      resultString += `匯率:${spotSelling.spotSelling}\n`
      resultString += `1${currencyChineseName}=${spotSelling.spotSelling}台幣\n`
      resultString += `牌告時間:${spotSelling.rateTime}\n`
      resultString += `---------------------\n`
      resultString += `賣出${currencyChineseName}最佳👉${cashBuying.bankName}\n`
      resultString += `匯率:${spotBuying.spotBuying}\n`
      resultString += `1${currencyChineseName}=${spotBuying.spotBuying}新台幣\n`
      resultString += `牌告時間:${spotBuying.rateTime}\n`
      resultString += `----------------\n`
      return resultString
  }

  //拿個間銀行資料 且回傳string
  async getFireBaseDataByBankCode(bankCode){

    try {

      const snapshot = await FirebaseDb.ref(`/Bank/${bankCode}`).once('value')
      const resultDict = snapshot.val()
      if (resultDict == null) {
          throw new Error('server error')
      }
      return this.parseBankResultDictToString(resultDict)

    }catch (e) {
      throw e
    }

  }

  parseBankResultDictToString({bankName,bankCode,rateList,rateTime}){
      let resultString = `⭐${bankCode} ${bankName} 最新匯率⭐`
      resultString += '\n'
      Object.keys(rateList).map((key,index) =>{
          const {cashBuying, cashSelling, spotBuying, spotSelling} = rateList[key]
          const currencyChineseName = currencyETCDict[key]
          const currencyFlag = currencyETFDict[key]

          resultString += `${currencyFlag}-${currencyChineseName}\n`
          if (cashBuying !== 0 && cashSelling !== 0) {
              // resultString += `現金買入:${cashBuying}\n現金賣出:${cashSelling}\n`
              resultString += '💰💰現金交易\n'
              resultString += `買入:${cashBuying} 賣出:${cashSelling}\n`
          }
          if (spotBuying !== 0 && spotSelling !== 0) {
              resultString += '📖📖即期交易\n'
              resultString += `買入:${spotBuying} 賣出:${spotSelling}\n`
          }
          resultString += '-----------------\n'
          //🔥
      })
      resultString += '\n'
      resultString += rateTime
      return resultString
  }


  //拿movie電影 且回傳line template
  async getYahooMovieDataTemplate(){

    try {

      const snapshot = await FirebaseDb.ref(`/YahooTopMovie/`).once('value')
      const resultArray = snapshot.val()
      if (resultArray == null) {
          throw new Error('server error')
      }
      return this.parseFirebaseMovieDataToLineTemplate(resultArray)

    }catch (e) {
      throw e
    }

  }

  parseFirebaseMovieDataToLineTemplate(resultArray){
      //console.log('resultData:' + resultData)
      const columns = resultArray.map((movieObject) => {
          const {imdb_rate
            , movieTime_url
            , movie_length
            , movie_name_ch
            , movie_name_en
            , poster_url
            , release_date
            , yahoo_rate
            , yahoo_rate_count} = movieObject

          //handle para..
          let title = ''
          if (movie_name_ch.length > 40) {
              title = movie_name_ch.replace(/[a-zA-z]/g,'')
          }else {
              title = movie_name_ch
          }

          const action1 = {
              "type": "uri",
              "label": "電影時刻表",
              "uri": `${movieTime_url}`
          }
          // const action2 = {
          //     "type": "uri",
          //     "label": "店家位置",
          //     "uri": `https://www.google.com.tw/maps/place/${location.latitude},${location.longitude}`
          // }

          // let description = `${movie_name_en}\n`
          let description = ``
          description += `${movie_length}\n`
          description += `Yahoo評分: ${yahoo_rate}/5 ${yahoo_rate_count}\n`
          description += `IMDB評分: ${imdb_rate}/10`

          const column = {
              "thumbnailImageUrl": `${poster_url}`,
              "imageBackgroundColor": "#FFFFFF",
              "title": `${title}`,
              "text": description,
              "actions":[action1]
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

      // limitColumns = columns.slice(0,1)


      const carouselTemplate = {
          "type": "template",
          "altText": "台北票房Top10電影",
          "template": {
              "type": "carousel",
              "columns":limitColumns,
              "imageAspectRatio": "rectangle",
              "imageSize": "cover"
          }
      }

      return carouselTemplate
  }

}




const firebaseManager = new FetchFireBaseData()



// firebaseManager.getYahooMovieDataTemplate()
//   .then(result => {
//     console.log(result);
//
//
//
// })



module.exports.firebaseManager = firebaseManager


// firebaseManager.getFireBaseDataByBankCode('004')
//   .then(result => {
//   console.log(result);
//
// })

// getFireBaseBestRateByCurrency('AUD')
//   .then(result => {
//    console.log(result);
// }).catch((e) => {
//     console.log(e.message);
// })
