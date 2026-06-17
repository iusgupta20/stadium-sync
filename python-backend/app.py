from __future__ import annotations

import base64
import io
import random
import time
from typing import Any, Literal

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from detector import DetectorService, image_from_bytes

SourceType = Literal["cctv", "phone", "satellite"]

app = FastAPI(title="StadiumSync Vision API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = DetectorService()

# ── In-memory camera state store ─────────────────────────────────
CAMERA_CONFIGS: list[dict[str, Any]] = [
    {"id": "cam1", "name": "Stadium Bowl View",       "section": "stadium",    "source": "cctv"},
    {"id": "cam2", "name": "Gate Entry Monitoring",   "section": "gate",       "source": "cctv"},
    {"id": "cam3", "name": "Ground Boundary Cam",     "section": "ground",     "source": "cctv"},
    {"id": "cam4", "name": "Washroom Corridor Cam",   "section": "washroom",   "source": "cctv"},
    {"id": "cam5", "name": "Food Court Live Cam",     "section": "food court", "source": "cctv"},
    {"id": "cam6", "name": "East Stand Crowd Cam",    "section": "stand",      "source": "cctv"},
]

camera_results: dict[str, dict] = {}


# ── Helpers ───────────────────────────────────────────────────────
def _synthetic_frame(cam_id: str, width: int = 320, height: int = 180) -> np.ndarray:
    """Generate a noisy synthetic crowd frame for demo when no real frame is uploaded."""
    rng = random.Random(cam_id + str(int(time.time() // 3)))
    img = np.zeros((height, width, 3), dtype=np.uint8)
    # sky-like gradient
    for y in range(height):
        v = int(10 + y * 0.12)
        img[y, :] = [v, v + 4, v + 14]
    # crowd blobs
    n_people = rng.randint(6, 28)
    for _ in range(n_people):
        x = rng.randint(8, width - 8)
        y = rng.randint(height // 3, height - 10)
        cv2.ellipse(img, (x, y), (4, 10), 0, 0, 360, (rng.randint(100, 200), rng.randint(90, 180), rng.randint(100, 200)), -1)
    # noise
    noise = np.random.randint(0, 18, img.shape, dtype=np.uint8)
    img = cv2.add(img, noise)
    return img


def _draw_detections(image: np.ndarray, result: dict) -> str:
    """Draw bounding boxes on image and return base64-encoded JPEG."""
    vis = image.copy()
    colours = {"person": (0, 255, 128), "bag_like": (255, 180, 0), "handheld_like": (0, 200, 255), "ground_object": (200, 0, 255)}
    for det in result.get("detections", []):
        bb = det["bbox"]
        color = colours.get(det["label"], (200, 200, 200))
        cv2.rectangle(vis, (bb["x1"], bb["y1"]), (bb["x2"], bb["y2"]), color, 1)
        cv2.putText(vis, f"{det['label']} {det['confidence']:.2f}", (bb["x1"], max(bb["y1"] - 3, 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.32, color, 1)
    for mb in result.get("motion_boxes", []):
        cv2.rectangle(vis, (mb["x"], mb["y"]), (mb["x"] + mb["w"], mb["y"] + mb["h"]), (255, 80, 80), 1)
    _, buf = cv2.imencode(".jpg", vis, [cv2.IMWRITE_JPEG_QUALITY, 72])
    return base64.b64encode(buf).decode()


# ── Endpoints ─────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": "opencv-hog-motion", "cameras": len(CAMERA_CONFIGS)}


@app.get("/status/cameras")
def cameras_status() -> dict:
    """Return latest detection result for every configured camera."""
    return {"cameras": [
        {**cam, "latest": camera_results.get(cam["id"], {})}
        for cam in CAMERA_CONFIGS
    ]}


@app.post("/detect/image")
async def detect_image(
    source_type: SourceType = Form(...),
    camera_id: str = Form("default"),
    conf_threshold: float = Form(0.35),
    file: UploadFile = File(...),
) -> dict:
    try:
        file_bytes = await file.read()
        image = image_from_bytes(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        result = detector.detect(image=image, source_type=source_type, camera_id=camera_id, conf_threshold=conf_threshold)
        annotated = _draw_detections(image, result.__dict__)
        payload = {
            "camera_id": camera_id,
            "source_type": result.source_type,
            "object_counts": result.object_counts,
            "detections": result.detections,
            "motion_boxes": result.motion_boxes,
            "annotated_frame": annotated,
            "ts": int(time.time()),
        }
        camera_results[camera_id] = payload
        return payload
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Detection failed: {exc}") from exc


@app.post("/detect/cctv")
async def detect_cctv(camera_id: str = Form("gate-a"), file: UploadFile = File(...)) -> dict:
    return await detect_image(source_type="cctv", camera_id=camera_id, conf_threshold=0.35, file=file)


@app.post("/detect/phone")
async def detect_phone(file: UploadFile = File(...)) -> dict:
    return await detect_image(source_type="phone", camera_id="phone-cam", conf_threshold=0.35, file=file)


@app.post("/detect/satellite")
async def detect_satellite(file: UploadFile = File(...)) -> dict:
    return await detect_image(source_type="satellite", camera_id="satellite-feed", conf_threshold=0.2, file=file)


@app.post("/detect/synthetic/{camera_id}")
async def detect_synthetic(camera_id: str) -> dict:
    """Run detection on a synthetic generated frame — useful when no real camera feed is available."""
    image = _synthetic_frame(camera_id)
    cfg = next((c for c in CAMERA_CONFIGS if c["id"] == camera_id), {"source": "cctv"})
    result = detector.detect(image=image, source_type=cfg["source"], camera_id=camera_id)
    annotated = _draw_detections(image, result.__dict__)
    payload = {
        "camera_id": camera_id,
        "source_type": result.source_type,
        "object_counts": result.object_counts,
        "detections": result.detections,
        "motion_boxes": result.motion_boxes,
        "annotated_frame": annotated,
        "ts": int(time.time()),
    }
    camera_results[camera_id] = payload
    return payload

