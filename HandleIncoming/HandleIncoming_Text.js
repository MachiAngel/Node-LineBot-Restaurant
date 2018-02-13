const {currencyETCDict, currencyETFDict, bankNameToBankCodeDict} = require('../util/constant')
const { MESSAGE_TYPE_BANK_RATE, MESSAGE_TYPE_BEST_RATE, MESSAGE_TYPE_PASS, MESSAGE_TYPE_WORNG_COMMAND, MESSAGE_TYPE_NO_MATCH} = require('../util/constant')
const {ACTION_TEXT_BANK_RATE,
    ACTION_TEXT_BEST_RATE,
    ACTION_TEXT_WORNG_COMMAND,
    ACTION_TEXT_PASS,
    ACTION_TEXT_NO_MATCH,
    ACTION_TEXT_YAHOO_MOVIE,
    ACTION_TEXT_DRAW_BEAUTY,
    ACTION_TEXT_SEARCH_PTT_MOVIE
} = require('../util/constant')

// const MESSAGE_TYPE_BANK_RATE = 'messageTypeBankRate'
// const MESSAGE_TYPE_BEST_RATE = 'messageTypeBestRate'
// const MESSAGE_TYPE_PASS = 'messageTypePass'
// const MESSAGE_TYPE_WORNG_COMMAND = 'messageTypeWorngCommand'
// const MESSAGE_TYPE_NO_MATCH = 'messageTypeNoMatch'


const haveFristSlash = (text) => {

    if (text.substring(0,1) == '/') {
        return true
    }else{
        return false
    }
}


const switchIncomingType = (string) => {

    if (!haveFristSlash(string)) {
        
        //最近yahoo電影
        if (string === 'movie' || string === 'Movie' || string === '電影') {
          return {type:ACTION_TEXT_YAHOO_MOVIE,value:string}
        }
        //找電影ptt
        if (string.substr(0,3) === '電影 ') {
            const queryString = string.replace('電影 ','').trim()
            return {type:ACTION_TEXT_SEARCH_PTT_MOVIE,value:queryString}
        }
        
        //只有第一個字是抽能近來
        if (string.substring(0,1) === '抽') {
            if (string === '抽' ) {
                return {type:ACTION_TEXT_DRAW_BEAUTY,value:1}
            }
            const numberString = string.replace('抽','')
            if (Number(numberString)) {
                return {type:ACTION_TEXT_DRAW_BEAUTY,value:Number(numberString)}
            }
            
        }
        
        return {type:ACTION_TEXT_PASS,value:string}
    }
    const removeSlashString = string.substring(1,string.length)
    const array = removeSlashString.split(' ')
    const firstElement = array[0]
    const secondElement = array[1]
    
    //檢查是否查詢最佳匯率 是的話 直接回傳 "幣別名稱"
    if (firstElement === 'best') {

        if (secondElement == undefined) {
            return {type:ACTION_TEXT_WORNG_COMMAND, value:'請輸入條件'}
        }

        if (currencyETCDict[secondElement.toUpperCase()] !== undefined ) {
            return {type:ACTION_TEXT_BEST_RATE, value:secondElement.toUpperCase()}
        }else{
            return {type:ACTION_TEXT_WORNG_COMMAND, value:secondElement}
        }
    }

    //檢查是否直接查詢 銀行資料 是的話直接回傳 "銀行代碼"
    if (bankNameToBankCodeDict[firstElement] !== undefined) {
        return {type:ACTION_TEXT_BANK_RATE, value:bankNameToBankCodeDict[firstElement]}
    }

    //剩下的...
    return {type:ACTION_TEXT_NO_MATCH, value:removeSlashString}

}





module.exports.haveFristSlash = haveFristSlash
// module.exports.bankResultDictToString = bankResultDictToString
module.exports.switchIncomingType = switchIncomingType
// module.exports.bestRateResultDictToString = bestRateResultDictToString
