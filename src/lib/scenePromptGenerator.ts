/**
 * 씬별 프롬프트 자동 생성 시스템 v1.0
 *
 * 기획 단계에서 각 씬에 대한 집필 프롬프트를 자동 생성
 * - 씬별 시작점/종료점 명확 정의
 * - 필수 포함 내용 자동 추출
 * - 이전/다음 씬 연결 정보 포함
 * - 분량 및 종료 조건 엄격 명시
 */

import type {
  VolumeStructure,
  SceneStructure,
  Project,
  Character,
  WorldSetting,
  PlotStructure,
  Foreshadowing,
  Conflict,
  WritingStyle,
} from '@/types';

// ============================================
// 씬 프롬프트 데이터 타입 (확장)
// ============================================

export interface ScenePromptData {
  sceneId: string;
  volumeNumber: number;
  sceneNumber: number;
  title: string;

  // 기본 정보
  pov: string;
  povType: 'first' | 'third-limited' | 'omniscient';
  location: string;
  timeframe: string;
  participants: string[];

  // 목표 분량
  targetWordCount: number;

  // 시작/종료 조건 (핵심!)
  startCondition: string;
  startConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
  endCondition: string;
  endConditionType: 'dialogue' | 'action' | 'narration' | 'scene';

  // 필수 포함 내용
  mustInclude: string[];

  // 연결 정보
  previousSceneSummary: string | null;
  previousSceneEndPoint: string | null;
  nextScenePreview: string | null;

  // 생성된 프롬프트
  systemPrompt: string;
  userPrompt: string;

  // 메타데이터
  generatedAt: Date;
  version: number;
}

// 황진 소설 1권 씬 분할표 예시 데이터
export interface Volume1SceneTemplate {
  sceneNumber: number;
  title: string;
  targetWordCount: number;
  pov: string;
  povType: 'first' | 'third-limited' | 'omniscient';
  location: string;
  timeframe: string;
  participants: string[];
  mustInclude: string[];
  startCondition: string;
  startConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
  endCondition: string;
  endConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
  emotionalGoal: string;
  plotFunction: string;
}

// ============================================
// 황진 장군 1권 씬 분할표 (12씬)
// ============================================

