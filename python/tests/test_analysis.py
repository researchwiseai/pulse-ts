"""Tests for Analyzer and built-in processes."""

import pandas as pd
import pytest
import os

# from pydantic import BaseModel  # Unused import removed

from pulse.analysis.analyzer import Analyzer, AnalysisResult
from pulse.analysis.processes import (
    ThemeGeneration,
    SentimentProcess,
    ThemeAllocation,
)
from pulse.auth import ClientCredentialsAuth
from pulse.core.client import CoreClient
from pulse.core.models import SentimentResult, Theme

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
def test_analyzer_no_processes():
    client = CoreClient(
        base_url="https://dev.core.researchwiseai.com/pulse/v1", auth=auth
    )
    az = Analyzer(dataset=reviews, processes=[], client=client)
    res = az.run()
    assert isinstance(res, AnalysisResult)
    with pytest.raises(AttributeError):
        _ = res.theme_generation


@pytest.mark.vcr()
def test_theme_generation_process():
    client = CoreClient(
        base_url="https://dev.core.researchwiseai.com/pulse/v1", auth=auth
    )
    proc = ThemeGeneration(min_themes=2, max_themes=3)
    az = Analyzer(dataset=reviews, processes=[proc], fast=True, client=client)
    res = az.run()

    # result attribute name matches process id
    tg = res.theme_generation
    from pulse.analysis.results import ThemeGenerationResult

    assert isinstance(tg, ThemeGenerationResult)

    # Validate there are 2 or 3 themes
    assert len(tg.themes) in [2, 3]
    # Validate the themes are lists of Theme
    assert all(isinstance(theme, Theme) for theme in tg.themes)


@pytest.mark.vcr()
def test_sentiment_process():
    client = CoreClient(
        base_url="https://dev.core.researchwiseai.com/pulse/v1", auth=auth
    )
    proc = SentimentProcess(fast=True)
    az = Analyzer(dataset=reviews, processes=[proc], client=client)
    res = az.run()

    sent = res.sentiment
    from pulse.analysis.results import SentimentResult as AnalysisSentimentResult

    assert isinstance(sent, AnalysisSentimentResult)

    assert len(sent.sentiments) == len(reviews)
    assert all(isinstance(sentiment, SentimentResult) for sentiment in sent.sentiments)
    assert all(isinstance(sentiment.sentiment, str) for sentiment in sent.sentiments)
    assert all(isinstance(sentiment.confidence, float) for sentiment in sent.sentiments)

    # assert that to_dataframe() returns a DataFrame
    df = sent.to_dataframe()
    assert isinstance(df, pd.DataFrame)
    assert len(df) == len(reviews)
    assert "text" in df.columns
    assert "sentiment" in df.columns
    assert "confidence" in df.columns


@pytest.mark.vcr()
def test_theme_allocation_with_static_themes():
    client = CoreClient(
        base_url="https://dev.core.researchwiseai.com/pulse/v1", auth=auth
    )
    static_themes = ["Service", "Atmosphere", "Amenities"]
    proc = ThemeAllocation(themes=static_themes, single_label=True, threshold=0.3)
    az = Analyzer(dataset=reviews, processes=[proc], fast=True, client=client)
    res = az.run()

    ta = res.theme_allocation
    from pulse.analysis.results import ThemeAllocationResult

    assert isinstance(ta, ThemeAllocationResult)

    # assign_single should return a Series of length equal to input texts
    single = ta.assign_single()
    assert isinstance(single, pd.Series)
    assert len(single) == len(reviews)
    # all assigned themes should be either one of the static themes or None
    assigned = set(single.dropna().unique())
    assert assigned.issubset(set(static_themes))


@pytest.mark.vcr()
def test_theme_allocation_with_generator():
    client = CoreClient(
        base_url="https://dev.core.researchwiseai.com/pulse/v1", auth=auth
    )
    gen = ThemeGeneration(min_themes=2, max_themes=3)
    alloc = ThemeAllocation(single_label=False, threshold=0.5)
    az = Analyzer(dataset=reviews, processes=[gen, alloc], fast=True, client=client)
    res = az.run()

    tg = res.theme_generation
    ta = res.theme_allocation
    from pulse.analysis.results import ThemeAllocationResult

    assert isinstance(ta, ThemeAllocationResult)

    # themes used for allocation should match those from generation
    assert hasattr(ta, "_themes")
    assert len(ta._themes) == len(tg.themes)

    # assign_multi should return top-k themes per text
    multi = ta.assign_multi(k=2)
    assert isinstance(multi, pd.DataFrame)
    assert multi.shape == (len(reviews), 2)


@pytest.mark.vcr()
def test_theme_allocation_implicit_generation():
    client = CoreClient(
        base_url="https://dev.core.researchwiseai.com/pulse/v1", auth=auth
    )
    alloc = ThemeAllocation()
    az = Analyzer(dataset=reviews, processes=[alloc], fast=True, client=client)
    res = az.run()

    # ThemeGeneration should be implicitly run
    tg = res.theme_generation
    from pulse.analysis.results import ThemeGenerationResult

    assert isinstance(tg, ThemeGenerationResult)

    ta = res.theme_allocation
    from pulse.analysis.results import ThemeAllocationResult

    assert isinstance(ta, ThemeAllocationResult)
    # ensure allocation themes come from generation
    assert hasattr(ta, "_themes")
    assert len(ta._themes) == len(tg.themes)
