import type { components } from '../models'

type DataDictionaryResponse = components['schemas']['DataDictionaryResponse']
type DDIVariable = components['schemas']['DDIVariable']
type DDIValueDomain = components['schemas']['DDIValueDomain']
type DDICategory = components['schemas']['DDICategory']
type DDIQuestionItem = components['schemas']['DDIQuestionItem']
type DDIUniverse = components['schemas']['DDIUniverse']
type DDIConcept = components['schemas']['DDIConcept']
type DDIMissingValues = components['schemas']['DDIMissingValues']
type DDIVariableGroup = components['schemas']['DDIVariableGroup']

/**
 * Result wrapper for data dictionary generation responses.
 * Provides convenient accessor methods for DDI Codebook components including
 * variables, value domains, categories, and metadata.
 *
 * @example
 * ```typescript
 * const result = await client.generateDataDictionary(data);
 * console.log(result.getVariables());
 * console.log(result.getSummary());
 * ```
 */
export class DataDictionaryResult {
    /**
     * Creates a new DataDictionaryResult instance.
     *
     * @param response - The raw DataDictionaryResponse from the API.
     */
    constructor(private response: DataDictionaryResponse) {}

    /**
     * Gets the complete DDI Codebook object.
     */
    get codebook() {
        return this.response.codebook
    }

    /**
     * Gets the DDI profile version used for this codebook.
     */
    get profileVersion() {
        return this.response.profileVersion
    }

    /**
     * Gets the DDI profile name.
     */
    get profileName() {
        return this.response.profileName
    }

    /**
     * Gets the unique request identifier for this data dictionary generation.
     */
    get requestId() {
        return this.response.requestId
    }

    /**
     * Gets usage statistics for the API request (tokens, processing time, etc.).
     */
    get usage() {
        return this.response.usage
    }

    /**
     * Gets the title of the data dictionary.
     */
    get title() {
        return this.codebook.title
    }

    /**
     * Gets the description of the data dictionary.
     */
    get description() {
        return this.codebook.description
    }

    /**
     * Gets the creation date of the data dictionary.
     */
    get creationDate() {
        return this.codebook.creationDate
    }

    /**
     * Gets the language code of the data dictionary (e.g., 'en', 'es').
     */
    get language() {
        return this.codebook.language
    }

    /**
     * Gets quality metrics for the data dictionary generation.
     */
    get qualityMetrics() {
        return this.codebook.qualityMetrics
    }

    /**
     * Gets all variables defined in the codebook.
     *
     * @returns An array of DDI variable definitions.
     */
    getVariables(): DDIVariable[] {
        return this.codebook.variables ?? []
    }

    /**
     * Finds a variable by its name.
     *
     * @param name - The variable name to search for.
     * @returns The matching variable or undefined if not found.
     */
    getVariableByName(name: string): DDIVariable | undefined {
        return this.getVariables().find(v => v.variableName === name)
    }

    /**
     * Filters variables by their data type.
     *
     * @param type - The variable type to filter by (e.g., 'string', 'numeric', 'date').
     * @returns An array of variables matching the specified type.
     */
    getVariablesByType(type: DDIVariable['type']): DDIVariable[] {
        return this.getVariables().filter(v => v.type === type)
    }

    /**
     * Filters variables by their scale level (measurement level).
     *
     * @param scaleLevel - The scale level to filter by (e.g., 'nominal', 'ordinal', 'interval', 'ratio').
     * @returns An array of variables matching the specified scale level.
     */
    getVariablesByScaleLevel(scaleLevel: DDIVariable['scaleLevel']): DDIVariable[] {
        return this.getVariables().filter(v => v.scaleLevel === scaleLevel)
    }

    /**
     * Filters variables by their group reference.
     *
     * @param groupRef - The group reference identifier to filter by.
     * @returns An array of variables belonging to the specified group.
     */
    getVariablesByGroup(groupRef: string): DDIVariable[] {
        return this.getVariables().filter(v => v.groupRef === groupRef)
    }

    /**
     * Gets all value domains defined in the codebook.
     *
     * @returns An array of DDI value domain definitions.
     */
    getValueDomains(): DDIValueDomain[] {
        return this.codebook.valueDomains ?? []
    }

    /**
     * Finds a value domain by its identifier.
     *
     * @param id - The value domain ID to search for.
     * @returns The matching value domain or undefined if not found.
     */
    getValueDomainById(id: string): DDIValueDomain | undefined {
        return this.getValueDomains().find(vd => vd.valueDomainId === id)
    }

    /**
     * Filters value domains by their domain type.
     *
     * @param domainType - The domain type to filter by (e.g., 'CodeList', 'NumericRange').
     * @returns An array of value domains matching the specified type.
     */
    getValueDomainsByType(domainType: DDIValueDomain['domainType']): DDIValueDomain[] {
        return this.getValueDomains().filter(vd => vd.domainType === domainType)
    }

    /**
     * Gets all categories defined in the codebook.
     *
     * @returns An array of DDI category definitions.
     */
    getCategories(): DDICategory[] {
        return this.codebook.categories ?? []
    }

