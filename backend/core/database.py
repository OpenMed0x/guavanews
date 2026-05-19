import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

DEFAULT_DATABASE_URL = "postgresql://linyuanyuan@localhost:5432/guava_db"


def _resolve_database_url() -> str:
    return (
        os.getenv("DATABASE_URL")
        or os.getenv("SUPABASE_DATABASE_URL")
        or DEFAULT_DATABASE_URL
    )


SQLALCHEMY_DATABASE_URL = _resolve_database_url()
DATABASE_IS_SUPABASE = "supabase.co" in SQLALCHEMY_DATABASE_URL
DATABASE_PROVIDER = "supabase-postgres" if DATABASE_IS_SUPABASE else "postgresql"

connect_args: dict[str, object] = {}
if DATABASE_IS_SUPABASE:
    connect_args["sslmode"] = "require"

if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    connect_args["application_name"] = "guava-backend"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
