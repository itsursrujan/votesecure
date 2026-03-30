import numpy as np
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pymongo import MongoClient
from bson import ObjectId

app = FastAPI()

# CORS middleware (replaces flask_cors)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# MongoDB connection (UNCHANGED)
client = MongoClient("mongodb://localhost:27017/")
db = client["votingSystemuser"]
users = db["users"]


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


def is_face_duplicate(new_encoding, existing_encodings):
    for enc in existing_encodings:
        known = np.array(enc)
        unknown = np.array(new_encoding)
        # Handle the case when the encoding array is empty
        if known.size == 0 or unknown.size == 0:
            continue
        distance = np.linalg.norm(known - unknown)
        if distance < 0.6:  # Threshold for face match (can adjust slightly)
            return True
    return False


@app.post("/register-face")
async def register_face(request: Request):
    data = await request.json()
    user_id = data.get("userId")
    encoding = data.get("encoding")

    if not user_id or not encoding:
        return JSONResponse(content={"message": "Missing data"}, status_code=400)

    # Ensure encoding is of correct shape
    if len(encoding) != 128:
        return JSONResponse(content={"message": "Invalid face encoding data"}, status_code=400)

    try:
        # Get user and check if they already have a face encoding
        user = users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return JSONResponse(content={"message": "User not found"}, status_code=404)

        existing_encoding = user.get("faceEncoding", [])

        # Check for duplicates if the user has no existing encoding
        if not existing_encoding:
            existing_users = users.find({"faceEncoding": {"$exists": True}})
            for existing_user in existing_users:
                # Compare the new face encoding with all existing ones
                known_encoding = np.array(existing_user["faceEncoding"])
                if known_encoding.size == 0:
                    continue
                distance = np.linalg.norm(known_encoding - np.array(encoding))
                if distance < 0.6:  # Threshold for matching faces
                    return JSONResponse(
                        content={"message": "This face is already registered with another voter ID!"},
                        status_code=409
                    )

            # No duplicates found, proceed with storing the face encoding
            result = users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"faceEncoding": encoding}}
            )
        else:
            # If user already has a face encoding, compare with other users to check for duplicates
            existing_users = users.find({"faceEncoding": {"$exists": True}})
            for existing_user in existing_users:
                if str(existing_user["_id"]) != str(user_id):  # Skip checking the current user
                    known_encoding = np.array(existing_user["faceEncoding"])
                    if known_encoding.size == 0:
                        continue
                    distance = np.linalg.norm(known_encoding - np.array(encoding))
                    if distance < 0.6:  # Threshold for matching faces
                        return JSONResponse(
                            content={"message": "This face is already registered with another voter ID!"},
                            status_code=409
                        )

            # If no duplicate, update the existing user's face encoding
            result = users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"faceEncoding": encoding}}
            )

        if result.matched_count == 0:
            return JSONResponse(content={"message": "User not found"}, status_code=404)

        return {"message": "Face encoding registered successfully!"}

    except Exception as e:
        return JSONResponse(content={"message": f"Error: {str(e)}"}, status_code=400)


@app.get("/verify-face", response_class=HTMLResponse)
def verify_page(request: Request):
    return templates.TemplateResponse("verify.html", {"request": request})


@app.post("/verify-face")
async def verify_face(request: Request):
    data = await request.json()
    voter_id = data.get("voterId")
    election_id = data.get("electionId")
    encoding = data.get("encoding")

    if not voter_id or not election_id or not encoding:
        return JSONResponse(content={"success": False, "message": "Missing data"}, status_code=400)

    try:
        user = users.find_one({"voterId": voter_id})
        if not user:
            return JSONResponse(content={"success": False, "message": "User not found"}, status_code=404)

        # Compare face encodings
        stored_encoding = user.get("faceEncoding", [])
        if not stored_encoding:
            return JSONResponse(content={"success": False, "message": "No face registered"}, status_code=403)

        if len(stored_encoding) == 0 or len(encoding) == 0:
            return JSONResponse(content={"success": False, "message": "Face encoding is invalid"}, status_code=400)

        distance = np.linalg.norm(np.array(encoding) - np.array(stored_encoding))
        if distance > 0.6:
            return JSONResponse(content={"success": False, "message": "Face does not match"}, status_code=401)

        # Check if already voted in this election
        votes = user.get("votes", [])
        already_voted = any(vote.get("electionId") == ObjectId(election_id) for vote in votes)

        if already_voted:
            return JSONResponse(
                content={"success": False, "message": "You have already voted in this election"},
                status_code=403
            )

        # If all conditions are met, allow the user to vote
        return {"success": True, "message": "Verification successful"}

    except Exception as e:
        return JSONResponse(content={"success": False, "message": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)