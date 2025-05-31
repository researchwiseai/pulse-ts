import os
from pathlib import Path
import pytest

# Load environment variables from .env in project root if present
env_path = Path(__file__).parent.parent / ".env"
print(f"Loading env vars from: {env_path}")
if env_path.exists():
    print(f"Found env file: {env_path}")
    print(f"Contents: {env_path.read_text().splitlines()}")
    for raw_line in env_path.read_text().splitlines():
        print(f"Loading env var: {raw_line}")
        line = raw_line.strip()
        # skip comments and empty lines
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        # strip possible surrounding quotes
        val = val.strip().strip('"').strip("'")
        # do not override existing environment variables
        if key in os.environ:
            print(f"Skipping existing env var: {key}")
            continue

        print(f"Setting env var: {key}={val}")
        os.environ.setdefault(key, val)


@pytest.fixture(scope="session")
def vcr_config():
    """
    Configure pytest-vcr to ignore request body when matching cassettes,
    avoiding mismatches due to client_secret values.
    """
    return {
        # Only match on HTTP method, scheme, host, port, path, and query parameters
        "match_on": ["method", "scheme", "host", "port", "path", "query"],
    }
