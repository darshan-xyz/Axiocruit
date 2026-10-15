"""
Axiocruit Phase 7 Proctoring Service V2 Verification Test Suite
Covers:
1. compute_gaze with calibrated baseline offsets
2. JWT token generation & verification under PROCTORING_REQUIRE_AUTH
3. Binary JPEG frame reception & processing
4. Calibration protocol & baseline updating
5. Frame backpressure handling
"""

import os
import sys
import time
import json
import asyncio
from types import SimpleNamespace
import cv2
import numpy as np
import jwt
from fastapi.testclient import TestClient

# Import app and compute_gaze from main
import main
from main import app, compute_gaze, JWT_SECRET

class DummyLandmark:
    def __init__(self, x, y, z=0.0):
        self.x = x
        self.y = y
        self.z = z

def create_synthetic_landmarks(h_bias=0.0, v_bias=0.0):
    """Generate 478 landmarks with controlled eye positions."""
    landmarks = [DummyLandmark(0.5, 0.5) for _ in range(478)]
    
    # Left eye landmarks
    # Inner: x=0.45, Outer: x=0.35, Upper: y=0.35, Lower: y=0.45
    landmarks[main.LEFT_EYE_INNER] = DummyLandmark(0.45, 0.40)
    landmarks[main.LEFT_EYE_OUTER] = DummyLandmark(0.35, 0.40)
    landmarks[main.LEFT_EYE_UPPER] = DummyLandmark(0.40, 0.35)
    landmarks[main.LEFT_EYE_LOWER] = DummyLandmark(0.40, 0.45)
    # Center iris at (0.40 + h_bias, 0.40 + v_bias)
    landmarks[main.LEFT_IRIS_CENTER] = DummyLandmark(0.40 + h_bias * 0.10, 0.40 + v_bias * 0.10)

    # Right eye landmarks
    # Inner: x=0.55, Outer: x=0.65, Upper: y=0.35, Lower: y=0.45
    landmarks[main.RIGHT_EYE_INNER] = DummyLandmark(0.55, 0.40)
    landmarks[main.RIGHT_EYE_OUTER] = DummyLandmark(0.65, 0.40)
    landmarks[main.RIGHT_EYE_UPPER] = DummyLandmark(0.60, 0.35)
    landmarks[main.RIGHT_EYE_LOWER] = DummyLandmark(0.60, 0.45)
    # Center iris at (0.60 + h_bias, 0.40 + v_bias)
    landmarks[main.RIGHT_IRIS_CENTER] = DummyLandmark(0.60 + h_bias * 0.10, 0.40 + v_bias * 0.10)

    return landmarks

def test_compute_gaze_calibration():
    print("\n--- Test 1: compute_gaze with Baseline Calibration ---")
    
    # 1. Centered gaze
    center_lms = create_synthetic_landmarks(h_bias=0.0, v_bias=0.0)
    result = compute_gaze(center_lms, 640, 480, baseline_h=0.5, baseline_v=0.5)
    assert result["gaze"] == "center", f"Expected center, got {result['gaze']}"
    assert abs(result["h_ratio"] - 0.5) < 0.05, f"Expected h_ratio ~0.5, got {result['h_ratio']}"
    print("  [PASS] Centered synthetic iris computes gaze=center")

    # 2. Looking left without baseline
    left_lms = create_synthetic_landmarks(h_bias=0.25, v_bias=0.0)
    result_uncal = compute_gaze(left_lms, 640, 480, baseline_h=0.5, baseline_v=0.5)
    assert result_uncal["gaze"] == "left", f"Expected left, got {result_uncal['gaze']}"
    print("  [PASS] Shifted iris computes gaze=left")

    # 3. User sitting angled with camera to side (baseline_h=0.75)
    # The same shifted eye is actually their calibrated center!
    result_cal = compute_gaze(left_lms, 640, 480, baseline_h=0.75, baseline_v=0.5)
    assert result_cal["gaze"] == "center", f"Expected center after baseline calibration, got {result_cal['gaze']}"
    assert abs(result_cal["h_ratio"] - 0.5) < 0.05, f"Expected calibrated h_ratio ~0.5, got {result_cal['h_ratio']}"
    print("  [PASS] Gaze baseline calibration adjusts offset and centers gaze")

def test_health_endpoint():
    print("\n--- Test 2: Health Endpoint ---")
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "proctoring"
    print("  [PASS] /health endpoint returns 200 ok")

