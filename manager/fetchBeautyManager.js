const {pgdb} = require('../db/pgdb')
const {checkFace} = require('./faceCheck')

const getOneRandomImageTemplate = async () => {
    try {
        const results = await pgdb('ptt_beauty_image')
            .join('ptt_beauty_article', 'ptt_beauty_image.article_id', 'ptt_beauty_article.article_id')
            .select('ptt_beauty_image.image_url', 'ptt_beauty_article.rate','ptt_beauty_article.article_url','ptt_beauty_article.title')
            .orderBy(pgdb.raw('RANDOM()')).limit(1)
        if (!results.length) {
            throw new Error('server error 500')
        }
        const object1 = {type: "text",text:`${results[0].title}\n🔥圖片推文數: ${results[0].rate}🔥\nPtt連結👇👇👇\n ${results[0].article_url}`}
        const object2 = {
            "type": "image",
            "originalContentUrl": results[0].image_url,
            "previewImageUrl": results[0].image_url
        }
        
        return [object1,object2]
    }catch (e) {
        throw e
    }
}

const getRandomImagesTemplate = async (count = 1) => {
    try {
        const results = await pgdb('ptt_beauty_image').orderBy(pgdb.raw('RANDOM()')).limit(count)
        if (!results.length) {
            throw new Error('server error 500')
        }
        const lineImageArray = results.map(result => {
            return {
                "type": "image",
                "originalContentUrl": result.image_url,
                "previewImageUrl": result.image_url
            }
        })
        
        try{
            checkFace(results,pgdb).then(results => {
                console.log(results)
            })
        }catch (e) {
            console.log(e.message)
        }
        
        return lineImageArray
    }catch (e) {
        throw e
    }
}


module.exports = {
    getOneRandomImageTemplate,
    getRandomImagesTemplate
}