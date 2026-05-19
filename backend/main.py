import sys
import os
import time
import uvicorn
import random
import base64
import datetime
import hashlib
import hmac
import json
import secrets
import shutil
import uuid
from urllib.parse import urlparse

# 1. 环境路径对齐
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from crewai import Crew, Process
from agents.scout import scout_agent
from agents.writer import neon_agent, cipher_agent
from agents.publisher import publisher_agent
from tasks.news_tasks import create_editorial_tasks

# FastAPI 相关导入
from fastapi import FastAPI, Depends, HTTPException, Body, Header, Request, File, UploadFile
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from core.database import get_db, engine, Base, check_database_connection, DATABASE_IS_SUPABASE, DATABASE_PROVIDER
from models.post import NewsPost
from models.user import User
from models.wallet_subscription import WalletSubscription
from typing import Any
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

# --- 后端初始化 ---
Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    connection.execute(text("ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024)"))

app = FastAPI(title="Guava Editorial API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_SECRET = os.getenv("AUTH_SECRET", "guava-dev-auth-secret")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_API_BASE = "https://api.stripe.com/v1"
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "")
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", "http://127.0.0.1:8000").rstrip("/")
ADMIN_EMAILS = {email.strip().lower() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()}
UPLOADS_DIR = os.path.join(current_dir, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class AuthPayload(BaseModel):
    email: str
    password: str


class CheckoutPayload(BaseModel):
    success_url: str | None = None
    cancel_url: str | None = None


class WalletSubscriptionPayload(BaseModel):
    wallet_address: str
    tx_hash: str | None = None


class ArticlePayload(BaseModel):
    title: str
    content: str
    category: str | None = None
    author: str | None = None
    language: str | None = None
    image_url: str | None = None


def _hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${base64.b64encode(hashed).decode('ascii')}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, expected = stored_hash.split("$", 1)
    except ValueError:
        return False
    candidate = _hash_password(password, salt)
    return hmac.compare_digest(candidate, f"{salt}${expected}")


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _create_auth_token(user: User) -> str:
    payload = {
        "user_id": user.id,
        "email": user.email,
        "is_premium": user.is_premium,
        "exp": int(time.time()) + 60 * 60 * 24 * 7,
    }
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(AUTH_SECRET.encode("utf-8"), encoded_payload.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded_payload}.{_b64url_encode(signature)}"


def _decode_auth_token(token: str) -> dict[str, Any]:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    expected_signature = hmac.new(
        AUTH_SECRET.encode("utf-8"),
        encoded_payload.encode("ascii"),
        hashlib.sha256,
    ).digest()
    actual_signature = _b64url_decode(encoded_signature)
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise HTTPException(status_code=401, detail="Invalid token signature")

    payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
    if payload.get("exp", 0) < int(time.time()):
        raise HTTPException(status_code=401, detail="Token expired")
    return payload


def _get_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return authorization.removeprefix("Bearer ").strip()


def _serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "is_premium": user.is_premium,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _serialize_hn_style_item(post: NewsPost) -> dict[str, Any]:
    created_at_ts = int(post.created_at.timestamp()) if post.created_at else int(time.time())
    excerpt = (post.content or "").replace("\n", " ").strip()
    if len(excerpt) > 280:
        excerpt = f"{excerpt[:277]}..."

    return {
        "id": post.id,
        "type": "story",
        "title": post.title,
        "by": post.author or "unknown",
        "time": created_at_ts,
        "unix_time": created_at_ts,
        "text": post.content,
        "excerpt": excerpt,
        "category": post.category,
        "lang": post.language,
        "image_url": post.image_url,
        "url": f"{FRONTEND_URL.rstrip('/')}/article/{post.id}",
        "score": 1,
        "descendants": 0,
        "kids": [],
    }


def _serialize_hn_style_user(author: str, posts: list[NewsPost]) -> dict[str, Any]:
    sorted_posts = sorted(posts, key=lambda post: post.created_at or datetime.datetime.min, reverse=True)
    return {
        "id": author,
        "created": int((sorted_posts[-1].created_at or datetime.datetime.utcnow()).timestamp()) if sorted_posts else int(time.time()),
        "submitted": [post.id for post in sorted_posts],
        "karma": len(sorted_posts),
        "about": f"Guava editorial author profile for {author}.",
    }


def _normalize_wallet_address(wallet_address: str) -> str:
    normalized = wallet_address.strip().lower()
    if not normalized:
        raise HTTPException(status_code=400, detail="Wallet address is required")
    return normalized


def _absolute_asset_url(path: str) -> str:
    return f"{BACKEND_PUBLIC_URL}{path}"


def _validate_image_url(image_url: str | None) -> str | None:
    if not image_url:
        return None
    normalized = image_url.strip()
    if not normalized:
        return None
    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="image_url must be a valid http/https URL")
    return normalized


