const {pgdb} = require('../db/pgdb')
const {FirebaseDb} = require('../db/firebaseDb')
const {replaceCHNumToNumAndlowerCase} = require('../util/publicfuction')
const moment = require('moment')
const _ = require('lodash')

//用關鍵字找ptt電影版
const getPttMoiveTemplate = async (str) => {
    
    const modifyString = replaceCHNumToNumAndlowerCase(str)
    try {
        const results = await pgdb.select('isgood',pgdb.raw('COUNT(article_id)'))
            .from('ptt_movie_article')
            .whereNotNull('isgood')
            .andWhere('title_s', 'like', `%${modifyString}%`)
            .groupByRaw('isgood')
        
        if (!results.length) {
            return `很抱歉，查無 <${str}> 的相關評價文章`
        }
        const comment = {}
        for (let each of results) {
            const {isgood, count} = each
            if (isgood === true ){
                comment['goodCount'] = count
            }else if (isgood === false) {
                comment['badCount'] = count
            }
        }
        let resultString = 'Ptt電影版\n'
        resultString += `搜尋 ${str} 結果如下:\n`
        resultString += `好雷:${comment.goodCount}\n`
        resultString += `負雷:${comment.badCount}\n`
        const template = {
            "type": "template",
            "altText": `${str} 電影評價`,
            "template": {
                "type": "confirm",
                "text": resultString,
                "actions": [
                    {
                        "type": "message",
                        "label": "所有好雷",
                        "text": "yes"
                    },
                    {
                        "type": "message",
                        "label": "所有負雷",
                        "text": "no"
                    }
                ]
            }
        }
        
        return template
    }catch (e) {
        throw e
    }
}

//使用者打字串電影 回傳資料template

const getYahooMovieDataTemplate = async () => {
    try {
        const snapshot = await FirebaseDb.ref(`/YahooTopMovie/`).once('value')
        const resultArray = snapshot.val()
        if (resultArray == null) {
            throw new Error('server error')
        }
        return parseFirebaseMovieDataToLineTemplate(resultArray)
    }catch (e) {
        throw e
    }
}

//變成吃所有筆數 array ->回傳20筆 分兩次
const parseFirebaseMovieDataToLineTemplate = (resultArray) => {
    
    const columns = resultArray.map((movieObject) => {
        const {imdb_rate, movieTime_url, movie_length
            , movie_name_ch, movie_name_en, poster_url
            , release_date, yahoo_rate, yahoo_rate_count
            , pttBad, pttGood, searchPttString} = movieObject
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
    
        const postbackDict = {
            action:'ptt_movie_article',
            data:{
                title,
                title_s:`${searchPttString}`
            }
        }
        const action2 = {
            "type": "postback",
            "label": "PTT電影版評論",
            "data":JSON.stringify(postbackDict)
        }
        
        const pttMovieGoodCount = (pttGood > 0)?`${pttGood}`:'無'
        const pttMovieBadCount = (pttBad > 0)?`${pttBad}`:'無'
        let description = ``
        //description += `${movie_length}\n`
        description += `Yahoo評價: ${yahoo_rate}/5\n`
        description += `IMDB評價: ${imdb_rate}/10\n`
        description += `PTT 好雷:${pttMovieGoodCount} / 負雷:${pttMovieBadCount}`
        
        const column = {
            "thumbnailImageUrl": `${poster_url}`,
            "imageBackgroundColor": "#FFFFFF",
            "title": `${title}`,
            "text": description,
            "actions":[action1,action2]
        }
        
        return column
    })
    
    
    //檢查回傳數量
    const chunkColumns = _.chunk(columns,10)
    
    const templates = chunkColumns.map(chunkColumn => {
        const carouselTemplate = {
            "type": "template",
            "altText": "近期10筆上映電影",
            "template": {
                "type": "carousel",
                "columns":chunkColumn,
                "imageAspectRatio": "rectangle",
                "imageSize": "cover"
            }
        }
        return carouselTemplate
    })
    
    
    return templates
}

const getPttMovieArticlesTemplate = async (title,title_s) => {
    //三個月內
    const subtractDateString = new moment().subtract(3, 'months').format('YYYY-MM-DD')
    const firstString = `${title}Ptt評論文章結果如下:`
    let templateStringArray = [firstString]
    try {
        const articles = await pgdb.select('*')
            .from('ptt_movie_article')
            .whereNotNull('isgood')
            .andWhere('title_s', 'like', `%${title_s}%`)
            .andWhere('article_date','>',subtractDateString)
        
        
        if (articles.length === 0) {
            return [firstString,`無${title} 的評論文章`]
        }
    
        let goodCommentCount = 0
        let badCommentCount = 0
        let goodCommentArticleString = '好雷👍👍👍\n'
        let badCommentArticleString = '負雷👎👎👎\n'
        
        for (let article of articles) {
            const {title,isgood,article_url} = article
            if (isgood) {
                goodCommentCount += 1
                let finalTitle = title
                if (title.length > 18) {
                    finalTitle = title.slice(0,15) + '...'
                }
                goodCommentArticleString += `${finalTitle}\n`
                goodCommentArticleString += `${article_url}\n`
            }else {
                badCommentCount += 1
                let finalTitle = title
                if (title.length > 18) {
                    finalTitle = title.slice(0,15) + '...'
                }
                badCommentArticleString += `${finalTitle}\n`
                badCommentArticleString += `${article_url}\n`
            }
        }
        if (goodCommentCount > 0) {
            templateStringArray.push(goodCommentArticleString)
        }
        if (badCommentCount > 0) {
            templateStringArray.push(badCommentArticleString)
        }
    
        return templateStringArray
    }catch (e) {
        throw e
    }
}


module.exports = {
    getPttMoiveTemplate,
    getYahooMovieDataTemplate,
    getPttMovieArticlesTemplate
}