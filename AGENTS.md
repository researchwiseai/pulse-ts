Use bun for package management Use vitest for testing. IF the integration tests are skipping, then
you do not have the required environment variables set. That is ok, just make it clear to the user
that they have been skipped.

To run tests:

```bash
bun run test
```

To run tests with coverage:

```bash
bun run test -- --coverage
```

To lint the code:

```bash
bun run lint
```

To format the code:

```bash
bun run fmt
```

To build the project:

```bash
bun run build
```

To perform a type check:

```bash
bun run typecheck
```

To generate the models from the OpenAPI spec:

```bash
bun run generate
```

To generate the documentation site:

```bash
bun run docs
```

We use GitHub Actions for CI/CD. We are strict on code quality, test coverage, styling and
documentation. Please ensure that all of the above commands pass before submitting a pull request.
The CI/CD pipeline will run these commands automatically, but it is best to catch any issues before
submitting the pull request.

We are adopted by a lot of data sensitive companies with strict security policies. Therefore, we
adhere to enterprise-grade security practices. And a secure software development lifecycle.
