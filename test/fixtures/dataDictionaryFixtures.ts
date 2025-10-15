/**
 * Test data fixtures for data dictionary integration tests
 */

/**
 * Small dataset fixture (5 rows × 4 columns)
 * Includes header row and 4 data rows with mixed data types
 */
export const smallDataset: string[][] = [
    ['Name', 'Age', 'City', 'Satisfaction'],
    ['John Doe', '25', 'New York', 'Very Satisfied'],
    ['Jane Smith', '30', 'Los Angeles', 'Satisfied'],
    ['Bob Johnson', '35', 'Chicago', 'Neutral'],
    ['Alice Williams', '28', 'Houston', 'Satisfied'],
]

/**
 * Dataset with missing values
 * Contains empty strings to represent missing data
 */
export const datasetWithMissingValues: string[][] = [
    ['ID', 'Name', 'Score', 'Category'],
    ['1', 'Alice', '85', 'A'],
    ['2', 'Bob', '', 'B'],
    ['3', '', '92', 'A'],
    ['4', 'Charlie', '78', ''],
    ['5', 'Diana', '95', 'A'],
]

/**
 * Dataset with numeric and categorical data
 * Mix of different data types for comprehensive testing
 */
export const mixedDataset: string[][] = [
    ['Product', 'Price', 'Rating', 'InStock', 'Category'],
    ['Laptop', '999.99', '4.5', 'true', 'Electronics'],
    ['Mouse', '29.99', '4.2', 'true', 'Electronics'],
    ['Desk', '299.00', '4.8', 'false', 'Furniture'],
    ['Chair', '199.99', '4.6', 'true', 'Furniture'],
    ['Monitor', '349.99', '4.7', 'true', 'Electronics'],
    ['Keyboard', '79.99', '4.3', 'true', 'Electronics'],
]

/**
 * Dataset for error testing - exceeds row limit
 * This would exceed the 50,000 row limit when fully generated
 * For testing purposes, we'll use a smaller version that simulates the structure
 */
export function generateLargeDataset(rows: number, cols: number): string[][] {
    const headers = Array.from({ length: cols }, (_, i) => `Column${i + 1}`)
    const data: string[][] = [headers]

    for (let i = 0; i < rows; i++) {
        const row = Array.from({ length: cols }, (_, j) => `Value${i}_${j}`)
        data.push(row)
    }

    return data
}

/**
 * Dataset that exceeds column limit (1,000 columns)
 */
export const datasetExceedingColumnLimit = generateLargeDataset(5, 1001)

/**
 * Dataset that exceeds row limit (50,000 rows)
 */
export const datasetExceedingRowLimit = generateLargeDataset(50001, 5)

/**
 * Dataset that exceeds total cell limit (100,000 cells)
 * 500 rows × 201 columns = 100,500 cells
 */
export const datasetExceedingCellLimit = generateLargeDataset(500, 201)

/**
 * Minimal valid dataset (2 rows including header)
 */
export const minimalDataset: string[][] = [
    ['Column1', 'Column2'],
    ['Value1', 'Value2'],
]

/**
 * Survey response dataset for realistic testing
 */
export const surveyDataset: string[][] = [
    ['RespondentID', 'Age', 'Gender', 'Satisfaction', 'WouldRecommend'],
    ['R001', '25', 'Female', 'Very Satisfied', 'Yes'],
    ['R002', '34', 'Male', 'Satisfied', 'Yes'],
    ['R003', '45', 'Female', 'Neutral', 'Maybe'],
    ['R004', '29', 'Male', 'Dissatisfied', 'No'],
    ['R005', '52', 'Female', 'Very Satisfied', 'Yes'],
    ['R006', '38', 'Male', 'Satisfied', 'Yes'],
    ['R007', '41', 'Female', 'Neutral', 'Maybe'],
]
