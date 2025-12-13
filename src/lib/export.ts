import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Project, Chapter, Character } from '@/types';

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
export function exportToTxt(
  project: Project,
  chapters: Chapter[],
  options?: { includeMetadata?: boolean }
): void {
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
  saveAs(blob, `${project.title}.txt`);
}

// HTML 내보내기
export function exportToHtml(
  project: Project,
  chapters: Chapter[],
  options?: { includeStyles?: boolean }
): void {
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
  saveAs(blob, `${project.title}.html`);
}

// Markdown 내보내기
export function exportToMarkdown(
  project: Project,
  chapters: Chapter[],
  options?: { includeMetadata?: boolean }
): void {
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
  saveAs(blob, `${project.title}.md`);
}

// PDF 내보내기 (한글 폰트 지원을 위한 기본 구현)
export async function exportToPdf(
  project: Project,
  chapters: Chapter[],
  options?: {
    fontSize?: number;
    lineHeight?: number;
    includeMetadata?: boolean;
  }
): Promise<void> {
  const fontSize = options?.fontSize || 12;
  const lineHeight = options?.lineHeight || 1.5;

  // jsPDF는 한글 폰트를 기본 지원하지 않아 HTML을 통해 내보내기
  // 실제 프로덕션에서는 한글 폰트를 임베드하거나 html2canvas 등을 사용
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 간단한 텍스트 내보내기 (한글은 제한적)
  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = pageWidth - margin * 2;

  // 제목
  doc.setFontSize(24);
  doc.text(project.title, pageWidth / 2, y, { align: 'center' });
  y += 15;

  if (project.subtitle) {
    doc.setFontSize(14);
    doc.text(project.subtitle, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  y += 10;
  doc.setFontSize(fontSize);

  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

  for (const chapter of sortedChapters) {
    // 챕터 제목
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(16);
    doc.text(`제 ${chapter.number}장: ${chapter.title}`, margin, y);
    y += 10;

    doc.setFontSize(fontSize);

    if (chapter.scenes && chapter.scenes.length > 0) {
      const sortedScenes = [...chapter.scenes].sort((a, b) => a.order - b.order);

      for (const scene of sortedScenes) {
        const text = htmlToText(scene.content);
        const lines = doc.splitTextToSize(text, textWidth);

        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += fontSize * lineHeight * 0.35;
        }
        y += 5;
      }
    }

    y += 10;
  }

  doc.save(`${project.title}.pdf`);
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

  // XHTML로 저장 (실제 EPUB은 JSZip으로 패키징 필요)
  const blob = new Blob([content], { type: 'application/xhtml+xml;charset=utf-8' });
  saveAs(blob, `${project.title}.xhtml`);
}

// JSON 내보내기 (백업용)
export function exportToJson(
  project: Project,
  chapters: Chapter[],
  characters: Character[]
): void {
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
  saveAs(blob, `${project.title}_backup.json`);
}

// 캐릭터 프로필 내보내기
export function exportCharacterProfiles(
  project: Project,
  characters: Character[]
): void {
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
  saveAs(blob, `${project.title}_characters.md`);
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
