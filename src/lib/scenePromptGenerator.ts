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
// 황진 장군 1권 씬 분할표 (50씬 - 20만자 기준, 평균 4000자/씬)
// 기존 12씬을 50씬으로 세분화
// ============================================

export const HWANGJIN_VOLUME_1_SCENES: Volume1SceneTemplate[] = [
  // ========== 현대 파트 (씬 1-6) ==========
  {
    sceneNumber: 1,
    title: "강의 시작",
    targetWordCount: 3000,
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월, 오후 3시",
    participants: ["강민우", "스튜디오 스태프"],
    mustInclude: [
      "강민우가 카메라 앞에 서서 '다음 문제!'라고 외치는 장면",
      "레이저 포인터로 스크린을 가리키며 황진 장군 문제 출제",
      "수백만 구독자를 가진 스타 강사로서의 자신감"
    ],
    startCondition: "강민우가 '자, 집중하세요! 다음 문제 갑니다!'라고 말하며 레이저 포인터를 든다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '정답은 3번입니다. 황진 장군은 여자가 아닙니다'라고 말한다",
    endConditionType: "dialogue",
    emotionalGoal: "자신감",
    plotFunction: "주인공 현대 정체성 확립"
  },
  {
    sceneNumber: 2,
    title: "황진 설명",
    targetWordCount: 4000,
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월, 오후 3시 10분",
    participants: ["강민우"],
    mustInclude: [
      "황진 장군이 역사에서 왜 덜 알려졌는지 설명",
      "사대부들의 질투로 기록이 미비함을 설명",
      "열정적으로 손짓하며 강의하는 모습"
    ],
    startCondition: "강민우가 '여러분, 황진 장군이 왜 이순신만큼 유명하지 않은지 아시나요?'라고 묻는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '사대부들의 질투입니다!'라고 외치며 책상을 탁 친다",
    endConditionType: "dialogue",
    emotionalGoal: "열정",
    plotFunction: "황진 장군 지식 전달"
  },
  {
    sceneNumber: 3,
    title: "강의 마무리",
    targetWordCount: 2500,
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월, 오후 4시 50분",
    participants: ["강민우"],
    mustInclude: [
      "강의 마무리 멘트",
      "다음 시간 예고 (황진 장군의 비밀)",
      "카메라를 향해 손 흔들기"
    ],
    startCondition: "강민우가 '자, 오늘 강의는 여기까지입니다'라고 말한다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '구독과 좋아요 잊지 마세요!'라고 말하며 카메라를 향해 손을 흔든다",
    endConditionType: "dialogue",
    emotionalGoal: "만족감",
    plotFunction: "현대 파트 마무리"
  },
  {
    sceneNumber: 4,
    title: "휴식",
    targetWordCount: 2000,
    pov: "강민우",
    povType: "third-limited",
    location: "유튜브 스튜디오 대기실",
    timeframe: "2025년 3월, 오후 5시",
    participants: ["강민우"],
    mustInclude: [
      "강의 후 피로감을 느끼며 의자에 앉는 장면",
      "물을 마시며 한숨 돌리는 모습",
      "혼잣말로 오늘 강의 평가"
    ],
    startCondition: "강민우가 대기실 의자에 털썩 앉으며 '휴...'라고 한숨을 쉰다",
    startConditionType: "action",
    endCondition: "강민우가 물컵을 내려놓으며 '오늘도 잘했어'라고 혼잣말한다",
    endConditionType: "dialogue",
    emotionalGoal: "피로",
    plotFunction: "빙의 전 일상"
  },
  {
    sceneNumber: 5,
    title: "두통",
    targetWordCount: 3000,
    pov: "강민우",
    povType: "third-limited",
    location: "유튜브 스튜디오 대기실",
    timeframe: "2025년 3월, 오후 5시 5분",
    participants: ["강민우", "스태프"],
    mustInclude: [
      "갑자기 시작되는 강렬한 두통",
      "관자놀이를 움켜쥐며 고통스러워하는 모습",
      "눈앞이 번쩍이는 섬광"
    ],
    startCondition: "강민우가 갑자기 '으...'라며 관자놀이를 움켜쥔다",
    startConditionType: "action",
    endCondition: "강민우가 '뭐지... 이 빛은...?'이라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "공포",
    plotFunction: "빙의 시작"
  },
  {
    sceneNumber: 6,
    title: "쓰러짐",
    targetWordCount: 2500,
    pov: "강민우",
    povType: "third-limited",
    location: "유튜브 스튜디오 대기실",
    timeframe: "2025년 3월, 오후 5시 7분",
    participants: ["강민우", "스태프들"],
    mustInclude: [
      "온몸에 전기가 흐르는 듯한 통증",
      "바닥에 쓰러지는 장면",
      "스태프들의 다급한 외침"
    ],
    startCondition: "강민우가 '으아악!'이라는 비명과 함께 의자에서 떨어진다",
    startConditionType: "action",
    endCondition: "시야가 완전히 어둠에 잠기며 의식을 잃는다",
    endConditionType: "narration",
    emotionalGoal: "혼란",
    plotFunction: "현대-과거 전환점"
  },
  // ========== 과거 빙의 직후 파트 (씬 7-12) ==========
  {
    sceneNumber: 7,
    title: "낯선 천장",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 (한옥방)",
    timeframe: "1590년, 이른 아침",
    participants: ["강민우(황진)"],
    mustInclude: [
      "낡은 서까래와 창호지 천장을 보며 눈을 뜨는 장면",
      "온몸이 뻐근하고 쑤시는 느낌",
      "자신의 손을 보며 당혹감"
    ],
    startCondition: "어둠 속에서 의식이 돌아오고, 낯선 나무 천장이 시야에 들어온다",
    startConditionType: "narration",
    endCondition: "강민우가 '여기가... 어디지?'라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "혼란",
    plotFunction: "빙의 인식"
  },
  {
    sceneNumber: 8,
    title: "김여물 등장",
    targetWordCount: 3500,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 (한옥방)",
    timeframe: "1590년, 같은 날 아침",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "김여물이 '도련님, 괜찮으십니까?'라고 다가오는 장면",
      "낯선 복장의 남자를 보고 놀라는 강민우",
      "김여물에게 '여기가 어디지?'라고 묻는 장면"
    ],
    startCondition: "방문이 열리며 한복 차림의 남자가 들어온다",
    startConditionType: "action",
    endCondition: "김여물이 '남원입니다, 도련님'이라고 대답한다",
    endConditionType: "dialogue",
    emotionalGoal: "당혹",
    plotFunction: "시대 확인 시작"
  },
  {
    sceneNumber: 9,
    title: "시대 확인",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 (한옥방)",
    timeframe: "1590년, 같은 날 아침",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "'지금이 몇 년도지?'라고 묻는 장면",
      "'가경 23년입니다'라는 대답",
      "1590년임을 깨닫고 얼굴이 창백해지는 장면"
    ],
    startCondition: "강민우가 '지금이 몇 년도야?'라고 다급하게 묻는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '1590년... 임진왜란 2년 전...'이라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "충격",
    plotFunction: "시대 배경 확정"
  },
  {
    sceneNumber: 10,
    title: "거울 속 얼굴",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 (한옥방)",
    timeframe: "1590년, 같은 날 아침",
    participants: ["강민우(황진)"],
    mustInclude: [
      "동경(거울)에 비친 낯선 젊은이의 얼굴",
      "거울을 만지며 현실임을 확인",
      "뺨을 꼬집어보는 장면"
    ],
    startCondition: "강민우가 방 구석의 동경을 발견하고 다가간다",
    startConditionType: "action",
    endCondition: "강민우가 '진짜... 꿈이 아니야...'라고 한숨을 쉰다",
    endConditionType: "dialogue",
    emotionalGoal: "수용",
    plotFunction: "빙의 확정"
  },
  {
    sceneNumber: 11,
    title: "황진이라는 이름",
    targetWordCount: 4000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 (한옥방)",
    timeframe: "1590년, 같은 날 아침",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "'내 이름이 뭐지?'라고 묻는 장면",
      "'황진 도련님이십니다'라는 대답",
      "역사 지식으로 황진을 떠올리는 내적 독백"
    ],
    startCondition: "강민우가 김여물에게 '나는... 누구지?'라고 묻는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '황진... 그 황진 장군?!'이라고 소리친다",
    endConditionType: "dialogue",
    emotionalGoal: "경악",
    plotFunction: "정체성 확립"
  },
  {
    sceneNumber: 12,
    title: "절망",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 (한옥방)",
    timeframe: "1590년, 같은 날 아침",
    participants: ["강민우(황진)"],
    mustInclude: [
      "황진의 운명(진주성 전사)을 떠올리는 장면",
      "창밖을 바라보며 탄식하는 모습",
      "임진왜란까지 2년밖에 없음을 상기"
    ],
    startCondition: "강민우가 창가로 걸어가며 머리를 감싼다",
    startConditionType: "action",
    endCondition: "강민우가 '젠장... 하필 왜 황진이야...'라고 탄식한다",
    endConditionType: "dialogue",
    emotionalGoal: "절망",
    plotFunction: "동기 부여 시작"
  },

  // ========== 신체 능력 발견 파트 (씬 13-18) ==========
  {
    sceneNumber: 13,
    title: "마당으로",
    targetWordCount: 2500,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 마당",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "방문을 열고 마당으로 나서는 장면",
      "조선시대 마당 풍경 묘사",
      "몸을 움직여보려는 의도"
    ],
    startCondition: "강민우가 '일단 이 몸을 확인해봐야겠어'라고 생각하며 일어선다",
    startConditionType: "narration",
    endCondition: "강민우가 마당 한가운데에 서서 팔을 뻗어본다",
    endConditionType: "action",
    emotionalGoal: "호기심",
    plotFunction: "신체 테스트 시작"
  },
  {
    sceneNumber: 14,
    title: "물동이",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 마당",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "물동이를 한 손으로 들어올리는 장면",
      "예상보다 가벼운 느낌에 놀라는 모습",
      "김여물의 놀란 반응"
    ],
    startCondition: "강민우가 마당 구석의 무거운 물동이를 발견한다",
    startConditionType: "narration",
    endCondition: "김여물이 '도, 도련님?!'이라고 놀라 외친다",
    endConditionType: "dialogue",
    emotionalGoal: "놀라움",
    plotFunction: "초인적 힘 발견"
  },
  {
    sceneNumber: 15,
    title: "뒷산으로",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처 뒤 산길",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "뒷산으로 달려가는 장면",
      "숨이 차지 않는 것에 놀라는 모습",
      "김여물이 뒤처지는 장면"
    ],
    startCondition: "강민우가 '산을 뛰어보자'라며 뒷산을 향해 달린다",
    startConditionType: "action",
    endCondition: "강민우가 뒤를 돌아보며 '왜 이렇게 느려?'라고 묻는다",
    endConditionType: "dialogue",
    emotionalGoal: "흥분",
    plotFunction: "초인적 체력 확인"
  },
  {
    sceneNumber: 16,
    title: "산 정상",
    targetWordCount: 2500,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 뒷산 정상",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)"],
    mustInclude: [
      "산 정상에서 남원 일대를 내려다보는 장면",
      "조선시대 풍경 묘사",
      "희망을 느끼는 내적 독백"
    ],
    startCondition: "강민우가 산 정상에 도착해 숨을 고른다",
    startConditionType: "action",
    endCondition: "강민우가 '이 힘이라면... 어쩌면...'이라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "희망",
    plotFunction: "가능성 인식"
  },
  {
    sceneNumber: 17,
    title: "호랑이 등장",
    targetWordCount: 4000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 뒷산 숲속",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "김여물", "호랑이"],
    mustInclude: [
      "이상한 기척을 느끼는 장면",
      "덤불에서 호랑이가 튀어나오는 장면",
      "호랑이가 김여물을 덮치려는 순간"
    ],
    startCondition: "산을 내려오던 강민우가 갑자기 발걸음을 멈춘다",
    startConditionType: "action",
    endCondition: "호랑이가 김여물을 향해 도약한다",
    endConditionType: "action",
    emotionalGoal: "긴장",
    plotFunction: "위기 발생"
  },
  {
    sceneNumber: 18,
    title: "호랑이 제압",
    targetWordCount: 5000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 뒷산 숲속",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "김여물", "호랑이"],
    mustInclude: [
      "본능적으로 호랑이와 맞서는 장면",
      "호랑이 머리를 맨손으로 움켜쥐는 장면",
      "호랑이를 제압하고 쓰러뜨리는 장면"
    ],
    startCondition: "강민우가 '안 돼!'라고 외치며 몸을 날린다",
    startConditionType: "dialogue",
    endCondition: "호랑이가 쓰러지고, 김여물이 '도, 도련님...'이라고 말을 잇지 못한다",
    endConditionType: "dialogue",
    emotionalGoal: "각성",
    plotFunction: "초인적 무력 발현"
  },

  // ========== 결심과 준비 파트 (씬 19-24) ==========
  {
    sceneNumber: 19,
    title: "귀환",
    targetWordCount: 2500,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처",
    timeframe: "1590년, 같은 날 저녁",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "호랑이 퇴치 후 거처로 돌아오는 장면",
      "김여물이 아직도 놀라워하는 모습",
      "저녁상이 차려진 모습"
    ],
    startCondition: "강민우와 김여물이 거처 대문을 들어선다",
    startConditionType: "action",
    endCondition: "강민우가 저녁상 앞에 앉는다",
    endConditionType: "action",
    emotionalGoal: "안도",
    plotFunction: "일상 복귀"
  },
  {
    sceneNumber: 20,
    title: "조선 음식",
    targetWordCount: 2500,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처",
    timeframe: "1590년, 같은 날 저녁",
    participants: ["강민우(황진)"],
    mustInclude: [
      "조선시대 음식을 먹는 장면",
      "현대 음식과 비교하는 내적 독백",
      "의외로 맛있다는 반응"
    ],
    startCondition: "강민우가 숟가락을 들고 밥을 떠먹는다",
    startConditionType: "action",
    endCondition: "강민우가 '생각보다 괜찮네'라고 혼잣말한다",
    endConditionType: "dialogue",
    emotionalGoal: "적응",
    plotFunction: "조선 생활 적응 시작"
  },
  {
    sceneNumber: 21,
    title: "임진왜란 고민",
    targetWordCount: 3500,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처",
    timeframe: "1590년, 같은 날 밤",
    participants: ["강민우(황진)"],
    mustInclude: [
      "임진왜란이 2년 후에 온다는 사실을 상기하는 독백",
      "역사를 바꿀 수 있을지 고민",
      "이순신, 황진 등 역사 지식 활용 가능성"
    ],
    startCondition: "강민우가 밤하늘의 달을 바라보며 생각에 잠긴다",
    startConditionType: "narration",
    endCondition: "강민우가 '역사를 바꿀 수 있을까...'라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "고뇌",
    plotFunction: "목표 설정 준비"
  },
  {
    sceneNumber: 22,
    title: "결심",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 황진의 거처",
    timeframe: "1590년, 같은 날 밤",
    participants: ["강민우(황진)"],
    mustInclude: [
      "결심을 다지는 독백",
      "주먹을 불끈 쥐는 동작",
      "역사를 바꾸겠다는 선언"
    ],
    startCondition: "강민우가 자리에서 벌떡 일어선다",
    startConditionType: "action",
    endCondition: "강민우가 '좋아. 역사를 바꿔보자'라고 결심한다",
    endConditionType: "dialogue",
    emotionalGoal: "결의",
    plotFunction: "목표 확정"
  },

  // 여기에 더 많은 씬 추가 가능 (23-50)
  // 시장, 배돌쇠, 이서준, 훈련 등의 파트를 각각 3-5개 씬으로 분할
  {
    sceneNumber: 23,
    title: "시장 도착",
    targetWordCount: 3000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 시장 입구",
    timeframe: "1590년, 다음 날 오전",
    participants: ["강민우(황진)", "김여물"],
    mustInclude: [
      "조선시대 시장의 활기찬 풍경",
      "김여물의 안내를 받는 장면",
      "현대와 다른 시장 모습에 놀라는 강민우"
    ],
    startCondition: "강민우가 시장 입구에 서서 주변을 둘러본다",
    startConditionType: "action",
    endCondition: "강민우가 '생각보다 활기차네'라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "호기심",
    plotFunction: "조선 사회 경험"
  },
  {
    sceneNumber: 24,
    title: "배돌쇠 구출",
    targetWordCount: 4000,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 시장",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "김여물", "배돌쇠", "불량배들"],
    mustInclude: [
      "불량배들에게 괴롭힘당하는 청년 목격",
      "불량배들을 제압하는 강민우",
      "구해준 청년이 배돌쇠임을 알게 됨"
    ],
    startCondition: "시장 골목에서 소란이 들린다",
    startConditionType: "narration",
    endCondition: "배돌쇠가 '이 은혜를 잊지 않겠습니다!'라고 외친다",
    endConditionType: "dialogue",
    emotionalGoal: "정의감",
    plotFunction: "첫 조력자 획득"
  },
  {
    sceneNumber: 25,
    title: "배돌쇠 충성",
    targetWordCount: 2500,
    pov: "강민우(황진)",
    povType: "third-limited",
    location: "남원 시장",
    timeframe: "1590년, 같은 날 오전",
    participants: ["강민우(황진)", "배돌쇠"],
    mustInclude: [
      "배돌쇠가 무릎 꿇고 충성 맹세",
      "강민우가 일으켜 세우는 장면",
      "김여물이 배돌쇠를 의심하는 눈빛"
    ],
    startCondition: "배돌쇠가 '도련님!'이라 부르며 무릎을 꿇는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '일어나. 앞으로 잘해보자'라고 말한다",
    endConditionType: "dialogue",
    emotionalGoal: "유대감",
    plotFunction: "조력자 확보 완료"
  },
  // 나머지 씬들은 AI가 generateScenePlanningPrompt로 자동 생성
  // 여기는 예시 템플릿일 뿐, 실제 사용 시 AI가 50개 씬을 생성함
];

