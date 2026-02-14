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
import { generateLiteraryDepthPrompt, type LiteraryDepthLevel } from './literaryDepthSystem';
import { generateStylePrompt, CLICHE_ALTERNATIVES } from './masterworkStyleGuide';

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

// 황진 소설 1권 씬 분할표 예시 데이터 (v3.0 강화)
export interface Volume1SceneTemplate {
  sceneNumber: number;
  title: string;
  targetWordCount: number;
  sceneType: 'mini' | 'normal' | 'important' | 'climax'; // v3.0: 씬 유형
  pov: string;
  povType: 'first' | 'third-limited' | 'omniscient';
  location: string;
  timeframe: string;
  participants: string[];
  mustInclude: string[];
  forbiddenInThisScene: string[]; // v3.0: 이 씬에서 금지된 키워드
  startCondition: string;
  startConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
  endCondition: string;
  endConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
  emotionalGoal: string;
  plotFunction: string;
  connectionToPrevious?: string; // v3.0: 이전 씬 연결
  connectionToNext?: string; // v3.0: 다음 씬 연결
}

// ============================================
// 황진 장군 1권 씬 분할표 (v3.0: 100씬 - 20만자 기준, 평균 2000자/씬)
// 더 잘게 쪼개어 AI가 범위를 벗어날 확률 최소화
// ============================================

