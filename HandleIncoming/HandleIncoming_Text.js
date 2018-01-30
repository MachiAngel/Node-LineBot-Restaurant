const {currencyETCDict, currencyETFDict, bankNameToBankCodeDict} = require('../util/constant')
const { MESSAGE_TYPE_BANK_RATE, MESSAGE_TYPE_BEST_RATE, MESSAGE_TYPE_PASS, MESSAGE_TYPE_WORNG_COMMAND, MESSAGE_TYPE_NO_MATCH} = require('../util/constant')
const {ACTION_TEXT_BANK_RATE, ACTION_TEXT_BEST_RATE, ACTION_TEXT_WORNG_COMMAND, ACTION_TEXT_PASS, ACTION_TEXT_NO_MATCH, ACTION_TEXT_YAHOO_MOVIE} = require('../util/constant')

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

        if (string === 'movie' || string === 'Movie' || string === '電影') {
          return {type:ACTION_TEXT_YAHOO_MOVIE,value:string}
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
