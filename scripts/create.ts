import * as fs from 'fs'
import * as path from 'path'

interface Review {
    product: string
    review: string
}

// Helper function to escape fields for CSV/TSV
function escapeField(field: string, delimiter: string, quoteChar: string = '"'): string {
    if (field === null || field === undefined) {
        return '' // Represent null or undefined as an empty string in the output
    }
    const strField = String(field) // Ensure working with a string

    // Determine if quoting is necessary:
    // - field contains the delimiter
    // - field contains the quote character itself
    // - field contains a newline or carriage return
    const needsQuoting =
        strField.includes(delimiter) ||
        strField.includes(quoteChar) ||
        strField.includes('\n') ||
        strField.includes('\r')

    if (needsQuoting) {
        // Escape occurrences of the quote character by doubling them
        const quoteRegex = new RegExp(quoteChar, 'g')
        const escapedField = strField.replace(quoteRegex, quoteChar + quoteChar)
        // Enclose the escaped field in quote characters
        return `${quoteChar}${escapedField}${quoteChar}`
    }

    // If no quoting is needed, return the field as is
    return strField
}

function main() {
    const args = process.argv.slice(2)

    if (args.length !== 1) {
        console.error('Usage: node <script.js> <txt|csv|tsv>')
        console.error('Example: node create.js txt')
        process.exit(1)
    }

    const fileType = args[0].toLowerCase()
    const validFileTypes = ['txt', 'csv', 'tsv']

    if (!validFileTypes.includes(fileType)) {
        console.error(
            `Invalid file type: '${fileType}'. Must be one of ${validFileTypes.join(', ')}.`,
        )
        process.exit(1)
    }

    const inputFileName = 'reviews.json'
    const outputFileName = `reviews.${fileType}`

    // Assume reviews.json is in the same directory as the script
    const inputFilePath = path.join(__dirname, inputFileName)
    const outputFilePath = path.join(__dirname, outputFileName)

    let rawReviewsData: unknown
    try {
        const fileContent = fs.readFileSync(inputFilePath, 'utf-8')
        rawReviewsData = JSON.parse(fileContent)
    } catch (error: unknown) {
        if ((error as { code: string }).code === 'ENOENT') {
            console.error(`Error: Input file '${inputFileName}' not found at ${inputFilePath}`)
        } else {
            console.error(
                `Error reading or parsing '${inputFileName}':`,
                (error as { message: string }).message,
            )
        }
        process.exit(1)
    }

    if (!Array.isArray(rawReviewsData)) {
        console.error(`Error: Expected '${inputFileName}' to contain a JSON array of reviews.`)
        process.exit(1)
    }

    const reviews = rawReviewsData as Review[]
    const outputLines: string[] = []

    for (const review of reviews) {
        if (typeof review.product === 'string' && typeof review.review === 'string') {
            let line: string
            if (fileType === 'csv') {
                line = escapeField(`${review.product}: ${review.review}`, ',')
            } else if (fileType === 'tsv') {
                line = escapeField(`${review.product}: ${review.review}`, '\t')
            } else {
                // txt
                line = `${review.product}: ${review.review}`
            }
            outputLines.push(line)
        } else {
            console.warn(
                `Skipping review with missing or invalid product/review: ${JSON.stringify(review)}`,
            )
        }
    }

    const outputContent = outputLines.join('\n')

    try {
        fs.writeFileSync(outputFilePath, outputContent, 'utf-8')
        console.log(`Successfully created ${outputFilePath} with ${outputLines.length} entries.`)
    } catch (error: unknown) {
        console.error(`Error writing to ${outputFilePath}:`, (error as { message: string }).message)
        process.exit(1)
    }
}

// Run the main function
main()
