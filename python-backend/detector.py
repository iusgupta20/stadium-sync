from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np


@dataclass
class DetectionResult:
    source_type: str
    object_counts: dict[str, int]
    detections: list[dict[str, Any]]
    motion_boxes: list[dict[str, int]]


class DetectorService:
    """OpenCV-only detector for people, motion, and coarse object heuristics."""

    def __init__(self) -> None:
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self.motion_models: dict[str, cv2.BackgroundSubtractor] = {}

    def detect(
        self,
        image: np.ndarray,
        source_type: str,
        camera_id: str = "default",
        conf_threshold: float = 0.35,
    ) -> DetectionResult:
        detections: list[dict[str, Any]] = []

        detections.extend(self._detect_people_hog(image))
        detections.extend(self._detect_object_like_contours(image, source_type))

        motion_boxes = self._detect_motion(image, camera_id)

        object_counts = Counter(d["label"] for d in detections)
        if motion_boxes:
            object_counts["moving_object"] += len(motion_boxes)

        return DetectionResult(
            source_type=source_type,
            object_counts=dict(object_counts),
            detections=detections,
            motion_boxes=motion_boxes,
        )

    def _detect_people_hog(self, image: np.ndarray) -> list[dict[str, Any]]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        boxes, weights = self.hog.detectMultiScale(
            gray,
            winStride=(8, 8),
            padding=(8, 8),
            scale=1.05,
        )

        people: list[dict[str, Any]] = []
        for (x, y, w, h), weight in zip(boxes, weights):
            people.append(
                {
                    "label": "person",
                    "confidence": round(float(weight), 4),
                    "bbox": {
                        "x1": int(x),
                        "y1": int(y),
                        "x2": int(x + w),
                        "y2": int(y + h),
                    },
                }
            )
        return people

    def _detect_object_like_contours(self, image: np.ndarray, source_type: str) -> list[dict[str, Any]]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, 55, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        frame_area = image.shape[0] * image.shape[1]
        results: list[dict[str, Any]] = []

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 300 or area > frame_area * 0.35:
                continue

            x, y, w, h = cv2.boundingRect(contour)
            aspect = w / max(h, 1)

            # Heuristic classes for demo use without deep model.
            if source_type == "satellite":
                label = "ground_object"
            elif 0.35 <= aspect <= 0.9 and h >= 28:
                label = "bag_like"
            elif 0.9 < aspect <= 2.2 and 16 <= h <= 120:
                label = "handheld_like"
            else:
                label = "object"

            results.append(
                {
                    "label": label,
                    "confidence": 0.55,
                    "bbox": {
                        "x1": int(x),
                        "y1": int(y),
                        "x2": int(x + w),
                        "y2": int(y + h),
                    },
                }
            )

        return results

    def _detect_motion(self, image: np.ndarray, camera_id: str) -> list[dict[str, int]]:
        if camera_id not in self.motion_models:
            self.motion_models[camera_id] = cv2.createBackgroundSubtractorMOG2(
                history=350,
                varThreshold=25,
                detectShadows=True,
            )

        fg_model = self.motion_models[camera_id]
        fg_mask = fg_model.apply(image)

        kernel = np.ones((3, 3), np.uint8)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel, iterations=1)
        fg_mask = cv2.dilate(fg_mask, kernel, iterations=2)

        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        motion_boxes: list[dict[str, int]] = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 400:
                continue
            x, y, w, h = cv2.boundingRect(contour)
            motion_boxes.append({"x": x, "y": y, "w": w, "h": h})

        return motion_boxes


def image_from_bytes(file_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(file_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img
