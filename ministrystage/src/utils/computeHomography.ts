/**
 * computeHomography.ts
 * 
 * Implementação do algoritmo de homografia de 4 pontos (DLT - Direct Linear Transform).
 * Calcula a transformação projetiva que mapeia 4 pontos de origem para 4 pontos de destino.
 * O resultado é convertido para o formato CSS matrix3d para aplicação direta via CSS transform.
 */

/**
 * Resolve sistema linear Ax = b via Eliminação Gaussiana com pivotamento parcial.
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Cria matriz aumentada [A | b]
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Pivotamento parcial: encontra a linha com maior valor absoluto na coluna
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    // Eliminação progressiva
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) M[row][k] -= factor * M[col][k];
    }
  }

  // Substituição regressiva
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

/**
 * Calcula a matriz de homografia 3x3 que mapeia src -> dst.
 * src e dst: arrays de 4 pontos [x, y].
 */
export function computeHomography(
  src: [number, number][],
  dst: [number, number][]
): number[][] {
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [xp, yp] = dst[i];
    // Equação para x'
    A.push([x, y, 1, 0, 0, 0, -xp * x, -xp * y]);
    b.push(xp);
    // Equação para y'
    A.push([0, 0, 0, x, y, 1, -yp * x, -yp * y]);
    b.push(yp);
  }

  const h = gaussianElimination(A, b);
  // H normalizada com H[2][2] = 1
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

/**
 * Converte matriz de homografia 3x3 para string CSS matrix3d.
 * CSS matrix3d usa ordem COLUMN-MAJOR para matriz 4x4.
 * Para transformação projetiva 2D com transform-origin: top left:
 * 
 *   H (row-major):           CSS matrix3d (column-major 4x4):
 *   [H00 H01 H02]     ->     matrix3d(
 *   [H10 H11 H12]              H00, H10, 0, H20,   <- col 0
 *   [H20 H21 H22]              H01, H11, 0, H21,   <- col 1
 *                               0,   0,  1,  0,    <- col 2 (z)
 *                              H02, H12, 0, H22    <- col 3
 *                            )
 */
export function homographyToCSSMatrix3d(H: number[][]): string {
  return [
    H[0][0], H[1][0], 0, H[2][0],
    H[0][1], H[1][1], 0, H[2][1],
    0,       0,       1, 0,
    H[0][2], H[1][2], 0, H[2][2],
  ].join(', ');
}

export type CornerMap = {
  tl: [number, number]; // top-left  [x, y] normalizado 0-1
  tr: [number, number]; // top-right
  br: [number, number]; // bottom-right
  bl: [number, number]; // bottom-left
};

export const DEFAULT_CORNERS: CornerMap = {
  tl: [0, 0],
  tr: [1, 0],
  br: [1, 1],
  bl: [0, 1],
};

/**
 * Calcula o CSS transform matrix3d completo para corner pinning.
 * @param width  Largura do elemento em pixels (ex: window.innerWidth)
 * @param height Altura do elemento em pixels (ex: window.innerHeight)
 * @param corners Posições dos 4 cantos em coordenadas normalizadas [0-1]
 * @returns String CSS para usar em style.transform
 */
export function computeCornerPinTransform(
  width: number,
  height: number,
  corners: CornerMap
): string {
  // Pontos de origem: os cantos do retângulo original
  const src: [number, number][] = [
    [0,     0      ],
    [width, 0      ],
    [width, height ],
    [0,     height ],
  ];

  // Pontos de destino: onde cada canto vai aparecer na tela
  const dst: [number, number][] = [
    [corners.tl[0] * width,  corners.tl[1] * height],
    [corners.tr[0] * width,  corners.tr[1] * height],
    [corners.br[0] * width,  corners.br[1] * height],
    [corners.bl[0] * width,  corners.bl[1] * height],
  ];

  const H = computeHomography(src, dst);
  return `matrix3d(${homographyToCSSMatrix3d(H)})`;
}

/**
 * Verifica se o CornerMap é o padrão (sem distorção).
 */
export function isDefaultCorners(corners: CornerMap): boolean {
  return (
    corners.tl[0] === 0 && corners.tl[1] === 0 &&
    corners.tr[0] === 1 && corners.tr[1] === 0 &&
    corners.br[0] === 1 && corners.br[1] === 1 &&
    corners.bl[0] === 0 && corners.bl[1] === 1
  );
}
