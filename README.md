# 🗳️ VoteSecure: Face Recognition Based Voting System

**VoteSecure** is a secure and modern web-based voting application that uses **face recognition** to authenticate voters and ensure a tamper-proof election process.

## 🚀 Features

- 🧑‍💻 User and Admin Authentication
- 🧠 Face Recognition using OpenCV and FastAPI
- 📋 Admin Dashboard to add candidates, conduct elections, and view results
- 📊 Voters can securely vote in elections using face verification
- 📈 Real-time election result visualization
- 🧼 Duplicate voting protection and validation

## 📦 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js, FastAPI (for face recognition)
- **Database:** MongoDB with Mongoose
- **Machine Learning:** Python, OpenCV, face-recognition
- **Containerization:** Docker (optional)

---

## ⚙️ Installation Guide

bash
 🔧 1. Clone the Repository
git clone https://github.com/itsursrujan/votesecure.git
cd votesecure

🧪 2. Python FastAPI Face Recognition Server Setup
➤ Step into face-recognition directory:

cd face-recognition
➤ Create a virtual environment (optional but recommended):
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
➤ Install Python Dependencies:
pip install fastapi uvicorn opencv-python face-recognition numpy pymongo jinja2

➤ Run FastAPI Server:
python -m uvicorn server:app --host 0.0.0.0 --port 5000


⚙️ 3. Node.js + Express Backend Setup
➤ Step into backend directory:
cd ../backend
➤ Install Node.js Dependencies:
npm install
Required packages:
express
mongoose
cors
dotenv
body-parser
➤ Start the Node.js Server:
node server.js
Make sure MongoDB is running before starting the server.

🗄️ 4. MongoDB Setup
Option A: Use Local MongoDB
Download MongoDB Community Server
Start the MongoDB service:
mongod
Your Node.js server should connect to mongodb://localhost:27017/votingSystemuser

Option B: Use MongoDB Atlas
Create an account at MongoDB Atlas
Create a cluster and get your connection URI
Replace MONGO_URI in your code or .env file

Finally Start the Server in terminal:
npm start (starts both FastAPI and node server)
