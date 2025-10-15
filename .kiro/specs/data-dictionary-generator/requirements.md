# Requirements Document

## Introduction

The RWAI Pulse API has introduced a new data dictionary generation capability that analyzes 2D
arrays of tabular data and produces comprehensive DDI (Data Documentation Initiative) Codebook
documentation in JSON format. This feature uses AI to intelligently analyze data patterns, infer
variable types, detect value ranges, and generate meaningful metadata descriptions conforming to DDI
standards.

This requirement document outlines the integration of this new data dictionary generation feature
into the @rwai/pulse TypeScript client library, following the existing patterns and architecture
used for other API endpoints.

## Requirements

### Requirement 1: Core API Client Method

**User Story:** As a developer using the @rwai/pulse library, I want to call a method to generate
data dictionaries from 2D data arrays, so that I can obtain DDI Codebook documentation for my
datasets.

#### Acceptance Criteria

1. WHEN the developer imports the CoreClient THEN they SHALL have access to a
   `generateDataDictionary` method
2. WHEN the developer calls `generateDataDictionary` with valid 2D array data THEN the system SHALL
   send a POST request to `/data-dictionary` endpoint
3. WHEN the request is successful THEN the system SHALL return a job_id for asynchronous processing
4. IF the developer attempts to use fast mode (fast=true) THEN the system SHALL throw a validation
   error indicating only asynchronous mode is supported
5. WHEN the developer provides optional metadata (title, description, context, language) THEN the
   system SHALL include these in the request options
6. WHEN the data exceeds limits (50,000 rows, 1,000 columns, or 100,000 total cells) THEN the system
   SHALL throw a validation error

### Requirement 2: Type Definitions and Schema

**User Story:** As a TypeScript developer, I want full type safety when working with data dictionary
generation, so that I can catch errors at compile time and have IDE autocomplete support.

#### Acceptance Criteria

1. WHEN the developer uses the data dictionary feature THEN they SHALL have TypeScript types for
   `DataDictionaryRequest` and `DataDictionaryResponse`
2. WHEN the developer constructs a request THEN they SHALL have types for all DDI schema components
   (DDIVariable, DDIValueDomain, DDICategory, etc.)
3. WHEN the developer accesses response data THEN they SHALL have properly typed access to all
   codebook properties
4. WHEN types are generated from OpenAPI spec THEN they SHALL match the DDI Profile v0.1 schema
   structure
5. WHEN the developer uses optional parameters THEN the type system SHALL enforce correct property
   types and constraints

### Requirement 3: Job Polling Integration

**User Story:** As a developer, I want to poll for data dictionary job completion using the existing
job monitoring system, so that I can retrieve the generated DDI Codebook when processing is
complete.

#### Acceptance Criteria

1. WHEN a data dictionary job is created THEN the system SHALL return a job_id that can be used with
   the existing Job class
2. WHEN the developer polls the job status THEN they SHALL receive updates on processing progress
3. WHEN the job completes successfully THEN the system SHALL return a `DataDictionaryResponse` with
   the full DDI Codebook
4. WHEN the job fails THEN the system SHALL provide appropriate error information
5. WHEN using the Job.monitor() method THEN callbacks SHALL receive typed `DataDictionaryResponse`
   results

### Requirement 4: High-Level Process Class

**User Story:** As a developer, I want a Process class for data dictionary generation that
integrates with the existing workflow system, so that I can compose data dictionary generation with
other analysis steps.

#### Acceptance Criteria

1. WHEN the developer imports Processes THEN they SHALL have access to a `GenerateDataDictionary`
   process class
2. WHEN the process is executed THEN it SHALL accept 2D array data and optional metadata parameters
3. WHEN the process completes THEN it SHALL return a result object with helper methods for accessing
   DDI components
4. WHEN the process is used in a Workflow THEN it SHALL properly handle dependencies and data flow
5. WHEN the process is used with the Analyzer THEN it SHALL integrate seamlessly with other
   processes

### Requirement 5: Result Wrapper Class

**User Story:** As a developer, I want a result wrapper class for data dictionary responses, so that
I can easily access and manipulate DDI Codebook data with convenient helper methods.

#### Acceptance Criteria

1. WHEN a data dictionary job completes THEN the system SHALL return a `DataDictionaryResult`
   instance
2. WHEN the developer accesses variables THEN they SHALL have methods like `getVariables()`,
   `getVariableByName(name)`, `getVariablesByType(type)`
3. WHEN the developer accesses value domains THEN they SHALL have methods like `getValueDomains()`,
   `getValueDomainById(id)`, `getCategoriesForDomain(id)`
4. WHEN the developer accesses quality metrics THEN they SHALL have convenient accessor methods
5. WHEN the developer needs to export data THEN they SHALL have methods like `toJSON()`,
   `getCodebook()`, `getMetadata()`