export const HWANGJIN_VOLUME_1_SCENES: Volume1SceneTemplate[] = [
  // ========== 현대 파트 (씬 1-10) ==========
  {
    sceneNumber: 1,
    title: "강의 준비",
    targetWordCount: 1500,
    sceneType: "mini",
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오 대기실",
    timeframe: "2025년 3월 15일, 오후 2시 50분",
    participants: ["강민우"],
    mustInclude: [
      "강민우가 거울을 보며 넥타이를 매만지는 장면",
      "강민우의 독백: '오늘도 100만뷰 찍어야지'",
      "스마트폰으로 구독자 수 확인하는 장면"
    ],
    forbiddenInThisScene: ["스튜디오 촬영", "황진 장군 언급", "빙의", "두통"],
    startCondition: "강민우가 대기실 거울 앞에서 넥타이를 고쳐 맨다",
    startConditionType: "action",
    endCondition: "강민우가 '좋아, 가자'라고 혼잣말하며 대기실 문손잡이를 잡는다",
    endConditionType: "action",
    emotionalGoal: "자신감",
    plotFunction: "주인공 현대 일상 소개",
    connectionToNext: "문을 열고 스튜디오로 입장"
  },
  {
    sceneNumber: 2,
    title: "스튜디오 입장",
    targetWordCount: 1200,
    sceneType: "mini",
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월 15일, 오후 2시 55분",
    participants: ["강민우", "PD 김"],
    mustInclude: [
      "스튜디오 조명이 켜지는 장면",
      "PD가 '5분 뒤 시작합니다'라고 말하는 장면",
      "강민우가 의자에 앉으며 마이크 테스트하는 장면"
    ],
    forbiddenInThisScene: ["강의 시작", "황진 장군 문제", "두통", "빙의"],
    startCondition: "강민우가 스튜디오 문을 열고 들어선다",
    startConditionType: "action",
    endCondition: "PD 김이 '준비되셨으면 시작하겠습니다'라고 말하고, 강민우가 고개를 끄덕인다",
    endConditionType: "dialogue",
    emotionalGoal: "집중",
    plotFunction: "강의 시작 직전 분위기 조성",
    connectionToPrevious: "대기실에서 나옴",
    connectionToNext: "강의 시작"
  },
  {
    sceneNumber: 3,
    title: "강의 시작",
    targetWordCount: 2000,
    sceneType: "normal",
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월 15일, 오후 3시",
    participants: ["강민우"],
    mustInclude: [
      "강민우가 카메라를 향해 '안녕하세요, 역사 덕후 강민우입니다!'라고 인사",
      "레이저 포인터로 스크린을 가리키며 문제 출제",
      "시청자들의 댓글을 읽는 척하는 장면"
    ],
    forbiddenInThisScene: ["황진 장군 정답 공개", "강의 마무리", "두통", "빙의"],
    startCondition: "PD가 손가락으로 카운트다운을 하고, 빨간 녹화 불이 켜진다",
    startConditionType: "action",
    endCondition: "강민우가 '자, 다음 문제 갑니다! 황진 장군에 대한 문제입니다!'라고 말한다",
    endConditionType: "dialogue",
    emotionalGoal: "열정",
    plotFunction: "스타 강사로서의 모습 확립",
    connectionToPrevious: "녹화 준비 완료",
    connectionToNext: "황진 장군 문제 출제"
  },
  {
    sceneNumber: 4,
    title: "황진 설명",
    targetWordCount: 2500,
    sceneType: "important",
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월 15일, 오후 3시 10분",
    participants: ["강민우"],
    mustInclude: [
      "황진 장군이 역사에서 왜 덜 알려졌는지 설명",
      "사대부들의 질투로 기록이 미비함을 설명",
      "열정적으로 손짓하며 강의하는 모습"
    ],
    forbiddenInThisScene: ["강의 마무리", "두통", "빙의", "조선시대"],
    startCondition: "강민우가 '여러분, 황진 장군이 왜 이순신만큼 유명하지 않은지 아시나요?'라고 묻는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '사대부들의 질투입니다!'라고 외치며 책상을 탁 친다",
    endConditionType: "dialogue",
    emotionalGoal: "열정",
    plotFunction: "황진 장군 지식 전달",
    connectionToPrevious: "황진 장군 문제 출제",
    connectionToNext: "강의 마무리"
  },
  {
    sceneNumber: 5,
    title: "강의 마무리",
    targetWordCount: 1500,
    sceneType: "mini",
    pov: "강민우",
    povType: "third-limited",
    location: "서울 강남구 유튜브 스튜디오",
    timeframe: "2025년 3월 15일, 오후 4시 50분",
    participants: ["강민우"],
    mustInclude: [
      "강의 마무리 멘트",
      "다음 시간 예고 (황진 장군의 비밀)",
      "카메라를 향해 손 흔들기"
    ],
    forbiddenInThisScene: ["두통", "빙의", "쓰러짐", "1590년"],
    startCondition: "강민우가 '자, 오늘 강의는 여기까지입니다'라고 말한다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '구독과 좋아요 잊지 마세요!'라고 말하며 카메라를 향해 손을 흔든다",
    endConditionType: "dialogue",
    emotionalGoal: "만족감",
    plotFunction: "현대 파트 마무리",
    connectionToPrevious: "황진 설명 완료",
    connectionToNext: "휴식 시작"
  },
  {
    sceneNumber: 6,
    title: "휴식",
    targetWordCount: 1500,
    sceneType: "mini",
    pov: "강민우",
    povType: "third-limited",
    location: "유튜브 스튜디오 대기실",
    timeframe: "2025년 3월 15일, 오후 5시",
    participants: ["강민우"],
    mustInclude: [
      "강의 후 피로감을 느끼며 의자에 앉는 장면",
      "물을 마시며 한숨 돌리는 모습",
      "혼잣말로 오늘 강의 평가"
    ],
    forbiddenInThisScene: ["두통", "빙의", "1590년", "황진 장군"],
    startCondition: "강민우가 대기실 의자에 털썩 앉으며 '휴...'라고 한숨을 쉰다",
    startConditionType: "action",
    endCondition: "강민우가 물컵을 내려놓으며 '오늘도 잘했어'라고 혼잣말한다",
    endConditionType: "dialogue",
    emotionalGoal: "피로",
    plotFunction: "빙의 전 일상",
    connectionToPrevious: "강의 종료 후 대기실로 이동",
    connectionToNext: "두통 시작"
  },
  {
    sceneNumber: 7,
    title: "두통",
    targetWordCount: 2000,
    sceneType: "important",
    pov: "강민우",
    povType: "third-limited",
    location: "유튜브 스튜디오 대기실",
    timeframe: "2025년 3월 15일, 오후 5시 5분",
    participants: ["강민우", "스태프"],
    mustInclude: [
      "갑자기 시작되는 강렬한 두통",
      "관자놀이를 움켜쥐며 고통스러워하는 모습",
      "눈앞이 번쩍이는 섬광"
    ],
    forbiddenInThisScene: ["쓰러짐", "1590년", "조선시대", "김여물"],
    startCondition: "강민우가 갑자기 '으...'라며 관자놀이를 움켜쥔다",
    startConditionType: "action",
    endCondition: "강민우가 '뭐지... 이 빛은...?'이라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "공포",
    plotFunction: "빙의 시작",
    connectionToPrevious: "휴식 중 갑작스러운 이상 증세",
    connectionToNext: "쓰러짐"
  },
  {
    sceneNumber: 8,
    title: "쓰러짐",
    targetWordCount: 2000,
    sceneType: "climax",
    pov: "강민우",
    povType: "third-limited",
    location: "유튜브 스튜디오 대기실",
    timeframe: "2025년 3월 15일, 오후 5시 7분",
    participants: ["강민우", "스태프들"],
    mustInclude: [
      "온몸에 전기가 흐르는 듯한 통증",
      "바닥에 쓰러지는 장면",
      "스태프들의 다급한 외침"
    ],
    forbiddenInThisScene: ["1590년", "조선시대", "김여물", "황진의 거처"],
    startCondition: "강민우가 '으아악!'이라는 비명과 함께 의자에서 떨어진다",
    startConditionType: "action",
    endCondition: "시야가 완전히 어둠에 잠기며 의식을 잃는다",
    endConditionType: "narration",
    emotionalGoal: "혼란",
    plotFunction: "현대-과거 전환점",
    connectionToPrevious: "두통 악화",
    connectionToNext: "과거로 빙의"
  },
  // ========== 과거 빙의 직후 파트 (씬 9-14) ==========
  {
    sceneNumber: 9,
    title: "낯선 천장",
    targetWordCount: 2000,
    sceneType: "important",
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
    forbiddenInThisScene: ["김여물", "시대 확인", "황진 이름", "현대"],
    startCondition: "어둠 속에서 의식이 돌아오고, 낯선 나무 천장이 시야에 들어온다",
    startConditionType: "narration",
    endCondition: "강민우가 '여기가... 어디지?'라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "혼란",
    plotFunction: "빙의 인식",
    connectionToPrevious: "현대에서 쓰러진 후 과거에서 눈을 뜸",
    connectionToNext: "김여물 등장"
  },
  {
    sceneNumber: 10,
    title: "김여물 등장",
    targetWordCount: 2000,
    sceneType: "normal",
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
    forbiddenInThisScene: ["1590년", "임진왜란", "황진 장군", "거울"],
    startCondition: "방문이 열리며 한복 차림의 남자가 들어온다",
    startConditionType: "action",
    endCondition: "김여물이 '남원입니다, 도련님'이라고 대답한다",
    endConditionType: "dialogue",
    emotionalGoal: "당혹",
    plotFunction: "시대 확인 시작",
    connectionToPrevious: "낯선 환경에서 혼란스러운 상태",
    connectionToNext: "시대 확인"
  },
  {
    sceneNumber: 11,
    title: "시대 확인",
    targetWordCount: 2000,
    sceneType: "important",
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
    forbiddenInThisScene: ["거울", "황진 이름 확인", "신체 능력", "무술"],
    startCondition: "강민우가 '지금이 몇 년도야?'라고 다급하게 묻는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '1590년... 임진왜란 2년 전...'이라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "충격",
    plotFunction: "시대 배경 확정",
    connectionToPrevious: "김여물과의 대화",
    connectionToNext: "거울 확인"
  },
  {
    sceneNumber: 12,
    title: "거울 속 얼굴",
    targetWordCount: 1800,
    sceneType: "normal",
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
    forbiddenInThisScene: ["황진 이름", "임진왜란", "절망", "운명"],
    startCondition: "강민우가 방 구석의 동경을 발견하고 다가간다",
    startConditionType: "action",
    endCondition: "강민우가 '진짜... 꿈이 아니야...'라고 한숨을 쉰다",
    endConditionType: "dialogue",
    emotionalGoal: "수용",
    plotFunction: "빙의 확정",
    connectionToPrevious: "시대 확인 후 현실 직시",
    connectionToNext: "정체성 확인"
  },
  {
    sceneNumber: 13,
    title: "황진이라는 이름",
    targetWordCount: 2500,
    sceneType: "climax",
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
    forbiddenInThisScene: ["절망", "운명 탄식", "마당", "신체 능력"],
    startCondition: "강민우가 김여물에게 '나는... 누구지?'라고 묻는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '황진... 그 황진 장군?!'이라고 소리친다",
    endConditionType: "dialogue",
    emotionalGoal: "경악",
    plotFunction: "정체성 확립",
    connectionToPrevious: "거울로 외모 확인 후 이름 질문",
    connectionToNext: "절망"
  },
  {
    sceneNumber: 14,
    title: "절망",
    targetWordCount: 2000,
    sceneType: "important",
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
    forbiddenInThisScene: ["마당", "신체 능력", "물동이", "무술"],
    startCondition: "강민우가 창가로 걸어가며 머리를 감싼다",
    startConditionType: "action",
    endCondition: "강민우가 '젠장... 하필 왜 황진이야...'라고 탄식한다",
    endConditionType: "dialogue",
    emotionalGoal: "절망",
    plotFunction: "동기 부여 시작",
    connectionToPrevious: "황진이라는 이름을 알고 충격",
    connectionToNext: "마당으로 나감"
  },

  // ========== 신체 능력 발견 파트 (씬 15-20) ==========
  {
    sceneNumber: 15,
    title: "마당으로",
    targetWordCount: 1500,
    sceneType: "mini",
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
    forbiddenInThisScene: ["물동이 들기", "뒷산", "호랑이"],
    startCondition: "강민우가 '일단 이 몸을 확인해봐야겠어'라고 생각하며 일어선다",
    startConditionType: "narration",
    endCondition: "강민우가 마당 한가운데에 서서 팔을 뻗어본다",
    endConditionType: "action",
    emotionalGoal: "호기심",
    plotFunction: "신체 테스트 시작",
    connectionToPrevious: "절망 후 몸 확인 결심",
    connectionToNext: "물동이 테스트"
  },
  {
    sceneNumber: 16,
    title: "물동이",
    targetWordCount: 2000,
    sceneType: "normal",
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
    forbiddenInThisScene: ["뒷산", "호랑이", "달리기"],
    startCondition: "강민우가 마당 구석의 무거운 물동이를 발견한다",
    startConditionType: "narration",
    endCondition: "김여물이 '도, 도련님?!'이라고 놀라 외친다",
    endConditionType: "dialogue",
    emotionalGoal: "놀라움",
    plotFunction: "초인적 힘 발견",
    connectionToPrevious: "마당에서 힘 테스트",
    connectionToNext: "달리기 테스트"
  },
  {
    sceneNumber: 17,
    title: "뒷산으로",
    targetWordCount: 2000,
    sceneType: "normal",
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
    forbiddenInThisScene: ["산 정상 도착", "호랑이", "희망"],
    startCondition: "강민우가 '산을 뛰어보자'라며 뒷산을 향해 달린다",
    startConditionType: "action",
    endCondition: "강민우가 뒤를 돌아보며 '왜 이렇게 느려?'라고 묻는다",
    endConditionType: "dialogue",
    emotionalGoal: "흥분",
    plotFunction: "초인적 체력 확인",
    connectionToPrevious: "힘 확인 후 체력 테스트",
    connectionToNext: "산 정상 도착"
  },
  {
    sceneNumber: 18,
    title: "산 정상",
    targetWordCount: 1500,
    sceneType: "mini",
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
    forbiddenInThisScene: ["호랑이", "하산", "위기"],
    startCondition: "강민우가 산 정상에 도착해 숨을 고른다",
    startConditionType: "action",
    endCondition: "강민우가 '이 힘이라면... 어쩌면...'이라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "희망",
    plotFunction: "가능성 인식",
    connectionToPrevious: "산을 달려 올라옴",
    connectionToNext: "하산 중 위기"
  },
  {
    sceneNumber: 19,
    title: "호랑이 등장",
    targetWordCount: 2500,
    sceneType: "important",
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
    forbiddenInThisScene: ["호랑이 제압", "귀환", "저녁"],
    startCondition: "산을 내려오던 강민우가 갑자기 발걸음을 멈춘다",
    startConditionType: "action",
    endCondition: "호랑이가 김여물을 향해 도약한다",
    endConditionType: "action",
    emotionalGoal: "긴장",
    plotFunction: "위기 발생",
    connectionToPrevious: "산 정상에서 내려오는 중",
    connectionToNext: "호랑이 제압"
  },
  {
    sceneNumber: 20,
    title: "호랑이 제압",
    targetWordCount: 3000,
    sceneType: "climax",
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
    forbiddenInThisScene: ["귀환", "저녁", "결심"],
    startCondition: "강민우가 '안 돼!'라고 외치며 몸을 날린다",
    startConditionType: "dialogue",
    endCondition: "호랑이가 쓰러지고, 김여물이 '도, 도련님...'이라고 말을 잇지 못한다",
    endConditionType: "dialogue",
    emotionalGoal: "각성",
    plotFunction: "초인적 무력 발현",
    connectionToPrevious: "호랑이가 김여물 공격",
    connectionToNext: "귀환"
  },

  // ========== 결심과 준비 파트 (씬 21-26) ==========
  {
    sceneNumber: 21,
    title: "귀환",
    targetWordCount: 1500,
    sceneType: "mini",
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
    forbiddenInThisScene: ["음식 맛", "임진왜란", "결심"],
    startCondition: "강민우와 김여물이 거처 대문을 들어선다",
    startConditionType: "action",
    endCondition: "강민우가 저녁상 앞에 앉는다",
    endConditionType: "action",
    emotionalGoal: "안도",
    plotFunction: "일상 복귀",
    connectionToPrevious: "호랑이 제압 후",
    connectionToNext: "저녁 식사"
  },
  {
    sceneNumber: 22,
    title: "조선 음식",
    targetWordCount: 1500,
    sceneType: "mini",
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
    forbiddenInThisScene: ["임진왜란", "결심", "시장"],
    startCondition: "강민우가 숟가락을 들고 밥을 떠먹는다",
    startConditionType: "action",
    endCondition: "강민우가 '생각보다 괜찮네'라고 혼잣말한다",
    endConditionType: "dialogue",
    emotionalGoal: "적응",
    plotFunction: "조선 생활 적응 시작",
    connectionToPrevious: "저녁상 앞에 앉음",
    connectionToNext: "밤 고민"
  },
  {
    sceneNumber: 23,
    title: "임진왜란 고민",
    targetWordCount: 2000,
    sceneType: "normal",
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
    forbiddenInThisScene: ["결심 선언", "시장", "배돌쇠"],
    startCondition: "강민우가 밤하늘의 달을 바라보며 생각에 잠긴다",
    startConditionType: "narration",
    endCondition: "강민우가 '역사를 바꿀 수 있을까...'라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "고뇌",
    plotFunction: "목표 설정 준비",
    connectionToPrevious: "저녁 식사 후",
    connectionToNext: "결심"
  },
  {
    sceneNumber: 24,
    title: "결심",
    targetWordCount: 2000,
    sceneType: "important",
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
    forbiddenInThisScene: ["시장", "배돌쇠", "다음 날"],
    startCondition: "강민우가 자리에서 벌떡 일어선다",
    startConditionType: "action",
    endCondition: "강민우가 '좋아. 역사를 바꿔보자'라고 결심한다",
    endConditionType: "dialogue",
    emotionalGoal: "결의",
    plotFunction: "목표 확정",
    connectionToPrevious: "임진왜란 고민 끝",
    connectionToNext: "시장 방문"
  },

  // ========== 시장 파트 (씬 25-27) ==========
  {
    sceneNumber: 25,
    title: "시장 도착",
    targetWordCount: 2000,
    sceneType: "normal",
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
    forbiddenInThisScene: ["배돌쇠", "불량배", "구출"],
    startCondition: "강민우가 시장 입구에 서서 주변을 둘러본다",
    startConditionType: "action",
    endCondition: "강민우가 '생각보다 활기차네'라고 중얼거린다",
    endConditionType: "dialogue",
    emotionalGoal: "호기심",
    plotFunction: "조선 사회 경험",
    connectionToPrevious: "결심 후 다음 날",
    connectionToNext: "시장 탐방 중 소란"
  },
  {
    sceneNumber: 26,
    title: "배돌쇠 구출",
    targetWordCount: 2500,
    sceneType: "important",
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
    forbiddenInThisScene: ["충성 맹세", "거처 복귀"],
    startCondition: "시장 골목에서 소란이 들린다",
    startConditionType: "narration",
    endCondition: "배돌쇠가 '이 은혜를 잊지 않겠습니다!'라고 외친다",
    endConditionType: "dialogue",
    emotionalGoal: "정의감",
    plotFunction: "첫 조력자 획득",
    connectionToPrevious: "시장 둘러보던 중",
    connectionToNext: "배돌쇠 충성"
  },
  {
    sceneNumber: 27,
    title: "배돌쇠 충성",
    targetWordCount: 1800,
    sceneType: "normal",
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
    forbiddenInThisScene: ["다음 권 내용", "훈련", "이서준"],
    startCondition: "배돌쇠가 '도련님!'이라 부르며 무릎을 꿇는다",
    startConditionType: "dialogue",
    endCondition: "강민우가 '일어나. 앞으로 잘해보자'라고 말한다",
    endConditionType: "dialogue",
    emotionalGoal: "유대감",
    plotFunction: "조력자 확보 완료",
    connectionToPrevious: "배돌쇠 구출",
    connectionToNext: "1권 마무리"
  },
  // 나머지 씬들은 AI가 generateScenePlanningPrompt로 자동 생성
  // 여기는 예시 템플릿일 뿐, 실제 사용 시 AI가 80~100개 씬을 생성함
];