export const HWANGJIN_VOLUME_1_SCENES: Volume1SceneTemplate[] = [
  {
    sceneNumber: 1,
    title: "스타 강사 강민우",
    targetWordCount: 12000,
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월, 오후 3시",
    participants: ["강민우", "스튜디오 스태프들", "수강생들(배경)"],
    mustInclude: [
      "강민우가 황진 장군에 대한 강의를 진행하는 장면",
      "수백만 구독자를 가진 스타 강사로서의 카리스마",
      "황진 장군이 역사에서 왜 기록이 미비한지 설명",
      "강의 중 레이저 포인터로 화면을 가리키며 설명하는 모습",
      "수강생들의 열광적인 반응 (사대부들의 질투! 외침)"
    ],
    startCondition: "강민우가 '다음 문제, 황진 장군에 대한 설명으로 옳지 않은 것은?'이라고 말하며 레이저 포인터로 스크린을 가리킨다",
    startConditionType: "dialogue",
    endCondition: "강민우가 강의를 마치고 '다음 시간에는 황진 장군의 숨겨진 비밀에 대해 이야기하겠습니다. 구독과 좋아요 잊지 마세요!'라고 말하며 카메라를 향해 손을 흔든다",
    endConditionType: "dialogue",
    emotionalGoal: "현대의 성공한 역사 강사의 자신감과 열정",
    plotFunction: "주인공의 현대 정체성 확립, 황진 장군에 대한 전문 지식 보여주기"
  },
  {
    sceneNumber: 2,
    title: "운명의 섬광",
    targetWordCount: 8000,
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오 대기실",
    timeframe: "2025년 3월, 오후 5시 (강의 직후)",
    participants: ["강민우", "스튜디오 스태프들"],
    mustInclude: [
      "강의 후 피로감을 느끼며 의자에 앉는 강민우",
      "갑자기 머리를 관통하는 듯한 강렬한 두통",
      "눈앞을 가득 채우는 섬광",
      "온몸에 전기가 흐르는 듯한 통증",
      "의식을 잃기 직전 스태프들의 다급한 외침"
    ],
    startCondition: "강민우가 대기실 의자에 털썩 앉으며 '휴, 오늘 강의도 무사히 끝났군'이라고 혼잣말을 한다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '으윽...!'이라는 비명과 함께 바닥에 쓰러지고, 시야가 완전히 어둠에 잠긴다",
    endConditionType: "action",
    emotionalGoal: "갑작스러운 공포와 혼란",
    plotFunction: "빙의의 시작, 두 세계의 연결점"
  },
  {
    sceneNumber: 3,
    title: "낯선 천장",
    targetWordCount: 15000,
    pov: "강민우(황진의 몸)",
    povType: "third-limited",
    location: "남원 황진의 거처 (낡은 한옥방)",
    timeframe: "1590년 가경 23년, 이른 아침",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "낡은 서까래와 찢어진 창호지가 있는 천장을 보며 눈을 뜨는 장면",
      "온몸이 뻐근하고 쑤시는 느낌",
      "김여물이 '도련님, 괜찮으십니까?'라고 다가오는 장면",
      "자신의 손을 보며 당혹감을 느끼는 강민우",
      "거울(동경)에 비친 낯선 젊은이의 얼굴을 보고 경악",
      "김여물에게 '여기가 어디지? 지금이 몇 년도지?'라고 묻는 장면",
      "'가경 23년'이라는 대답에 머리가 멍해지는 강민우"
    ],
    startCondition: "어둠 속에서 희미하게 의식이 돌아오고, 낯선 나무 천장이 시야에 들어온다",
    startConditionType: "narration",
    endCondition: "강민우(황진)가 '가경 23년... 그러면 서기 1590년... 임진왜란 2년 전...'이라고 중얼거리며 얼굴이 창백해진다",
    endConditionType: "dialogue",
    emotionalGoal: "극도의 혼란과 당혹감, 현실 부정",
    plotFunction: "빙의 확인, 시대적 배경 설정"
  },
  {
    sceneNumber: 4,
    title: "황진이라는 이름",
    targetWordCount: 12000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처",
    timeframe: "1590년, 같은 날 아침 (씬 3 직후)",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "김여물에게 자신이 누구인지 묻는 강민우",
      "김여물이 '황진 도련님'이라고 답하는 장면",
      "역사 강사로서 황진 장군에 대한 지식을 떠올리는 내적 독백",
      "황진의 생애와 운명에 대한 회상 (이치 전투, 웅치 전투)",
      "자신이 황진의 몸에 빙의했다는 사실을 받아들이는 과정",
      "뺨을 꼬집어보며 꿈인지 확인하는 장면"
    ],
    startCondition: "강민우가 떨리는 목소리로 김여물에게 '나는... 나는 누구지?'라고 묻는다",
    startConditionType: "dialogue",
    endCondition: "강민우(황진)가 창밖을 바라보며 '젠장... 하필 왜 황진이야... 그것도 임진왜란 2년 전에...'라고 탄식한다",
    endConditionType: "dialogue",
    emotionalGoal: "절망과 체념, 그러나 희미한 각오",
    plotFunction: "황진으로서의 정체성 확립, 역사적 맥락 설명"
  },
  {
    sceneNumber: 5,
    title: "몸을 시험하다",
    targetWordCount: 15000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 마당 및 뒷산",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "마당으로 나가 몸을 움직여보는 장면",
      "예상보다 가볍고 강인한 신체 능력에 놀라는 강민우",
      "무거운 물동이를 한 손으로 들어올리는 장면",
      "놀라는 김여물의 반응",
      "뒷산으로 올라가 달려보는 장면",
      "숨이 차지 않고 몸이 날아가는 듯한 느낌"
    ],
    startCondition: "강민우(황진)가 방문을 열고 마당으로 나서며 '일단 이 몸이 어떤 상태인지 확인해봐야겠어'라고 생각한다",
    startConditionType: "action",
    endCondition: "강민우(황진)가 산 정상에서 남원 일대를 내려다보며 '이 힘이라면... 어쩌면...'이라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "새로운 가능성에 대한 희망",
    plotFunction: "황진의 초인적 신체 능력 발견"
  },
  {
    sceneNumber: 6,
    title: "산중의 맹수",
    targetWordCount: 18000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 뒷산 숲속",
    timeframe: "1590년, 같은 날 오전 (씬 5 직후)",
    participants: ["강민우(황진)", "김여물", "식인 호랑이"],
    mustInclude: [
      "산에서 내려오던 중 이상한 기척을 느끼는 장면",
      "덤불 속에서 거대한 호랑이가 튀어나오는 장면",
      "호랑이가 김여물을 덮치려는 순간",
      "본능적으로 몸을 날려 호랑이와 맞서는 강민우",
      "호랑이의 머리를 맨손으로 움켜쥐는 초인적 장면",
      "호랑이를 제압하고 쓰러뜨리는 장면",
      "경악하는 김여물의 반응"
    ],
    startCondition: "산을 내려오던 강민우(황진)가 갑자기 발걸음을 멈추며 '뭔가... 이상하다'라고 직감한다",
    startConditionType: "narration",
    endCondition: "호랑이가 쓰러지고, 김여물이 '도, 도련님... 이게 어찌 된...?'이라고 말을 잇지 못한다",
    endConditionType: "dialogue",
    emotionalGoal: "본능적 각성, 자신의 힘에 대한 확신",
    plotFunction: "황진의 초인적 무력 첫 발현"
  },
  {
    sceneNumber: 7,
    title: "결심",
    targetWordCount: 10000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처",
    timeframe: "1590년, 같은 날 저녁",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "호랑이 퇴치 후 거처로 돌아온 강민우",
      "저녁 식사를 하며 조선의 음식에 적응하는 모습",
      "앞으로의 계획을 고민하는 내적 독백",
      "임진왜란이 2년 후에 온다는 사실을 상기",
      "역사를 바꿀 수 있을지 고민하는 장면",
      "결심을 다지는 독백"
    ],
    startCondition: "강민우(황진)가 저녁상 앞에 앉으며 '참... 기묘한 하루였어'라고 한숨을 쉰다",
    startConditionType: "action",
    endCondition: "강민우(황진)가 주먹을 불끈 쥐며 '좋아. 어차피 이렇게 된 거, 한번 해보는 거야. 역사를 바꿔보자'라고 결심한다",
    endConditionType: "dialogue",
    emotionalGoal: "결단과 의지",
    plotFunction: "주인공의 목표 설정 - 역사 변경"
  },
  {
    sceneNumber: 8,
    title: "첫 번째 조력자",
    targetWordCount: 12000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 시장거리",
    timeframe: "1590년, 다음 날 오전",
    participants: ["강민우(황진)", "김여물", "배돌쇠", "시장 사람들(배경)"],
    mustInclude: [
      "조선 시대 시장의 생생한 풍경 묘사",
      "김여물의 안내로 시장을 둘러보는 장면",
      "우연히 불량배들에게 괴롭힘당하는 청년을 목격",
      "불량배들을 제압하는 강민우",
      "구해준 청년이 배돌쇠임을 알게 됨",
      "배돌쇠가 감사 인사를 하며 충성을 맹세하는 장면"
    ],
    startCondition: "강민우(황진)가 시장 입구에 서서 '조선 시대 시장이라... 생각보다 활기차군'이라고 중얼거린다",
    startConditionType: "dialogue",
    endCondition: "배돌쇠가 무릎을 꿇으며 '이 배돌쇠, 목숨을 바쳐 도련님을 모시겠습니다!'라고 외친다",
    endConditionType: "dialogue",
    emotionalGoal: "새로운 동료와의 유대감",
    plotFunction: "첫 번째 조력자 확보"
  },
  {
    sceneNumber: 9,
    title: "남원의 현실",
    targetWordCount: 14000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 관아 근처, 백성들의 마을",
    timeframe: "1590년, 같은 날 오후",
    participants: ["강민우(황진)", "김여물", "배돌쇠", "탐관오리(관리)", "고통받는 백성들"],
    mustInclude: [
      "남원의 백성들이 가혹한 세금에 시달리는 모습",
      "탐관오리가 백성들을 착취하는 장면 목격",
      "분노하는 강민우",
      "아직 힘이 부족해 직접 나서지 못하는 한계 인식",
      "백성들을 구하겠다는 다짐",
      "임진왜란 전에 해야 할 일들을 생각하는 장면"
    ],
    startCondition: "강민우(황진)가 마을을 걷다가 관리들이 백성의 곡식을 빼앗는 장면을 목격한다",
    startConditionType: "narration",
    endCondition: "강민우(황진)가 이를 악물며 '지금은 참자. 하지만 반드시... 이 땅의 백성들을 지킬 것이다'라고 다짐한다",
    endConditionType: "dialogue",
    emotionalGoal: "의분과 사명감",
    plotFunction: "조선의 현실 인식, 동기 강화"
  },
  {
    sceneNumber: 10,
    title: "선비 이서준",
    targetWordCount: 13000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 서원(書院)",
    timeframe: "1590년, 며칠 후 오후",
    participants: ["강민우(황진)", "김여물", "이서준"],
    mustInclude: [
      "남원에서 명망 있는 선비 이서준을 찾아가는 장면",
      "서원의 고즈넉한 분위기 묘사",
      "이서준과의 첫 만남",
      "이서준이 황진의 변화(빙의 후)를 의아하게 여기는 모습",
      "강민우가 조심스럽게 조선의 미래(위기)에 대해 언급",
      "이서준이 흥미를 보이며 대화를 나누는 장면"
    ],
    startCondition: "강민우(황진)가 서원 문 앞에서 '이서준... 역사서에서 본 이름이군'이라고 생각한다",
    startConditionType: "narration",
    endCondition: "이서준이 의미심장한 미소를 지으며 '황 도령, 자네가 많이 변했군. 마음에 드네'라고 말한다",
    endConditionType: "dialogue",
    emotionalGoal: "지적 교류와 신뢰의 시작",
    plotFunction: "두 번째 조력자(책사) 획득"
  },
  {
    sceneNumber: 11,
    title: "첫 훈련",
    targetWordCount: 15000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 외곽 훈련터",
    timeframe: "1590년, 한 달 후",
    participants: ["강민우(황진)", "김여물", "배돌쇠", "마을 청년들(5-6명)"],
    mustInclude: [
      "강민우가 모은 청년들과 함께 기초 무예 훈련을 시작",
      "현대의 체계적인 훈련 방식을 도입하는 장면",
      "청년들이 처음에는 어려워하다가 점점 나아지는 모습",
      "배돌쇠의 뛰어난 재능 발견",
      "김여물이 후방에서 보급을 담당하는 모습",
      "작지만 확실한 변화의 시작을 느끼는 강민우"
    ],
    startCondition: "강민우(황진)가 모인 청년들 앞에 서며 '오늘부터 너희들을 조선 최강의 전사로 만들어주겠다'라고 선언한다",
    startConditionType: "dialogue",
    endCondition: "해질녘, 땀에 젖은 청년들 사이에서 강민우(황진)가 '좋아, 첫날치고는 훌륭했다. 내일 다시 만나자'라고 말한다",
    endConditionType: "dialogue",
    emotionalGoal: "성취감과 희망",
    plotFunction: "미래를 대비한 준비 시작"
  },
  {
    sceneNumber: 12,
    title: "두 개의 세계 사이에서",
    targetWordCount: 10000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 (밤)",
    timeframe: "1590년, 같은 날 밤",
    participants: ["강민우(황진)"],
    mustInclude: [
      "하루를 마치고 홀로 방에 누운 강민우",
      "2025년의 삶을 그리워하는 내적 독백",
      "동시에 이 시대에서 해야 할 일들을 생각",
      "황진 장군의 운명(죽음)을 바꿀 수 있을지 고민",
      "달빛 아래 결의를 다지는 마무리"
    ],
    startCondition: "강민우(황진)가 홀로 방에 누워 천장을 바라보며 '벌써 한 달이 지났군...'이라고 한숨을 쉰다",
    startConditionType: "narration",
    endCondition: "강민우(황진)가 창문 너머 달을 바라보며 '강민우도, 황진도... 이제 하나다. 이 세계에서 내가 할 수 있는 모든 것을 하겠다'라고 결심하며 눈을 감는다",
    endConditionType: "dialogue",
    emotionalGoal: "정체성 통합, 결의",
    plotFunction: "1권 마무리, 2권으로의 전환 암시"
  }
];

