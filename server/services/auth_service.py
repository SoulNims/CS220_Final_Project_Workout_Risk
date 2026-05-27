import base64
import hashlib
import hmac
import json
import os
import re
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


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_answer(answer: str) -> str:
    return answer.strip().lower()


def _username_from_email(email: str) -> str:
    prefix = email.split("@", 1)[0]
    username = re.sub(r"[^a-zA-Z0-9_-]+", "-", prefix).strip("-_").lower()
    return username[:32] or "user"


async def _available_username(email: str) -> str:
    db = get_client()
    base = _username_from_email(email)
    candidate = base
    counter = 2
    while True:
        result = await db.execute("SELECT username FROM users WHERE username = ?", [candidate])
        if not result.rows:
            return candidate
        suffix = f"-{counter}"
        candidate = f"{base[:40 - len(suffix)]}{suffix}"
        counter += 1


async def require_user_access(username: str, authorization: str | None) -> None:
    token_username = username_from_authorization(authorization)
    if token_username != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own account.",
        )


async def register_user(
    email: str, password: str, first_name: str, last_name: str,
    security_question: str, security_answer: str,
) -> dict:
    clean_email = normalize_email(email)
    clean_first_name = first_name.strip()
    clean_last_name = last_name.strip()
    db = get_client()
    existing = await db.execute("SELECT username FROM users WHERE email = ?", [clean_email])
    if existing.rows:
        raise HTTPException(status_code=409, detail="An account already exists for this email.")
    username = await _available_username(clean_email)
    await db.execute(
        """INSERT INTO users
               (username, email, first_name, last_name, password_hash, gender, age,
                security_question, security_answer_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            username, clean_email, clean_first_name, clean_last_name,
            hash_password(password), "", None,
            security_question, hash_password(_normalize_answer(security_answer)),
        ],
    )
    result = await db.execute(
        "SELECT username, email, first_name, last_name, gender, age FROM users WHERE username = ?",
        [username],
    )
    user = row_to_dict(result.columns, result.rows[0])
    return {"token": create_token(username), "user": user}


async def get_security_question(email: str) -> str:
    db = get_client()
    result = await db.execute(
        "SELECT security_question FROM users WHERE email = ?", [normalize_email(email)]
    )
    if not result.rows:
        raise HTTPException(status_code=404, detail="No account found with that email.")
    question = result.rows[0][0]
    if not question:
        raise HTTPException(
            status_code=400,
            detail="This account was created before security questions were added and cannot use this flow.",
        )
    return question


async def reset_password(email: str, security_answer: str, new_password: str) -> dict:
    clean_email = normalize_email(email)
    db = get_client()
    result = await db.execute("SELECT * FROM users WHERE email = ?", [clean_email])
    if not result.rows:
        raise HTTPException(status_code=404, detail="No account found with that email.")
    user = row_to_dict(result.columns, result.rows[0])
    if not verify_password(_normalize_answer(security_answer), user.get("security_answer_hash")):
        raise HTTPException(status_code=401, detail="Incorrect answer. Please try again.")
    await db.execute(
        "UPDATE users SET password_hash = ? WHERE email = ?",
        [hash_password(new_password), clean_email],
    )
    return {
        "token": create_token(user["username"]),
        "user": {
            "username": user["username"],
            "email": user.get("email"),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "gender": user.get("gender", ""),
            "age": user.get("age"),
        },
    }


async def login_user(email: str, password: str) -> dict:
    clean_email = normalize_email(email)
    db = get_client()
    result = await db.execute("SELECT * FROM users WHERE email = ?", [clean_email])
    if not result.rows:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    user = row_to_dict(result.columns, result.rows[0])
    if not verify_password(password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {
        "token": create_token(user["username"]),
        "user": {
            "username": user["username"],
            "email": user.get("email"),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "gender": user.get("gender", ""),
            "age": user.get("age"),
        },
    }