// 💡 참고: 위 템플릿은 27개 씬의 예시입니다.
// 실제 20만자 권을 기획할 때는 generateScenePlanningPrompt()가
// AI를 통해 80~100개의 씬을 자동 생성합니다.
// 씬당 평균 2,000자로 계산: 200,000자 ÷ 2,000자 = 100개 씬
// 씬을 더 작게 나눠서 AI가 씬 경계를 넘지 않도록 합니다.

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
║  ⛔ 목표 분량의 50~60%만 써도 충분!!!                        ║
╚══════════════════════════════════════════════════════════════╝

**금지:**
- ❌ 씬에 정의된 장소(${scene.location}) 외 다른 장소 등장
- ❌ 씬에 정의된 등장인물(${scene.participants.join(', ')}) 외 다른 인물 등장
- ❌ 씬에 정의된 시간대(${scene.timeframe}) 외 다른 시간 묘사
- ❌ 다음 씬 내용 미리 작성
- ❌ 이전 씬 내용 다시 작성
- ❌ 분량 채우려고 새 사건/인물/장소 추가

**분량 규칙 (핵심!):**
- 목표 ${scene.targetWordCount}자는 최대치입니다
- 실제로는 **${Math.round(scene.targetWordCount * 0.5)}~${Math.round(scene.targetWordCount * 0.6)}자**만 쓰세요!
- 종료조건 도달 시 분량 관계없이 즉시 멈추세요

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