// ============================================
// 씬 프롬프트 생성 함수
// ============================================

export function generateScenePrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[],
  allScenes: SceneStructure[],
  previousContent?: string
): ScenePromptData {
  const sceneIndex = allScenes.findIndex(s => s.id === scene.id);
  const previousScene = sceneIndex > 0 ? allScenes[sceneIndex - 1] : null;
  const nextScene = sceneIndex < allScenes.length - 1 ? allScenes[sceneIndex + 1] : null;

  // 등장 캐릭터 필터링
  const sceneCharacters = characters.filter(c =>
    scene.participants.some(p =>
      c.name.includes(p) || p.includes(c.name) ||
      (c.nickname && c.nickname.some(n => p.includes(n)))
    )
  );

  // 관련 세계관 설정 (중요도 높은 것 우선)
  const relevantWorldSettings = worldSettings
    .filter(w => w.importance === 'core' || w.importance === 'major')
    .slice(0, 5);

  // 시스템 프롬프트 생성
  const systemPrompt = generateSceneSystemPrompt(
    project,
    volume,
    scene,
    style,
    sceneCharacters,
    relevantWorldSettings
  );

  // 사용자 프롬프트 생성
  const userPrompt = generateSceneUserPrompt(
    volume,
    scene,
    previousScene,
    nextScene,
    sceneCharacters,
    previousContent
  );

  return {
    sceneId: scene.id,
    volumeNumber: volume.volumeNumber,
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    pov: scene.pov,
    povType: scene.povType,
    location: scene.location,
    timeframe: scene.timeframe,
    participants: scene.participants,
    targetWordCount: scene.targetWordCount,
    startCondition: scene.startCondition,
    startConditionType: 'narration', // 기본값
    endCondition: scene.endCondition,
    endConditionType: scene.endConditionType,
    mustInclude: scene.mustInclude,
    previousSceneSummary: previousScene?.title ? `${previousScene.title}: ${previousScene.endCondition}` : null,
    previousSceneEndPoint: previousScene?.endCondition || null,
    nextScenePreview: nextScene?.title || null,
    systemPrompt,
    userPrompt,
    generatedAt: new Date(),
    version: 1
  };
}

