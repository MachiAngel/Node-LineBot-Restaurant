
const {pgdb} = require('../db/pgdb')

const getOneRandomImageTemplate = async () => {
    try {
        const results = await pgdb('images')
            .join('articles', 'images.article_link', 'articles.article_link')
            .select('images.url_link', 'articles.rate','articles.article_link','articles.title')
            .orderBy(pgdb.raw('RANDOM()')).limit(1)
        if (!results.length) {
            throw new Error('server error 500')
        }
        const object1 = {type: "text",text:`${results[0].title}\n🔥圖片推文數: ${results[0].rate}🔥\nPtt連結👇👇👇\n ${results[0].article_link}`}
        const object2 = {
            "type": "image",
            "originalContentUrl": results[0].url_link,
            "previewImageUrl": results[0].url_link
        }
        
        return [object1,object2]
    }catch (e) {
        throw e
    }
}



const getRandomImagesTemplate = async (count = 1) => {
    try {
        const results = await pgdb('images').orderBy(pgdb.raw('RANDOM()')).limit(count)
        if (!results.length) {
            throw new Error('server error 500')
        }
        
        const lineImageArray = results.map(result => {
            return {
                "type": "image",
                "originalContentUrl": result.url_link,
                "previewImageUrl": result.url_link
            }
        })
        return lineImageArray
    }catch (e) {
        throw e
    }
}


// getOneRandomImageTemplate().then(results => {
//     console.log(results)
// }).catch(e => {
//     console.log(e.message)
//     //console.log(e.message)
// })


// getRandomImagesTemplate(5).then(results => {
//     console.log(results)
// }).catch(e => {
//     console.log(e.message)
//     //console.log(e.message)
// })

module.exports = {
    getOneRandomImageTemplate,
    getRandomImagesTemplate
}