${generateLiteraryDepthPromptSection()}
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
  // 🔴 v3.0: 씬을 더 잘게 나눔 (평균 2000자, 최소 80개)
  // 씬이 작을수록 AI가 범위를 벗어날 확률이 줄어듦
  const AVERAGE_WORDS_PER_SCENE = 2000; // 4000 → 2000으로 대폭 하향
  const MIN_SCENES = 80; // 40 → 80으로 상향
  const calculatedSceneCount = Math.max(MIN_SCENES, Math.ceil(targetWordCount / AVERAGE_WORDS_PER_SCENE));
  const actualSceneCount = Math.max(targetSceneCount, calculatedSceneCount);

  // 씬당 평균 분량 계산
  const averageWordsPerScene = Math.floor(targetWordCount / actualSceneCount);

  return `당신은 **베스트셀러 소설 기획 전문가**입니다.
아래 규칙을 **100% 준수**하여 씬 분할표를 작성하세요.

# 🎯 핵심 원칙
> "씬이 작을수록 글이 정교해진다"
> 씬 하나 = 5분 이내의 연속된 장면
> 대사 하나하나까지 기획하라

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📚 작품 정보
- 작품명: ${project.title}
- 장르: ${project.genre.join(', ')}
- 컨셉: ${project.concept}

## 📖 ${volumeNumber}권 "${volumeTitle}" 정보
- **시작점**: ${volumeStartPoint}
- **종료점**: ${volumeEndPoint}
- **핵심 사건**: ${volumeCoreEvent}
- **목표 분량**: ${targetWordCount.toLocaleString()}자
${previousVolumeSummary ? `- **이전 권 요약**: ${previousVolumeSummary}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔴🔴🔴 씬 분량 규칙 (매우 중요!) 🔴🔴🔴