// ============================================
// 씬 시스템 프롬프트 생성
// ============================================

function generateSceneSystemPrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[]
): string {
  const perspectiveMap: Record<string, string> = {
    'first': '1인칭 시점',
    'third-limited': '3인칭 제한 시점',
    'omniscient': '전지적 작가 시점',
    'second': '2인칭 시점',
  };

  const povTypeMap: Record<string, string> = {
    'first': '1인칭',
    'third-limited': '3인칭 제한',
    'omniscient': '전지적',
  };

  let prompt = `당신은 한국의 베스트셀러 소설가입니다. 아래 규칙을 철저히 따라 소설의 **한 씬만** 집필하세요.

═══════════════════════════════════════════════════════════════
## 📚 작품 정보
═══════════════════════════════════════════════════════════════
- 작품명: ${project.title}
- 장르: ${project.genre.join(', ')}
- 현재: ${volume.volumeNumber}권 ${scene.sceneNumber}씬 "${scene.title}"

═══════════════════════════════════════════════════════════════
## 🎬 이 씬의 설정 (절대 변경 금지!)
═══════════════════════════════════════════════════════════════
- **시점(POV)**: ${scene.pov} (${povTypeMap[scene.povType] || scene.povType})
- **장소**: ${scene.location}
- **시간대**: ${scene.timeframe}
- **등장인물**: ${scene.participants.join(', ')}
- **목표 분량**: ${scene.targetWordCount.toLocaleString()}자

═══════════════════════════════════════════════════════════════
## ✍️ 문체 설정
═══════════════════════════════════════════════════════════════
- 시점: ${perspectiveMap[style.perspective]}
- 시제: ${style.tense === 'past' ? '과거형' : '현재형'}
- 대사 비율: ${style.dialogueRatio}%
- 묘사 상세도: ${style.descriptionDetail}/10
- 페이싱: ${style.pacing === 'slow' ? '느리고 묘사 풍부' : style.pacing === 'fast' ? '빠르고 긴박' : '적절한 균형'}
- 감정 강도: ${style.emotionIntensity}/10

═══════════════════════════════════════════════════════════════
## 👥 등장인물 정보
═══════════════════════════════════════════════════════════════
`;

  // 캐릭터 정보 추가
  characters.forEach(c => {
    prompt += `
### ${c.name}
- 역할: ${c.role}
- 나이/성별: ${c.age}, ${c.gender}
- 성격: ${c.personality}
- 목표: ${c.goal}
`;
    if (c.speechPattern) {
      prompt += `- 말투: ${c.speechPattern.tone || '보통'}`;
      if (c.speechPattern.catchphrase && c.speechPattern.catchphrase.length > 0) {
        prompt += `, 입버릇: "${c.speechPattern.catchphrase[0]}"`;
      }
      prompt += '\n';
    }
  });

  // 세계관 정보 추가
  if (worldSettings.length > 0) {
    prompt += `
═══════════════════════════════════════════════════════════════
## 🌍 세계관 설정
═══════════════════════════════════════════════════════════════
`;
    worldSettings.forEach(w => {
      prompt += `- **${w.title}**: ${w.description.slice(0, 100)}\n`;
    });
  }

  // 절대 규칙 (핵심!)
  prompt += `
═══════════════════════════════════════════════════════════════
## 🚨🚨🚨 절대 규칙 (위반 시 전체 생성 실패!) 🚨🚨🚨
═══════════════════════════════════════════════════════════════

### 1️⃣ 씬 범위 엄수 (가장 중요!!!)
╔══════════════════════════════════════════════════════════════╗
║  ⛔ 이 씬에 정해진 내용만 작성!!!                            ║
║  ⛔ 아래 mustInclude 외 새로운 사건 금지!!!                  ║
║  ⛔ 위에 정해진 장소/시간/인물 외 등장 금지!!!               ║
╚══════════════════════════════════════════════════════════════╝

**금지:**
- ❌ 씬에 정의된 장소(${scene.location}) 외 다른 장소 등장
- ❌ 씬에 정의된 등장인물(${scene.participants.join(', ')}) 외 다른 인물 등장
- ❌ 씬에 정의된 시간대(${scene.timeframe}) 외 다른 시간 묘사
- ❌ 다음 씬 내용 미리 작성
- ❌ 이전 씬 내용 다시 작성
- ❌ 분량 채우려고 새 사건/인물/장소 추가

**분량 부족 시:**
→ 새 사건 추가 금지! 현재 장면의 감정/분위기/디테일을 깊게!

### 2️⃣ 시간 점프 완전 차단
**금지 표현:**
- ❌ "며칠이 지나", "시간이 흘러", "어느덧", "한참 후"
- ❌ "다음 날", "이튿날", "그날 밤", "아침이 되자"
- ❌ "결국", "마침내", "드디어", "이윽고"
- ❌ "한편", "그 시각", "다른 곳에서는"

### 3️⃣ 종료 조건 엄수
╔══════════════════════════════════════════════════════════════╗
║  ⛔ 종료 조건 도달 시 "---" 쓰고 즉시 멈춤!!!                ║
║  ⛔ 종료 조건 이후 단 한 글자도 쓰면 안 됨!!!                ║
╚══════════════════════════════════════════════════════════════╝

### 4️⃣ 반복 금지
- ❌ 같은 유형의 장면 반복 (각성, 결심, 화해 등은 1번만)
- ❌ "주먹을 불끈", "눈빛이 변하다" 등 상투적 표현

### 5️⃣ 빈 괄호 금지
- ❌ "황진()", "성웅()" 등 빈 괄호 사용 금지
- ✅ "황진 장군", "성웅 이순신" (괄호 없이 자연스럽게)
`;

  return prompt;
}

