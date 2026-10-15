

import asyncio
import base64
import json
import logging
import os
import time
from contextlib import asynccontextmanager

import cv2
import jwt
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision

# ---------------------------------------------------------------------------
# Configuration & Auth
# ---------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "axiocruit-super-secret-development-key-2026")
PROCTORING_REQUIRE_AUTH = os.getenv("PROCTORING_REQUIRE_AUTH", "false").lower() in ("true", "1", "yes")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("proctoring-service")

# ---------------------------------------------------------------------------
# MediaPipe FaceLandmarker — loaded once at startup
# ---------------------------------------------------------------------------

# Path to the downloaded model file (must be in the same directory)
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "face_landmarker.task")

# We'll hold the FaceLandmarker instance in a module-level variable so it can
# be reused across WebSocket connections.
face_landmarker_instance = None
landmarker_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for the FastAPI app."""
    global face_landmarker_instance
    logger.info("Loading MediaPipe FaceLandmarker model...")

    if not os.path.exists(MODEL_PATH):
        logger.error(
            "FaceLandmarker model not found at %s. "
            "Please download it from: "
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
            "face_landmarker/float16/1/face_landmarker.task",
            MODEL_PATH,
        )
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    options = vision.FaceLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=vision.RunningMode.IMAGE,
        num_faces=4,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
    )
    face_landmarker_instance = vision.FaceLandmarker.create_from_options(options)
    logger.info("MediaPipe FaceLandmarker loaded successfully.")
    yield
    # Cleanup
    if face_landmarker_instance:
        try:
            face_landmarker_instance.close()
        except Exception:
            pass
        face_landmarker_instance = None
    logger.info("Proctoring service shut down.")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(title="Axiocruit Proctoring Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Landmark Indices (MediaPipe Face Mesh 478 landmarks)
# ---------------------------------------------------------------------------
# Left eye corners
LEFT_EYE_INNER = 133   # Inner corner of the left eye
LEFT_EYE_OUTER = 33    # Outer corner of the left eye
LEFT_EYE_UPPER = 159   # Upper eyelid midpoint
LEFT_EYE_LOWER = 145   # Lower eyelid midpoint
LEFT_IRIS_CENTER = 468  # Center of the left iris

# Right eye corners
RIGHT_EYE_INNER = 362  # Inner corner of the right eye
RIGHT_EYE_OUTER = 263  # Outer corner of the right eye
RIGHT_EYE_UPPER = 386  # Upper eyelid midpoint
RIGHT_EYE_LOWER = 374  # Lower eyelid midpoint
RIGHT_IRIS_CENTER = 473 # Center of the right iris

# Gaze thresholds (tuned for typical webcam distances)
H_LEFT_THRESHOLD = 0.65    # Horizontal ratio above this → looking LEFT
H_RIGHT_THRESHOLD = 0.35   # Horizontal ratio below this → looking RIGHT
V_UP_THRESHOLD = 0.30      # Vertical ratio below this → looking UP
V_DOWN_THRESHOLD = 0.70    # Vertical ratio above this → looking DOWN


# ---------------------------------------------------------------------------
# Gaze Computation (with Dynamic Baseline Calibration)
# ---------------------------------------------------------------------------
def compute_gaze(
    landmarks,
    img_w: int,
    img_h: int,
    baseline_h: float = 0.5,
    baseline_v: float = 0.5,
) -> dict:
    """
    Compute gaze direction from MediaPipe FaceLandmarker landmarks,
    adjusted relative to a calibrated user baseline.

    Parameters
    ----------
    landmarks : list of NormalizedLandmark
        The 478 facial landmarks from FaceLandmarker.
    img_w, img_h : int
        Dimensions of the source image.
    baseline_h, baseline_v : float
        Calibrated center offsets for the user's camera angle (defaults to 0.5, 0.5).

    Returns
    -------
    dict with keys:
        gaze      : str   — "center", "left", "right", "up", or "down"
        h_ratio   : float — calibrated horizontal iris position ratio
        v_ratio   : float — calibrated vertical iris position ratio
        raw_h     : float — uncalibrated raw horizontal ratio
        raw_v     : float — uncalibrated raw vertical ratio
    """
    # Check if we have enough landmarks for iris detection (need 478)
    if len(landmarks) < 474:
        return {
            "gaze": "unknown",
            "h_ratio": 0.5,
            "v_ratio": 0.5,
            "raw_h": 0.5,
            "raw_v": 0.5,
        }

    # --- Helper: get (x, y) for a given landmark index ---
    def pt(idx):
        return (landmarks[idx].x * img_w, landmarks[idx].y * img_h)

    # ── LEFT EYE ──────────────────────────────────────────────────────
    l_inner = pt(LEFT_EYE_INNER)
    l_outer = pt(LEFT_EYE_OUTER)
    l_upper = pt(LEFT_EYE_UPPER)
    l_lower = pt(LEFT_EYE_LOWER)
    l_iris  = pt(LEFT_IRIS_CENTER)

    # Horizontal ratio for left eye
    l_h_denom = l_inner[0] - l_outer[0]
    l_h_ratio = (l_iris[0] - l_outer[0]) / l_h_denom if abs(l_h_denom) > 1e-6 else 0.5

    # Vertical ratio for left eye
    l_v_denom = l_lower[1] - l_upper[1]
    l_v_ratio = (l_iris[1] - l_upper[1]) / l_v_denom if abs(l_v_denom) > 1e-6 else 0.5

    # ── RIGHT EYE ─────────────────────────────────────────────────────
    r_inner = pt(RIGHT_EYE_INNER)
    r_outer = pt(RIGHT_EYE_OUTER)
    r_upper = pt(RIGHT_EYE_UPPER)
    r_lower = pt(RIGHT_EYE_LOWER)
    r_iris  = pt(RIGHT_IRIS_CENTER)

    # Horizontal ratio for right eye
    r_h_denom = r_outer[0] - r_inner[0]
    r_h_ratio = (r_iris[0] - r_inner[0]) / r_h_denom if abs(r_h_denom) > 1e-6 else 0.5

    # Vertical ratio for right eye
    r_v_denom = r_lower[1] - r_upper[1]
    r_v_ratio = (r_iris[1] - r_upper[1]) / r_v_denom if abs(r_v_denom) > 1e-6 else 0.5

    # ── AVERAGE BOTH EYES ─────────────────────────────────────────────
    raw_h = (l_h_ratio + r_h_ratio) / 2.0
    raw_v = (l_v_ratio + r_v_ratio) / 2.0

    # ── CALIBRATE OFFSETS RELATIVE TO USER BASELINE ────────────────────
    calibrated_h = max(0.0, min(1.0, raw_h - (baseline_h - 0.5)))
    calibrated_v = max(0.0, min(1.0, raw_v - (baseline_v - 0.5)))

    # ── DETERMINE GAZE LABEL ──────────────────────────────────────────
    # Vertical extremes take priority (looking up/down is more suspicious)
    if calibrated_v < V_UP_THRESHOLD:
        gaze = "up"
    elif calibrated_v > V_DOWN_THRESHOLD:
        gaze = "down"
    elif calibrated_h < H_RIGHT_THRESHOLD:
        gaze = "right"
    elif calibrated_h > H_LEFT_THRESHOLD:
        gaze = "left"
    else:
        gaze = "center"

    return {
        "gaze": gaze,
        "h_ratio": round(calibrated_h, 3),
        "v_ratio": round(calibrated_v, 3),
        "raw_h": round(raw_h, 3),
        "raw_v": round(raw_v, 3),
    }


# ---------------------------------------------------------------------------
# WebSocket Endpoint — /ws/proctor
# ---------------------------------------------------------------------------
@app.websocket("/ws/proctor")
async def proctor_ws(ws: WebSocket):
    """
    WebSocket endpoint for real-time proctoring with JWT auth,
    direct binary frame ingestion, gaze calibration, and bounded backpressure.

    Protocol
    --------
    Client sends JSON or Binary messages:
        - JSON: { "type": "frame", "data": "<base64-encoded JPEG>" }
        - JSON: { "type": "calibrate", "samples": 5 }
        - JSON: { "type": "set_baseline", "baseline_h": 0.5, "baseline_v": 0.5 }
        - Binary: Raw JPEG image bytes

    Server responds with JSON:
        {
            "type": "gaze_result",
            "gaze": "center" | "left" | "right" | "up" | "down",
            "face_detected": true | false,
            "h_ratio": 0.512,
            "v_ratio": 0.481,
            "dropped_frames": 0,
            "timestamp": 1709570400.123
        }
    """
    token = ws.query_params.get("token")
    authenticated_user = None

    if PROCTORING_REQUIRE_AUTH:
        if not token:
            logger.warning("[Proctor WS] Connection rejected: Missing authentication token")
            await ws.close(code=4401, reason="Unauthorized: Missing token")
            return
        try:
            authenticated_user = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except Exception as auth_err:
            logger.warning("[Proctor WS] Connection rejected: Invalid token (%s)", auth_err)
            await ws.close(code=4401, reason="Unauthorized: Invalid token")
            return
    else:
        if token:
            try:
                authenticated_user = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                logger.info("[Proctor WS] Session authenticated for user: %s (%s)", authenticated_user.get("id"), authenticated_user.get("role"))
            except Exception:
                pass

    await ws.accept()
    logger.info("Proctoring WebSocket client connected. (Auth=%s)", bool(authenticated_user))

    # Connection-level calibration & backpressure state
    baseline_h = 0.5
    baseline_v = 0.5
    calibration_active = False
    calibration_target = 0
    calibration_samples = []

    is_processing_frame = False
    dropped_frames = 0

    try:
        while True:
            try:
                message = await ws.receive()
            except WebSocketDisconnect:
                break
            except Exception as recv_err:
                logger.info("[Proctor WS] Receive closed: %s", recv_err)
                break

            msg_type = message.get("type")
            if msg_type == "websocket.disconnect":
                break

            frame_bytes = None
            json_msg = None

            if "bytes" in message and message["bytes"]:
                # Direct binary frame transmission (high efficiency, zero base64 overhead)
                frame_bytes = message["bytes"]
            elif "text" in message and message["text"]:
                try:
                    json_msg = json.loads(message["text"])
                except json.JSONDecodeError:
                    await ws.send_json({"type": "error", "detail": "Invalid JSON"})
                    continue

                msg_action = json_msg.get("type")
                if msg_action == "ping":
                    await ws.send_json({"type": "pong", "timestamp": time.time()})
                    continue
                elif msg_action == "calibrate":
                    calibration_active = True
                    calibration_target = int(json_msg.get("samples", 5))
                    calibration_samples = []
                    await ws.send_json({
                        "type": "calibration_started",
                        "target_samples": calibration_target,
                    })
                    continue
                elif msg_action == "set_baseline":
                    baseline_h = float(json_msg.get("baseline_h", 0.5))
                    baseline_v = float(json_msg.get("baseline_v", 0.5))
                    await ws.send_json({
                        "type": "baseline_updated",
                        "baseline_h": baseline_h,
                        "baseline_v": baseline_v,
                    })
                    continue
                elif msg_action == "auth" and not authenticated_user:
                    auth_token = json_msg.get("token")
                    try:
                        authenticated_user = jwt.decode(auth_token, JWT_SECRET, algorithms=["HS256"])
                        await ws.send_json({"type": "auth_success", "user_id": authenticated_user.get("id")})
                    except Exception as e:
                        if PROCTORING_REQUIRE_AUTH:
                            await ws.close(code=4401, reason="Unauthorized: Invalid token in auth message")
                            return
                        else:
                            await ws.send_json({"type": "auth_error", "detail": str(e)})
                    continue

                # Extract frame data supporting {type: "frame", data}, {image, timestamp}, or {frame}
                frame_b64 = json_msg.get("data") or json_msg.get("image") or json_msg.get("frame") or ""
                if not frame_b64 and msg_action != "frame":
                    await ws.send_json({"type": "error", "detail": "Unknown message type or missing frame data"})
                    continue

                if not frame_b64:
                    logger.info("[Frame] Empty frame data received — skipping.")
                    await ws.send_json({
                        "type": "gaze_result",
                        "gaze": "unknown",
                        "face_detected": False,
                        "multiple_faces": False,
                        "looking_away": True,
                        "phone_detected": False,
                        "alerts": ["face_lost"],
                        "h_ratio": None,
                        "v_ratio": None,
                        "dropped_frames": dropped_frames,
                        "timestamp": time.time(),
                    })
                    continue

                # Sanitize & Decode Base64 JPEG
                try:
                    if "," in frame_b64:
                        frame_b64 = frame_b64.split(",", 1)[1]
                    frame_b64 = frame_b64.strip()
                    frame_b64 += "=" * ((4 - len(frame_b64) % 4) % 4)
                    frame_bytes = base64.b64decode(frame_b64)
                except Exception as b64_err:
                    logger.warning("Base64 decode error: %s", b64_err)
                    await ws.send_json({
                        "type": "gaze_result",
                        "gaze": "unknown",
                        "face_detected": False,
                        "multiple_faces": False,
                        "looking_away": True,
                        "phone_detected": False,
                        "alerts": ["decode_error"],
                        "h_ratio": None,
                        "v_ratio": None,
                        "dropped_frames": dropped_frames,
                        "timestamp": time.time(),
                    })
                    continue

            if not frame_bytes:
                continue

            # ── Bounded Frame Backpressure: Skip frame if previous is still inferring ──
            if is_processing_frame:
                dropped_frames += 1
                continue

            is_processing_frame = True
            try:
                np_arr = np.frombuffer(frame_bytes, dtype=np.uint8)
                frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                # Guard against None, empty, or zero-dimension images
                if frame_bgr is None or frame_bgr.size == 0 or frame_bgr.shape[0] == 0 or frame_bgr.shape[1] == 0:
                    await ws.send_json({
                        "type": "gaze_result",
                        "gaze": "unknown",
                        "face_detected": False,
                        "multiple_faces": False,
                        "looking_away": True,
                        "phone_detected": False,
                        "alerts": ["empty_frame"],
                        "h_ratio": None,
                        "v_ratio": None,
                        "dropped_frames": dropped_frames,
                        "timestamp": time.time(),
                    })
                    continue

                # ── Run MediaPipe FaceLandmarker (under Lock to avoid concurrent C++ race) ─
                img_h, img_w = frame_bgr.shape[:2]
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

                try:
                    async with landmarker_lock:
                        results = await asyncio.to_thread(
                            face_landmarker_instance.detect, mp_image
                        )
                except Exception as det_err:
                    logger.warning("[Frame] MediaPipe detect error: %s", det_err)
                    await ws.send_json({
                        "type": "gaze_result",
                        "gaze": "unknown",
                        "face_detected": False,
                        "multiple_faces": False,
                        "looking_away": True,
                        "phone_detected": False,
                        "alerts": ["detection_error"],
                        "h_ratio": None,
                        "v_ratio": None,
                        "dropped_frames": dropped_frames,
                        "timestamp": time.time(),
                    })
                    continue

                if not results or not results.face_landmarks:
                    await ws.send_json({
                        "type": "gaze_result",
                        "gaze": "away",
                        "face_detected": False,
                        "multiple_faces": False,
                        "looking_away": True,
                        "phone_detected": False,
                        "alerts": ["face_lost"],
                        "h_ratio": None,
                        "v_ratio": None,
                        "dropped_frames": dropped_frames,
                        "timestamp": time.time(),
                    })
                    continue

                # Process faces
                num_detected = len(results.face_landmarks)
                multiple_faces = num_detected > 1
                face_landmarks = results.face_landmarks[0]

                # Check if calibration sample is being collected
                if calibration_active:
                    raw_gaze = compute_gaze(face_landmarks, img_w, img_h, baseline_h=0.5, baseline_v=0.5)
                    calibration_samples.append((raw_gaze["h_ratio"], raw_gaze["v_ratio"]))
                    if len(calibration_samples) >= calibration_target:
                        baseline_h = sum(h for h, v in calibration_samples) / len(calibration_samples)
                        baseline_v = sum(v for h, v in calibration_samples) / len(calibration_samples)
                        calibration_active = False
                        logger.info("[Proctor] Calibration complete: baseline_h=%.3f, baseline_v=%.3f", baseline_h, baseline_v)
                        await ws.send_json({
                            "type": "calibration_complete",
                            "baseline_h": round(baseline_h, 3),
                            "baseline_v": round(baseline_v, 3),
                            "samples": len(calibration_samples),
                        })
                    else:
                        await ws.send_json({
                            "type": "calibration_progress",
                            "collected": len(calibration_samples),
                            "target": calibration_target,
                        })
                    continue

                # Calibrated gaze calculation
                gaze_info = compute_gaze(face_landmarks, img_w, img_h, baseline_h, baseline_v)
                looking_away = gaze_info["gaze"] != "center"

                alerts = []
                if multiple_faces:
                    alerts.append("multiple_faces")
                if looking_away:
                    alerts.append("looking_away")

                logger.info(
                    "[Frame] Gaze: %s (calibrated h=%.3f, v=%.3f | raw h=%.3f, v=%.3f) | faces=%d | dropped=%d | alerts=%s",
                    gaze_info["gaze"], gaze_info["h_ratio"], gaze_info["v_ratio"],
                    gaze_info["raw_h"], gaze_info["raw_v"],
                    num_detected, dropped_frames, alerts,
                )

                await ws.send_json({
                    "type": "gaze_result",
                    "gaze": gaze_info["gaze"],
                    "face_detected": True,
                    "multiple_faces": multiple_faces,
                    "looking_away": looking_away,
                    "phone_detected": False,
                    "alerts": alerts,
                    "h_ratio": gaze_info["h_ratio"],
                    "v_ratio": gaze_info["v_ratio"],
                    "dropped_frames": dropped_frames,
                    "timestamp": time.time(),
                })
            finally:
                is_processing_frame = False

    except WebSocketDisconnect:
        logger.info("Proctoring WebSocket client disconnected.")
    except Exception as e:
        logger.error("Proctoring WebSocket error: %s", e)
        try:
            reason_str = str(e)[:120] if e else None
            await ws.close(code=1011, reason=reason_str)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "proctoring",
        "face_landmarker_loaded": face_landmarker_instance is not None,
    }


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
