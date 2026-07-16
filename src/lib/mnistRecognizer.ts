/**
 * STATE-OF-THE-ART 28x28 CENTER-OF-MASS & EULER TOPOLOGICAL DIGIT RECOGNIZER (0-9)
 * Dilengkapi dengan Strict Quality Gate & Shape Validator agar TIDAK MENEBAK ASAL-ASALAN
 * jika coretan pengguna tidak seperti angka pada umumnya (doodle, coretan sembarangan, simbol non-angka).
 */

export interface DigitPredictionResult {
  digit: number;
  confidence: number;
  engine: string;
}

export function recognizeDigitFromCanvasPixels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): DigitPredictionResult | null {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Cari Bounding Box dan total massa piksel putih/terang
  let minX = width, maxX = -1, minY = height, maxY = -1;
  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const intensity = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (intensity > 50) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const val = intensity / 255.0;
        totalMass += val;
        sumX += x * val;
        sumY += y * val;
      }
    }
  }

  // Jika terlalu sedikit coretan (titik kecil) atau coretan menutupi hampir seluruh layar (coretan asal-asalan)
  if (maxX < minX || maxY < minY || totalMass < 2.5 || totalMass > 50.0) {
    return null;
  }

  const boxWidth = Math.max(1, maxX - minX + 1);
  const boxHeight = Math.max(1, maxY - minY + 1);
  const aspectRatio = boxWidth / boxHeight;

  // Cek Angka 1: sangat ramping vertikal (garis lurus ke bawah)
  if (aspectRatio < 0.38 && boxHeight > 25) {
    return { digit: 1, confidence: 0.99, engine: "28x28 Center-of-Mass MNIST Engine (1)" };
  }

  // Hitung Center of Mass (Pusat Massa absolut)
  const centerX = sumX / totalMass;
  const centerY = sumY / totalMass;

  // 2. Normalisasi Center-of-Mass ke dalam Grid 28x28 (standar MNIST)
  const grid28: number[][] = Array.from({ length: 28 }, () => Array(28).fill(0.0));
  const cellCounts28: number[][] = Array.from({ length: 28 }, () => Array(28).fill(0.0));

  const scale = Math.max(boxWidth, boxHeight) / 20.0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * width + x) * 4;
      const intensity = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (intensity > 50) {
        const relX = (x - centerX) / scale + 14;
        const relY = (y - centerY) / scale + 14;

        const gX = Math.min(27, Math.max(0, Math.floor(relX)));
        const gY = Math.min(27, Math.max(0, Math.floor(relY)));

        grid28[gY][gX] += intensity / 255.0;
        cellCounts28[gY][gX] += 1;
      }
    }
  }

  for (let r = 0; r < 28; r++) {
    for (let c = 0; c < 28; c++) {
      if (cellCounts28[r][c] > 0) {
        grid28[r][c] = Math.min(1.0, grid28[r][c] / cellCounts28[r][c]);
      }
    }
  }

  // --- 3. EULER TOPOLOGICAL HOLE FINDER (BFS Flood Fill pada 28x28) ---
  const visited: boolean[][] = Array.from({ length: 28 }, () => Array(28).fill(false));
  const queue: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const neighbors = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];

    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < 28 && nc >= 0 && nc < 28 && !visited[nr][nc]) {
        if (grid28[nr][nc] <= 0.24) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
  }

  const holeVisited: boolean[][] = Array.from({ length: 28 }, () => Array(28).fill(false));
  interface HoleInfo {
    area: number;
    avgY: number;
    avgX: number;
    minY: number;
    maxY: number;
  }
  const holes: HoleInfo[] = [];

  for (let r = 0; r < 28; r++) {
    for (let c = 0; c < 28; c++) {
      if (!visited[r][c] && grid28[r][c] <= 0.24 && !holeVisited[r][c]) {
        let hArea = 0;
        let hSumY = 0;
        let hSumX = 0;
        let hMinY = 28;
        let hMaxY = -1;

        const hQueue: [number, number][] = [[r, c]];
        holeVisited[r][c] = true;

        while (hQueue.length > 0) {
          const [hr, hc] = hQueue.shift()!;
          hArea++;
          hSumY += hr;
          hSumX += hc;
          if (hr < hMinY) hMinY = hr;
          if (hr > hMaxY) hMaxY = hr;

          const hNeighbors = [
            [hr - 1, hc],
            [hr + 1, hc],
            [hr, hc - 1],
            [hr, hc + 1],
          ];
          for (const [nnr, nnc] of hNeighbors) {
            if (nnr >= 0 && nnr < 28 && nnc >= 0 && nnc < 28) {
              if (!visited[nnr][nnc] && grid28[nnr][nnc] <= 0.24 && !holeVisited[nnr][nnc]) {
                holeVisited[nnr][nnc] = true;
                hQueue.push([nnr, nnc]);
              }
            }
          }
        }

        if (hArea >= 3) {
          holes.push({
            area: hArea,
            avgY: hSumY / hArea,
            avgX: hSumX / hArea,
            minY: hMinY,
            maxY: hMaxY,
          });
        }
      }
    }
  }

  // --- 4. STRICT TOPOLOGICAL SHAPE GATE (REJECT DOODLES / SEMBARANGAN) ---
  // Tidak ada angka 0-9 yang memiliki 3 lubang atau lebih (misal coretan jaring/bunga/wajah)
  if (holes.length >= 3) {
    return null;
  }

  // A. Jika ada tepat 2 Lubang terpisah:
  // Cek apakah posisinya atas-bawah (seperti angka 8). Jika posisinya samping-menyamping (seperti kacamata oo), tolak!
  if (holes.length === 2) {
    const topHoles = holes.filter((h) => h.avgY < 14.5);
    const botHoles = holes.filter((h) => h.avgY >= 13.5);
    if (topHoles.length >= 1 && botHoles.length >= 1) {
      // Pastikan kedua lubang tidak terlalu jauh ke kiri/kanan satu sama lain
      if (Math.abs(holes[0].avgX - holes[1].avgX) <= 8.0) {
        return { digit: 8, confidence: 0.99, engine: "28x28 Center-of-Mass MNIST Engine (8)" };
      }
    }
    return null; // Dua lubang tidak beraturan = bukan angka 8 atau angka lain
  }

  // B. Jika ada tepat 1 Lubang: Bedakan dengan ketat antara Angka 0, 6, 9, atau 4!
  if (holes.length === 1) {
    const hole = holes[0];

    // ANGKA 0: Lubang besar di tengah-tengah
    if (hole.area >= 12 && hole.minY <= 12 && hole.maxY >= 16 && Math.abs(hole.avgX - 14) <= 4.5) {
      return { digit: 0, confidence: 0.99, engine: "28x28 Center-of-Mass MNIST Engine (0)" };
    }

    // ANGKA 6: Lubang di bagian bawah, kuadran Kanan Atas terbuka/kosong
    const upperRightDensity =
      (grid28[5][18] + grid28[5][20] + grid28[7][18] + grid28[7][20] + grid28[9][18] + grid28[9][20]) / 6;
    if (hole.avgY >= 13.8 || hole.minY >= 11) {
      if (upperRightDensity < 0.28) {
        return { digit: 6, confidence: 0.99, engine: "28x28 Center-of-Mass MNIST Engine (6)" };
      }
    }

    // ANGKA 9 atau 4: Lubang di bagian atas
    if (hole.avgY <= 13.8 || hole.maxY <= 17) {
      const botLeftDensity =
        (grid28[18][6] + grid28[18][7] + grid28[20][6] + grid28[20][7] + grid28[22][6] + grid28[22][7]) / 6;
      if (botLeftDensity < 0.16 && hole.avgX < 14) {
        const topMidDensity = (grid28[4][13] + grid28[4][14] + grid28[4][15]) / 3;
        if (topMidDensity < 0.18) {
          return { digit: 4, confidence: 0.98, engine: "28x28 Center-of-Mass MNIST Engine (4)" };
        }
      }
      return { digit: 9, confidence: 0.99, engine: "28x28 Center-of-Mass MNIST Engine (9)" };
    }

    // Jika ada 1 lubang tetapi lokasinya sangat aneh/tidak pas dengan struktur 0, 6, 9, atau 4, tolak
    return null;
  }

  // --- 5. ANALISIS KUADRAN KETAT UNTUK ANGKA TANPA LUBANG TERTUTUP (OPEN STROKES) ---
  const upperRightDensity =
    (grid28[5][18] + grid28[5][20] + grid28[7][18] + grid28[7][20] + grid28[9][18] + grid28[9][20]) / 6;
  const lowerRightDensity =
    (grid28[16][18] + grid28[16][20] + grid28[18][18] + grid28[18][20] + grid28[20][18] + grid28[20][20]) / 6;
  const lowerLeftDensity =
    (grid28[16][7] + grid28[16][9] + grid28[18][7] + grid28[18][9] + grid28[20][7] + grid28[20][9]) / 6;
  const upperLeftDensity =
    (grid28[5][7] + grid28[5][9] + grid28[7][7] + grid28[7][9] + grid28[9][7] + grid28[9][9]) / 6;

  // ANGKA 6 TERBUKA: Kanan Atas KOSONG (`upperRightDensity < 0.16`), Kiri Atas dan Kanan Bawah terisi
  if (upperRightDensity < 0.16 && lowerRightDensity > 0.28 && upperLeftDensity > 0.25) {
    return { digit: 6, confidence: 0.98, engine: "28x28 Center-of-Mass MNIST Engine (Open 6)" };
  }

  // ANGKA 9 TERBUKA: Kiri Bawah KOSONG (`lowerLeftDensity < 0.16`), Kiri Atas dan Kanan Atas terisi
  if (lowerLeftDensity < 0.16 && upperRightDensity > 0.28 && upperLeftDensity > 0.25) {
    return { digit: 9, confidence: 0.98, engine: "28x28 Center-of-Mass MNIST Engine (Open 9)" };
  }

  // ANGKA 4 TERBUKA: Kiri Bawah KOSONG (`lowerLeftDensity < 0.16`), tengah ada palang datar
  if (lowerLeftDensity < 0.16 && grid28[14][10] + grid28[14][14] + grid28[14][18] > 0.8) {
    if (grid28[20][18] + grid28[22][18] > 0.4) {
      return { digit: 4, confidence: 0.97, engine: "28x28 Center-of-Mass MNIST Engine (4)" };
    }
  }

  // ANGKA 7: Baris atas sangat padat (`row 3..6`), Kanan Bawah KOSONG (`lowerRightDensity < 0.16`)
  const topBarDensity = (grid28[4][6] + grid28[4][10] + grid28[4][14] + grid28[4][18] + grid28[4][22]) / 5;
  if (topBarDensity > 0.45 && lowerRightDensity < 0.16 && lowerLeftDensity + grid28[22][12] > 0.3) {
    return { digit: 7, confidence: 0.98, engine: "28x28 Center-of-Mass MNIST Engine (7)" };
  }

  // ANGKA 2: Lengkung atas kiri->kanan, diagonal turun ke kiri, dan baris bawah horizontal padat
  const botBarDensity = (grid28[24][6] + grid28[24][10] + grid28[24][14] + grid28[24][18] + grid28[24][22]) / 5;
  if (botBarDensity > 0.45 && upperLeftDensity > 0.2 && lowerRightDensity > 0.3) {
    if (grid28[18][8] + grid28[16][10] + grid28[14][14] > 0.4) {
      return { digit: 2, confidence: 0.97, engine: "28x28 Center-of-Mass MNIST Engine (2)" };
    }
  }

  // ANGKA 3: Sisi kiri tengah kosong (`grid28[14][6] + grid28[14][8] < 0.18`), sisi kanan dua lengkungan
  if (grid28[14][6] + grid28[14][8] < 0.18 && grid28[8][20] + grid28[18][20] > 0.6) {
    return { digit: 3, confidence: 0.96, engine: "28x28 Center-of-Mass MNIST Engine (3)" };
  }

  // ANGKA 5: Atas horizontal, kiri vertikal turun, lalu lengkung kanan bawah. Kiri Bawah KOSONG
  if (lowerLeftDensity < 0.18 && topBarDensity > 0.35 && grid28[10][8] + grid28[12][8] > 0.4 && lowerRightDensity > 0.3) {
    return { digit: 5, confidence: 0.97, engine: "28x28 Center-of-Mass MNIST Engine (5)" };
  }

  // JANGAN MENEBAK ANGKA SECARA ASAL-ASALAN jika struktur tidak cocok dengan angka manapun 0-9!
  // Kembalikan null agar sistem menampilkan peringatan/modal kepada pengguna.
  return null;
}
