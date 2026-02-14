"""Tests for the chat rate limiter."""

import pytest
from time import time, sleep
from app.routers.chat import RateLimiter


class TestRateLimiter:
    """Test cases for the RateLimiter class."""

    def test_allows_requests_within_limit(self):
        """Requests within the limit should be allowed."""
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        client_ip = "192.168.1.1"

        # All 5 requests should be allowed
        for i in range(5):
            assert limiter.is_allowed(client_ip) is True, f"Request {i+1} should be allowed"

    def test_blocks_over_limit(self):
        """Requests over the limit should be blocked."""
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        client_ip = "192.168.1.1"

        # First 3 requests should be allowed
        for _ in range(3):
            assert limiter.is_allowed(client_ip) is True

        # 4th request should be blocked
        assert limiter.is_allowed(client_ip) is False

    def test_tracks_ips_separately(self):
        """Different IPs should have separate rate limits."""
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        client_1 = "192.168.1.1"
        client_2 = "192.168.1.2"

        # Client 1 makes 2 requests (reaches limit)
        assert limiter.is_allowed(client_1) is True
        assert limiter.is_allowed(client_1) is True
        assert limiter.is_allowed(client_1) is False  # Blocked

        # Client 2 should still be able to make requests
        assert limiter.is_allowed(client_2) is True
        assert limiter.is_allowed(client_2) is True
        assert limiter.is_allowed(client_2) is False  # Now blocked

    def test_window_expiration(self):
        """Requests outside the window should not count against the limit."""
        # Use a very short window for testing
        limiter = RateLimiter(max_requests=2, window_seconds=1)
        client_ip = "192.168.1.1"

        # Use up the limit
        assert limiter.is_allowed(client_ip) is True
        assert limiter.is_allowed(client_ip) is True
        assert limiter.is_allowed(client_ip) is False

        # Wait for window to expire
        sleep(1.1)

        # Should be allowed again
        assert limiter.is_allowed(client_ip) is True

    def test_cleans_old_requests(self):
        """Old requests should be cleaned from the tracking list."""
        limiter = RateLimiter(max_requests=10, window_seconds=1)
        client_ip = "192.168.1.1"

        # Make some requests
        for _ in range(5):
            limiter.is_allowed(client_ip)

        assert len(limiter.requests[client_ip]) == 5

        # Wait for window to expire
        sleep(1.1)

        # Make a new request - should trigger cleanup
        limiter.is_allowed(client_ip)

        # Only the new request should remain
        assert len(limiter.requests[client_ip]) == 1

    def test_default_configuration(self):
        """Default rate limiter should have sensible defaults."""
        limiter = RateLimiter()

        assert limiter.max_requests == 20
        assert limiter.window == 60

    def test_unknown_client(self):
        """First request from any client should always be allowed."""
        limiter = RateLimiter(max_requests=1, window_seconds=60)

        # First request from any IP should be allowed
        assert limiter.is_allowed("10.0.0.1") is True
        assert limiter.is_allowed("10.0.0.2") is True
        assert limiter.is_allowed("10.0.0.3") is True

        # Second request from each should be blocked (limit is 1)
        assert limiter.is_allowed("10.0.0.1") is False
        assert limiter.is_allowed("10.0.0.2") is False
        assert limiter.is_allowed("10.0.0.3") is False
