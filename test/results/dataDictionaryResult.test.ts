import { describe, it, expect } from 'vitest'
import { DataDictionaryResult } from '../../src/results/DataDictionaryResult'
import type { components } from '../../src/models'

type DataDictionaryResponse = components['schemas']['DataDictionaryResponse']
type DDIVariable = components['schemas']['DDIVariable']
type DDIValueDomain = components['schemas']['DDIValueDomain']
type DDICategory = components['schemas']['DDICategory']
type DDIQuestionItem = components['schemas']['DDIQuestionItem']
type DDIUniverse = components['schemas']['DDIUniverse']
type DDIConcept = components['schemas']['DDIConcept']
type DDIMissingValues = components['schemas']['DDIMissingValues']
type DDIVariableGroup = components['schemas']['DDIVariableGroup']

// Mock DataDictionaryResponse fixture
const createMockResponse = (): DataDictionaryResponse => {
    const variables: DDIVariable[] = [
        {
            variableName: 'age',
            variableLabel: 'Age',
            universeRef: 'u.AllRespondents',
            type: 'numeric',
            scaleLevel: 'ratio',
            isDerived: false,
            sourceColumns: 'age',
            valueDomainRef: 'vd1',
            groupRef: 'group1',
        },
        {
            variableName: 'gender',
            variableLabel: 'Gender',
            universeRef: 'u.AllRespondents',
            type: 'string',
            scaleLevel: 'nominal',
            isDerived: false,
            sourceColumns: 'gender',
            valueDomainRef: 'vd2',
            groupRef: 'group1',
        },
        {
            variableName: 'satisfaction',
            variableLabel: 'Satisfaction',
            universeRef: 'u.AllRespondents',
            type: 'string',
            scaleLevel: 'ordinal',
            isDerived: false,
            sourceColumns: 'satisfaction',
            valueDomainRef: 'vd3',
            groupRef: 'group2',
        },
        {
            variableName: 'joinDate',
            variableLabel: 'Join Date',
            universeRef: 'u.AllRespondents',
            type: 'date',
            scaleLevel: 'interval',
            isDerived: false,
            sourceColumns: 'joinDate',
            valueDomainRef: 'vd4',
        },
        {
            variableName: 'isActive',
            variableLabel: 'Is Active',
            universeRef: 'u.AllRespondents',
            type: 'boolean',
            scaleLevel: 'nominal',
            isDerived: false,
            sourceColumns: 'isActive',
            valueDomainRef: 'vd5',
        },
        {
            variableName: 'comments',
            variableLabel: 'Comments',
            universeRef: 'u.AllRespondents',
            type: 'text',
            scaleLevel: 'nominal',
            isDerived: false,
            sourceColumns: 'comments',
            valueDomainRef: 'vd6',
        },
    ]

    const valueDomains: DDIValueDomain[] = [
        {
            valueDomainId: 'vd1',
            domainType: 'range',
            dataType: 'numeric',
            label: 'Age Range',
            minValue: 18,
            maxValue: 100,
        },
        {
            valueDomainId: 'vd2',
            domainType: 'enumeration',
            dataType: 'string',
            label: 'Gender Categories',
        },
        {
            valueDomainId: 'vd3',
            domainType: 'enumeration',
            dataType: 'string',
            label: 'Satisfaction Levels',
        },
        {
            valueDomainId: 'vd4',
            domainType: 'range',
            dataType: 'date',
            label: 'Date Range',
        },
        {
            valueDomainId: 'vd5',
            domainType: 'enumeration',
            dataType: 'boolean',
            label: 'Boolean Values',
        },
        {
            valueDomainId: 'vd6',
            domainType: 'free',
            dataType: 'text',
            label: 'Free Text',
        },
    ]

    const categories: DDICategory[] = [
        {
            valueDomainId: 'vd2',
            code: 'M',
            label: 'Male',
            order: 1,
            isMissing: false,
        },
        {
            valueDomainId: 'vd2',
            code: 'F',
            label: 'Female',
            order: 2,
            isMissing: false,
        },
        {
            valueDomainId: 'vd3',
            code: 1,
            label: 'Very Dissatisfied',
            order: 1,
            isMissing: false,
        },
        {
            valueDomainId: 'vd3',
            code: 2,
            label: 'Dissatisfied',
            order: 2,
            isMissing: false,
        },
        {
            valueDomainId: 'vd3',
            code: 3,
            label: 'Satisfied',
            order: 3,
            isMissing: false,
        },
    ]

    const questionItems: DDIQuestionItem[] = [
        {
            questionId: 'q1',
            questionText: 'What is your age?',
            responseType: 'numeric',
            responseDomainRef: 'vd1',
        },
        {
            questionId: 'q2',
            questionText: 'What is your gender?',
            responseType: 'single',
            responseDomainRef: 'vd2',
        },
    ]

    const universes: DDIUniverse[] = [
        {
            universeId: 'u1',
            label: 'All Respondents',
            statement: 'All survey respondents',
        },
        {
            universeId: 'u2',
            label: 'Active Users',
            statement: 'Only active users',
        },
    ]

    const concepts: DDIConcept[] = [
        {
            conceptId: 'c1',
            label: 'Demographics',
            description: 'Demographic information',
        },
        {
            conceptId: 'c2',
            label: 'Satisfaction',
            description: 'User satisfaction metrics',
        },
    ]

    const missingValues: DDIMissingValues[] = [
        {
            missingValuesId: 'mv1',
            code: -99,
            label: 'Not Applicable',
        },
        {
            missingValuesId: 'mv2',
            code: -98,
            label: 'Refused',
        },
    ]

    const variableGroups: DDIVariableGroup[] = [
        {
            groupId: 'group1',
            label: 'Demographics',
            groupType: 'module',
        },
        {
            groupId: 'group2',
            label: 'Satisfaction',
            groupType: 'module',
        },
    ]

    return {
        requestId: 'req123',
        profileVersion: '0.1',
        profileName: 'DDI Profile',
        usage: {
            records: [{ feature: 'data-dictionary', quantity: 1 }],
            total: 1,
        },
        codebook: {
            title: 'Customer Survey',
            description: 'Customer satisfaction survey',
            creationDate: '2025-01-15T10:00:00Z',
            language: 'en',
            generationMethod: 'AI-assisted analysis',
            version: '1.0',
            publisher: 'RWAI',
            contact: 'contact@rwai.com',
            qualityMetrics: {
                completeness: 0.95,
                consistency: 0.98,
            },
            variables,
            valueDomains,
            categories,
            questionItems,
            universes,
            concepts,
            missingValues,
            variableGroups,
        },
    }
}

