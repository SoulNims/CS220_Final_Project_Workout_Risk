from database import get_client, row_to_dict


async def get_user(username: str) -> dict:
    db = get_client()
    result = await db.execute(
        "SELECT username, email, first_name, last_name, gender, age FROM users WHERE username = ?",
        [username],
    )
    if result.rows:
        return row_to_dict(result.columns, result.rows[0])
    return {
        "username": username,
        "email": None,
        "first_name": "",
        "last_name": "",
        "gender": "",
        "age": None,
    }


async def update_user(username: str, gender: str | None, age: int | None) -> dict:
    db = get_client()
    if gender is not None:
        await db.execute("UPDATE users SET gender = ? WHERE username = ?", [gender, username])
    if age is not None:
        await db.execute("UPDATE users SET age = ? WHERE username = ?", [age, username])
    result = await db.execute("SELECT * FROM users WHERE username = ?", [username])
    return row_to_dict(result.columns, result.rows[0])


async def get_note(username: str) -> dict:
    db = get_client()
    result = await db.execute(
        "SELECT username, body, updated_at FROM notes WHERE username = ?",
        [username],
    )
    if result.rows:
        return row_to_dict(result.columns, result.rows[0])
    return {"username": username, "body": "", "updated_at": None}


async def update_note(username: str, body: str) -> dict:
    db = get_client()
    await db.execute(
        """INSERT INTO notes (username, body, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(username) DO UPDATE SET
             body = excluded.body,
             updated_at = CURRENT_TIMESTAMP""",
        [username, body],
    )
    return await get_note(username)


async def user_exists(username: str) -> bool:
    db = get_client()
    result = await db.execute(
        "SELECT username FROM users WHERE username = ?", [username]
    )
    return bool(result.rows)
