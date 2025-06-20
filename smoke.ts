import { clusterAnalysis } from '@rwai/pulse/starters'
import { isPulseAPIError } from './src/errors'
// import { Starters } from '@rwai/pulse'

const reviewsFile = './scripts/reviews.txt'

try {
    const clustering = await clusterAnalysis(reviewsFile)

    console.log(clustering)
    const matrix = clustering.similarityMatrix

    console.log('Similarity Matrix:')
    console.table(matrix)

    console.time('K-Means Clustering')
    console.log('Running K-Means...')
    const kMeansResult = clustering.kMeans()
    console.timeEnd('K-Means Clustering')
    console.log('K-Means Result:', kMeansResult)

    console.time('K-Medoids Clustering')
    console.log('Running K-Medoids...')
    const kMedoidsResult = clustering.kMedoids()
    console.timeEnd('K-Medoids Clustering')
    console.log('K-Medoids Result:', kMedoidsResult)

    console.time('HAC Clustering')
    console.log('Running HAC...')
    const hacResult = clustering.hac()
    console.timeEnd('HAC Clustering')
    console.log('HAC Result:', hacResult)

    console.time('DBSCAN Clustering')
    console.log('Running DBSCAN...')
    const dbscanResult = clustering.dbscan()
    console.timeEnd('DBSCAN Clustering')
    console.log('DBSCAN Result:', dbscanResult)
} catch (error) {
    if (isPulseAPIError(error)) {
        console.error(`Pulse API Error: ${error.status} ${error.statusText}`)
        console.error('Response Body:', await error.body)
        process.exit(1)
    }
    console.error(error)
    process.exit(1)
}
