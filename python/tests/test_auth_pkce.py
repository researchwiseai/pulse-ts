import pytest
import httpx
import time

from pulse.auth import AuthorizationCodePKCEAuth


def test_authorization_code_pkce_auth_refresh(monkeypatch):
    # Freeze time for predictable expires_at calculation
    fixed_time = 1000.0
    monkeypatch.setattr(time, "time", lambda: fixed_time)
    # Capture httpx.post calls
    calls = []

    def fake_post(url, data):  # pylint: disable=unused-argument
        calls.append((url, data))

        class FakeResponse:
            def raise_for_status(self):
                pass

            def json(self):
                return {
                    "access_token": "token123",
                    "refresh_token": "refresh456",
                    "expires_in": 3600,
                }

        return FakeResponse()

    monkeypatch.setattr(httpx, "post", fake_post)

    token_url = "https://example.com/oauth/token"
    auth = AuthorizationCodePKCEAuth(
        token_url=token_url,
        client_id="client123",
        code="authcode",
        redirect_uri="https://example.com/cb",
        code_verifier="verifier123",
    )
    # Trigger refresh
    auth._refresh_token()
    # Check tokens and expiry
    assert auth._access_token == "token123"
    assert auth._refresh_token_value == "refresh456"
    assert auth._expires_at == pytest.approx(fixed_time + 3600 - 60)
    # Verify httpx.post was called with correct parameters
    assert len(calls) == 1
    called_url, called_data = calls[0]
    assert called_url == token_url
    assert called_data == {
        "grant_type": "authorization_code",
        "client_id": "client123",
        "code": "authcode",
        "redirect_uri": "https://example.com/cb",
        "code_verifier": "verifier123",
    }


def test_authorization_code_pkce_auth_flow_and_host_filter(monkeypatch):
    # Freeze time for predictable behavior
    fixed_time = 2000.0
    monkeypatch.setattr(time, "time", lambda: fixed_time)
    # Stub httpx.post to provide a fixed token
    post_calls = []

    def fake_post(url, data):  # pylint: disable=unused-argument
        post_calls.append((url, data))

        class FakeResponse:
            def raise_for_status(self):
                pass

            def json(self):
                return {"access_token": "tok", "expires_in": 600}

        return FakeResponse()

    monkeypatch.setattr(httpx, "post", fake_post)

    auth = AuthorizationCodePKCEAuth(
        token_url="https://example.com/token",
        client_id="cid",
        code="code",
        redirect_uri="https://app/cb",
        code_verifier="ver",
        scope="s1 s2",
        audience="https://api.core.researchwiseai.com",
    )
    # Create a request to a matching host
    req = httpx.Request("GET", "https://api.core.researchwiseai.com/resource")
    # Apply auth flow
    authed_req = next(auth.auth_flow(req))
    # Authorization header should be set
    assert authed_req.headers.get("Authorization") == "Bearer tok"
    # httpx.post should have been called once
    assert len(post_calls) == 1

    # Further calls reuse the token until expiry
    req2 = httpx.Request("GET", "https://api.core.researchwiseai.com/other")
    authed_req2 = next(auth.auth_flow(req2))
    assert authed_req2.headers.get("Authorization") == "Bearer tok"
    assert len(post_calls) == 1

    # Requests to non-core hosts are not modified
    req3 = httpx.Request("GET", "https://other.example.com/")
    noauth_req = next(auth.auth_flow(req3))
    assert "Authorization" not in noauth_req.headers
