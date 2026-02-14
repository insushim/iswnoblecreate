import { Project, Chapter, Character } from '@/types';

// Lazy loaders for bundle optimization
async function lazySaveAs(blob: Blob, filename: string): Promise<void> {
  const { saveAs } = await import('file-saver');
  saveAs(blob, filename);
}

// HTML을 순수 텍스트로 변환
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

// TXT 내보내기
export async function exportToTxt(
  project: Project,
  chapters: Chapter[],
  options?: { includeMetadata?: boolean }
): Promise<void> {
  let content = '';

  if (options?.includeMetadata) {
    content += `${project.title}\n`;
    content += `${'='.repeat(project.title.length)}\n\n`;
    if (project.subtitle) {
      content += `${project.subtitle}\n\n`;
    }
    content += `장르: ${project.genre.join(', ')}\n`;
    content += `로그라인: ${project.logline}\n\n`;
    content += `시놉시스:\n${project.synopsis}\n\n`;
    content += `${'─'.repeat(40)}\n\n`;
  }

  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

  for (const chapter of sortedChapters) {
    content += `제 ${chapter.number}장: ${chapter.title}\n`;
    content += `${'─'.repeat(20)}\n\n`;

    if (chapter.scenes && chapter.scenes.length > 0) {
      const sortedScenes = [...chapter.scenes].sort((a, b) => a.order - b.order);
      for (const scene of sortedScenes) {
        const sceneText = htmlToText(scene.content);
        content += `${sceneText}\n\n`;
      }
    }

    content += `\n`;
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  await lazySaveAs(blob, `${project.title}.txt`);
}

// HTML 내보내기
export async function exportToHtml(
  project: Project,
  chapters: Chapter[],
  options?: { includeStyles?: boolean }
): Promise<void> {
  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

  let html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  ${options?.includeStyles ? `
  <style>
    body {
      font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.8;
      color: #333;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; margin-top: 3rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; }
    .subtitle { color: #666; font-size: 1.2rem; margin-bottom: 2rem; }
    .metadata { color: #888; font-size: 0.9rem; margin-bottom: 2rem; }
    .synopsis { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 3rem; }
    p { margin-bottom: 1rem; text-indent: 1rem; }
    blockquote { border-left: 3px solid #ddd; padding-left: 1rem; color: #666; font-style: italic; }
  </style>
  ` : ''}
</head>
<body>
  <h1>${project.title}</h1>
  ${project.subtitle ? `<div class="subtitle">${project.subtitle}</div>` : ''}
  <div class="metadata">
    <p>장르: ${project.genre.join(', ')}</p>
  </div>
  ${project.synopsis ? `
  <div class="synopsis">
    <strong>시놉시스</strong>
    <p>${project.synopsis}</p>
  </div>
  ` : ''}
`;

  for (const chapter of sortedChapters) {
    html += `  <h2>제 ${chapter.number}장: ${chapter.title}</h2>\n`;

    if (chapter.scenes && chapter.scenes.length > 0) {
      const sortedScenes = [...chapter.scenes].sort((a, b) => a.order - b.order);
      for (const scene of sortedScenes) {
        html += `  ${scene.content}\n`;
      }
    }
  }

  html += `
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  await lazySaveAs(blob, `${project.title}.html`);
}

// Markdown 내보내기
export async function exportToMarkdown(
  project: Project,
  chapters: Chapter[],
  options?: { includeMetadata?: boolean }
): Promise<void> {
  let content = '';

  content += `# ${project.title}\n\n`;
  if (project.subtitle) {
    content += `*${project.subtitle}*\n\n`;
  }

  if (options?.includeMetadata) {
    content += `---\n\n`;
    content += `**장르:** ${project.genre.join(', ')}\n\n`;
    content += `**로그라인:** ${project.logline}\n\n`;
    content += `## 시놉시스\n\n${project.synopsis}\n\n`;
    content += `---\n\n`;
  }

  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

  for (const chapter of sortedChapters) {
    content += `## 제 ${chapter.number}장: ${chapter.title}\n\n`;

    if (chapter.scenes && chapter.scenes.length > 0) {
      const sortedScenes = [...chapter.scenes].sort((a, b) => a.order - b.order);
      for (const scene of sortedScenes) {
        const sceneText = htmlToText(scene.content);
        content += `${sceneText}\n\n`;
      }
    }
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  await lazySaveAs(blob, `${project.title}.md`);
}

// ─────────────────────────────────────────────────
// 원고지 매수 환산 유틸리티
// ─────────────────────────────────────────────────

/**
 * 텍스트 기반 원고지 매수 환산
 * - 200자 원고지 기준
 * - 신국판(152x225mm) 기준 예상 페이지 수 계산
 */
export function calculateManuscriptPages(text: string): {
  charCount: number;
  manuscriptPages: number;
  estimatedBookPages: number;
} {
  // 공백, 줄바꿈 포함 전체 글자수 (원고지 환산 시 공백도 한 칸으로 침)
  const cleanText = text.replace(/\r\n/g, '\n');
  const charCount = cleanText.length;

  // 200자 원고지 매수: 총 글자수 / 200 (올림)
  const manuscriptPages = Math.ceil(charCount / 200);

  // 신국판 기준 예상 페이지 수
  // 신국판: 152x225mm, 바탕체 10.5pt, 줄간격 170%
  // 일반적으로 1페이지당 약 600~700자 (여백, 줄간격 고려)
  // 보수적으로 약 650자/페이지로 계산
  const charsPerBookPage = 650;
  const estimatedBookPages = Math.ceil(charCount / charsPerBookPage);

  return {
    charCount,
    manuscriptPages,
    estimatedBookPages,
  };
}

// ─────────────────────────────────────────────────
// 판형 설정 상수
// ─────────────────────────────────────────────────

type PageSizeKey = 'shinguk' | '46ban' | 'a4' | 'a5';

interface PageDimension {
  width: number;  // mm
  height: number; // mm
  label: string;
}

const PAGE_SIZES: Record<PageSizeKey, PageDimension> = {
  shinguk: { width: 152, height: 225, label: '신국판 (152x225mm)' },
  '46ban': { width: 127, height: 188, label: '46판 (127x188mm)' },
  a4: { width: 210, height: 297, label: 'A4 (210x297mm)' },
  a5: { width: 148, height: 210, label: 'A5 (148x210mm)' },
};

// ─────────────────────────────────────────────────
// PDF 내보내기 (인쇄용 개선판)
// ─────────────────────────────────────────────────

/**
 * 인쇄용 PDF 내보내기 (개선판)
 *
 * - 판형 설정 (신국판/46판/A4/A5)
 * - 목차 페이지 자동 생성
 * - 페이지 번호 (하단 중앙)
 * - 머리글/바닥글
 * - 여백 설정 (내측 제본 여백 포함)
 * - 챕터별 페이지 나누기
 * - 한글 폰트 참고 메시지 포함
 */
export async function exportToPdf(
  project: Project,
  chapters: Chapter[],
  options?: {
    pageSize?: PageSizeKey;
    fontSize?: number;
    lineHeight?: number;
    includeMetadata?: boolean;
  }
): Promise<void> {
  const pageSize = options?.pageSize ?? 'a4';
  const fontSize = options?.fontSize || 12;
  const lineHeight = options?.lineHeight || 1.5;
  const pageDim = PAGE_SIZES[pageSize];

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageDim.width, pageDim.height],
  });

  const pageWidth = pageDim.width;
  const pageHeight = pageDim.height;
  const marginLeft = 30;   // 내측 제본 여백
  const marginRight = 25;
  const marginTop = 25;
  const marginBottom = 25;
  const textWidth = pageWidth - marginLeft - marginRight;
  const contentBottom = pageHeight - marginBottom;

  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

  // 전체 텍스트로 원고지 매수 계산
  let allText = '';
  for (const chapter of sortedChapters) {
    if (chapter.scenes && chapter.scenes.length > 0) {
      for (const scene of chapter.scenes) {
        allText += htmlToText(scene.content);
      }
    }
  }
  const manuscript = calculateManuscriptPages(allText);

  // 현재 페이지 정보 추적
  let currentPage = 1;
  let currentChapterTitle = '';

  // 머리글/바닥글 그리기 헬퍼
  function drawHeaderFooter(chapterTitle: string): void {
    const headerY = marginTop - 8;
    const footerY = pageHeight - marginBottom + 10;

    // 머리글 (짝수: 작품명, 홀수: 챕터명)
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    if (currentPage % 2 === 0) {
      doc.text(project.title, pageWidth / 2, headerY, { align: 'center' });
    } else {
      doc.text(chapterTitle || project.title, pageWidth / 2, headerY, { align: 'center' });
    }

    // 구분선
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, headerY + 2, pageWidth - marginRight, headerY + 2);

    // 페이지 번호 (하단 중앙)
    doc.text(String(currentPage), pageWidth / 2, footerY, { align: 'center' });

    // 색상 복원
    doc.setTextColor(0, 0, 0);
  }

  // 새 페이지 추가 헬퍼
  function addNewPage(): number {
    doc.addPage([pageDim.width, pageDim.height]);
    currentPage++;
    drawHeaderFooter(currentChapterTitle);
    return marginTop;
  }

  // === 1. 표지 ===
  doc.setFontSize(28);
  doc.text(project.title, pageWidth / 2, pageHeight * 0.35, { align: 'center' });

  if (project.subtitle) {
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(project.subtitle, pageWidth / 2, pageHeight * 0.35 + 15, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`[${project.genre.join(' / ')}]`, pageWidth / 2, pageHeight * 0.35 + 30, { align: 'center' });
  doc.text(
    `${manuscript.charCount.toLocaleString()}자 / 200자 원고지 ${manuscript.manuscriptPages.toLocaleString()}매`,
    pageWidth / 2,
    pageHeight * 0.7,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);

  // === 2. 한글 폰트 안내 페이지 ===
  doc.addPage([pageDim.width, pageDim.height]);
  currentPage++;

  doc.setFontSize(11);
  doc.setTextColor(180, 50, 50);
  const noticeLines = [
    '[ 한글 폰트 안내 ]',
    '',
    'PDF에서 한글이 정상적으로 표시되지 않을 수 있습니다.',
    '완벽한 한글 출력을 위해서는 DOCX 내보내기 후',
    'Microsoft Word 또는 한글(HWP)에서 PDF로 변환하는 것을',
    '권장합니다.',
    '',
    'DOCX 내보내기: 내보내기 > DOCX (출판용)',
  ];
  let noticeY = marginTop + 30;
  for (const line of noticeLines) {
    doc.text(line, pageWidth / 2, noticeY, { align: 'center' });
    noticeY += 8;
  }
  doc.setTextColor(0, 0, 0);

  // === 3. 목차 ===
  doc.addPage([pageDim.width, pageDim.height]);
  currentPage++;

  doc.setFontSize(18);
  doc.text('목 차', pageWidth / 2, marginTop + 10, { align: 'center' });

  doc.setFontSize(fontSize);
  let tocY = marginTop + 30;
  for (const chapter of sortedChapters) {
    if (tocY > contentBottom - 10) {
      doc.addPage([pageDim.width, pageDim.height]);
      currentPage++;
      tocY = marginTop;
    }
    const tocEntry = `제 ${chapter.number}장: ${chapter.title}`;
    doc.text(tocEntry, marginLeft, tocY);

    // 점선 리더 표현 (간단)
    const entryWidth = doc.getTextWidth(tocEntry);
    const dotsStart = marginLeft + entryWidth + 2;
    const dotsEnd = pageWidth - marginRight - 10;
    if (dotsEnd > dotsStart) {
      const dotCount = Math.floor((dotsEnd - dotsStart) / 2);
      const dots = '.'.repeat(dotCount);
      doc.setTextColor(180, 180, 180);
      doc.text(dots, dotsStart, tocY);
      doc.setTextColor(0, 0, 0);
    }

    tocY += fontSize * lineHeight * 0.5;
  }

  // === 4. 챕터별 본문 ===
  for (const chapter of sortedChapters) {
    // 새 페이지에서 챕터 시작
    doc.addPage([pageDim.width, pageDim.height]);
    currentPage++;
    currentChapterTitle = `제 ${chapter.number}장: ${chapter.title}`;

    drawHeaderFooter(currentChapterTitle);

    // 챕터 제목
    let y = marginTop + 20;
    doc.setFontSize(18);
    doc.text(currentChapterTitle, pageWidth / 2, y, { align: 'center' });
    y += 15;

    if (chapter.subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(chapter.subtitle, pageWidth / 2, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 10;
    }

    y += 5;
    doc.setFontSize(fontSize);

    if (chapter.scenes && chapter.scenes.length > 0) {
      const sortedScenes = [...chapter.scenes].sort((a, b) => a.order - b.order);

      for (let si = 0; si < sortedScenes.length; si++) {
        const scene = sortedScenes[si];
        const text = htmlToText(scene.content);

        // 씬 구분자
        if (si > 0) {
          if (y > contentBottom - 15) {
            y = addNewPage();
          }
          doc.setTextColor(150, 150, 150);
          doc.text('* * *', pageWidth / 2, y, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          y += 8;
        }

        const lines = doc.splitTextToSize(text, textWidth);

        for (const line of lines) {
          if (y > contentBottom - 5) {
            y = addNewPage();
          }
          doc.text(line as string, marginLeft, y);
          y += fontSize * lineHeight * 0.35;
        }
        y += 3;
      }
    }
  }

  // === 5. 말미 원고 정보 ===
  doc.addPage([pageDim.width, pageDim.height]);
  currentPage++;

  doc.setFontSize(14);
  doc.text('── 원고 정보 ──', pageWidth / 2, pageHeight * 0.35, { align: 'center' });

  doc.setFontSize(11);
  const infoLines = [
    `작품명: ${project.title}`,
    `총 챕터: ${sortedChapters.length}장`,
    `총 글자수: ${manuscript.charCount.toLocaleString()}자`,
    `200자 원고지: ${manuscript.manuscriptPages.toLocaleString()}매`,
    `예상 쪽수: 약 ${manuscript.estimatedBookPages}쪽 (${pageDim.label})`,
    '',
    `판형: ${pageDim.label}`,
    `내보내기 일시: ${new Date().toLocaleDateString('ko-KR')}`,
  ];
  let infoY = pageHeight * 0.35 + 15;
  for (const line of infoLines) {
    doc.text(line, pageWidth / 2, infoY, { align: 'center' });
    infoY += 7;
  }

  doc.save(`${project.title}_인쇄용.pdf`);
}

// EPUB 내보내기 (기본 구조)
export async function exportToEpub(
  project: Project,
  chapters: Chapter[],
  options?: {
    author?: string;
    description?: string;
    coverImage?: string;
  }
): Promise<void> {
  // EPUB는 ZIP 파일이므로 JSZip 라이브러리가 필요
  // 여기서는 기본 구조만 생성
  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

  // EPUB의 기본 구조
  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${project.title}</dc:title>
    <dc:creator>${options?.author || 'Unknown'}</dc:creator>
    <dc:language>ko</dc:language>
    <dc:identifier id="BookId">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:description>${options?.description || project.logline}</dc:description>
  </metadata>
  <manifest>
    ${sortedChapters.map((c, i) => `<item id="chapter${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    ${sortedChapters.map((_, i) => `<itemref idref="chapter${i + 1}"/>`).join('\n    ')}
  </spine>
</package>`;

  // 간단히 XHTML로 내보내기 (실제 EPUB 생성은 JSZip 필요)
  let content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
  <title>${project.title}</title>
  <style>
    body { font-family: serif; line-height: 1.8; }
    h1 { page-break-before: always; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
`;

  for (const chapter of sortedChapters) {
    content += `  <h2>제 ${chapter.number}장: ${chapter.title}</h2>\n`;

    if (chapter.scenes && chapter.scenes.length > 0) {
      const sortedScenes = [...chapter.scenes].sort((a, b) => a.order - b.order);
      for (const scene of sortedScenes) {
        content += `  ${scene.content}\n`;
      }
    }
  }

  content += `
</body>
</html>`;

  const blob = new Blob([content], { type: 'application/xhtml+xml;charset=utf-8' });
  await lazySaveAs(blob, `${project.title}.xhtml`);
}

// JSON 내보내기 (백업용)
export async function exportToJson(
  project: Project,
  chapters: Chapter[],
  characters: Character[]
): Promise<void> {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    project,
    chapters,
    characters,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  await lazySaveAs(blob, `${project.title}_backup.json`);
}

// 캐릭터 프로필 내보내기
export async function exportCharacterProfiles(
  project: Project,
  characters: Character[]
): Promise<void> {
  let content = `# ${project.title} - 캐릭터 프로필\n\n`;

  const roleOrder = ['protagonist', 'deuteragonist', 'antagonist', 'supporting', 'minor', 'mentioned'];

  const sortedCharacters = [...characters].sort((a, b) => {
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
  });

  for (const char of sortedCharacters) {
    content += `## ${char.name}\n\n`;
    content += `- **역할:** ${getRoleLabel(char.role)}\n`;
    content += `- **나이:** ${char.age}\n`;
    content += `- **성별:** ${char.gender}\n`;
    if (char.occupation) content += `- **직업:** ${char.occupation}\n`;
    content += `\n`;

    content += `### 성격\n${char.personality}\n\n`;
    content += `### 배경\n${char.background}\n\n`;
    content += `### 동기\n${char.motivation}\n\n`;
    content += `### 목표\n${char.goal}\n\n`;

    if (char.strengths.length > 0) {
      content += `### 강점\n${char.strengths.map(s => `- ${s}`).join('\n')}\n\n`;
    }

    if (char.weaknesses.length > 0) {
      content += `### 약점\n${char.weaknesses.map(w => `- ${w}`).join('\n')}\n\n`;
    }

    content += `---\n\n`;
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  await lazySaveAs(blob, `${project.title}_characters.md`);
}

function getRoleLabel(role: Character['role']): string {
  const labels: Record<Character['role'], string> = {
    protagonist: '주인공',
    deuteragonist: '조연 주인공',
    antagonist: '적대자',
    supporting: '조연',
    minor: '단역',
    mentioned: '언급만',
  };
  return labels[role] || role;
}
