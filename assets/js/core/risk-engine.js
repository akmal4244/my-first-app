/*
 * File Path: assets/js/core/risk-engine.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
export const RISK_LEVELS = Object.freeze([
  {
    code: "low",
    label: "Rendah",
    rank: 1,
    minScore: 1,
    maxScore: 4,
    color: "#047857",
    defaultDueDays: 180
  },
  {
    code: "medium",
    label: "Sederhana",
    rank: 2,
    minScore: 5,
    maxScore: 8,
    color: "#b7791f",
    defaultDueDays: 90
  },
  {
    code: "high",
    label: "Tinggi",
    rank: 3,
    minScore: 9,
    maxScore: 12,
    color: "#b91c1c",
    defaultDueDays: 30
  },
  {
    code: "critical",
    label: "Kritikal",
    rank: 4,
    minScore: 13,
    maxScore: 16,
    color: "#7f1d1d",
    defaultDueDays: 7
  }
]);

export function validateRiskInput(likelihood, impact) {
  const parsedLikelihood = Number(likelihood);
  const parsedImpact = Number(impact);

  if (!Number.isInteger(parsedLikelihood)) {
    throw new Error("Kemungkinan mesti nombor.");
  }
  if (!Number.isInteger(parsedImpact)) {
    throw new Error("Kesan mesti nombor.");
  }
  if (parsedLikelihood < 1 || parsedLikelihood > 4) {
    throw new Error("Kemungkinan mesti antara 1 hingga 4.");
  }
  if (parsedImpact < 1 || parsedImpact > 4) {
    throw new Error("Kesan mesti antara 1 hingga 4.");
  }

  return {
    likelihood: parsedLikelihood,
    impact: parsedImpact
  };
}

export function getRiskLevel(score) {
  const parsedScore = Number(score);

  if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 16) {
    throw new Error("Skor risiko mesti antara 1 hingga 16.");
  }

  return RISK_LEVELS.find((level) => (
    parsedScore >= level.minScore && parsedScore <= level.maxScore
  ));
}

export function calculateRisk(likelihood, impact) {
  const valid = validateRiskInput(likelihood, impact);
  const score = valid.likelihood * valid.impact;
  const level = getRiskLevel(score);

  return {
    likelihood: valid.likelihood,
    impact: valid.impact,
    score,
    level: level.label,
    rank: level.rank,
    color: level.color
  };
}

export function summarizeRiskLevels(risks) {
  const counts = Object.fromEntries(RISK_LEVELS.map((level) => [level.label, 0]));
  let scoreTotal = 0;

  risks.forEach((risk) => {
    const level = typeof risk.level === "string" ? risk.level : calculateRisk(risk.likelihood, risk.impact).level;
    const score = Number.isInteger(risk.score) ? risk.score : calculateRisk(risk.likelihood, risk.impact).score;
    if (Object.hasOwn(counts, level)) counts[level] += 1;
    scoreTotal += score;
  });

  const total = risks.length;
  const highAndCriticalCount = counts.Tinggi + counts.Kritikal;
  const highAndCriticalPercent = total ? Math.round((highAndCriticalCount / total) * 100) : 0;
  const averageScore = total ? Number((scoreTotal / total).toFixed(2)) : 0;
  const overallLevel = chooseOverallLevel(counts);

  return {
    total,
    counts,
    highAndCriticalCount,
    highAndCriticalPercent,
    averageScore,
    overallLevel
  };
}

export function summarizeRiskCategories(findings) {
  const total = findings.length;
  const categories = new Map();

  findings.forEach((finding) => {
    const category = String(finding.category || finding.risk_category || "Tidak dikategorikan").trim();
    const risk = finding.level
      ? { level: finding.level, rank: getRankForLevel(finding.level) }
      : calculateRisk(finding.likelihood, finding.impact);
    const current = categories.get(category) || {
      category,
      issueCount: 0,
      percentOfTotal: 0,
      levels: Object.fromEntries(RISK_LEVELS.map((level) => [level.label, 0])),
      categoryLevel: "Rendah",
      categoryRank: 1
    };

    current.issueCount += 1;
    if (Object.hasOwn(current.levels, risk.level)) current.levels[risk.level] += 1;
    if (risk.rank > current.categoryRank) {
      current.categoryLevel = risk.level;
      current.categoryRank = risk.rank;
    }
    categories.set(category, current);
  });

  return [...categories.values()]
    .map((category) => ({
      ...category,
      percentOfTotal: total ? Number(((category.issueCount / total) * 100).toFixed(2)) : 0
    }))
    .sort((left, right) => right.categoryRank - left.categoryRank || right.issueCount - left.issueCount);
}

function chooseOverallLevel(counts) {
  return RISK_LEVELS.reduce((selected, level) => {
    const currentCount = counts[level.label] || 0;
    const selectedCount = counts[selected.label] || 0;

    if (currentCount > selectedCount) return level;
    if (currentCount === selectedCount && currentCount > 0 && level.rank > selected.rank) return level;
    return selected;
  }, RISK_LEVELS[0]).label;
}

function getRankForLevel(label) {
  return RISK_LEVELS.find((level) => level.label === label)?.rank || 1;
}
