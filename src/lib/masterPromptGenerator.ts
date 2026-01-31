/**
 * 통합 마스터 프롬프트 생성기
 *
 * 모든 시스템을 통합하여 단일 최적화된 프롬프트를 생성
 * 인간 편집자 없이 출판 수준의 소설을 작성하기 위한 핵심 시스템
 */

import { humanStyleEngine, type StyleDNA, type StylePreset } from './humanStyleEngine';
import { genreMasterSystem, type PrimaryGenre, type GenreBlueprint } from './genreMasterSystem';
import { qualityAssuranceSystem, type EvaluatorPersonaType, EVALUATOR_PERSONAS } from './qualityAssurance';
import { type PublishingPlatform, PLATFORM_REQUIREMENTS } from './publishReadiness';

// ============================================================================
// 타입 정의
// ============================================================================

export interface MasterPromptConfig {
  // 기본 설정
  projectTitle: string;
  genre: PrimaryGenre | PrimaryGenre[];
  targetPlatform: PublishingPlatform;
  contentRating: '전체' | '12세' | '15세' | '19세';

  // 스타일 설정
  stylePreset?: StylePreset;
  customStyleDNA?: Partial<StyleDNA>;
  authorReference?: string; // 참고할 작가명

  // 세계관/캐릭터
  worldSetting: string;
  mainCharacters: CharacterProfile[];
  supportingCharacters?: CharacterProfile[];

  // 플롯 설정
  premise: string;
  mainConflict: string;
  subplots?: string[];
  thematicElements: string[];

  // 분량 설정
  targetChapterCount: number;
  targetChapterLength: number;

  // 품질 설정
  qualityLevel: 'draft' | 'polished' | 'publication-ready';
  evaluatorPersonas?: EvaluatorPersonaType[];
}

export interface CharacterProfile {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  personality: string;
  background: string;
  motivation: string;
  arc?: string;
  speechPattern?: string;
  relationships?: { character: string; relationship: string }[];
}

export interface MasterPrompt {
  // 메인 프롬프트들
  systemPrompt: string;           // AI의 역할 정의
  worldBuildingPrompt: string;    // 세계관 구축
  characterPrompt: string;        // 캐릭터 일관성
  stylePrompt: string;            // 문체 가이드
  genrePrompt: string;            // 장르 컨벤션
  qualityPrompt: string;          // 품질 기준

  // 작업별 프롬프트
  chapterWritingPrompt: string;   // 챕터 작성용
  sceneWritingPrompt: string;     // 씬 작성용
  dialogueWritingPrompt: string;  // 대화 작성용
  descriptionWritingPrompt: string; // 묘사 작성용

  // 검증 프롬프트
  selfEditPrompt: string;         // 자체 편집
  consistencyCheckPrompt: string; // 일관성 검사
  qualityCheckPrompt: string;     // 품질 검사

  // 메타데이터
  generatedAt: Date;
  configHash: string;
}

export interface WritingTask {
  type: 'chapter' | 'scene' | 'dialogue' | 'description' | 'revision';
  context: {
    previousContent?: string;
    nextContent?: string;
    currentChapter?: number;
    currentScene?: number;
    characters?: string[];
    location?: string;
    timeOfDay?: string;
    mood?: string;
    keyEvents?: string[];
  };
  requirements?: string[];
}

// ============================================================================
// 마스터 프롬프트 생성기
// ============================================================================

export class MasterPromptGenerator {

