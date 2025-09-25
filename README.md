# Wi-Fi Security Scanner

A web application that scans nearby Wi-Fi networks, visualizes signal strength trends, and provides risk assessment, including detection of open or potentially unsafe networks.

---

## Features

- Scan all nearby Wi-Fi networks.
- Display SSID, BSSID, signal strength, security type, and risk level.
- Track signal strength trends (last 10 readings) with interactive graphs.
- Detect potentially unsafe networks (open/WEP) for quick risk visualization.
- Works as a single server serving both backend API and frontend.

---

## Tech Stack

- **Backend:** Python, FastAPI, PyWiFi
- **Frontend:** React, Chart.js
- **Server:** Uvicorn

---
## Learning Outcomes

By completing this project, you will learn:

- How to interact with Wi-Fi hardware programmatically using Python (pywifi).
- Creating REST APIs with FastAPI and serving static frontend files.
- Integrating React with backend APIs for real-time data visualization.
- Using Chart.js to render dynamic and interactive signal graphs.
- Assessing Wi-Fi security and understanding risks of open/WEP networks.
- Combining frontend and backend into a single deployable server.

---
## Installation & Setup

**Prerequisites**

- Python 3.11+
- Node.js 18+ and npm
- Wi-Fi adapter (required to scan networks)

**Backend Setup**

- Navigate to the backend folder:

<pre>cd backend</pre>

- Install Python dependencies:

<pre>pip install -r requirements.txt</pre>

- Run the backend server:

<pre>uvicorn app:app</pre>


The API will be available at http://127.0.0.1:8000.

**Frontend Setup**

- Navigate to the frontend folder:

<pre>cd frontend</pre>

- Install Node.js dependencies:

<pre>npm install</pre>

- Start the React app:

<pre>npm start</pre>


The frontend will be available at http://localhost:3000 and will automatically fetch data from the backend.

---
## Single Server Setup (Optional)

If you have the backend configured to serve the frontend build:

1. Build the frontend for production:

<pre>cd frontend
npm run build</pre>


2. Move the build folder inside the backend directory (or configure backend to serve it).

3.Run the backend, and open the app at http://127.0.0.1:8000.

---
