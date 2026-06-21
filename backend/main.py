from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import engine

app = FastAPI()

# ======================================
# CORS
# ======================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================
# HOME
# ======================================

@app.get("/")
def home():
    return FileResponse("index.html")

# ======================================
# DATABASE TEST
# ======================================

@app.get("/test-db")
def test_db():

    with engine.connect() as conn:

        company_count = conn.execute(
            text("SELECT COUNT(*) FROM public.companies")
        ).scalar()

        pincode_count = conn.execute(
            text("SELECT COUNT(*) FROM public.pincodes")
        ).scalar()

        return {
            "companies": company_count,
            "pincodes": pincode_count
        }

# ======================================
# COMPANY SEARCH
# ======================================


@app.get("/companies/search")
def search_companies(q: str = Query("")):

    if len(q.strip()) < 3:
        return []


    with engine.connect() as conn:

        result = conn.execute(
            text("""
                SELECT
                    company_name,
                    bank_name,
                    company_category
                FROM companies
                WHERE LOWER(company_name) LIKE LOWER(:search)
                ORDER BY company_name
                LIMIT 50
            """),
            {
                "search": f"{q}%"
            }
        )

        rows = result.fetchall()

        companies = {}

        for row in rows:

            company_name = row[0]
            bank_name = row[1]
            category = row[2]

            if company_name not in companies:

                companies[company_name] = {
                    "company_name": company_name,
                    "listings": []
                }

            companies[company_name]["listings"].append(
                {
                    "bank": bank_name,
                    "listing": category
                }
            )

        return list(companies.values())
    

# ======================================
# PINCODE SEARCH
# ======================================

@app.get("/pincodes/search")
def search_pincode(q: str = Query("")):

    q = q.strip()

    if len(q) < 3:
        return []

    with engine.connect() as conn:

        if q.isdigit():

            result = conn.execute(
                text("""
                    SELECT
                        pincode,
                        bank,
                        location,
                        state
                    FROM pincodes
                    WHERE pincode LIKE :search
                    LIMIT 50
                """),
                {
                    "search": f"{q}%"
                }
            )

        else:

            result = conn.execute(
                text("""
                    SELECT
                        pincode,
                        bank,
                        location,
                        state
                    FROM pincodes
                    WHERE LOWER(location) LIKE :search
                    LIMIT 50
                """),
                {
                    "search": f"{q.lower()}%"
                }
            )

        rows = result.fetchall()

        pincodes = {}

        for row in rows:

            pincode = row[0]
            bank = row[1]
            location = row[2]
            state = row[3]

            if pincode not in pincodes:

                pincodes[pincode] = {
                    "pincode": pincode,
                    "location": location,
                    "state": state,
                    "banks": []
                }

            pincodes[pincode]["banks"].append(bank)

        return list(pincodes.values())
    

app.mount(
    "/",
    StaticFiles(directory=".", html=True),
    name="static"
)