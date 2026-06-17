# StadiumSync Python Vision Backend

This backend adds Python-based detection for:
- CCTV frames
- Phone camera snapshots
- Satellite images

It supports OpenCV-based people detection, coarse object heuristics, and moving-object detection.

## 1) Setup

```bash
cd python-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Run API

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

## 3) Endpoints

### Generic detector
`POST /detect/image`

Form fields:
- `source_type`: `cctv | phone | satellite`
- `camera_id`: any string (optional)
- `conf_threshold`: float (optional)
- `file`: image file

### CCTV shortcut
`POST /detect/cctv`
- `camera_id` + `file`

### Phone shortcut
`POST /detect/phone`
- `file`

### Satellite shortcut
`POST /detect/satellite`
- `file`

## 4) Example cURL

```bash
curl -X POST http://localhost:8000/detect/cctv \
  -F "camera_id=gate-a" \
  -F "file=@sample.jpg"
```

## Notes
- This backend does not use YOLO.
- Detection is implemented using OpenCV HOG + contour and motion analysis.
