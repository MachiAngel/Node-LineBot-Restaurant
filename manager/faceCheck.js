const Clarifai = require('clarifai')

const app = new Clarifai.App({
    apiKey: process.env.Clarifai_API
});

const checkFace = async (imageObjects,pgdb) => {
    const checkResults = []
    for (let imageObject of imageObjects) {
        try {
            const response = await app.models.predict(Clarifai.FACE_DETECT_MODEL, imageObject.image_url)
            const regions = response.outputs[0].data.regions
            if (regions) {
                // return `${url} -> have face`
                checkResults.push(`${imageObject.image_url} -> have face`)
            }else {
                console.log(`${imageObject.image_url} -> no face`)
                
                const addCheckResult = await pgdb('ptt_beauty_image_check').insert(imageObject).returning('*')
                console.log(addCheckResult)
                if (addCheckResult.length) {
                    checkResults.push(`add ${addCheckResult[0].image_url} to check`)
                }else {
                    checkResults.push(`do not get add check ${imageObject.image_url} result`)
                }
            }
        }catch (e) {
            checkResults.push(e.message)
        }
    }
    return checkResults
}

module.exports.checkFace = checkFace


