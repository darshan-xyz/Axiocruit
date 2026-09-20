/**
 * Procruit E2E Test Suite - API & Microservice Probe Engine
 * Supports live network verification with graceful simulation fallback
 */

import http from 'http';

export async function probeUrl(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'GET',
          timeout: timeoutMs
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve({ alive: true, statusCode: res.statusCode, body: json });
            } catch {
              resolve({ alive: true, statusCode: res.statusCode, body: data });
            }
          });
        }
      );

      req.on('error', (err) => {
        resolve({ alive: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ alive: false, error: 'Connection timed out' });
      });

      req.end();
    } catch (e) {
      resolve({ alive: false, error: e.message });
    }
  });
}

export function simulateReadyResponse() {
  return {
    status: 'ready',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: { status: 'healthy', type: 'mongodb' },
      aiService: { status: 'healthy', url: 'http://localhost:8002' },
      proctoringService: { status: 'healthy', url: 'http://localhost:8001' }
    }
  };
}

export function simulateParseCVResponse(candidateName, experienceYears, skills) {
  const matched = skills.slice(0, Math.ceil(skills.length * 0.8));
  const missing = skills.slice(Math.ceil(skills.length * 0.8));
  return {
    suitability_score: 83,
    candidate_name: candidateName,
    experience_years: experienceYears,
    matched_keywords: matched,
    missing_keywords: missing,
    ai_summary: `${candidateName} demonstrates strong alignment with core technical requirements and exemplary domain depth.`
  };
}

export function simulateGazeFrame(gazeType = 'center') {
  return {
    type: 'gaze_result',
    timestamp: Date.now(),
    gaze: gazeType,
    face_detected: true,
    confidence: 0.96
  };
}
