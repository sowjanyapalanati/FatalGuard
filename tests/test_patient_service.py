"""
Unit Tests for Patient Service Authentication & Schemas
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "patient_service")))

from patient_service.auth import get_password_hash, verify_password, create_access_token, create_refresh_token, ALGORITHM, JWT_SECRET_KEY
import jwt


def test_password_hashing():
    raw_password = "SecurePassword123!"
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_generation():
    data = {"sub": "dr_smith", "role": "doctor"}
    token = create_access_token(data)
    assert isinstance(token, str)

    decoded = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "dr_smith"
    assert decoded["role"] == "doctor"
    assert "exp" in decoded


def test_refresh_token_generation():
    data = {"sub": "dr_smith"}
    refresh_token = create_refresh_token(data)
    decoded = jwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "dr_smith"
    assert decoded["type"] == "refresh"
