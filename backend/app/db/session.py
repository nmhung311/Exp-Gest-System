import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Lấy DATABASE_URL từ environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://user:pass@db:5432/exp")

# Tạo engine
engine = create_engine(DATABASE_URL)

# Tạo session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tạo Base class cho models
Base = declarative_base()