// 💡 참고: 위 템플릿은 25개 씬의 예시입니다.
// 실제 20만자 권을 기획할 때는 generateScenePlanningPrompt()가
// AI를 통해 40~60개의 씬을 자동 생성합니다.
// 씬당 평균 4,000자로 계산: 200,000자 ÷ 4,000자 = 50개 씬

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
  // 🔒 씬 수 자동 계산 (최소 40개, 20만자 기준)
  // 일반 씬: 2000~5000자, 중요 씬: 5000~8000자
  // 평균 4000자 기준으로 계산
  const AVERAGE_WORDS_PER_SCENE = 4000;
  const MIN_SCENES = 40;
  const calculatedSceneCount = Math.max(MIN_SCENES, Math.ceil(targetWordCount / AVERAGE_WORDS_PER_SCENE));
  const actualSceneCount = Math.max(targetSceneCount, calculatedSceneCount);

  // 씬당 평균 분량 계산
  const averageWordsPerScene = Math.floor(targetWordCount / actualSceneCount);

  console.log(`[ScenePromptGenerator] 권 분량: ${targetWordCount.toLocaleString()}자`);
  console.log(`[ScenePromptGenerator] 계산된 씬 수: ${actualSceneCount}개 (요청: ${targetSceneCount}개)`);
  console.log(`[ScenePromptGenerator] 씬당 평균 분량: ${averageWordsPerScene.toLocaleString()}자`);

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
${previousVolumeSummary ? `- 이전 권 요약: ${previousVolumeSummary}` : ''}

