# Pulse Python Client Architecture

This document describes the main architectural pieces of the Python client used
to interact with the Pulse API.  It is intended to guide developers who are
implementing Pulse clients in other languages so that they can follow a similar
structure while still providing an idiomatic experience in their own ecosystem.

The client is divided into a few layers:

1. **Core API Layer** – thin wrappers around the REST endpoints.
2. **Analysis Layer** – higher level workflow primitives built on top of the core layer.
3. **DSL / Workflow Builder** – a fluent API for composing complex pipelines.
4. **Authentication & Configuration** – helpers for OAuth2 and environment setup.

## 1. Core API Layer

Located under [`pulse/core`](pulse/core), the `CoreClient` class is responsible
for talking to the REST service.  Key aspects:

- **HTTPX Client** – All HTTP communication uses [`httpx`](https://www.python-httpx.org/).
  Requests are built using a small subclass called [`GzipClient`](pulse/core/gzip_client.py)
  that transparently compresses request bodies when present.
- **Authentication** – OAuth2 flows are encapsulated in [`auth.py`](pulse/auth.py).
  `CoreClient` accepts an `httpx.Auth` instance, allowing the caller to use either
  client credentials or PKCE based authentication.
- **Job Handling** – Some API calls are asynchronous.  The [`Job`](pulse/core/jobs.py)
  model polls `/jobs` until completion and returns the final result.
- **Batching Utilities** – Large similarity requests are automatically split and
  stitched back together via helper functions in [`batching.py`](pulse/core/batching.py).
- **Response Models** – Pydantic models under [`pulse/core/models.py`](pulse/core/models.py)
  (generated from the OpenAPI spec) provide typed responses.  Other languages can
  use similar data classes or structs.

Calls in this layer are synchronous and map closely to the REST operations:
`create_embeddings`, `compare_similarity`, `generate_themes`, `analyze_sentiment`,
and `extract_elements`.  Error handling is unified through `PulseAPIError`.

## 2. Analysis Layer

The analysis layer in [`pulse/analysis`](pulse/analysis) defines reusable
**process** objects.  Each process describes a single operation, e.g.
[`SentimentProcess`](pulse/analysis/processes.py) or
[`ThemeGeneration`](pulse/analysis/processes.py).  Processes share a small
`Protocol` with an `id`, optional `depends_on` list, and a `run(ctx)` method.

The [`Analyzer`](pulse/analysis/analyzer.py) orchestrates a sequence of processes:

- Accepts a dataset (list or pandas `Series`).
- Resolves dependencies between processes automatically.
- Provides simple on‑disk caching using [`diskcache`](https://grantjenks.com/docs/diskcache/).
- Wraps raw responses into result helper classes (see
  [`results.py`](pulse/analysis/results.py)) that expose convenience methods for
  pandas conversion, summaries, and plotting.

These result helpers are designed with pandas in mind.  Each class provides
`to_dataframe()` or similar accessors returning `pandas.DataFrame` or
`Series` objects so that analyses slot directly into the broader Python data
ecosystem.  The `Analyzer` itself accepts the dataset as either a simple list
or a pandas `Series`, enabling seamless use with common data-loading patterns.

This separation keeps the core layer minimal while providing a richer, more
opinionated experience at a higher level.

## 3. DSL / Workflow Builder

Complex analysis often requires branching, custom data sources, and monitoring.
The [`Workflow`](pulse/dsl.py) class offers a fluent interface for building such
pipelines.  Developers can register named sources, chain processes, monitor
lifecycle events, and retrieve a simple DAG representation via `graph()`.

Workflows can execute in two modes:

- **Linear mode** – If only a dataset is provided, execution delegates to the
  `Analyzer` for sequential processing.
- **DSL mode** – When named sources are registered, `_run_dsl()` handles the DAG
  execution, wiring outputs of one process as inputs to another.

The DSL also supports loading a pipeline definition from a JSON or YAML file
via `Workflow.from_file`, enabling configuration driven pipelines.

## 4. Authentication & Configuration

Authentication helpers support both interactive (Authorization Code + PKCE) and
non‑interactive (Client Credentials) OAuth2 flows.  Configuration defaults (base
URL, timeouts, etc.) live in [`config.py`](pulse/config.py).  Environment
variables such as `PULSE_CLIENT_ID` or `PULSE_CLIENT_SECRET` are respected, so
other language implementations should provide a similar convenience layer.

## 5. Quick Starter Functions

For the most common workflows the package exposes simple wrapper functions in
[`pulse/starters.py`](pulse/starters.py).  These helpers abstract away the
construction of an `Analyzer` and handle reading input from lists of strings or
from files (`.txt`, `.csv`, `.tsv`, `.xls`, `.xlsx`).  The starters return the
same result objects as the full analysis layer so callers can immediately obtain
pandas `Series` or `DataFrame` representations via the methods described above.
Developers of other language clients can provide similar convenience helpers
tailored to their ecosystem's standard data formats.

## Recommendations for Other Languages

While each language ecosystem differs, the following principles should help
maintain a consistent "Pulse" flavour across implementations:

- **Layered Design** – Expose a low‑level client that mirrors the REST API
  closely, then build higher‑level abstractions (processes, workflows) on top.
- **Typed Models** – Use the language's data modelling tools (e.g., data classes,
  structs, or records) to represent API responses.  These can be generated from
  the OpenAPI spec or hand crafted.
- **Asynchronous Jobs** – Provide a simple job poller similar to `Job.wait()` for
  endpoints that may return a job ID.
- **Composable Processes** – Treat common analysis steps as first class objects
  that can be combined and extended.  Resolve dependencies automatically so that
  users only specify what they need.
- **Convenient Results** – Wrap raw responses with helper methods for common
  tasks (conversion to DataFrame equivalents, plotting, summaries) using the
  target ecosystem's standard libraries.
- **Configuration via Environment** – Read credentials and endpoints from
  environment variables with sensible defaults so the client works in scripts,
  notebooks, and servers alike.
- **Idiomatic Packaging** – Publish the client in a way that feels natural to the
  target community (e.g., a pip package for Python, a gem for Ruby, a crate for
  Rust) while reusing the architectural ideas above.

By following these guidelines, developers can create clients that feel native to
their language but still behave like part of the Pulse family.