def _normalize_article_payload(raw_payload: dict[str, Any]) -> ArticlePayload:
    title = (raw_payload.get("title") or "").strip()
    content = (raw_payload.get("content") or raw_payload.get("body") or "").strip()
    category = (raw_payload.get("category") or "Technology").strip()
    author = (raw_payload.get("author") or "AGENT_NEON").strip()
    language = (raw_payload.get("language") or "zh").strip()
    image_url = _validate_image_url(raw_payload.get("image_url") or raw_payload.get("imageUrl"))

    if not title:
        if content:
            title = content.split("\n")[0][:40].strip() or "AI Generated News"
        else:
            raise HTTPException(status_code=400, detail="title is required")

    if len(category) > 50:
        raise HTTPException(status_code=400, detail="category must be 50 characters or fewer")
    if len(author) > 255:
        raise HTTPException(status_code=400, detail="author must be 255 characters or fewer")
    if len(language) > 10:
        raise HTTPException(status_code=400, detail="language must be 10 characters or fewer")

    return ArticlePayload(
        title=title,
        content=content,
        category=category,
        author=author,
        language=language,
        image_url=image_url,
    )


def _is_managed_local_upload(image_url: str | None) -> bool:
    return bool(image_url and image_url.startswith(_absolute_asset_url("/uploads/")))


def _delete_local_upload_if_managed(image_url: str | None) -> None:
    if not _is_managed_local_upload(image_url):
        return
    filename = image_url.rsplit("/uploads/", 1)[-1]
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(UPLOADS_DIR, safe_filename)
    if os.path.exists(file_path):
        os.remove(file_path)


def _upload_image_to_cloudinary(file: UploadFile) -> str | None:
    if not CLOUDINARY_CLOUD_NAME or not CLOUDINARY_UPLOAD_PRESET:
        return None

    file.file.seek(0)
    response = requests.post(
        f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload",
        data={"upload_preset": CLOUDINARY_UPLOAD_PRESET},
        files={"file": (file.filename or "upload", file.file, file.content_type or "application/octet-stream")},
        timeout=60,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {response.text}")
    payload = response.json()
    secure_url = payload.get("secure_url")
    if not secure_url:
        raise HTTPException(status_code=500, detail="Cloudinary upload returned no secure_url")
    return secure_url


def _upload_image_to_supabase(file: UploadFile) -> str | None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_STORAGE_BUCKET:
        return None

    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    object_path = f"article-images/{filename}"
    file.file.seek(0)
    response = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{object_path}",
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "x-upsert": "false",
            "Content-Type": file.content_type or "application/octet-stream",
        },
        data=file.file.read(),
        timeout=60,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=500, detail=f"Supabase Storage upload failed: {response.text}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{object_path}"


def _store_image_locally(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    destination = os.path.join(UPLOADS_DIR, filename)
    file.file.seek(0)
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return _absolute_asset_url(f"/uploads/{filename}")


def _validate_upload_file(file: UploadFile) -> None:
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use JPEG, PNG, WEBP, or GIF.",
        )

    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size <= 0:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    if file_size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5MB or smaller")


def _get_current_user(db: Session, authorization: str | None) -> User:
    token = _get_bearer_token(authorization)
    payload = _decode_auth_token(token)
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _is_admin_user(user: User) -> bool:
    return user.email.lower() in ADMIN_EMAILS


def _require_article_owner_or_admin(article: NewsPost, user: User) -> None:
    article_author = (article.author or "").strip().lower()
    if _is_admin_user(user):
        return
    if article_author != user.email.lower():
        raise HTTPException(status_code=403, detail="You do not have permission to modify this article")