## 🔴🔴🔴 중요: 씬 분량 규칙 🔴🔴🔴
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**하나의 씬 = 하나의 연속된 장면 (시간 점프 없음!)**

| 씬 유형 | 분량 | 설명 |
|---------|------|------|
| 일반 씬 | 2,000~4,000자 | 대화, 이동, 일상 장면 |
| 중요 씬 | 4,000~6,000자 | 갈등, 액션, 감정적 장면 |
| 클라이맥스 씬 | 6,000~8,000자 | 전투, 고백, 반전 |

**⛔ 8,000자 초과 금지! → 씬을 더 잘게 나눠야 함**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 필수 씬 수: ${actualSceneCount}개 (±5개)
→ 권 분량 ${targetWordCount.toLocaleString()}자 ÷ 평균 ${averageWordsPerScene.toLocaleString()}자 = ${actualSceneCount}개

## 출력 형식 (JSON)

\`\`\`json
{
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "씬 제목 (5자 이내)",
      "targetWordCount": 3000,
      "pov": "시점 인물 이름",
      "povType": "third-limited",
      "location": "구체적인 장소 (하나만!)",
      "timeframe": "구체적인 시간대 (연속된 시간)",
      "participants": ["등장인물1", "등장인물2"],
      "mustInclude": [
        "반드시 포함할 내용 1 (구체적 행동/대사)",
        "반드시 포함할 내용 2",
        "반드시 포함할 내용 3"
      ],
      "startCondition": "이 씬의 정확한 시작점 (첫 문장으로 쓸 수 있는 구체적인 대사나 행동)",
      "startConditionType": "dialogue",
      "endCondition": "이 씬의 정확한 종료점 (마지막 문장으로 쓸 수 있는 구체적인 대사나 행동)",
      "endConditionType": "dialogue",
      "emotionalGoal": "이 씬의 감정적 목표 (한 단어)",
      "plotFunction": "이 씬이 플롯에서 하는 역할"
    }
  ]
}
\`\`\`

## 🔴 필수 규칙 (위반 시 재생성!)

### 1️⃣ 씬 분량 엄수
- 일반 씬: 2,000~4,000자
- 중요 씬: 4,000~6,000자
- 클라이맥스 씬: 6,000~8,000자
- **8,000자 초과 절대 금지!**

### 2️⃣ 하나의 씬 = 하나의 연속된 장면
- 장소: 하나만 (이동 시 씬 분리)
- 시간: 연속 (시간 점프 시 씬 분리)
- 등장인물: 2~5명 이내

### 3️⃣ 시작/종료 조건은 구체적으로
- ❌ "강민우가 강의를 시작한다" (너무 추상적)
- ✅ "강민우가 '자, 오늘 강의를 시작하겠습니다'라고 말한다" (구체적)

### 4️⃣ mustInclude는 3~5개 (행동/대사 중심)
- ❌ "강민우의 내면 갈등" (추상적)
- ✅ "강민우가 '진짜 황진이 맞아?'라고 스스로에게 묻는 장면" (구체적)

### 5️⃣ 씬 연결
- N씬의 endCondition과 N+1씬의 startCondition이 자연스럽게 연결
- 시간 점프가 필요하면 별도의 "전환 씬"으로 처리

### 6️⃣ 총 분량 확인
- 모든 씬의 targetWordCount 합 = ${targetWordCount.toLocaleString()}자 (±10%)

## 씬 수: ${actualSceneCount}개를 반드시 생성하세요!

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
