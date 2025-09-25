from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pywifi
from pywifi import const
import asyncio
import time
from pathlib import Path

app = FastAPI(title="Wi-Fi Security Scanner API")

# Allow CORS if needed (optional if frontend served from same backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to React build folder
BASE_DIR = Path(__file__).parent
FRONTEND_BUILD_DIR = BASE_DIR.parent / "frontend" / "build"
app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_DIR / "static"), name="static")


# Store signal history per BSSID
signal_history_store = {}

def scan_networks_real():
    wifi = pywifi.PyWiFi()
    interfaces = wifi.interfaces()
    if len(interfaces) == 0:
        return []

    iface = interfaces[0]  # first Wi-Fi adapter

    # Get connected network BSSID
    connected_bssid = None
    try:
        if iface.status() == const.IFACE_CONNECTED:
            for prof in iface.network_profiles():
                if prof.ssid == iface.ssid():
                    connected_bssid = prof.bssid
                    break
    except Exception:
        connected_bssid = None

    try:
        iface.scan()
    except Exception as e:
        print("Scan initiation failed:", e)
        return []

    time.sleep(3)  # wait for scan

    try:
        results = iface.scan_results()
    except Exception as e:
        print("Scan results retrieval failed:", e)
        return []

    seen = set()
    networks = []
    for net in results:
        # deduplicate by BSSID
        if net.bssid in seen:
            continue
        seen.add(net.bssid)

        ssid = net.ssid or "Hidden SSID"
        bssid = net.bssid
        signal = net.signal
        try:
            security = "Open" if net.akm[0] == const.AKM_TYPE_NONE else "Secured"
        except Exception:
            security = "Unknown"
        risk = "High" if security == "Open" else "Safe"
        connected = (bssid == connected_bssid)

        # maintain signal history
        history = signal_history_store.get(bssid, [])
        history.append(signal)
        if len(history) > 20:
            history = history[-20:]
        signal_history_store[bssid] = history

        networks.append({
            "ssid": ssid,
            "bssid": bssid,
            "signal": signal,
            "security": security,
            "risk": risk,
            "connected": connected,
            "signal_history": history
        })

    return networks


@app.get("/scan")
async def get_scan():
    networks = await asyncio.to_thread(scan_networks_real)
    return {"networks": networks}


# Serve React frontend
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"error": "Frontend not found"}

@app.get("/")
async def root():
    return FileResponse(FRONTEND_BUILD_DIR / "index.html")