// ============================================
// 씬 사용자 프롬프트 생성
// ============================================

function generateSceneUserPrompt(
  volume: VolumeStructure,
  scene: SceneStructure,
  previousScene: SceneStructure | null,
  nextScene: SceneStructure | null,
  characters: Character[],
  previousContent?: string
): string {
  let prompt = `
═══════════════════════════════════════════════════════════════
## 📝 ${volume.volumeNumber}권 ${scene.sceneNumber}씬 "${scene.title}" 집필
═══════════════════════════════════════════════════════════════

### 📍 시작 조건
"${scene.startCondition}"

### 🎯 반드시 포함할 내용 (mustInclude)
`;

  scene.mustInclude.forEach((item, i) => {
    prompt += `${i + 1}. ${item}\n`;
  });

  prompt += `
### 🛑 종료 조건 (이 조건 도달 시 "---" 쓰고 멈춤!)
"${scene.endCondition}"
→ 종료 유형: ${scene.endConditionType === 'dialogue' ? '대사' : scene.endConditionType === 'action' ? '행동' : '서술'}

### 📏 목표 분량
${scene.targetWordCount.toLocaleString()}자 (±10%)
※ 분량 부족해도 종료 조건 도달 시 반드시 멈춤!
`;

  // 이전 씬 정보
  if (previousScene) {
    prompt += `
### ⬅️ 이전 씬 연결
- 이전 씬: ${previousScene.sceneNumber}씬 "${previousScene.title}"
- 이전 씬 종료: "${previousScene.endCondition}"
→ 이 내용과 자연스럽게 연결되게 시작하세요.
`;
  }

  // 이어쓰기인 경우
  if (previousContent) {
    prompt += `
### 🔄 이어쓰기 (마지막 500자)
"""
${previousContent.slice(-500)}
"""
→ 위 내용에서 자연스럽게 이어서 쓰세요.
`;
  }

  // 다음 씬 예고 (참고용)
  if (nextScene) {
    prompt += `
### ➡️ 다음 씬 예고 (참고만! 절대 이 내용 쓰지 마세요!)
- 다음 씬: ${nextScene.sceneNumber}씬 "${nextScene.title}"
- 다음 씬에서 다룰 내용: ${nextScene.mustInclude[0] || '(다음 씬에서 처리)'}
⚠️ 이 내용은 다음 씬에서 다룹니다. 여기서 미리 쓰지 마세요!
`;
  }

  prompt += `
═══════════════════════════════════════════════════════════════
## ✅ 집필 시작
═══════════════════════════════════════════════════════════════

위 설정에 따라 ${scene.sceneNumber}씬을 집필하세요.
시작 조건: "${scene.startCondition}"
`;

  return prompt;
}

