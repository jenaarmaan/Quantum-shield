/**
 * Report Generation Engine: JSON, CSV, and HTML Export
 */

import { DecisionEvaluationResult } from '../detection/decision';

export interface ExperimentReportData {
  experimentId: string;
  timestamp: string;
  config: {
    message: string;
    protocol: string;
    protocolVersion: string;
    nQubits: number;
    noiseModel: string;
    noiseRate: number;
    attackType: string;
    attackStrength: number;
    alpha: number;
    beta: number;
    verifierId: string;
    seed: number;
  };
  results: DecisionEvaluationResult;
  auditHash?: string;
  previousAuditHash?: string;
  softwareVersion: string;
  detectorVersion: string;
  status: 'THEORETICAL' | 'SIMULATED' | 'EMPIRICALLY_VALIDATED';
}

export class ReportGenerator {
  static toJSON(data: ExperimentReportData): string {
    return JSON.stringify(data, null, 2);
  }

  static toCSV(data: ExperimentReportData): string {
    const headers = [
      'Experiment_ID',
      'Timestamp',
      'Protocol',
      'Version',
      'Qubits',
      'Noise_Model',
      'Noise_Rate',
      'Attack_Type',
      'Attack_Strength',
      'Observed_QBER',
      'Baseline_p0',
      'Threshold_Rate',
      'Mismatches',
      'Threshold_Count',
      'P_Value',
      'Z_Score',
      'Verdict',
      'Threat_Classification',
      'Seed',
      'Status'
    ];

    const row = [
      `"${data.experimentId}"`,
      `"${data.timestamp}"`,
      `"${data.config.protocol}"`,
      `"${data.config.protocolVersion}"`,
      data.config.nQubits,
      `"${data.config.noiseModel}"`,
      data.config.noiseRate.toFixed(4),
      `"${data.config.attackType}"`,
      data.config.attackStrength.toFixed(2),
      data.results.qber.toFixed(4),
      data.results.p0.toFixed(4),
      data.results.thresholdRate.toFixed(4),
      data.results.mismatches,
      data.results.threshold,
      data.results.pValue.toExponential(4),
      data.results.zscore.z.toFixed(2),
      `"${data.results.verdict}"`,
      `"${data.results.threatType}"`,
      data.config.seed,
      `"${data.status}"`
    ];

    return `${headers.join(',')}\n${row.join(',')}`;
  }

  static toHTML(data: ExperimentReportData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QuantumShield Security Evaluation Report - ${data.experimentId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #07090E; color: #E2E8F0; padding: 40px; margin: 0; line-height: 1.5; }
    .container { max-width: 900px; margin: 0 auto; background: #0F172A; border: 1px solid #1E293B; border-radius: 8px; padding: 32px; }
    h1 { color: #38BDF8; font-size: 24px; margin-top: 0; border-bottom: 1px solid #1E293B; padding-bottom: 12px; }
    h2 { color: #94A3B8; font-size: 16px; margin-top: 24px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 13px; }
    .badge-reject { background: #E11D48; color: white; }
    .badge-accept { background: #059669; color: white; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
    .item { background: #1E293B; padding: 12px; border-radius: 4px; border: 1px solid #334155; }
    .label { color: #94A3B8; font-size: 12px; text-transform: uppercase; }
    .val { color: white; font-size: 16px; font-family: monospace; font-weight: 600; margin-top: 4px; }
    .exp { background: #1E293B; border-left: 4px solid #38BDF8; padding: 14px; margin-top: 16px; font-size: 14px; }
    .audit { font-family: monospace; font-size: 12px; color: #94A3B8; word-break: break-all; margin-top: 24px; border-top: 1px solid #1E293B; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>QuantumShield Security Evaluation Report</h1>
    <div style="margin-bottom: 20px;">
      <span class="badge ${data.results.verdict === 'REJECT' ? 'badge-reject' : 'badge-accept'}">VERDICT: ${data.results.verdict}</span>
      <span style="margin-left: 12px; color: #94A3B8; font-size: 13px;">Classification: <strong>${data.results.threatType}</strong></span>
      <span style="margin-left: 12px; color: #94A3B8; font-size: 13px;">Status: <strong>${data.status}</strong></span>
    </div>

    <h2>1. Physical & Statistical Telemetry</h2>
    <div class="grid">
      <div class="item"><div class="label">Observed QBER</div><div class="val">${(data.results.qber * 100).toFixed(2)}% (${data.results.mismatches} mismatches)</div></div>
      <div class="item"><div class="label">Calibrated Honest Baseline (p0)</div><div class="val">${(data.results.p0 * 100).toFixed(2)}%</div></div>
      <div class="item"><div class="label">Rejection Threshold</div><div class="val">${(data.results.thresholdRate * 100).toFixed(2)}% (${data.results.threshold} bits)</div></div>
      <div class="item"><div class="label">Exact Binomial P-Value</div><div class="val">${data.results.pValue.toExponential(3)} (Z = ${data.results.zscore.z.toFixed(2)})</div></div>
    </div>

    <h2>2. Configuration & Protocol Setup</h2>
    <div class="grid">
      <div class="item"><div class="label">Protocol</div><div class="val">${data.config.protocol} (${data.config.protocolVersion})</div></div>
      <div class="item"><div class="label">Signature Qubits</div><div class="val">${data.config.nQubits} qubits</div></div>
      <div class="item"><div class="label">Noise Model / Rate</div><div class="val">${data.config.noiseModel} / ${(data.config.noiseRate * 100).toFixed(2)}%</div></div>
      <div class="item"><div class="label">Simulated Attack / Strength</div><div class="val">${data.config.attackType} / ${(data.config.attackStrength * 100).toFixed(0)}%</div></div>
    </div>

    <h2>3. Plain-Language Explanation</h2>
    <div class="exp">${data.results.explanation}</div>

    <div class="audit">
      <div><strong>Experiment ID:</strong> ${data.experimentId}</div>
      <div><strong>Random Seed:</strong> ${data.config.seed}</div>
      <div><strong>Audit Record Hash:</strong> ${data.auditHash ?? 'Pending in local chain'}</div>
      <div><strong>Software Version:</strong> ${data.softwareVersion} | <strong>Detector Version:</strong> ${data.detectorVersion}</div>
    </div>
  </div>
</body>
</html>`;
  }
}
