from fastapi import FastAPI
from database import engine


app = FastAPI()

@app.get("/")
def root():
    return {"message": "Sankalp Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

from pydantic import BaseModel

# Fake user database (temporary)
users_db = {
    "admin@sankalp.in": {
        "password": "admin123",
        "role": "admin"
    },
    "user@sankalp.in": {
        "password": "user123",
        "role": "user"
    }
}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login(data: LoginRequest):
    user = users_db.get(data.email)

    if not user or user["password"] != data.password:
        return {"success": False, "message": "Invalid credentials"}

    return {
        "success": True,
        "role": user["role"],
        "message": "Login successful"
    }

from pydantic import BaseModel

class DemoRequest(BaseModel):
	name: str
	email: str
	company: str

@app.post("/demo-request")
def create_demo_request(request: DemoRequest):
	print("New Demo Request Received:")
	print(request.dict())

	return {
		"message": "Demo request received successfully"
	}