  /**
   * 전체 마스터 프롬프트 생성
   */
  generateMasterPrompt(config: MasterPromptConfig): MasterPrompt {
    const genres = Array.isArray(config.genre) ? config.genre : [config.genre];
    const primaryGenre = genres[0];
    const genreBlueprint = genreMasterSystem.getBlueprint(primaryGenre);
    const platformReqs = PLATFORM_REQUIREMENTS[config.targetPlatform];

    return {
      systemPrompt: this.generateSystemPrompt(config, genreBlueprint, platformReqs),
      worldBuildingPrompt: this.generateWorldBuildingPrompt(config),
      characterPrompt: this.generateCharacterPrompt(config),
      stylePrompt: this.generateStylePrompt(config),
      genrePrompt: this.generateGenrePrompt(config, genres),
      qualityPrompt: this.generateQualityPrompt(config),
      chapterWritingPrompt: this.generateChapterWritingPrompt(config, genreBlueprint),
      sceneWritingPrompt: this.generateSceneWritingPrompt(config),
      dialogueWritingPrompt: this.generateDialogueWritingPrompt(config),
      descriptionWritingPrompt: this.generateDescriptionWritingPrompt(config),
      selfEditPrompt: this.generateSelfEditPrompt(config),
      consistencyCheckPrompt: this.generateConsistencyCheckPrompt(config),
      qualityCheckPrompt: this.generateQualityCheckPrompt(config),
      generatedAt: new Date(),
      configHash: this.hashConfig(config)
    };
  }

  /**
   * 시스템 프롬프트 생성 - AI의 핵심 역할 정의
   */
  private generateSystemPrompt(
    config: MasterPromptConfig,
    genreBlueprint: Partial<GenreBlueprint>,
    platformReqs: typeof PLATFORM_REQUIREMENTS[PublishingPlatform]
  ): string {
    return `당신은 한국 ${genreBlueprint.nameKr || genreBlueprint.name || '소설'} 장르의 전문 베스트셀러 작가입니다.

═══════════════════════════════════════════════════════════════
                    🎭 작가 페르소나
═══════════════════════════════════════════════════════════════

【정체성】
- ${genreBlueprint.nameKr || genreBlueprint.name || '소설'} 장르 10년차 전문 작가
- 출판 플랫폼: ${platformReqs.name}
- 다수의 히트작을 보유한 베테랑
- 독자 심리와 시장을 완벽히 이해

【핵심 역량】
1. 독자를 몰입시키는 서사 구조
2. 살아 숨쉬는 캐릭터 창조
3. 자연스럽고 개성있는 대화
4. 오감을 자극하는 묘사
5. 장르 컨벤션의 창의적 활용

═══════════════════════════════════════════════════════════════
                    📋 절대 규칙
═══════════════════════════════════════════════════════════════

【금지 사항 - 절대 하지 마세요】
❌ "~였다"로만 끝나는 단조로운 문장 반복
❌ 감정을 직접 설명 ("그는 슬펐다" → 신체 반응으로 표현)
❌ "마치 ~처럼" 비유 남용
❌ "그리고", "그래서", "하지만"으로 시작하는 문장 연속
❌ 캐릭터 이름 과다 반복 (대명사, 호칭, 별명 활용)
❌ AI스러운 판에 박힌 표현
❌ 설명적 대화 (정보 전달용 대화)
❌ 과도한 내면 독백
❌ 독자에게 직접 말하기
❌ 미완성/placeholder 텍스트

【필수 사항 - 반드시 지키세요】
✅ 장면 전환 시 시간/장소 명확히
✅ Show, don't tell (보여주기, 말하지 않기)
✅ 각 챕터 끝 훅/서스펜스
✅ 캐릭터별 고유 말투 유지
✅ 복선 자연스럽게 심기
✅ 감각적 디테일 (시각, 청각, 촉각, 후각, 미각)
✅ 서브텍스트 있는 대화
✅ 긴장과 이완의 리듬
✅ 매 씬 갈등/목표/장애물

═══════════════════════════════════════════════════════════════
                    📊 품질 기준
═══════════════════════════════════════════════════════════════

【분량 기준】
- 챕터당: ${config.targetChapterLength.toLocaleString()}자
- 대화:서술:묘사 비율: 40:40:20
- 문장 길이 변화: 짧은/중간/긴 문장 조화

【품질 등급: ${config.qualityLevel}】
${config.qualityLevel === 'publication-ready' ? `
- 맞춤법/문법 오류: 0
- 시점 혼동: 0
- 캐릭터 OOC: 0
- 설정 모순: 0
- 편집 불필요 수준의 완성도
` : config.qualityLevel === 'polished' ? `
- 최소한의 교정만 필요
- 전체적 완성도 확보
- 리듬감 있는 문장
` : `
- 스토리 골격 완성
- 추후 교정 예정
`}

작품 제목: ${config.projectTitle}
콘텐츠 등급: ${config.contentRating}`;
  }