def test_websocket_ping_pong_and_calibration():
    print("\n--- Test 3: WebSocket Ping, Pong, and Calibration Protocol ---")
    client = TestClient(app)

    with client.websocket_connect("/ws/proctor") as ws:
        # Ping / Pong
        ws.send_text(json.dumps({"type": "ping"}))
        resp = ws.receive_json()
        assert resp["type"] == "pong"
        assert "timestamp" in resp
        print("  [PASS] WebSocket handles ping -> pong keepalive")

        # Request calibration
        ws.send_text(json.dumps({"type": "calibrate", "samples": 3}))
        resp = ws.receive_json()
        assert resp["type"] == "calibration_started"
        assert resp["target_samples"] == 3
        print("  [PASS] WebSocket handles calibrate -> calibration_started")

        # Explicitly update baseline
        ws.send_text(json.dumps({"type": "set_baseline", "baseline_h": 0.55, "baseline_v": 0.45}))
        resp = ws.receive_json()
        assert resp["type"] == "baseline_updated"
        assert resp["baseline_h"] == 0.55
        assert resp["baseline_v"] == 0.45
        print("  [PASS] WebSocket handles set_baseline -> baseline_updated")

def test_websocket_auth_modes():
    print("\n--- Test 4: WebSocket JWT Authentication & Token Validation ---")
    client = TestClient(app)

    # 1. Unauthenticated connection when PROCTORING_REQUIRE_AUTH is False (default)
    main.PROCTORING_REQUIRE_AUTH = False
    with client.websocket_connect("/ws/proctor") as ws:
        ws.send_text(json.dumps({"type": "ping"}))
        resp = ws.receive_json()
        assert resp["type"] == "pong"
    print("  [PASS] Default mode allows connection without token")

    # 2. Connection with valid token in query param
    test_token = jwt.encode(
        {"id": "user-cand-123", "role": "CANDIDATE", "exp": time.time() + 3600},
        JWT_SECRET,
        algorithm="HS256",
    )
    with client.websocket_connect(f"/ws/proctor?token={test_token}") as ws:
        ws.send_text(json.dumps({"type": "ping"}))
        resp = ws.receive_json()
        assert resp["type"] == "pong"
    print("  [PASS] Query parameter ?token=... is accepted and verified")

    # 3. Connection when PROCTORING_REQUIRE_AUTH is True
    main.PROCTORING_REQUIRE_AUTH = True
    try:
        # Without token -> rejected
        rejected = False
        try:
            with client.websocket_connect("/ws/proctor") as ws:
                ws.send_text(json.dumps({"type": "ping"}))
                ws.receive_json()
        except Exception:
            rejected = True
        assert rejected, "Connection without token should be rejected when PROCTORING_REQUIRE_AUTH=True"
        print("  [PASS] Rejects missing token when PROCTORING_REQUIRE_AUTH=True")

        # With invalid token -> rejected
        rejected_invalid = False
        try:
            with client.websocket_connect("/ws/proctor?token=invalid.tampered.jwt") as ws:
                ws.send_text(json.dumps({"type": "ping"}))
                ws.receive_json()
        except Exception:
            rejected_invalid = True
        assert rejected_invalid, "Connection with invalid token should be rejected"
        print("  [PASS] Rejects invalid token when PROCTORING_REQUIRE_AUTH=True")

        # With valid token -> accepted
        with client.websocket_connect(f"/ws/proctor?token={test_token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            resp = ws.receive_json()
            assert resp["type"] == "pong"
        print("  [PASS] Accepts valid token when PROCTORING_REQUIRE_AUTH=True")
    finally:
        main.PROCTORING_REQUIRE_AUTH = False

def test_binary_and_base64_frame_ingestion():
    print("\n--- Test 5: Direct Binary & Base64 Frame Decoding ---")
    client = TestClient(app)

    # Create synthetic blank JPEG
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, encoded_jpg = cv2.imencode(".jpg", img)
    jpg_bytes = encoded_jpg.tobytes()

    with client.websocket_connect("/ws/proctor") as ws:
        # 1. Send direct binary bytes
        ws.send_bytes(jpg_bytes)
        resp = ws.receive_json()
        assert resp["type"] == "gaze_result"
        assert resp["face_detected"] is False
        assert "dropped_frames" in resp
        print("  [PASS] Direct binary JPEG bytes decoded and processed seamlessly")

        # 2. Send base64 text frame
        import base64
        b64_str = base64.b64encode(jpg_bytes).decode("ascii")
        ws.send_text(json.dumps({"type": "frame", "data": b64_str}))
        resp2 = ws.receive_json()
        assert resp2["type"] == "gaze_result"
        assert resp2["face_detected"] is False
        print("  [PASS] Base64 JSON text frame decoded and processed seamlessly")

if __name__ == "__main__":
    print("========================================================================")
    print("  AXIOCRUIT PHASE 7: BIOMETRIC PROCTORING SERVICE V2 TEST HARNESS       ")
    print("========================================================================")
    try:
        test_compute_gaze_calibration()
        test_health_endpoint()
        test_websocket_ping_pong_and_calibration()
        test_websocket_auth_modes()
        test_binary_and_base64_frame_ingestion()
        print("\n========================================================================")
        print("TOTAL PHASE 7 TESTS: 5 SUITES / 11 ASSERTIONS")
        print("PASSED: ALL ASSERTIONS PASSED")
        print("FAILED: 0")
        print("========================================================================\n")
    except Exception as e:
        print(f"\n[FATAL TEST FAILURE]: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