def _verify_stripe_signature(body: bytes, stripe_signature: str) -> None:
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Missing STRIPE_WEBHOOK_SECRET")

    timestamp = ""
    expected_signature = ""
    for part in stripe_signature.split(","):
        if part.startswith("t="):
            timestamp = part.split("=", 1)[1]
        elif part.startswith("v1="):
            expected_signature = part.split("=", 1)[1]

    if not timestamp or not expected_signature:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature header")

    signed_payload = f"{timestamp}.{body.decode('utf-8')}".encode("utf-8")
    computed_signature = hmac.new(
        STRIPE_WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(computed_signature, expected_signature):
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")


@app.get("/api/health")
async def healthcheck():
    return {
        "status": "ok",
        "database": {
            "provider": DATABASE_PROVIDER,
            "supabase_enabled": DATABASE_IS_SUPABASE,
            "connected": check_database_connection(),
        },
        "uploads": {
            "max_bytes": MAX_UPLOAD_BYTES,
            "cloudinary_enabled": bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET),
            "supabase_storage_enabled": bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET),
        },
    }


@app.post("/api/auth/register")
async def register(payload: AuthPayload, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = User(email=payload.email.lower(), password_hash=_hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": _create_auth_token(user), "user": _serialize_user(user)}


@app.post("/api/auth/login")
async def login(payload: AuthPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not _verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": _create_auth_token(user), "user": _serialize_user(user)}


@app.get("/api/auth/me")
async def me(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_current_user(db, authorization)
    return {"user": _serialize_user(user)}


@app.post("/api/billing/create-checkout-session")
async def create_checkout_session(
    payload: CheckoutPayload,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_current_user(db, authorization)
    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    success_url = payload.success_url or f"{FRONTEND_URL}?billing=success"
    cancel_url = payload.cancel_url or f"{FRONTEND_URL}?billing=cancel"
    request_payload = {
        "mode": "subscription",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "line_items[0][price]": STRIPE_PRICE_ID,
        "line_items[0][quantity]": "1",
        "customer_email": user.email,
        "client_reference_id": str(user.id),
        "metadata[user_id]": str(user.id),
    }
    if user.stripe_customer_id:
        request_payload["customer"] = user.stripe_customer_id
        request_payload.pop("customer_email", None)

    response = requests.post(
        f"{STRIPE_API_BASE}/checkout/sessions",
        headers={"Authorization": f"Bearer {STRIPE_SECRET_KEY}"},
        data=request_payload,
        timeout=30,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=500, detail=f"Stripe checkout failed: {response.text}")

    session = response.json()
    return {"checkout_url": session.get("url"), "session_id": session.get("id")}


@app.post("/api/billing/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    stripe_signature = request.headers.get("Stripe-Signature", "")
    _verify_stripe_signature(body, stripe_signature)
    event = json.loads(body.decode("utf-8"))

    if event.get("type") == "checkout.session.completed":
        session_data = event.get("data", {}).get("object", {})
        user_id = session_data.get("metadata", {}).get("user_id") or session_data.get("client_reference_id")
        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.is_premium = True
                user.stripe_customer_id = session_data.get("customer")
                db.commit()

    return {"received": True}


@app.get("/api/wallet-subscriptions/{wallet_address}")
async def get_wallet_subscription(wallet_address: str, db: Session = Depends(get_db)):
    normalized_address = _normalize_wallet_address(wallet_address)
    subscription = (
        db.query(WalletSubscription)
        .filter(WalletSubscription.wallet_address == normalized_address)
        .first()
    )
    return {
        "wallet_address": normalized_address,
        "is_active": bool(subscription and subscription.is_active),
    }


@app.post("/api/wallet-subscriptions/confirm")
async def confirm_wallet_subscription(
    payload: WalletSubscriptionPayload,
    db: Session = Depends(get_db),
):
    normalized_address = _normalize_wallet_address(payload.wallet_address)
    subscription = (
        db.query(WalletSubscription)
        .filter(WalletSubscription.wallet_address == normalized_address)
        .first()
    )

    if subscription:
        subscription.is_active = True
        if payload.tx_hash:
            subscription.tx_hash = payload.tx_hash
    else:
        subscription = WalletSubscription(
            wallet_address=normalized_address,
            is_active=True,
            tx_hash=payload.tx_hash,
        )
        db.add(subscription)

    db.commit()
    db.refresh(subscription)
    return {
        "wallet_address": subscription.wallet_address,
        "is_active": subscription.is_active,
        "tx_hash": subscription.tx_hash,
    }


@app.post("/api/uploads/image")
async def upload_article_image(file: UploadFile = File(...)):
    _validate_upload_file(file)

    image_url = _upload_image_to_supabase(file)
    if not image_url:
        image_url = _upload_image_to_cloudinary(file)
    if not image_url:
        image_url = _store_image_locally(file)

    return {
        "image_url": image_url,
        "storage": "supabase" if "/storage/v1/object/public/" in image_url else "cloudinary" if "cloudinary.com" in image_url else "local",
    }

# --- 核心：全兼容文章接收接口 ---

@app.post("/api/articles")
async def handle_article_submission(submission: Any = Body(...), db: Session = Depends(get_db)):
    """
    大一统接口：
    1. 接收来自 Agent 的自动投递 (Any 类型，兼容 Dict 和 List)
    2. 接收来自前端的手动投稿
    """
    try:
        # 兼容性处理：全部转为列表
        items = submission if isinstance(submission, list) else [submission]
        if not all(isinstance(item, dict) for item in items):
            raise HTTPException(status_code=400, detail="Each article submission must be an object")

        added_posts = []
        for p in items:
            normalized = _normalize_article_payload(p)

            # 去重判断：防止重复入库
            existing = db.query(NewsPost).filter(NewsPost.title == normalized.title).first()
            if existing:
                print(f"⏩ 跳过重复内容: {normalized.title[:20]}...")
                continue

            db_post = NewsPost(
                title=normalized.title,
                content=normalized.content,
                author=normalized.author,
                category=normalized.category,
                language=normalized.language,
                image_url=normalized.image_url,
            )
            added_posts.append(db_post)

        if added_posts:
            db.add_all(added_posts)
            db.commit()
            print(f"✅ 成功存入 {len(added_posts)} 篇文章！")
            return {"status": "success", "count": len(added_posts)}

        return {"status": "ignored", "message": "无有效内容或内容已存在"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 写入数据库失败: {e}")
        raise HTTPException(status_code=500, detail="Failed to save article") from e


@app.get("/api/articles")
async def get_articles(db: Session = Depends(get_db)):
    """获取所有新闻给前端展示"""
    try:
        return db.query(NewsPost).order_by(NewsPost.id.desc()).all()
    except Exception as e:
        print(f"❌ 获取文章失败: {e}")
        raise HTTPException(status_code=500, detail="Database fetch error")


@app.get("/api/v1/items/{item_id}")
async def get_item(item_id: int, db: Session = Depends(get_db)):
    post = db.query(NewsPost).filter(NewsPost.id == item_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Item not found")
    return _serialize_hn_style_item(post)


@app.get("/api/v1/maxitem")
async def get_max_item(db: Session = Depends(get_db)):
    latest = db.query(NewsPost).order_by(NewsPost.id.desc()).first()
    return {"maxitem": latest.id if latest else 0}


@app.get("/api/v1/feeds/topstories")
async def get_topstories(limit: int = 30, db: Session = Depends(get_db)):
    posts = db.query(NewsPost).order_by(NewsPost.created_at.desc(), NewsPost.id.desc()).limit(max(1, min(limit, 100))).all()
    return {"items": [_serialize_hn_style_item(post) for post in posts]}


@app.get("/api/v1/feeds/newstories")
async def get_newstories(limit: int = 30, db: Session = Depends(get_db)):
    posts = db.query(NewsPost).order_by(NewsPost.id.desc()).limit(max(1, min(limit, 100))).all()
    return {"items": [_serialize_hn_style_item(post) for post in posts]}


@app.get("/api/v1/feeds/category/{category}")
async def get_category_feed(category: str, limit: int = 30, db: Session = Depends(get_db)):
    posts = (
        db.query(NewsPost)
        .filter(NewsPost.category == category)
        .order_by(NewsPost.created_at.desc(), NewsPost.id.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )
    return {"items": [_serialize_hn_style_item(post) for post in posts], "category": category}


@app.get("/api/v1/search")
async def search_items(q: str, limit: int = 20, db: Session = Depends(get_db)):
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter q is required")

    like_query = f"%{query}%"
    posts = (
        db.query(NewsPost)
        .filter(
            (NewsPost.title.ilike(like_query))
            | (NewsPost.content.ilike(like_query))
            | (NewsPost.author.ilike(like_query))
            | (NewsPost.category.ilike(like_query))
        )
        .order_by(NewsPost.created_at.desc(), NewsPost.id.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )
    return {
        "query": query,
        "count": len(posts),
        "items": [_serialize_hn_style_item(post) for post in posts],
    }


@app.get("/api/v1/users/{author}")
async def get_author_profile(author: str, db: Session = Depends(get_db)):
    posts = db.query(NewsPost).filter(NewsPost.author == author).order_by(NewsPost.created_at.desc()).all()
    if not posts:
        raise HTTPException(status_code=404, detail="Author not found")
    return _serialize_hn_style_user(author, posts)


@app.put("/api/articles/{article_id}")
async def update_article(
    article_id: int,
    submission: dict[str, Any] = Body(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    article = db.query(NewsPost).filter(NewsPost.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    user = _get_current_user(db, authorization)
    _require_article_owner_or_admin(article, user)

    merged_payload = {
        "title": submission.get("title", article.title),
        "content": submission.get("content", submission.get("body", article.content)),
        "category": submission.get("category", article.category),
        "author": submission.get("author", article.author),
        "language": submission.get("language", article.language),
        "image_url": submission.get("image_url", submission.get("imageUrl", article.image_url)),
    }
    normalized = _normalize_article_payload(merged_payload)

    previous_image_url = article.image_url
    article.title = normalized.title
    article.content = normalized.content
    article.category = normalized.category
    article.author = normalized.author
    article.language = normalized.language
    article.image_url = normalized.image_url

    db.commit()
    db.refresh(article)
    if previous_image_url != article.image_url:
        _delete_local_upload_if_managed(previous_image_url)
    return {"status": "success", "article": article}


@app.delete("/api/articles/{article_id}")
async def delete_article(
    article_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    article = db.query(NewsPost).filter(NewsPost.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    user = _get_current_user(db, authorization)
    _require_article_owner_or_admin(article, user)

    image_url = article.image_url
    db.delete(article)
    db.commit()
    _delete_local_upload_if_managed(image_url)
    return {"status": "success", "deleted_id": article_id}


@app.delete("/api/articles/clear-test-data")
async def clear_test_articles(db: Session = Depends(get_db)):
    """一键清理测试数据"""
    try:
        db.query(NewsPost).filter(
            (NewsPost.author == "AGENT_NEON")
            | (NewsPost.title.contains("poisonedRag"))
            | (NewsPost.category == "Network Noise")
        ).delete(synchronize_session=False)
        db.commit()
        return {"status": "success", "message": "Test data wiped."}
    except Exception as e:
        db.rollback()
        return {"status": "error", "detail": str(e)}


# --- 执行引擎部分 ---

def start_guava_editorial():
    print("\n" + "🚀" * 10)
    print("GUAVA 全能数字编辑部启动 (M2 硬件保护模式)")
    print("目标领域: [金融, 科技, 医学, 网球, 艺术]")
    print("🚀" * 10 + "\n")

    writer_choice = random.choice([neon_agent, cipher_agent])
    language_label = "中文 (Neon)" if writer_choice == neon_agent else "English (Cipher)"
    print(f"🎲 今日轮值记者: {language_label}")

    tasks = create_editorial_tasks(scout_agent, writer_choice, publisher_agent)

    guava_crew = Crew(
        agents=[scout_agent, writer_choice, publisher_agent],
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
    )

    print(f"📡 任务队列已就绪，共计 {len(tasks)} 个步骤。正在深度采集素材...")

    try:
        start_time = time.time()
        result = guava_crew.kickoff()
        duration = round((time.time() - start_time) / 60, 2)
        print(f"\n✅ 今日快讯生成完毕！耗时: {duration} 分钟\n")
        return result
    except Exception as e:
        print(f"💥 运行过程中出现崩溃: {e}")
        return None


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