  /**
   * 세계관 구축 프롬프트
   */
  private generateWorldBuildingPrompt(config: MasterPromptConfig): string {
    return `═══════════════════════════════════════════════════════════════
                    🌍 세계관 설정
═══════════════════════════════════════════════════════════════

【기본 세계관】
${config.worldSetting}

【세계관 일관성 규칙】
1. 설정된 규칙/법칙은 예외 없이 적용
2. 지명/인명 철자 통일
3. 시간대/계절 흐름 논리적
4. 문화/관습 일관성 유지
5. 기술/마법 수준 일정

【참조 시 체크리스트】
□ 이 장면의 시간대는?
□ 이 장소의 특징은?
□ 현재 계절/날씨는?
□ 등장인물들의 사회적 위치는?
□ 이 세계의 규칙에 위배되지 않는가?

【피해야 할 세계관 오류】
- 시대착오적 기술/언어
- 갑작스러운 설정 변경
- 지리적 모순
- 시간 흐름 오류`;
  }

  /**
   * 캐릭터 프롬프트
   */
  private generateCharacterPrompt(config: MasterPromptConfig): string {
    const allCharacters = [
      ...config.mainCharacters,
      ...(config.supportingCharacters || [])
    ];

    const characterDetails = allCharacters.map(char => `
【${char.name}】 (${this.getRoleKorean(char.role)})
• 성격: ${char.personality}
• 배경: ${char.background}
• 동기: ${char.motivation}
${char.arc ? `• 캐릭터 아크: ${char.arc}` : ''}
${char.speechPattern ? `• 말투 특징: ${char.speechPattern}` : ''}
${char.relationships?.length ? `• 관계:\n${char.relationships.map(r => `  - ${r.character}: ${r.relationship}`).join('\n')}` : ''}
`).join('\n');

    return `═══════════════════════════════════════════════════════════════
                    👥 캐릭터 프로파일
═══════════════════════════════════════════════════════════════

${characterDetails}

═══════════════════════════════════════════════════════════════
                    📝 캐릭터 작성 규칙
═══════════════════════════════════════════════════════════════

【대화 작성 규칙】
1. 각 캐릭터의 고유 말투 철저히 유지
2. 나이/배경/성격에 맞는 어휘 선택
3. 캐릭터별 자주 쓰는 표현/말버릇 설정
4. 감정 상태에 따른 말투 변화 자연스럽게
5. 서브텍스트 (겉과 속이 다른 대화)

【캐릭터 일관성 체크】
매 장면 작성 시:
□ 이 행동이 캐릭터 성격에 맞는가?
□ 동기와 일치하는 행동인가?
□ 이전 장면과 연속성 있는가?
□ 말투가 일관적인가?
□ 관계 설정에 맞는 상호작용인가?

【OOC(Out of Character) 방지】
- 급격한 성격 변화 = 반드시 설득력 있는 계기 필요
- 동기 없는 행동 금지
- 지식/능력 범위 내 행동`;
  }

  /**
   * 문체 프롬프트
   */
  private generateStylePrompt(config: MasterPromptConfig): string {
    let styleGuide = '';

    if (config.stylePreset) {
      humanStyleEngine.loadPreset(config.stylePreset);
      styleGuide = humanStyleEngine.generateStylePrompt();
    } else if (config.customStyleDNA) {
      // 커스텀 스타일 DNA 적용
      humanStyleEngine.setStyleDNA(config.customStyleDNA);
      styleGuide = humanStyleEngine.generateStylePrompt();
    }

    return `═══════════════════════════════════════════════════════════════
                    ✍️ 문체 가이드
═══════════════════════════════════════════════════════════════

${styleGuide}

【AI 탈취 (Decontamination) 규칙】
다음 표현은 절대 사용 금지:

❌ 감정 직접 서술:
- "그는 슬펐다" → "목이 메어왔다"
- "그녀는 화가 났다" → "주먹이 떨렸다"
- "그는 기뻤다" → "입꼬리가 올라갔다"

❌ 과도한 비유:
- "마치 ~처럼" 연속 사용
- "~인 듯" 남발

❌ 설명적 문장:
- "왜냐하면 ~이기 때문이다"
- "사실 ~한 것이다"
- "즉, ~라는 의미이다"

❌ 판에 박힌 표현:
- "눈빛이 흔들렸다" (진부함)
- "심장이 두근거렸다" (진부함)
- "말을 잇지 못했다" (진부함)

✅ 대신 사용할 기법:
- 구체적 신체 반응
- 환경 묘사로 분위기 전달
- 행동으로 감정 암시
- 독특하고 개성있는 비유`;
  }

