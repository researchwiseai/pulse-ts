"""End-to-end DSL workflow test with a dummy client to simulate all steps."""

import pytest
import os

from pulse.auth import ClientCredentialsAuth
from pulse.dsl import Workflow
from pulse.core.jobs import Job
from pulse.core.client import CoreClient


@pytest.fixture(autouse=True)
def disable_sleep(monkeypatch):
    import time

    monkeypatch.setattr(time, "sleep", lambda x: None)


base_url = "https://dev.core.researchwiseai.com/pulse/v1"

# Load credentials from environment variables
client_id = os.getenv("PULSE_CLIENT_ID")
client_secret = os.getenv("PULSE_CLIENT_SECRET")
if not client_id or not client_secret:
    pytest.skip("Pulse client credentials not set", allow_module_level=True)
token_url = os.getenv("PULSE_TOKEN_URL", "https://wise-dev.eu.auth0.com/oauth/token")
audience = os.getenv("PULSE_AUDIENCE", base_url)
auth = ClientCredentialsAuth(
    client_id=client_id,
    client_secret=client_secret,
    token_url=token_url,
    audience=audience,
)


@pytest.mark.vcr()
def test_dsl_end_to_end():
    comments = ["everything was very tasty", "it was a little too noisy"]
    existing = ["Food Quality", "Service", "Environment"]
    wf = (
        Workflow()
        .source("comments", comments)
        .source("themes", existing)
        .theme_allocation(inputs="comments", themes_from="themes")
    )
    client = CoreClient(base_url=base_url, auth=auth)
    results = wf.run(client=client)
    # verify results types and not raw Job
    for step in [
        "theme_allocation",
    ]:
        assert hasattr(results, step), f"Missing DSL step: {step}"
        res = getattr(results, step)
        assert not isinstance(res, Job), f"Step {step} returned raw Job"
        # check minimal behavior
        if hasattr(res, "themes"):
            assert isinstance(res.themes, list)
        if hasattr(res, "sentiments"):
            assert isinstance(res.sentiments, list)
