"""
backend/app/middleware/rate_limit.py
─────────────────────────────────────
Simple in-memory rate limiter using slowapi.

Applied to authentication endpoints to protect against brute-force attacks.
Limit: 10 requests per minute per IP address.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Global limiter instance — imported by routers that need rate limiting.
# Uses the client's real IP address as the key.
limiter = Limiter(key_func=get_remote_address)