6. WHEN the developer filters or searches THEN they SHALL have methods for common operations on DDI
   components

### Requirement 6: Starter Helper Function

**User Story:** As a developer who wants a simple API, I want a starter helper function for data
dictionary generation, so that I can quickly generate DDI Codebooks without understanding the full
Process architecture.

#### Acceptance Criteria

1. WHEN the developer imports starters THEN they SHALL have access to a `generateDataDictionary`
   helper function
2. WHEN the helper is called with 2D array data THEN it SHALL handle job creation and polling
   automatically
3. WHEN the helper is called with optional metadata THEN it SHALL pass these options to the API
4. WHEN the helper is called with monitor callbacks THEN it SHALL provide progress updates during
   processing
5. WHEN the job completes THEN the helper SHALL return a `DataDictionaryResult` instance
6. WHEN an error occurs THEN the helper SHALL throw appropriate typed errors

### Requirement 7: Documentation and Examples

**User Story:** As a developer learning the library, I want clear documentation and examples for
data dictionary generation, so that I can quickly understand how to use this feature.

#### Acceptance Criteria

1. WHEN the developer views API documentation THEN they SHALL see comprehensive docs for all data
   dictionary methods and types
2. WHEN the developer looks for examples THEN they SHALL find code samples showing basic usage
3. WHEN the developer needs advanced usage THEN they SHALL find examples of using Process classes
   and Workflows
4. WHEN the developer needs to understand DDI structure THEN they SHALL find documentation
   explaining the codebook schema
5. WHEN the developer encounters errors THEN they SHALL find documentation on common issues and
   solutions

### Requirement 8: Error Handling

**User Story:** As a developer, I want clear error messages when data dictionary generation fails,
so that I can quickly identify and fix issues.

#### Acceptance Criteria

1. WHEN data validation fails THEN the system SHALL throw a `PulseAPIError` with specific validation
   details
2. WHEN data limits are exceeded THEN the error message SHALL indicate which limit was violated
3. WHEN fast mode is attempted THEN the error SHALL clearly state that only asynchronous mode is
   supported
4. WHEN the API returns an error THEN the system SHALL preserve the original error code and message
5. WHEN network errors occur THEN the system SHALL throw appropriate `NetworkError` or
   `TimeoutError` exceptions

### Requirement 9: DSL Integration

**User Story:** As a developer using the Workflow DSL, I want to include data dictionary generation
in my workflow pipelines, so that I can compose complex analysis sequences that include codebook
generation.

#### Acceptance Criteria

1. WHEN the developer uses the Workflow DSL THEN they SHALL be able to add data dictionary
   generation as a step
2. WHEN data dictionary generation is used in a workflow THEN it SHALL properly handle input data
   from previous steps or external sources
3. WHEN the workflow executes THEN the data dictionary result SHALL be available to subsequent steps
4. WHEN using the fluent API THEN the developer SHALL have type-safe access to data dictionary
   methods
5. WHEN composing workflows THEN data dictionary generation SHALL integrate seamlessly with other
   processes

### Requirement 10: Analyzer Integration

**User Story:** As a developer using the Analyzer class, I want to include data dictionary
generation in my analysis pipelines, so that I can orchestrate multiple processes including codebook
generation.

#### Acceptance Criteria

1. WHEN the developer creates an Analyzer instance THEN they SHALL be able to include
   `GenerateDataDictionary` in the processes array
2. WHEN the Analyzer executes THEN it SHALL properly pass the data to the data dictionary process
3. WHEN the analysis completes THEN the result SHALL be accessible via the process name in the
   results object
4. WHEN using datasets THEN the developer SHALL be able to reference 2D array datasets for data
   dictionary generation
5. WHEN combining processes THEN data dictionary generation SHALL work alongside other processes
   like sentiment analysis or clustering

### Requirement 11: Testing Coverage

**User Story:** As a library maintainer, I want comprehensive test coverage for data dictionary
generation, so that I can ensure reliability and catch regressions.

#### Acceptance Criteria

1. WHEN tests are run THEN they SHALL cover the `generateDataDictionary` client method with various
   input scenarios
2. WHEN tests are run THEN they SHALL verify proper type generation from OpenAPI schema
3. WHEN tests are run THEN they SHALL test the `GenerateDataDictionary` process class
4. WHEN tests are run THEN they SHALL test the `DataDictionaryResult` wrapper class methods
5. WHEN tests are run THEN they SHALL test the starter helper function
6. WHEN tests are run THEN they SHALL test DSL integration with Workflow class
7. WHEN tests are run THEN they SHALL test Analyzer integration with multiple processes
8. WHEN tests are run THEN they SHALL use Polly.js recordings for deterministic API interaction
   testing
9. WHEN tests are run THEN they SHALL verify error handling for all failure scenarios
10. WHEN tests are run THEN they SHALL achieve similar coverage levels as existing features
