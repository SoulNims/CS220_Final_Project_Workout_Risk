import base64
import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from database import get_client, row_to_dict

HASH_ITERATIONS = 200_000
TOKEN_TTL = timedelta(hours=12)


def _auth_secret() -> bytes:
    return os.environ.get("AUTH_SECRET", "dev-only-change-me").encode("utf-8")


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        HASH_ITERATIONS,
    )
    return f"pbkdf2_sha256${HASH_ITERATIONS}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False
    try:
        algorithm, iterations, salt, expected = stored_hash.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        _b64decode(salt),
        int(iterations),
    )
    return hmac.compare_digest(_b64encode(digest), expected)


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": int((datetime.now(timezone.utc) + TOKEN_TTL).timestamp()),
    }
    payload_part = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(_auth_secret(), payload_part.encode("ascii"), hashlib.sha256)
    return f"{payload_part}.{_b64encode(signature.digest())}"


def parse_token(token: str) -> str:
    try:
        payload_part, signature_part = token.split(".", 1)
        expected = hmac.new(_auth_secret(), payload_part.encode("ascii"), hashlib.sha256)
        if not hmac.compare_digest(_b64encode(expected.digest()), signature_part):
            raise ValueError
        payload = json.loads(_b64decode(payload_part))
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError
        return str(payload["sub"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please sign in again.",
        ) from exc


def username_from_authorization(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in required.",
        )
    return parse_token(authorization.removeprefix("Bearer ").strip())


async def require_user_access(username: str, authorization: str | None) -> None:
    token_username = username_from_authorization(authorization)
    if token_username != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own account.",
        )


async def register_user(username: str, password: str) -> dict:
    clean_username = username.strip()
    db = get_client()
    existing = await db.execute("SELECT username FROM users WHERE username = ?", [clean_username])
    if existing.rows:
        raise HTTPException(status_code=409, detail="Username is already taken.")
    await db.execute(
        "INSERT INTO users (username, password_hash, gender, age) VALUES (?, ?, ?, ?)",
        [clean_username, hash_password(password), "", None],
    )
    result = await db.execute("SELECT username, gender, age FROM users WHERE username = ?", [clean_username])
    user = row_to_dict(result.columns, result.rows[0])
    return {"token": create_token(clean_username), "user": user}


async def login_user(username: str, password: str) -> dict:
    clean_username = username.strip()
    db = get_client()
    result = await db.execute("SELECT * FROM users WHERE username = ?", [clean_username])
    if not result.rows:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    user = row_to_dict(result.columns, result.rows[0])
    if not verify_password(password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {
        "token": create_token(clean_username),
        "user": {
            "username": user["username"],
            "gender": user.get("gender", ""),
            "age": user.get("age"),
        },
    }
