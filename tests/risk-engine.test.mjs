/*
 * File Path: tests/risk-engine.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRisk,
  getRiskLevel,
  summarizeRiskCategories,
  summarizeRiskLevels,
  validateRiskInput
} from "../assets/js/core/risk-engine.js";

test("calculates the official 1-4 by 1-4 risk score and level", () => {
  assert.deepEqual(calculateRisk(1, 1), {
    likelihood: 1,
    impact: 1,
    score: 1,
    level: "Rendah",
    rank: 1,
    color: "#047857"
  });

  assert.equal(calculateRisk(2, 3).score, 6);
  assert.equal(calculateRisk(2, 3).level, "Sederhana");
  assert.equal(calculateRisk(3, 3).level, "Tinggi");
  assert.equal(calculateRisk(4, 4).level, "Kritikal");
});

test("rejects likelihood and impact values outside 1-4", () => {
  assert.throws(() => validateRiskInput(0, 2), /Kemungkinan mesti antara 1 hingga 4/);
  assert.throws(() => validateRiskInput(2, 5), /Kesan mesti antara 1 hingga 4/);
  assert.throws(() => calculateRisk("dua", 2), /Kemungkinan mesti nombor/);
});

test("maps scores to configured SPRAD V2 risk levels", () => {
  assert.equal(getRiskLevel(4).label, "Rendah");
  assert.equal(getRiskLevel(5).label, "Sederhana");
  assert.equal(getRiskLevel(9).label, "Tinggi");
  assert.equal(getRiskLevel(16).label, "Kritikal");
  assert.throws(() => getRiskLevel(17), /Skor risiko mesti antara 1 hingga 16/);
});

test("summarizes overall level by mode with higher-level tie break", () => {
  const summary = summarizeRiskLevels([
    calculateRisk(4, 4),
    calculateRisk(3, 3),
    calculateRisk(3, 3),
    calculateRisk(2, 3),
    calculateRisk(2, 4),
    calculateRisk(1, 2)
  ]);

  assert.equal(summary.total, 6);
  assert.equal(summary.highAndCriticalCount, 3);
  assert.equal(summary.highAndCriticalPercent, 50);
  assert.equal(summary.overallLevel, "Tinggi");
  assert.equal(summary.counts.Kritikal, 1);
  assert.equal(summary.counts.Tinggi, 2);
});

test("summarizes category level by highest risk level in the category", () => {
  const categories = summarizeRiskCategories([
    { risk_category: "Kecuaian", likelihood: 3, impact: 3 },
    { risk_category: "Kecuaian", likelihood: 2, impact: 3 },
    { risk_category: "Pembaziran", likelihood: 4, impact: 4 },
    { risk_category: "Pembaziran", likelihood: 1, impact: 2 }
  ]);

  assert.equal(categories[0].category, "Pembaziran");
  assert.equal(categories[0].categoryLevel, "Kritikal");
  assert.equal(categories[0].issueCount, 2);
  assert.equal(categories[0].percentOfTotal, 50);
  assert.equal(categories[1].categoryLevel, "Tinggi");
});
