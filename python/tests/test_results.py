"""Tests for result helper classes."""

import pandas as pd
import pytest

from pulse.analysis.results import (
    ThemeGenerationResult,
    SentimentResult as AnalysisSentimentResult,
)
from pulse.core.models import ThemesResponse
from pulse.core.models import (
    SentimentResponse as CoreSentimentResponse,
    SentimentResult as CoreSentimentResult,
)
from pydantic import ValidationError


def test_theme_generation_result_to_dataframe():
    # Prepare dummy theme metadata per spec
    from pulse.core.models import Theme

    texts = ["hello", "world", "foo"]
    themeA = Theme(
        shortLabel="A",
        label="Label A",
        description="Desc A",
        representatives=["rA1", "rA2"],
    )
    themeB = Theme(
        shortLabel="B",
        label="Label B",
        description="Desc B",
        representatives=["rB1", "rB2"],
    )
    resp = ThemesResponse(themes=[themeA, themeB], requestId=None)
    result = ThemeGenerationResult(resp, texts)

    assert result.themes[0].shortLabel == "A"
    assert result.themes[1].shortLabel == "B"
    # Check that the themes are lists of Theme
    assert all(isinstance(theme, Theme) for theme in result.themes)

    # Convert theme metadata to DataFrame
    df = result.to_dataframe()
    assert isinstance(df, pd.DataFrame)
    # DataFrame should have one row per theme with metadata columns
    assert list(df["shortLabel"]) == ["A", "B"]
    assert list(df["label"]) == ["Label A", "Label B"]
    assert list(df["description"]) == ["Desc A", "Desc B"]
    assert list(df["representative_1"]) == ["rA1", "rB1"]
    assert list(df["representative_2"]) == ["rA2", "rB2"]


def test_sentiment_result_methods():
    texts = ["I love it", "I hate it", "Meh"]
    # Spec-based sentiment labels
    sentiments = ["positive", "negative", "neutral"]
    # Build core response with CoreSentimentResult
    results = [CoreSentimentResult(sentiment=s, confidence=0.5) for s in sentiments]
    resp = CoreSentimentResponse(results=results, requestId=None)
    result = AnalysisSentimentResult(resp, texts)

    # Check to_dataframe
    df = result.to_dataframe()
    assert isinstance(df, pd.DataFrame)
    assert list(df["text"]) == texts
    assert list(df["sentiment"]) == sentiments
    # Check summary counts
    summary = result.summary()
    assert isinstance(summary, pd.Series)
    # summary should have counts of each label
    counts = dict(summary)
    expected = {s: sentiments.count(s) for s in set(sentiments)}
    assert counts == expected
    # plot_distribution returns an axis
    ax = result.plot_distribution()
    # axis should have bars equal to number of unique sentiments
    assert len(ax.patches) == len(expected)


@pytest.mark.parametrize(
    "invalid, exc",
    [
        (ThemesResponse, ValidationError),
        (CoreSentimentResponse, ValidationError),
    ],
    ids=["ThemesResponse", "SentimentResponse"],
)
def test_result_wrappers_invalid_input(invalid, exc):
    # Passing wrong type or missing args should error
    with pytest.raises(exc):
        # Attempt to create without proper args
        invalid()


def test_theme_allocation_result_methods():
    texts = ["doc1", "doc2", "doc3"]
    themes = ["Alpha", "Beta"]
    assignments = [0, 1, 0]
    similarity = [[0.7, 0.2], [0.3, 0.6], [0.8, 0.6]]
    from pulse.analysis.results import ThemeAllocationResult

    result = ThemeAllocationResult(
        texts,
        themes,
        assignments,
        similarity=similarity,
        single_label=True,
        threshold=0.5,
    )
    # assign_single returns Series
    single = result.assign_single()
    assert list(single.index) == texts
    assert list(single.values) == [themes[i] for i in assignments]
    # assign_multi(k)
    multi = result.assign_multi(k=2)
    assert multi.shape == (len(texts), 2)
    # heatmap plotting
    ax = result.heatmap()
    # bars equal number of themes that appear
    # assignments count: Alpha=2, Beta=1
    # ensure the y-ticks match themes
    x_labels = [t.get_text() for t in ax.get_xticklabels()]
    assert set(x_labels) == set(themes)


def test_theme_allocation_with_similarity():
    # Test assign_single and assign_multi when similarity matrix provided
    texts = ["d1", "d2"]
    themes = ["A", "B", "C"]
    assignments = [0, 1]
    sim = [  # shape 2x3
        [0.1, 0.8, 0.3],
        [0.5, 0.2, 0.7],
    ]
    from pulse.analysis.results import ThemeAllocationResult

    result = ThemeAllocationResult(
        texts, themes, assignments, single_label=True, threshold=0.6, similarity=sim
    )
    # assign_single: values above threshold
    single = result.assign_single()
    assert single.tolist() == ["B", "C"]
    # assign_multi: top-2 themes per text
    multi = result.assign_multi(k=2)
    assert multi["theme_1"].tolist() == ["B", "C"]
    assert multi["theme_2"].tolist() == ["C", "A"]


def test_cluster_result_methods():
    texts = ["a", "b", "c"]
    # simple similarity matrix (identity-like)
    matrix = [[1.0, 0.1, 0.2], [0.1, 1.0, 0.3], [0.2, 0.3, 1.0]]
    from pulse.analysis.results import ClusterResult
    import numpy as np

    result = ClusterResult(matrix, texts)
    # matrix property
    arr = result.matrix
    assert isinstance(arr, np.ndarray)
    assert arr.shape == (3, 3)
    # kmeans labels length
    labels = result.kmeans(n_clusters=2)
    assert isinstance(labels, (list, np.ndarray))
    assert len(labels) == len(texts)
    # dbscan labels length
    labels2 = result.dbscan(eps=0.5, min_samples=1)
    assert len(labels2) == len(texts)
    # scatter plot
    ax = result.plot_scatter()
    # should have as many annotations as texts
    assert len(ax.texts) == len(texts)
    # dendrogram plotting returns an axis with sample labels
    ax2 = result.dendrogram()
    # axis should have xticklabels matching sample names
    xticks = [tick.get_text() for tick in ax2.get_xticklabels()]
    # Remove empty labels
    xticks = [lbl for lbl in xticks if lbl]
    assert set(xticks) == set(texts)
