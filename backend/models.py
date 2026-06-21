from sqlalchemy import *

from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Company(Base):

    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)

    company_name = Column(String)

    bank_name = Column(String)

    company_category = Column(String)


class Pincode(Base):

    __tablename__ = "pincodes"

    id = Column(Integer, primary_key=True)

    pincode = Column(String)

    bank = Column(String)

    location = Column(String)

    state = Column(String)