| 씬 유형 | 분량 | 설명 | 예시 |
|---------|------|------|------|
| **미니 씬** | 800~1,500자 | 짧은 대화, 반응, 순간적 감정 | 눈빛 교환, 한마디 대화 |
| **일반 씬** | 1,500~2,500자 | 하나의 대화 주제, 하나의 행동 | 대화 한 묶음, 이동 중 생각 |
| **중요 씬** | 2,500~3,500자 | 감정 고조, 소규모 갈등 | 말다툼, 고백 직전 |
| **클라이맥스** | 3,500~4,500자 | 결정적 순간, 반전 | 정체 발각, 전투 시작 |

### ⛔ 절대 금지
- **4,500자 초과 금지** → 반드시 2개 이상 씬으로 분할
- **시간 점프 금지** → 점프가 필요하면 별도 "전환 씬" 생성
- **장소 이동 금지** → 이동 시 별도 "이동 씬" 생성

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 필수 씬 수: **${actualSceneCount}개** (±10개)

계산:
- 권 분량: ${targetWordCount.toLocaleString()}자
- 씬당 평균: ${averageWordsPerScene.toLocaleString()}자
- 필요 씬 수: **${actualSceneCount}개**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📝 출력 형식 (JSON)

\`\`\`json
{
  "volumeInfo": {
    "volumeNumber": ${volumeNumber},
    "title": "${volumeTitle}",
    "totalScenes": ${actualSceneCount},
    "totalWordCount": ${targetWordCount}
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "씬 제목 (4자 이내, 한글)",
      "targetWordCount": 2000,
      "sceneType": "normal",
      "pov": "시점 인물 전체 이름",
      "povType": "third-limited",
      "location": "구체적 장소 (예: 남원 황진의 거처 마당)",
      "timeframe": "구체적 시간 (예: 1590년 3월 15일, 오전 7시경)",
      "participants": ["등장인물1", "등장인물2"],
      "mustInclude": [
        "구체적 대사: '실제 대사 내용'",
        "구체적 행동: 주인공이 ~하는 장면",
        "구체적 감정: ~한 표정을 짓다"
      ],
      "forbiddenInThisScene": [
        "다음 씬에서 다룰 키워드",
        "아직 등장하면 안 되는 인물"
      ],
      "startCondition": "정확한 시작 대사 또는 행동 (예: '주인공이 문을 열며 \"안녕\"이라고 말한다')",
      "startConditionType": "dialogue",
      "endCondition": "정확한 종료 대사 또는 행동 (예: '주인공이 고개를 끄덕이며 \"알겠어\"라고 대답한다')",
      "endConditionType": "dialogue",
      "emotionalGoal": "한 단어 (예: 혼란, 결의, 분노)",
      "plotFunction": "이 씬의 플롯 역할 (예: 갈등 고조, 정보 획득)",
      "connectionToPrevious": "이전 씬과 어떻게 연결되는지",
      "connectionToNext": "다음 씬으로 어떻게 이어지는지",
      "notes": "집필 시 주의사항 (선택)"
    }
  ]
}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔴 필수 규칙 (위반 시 전체 재생성!)

### 1️⃣ endCondition 작성 규칙 (가장 중요!)

**❌ 나쁜 예시 (추상적 → 금지!):**
- "강민우가 결심한다"
- "두 사람이 화해한다"
- "시간이 흐른다"
- "전투가 끝난다"

**✅ 좋은 예시 (구체적 대사/행동):**
- "강민우가 '좋아, 해보자'라고 말하며 주먹을 불끈 쥔다"
- "김여물이 '알겠습니다, 도련님'이라고 대답하며 고개를 숙인다"
- "주인공이 문을 닫으며 '내일 보자'라고 말한다"
- "호랑이가 쓰러지고 김여물이 '도, 도련님...'이라고 말을 잇지 못한다"

### 2️⃣ mustInclude 작성 규칙

**❌ 나쁜 예시 (추상적):**
- "강민우의 내면 갈등"
- "두 사람의 관계 발전"
- "긴장감 있는 대화"

**✅ 좋은 예시 (구체적 대사/행동):**
- "강민우가 '정말 내가 황진이야?'라고 스스로에게 묻는 독백"
- "김여물이 물동이를 들고 오는 장면"
- "강민우가 '이 시대에서 살아남아야 해'라고 결심하는 대사"

### 3️⃣ forbiddenInThisScene 필수 작성

각 씬에서 **다음 씬에서 다룰 내용**을 명시:
\`\`\`json
"forbiddenInThisScene": [
  "시장 (→ 23씬에서 등장)",
  "배돌쇠 (→ 24씬에서 첫 등장)",
  "호랑이 (→ 17씬에서 등장)"
]
\`\`\`

### 4️⃣ 씬 연결 필수

- N씬의 \`endCondition\` = N+1씬의 \`startCondition\`과 자연스럽게 연결
- 시간 점프 필요 시 → "전환 씬" 추가 (예: "다음 날 아침이 밝았다")
- 장소 이동 필요 시 → "이동 씬" 추가 (예: "마을로 향하는 길")

### 5️⃣ 분량 검증

| 검증 항목 | 기준 |
|----------|------|
| 씬당 최대 | **4,500자 이하** |
| 씬당 최소 | **800자 이상** |
| 총 분량 합 | ${targetWordCount.toLocaleString()}자 (±10%) |
| 씬 개수 | **${actualSceneCount}개** (±10개) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎬 씬 유형별 가이드

### 🔹 미니 씬 (800~1,500자)
- 눈빛 교환, 짧은 반응
- 예: "강민우가 놀란 눈으로 김여물을 바라본다 → 김여물이 '괜찮으십니까?'라고 묻는다"

### 🔹 일반 씬 (1,500~2,500자)
- 하나의 대화 주제
- 예: "강민우와 김여물이 현재 상황에 대해 대화한다"

### 🔹 중요 씬 (2,500~3,500자)
- 감정 변화, 갈등 발생
- 예: "강민우가 자신의 정체를 깨닫고 충격받는 장면"

### 🔹 클라이맥스 씬 (3,500~4,500자)
- 결정적 순간, 반전
- 예: "호랑이와의 대결 장면"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚠️ 최종 확인

기획 완료 전 반드시 확인:
1. ✅ 모든 endCondition이 구체적 대사/행동인가?
2. ✅ 모든 씬이 4,500자 이하인가?
3. ✅ 총 씬 수가 ${actualSceneCount}개 (±10개)인가?
4. ✅ 총 분량이 ${targetWordCount.toLocaleString()}자 (±10%)인가?
5. ✅ 모든 forbiddenInThisScene이 작성되었는가?
6. ✅ 씬 연결이 자연스러운가?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**이제 ${actualSceneCount}개의 정교한 씬을 JSON으로 생성하세요.**
다른 설명 없이 JSON만 출력하세요.`;
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
    sceneType: template.sceneType, // v3.0
    pov: template.pov,
    povType: template.povType,
    location: template.location,
    timeframe: template.timeframe,
    participants: template.participants,
    mustInclude: template.mustInclude,
    forbiddenInThisScene: template.forbiddenInThisScene, // v3.0
    startCondition: template.startCondition,
    endCondition: template.endCondition,
    endConditionType: template.endConditionType,
    emotionalGoal: template.emotionalGoal, // v3.0
    plotFunction: template.plotFunction, // v3.0
    connectionToPrevious: template.connectionToPrevious, // v3.0
    connectionToNext: template.connectionToNext, // v3.0
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

