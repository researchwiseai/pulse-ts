"""End-to-end tests for CoreClient using pytest-vcr.

All HTTP interactions are recorded and replayed; no manual mocks.
"""
import pytest
import os

from pulse.auth import ClientCredentialsAuth
from pulse.core.client import CoreClient
from pulse.core.exceptions import PulseAPIError

pytestmark = pytest.mark.vcr(record_mode="new_episodes")

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


@pytest.fixture(autouse=True)
def disable_sleep(monkeypatch):
    import time

    monkeypatch.setattr(time, "sleep", lambda x: None)


def test_create_embeddings_fast():
    client = CoreClient(base_url=base_url, auth=auth)
    response = client.create_embeddings(["a", "b"], fast=True)

    # Check that the response is a valid EmbeddingResponse object
    assert response is not None
    assert hasattr(response, "embeddings")
    assert hasattr(response, "requestId")

    assert len(response.embeddings) == 2
    assert response.embeddings[0].vector is not None
    assert response.embeddings[1].vector is not None
    assert response.embeddings[0].text is not None
    assert response.embeddings[1].text is not None


def test_compare_similarity_fast():
    client = CoreClient(base_url=base_url, auth=auth)

    response = client.compare_similarity(set=["x", "y"], fast=True, flatten=False)
    # Check that the response is a valid SimilarityResponse object
    assert response is not None
    assert hasattr(response, "requestId")
    assert hasattr(response, "matrix")
    assert hasattr(response, "flattened")
    assert hasattr(response, "scenario")
    assert hasattr(response, "mode")
    assert hasattr(response, "n")

    # requestId should be a string
    assert isinstance(response.requestId, str)
    # similarity should be a list of lists of floats
    assert isinstance(response.similarity, list)
    assert all(isinstance(row, list) for row in response.similarity)
    assert all(isinstance(val, float) for row in response.similarity for val in row)

    # scenario should be either self or cross
    assert response.scenario in ["self", "cross"]
    # mode should be either matrix or flattened
    assert response.mode in ["matrix", "flattened"]
    # n should be an integer
    assert isinstance(response.n, int)


def test_generate_themes_fast():
    client = CoreClient(base_url=base_url, auth=auth)
    response = client.generate_themes(
        ["apple", "orange", "banana", "melon", "goat", "horse", "cow", "pig"],
        min_themes=1,
        max_themes=3,
        fast=True,
    )
    # Check that the response is a valid ThemesResponse object
    assert hasattr(response, "themes")
    assert hasattr(response, "requestId")

    assert len(response.themes) == 2
    assert hasattr(response.themes[0], "shortLabel")
    assert hasattr(response.themes[0], "label")
    assert hasattr(response.themes[0], "description")
    assert hasattr(response.themes[0], "representatives")
    assert hasattr(response.themes[1], "shortLabel")
    assert hasattr(response.themes[1], "label")
    assert hasattr(response.themes[1], "description")
    assert hasattr(response.themes[1], "representatives")


def test_analyze_sentiment_fast():
    client = CoreClient(base_url=base_url, auth=auth)
    response = client.analyze_sentiment(["happy", "sad"], fast=True)
    # Check that the response is a valid SentimentResponse object
    assert hasattr(response, "results")
    assert hasattr(response, "requestId")
    assert len(response.results) == 2
    assert hasattr(response.results[0], "sentiment")
    assert hasattr(response.results[0], "confidence")
    assert hasattr(response.results[1], "sentiment")
    assert hasattr(response.results[1], "confidence")
    assert response.results[0].sentiment in ["positive", "negative", "neutral", "mixed"]
    assert response.results[1].sentiment in ["positive", "negative", "neutral", "mixed"]
    assert isinstance(response.results[0].confidence, float)
    assert isinstance(response.results[1].confidence, float)
    assert 0 <= response.results[0].confidence <= 1
    assert 0 <= response.results[1].confidence <= 1


def test_error_raises():
    client = CoreClient(base_url=base_url, auth=auth)
    with pytest.raises(PulseAPIError):
        client.create_embeddings([False], fast=True)