// ============================================
// AI용 씬 분할표 자동 생성 프롬프트
// ============================================

export function generateScenePlanningPrompt(
  project: Project,
  volumeNumber: number,
  volumeTitle: string,
  volumeStartPoint: string,
  volumeEndPoint: string,
  volumeCoreEvent: string,
  targetSceneCount: number,
  targetWordCount: number,
  previousVolumeSummary?: string
): string {
  return `당신은 소설 기획 전문가입니다. 아래 권의 씬 분할표를 작성해주세요.

## 작품 정보
- 작품명: ${project.title}
- 장르: ${project.genre.join(', ')}
- 컨셉: ${project.concept}

## ${volumeNumber}권 "${volumeTitle}" 정보
- 시작점: ${volumeStartPoint}
- 종료점: ${volumeEndPoint}
- 핵심 사건: ${volumeCoreEvent}
- 목표 분량: ${targetWordCount.toLocaleString()}자
- 목표 씬 수: ${targetSceneCount}개
${previousVolumeSummary ? `- 이전 권 요약: ${previousVolumeSummary}` : ''}

## 출력 형식 (JSON)
다음 형식으로 ${targetSceneCount}개의 씬을 생성해주세요:

\`\`\`json
{
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "씬 제목",
      "targetWordCount": 12000,
      "pov": "시점 인물 이름",
      "povType": "third-limited",
      "location": "구체적인 장소",
      "timeframe": "구체적인 시간대",
      "participants": ["등장인물1", "등장인물2"],
      "mustInclude": [
        "반드시 포함할 내용 1",
        "반드시 포함할 내용 2",
        "반드시 포함할 내용 3",
        "반드시 포함할 내용 4",
        "반드시 포함할 내용 5"
      ],
      "startCondition": "이 씬의 시작 조건 (구체적인 대사나 행동)",
      "startConditionType": "dialogue",
      "endCondition": "이 씬의 종료 조건 (구체적인 대사나 행동)",
      "endConditionType": "dialogue",
      "emotionalGoal": "이 씬의 감정적 목표",
      "plotFunction": "이 씬이 플롯에서 하는 역할"
    }
  ]
}
\`\`\`

## 규칙
1. 각 씬은 하나의 연속된 장면이어야 함 (시간 점프 없음)
2. 시작/종료 조건은 반드시 구체적인 대사나 행동으로
3. mustInclude는 5개 내외로, 구체적이고 행동 가능한 내용
4. 이전 씬의 종료 조건과 다음 씬의 시작 조건이 자연스럽게 연결
5. 권의 시작점에서 시작하여 종료점에서 정확히 끝나야 함
6. 분량은 씬별로 적절히 배분 (총합 = 목표 분량)
7. povType은 "first", "third-limited", "omniscient" 중 하나
8. endConditionType은 "dialogue", "action", "narration", "scene" 중 하나

JSON만 출력하세요. 다른 설명은 필요 없습니다.`;
}

// ============================================
// 템플릿에서 SceneStructure로 변환
// ============================================

export function templateToSceneStructure(
  template: Volume1SceneTemplate,
  volumeId: string
): SceneStructure {
  return {
    id: crypto.randomUUID(),
    volumeId,
    sceneNumber: template.sceneNumber,
    title: template.title,
    targetWordCount: template.targetWordCount,
    pov: template.pov,
    povType: template.povType,
    location: template.location,
    timeframe: template.timeframe,
    participants: template.participants,
    mustInclude: template.mustInclude,
    startCondition: template.startCondition,
    endCondition: template.endCondition,
    endConditionType: template.endConditionType,
    status: 'pending',
    actualWordCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// 전체 권의 모든 씬 프롬프트 생성
// ============================================

export function generateAllScenePrompts(
  project: Project,
  volume: VolumeStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[]
): ScenePromptData[] {
  return volume.scenes.map(scene =>
    generateScenePrompt(
      project,
      volume,
      scene,
      style,
      characters,
      worldSettings,
      volume.scenes
    )
  );
}