// ============================================
// 문학적 깊이 프롬프트 섹션 생성
// ============================================

function generateLiteraryDepthPromptSection(): string {
  return `
═══════════════════════════════════════════════════════════════
## 🏆 문학적 깊이 강화 (노벨 문학상 수준 목표)
═══════════════════════════════════════════════════════════════

### 핵심 원칙: "말하지 말고 보여주세요" (Show, Don't Tell)

**❌ 금지 표현 (직접 감정 서술):**
- "그는 슬펐다", "화가 났다", "기뻤다"
- "심장이 두근거렸다", "눈물이 흘렀다"
- "주먹을 불끈 쥐었다", "이를 악물었다"

**✅ 권장 (행동/감각으로 암시):**
- 감정 대신: 신체 반응, 행동, 환경 변화
- 예: "슬펐다" → "그녀는 아무 말도 하지 않았다. 창밖으로 비가 내렸다."
- 예: "화가 났다" → "그의 그림자가 한 뼘은 더 커진 것 같았다"

### 보편적 인간 조건 탐구

표면적 스토리 아래에 다음 질문을 담으세요:
- 죽음과 유한성: 인간은 자신의 죽음을 어떻게 받아들이는가?
- 사랑과 상실: 상실 후에 남는 것은 무엇인가?
- 정체성: 나는 누구인가? 사회가 규정한 나와 진정한 나의 괴리
- 권력과 억압: 억압받는 자의 내면은 어떠한가?
- 고독: 인간은 근본적으로 고독한가?

### 캐릭터 깊이

- **내면 모순**: 캐릭터가 스스로도 인정하지 못하는 욕망/두려움
- **도덕적 모호성**: 선악으로 단순화할 수 없는 선택
- **맹점**: 캐릭터가 모르지만 독자는 아는 것

### 문체 품질

**피해야 할 클리셰:**
| 클리셰 | 대안 (좋음) | 대안 (탁월) |
|--------|-------------|-------------|
| 심장이 두근거렸다 | 숨을 쉬는 것조차 소리가 나는 것 같았다 | 그녀의 이름을 부르자 방 안의 공기가 달라졌다 |
| 눈물이 흘렀다 | 시야가 흐려졌다 | 그녀는 아무 말도 하지 않았다. 창밖으로 비가 내렸다 |
| 주먹을 불끈 쥐었다 | 손톱이 손바닥을 파고들었다 | 그의 그림자가 한 뼘은 더 커진 것 같았다 |
| 시간이 멈춘 것 같았다 | 세상의 소리가 멀어졌다 | 그 순간은 끝나지 않았다. 지금도 끝나지 않았다 |

### 상징과 모티프

- 핵심 주제를 상징하는 이미지를 반복 사용
- 반복되는 이미지의 의미를 점진적으로 변화
- 환경 묘사를 통한 내면 암시

### 참고 작가 (노벨 문학상 수상자)

- **한강**: 시적 산문, 폭력의 미학적 처리, 침묵의 힘
- **카뮈**: 냉담한 서술자, 부조리 인식, 감정적 거리두기
- **도스토예프스키**: 심리적 격렬함, 도덕적 딜레마, 내면 고백
- **마르케스**: 마술적 사실주의, 순환적 시간, 일상과 초현실의 공존
`;
}