describe('DataDictionaryResult', () => {
    describe('Core accessor properties', () => {
        it('should return codebook', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.codebook).toBe(response.codebook)
        })

        it('should return profileVersion', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.profileVersion).toBe('0.1')
        })

        it('should return profileName', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.profileName).toBe('DDI Profile')
        })

        it('should return requestId', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.requestId).toBe('req123')
        })

        it('should return usage', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.usage).toEqual({
                records: [{ feature: 'data-dictionary', quantity: 1 }],
                total: 1,
            })
        })
    })

    describe('Metadata accessor properties', () => {
        it('should return title', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.title).toBe('Customer Survey')
        })

        it('should return description', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.description).toBe('Customer satisfaction survey')
        })

        it('should return creationDate', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.creationDate).toBe('2025-01-15T10:00:00Z')
        })

        it('should return language', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.language).toBe('en')
        })

        it('should return qualityMetrics', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.qualityMetrics).toEqual({
                completeness: 0.95,
                consistency: 0.98,
            })
        })
    })

    describe('Variable accessor methods', () => {
        it('should return all variables', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const variables = result.getVariables()
            expect(variables).toHaveLength(6)
            expect(variables[0]?.variableName).toBe('age')
        })

        it('should return empty array when no variables', () => {
            const response = createMockResponse()
            response.codebook.variables = []
            const result = new DataDictionaryResult(response)
            expect(result.getVariables()).toEqual([])
        })

        it('should get variable by name', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const variable = result.getVariableByName('gender')
            expect(variable).toBeDefined()
            expect(variable?.variableName).toBe('gender')
            expect(variable?.variableLabel).toBe('Gender')
        })

        it('should return undefined for non-existent variable name', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.getVariableByName('nonexistent')).toBeUndefined()
        })

        it('should get variables by type', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)

            const numericVars = result.getVariablesByType('numeric')
            expect(numericVars).toHaveLength(1)
            expect(numericVars[0]?.variableName).toBe('age')

            const stringVars = result.getVariablesByType('string')
            expect(stringVars).toHaveLength(2)
            expect(stringVars.map(v => v.variableName)).toEqual(['gender', 'satisfaction'])

            const dateVars = result.getVariablesByType('date')
            expect(dateVars).toHaveLength(1)

            const booleanVars = result.getVariablesByType('boolean')
            expect(booleanVars).toHaveLength(1)

            const textVars = result.getVariablesByType('text')
            expect(textVars).toHaveLength(1)
        })

        it('should get variables by scale level', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)

            const nominalVars = result.getVariablesByScaleLevel('nominal')
            expect(nominalVars).toHaveLength(3)

            const ordinalVars = result.getVariablesByScaleLevel('ordinal')
            expect(ordinalVars).toHaveLength(1)
            expect(ordinalVars[0]?.variableName).toBe('satisfaction')

            const intervalVars = result.getVariablesByScaleLevel('interval')
            expect(intervalVars).toHaveLength(1)

            const ratioVars = result.getVariablesByScaleLevel('ratio')
            expect(ratioVars).toHaveLength(1)
            expect(ratioVars[0]?.variableName).toBe('age')
        })

        it('should get variables by group', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)

            const group1Vars = result.getVariablesByGroup('group1')
            expect(group1Vars).toHaveLength(2)
            expect(group1Vars.map(v => v.variableName)).toEqual(['age', 'gender'])

            const group2Vars = result.getVariablesByGroup('group2')
            expect(group2Vars).toHaveLength(1)
            expect(group2Vars[0]?.variableName).toBe('satisfaction')
        })
    })

    describe('Value domain and category methods', () => {
        it('should return all value domains', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const domains = result.getValueDomains()
            expect(domains).toHaveLength(6)
            expect(domains[0]?.valueDomainId).toBe('vd1')
        })

        it('should return empty array when no value domains', () => {
            const response = createMockResponse()
            response.codebook.valueDomains = undefined
            const result = new DataDictionaryResult(response)
            expect(result.getValueDomains()).toEqual([])
        })

        it('should get value domain by id', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const domain = result.getValueDomainById('vd2')
            expect(domain).toBeDefined()
            expect(domain?.label).toBe('Gender Categories')
            expect(domain?.domainType).toBe('enumeration')
        })

        it('should return undefined for non-existent value domain id', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.getValueDomainById('nonexistent')).toBeUndefined()
        })

        it('should get value domains by type', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)

            const rangeDomains = result.getValueDomainsByType('range')
            expect(rangeDomains).toHaveLength(2)
            expect(rangeDomains[0]?.valueDomainId).toBe('vd1')

            const enumeratedDomains = result.getValueDomainsByType('enumeration')
            expect(enumeratedDomains).toHaveLength(3)

            const freeDomains = result.getValueDomainsByType('free')
            expect(freeDomains).toHaveLength(1)
        })

        it('should return all categories', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const categories = result.getCategories()
            expect(categories).toHaveLength(5)
        })

        it('should return empty array when no categories', () => {
            const response = createMockResponse()
            response.codebook.categories = undefined
            const result = new DataDictionaryResult(response)
            expect(result.getCategories()).toEqual([])
        })

        it('should get categories for domain sorted by order', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)

            const genderCategories = result.getCategoriesForDomain('vd2')
            expect(genderCategories).toHaveLength(2)
            expect(genderCategories[0]?.code).toBe('M')
            expect(genderCategories[1]?.code).toBe('F')

            const satisfactionCategories = result.getCategoriesForDomain('vd3')
            expect(satisfactionCategories).toHaveLength(3)
            expect(satisfactionCategories[0]?.label).toBe('Very Dissatisfied')
            expect(satisfactionCategories[1]?.label).toBe('Dissatisfied')
            expect(satisfactionCategories[2]?.label).toBe('Satisfied')
        })

        it('should get category by code', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)

            const maleCategory = result.getCategoryByCode('vd2', 'M')
            expect(maleCategory).toBeDefined()
            expect(maleCategory?.label).toBe('Male')

            const satisfiedCategory = result.getCategoryByCode('vd3', 3)
            expect(satisfiedCategory).toBeDefined()
            expect(satisfiedCategory?.label).toBe('Satisfied')
        })

        it('should return undefined for non-existent category code', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            expect(result.getCategoryByCode('vd2', 'X')).toBeUndefined()
        })
    })

    describe('DDI component accessor methods', () => {
        it('should return all question items', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const questions = result.getQuestionItems()
            expect(questions).toHaveLength(2)
            expect(questions[0]?.questionText).toBe('What is your age?')
        })

        it('should return empty array when no question items', () => {
            const response = createMockResponse()
            response.codebook.questionItems = undefined
            const result = new DataDictionaryResult(response)
            expect(result.getQuestionItems()).toEqual([])
        })

        it('should get question by id', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const question = result.getQuestionById('q2')
            expect(question).toBeDefined()
            expect(question?.questionText).toBe('What is your gender?')
            expect(question?.responseDomainRef).toBe('vd2')
        })

        it('should return all universes', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const universes = result.getUniverses()
            expect(universes).toHaveLength(2)
            expect(universes[0]?.label).toBe('All Respondents')
        })

        it('should return empty array when no universes', () => {
            const response = createMockResponse()
            response.codebook.universes = undefined
            const result = new DataDictionaryResult(response)
            expect(result.getUniverses()).toEqual([])
        })

        it('should get universe by id', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const universe = result.getUniverseById('u2')
            expect(universe).toBeDefined()
            expect(universe?.label).toBe('Active Users')
        })

        it('should return all concepts', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const concepts = result.getConcepts()
            expect(concepts).toHaveLength(2)
            expect(concepts[0]?.label).toBe('Demographics')
        })

        it('should return empty array when no concepts', () => {
            const response = createMockResponse()
            response.codebook.concepts = undefined
            const result = new DataDictionaryResult(response)
            expect(result.getConcepts()).toEqual([])
        })

        it('should get concept by id', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const concept = result.getConceptById('c2')
            expect(concept).toBeDefined()
            expect(concept?.label).toBe('Satisfaction')
        })

        it('should return all missing values', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const missingValues = result.getMissingValues()
            expect(missingValues).toHaveLength(2)
            expect(missingValues[0]?.label).toBe('Not Applicable')
        })

        it('should return empty array when no missing values', () => {
            const response = createMockResponse()
            response.codebook.missingValues = undefined
            const result = new DataDictionaryResult(response)
            expect(result.getMissingValues()).toEqual([])
        })

        it('should get missing values by id', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const mv = result.getMissingValuesById('mv2')
            expect(mv).toBeDefined()
            expect(mv?.label).toBe('Refused')
            expect(mv?.code).toBe(-98)
        })

        it('should return all variable groups', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const groups = result.getVariableGroups()
            expect(groups).toHaveLength(2)
            expect(groups[0]?.label).toBe('Demographics')
        })

        it('should return empty array when no variable groups', () => {
            const response = createMockResponse()
            response.codebook.variableGroups = undefined
            const result = new DataDictionaryResult(response)
            expect(result.getVariableGroups()).toEqual([])
        })

        it('should get variable group by id', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const group = result.getVariableGroupById('group2')
            expect(group).toBeDefined()
            expect(group?.label).toBe('Satisfaction')
        })

        it('should get variable groups by type', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)

            const moduleGroups = result.getVariableGroupsByType('module')
            expect(moduleGroups).toHaveLength(2)
            expect(moduleGroups[0]?.groupId).toBe('group1')
            expect(moduleGroups[1]?.groupId).toBe('group2')
        })
    })

    describe('Export methods', () => {
        it('should export to JSON', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const json = result.toJSON()
            expect(json).toBe(response)
        })

        it('should get codebook', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const codebook = result.getCodebook()
            expect(codebook).toBe(response.codebook)
            expect(codebook.title).toBe('Customer Survey')
        })

        it('should get metadata', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const metadata = result.getMetadata()
            expect(metadata).toEqual({
                title: 'Customer Survey',
                description: 'Customer satisfaction survey',
                creationDate: '2025-01-15T10:00:00Z',
                language: 'en',
                version: '1.0',
                publisher: 'RWAI',
                contact: 'contact@rwai.com',
            })
        })
    })

    describe('getSummary method', () => {
        it('should return comprehensive summary', () => {
            const response = createMockResponse()
            const result = new DataDictionaryResult(response)
            const summary = result.getSummary()

            expect(summary.title).toBe('Customer Survey')
            expect(summary.description).toBe('Customer satisfaction survey')
            expect(summary.totalVariables).toBe(6)
            expect(summary.totalValueDomains).toBe(6)
            expect(summary.totalCategories).toBe(5)
            expect(summary.qualityMetrics).toEqual({
                completeness: 0.95,
                consistency: 0.98,
            })
            expect(summary.variablesByType).toEqual({
                string: 2,
                numeric: 1,
                date: 1,
                boolean: 1,
                text: 1,
            })
            expect(summary.variablesByScale).toEqual({
                nominal: 3,
                ordinal: 1,
                interval: 1,
                ratio: 1,
            })
        })

        it('should handle empty codebook', () => {
            const response = createMockResponse()
            response.codebook.variables = []
            response.codebook.valueDomains = []
            response.codebook.categories = []
            const result = new DataDictionaryResult(response)
            const summary = result.getSummary()

            expect(summary.totalVariables).toBe(0)
            expect(summary.totalValueDomains).toBe(0)
            expect(summary.totalCategories).toBe(0)
            expect(summary.variablesByType).toEqual({
                string: 0,
                numeric: 0,
                date: 0,
                boolean: 0,
                text: 0,
            })
        })
    })
})