    /**
     * Gets all categories for a specific value domain, sorted by order.
     *
     * @param valueDomainId - The value domain ID to get categories for.
     * @returns An array of categories belonging to the specified value domain, sorted by order.
     */
    getCategoriesForDomain(valueDomainId: string): DDICategory[] {
        return this.getCategories()
            .filter(c => c.valueDomainId === valueDomainId)
            .sort((a, b) => a.order - b.order)
    }

    /**
     * Finds a category by its code within a specific value domain.
     *
     * @param valueDomainId - The value domain ID to search within.
     * @param code - The category code to search for.
     * @returns The matching category or undefined if not found.
     */
    getCategoryByCode(valueDomainId: string, code: string | number): DDICategory | undefined {
        return this.getCategories().find(c => c.valueDomainId === valueDomainId && c.code === code)
    }

    /**
     * Gets all question items defined in the codebook.
     *
     * @returns An array of DDI question item definitions.
     */
    getQuestionItems(): DDIQuestionItem[] {
        return this.codebook.questionItems ?? []
    }

    /**
     * Finds a question item by its identifier.
     *
     * @param id - The question ID to search for.
     * @returns The matching question item or undefined if not found.
     */
    getQuestionById(id: string): DDIQuestionItem | undefined {
        return this.getQuestionItems().find(q => q.questionId === id)
    }

    /**
     * Gets all universes defined in the codebook.
     *
     * @returns An array of DDI universe definitions.
     */
    getUniverses(): DDIUniverse[] {
        return this.codebook.universes ?? []
    }

    /**
     * Finds a universe by its identifier.
     *
     * @param id - The universe ID to search for.
     * @returns The matching universe or undefined if not found.
     */
    getUniverseById(id: string): DDIUniverse | undefined {
        return this.getUniverses().find(u => u.universeId === id)
    }

    /**
     * Gets all concepts defined in the codebook.
     *
     * @returns An array of DDI concept definitions.
     */
    getConcepts(): DDIConcept[] {
        return this.codebook.concepts ?? []
    }

    /**
     * Finds a concept by its identifier.
     *
     * @param id - The concept ID to search for.
     * @returns The matching concept or undefined if not found.
     */
    getConceptById(id: string): DDIConcept | undefined {
        return this.getConcepts().find(c => c.conceptId === id)
    }

    /**
     * Gets all missing values definitions in the codebook.
     *
     * @returns An array of DDI missing values definitions.
     */
    getMissingValues(): DDIMissingValues[] {
        return this.codebook.missingValues ?? []
    }

    /**
     * Finds a missing values definition by its identifier.
     *
     * @param id - The missing values ID to search for.
     * @returns The matching missing values definition or undefined if not found.
     */
    getMissingValuesById(id: string): DDIMissingValues | undefined {
        return this.getMissingValues().find(mv => mv.missingValuesId === id)
    }

    /**
     * Gets all variable groups defined in the codebook.
     *
     * @returns An array of DDI variable group definitions.
     */
    getVariableGroups(): DDIVariableGroup[] {
        return this.codebook.variableGroups ?? []
    }

    /**
     * Finds a variable group by its identifier.
     *
     * @param id - The group ID to search for.
     * @returns The matching variable group or undefined if not found.
     */
    getVariableGroupById(id: string): DDIVariableGroup | undefined {
        return this.getVariableGroups().find(g => g.groupId === id)
    }

    /**
     * Filters variable groups by their group type.
     *
     * @param groupType - The group type to filter by.
     * @returns An array of variable groups matching the specified type.
     */
    getVariableGroupsByType(groupType: DDIVariableGroup['groupType']): DDIVariableGroup[] {
        return this.getVariableGroups().filter(g => g.groupType === groupType)
    }

    /**
     * Converts the result to a plain JSON object.
     *
     * @returns The raw DataDictionaryResponse object.
     */
    toJSON(): DataDictionaryResponse {
        return this.response
    }

    /**
     * Gets the complete DDI Codebook object.
     *
     * @returns The codebook containing all DDI components.
     */
    getCodebook() {
        return this.codebook
    }

    /**
     * Gets metadata about the data dictionary.
     *
     * @returns An object containing title, description, dates, version, and contact information.
     */
    getMetadata() {
        return {
            title: this.title,
            description: this.description,
            creationDate: this.creationDate,
            language: this.language,
            version: this.codebook.version,
            publisher: this.codebook.publisher,
            contact: this.codebook.contact,
        }
    }

    /**
     * Gets a summary of the data dictionary with aggregated statistics.
     *
     * @returns An object containing counts and breakdowns of variables by type and scale level.
     */
    getSummary() {
        return {
            title: this.title,
            description: this.description,
            totalVariables: this.getVariables().length,
            totalValueDomains: this.getValueDomains().length,
            totalCategories: this.getCategories().length,
            qualityMetrics: this.qualityMetrics,
            variablesByType: {
                string: this.getVariablesByType('string').length,
                numeric: this.getVariablesByType('numeric').length,
                date: this.getVariablesByType('date').length,
                boolean: this.getVariablesByType('boolean').length,
                text: this.getVariablesByType('text').length,
            },
            variablesByScale: {
                nominal: this.getVariablesByScaleLevel('nominal').length,
                ordinal: this.getVariablesByScaleLevel('ordinal').length,
                interval: this.getVariablesByScaleLevel('interval').length,
                ratio: this.getVariablesByScaleLevel('ratio').length,
            },
        }
    }
}