// ============================================
// 클리셰 검사 함수
// ============================================

export function checkForCliches(text: string): {
  found: boolean;
  cliches: { phrase: string; suggestion: string }[];
} {
  const foundCliches: { phrase: string; suggestion: string }[] = [];

  const clichePatterns = [
    { pattern: /심장이\s*두근/g, suggestion: '숨을 쉬는 것조차 소리가 나는 것 같았다' },
    { pattern: /눈물이\s*흘/g, suggestion: '시야가 흐려졌다 / 창밖으로 비가 내렸다' },
    { pattern: /주먹을\s*불끈/g, suggestion: '손톱이 손바닥을 파고들었다' },
    { pattern: /이를\s*악물/g, suggestion: '이빨 사이로 숨이 새어나갔다' },
    { pattern: /시간이\s*멈춘/g, suggestion: '세상의 소리가 멀어졌다' },
    { pattern: /온몸에\s*전율/g, suggestion: '피부 위로 서늘한 바람이 스쳤다' },
    { pattern: /눈빛이\s*변/g, suggestion: '눈 속의 빛이 달라졌다 (구체적 묘사)' },
    { pattern: /가슴이\s*벅차/g, suggestion: '숨을 내쉬는 것을 잊었다' },
    { pattern: /피가\s*끓/g, suggestion: '관자놀이가 욱신거렸다' },
    { pattern: /눈에\s*불꽃/g, suggestion: '시선이 날카로워졌다 (구체적 묘사)' },
  ];

  for (const { pattern, suggestion } of clichePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        foundCliches.push({ phrase: match, suggestion });
      }
    }
  }

  return {
    found: foundCliches.length > 0,
    cliches: foundCliches,
  };
}

