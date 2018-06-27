//const {pgdb} = require('../db/pgdb')


const knex = require('knex')
const url = 'postgres://izphwmbnwhbhbr:b77f2483ad1fe298be80d5a2cf6813781a16404ea0207553977cae61df721c48@ec2-54-243-59-122.compute-1.amazonaws.com:5432/d3p4pg7cohkuo4'
const pgdb = knex({
    client: 'pg',
    connection: url + '?ssl=true'
})

const getBeautyArticles = (req, res) => {
    pgdb('ptt_beauty_article')
        .orderBy('article_date','desc').limit(10)
        .then(result => {
            res.json({code:200,data:result});
        }).catch(e => {
            res.status(500).json('unable to get entries')
    })
}

const getBeautyArticleById = (req, res) => {
    const {id} = req.params
    pgdb('ptt_beauty_image')
        .where('article_id','=',`${id}`)
        .select('image_url')
        .then(results => {
            const formattedResult = results.map(imgObject => {
                return imgObject.image_url
            })
            res.json({code:200,data:formattedResult});
        }).catch (e => {
        res.json({code:500,data:'server error'});
    })
}

const getRandomImage = (req, res) => {
    pgdb('ptt_beauty_image')
        .join('ptt_beauty_article', 'ptt_beauty_image.article_id', 'ptt_beauty_article.article_id')
        .select('ptt_beauty_image.image_url', 'ptt_beauty_article.rate','ptt_beauty_article.article_url','ptt_beauty_article.title')
        .orderBy(pgdb.raw('RANDOM()')).limit(1)
        .then(result => {
            if (result.length > 0) {
                res.json({code:200,data:result[0]});
            }else {
                res.json({code:500,data:'have no image'});
            }
            
        }).catch (e => {
            res.json({code:500,data:'server error'});
    })
}


module.exports = {
    getBeautyArticles,
    getBeautyArticleById,
    getRandomImage
}