import { clusterAnalysis } from '@rwai/pulse/starters'
import { isPulseAPIError } from './src/errors'
// import { Starters } from '@rwai/pulse'

const reviewsFile = './scripts/reviews.txt'

try {
    const clustering = await clusterAnalysis(reviewsFile)

    clustering.similarityMatrix.prettyPrint()

    // console.log('========= Auto Clustering ==========')

    // console.time('K-Means Clustering')
    // console.log('Running K-Means...')
    // const kMeansResult = clustering.kMeans({ k: 8, maxIterations: 100, normalize: true })
    // console.timeEnd('K-Means Clustering')
    // console.log('K-Means Result:', kMeansResult)

    // console.time('K-Medoids Clustering')
    // console.log('Running K-Medoids...')
    // const kMedoidsResult = clustering.kMedoids({ k: 8, maxIterations: 100, normalize: true })
    // console.timeEnd('K-Medoids Clustering')
    // console.log('K-Medoids Result:', kMedoidsResult)

    // console.time('HAC Clustering')
    // console.log('Running HAC...')
    // const hacResult = clustering.hac({ k: 8 })
    // console.timeEnd('HAC Clustering')
    // console.log('HAC Result:', hacResult)

    const epss = [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.3]

    console.log('========= DBSCAN Clustering ==========')
    epss.forEach(eps => {
        console.time(`DBSCAN Clustering (eps=${eps})`)
        console.log(`Running DBSCAN with eps=${eps}...`)
        const dbscanResult = clustering.dbscan({ eps, minPts: 5 })
        console.timeEnd(`DBSCAN Clustering (eps=${eps})`)
        console.log(`DBSCAN Result (eps=${eps}):`, dbscanResult)
    })
} catch (error) {
    if (isPulseAPIError(error)) {
        console.error(`Pulse API Error: ${error.status} ${error.statusText}`)
        console.error('Response Body:', await error.body)
        process.exit(1)
    }
    console.error(error)
    process.exit(1)
}