// ============================================
// 문학적 깊이 점수 계산
// ============================================

export function calculateLiteraryDepthScore(text: string): {
  score: number;
  level: LiteraryDepthLevel;
  feedback: string[];
} {
  let score = 50; // 기본 점수
  const feedback: string[] = [];

  // 클리셰 감점
  const clicheResult = checkForCliches(text);
  if (clicheResult.found) {
    score -= clicheResult.cliches.length * 5;
    feedback.push(`클리셰 ${clicheResult.cliches.length}개 발견 - 독창적 표현으로 대체 필요`);
  }

  // 감각적 묘사 가점
  const sensoryPatterns = ['냄새', '향', '소리', '맛', '질감', '온기', '차가움', '촉감'];
  const sensoryCount = sensoryPatterns.filter(p => text.includes(p)).length;
  score += sensoryCount * 3;
  if (sensoryCount >= 3) {
    feedback.push('감각적 묘사 우수');
  }

  // 내면 묘사 가점
  const innerPatterns = ['생각했다', '느꼈다', '마음속', '내면', '의식'];
  const innerCount = innerPatterns.filter(p => text.includes(p)).length;
  score += innerCount * 2;

  // 상징/은유 가점
  const metaphorPatterns = ['처럼', '같은', '마치', '듯이'];
  const metaphorCount = metaphorPatterns.filter(p => text.includes(p)).length;
  if (metaphorCount >= 2) {
    score += 5;
    feedback.push('은유적 표현 활용');
  }

  // 직접 감정 서술 감점
  const directEmotionPatterns = ['슬펐다', '기뻤다', '화가 났다', '두려웠다', '행복했다'];
  const directCount = directEmotionPatterns.filter(p => text.includes(p)).length;
  score -= directCount * 3;
  if (directCount > 0) {
    feedback.push('직접 감정 서술 감지 - Show, Don\'t Tell 원칙 적용 필요');
  }

  // 점수 범위 제한
  score = Math.max(0, Math.min(100, score));

  // 레벨 결정
  let level: LiteraryDepthLevel;
  if (score >= 85) level = 'masterpiece';
  else if (score >= 70) level = 'profound';
  else if (score >= 50) level = 'literary';
  else level = 'commercial';

  return { score, level, feedback };
}