  /**
   * 장르 프롬프트
   */
  private generateGenrePrompt(config: MasterPromptConfig, genres: PrimaryGenre[]): string {
    const genrePrompt = genreMasterSystem.generateGenrePrompt(genres);

    let mixingGuide = '';
    if (genres.length > 1) {
      // Note: getGenreMixingGuide is async, so we just provide a basic guide here
      mixingGuide = `
【장르 믹싱 가이드】
주 장르: ${genres[0]}
부 장르: ${genres.slice(1).join(', ')}
→ 주 장르의 핵심 요소를 유지하면서 부 장르의 매력을 가미하세요.
`;
    }

    return `═══════════════════════════════════════════════════════════════
                    🎭 장르 가이드
═══════════════════════════════════════════════════════════════

${genrePrompt}

${mixingGuide ? `
【장르 믹싱 가이드】
${mixingGuide}
` : ''}

【플롯 설정】
전제: ${config.premise}
메인 갈등: ${config.mainConflict}
${config.subplots?.length ? `서브플롯:\n${config.subplots.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}

주제적 요소:
${config.thematicElements.map(t => `• ${t}`).join('\n')}`;
  }

  /**
   * 품질 기준 프롬프트
   */
  private generateQualityPrompt(config: MasterPromptConfig): string {
    const evaluators = config.evaluatorPersonas || ['avid-reader', 'web-novel-editor'];

    return `═══════════════════════════════════════════════════════════════
                    📊 품질 기준
═══════════════════════════════════════════════════════════════

【평가자 관점】
${evaluators.map(e => {
  const persona = EVALUATOR_PERSONAS.find(p => p.id === e);
  return persona ? `• ${persona.name}: ${persona.evaluationFocus.join(', ')}` : `• ${e}`;
}).join('\n')}

【자체 품질 검사 기준】

## 문장 수준
□ 맞춤법/문법 오류 없음
□ 자연스러운 문장 흐름
□ 다양한 문장 구조
□ 적절한 문장 길이 변화

## 장면 수준
□ 명확한 목표/갈등/장애물
□ 감각적 디테일
□ 캐릭터 일관성
□ 시간/공간 명확

## 챕터 수준
□ 강력한 오프닝 훅
□ 긴장감 있는 전개
□ 효과적인 엔딩 훅
□ 플롯 진행

## 작품 수준
□ 복선 회수
□ 캐릭터 성장
□ 주제 전달
□ 결말 만족도

【자체 편집 프로세스】
작성 후 다음을 자체 점검:
1. AI스러운 표현 제거
2. 감정 서술 → 신체 반응 변환
3. 진부한 표현 → 개성있는 표현
4. 캐릭터 말투 일관성
5. 시점/시제 통일`;
  }

  /**
   * 챕터 작성 프롬프트
   */
  private generateChapterWritingPrompt(
    config: MasterPromptConfig,
    genreBlueprint: Partial<GenreBlueprint>
  ): string {
    return `═══════════════════════════════════════════════════════════════
                    📖 챕터 작성 가이드
═══════════════════════════════════════════════════════════════

【챕터 구조】
1. 오프닝 훅 (첫 3문장)
   - 행동/대화/충격으로 시작
   - 의문 제기
   - 즉각적 몰입

2. 상황 설정 (10%)
   - 시간/장소 자연스럽게 전달
   - 이전 챕터와 연결
   - 이번 챕터 목표 암시

3. 전개 (70%)
   - 최소 1개 갈등/위기
   - 캐릭터 상호작용
   - 플롯 진행
   - 서브플롯 전개

4. 클라이맥스/전환점 (15%)
   - 긴장 고조
   - 결정/선택의 순간
   - 변화 발생

5. 엔딩 훅 (5%)
   - 다음 챕터 기대감
   - 질문/서스펜스
   - 클리프행어 (적절히)

【챕터별 체크리스트】
작성 완료 후:
□ 훅이 효과적인가?
□ 플롯이 진행되었는가?
□ 캐릭터가 발전했는가?
□ 감정적 변화가 있는가?
□ 엔딩이 다음을 기대하게 하는가?
□ 분량이 적절한가? (${config.targetChapterLength.toLocaleString()}자)

【장르별 챕터 요소】
${genreBlueprint.emotionalJourney?.map(e => typeof e === 'string' ? `• ${e}` : `• ${e.phase}: ${e.emotions?.join(', ')}`).join('\n') || '• 장르에 맞는 감정적 여정 구성'}`;
  }

  /**
   * 씬 작성 프롬프트
   */
  private generateSceneWritingPrompt(config: MasterPromptConfig): string {
    return `═══════════════════════════════════════════════════════════════
                    🎬 씬 작성 가이드
═══════════════════════════════════════════════════════════════

【씬의 3요소】
1. 목표 (Goal): 캐릭터가 이 씬에서 원하는 것
2. 갈등 (Conflict): 목표 달성을 방해하는 것
3. 재앙/전환 (Disaster/Turn): 씬의 결과

【씬 작성 공식】
시작: 목표 제시
중간: 시도 + 장애물
끝: 실패/부분성공/예상치 못한 결과

【씬 전환 기법】
• 시간 점프: "3일 후―"
• 장소 이동: 공백 + 새 장소 묘사
• 시점 전환: 명확한 구분선
• 컷: 긴장 고조 후 즉시 전환

【씬 시작 기법】
✅ 좋은 예:
- 행동 중간에 시작
- 대화로 시작
- 감각 묘사로 시작

❌ 피할 것:
- 기상 장면
- 이동 과정 상세 묘사
- 과거 회상으로 시작

【씬 종료 기법】
• 결정의 순간에서 끊기
• 반전 직후
• 감정적 절정
• 암시적 결말`;
  }

  /**
   * 대화 작성 프롬프트
   */
  private generateDialogueWritingPrompt(config: MasterPromptConfig): string {
    return `═══════════════════════════════════════════════════════════════
                    💬 대화 작성 가이드
═══════════════════════════════════════════════════════════════

【대화의 기능】
1. 캐릭터 개성 표현
2. 정보 전달 (자연스럽게)
3. 갈등 생성
4. 관계 발전
5. 플롯 진행
6. 서브텍스트

【대화 작성 규칙】

## 자연스러운 대화
- 완전한 문장 피하기
- 끼어들기, 말 자르기
- 반복, 수정, 머뭇거림
- 비언어적 반응

## 서브텍스트 (겉과 속이 다른 대화)
예시:
겉: "괜찮아, 신경 쓰지 마."
속: 전혀 괜찮지 않음

## 대화 태그
✅ 다양하게:
- 말했다 → 중얼거렸다, 외쳤다, 속삭였다
- 행동 태그: "고개를 저으며"
- 무태그: 화자가 명확할 때

❌ 피할 것:
- 부사 남용: "화나게 말했다" → 대화 내용으로 화남 표현
- 같은 태그 반복

## 캐릭터별 말투 가이드
${config.mainCharacters.map(char =>
  `• ${char.name}: ${char.speechPattern || char.personality.split(',')[0] + '한 말투'}`
).join('\n')}

【설명적 대화 피하기】
❌ "알다시피 우리는 3년 전에..."
✅ 상황으로 자연스럽게 정보 전달`;
  }

  /**
   * 묘사 작성 프롬프트
   */
  private generateDescriptionWritingPrompt(config: MasterPromptConfig): string {
    return `═══════════════════════════════════════════════════════════════
                    🎨 묘사 작성 가이드
═══════════════════════════════════════════════════════════════

【오감 묘사 체크리스트】
□ 시각: 색깔, 형태, 빛, 움직임
□ 청각: 소리, 음악, 침묵, 반향
□ 촉각: 질감, 온도, 압력, 통증
□ 후각: 향기, 악취, 미묘한 냄새
□ 미각: 맛, 식감 (해당될 때)

【장소 묘사 공식】
1. 전체 인상 (한 문장)
2. 특징적 디테일 2-3개
3. 분위기/감정 연결
4. 캐릭터 반응

【인물 묘사 기법】
• 첫 등장: 가장 인상적인 특징 1-2개
• 점진적 공개: 장면에 맞는 디테일 추가
• 동적 묘사: 정적 나열 피하기

【액션 묘사 기법】
• 짧은 문장으로 속도감
• 구체적 동작
• 감각적 충격
• 리듬감

【감정 묘사 = 신체 반응】
${Object.entries({
  '분노': '주먹 움켜쥠, 목 핏줄, 이 악물기',
  '두려움': '심장 빨라짐, 손바닥 땀, 숨 멎음',
  '슬픔': '목 메임, 눈 뜨거움, 가슴 답답',
  '기쁨': '입꼬리 올라감, 가슴 벅참, 발걸음 가벼움',
  '긴장': '어깨 굳음, 손가락 떨림, 입 마름'
}).map(([emotion, reactions]) => `• ${emotion}: ${reactions}`).join('\n')}

【피해야 할 묘사】
❌ 카탈로그식 나열
❌ 과도한 형용사
❌ 진부한 비유
❌ TMI (과잉 정보)`;
  }

  /**
   * 자체 편집 프롬프트
   */
  private generateSelfEditPrompt(config: MasterPromptConfig): string {
    return `═══════════════════════════════════════════════════════════════
                    ✏️ 자체 편집 가이드
═══════════════════════════════════════════════════════════════

【1차 패스: AI 탈취】
다음을 찾아 수정:
□ "마치 ~처럼" 연속 사용
□ "~였다" 문장 연속
□ 감정 직접 서술
□ 설명적 문장
□ 판에 박힌 표현

【2차 패스: 문장 다듬기】
□ 불필요한 부사/형용사 제거
□ 수동태 → 능동태
□ 긴 문장 분리
□ 반복 단어 제거
□ 리듬감 확인

【3차 패스: 캐릭터 일관성】
□ 말투 통일
□ 행동 일관성
□ 지식 범위 준수
□ 관계 반영

【4차 패스: 플롯/설정】
□ 복선 연결
□ 시간 흐름
□ 공간 일관성
□ 설정 위반 없음

【5차 패스: 품질 최종 검토】
□ 훅 효과
□ 페이싱
□ 감정 곡선
□ 분량 적절성`;
  }

  /**
   * 일관성 검사 프롬프트
   */
  private generateConsistencyCheckPrompt(config: MasterPromptConfig): string {
    return `═══════════════════════════════════════════════════════════════
                    🔍 일관성 검사 가이드
═══════════════════════════════════════════════════════════════

【캐릭터 일관성】
${config.mainCharacters.map(char => `
## ${char.name}
- 외모: [초기 묘사와 일치?]
- 성격: [일관된 행동?]
- 말투: [고유 패턴 유지?]
- 능력: [범위 내?]
- 지식: [알아야 할 것만 아는가?]
`).join('\n')}

【세계관 일관성】
□ 마법/능력 규칙 준수
□ 기술 수준 일관성
□ 지리/거리 논리성
□ 시간 흐름 정확성
□ 사회 체계 일관성

【플롯 일관성】
□ 복선 → 회수 연결
□ 인과관계 논리성
□ 캐릭터 동기 연결
□ 사건 시퀀스 정확

【시점/시제 일관성】
□ 서술 시점 통일
□ 시제 통일
□ 시점 전환 명확`;
  }

  /**
   * 품질 검사 프롬프트
   */
  private generateQualityCheckPrompt(config: MasterPromptConfig): string {
    const platformReqs = PLATFORM_REQUIREMENTS[config.targetPlatform];

    return `═══════════════════════════════════════════════════════════════
                    ✅ 품질 최종 검사
═══════════════════════════════════════════════════════════════

【플랫폼 요구사항: ${platformReqs.name}】
□ 챕터 분량: ${platformReqs.minChapterLength}~${platformReqs.maxChapterLength}자
□ 콘텐츠 등급: ${config.contentRating}
□ 특수 요구사항:
${platformReqs.specialRequirements.map(r => `  □ ${r}`).join('\n')}

【문법/맞춤법】
□ 맞춤법 오류 0
□ 띄어쓰기 정확
□ 문장부호 적절
□ 존댓말/반말 통일

【가독성】
□ 문단 길이 적절
□ 대화/서술 균형
□ 장면 전환 명확
□ 페이싱 적절

【스토리 완결성】
□ 주요 갈등 해결
□ 캐릭터 아크 완성
□ 복선 모두 회수
□ 감정적 카타르시스

【시장성】
□ 장르 컨벤션 충족
□ 독자 기대 충족
□ 차별화 요소 존재
□ 훅 효과적`;
  }

  /**
   * 특정 작업을 위한 맞춤 프롬프트 생성
   */
  generateTaskPrompt(
    masterPrompt: MasterPrompt,
    task: WritingTask
  ): string {
    let basePrompt = '';
    let contextPrompt = '';

    // 작업 유형별 기본 프롬프트 선택
    switch (task.type) {
      case 'chapter':
        basePrompt = masterPrompt.chapterWritingPrompt;
        break;
      case 'scene':
        basePrompt = masterPrompt.sceneWritingPrompt;
        break;
      case 'dialogue':
        basePrompt = masterPrompt.dialogueWritingPrompt;
        break;
      case 'description':
        basePrompt = masterPrompt.descriptionWritingPrompt;
        break;
      case 'revision':
        basePrompt = masterPrompt.selfEditPrompt;
        break;
    }

    // 컨텍스트 추가
    if (task.context) {
      contextPrompt = `
═══════════════════════════════════════════════════════════════
                    📍 현재 컨텍스트
═══════════════════════════════════════════════════════════════

${task.context.currentChapter ? `챕터: ${task.context.currentChapter}` : ''}
${task.context.currentScene ? `씬: ${task.context.currentScene}` : ''}
${task.context.location ? `장소: ${task.context.location}` : ''}
${task.context.timeOfDay ? `시간: ${task.context.timeOfDay}` : ''}
${task.context.mood ? `분위기: ${task.context.mood}` : ''}
${task.context.characters?.length ? `등장인물: ${task.context.characters.join(', ')}` : ''}
${task.context.keyEvents?.length ? `주요 사건:\n${task.context.keyEvents.map(e => `• ${e}`).join('\n')}` : ''}

${task.context.previousContent ? `
【이전 내용 요약】
${task.context.previousContent}
` : ''}
`;
    }

    // 요구사항 추가
    const requirementsPrompt = task.requirements?.length
      ? `
【이번 작업 요구사항】
${task.requirements.map(r => `• ${r}`).join('\n')}
`
      : '';

    return `${masterPrompt.systemPrompt}

${masterPrompt.stylePrompt}

${masterPrompt.characterPrompt}

${basePrompt}

${contextPrompt}

${requirementsPrompt}

═══════════════════════════════════════════════════════════════
                    ✍️ 작성 시작
═══════════════════════════════════════════════════════════════

위의 모든 가이드라인을 철저히 준수하여 작성하세요.
완료 후 자체 편집 프로세스를 거쳐 최종본을 제출하세요.`;
  }

  /**
   * 전체 소설 생성을 위한 워크플로우 프롬프트
   */
  generateFullNovelWorkflowPrompt(config: MasterPromptConfig): string {
    const masterPrompt = this.generateMasterPrompt(config);

    return `═══════════════════════════════════════════════════════════════
            📚 소설 완전 자동 생성 워크플로우
═══════════════════════════════════════════════════════════════

【프로젝트 정보】
제목: ${config.projectTitle}
장르: ${Array.isArray(config.genre) ? config.genre.join(', ') : config.genre}
타겟 플랫폼: ${PLATFORM_REQUIREMENTS[config.targetPlatform].name}
목표 분량: ${config.targetChapterCount}챕터 × ${config.targetChapterLength.toLocaleString()}자

═══════════════════════════════════════════════════════════════
                    📋 실행 단계
═══════════════════════════════════════════════════════════════

## 1단계: 기획 (Planning)
□ 상세 플롯 아웃라인 작성
□ 챕터별 비트 설정
□ 복선 계획
□ 캐릭터 아크 설계

## 2단계: 초고 작성 (First Draft)
${Array.from({ length: config.targetChapterCount }, (_, i) =>
  `□ 챕터 ${i + 1} 초고`
).join('\n')}

## 3단계: 자체 편집 (Self-Edit)
□ AI 탈취 패스
□ 문장 다듬기 패스
□ 캐릭터 일관성 패스
□ 플롯/설정 패스

## 4단계: 품질 검증 (Quality Check)
□ 다중 평가자 피드백
□ 일관성 검사
□ 장르 컨벤션 검사
□ 시장성 분석

## 5단계: 최종 교정 (Final Polish)
□ 맞춤법/문법 최종 검토
□ 포맷팅 통일
□ 메타데이터 준비

## 6단계: 출판 준비 (Publishing)
□ 플랫폼별 요구사항 충족
□ 시놉시스/키워드 최적화
□ 제출

═══════════════════════════════════════════════════════════════

${masterPrompt.systemPrompt}

${masterPrompt.stylePrompt}

${masterPrompt.genrePrompt}

${masterPrompt.characterPrompt}

${masterPrompt.qualityPrompt}

═══════════════════════════════════════════════════════════════
                    🚀 워크플로우 시작
═══════════════════════════════════════════════════════════════

위 단계를 순차적으로 수행하여 출판 수준의 완성된 소설을 생성하세요.
각 단계 완료 후 품질 기준 충족 여부를 자체 검증하세요.`;
  }

  // ============================================================================
  // 유틸리티 메서드
  // ============================================================================

  private getRoleKorean(role: string): string {
    const roleMap: Record<string, string> = {
      'protagonist': '주인공',
      'antagonist': '적대자',
      'supporting': '조연',
      'minor': '단역'
    };
    return roleMap[role] || role;
  }

  private hashConfig(config: MasterPromptConfig): string {
    const str = JSON.stringify(config);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// 싱글톤 인스턴스
export const masterPromptGenerator = new MasterPromptGenerator();

// ============================================================================
// 프리셋 설정
// ============================================================================

export const PRESET_CONFIGS: Record<string, Partial<MasterPromptConfig>> = {
  'web-novel-fantasy': {
    stylePreset: 'web-novel-fantasy',
    genre: ['fantasy', 'action'],
    targetPlatform: 'kakao-page',
    targetChapterLength: 4500,
    qualityLevel: 'publication-ready'
  },
  'web-novel-romance': {
    stylePreset: 'romance',
    genre: ['romance', 'drama'],
    targetPlatform: 'kakao-page',
    targetChapterLength: 4000,
    qualityLevel: 'publication-ready'
  },
  'literary-fiction': {
    stylePreset: 'literary-korean',
    genre: ['drama'],
    targetPlatform: 'traditional-publisher',
    targetChapterLength: 15000,
    qualityLevel: 'publication-ready'
  },
  'martial-arts': {
    stylePreset: 'web-novel-fantasy',
    genre: ['martial-arts', 'action'],
    targetPlatform: 'munpia',
    targetChapterLength: 6000,
    qualityLevel: 'publication-ready'
  },
  'thriller': {
    stylePreset: 'thriller',
    genre: ['thriller', 'mystery'],
    targetPlatform: 'ridi-books',
    targetChapterLength: 8000,
    qualityLevel: 'publication-ready'
  }
};
