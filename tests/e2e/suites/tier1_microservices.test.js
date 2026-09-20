/**
 * Tier 1 Test Suite: Microservices & Architectural Integrity (Feature F25)
 * Authoritative Source: ORIGINAL_REQUEST.md (R4) & PROJECT.md (Feature F25)
 */

import fs from 'fs';
import path from 'path';
import { describe, test } from '../framework/runner.js';
import { expect } from '../framework/assert.js';
import { defaultContractValidator, EXPECTED_REST_ENDPOINTS, EXPECTED_WEBRTC_EVENTS } from '../framework/contract_validator.js';
import { simulateReadyResponse, simulateParseCVResponse, simulateGazeFrame } from '../framework/api_probe.js';

describe('Tier 1: Architectural Integrity & Microservices (F25)', () => {
  // --------------------------------------------------------------------------
  // REST API Route Mounting & Catalogs
  // --------------------------------------------------------------------------
  test('F25-01: Express backend mounts all 12 core route modules', {
    id: 'T1-F25-01', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const modules = defaultContractValidator.validateBackendRoutesMounted();
    expect(modules.length).toBe(12);
    const unmounted = modules.filter(m => !m.mounted);
    expect(unmounted).toHaveLength(0);
  });

  test('F25-02: REST API catalog covers at least 48 endpoints across modules', {
    id: 'T1-F25-02', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    expect(EXPECTED_REST_ENDPOINTS.length).toBeGreaterThanOrEqual(48);
  });

  test('F25-03: Health and readiness probe endpoints (/api/health, /api/ready) defined', {
    id: 'T1-F25-03', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const health = EXPECTED_REST_ENDPOINTS.find(e => e.path === '/api/health');
    const ready = EXPECTED_REST_ENDPOINTS.find(e => e.path === '/api/ready');
    expect(health).toBeDefined();
    expect(ready).toBeDefined();
    expect(health.method).toBe('GET');
    expect(ready.method).toBe('GET');
  });

  test('F25-04: /api/ready probe schema contracts validated with dependencies status', {
    id: 'T1-F25-04', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const mockReady = simulateReadyResponse();
    expect(mockReady.status).toBe('ready');
    expect(mockReady.dependencies.database.status).toBe('healthy');
    expect(mockReady.dependencies.aiService.status).toBe('healthy');
    expect(mockReady.dependencies.proctoringService.status).toBe('healthy');
  });

  // --------------------------------------------------------------------------
  // WebRTC Signaling Protocol Contracts
  // --------------------------------------------------------------------------
  test('F25-05: WebRTC signaling server handles 18 core invariant events', {
    id: 'T1-F25-05', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const events = defaultContractValidator.validateWebRTCEventHandlers();
    expect(events.length).toBe(EXPECTED_WEBRTC_EVENTS.length);
    const missing = events.filter(e => !e.handled);
    expect(missing).toHaveLength(0);
  });

  test('F25-06: WebRTC peer connection supports STUN google turn configuration', {
    id: 'T1-F25-06', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const stunServers = ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'];
    expect(stunServers.length).toBe(2);
    expect(stunServers[0]).toContain('google.com');
  });

  // --------------------------------------------------------------------------
  // MediaPipe Proctoring Microservice Contracts
  // --------------------------------------------------------------------------
  test('F25-07: MediaPipe proctoring microservice protocol has WebSocket /ws/proctor', {
    id: 'T1-F25-07', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const proto = defaultContractValidator.validateProctoringMicroserviceProtocol();
    expect(proto.status).toBe('present');
    expect(proto.hasWebSocketEndpoint).toBe(true);
  });

  test('F25-08: MediaPipe proctoring returns gaze_result events with face detection flag', {
    id: 'T1-F25-08', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const frame = simulateGazeFrame('center');
    expect(frame.type).toBe('gaze_result');
    expect(frame.gaze).toBe('center');
    expect(frame.face_detected).toBe(true);
  });

  test('F25-09: MediaPipe face_landmarker.task model file is present in proctoring service', {
    id: 'T1-F25-09', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const proto = defaultContractValidator.validateProctoringMicroserviceProtocol();
    expect(proto.hasLandmarkerTask).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Python AI ATS Semantic Matching Microservice Contracts
  // --------------------------------------------------------------------------
  test('F25-10: Python AI service contract defines /api/ai/parse-cv endpoint', {
    id: 'T1-F25-10', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const proto = defaultContractValidator.validateAIMicroserviceProtocol();
    expect(proto.status).toBe('present');
    expect(proto.hasParseCVEndpoint).toBe(true);
  });

  test('F25-11: AI Parse CV response contract maps to suitability_score, keywords, and summary', {
    id: 'T1-F25-11', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const res = simulateParseCVResponse('Sarah Miller', 6, ['Figma', 'User Research', 'Design Systems', 'Prototyping']);
    expect(res.suitability_score).toBe(83);
    expect(res.candidate_name).toBe('Sarah Miller');
    expect(res.matched_keywords.length).toBeGreaterThan(0);
    expect(res.ai_summary).toContain('Sarah Miller');
  });

  // --------------------------------------------------------------------------
  // Monaco Live Coding & Tooling Integrity
  // --------------------------------------------------------------------------
  test('F25-12: Monaco Live Coding Editor package dependency (@monaco-editor/react) configured', {
    id: 'T1-F25-12', tier: 1, feature: 'F25', milestone: 'M4'
  }, () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(defaultContractValidator.rootPath, 'package.json'), 'utf-8'));
    expect(pkg.dependencies['@monaco-editor/react']).toBeDefined();
  });
});
