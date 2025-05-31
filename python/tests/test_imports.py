"""Basic import tests."""


def test_version():
    import pulse

    assert isinstance(pulse.__version__, str)
    assert len(pulse.__version__) > 0
