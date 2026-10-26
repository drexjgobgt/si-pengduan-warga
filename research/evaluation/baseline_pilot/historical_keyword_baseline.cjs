const categoryKeywords = {
  sampah: {
    keywords: [
      "sampah",
      "limbah",
      "tps",
      "tpa",
      "bau",
      "kotor",
      "tidak diangkut",
      "menumpuk",
      "pemulung",
      "kebersihan",
      "jorok",
      "busuk",
      "kering",
      "basah",
      "organik",
      "plastik",
      "tong sampah",
      "tempat sampah",
    ],
    weight: 3,
  },
  jalan_rusak: {
    keywords: [
      "jalan",
      "aspal",
      "lubang",
      "rusak",
      "berlubang",
      "retak",
      "tidak rata",
      "paving",
      "trotoar",
      "jalanan",
      "bolong",
      "bopeng",
      "amblas",
      "turun",
      "gang",
      "jembatan",
      "jalan raya",
    ],
    weight: 3,
  },
  banjir: {
    keywords: [
      "banjir",
      "genangan",
      "air",
      "drainase",
      "got",
      "selokan",
      "tersumbat",
      "meluap",
      "hujan",
      "terendam",
      "macet air",
      "becek",
      "tergenang",
      "saluran air",
      "parit",
    ],
    weight: 3,
  },
  listrik: {
    keywords: [
      "listrik",
      "lampu",
      "penerangan",
      "pln",
      "mati lampu",
      "gelap",
      "padam",
      "korsleting",
      "kabel",
      "tiang listrik",
      "mcb",
      "trafo",
      "lampu jalan",
      "penerangan jalan",
    ],
    weight: 3,
  },
  air_bersih: {
    keywords: [
      "air",
      "pdam",
      "kering",
      "mati air",
      "air kotor",
      "air keruh",
      "pipa bocor",
      "tidak mengalir",
      "debit air",
      "tekanan air",
      "air minum",
      "keran",
      "ledeng",
    ],
    weight: 3,
  },
  keamanan: {
    keywords: [
      "pencurian",
      "rampok",
      "kriminal",
      "keamanan",
      "maling",
      "satpam",
      "polisi",
      "premanisme",
      "tidak aman",
      "bahaya",
      "copet",
      "begal",
      "perampok",
      "kejahatan",
      "rawan",
    ],
    weight: 3,
  },
  kesehatan: {
    keywords: [
      "puskesmas",
      "rumah sakit",
      "dokter",
      "obat",
      "kesehatan",
      "sakit",
      "pasien",
      "pelayanan kesehatan",
      "posyandu",
      "vaksin",
      "imunisasi",
      "klinik",
      "medis",
      "ambulans",
    ],
    weight: 3,
  },
  pendidikan: {
    keywords: [
      "sekolah",
      "guru",
      "pendidikan",
      "murid",
      "kelas",
      "belajar",
      "perpustakaan",
      "fasilitas sekolah",
      "tk",
      "sd",
      "smp",
      "sma",
      "siswa",
      "ruang kelas",
    ],
    weight: 3,
  },
};

async function classifyComplaint(text) {
  const startTime = Date.now();
  const normalizedText = text.toLowerCase();

  const scores = {};
  let maxScore = 0;
  let predictedCategory = "lainnya";

  // Calculate scores for each category
  for (const [category, data] of Object.entries(categoryKeywords)) {
    let score = 0;
    let matchedKeywords = [];

    data.keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = normalizedText.match(regex);
      const occurrences = matches ? matches.length : 0;

      if (occurrences > 0) {
        matchedKeywords.push(keyword);
        // Multiple occurrences increase confidence
        score += occurrences * data.weight;

        // Bonus for multiple unique keywords
        if (matchedKeywords.length > 2) {
          score += 2;
        }

        // Bonus for exact phrase match
        if (occurrences > 1) {
          score += 1;
        }
      }
    });

    scores[category] = score;

    if (score > maxScore) {
      maxScore = score;
      predictedCategory = category;
    }
  }

  // Calculate confidence (0-100%)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  let confidence =
    totalScore > 0 ? Math.min((maxScore / totalScore) * 100, 95) : 0;

  // Minimum confidence threshold
  const MIN_CONFIDENCE = 40;

  // If confidence too low, mark as 'lainnya'
  if (confidence < MIN_CONFIDENCE) {
    predictedCategory = "lainnya";
  }

  // Round confidence
  confidence = Math.round(confidence);

  const processingTime = Date.now() - startTime;

  return {
    category: predictedCategory,
    confidence: confidence,
    scores: scores,
    allScores: Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, score]) => ({ category: cat, score })),
    processingTime: processingTime,
    timestamp: new Date().toISOString(),
    modelVersion: "keyword-v1.0",
  };
}

// Function to improve classification based on feedback
async function recordFeedback(
  complaintId,
  actualCategory,
  predictedCategory,
  pool
) {
  try {
    const match = actualCategory === predictedCategory;

    await pool.query(
      `INSERT INTO classification_logs 
         (complaint_id, predicted_category, model_version)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
      [complaintId, predictedCategory, "keyword-v1.0"]
    );

    return {
      success: true,
      match: match,
      accuracy: match ? 100 : 0,
    };
  } catch (error) {
    console.error("Error recording feedback:", error);
    return { success: false, error: error.message };
  }
}

// Function to get classification statistics
async function getClassificationStats(pool) {
  try {
    const result = await pool.query(`
        SELECT 
          COUNT(*) as total_classifications,
          AVG(confidence_score) as avg_confidence,
          COUNT(CASE WHEN confidence_score >= 80 THEN 1 END) as high_confidence,
          COUNT(CASE WHEN confidence_score >= 60 AND confidence_score < 80 THEN 1 END) as medium_confidence,
          COUNT(CASE WHEN confidence_score < 60 THEN 1 END) as low_confidence
        FROM complaints
        WHERE confidence_score IS NOT NULL
      `);

    return result.rows[0];
  } catch (error) {
    console.error("Error getting classification stats:", error);
    return null;
  }
}

module.exports = {
  classifyComplaint,
  recordFeedback,
  getClassificationStats,
};
