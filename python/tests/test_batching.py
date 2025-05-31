"""Unit tests for pulse.core.batching batching utilities."""
import numpy as np

from pulse.core import batching


class DummyResult:
    """Dummy result object with a .matrix attribute."""

    def __init__(self, matrix: np.ndarray):
        self.matrix = matrix


def test_make_self_chunks_no_split():
    items = list(range(3))
    chunks = batching._make_self_chunks(items)
    assert chunks == [items]


def test_make_self_chunks_split(monkeypatch):
    # Force small limits to trigger splitting
    monkeypatch.setattr(batching, "MAX_ITEMS", 4)
    monkeypatch.setattr(batching, "HALF_CHUNK", 2)
    items = list(range(6))
    chunks = batching._make_self_chunks(items)
    # Expect chunks of size HALF_CHUNK
    assert chunks == [items[0:2], items[2:4], items[4:6]]


def test_make_cross_bodies_combined():
    set_a = list(range(3))
    set_b = list(range(4))
    bodies = batching._make_cross_bodies(set_a, set_b, flatten=True)
    assert len(bodies) == 1
    assert bodies[0] == {"set_a": set_a, "set_b": set_b, "flatten": True}


def test_make_cross_bodies_small_a(monkeypatch):
    # Test branch when set_a is small but combined > MAX_ITEMS => chunk both
    monkeypatch.setattr(batching, "MAX_ITEMS", 5)
    monkeypatch.setattr(batching, "HALF_CHUNK", 2)
    set_a = list(range(2))
    set_b = list(range(7))
    bodies = batching._make_cross_bodies(set_a, set_b, flatten=False)
    # chunks_a: 1 chunk, chunks_b: ceil(7/2)=4 chunks
    assert len(bodies) == 4
    for body in bodies:
        assert body["set_a"] == set_a
        assert body["flatten"] is False


def test_make_cross_bodies_small_b(monkeypatch):
    # Test branch when set_b is small and A < MAX_ITEMS => chunk only set_a
    monkeypatch.setattr(batching, "MAX_ITEMS", 5)
    monkeypatch.setattr(batching, "HALF_CHUNK", 2)
    set_a = list(range(4))
    set_b = list(range(2))
    bodies = batching._make_cross_bodies(set_a, set_b, flatten=True)
    # chunks_a: ceil((5-2)=3 => [0:3,3:6]) => 2 chunks, set_b intact
    assert len(bodies) == 2
    for body in bodies:
        assert body["set_b"] == set_b
        assert body["flatten"] is True


def test_make_cross_bodies_both_large(monkeypatch):
    # Test branch when both sets exceed MAX_ITEMS
    monkeypatch.setattr(batching, "MAX_ITEMS", 5)
    monkeypatch.setattr(batching, "HALF_CHUNK", 2)
    set_a = list(range(7))
    set_b = list(range(7))
    bodies = batching._make_cross_bodies(set_a, set_b, flatten=False)
    # chunks_a: ceil(7/2)=4, chunks_b: 4 => 16 combinations
    assert len(bodies) == 16


def test_stitch_results_self(monkeypatch):
    # Force small limits and test self-similarity stitching
    monkeypatch.setattr(batching, "MAX_ITEMS", 5)
    monkeypatch.setattr(batching, "HALF_CHUNK", 2)
    # Single list used for both a and b to trigger self-sim
    full = list(range(6))
    # Prepare chunks and offsets
    chunks = batching._make_self_chunks(full)
    offsets = [0]
    for c in chunks:
        offsets.append(offsets[-1] + len(c))
    # Coordinates of blocks (i,j) for i<=j
    coords = [(i, j) for i in range(len(chunks)) for j in range(i, len(chunks))]
    # Build dummy results with identifiable values
    results = []
    for i, j in coords:
        shape = (len(chunks[i]), len(chunks[j]))
        val = (i + 1) * 10 + (j + 1)
        mat = np.full(shape, val, dtype=float)
        results.append(DummyResult(mat))
    # Stitch
    matrix = batching._stitch_results(results, [], full, full)
    assert isinstance(matrix, np.ndarray)
    assert matrix.shape == (len(full), len(full))
    # Verify each block and its symmetric counterpart
    for idx, (i, j) in enumerate(coords):
        r0, r1 = offsets[i], offsets[i + 1]
        c0, c1 = offsets[j], offsets[j + 1]
        expected = (i + 1) * 10 + (j + 1)
        # upper block
        assert np.all(matrix[r0:r1, c0:c1] == expected)
        if i != j:
            # lower block symmetric
            assert np.all(matrix[c0:c1, r0:r1] == expected)


def test_stitch_results_cross(monkeypatch):
    # Force small limits and test cross-similarity stitching
    monkeypatch.setattr(batching, "MAX_ITEMS", 5)
    monkeypatch.setattr(batching, "HALF_CHUNK", 2)
    full_a = list(range(6))
    full_b = list(range(6, 12))
    # Prepare chunks and offsets for a and b
    chunks_a = batching._make_self_chunks(full_a)
    chunks_b = batching._make_self_chunks(full_b)
    offsets_a = [0]
    for c in chunks_a:
        offsets_a.append(offsets_a[-1] + len(c))
    offsets_b = [0]
    for c in chunks_b:
        offsets_b.append(offsets_b[-1] + len(c))
    # Build dummy results for all block combinations
    results = []
    for i in range(len(chunks_a)):
        for j in range(len(chunks_b)):
            shape = (len(chunks_a[i]), len(chunks_b[j]))
            val = (i + 1) * 10 + (j + 1)
            mat = np.full(shape, val, dtype=float)
            results.append(DummyResult(mat))
    # Stitch
    matrix = batching._stitch_results(results, [], full_a, full_b)
    assert isinstance(matrix, np.ndarray)
    assert matrix.shape == (len(full_a), len(full_b))
    # Verify each block
    idx = 0
    for i in range(len(chunks_a)):
        for j in range(len(chunks_b)):
            r0, r1 = offsets_a[i], offsets_a[i + 1]
            c0, c1 = offsets_b[j], offsets_b[j + 1]
            expected = (i + 1) * 10 + (j + 1)
            assert np.all(matrix[r0:r1, c0:c1] == expected)
            idx += 1
