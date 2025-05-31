"""Tests for our quick starter helpers"""

import os
import pandas as pd
import pytest

from pulse.analysis.results import ClusterResult
from pulse.auth import ClientCredentialsAuth
from pulse.config import DEV_BASE_URL
from pulse.core.client import CoreClient
from pulse.starters import theme_allocation

reviews = [
    "Had a blast! The rollercoasters were thrilling and the staff were friendly.",
    "A bit pricey, but the rides were worth it. Great family fun!",
    "Long lines, but the shows were entertaining. Would come again.",
    "Disappointing. Many rides were closed, and the food was overpriced.",
    "Awesome day out! The kids loved the water park.",
    "The park was clean and well-maintained. A pleasant experience.",
    "Too crowded, making it difficult to enjoy the rides.",
    "Excellent customer service. The staff went above and beyond.",
    "A magical experience! Highly recommend for all ages.",
    "Not impressed with the variety of rides. Could be better.",
    "The atmosphere was fantastic. Great music and decorations.",
    "Spent too much time waiting in line. Needs better queue management.",
    "My kids had a wonderful time! We'll definitely return.",
    "The food options were limited and not very tasty.",
    "A truly unforgettable day at the park. Highly recommended!",
    "The park was clean and well-kept, but the rides were too short.",
    "Great value for the money.  Lots of fun for the whole family.",
    "We had a mixed experience. Some rides were great, others were underwhelming.",
    "The staff were helpful and courteous.  The park was well-organized.",
    "The park is beautiful, but the ticket prices are exorbitant.",
]


@pytest.fixture(autouse=True)
def disable_sleep(monkeypatch, request):
    """Disable sleep during playback (cassette exists), skip when recording."""
    import time
    import os

    # Determine cassette path for this test
    cassette_dir = os.path.join(os.path.dirname(request.node.fspath), "cassettes")
    cassette_file = os.path.join(cassette_dir, f"{request.node.name}.yaml")
    # If cassette not present, assume recording mode and allow real sleep
    if not os.path.exists(cassette_file):
        return
    # In playback mode, disable real sleep to speed up tests
    monkeypatch.setattr(time, "sleep", lambda x: None)


base_url = DEV_BASE_URL

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
client = CoreClient(auth=auth, base_url=base_url)


@pytest.mark.vcr()
def test_theme_allocation_implicit_generation():
    resp = theme_allocation(reviews, client=client)

    series = resp.assign_single()
    assert len(series) == len(reviews)
    assert isinstance(series, pd.Series)

    multi = resp.assign_multi()
    assert len(multi) == len(reviews)
    assert isinstance(multi, pd.DataFrame)

    heatmap = resp.heatmap()
    assert heatmap is not None

    df = resp.to_dataframe()
    assert isinstance(df, pd.DataFrame)


@pytest.mark.vcr()
def test_theme_allocation_implicit_generation_big():
    fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
    file_path = os.path.join(fixtures_dir, "disney-10k.txt")
    with open(file_path, "r", encoding="utf-8") as f:
        comments = f.read().splitlines()

    resp = theme_allocation(comments, client=client)

    series = resp.assign_single()
    assert len(series) == len(comments)
    assert isinstance(series, pd.Series)

    multi = resp.assign_multi()
    assert len(multi) == len(comments)
    assert isinstance(multi, pd.DataFrame)

    heatmap = resp.heatmap()
    assert heatmap is not None

    df = resp.to_dataframe()
    assert isinstance(df, pd.DataFrame)


@pytest.mark.vcr()
def test_theme_allocation_with_themes():
    resp = theme_allocation(
        reviews, themes=["Food & Drink", "Rides", "Staff"], client=client
    )

    series = resp.assign_single()
    assert len(series) == len(reviews)
    assert isinstance(series, pd.Series)

    multi = resp.assign_multi()
    assert len(multi) == len(reviews)
    assert isinstance(multi, pd.DataFrame)

    heatmap = resp.heatmap()
    assert heatmap is not None

    df = resp.to_dataframe()
    assert isinstance(df, pd.DataFrame)


@pytest.mark.vcr()
def test_cluster_analysis():
    from pulse.starters import cluster_analysis

    resp = cluster_analysis(reviews, client=client)

    assert isinstance(resp, ClusterResult)
