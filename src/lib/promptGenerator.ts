/**
 * 소설 집필 프롬프트 생성 시스템 v7.0
 *
 * 세계 최고 수준 문학 품질을 위한 통합 프롬프트 시스템:
 * - 권/씬 단위로 정확한 분량과 종료점
 * - 모든 기획 데이터(캐릭터, 세계관, 플롯, 복선, 갈등) 필수 포함
 * - 스토리 분석 기반 일관성 검증
 * - 역사 교차검증 결과 반영
 * - 캐릭터 상태 추적 (사망/감금 등)
 * - 중복 내용 방지
 * - 베스트셀러 작가 워크플로우 통합
 * - [v6.0] 문체 일관성 관리 (StyleConsistencyManager)
 * - [v6.0] 감정 깊이 강화 (EmotionDepthEngine)
 * - [v6.0] 복선/떡밥 추적 (ForeshadowingTracker)
 * - [v6.0] 캐릭터 음성 일관성 (CharacterVoiceManager)
 * - [v7.0] 5단계 퇴고 시스템 (RevisionEngine)
 * - [v7.0] 씬 간 일관성 검증 (SceneCoherenceValidator)
 * - [v7.0] 문장 품질 평가기 (ProseQualityAnalyzer)
 * - [v7.0] 서사 아크 검증 (NarrativeArcValidator)
 * - [v7.0] 문학적 깊이 엔진 (LiteraryDepthEngine)
 * - [v7.0] 감각 몰입 시스템 (SensoryImmersionSystem)
 * - [v7.0] 대화 마스터 시스템 (DialogueMasterSystem)
 */

import type {
  VolumeStructure,
  SceneStructure,
  GeneratedPrompt,
  WritingStyle,
  Project,
  Character,
  WorldSetting,
  PlotStructure,
  PlotPoint,
  Subplot,
  Foreshadowing,
  Conflict,
  CharacterConsistencyContext,
} from '@/types';

import {
  generateCharacterStatusSummary,
  generateConsistencyInstructions,
  validateCharacterConsistency,
} from './characterConsistency';

import {
  StoryAnalysisResult,
  generateAnalysisSummaryForPrompt,
} from './storyAnalyzer';

import {
  ResearchSummary,
  generateResearchSummaryForPrompt,
} from './researchValidator';

import {
  DeepCharacterProfile,
  SceneDesign,
  SetupPayoff,
  EmotionalArc,
  WritingGuidelines,
} from './professionalWorkflow';

import {
  generateHistoricalValidationRules,
} from './gemini';

import {
  generateValidationRulesForPrompt,
} from './sceneValidator';

// v6.0: 상업 출판 수준 시스템 임포트
import {
  StyleConsistencyManager,
  STYLE_PROFILES,
  type StyleProfile,
} from './styleConsistencyManager';

import {
  EmotionDepthEngine,
  type EmotionState,
  type PrimaryEmotion,
} from './emotionDepthEngine';

import {
  ForeshadowingTracker as ForeshadowingTrackerV6,
} from './foreshadowingTracker';

import {
  CharacterVoiceManager,
  PREDEFINED_VOICES,
  type CharacterVoice,
} from './characterVoiceManager';

// v7.0: 세계 최고 수준 문학 시스템 임포트
import { RevisionEngine } from './revisionEngine';
import { SceneCoherenceValidator } from './sceneCoherenceValidator';
import { ProseQualityAnalyzer } from './proseQualityAnalyzer';
import { NarrativeArcValidator } from './narrativeArcValidator';
import { LiteraryDepthEngine } from './literaryDepthEngine';
import { SensoryImmersionSystem } from './sensoryImmersionSystem';
import { DialogueMasterSystem } from './dialogueMasterSystem';

// ============================================
// 컨텍스트 데이터 타입 정의
// ============================================

export interface FullContext {
  project: Project;
  characters: Character[];
  worldSettings: WorldSetting[];
  plotStructure: PlotStructure | null;
  foreshadowings: Foreshadowing[];
  conflicts: Conflict[];
  consistencyContext?: CharacterConsistencyContext;

  // 강화된 컨텍스트 (v2.0)
  storyAnalysis?: StoryAnalysisResult;
  researchSummary?: ResearchSummary;
  deepCharacterProfiles?: DeepCharacterProfile[];
  sceneDesign?: SceneDesign;
  setupPayoffs?: SetupPayoff[];
  emotionalArcs?: EmotionalArc[];
  writingGuidelines?: WritingGuidelines;

  // v7.0: 씬 간 일관성 및 서사 구조
  previousSceneText?: string;       // 이전 씬의 실제 텍스트 (마지막 부분)
  totalScenesInVolume?: number;     // 권 내 총 씬 수
}

// ============================================
// 캐릭터 정보 생성 (심화)
// ============================================

function generateCharacterInfo(characters: Character[], detailed: boolean = false): string {
  if (characters.length === 0) return '등장인물 정보 없음';

  return characters.map(c => {
    const roleMap: Record<string, string> = {
      'protagonist': '주인공',
      'antagonist': '적대자',
      'deuteragonist': '조연주인공',
      'supporting': '조연',
      'minor': '단역',
      'mentioned': '언급만',
    };

    let info = `### ${c.name} (${roleMap[c.role] || c.role})`;

    if (c.fullName && c.fullName !== c.name) {
      info += `\n- 본명: ${c.fullName}`;
    }
    if (c.nickname && c.nickname.length > 0) {
      info += `\n- 별명: ${c.nickname.join(', ')}`;
    }

    info += `\n- 나이: ${c.age}${c.gender ? `, ${c.gender}` : ''}`;

    // 생일 (누락되었던 필드 추가)
    if (detailed && c.birthday) {
      info += `\n- 생일: ${c.birthday}`;
    }

    if (c.occupation) {
      info += `\n- 직업: ${c.occupation}`;
    }

    // 성격 정보
    info += `\n- 성격: ${c.personality}`;

    if (detailed) {
      if (c.mbti) info += `\n- MBTI: ${c.mbti}`;
      if (c.enneagram) info += `\n- 에니어그램: ${c.enneagram}`;
    }

    // 외모
    if (c.appearance) {
      info += `\n- 외모: ${c.appearance.slice(0, 150)}`;
    }

    // 배경 (핵심!)
    if (c.background) {
      info += `\n- 배경: ${c.background.slice(0, 200)}`;
    }

    // 동기와 목표 (핵심!)
    if (c.motivation) {
      info += `\n- 동기: ${c.motivation}`;
    }
    if (c.goal) {
      info += `\n- 목표: ${c.goal}`;
    }
    if (c.internalGoal) {
      info += `\n- 내적 목표: ${c.internalGoal}`;
    }

    // 두려움, 비밀, 거짓말 (핵심!)
    if (c.fear) {
      info += `\n- 두려움: ${c.fear}`;
    }
    if (c.secret) {
      info += `\n- 비밀: ${c.secret}`;
    }
    if (c.lie) {
      info += `\n- 믿는 거짓말: ${c.lie}`;
    }

    // 강점/약점
    if (c.strengths && c.strengths.length > 0) {
      info += `\n- 강점: ${c.strengths.join(', ')}`;
    }
    if (c.weaknesses && c.weaknesses.length > 0) {
      info += `\n- 약점: ${c.weaknesses.join(', ')}`;
    }

    // 스킬/특기 (누락되었던 필드 추가)
    if (c.skills && c.skills.length > 0) {
      info += `\n- 특기/스킬: ${c.skills.join(', ')}`;
    }

    // 습관 (누락되었던 필드 추가)
    if (c.habits && c.habits.length > 0) {
      info += `\n- 습관: ${c.habits.join(', ')}`;
    }

    // 특이한 버릇 (누락되었던 필드 추가)
    if (c.quirks && c.quirks.length > 0) {
      info += `\n- 특이 버릇: ${c.quirks.join(', ')}`;
    }

    // 신체적 특징 (누락되었던 필드 추가)
    if (c.physicalTraits && c.physicalTraits.length > 0) {
      info += `\n- 신체적 특징: ${c.physicalTraits.join(', ')}`;
    }

    // 가족 배경 (누락되었던 필드 추가)
    if (c.familyBackground) {
      info += `\n- 가족 배경: ${c.familyBackground.slice(0, 150)}`;
    }

    // 기질 (누락되었던 필드 추가)
    if (detailed && c.temperament) {
      info += `\n- 기질: ${c.temperament}`;
    }

    // 현재 감정 상태 (누락되었던 필드 추가)
    if (c.emotionalState && c.emotionalState.length > 0) {
      const latestEmotion = c.emotionalState[c.emotionalState.length - 1];
      if (latestEmotion) {
        info += `\n- 현재 감정: ${latestEmotion.primaryEmotion}`;
        if (latestEmotion.secondaryEmotion) {
          info += ` / ${latestEmotion.secondaryEmotion}`;
        }
        info += ` (강도: ${latestEmotion.intensity}/10)`;
        if (latestEmotion.trigger) {
          info += ` - 원인: ${latestEmotion.trigger}`;
        }
        if (latestEmotion.sceneId) {
          info += ` [씬: ${latestEmotion.sceneId}]`;
        }
        if (latestEmotion.note) {
          info += ` (${latestEmotion.note})`;
        }
      }
    }

    // 말투 스타일 (누락되었던 필드 추가)
    if (c.speechStyle) {
      info += `\n- 말투 스타일: ${c.speechStyle}`;
    }

    // 말투 패턴 (대화 생성에 중요!)
    if (c.speechPattern) {
      const sp = c.speechPattern;
      info += `\n- 말투: `;
      if (sp.tone) info += `${sp.tone}, `;
      if (sp.formalityLevel) info += `경어 ${sp.formalityLevel}/5, `;
      if (sp.speechSpeed) info += `${sp.speechSpeed}, `;
      if (sp.vocabularyLevel) info += `어휘 ${sp.vocabularyLevel}`;
      if (sp.catchphrase && sp.catchphrase.length > 0) {
        info += `\n- 입버릇: "${sp.catchphrase.join('", "')}"`;
      }
      if (sp.avoidWords && sp.avoidWords.length > 0) {
        info += `\n- 안 쓰는 말: ${sp.avoidWords.join(', ')}`;
      }
      // 누락되었던 필드 추가
      if (sp.dialect) {
        info += `\n- 사투리/방언: ${sp.dialect}`;
      }
      if (sp.speechHabits && sp.speechHabits.length > 0) {
        info += `\n- 말버릇: ${sp.speechHabits.join(', ')}`;
      }
      if (sp.sampleDialogues && sp.sampleDialogues.length > 0) {
        info += `\n- 대사 예시: "${sp.sampleDialogues.slice(0, 2).join('", "')}"`;
      }
    }

    // 첫 등장 위치 (누락되었던 필드 추가)
    if (c.firstAppearance) {
      info += `\n- 첫 등장: ${c.firstAppearance}`;
    }

    // 캐릭터 아크
    if (c.arc) {
      const arcTypeMap: Record<string, string> = {
        'positive': '긍정적 변화',
        'negative': '부정적 변화',
        'flat': '변화 없음',
        'corruption': '타락',
        'disillusionment': '환멸',
      };
      info += `\n- 캐릭터 아크: ${arcTypeMap[c.arc.type] || c.arc.type}`;
      info += `\n  - 시작 상태: ${c.arc.startingState}`;
      info += `\n  - 종료 상태: ${c.arc.endingState}`;
      if (c.arc.transformationTrigger) {
        info += `\n  - 변화 계기: ${c.arc.transformationTrigger}`;
      }
      // 핵심 순간들 (누락되었던 필드 추가)
      if (c.arc.keyMoments && c.arc.keyMoments.length > 0) {
        info += `\n  - 핵심 순간:`;
        const stageMap: Record<string, string> = {
          'beginning': '시작',
          'catalyst': '촉매',
          'struggle': '갈등',
          'climax': '절정',
          'resolution': '해결',
        };
        c.arc.keyMoments.forEach((moment, idx) => {
          info += `\n    ${idx + 1}. [${stageMap[moment.stage] || moment.stage}] ${moment.description}`;
          if (moment.emotionalImpact) {
            info += ` (감정: ${moment.emotionalImpact})`;
          }
          if (moment.sceneId) {
            info += ` [${moment.sceneId}]`;
          }
        });
      }
    }

    // 관계 정보 (강화된 필드들 추가)
    if (c.relationships && c.relationships.length > 0) {
      info += `\n- 관계:`;
      c.relationships.slice(0, 5).forEach(rel => {
        const relTypeMap: Record<string, string> = {
          'family': '가족',
          'friend': '친구',
          'rival': '라이벌',
          'love': '연인',
          'enemy': '적',
          'colleague': '동료',
          'mentor': '스승',
          'student': '제자',
          'business': '사업',
          'other': '기타',
        };
        info += `\n  - ${rel.targetId}: ${relTypeMap[rel.type] || rel.type}`;
        if (rel.subtype) {
          info += ` (${rel.subtype})`;
        }
        if (rel.description) {
          info += ` - ${rel.description.slice(0, 50)}`;
        }
        // 동적 설명 (누락되었던 필드 추가)
        if (rel.dynamicDescription) {
          info += `\n    → 현재: ${rel.dynamicDescription.slice(0, 60)}`;
        }
        // 관계 변화 추적 (누락되었던 필드 추가)
        if (rel.startingRelation && rel.currentRelation) {
          if (rel.startingRelation !== rel.currentRelation) {
            info += `\n    → 변화: "${rel.startingRelation}" → "${rel.currentRelation}"`;
          }
        }
        // 긴장도 (누락되었던 필드 추가)
        if (rel.tension !== undefined && rel.tension > 0) {
          info += `\n    → 긴장도: ${rel.tension}/10`;
        }
        // 관계 진화 기록 (누락되었던 필드 추가)
        if (detailed && rel.evolution && rel.evolution.length > 0) {
          info += `\n    → 진화:`;
          rel.evolution.slice(-2).forEach(ev => {
            info += `\n      - ${ev.description} ("${ev.relationBefore}" → "${ev.relationAfter}")`;
          });
        }
      });
    }

    return info;
  }).join('\n\n');
}

// ============================================
// 세계관 정보 생성 (중요도 기반)
// ============================================

function generateWorldInfo(worldSettings: WorldSetting[]): string {
  if (worldSettings.length === 0) return '세계관 설정 없음';

  // 중요도별 정렬: core > major > minor
  const importanceOrder = { 'core': 0, 'major': 1, 'minor': 2 };
  const sorted = [...worldSettings].sort((a, b) =>
    (importanceOrder[a.importance] || 2) - (importanceOrder[b.importance] || 2)
  );

  const categoryMap: Record<string, string> = {
    'time': '시대/시간',
    'space': '공간/지리',
    'society': '사회 구조',
    'culture': '문화/풍습',
    'economy': '경제 체계',
    'politics': '정치 체제',
    'religion': '종교/신앙',
    'technology': '기술 수준',
    'magic': '마법/초자연',
    'nature': '자연환경',
    'history': '역사',
    'language': '언어',
    'custom': '기타',
  };

  const importanceMap: Record<string, string> = {
    'core': '★핵심',
    'major': '●주요',
    'minor': '○부가',
  };

  return sorted.map(w => {
    let info = `### [${categoryMap[w.category] || w.category}] ${w.title} (${importanceMap[w.importance] || '○'})`;
    info += `\n${w.description}`;

    // 상세 정보가 있으면 추가 (Record<string, string> 형태)
    if (w.details && Object.keys(w.details).length > 0) {
      const detailEntries = Object.entries(w.details)
        .filter(([_, v]) => v && v.length > 0)
        .slice(0, 3);
      if (detailEntries.length > 0) {
        info += `\n상세:`;
        detailEntries.forEach(([key, value]) => {
          info += `\n  - ${key}: ${value.slice(0, 80)}`;
        });
      }
    }

    // 관련 설정 (누락되었던 필드 추가)
    if (w.relatedSettings && w.relatedSettings.length > 0) {
      info += `\n관련 설정: ${w.relatedSettings.join(', ')}`;
    }

    return info;
  }).join('\n\n');
}

// ============================================
// 플롯 정보 생성
// ============================================

function generatePlotInfo(plotStructure: PlotStructure | null): string {
  if (!plotStructure) return '플롯 구조 없음';

  let info = `## 플롯 구조 (${plotStructure.template})\n`;

  // 커스텀 템플릿 정보 (누락되었던 필드 - 객체 처리 수정)
  if (plotStructure.customTemplate) {
    const ct = plotStructure.customTemplate;
    info += `커스텀 템플릿: ${ct.name}\n`;
    if (ct.description) {
      info += `설명: ${ct.description}\n`;
    }
    if (ct.stages && ct.stages.length > 0) {
      info += `단계 구성:\n`;
      ct.stages.forEach((s, idx) => {
        info += `  ${idx + 1}. ${s.name} (${s.percentage}%): ${s.description}\n`;
      });
    }
  }

  // 플롯 단계 (누락되었던 필드 추가)
  if (plotStructure.stages && plotStructure.stages.length > 0) {
    info += '\n### 플롯 단계\n';
    // 순서대로 정렬
    const sortedStages = [...plotStructure.stages].sort((a, b) => a.order - b.order);
    sortedStages.forEach((stage, i) => {
      info += `${i + 1}. ${stage.name}`;
      if (stage.targetPercentage !== undefined) {
        info += ` (${stage.targetPercentage}%)`;
      }
      info += ` [${stage.status}]`;
      info += '\n';
      if (stage.description) {
        info += `   ${stage.description}\n`;
      }
      if (stage.purpose) {
        info += `   목적: ${stage.purpose}\n`;
      }
      if (stage.chapters && stage.chapters.length > 0) {
        info += `   챕터: ${stage.chapters.join(', ')}\n`;
      }
    });
  }

  // 플롯 포인트
  if (plotStructure.plotPoints && plotStructure.plotPoints.length > 0) {
    info += '\n### 주요 플롯 포인트\n';
    const sorted = [...plotStructure.plotPoints].sort((a, b) => a.order - b.order);

    const typeMap: Record<string, string> = {
      'opening': '오프닝',
      'inciting-incident': '사건 발단',
      'first-plot-point': '첫 번째 전환점',
      'rising-action': '상승 행동',
      'midpoint': '중간점',
      'second-plot-point': '두 번째 전환점',
      'climax': '클라이맥스',
      'resolution': '결말',
      'custom': '사용자 정의',
    };

    sorted.forEach((p, i) => {
      info += `${i + 1}. [${typeMap[p.type] || p.type}] ${p.title}${p.completed ? ' ✓' : ''}\n`;
      info += `   ${p.description}\n`;
      // 위치 정보 (누락되었던 필드 추가)
      if (p.stage) {
        info += `   단계: ${p.stage}\n`;
      }
      if (p.chapterId) {
        info += `   챕터: ${p.chapterId}\n`;
      }
      if (p.sceneId) {
        info += `   씬: ${p.sceneId}\n`;
      }
    });
  }

  // 서브플롯
  if (plotStructure.subplots && plotStructure.subplots.length > 0) {
    info += '\n### 서브플롯\n';

    const typeMap: Record<string, string> = {
      'romance': '로맨스',
      'mystery': '미스터리',
      'character-growth': '캐릭터 성장',
      'theme': '주제',
      'comic-relief': '코믹 릴리프',
      'other': '기타',
    };

    plotStructure.subplots.forEach((sp, i) => {
      info += `${i + 1}. [${typeMap[sp.type] || sp.type}] ${sp.title} (${sp.status})\n`;
      info += `   ${sp.description}\n`;
      info += `   메인 플롯과의 연결: ${sp.connectionToMain}\n`;
      if (sp.mainCharacters && sp.mainCharacters.length > 0) {
        info += `   관련 캐릭터: ${sp.mainCharacters.join(', ')}\n`;
      }
      // 범위 정보 (누락되었던 필드 추가)
      if (sp.startChapter) {
        info += `   시작: ${sp.startChapter}`;
        if (sp.endChapter) {
          info += ` ~ 종료: ${sp.endChapter}`;
        }
        info += '\n';
      }
      // 비트 정보 (SubplotBeat 객체 배열로 처리 - 누락되었던 필드 강화)
      if (sp.beats && sp.beats.length > 0) {
        info += `   비트:\n`;
        // SubplotBeat 객체 배열 정렬 후 출력
        const sortedBeats = [...sp.beats].sort((a, b) => a.order - b.order);
        sortedBeats.forEach((beat, idx) => {
          info += `     ${idx + 1}. ${beat.description}`;
          if (beat.sceneId) {
            info += ` [${beat.sceneId}]`;
          }
          info += '\n';
        });
      }
    });
  }

  return info;
}

// ============================================
// 복선 정보 생성
// ============================================

function generateForeshadowingInfo(foreshadowings: Foreshadowing[]): string {
  if (foreshadowings.length === 0) return '';

  // 중요도별 정렬
  const priorityOrder = { 'critical': 0, 'major': 1, 'minor': 2 };
  const sorted = [...foreshadowings].sort((a, b) =>
    (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
  );

  let info = '## 복선 (⚠️ 자연스럽게 심어야 함)\n';

  const typeMap: Record<string, string> = {
    'hint': '힌트',
    'symbol': '상징',
    'prophecy': '예언',
    'setup': '설정',
    'red-herring': '페이크',
  };

  const priorityMap: Record<string, string> = {
    'critical': '★필수',
    'major': '●중요',
    'minor': '○선택',
  };

  const statusMap: Record<string, string> = {
    'planned': '계획됨',
    'planted': '심어짐',
    'reinforced': '강화됨',
    'resolved': '회수됨',
    'abandoned': '폐기됨',
  };

  sorted.forEach((f, i) => {
    info += `\n${i + 1}. [${typeMap[f.type] || f.type}] ${f.title} (${priorityMap[f.priority]})\n`;
    info += `   ${f.description}\n`;
    info += `   심는 방법: ${f.plantedMethod}\n`;

    // 미묘함 정도 (누락되었던 필드 추가)
    if (f.subtlety !== undefined) {
      info += `   미묘함: ${f.subtlety}/10 ${f.subtlety <= 3 ? '(노골적)' : f.subtlety <= 6 ? '(적당)' : '(매우 은밀)'}\n`;
    }

    // 심어진 위치 (누락되었던 필드 추가)
    if (f.plantedIn) {
      info += `   심어진 위치: ${f.plantedIn}\n`;
    }

    // 현재 상태
    info += `   상태: ${statusMap[f.status] || f.status}`;
    if (f.status === 'planted' || f.status === 'reinforced') {
      info += ' (아직 회수 안 됨)';
    }
    info += '\n';

    // 해소 위치 (누락되었던 필드 추가)
    if (f.resolvedIn) {
      info += `   해소 위치: ${f.resolvedIn}\n`;
    }
    if (f.resolutionMethod) {
      info += `   해소 방법: ${f.resolutionMethod}\n`;
    }

    // 관련 캐릭터
    if (f.relatedCharacters && f.relatedCharacters.length > 0) {
      info += `   관련 캐릭터: ${f.relatedCharacters.join(', ')}\n`;
    }

    // 관련 플롯 (누락되었던 필드 추가)
    if (f.relatedPlot) {
      info += `   관련 플롯: ${f.relatedPlot}\n`;
    }

    // 메모 (누락되었던 필드 추가)
    if (f.notes) {
      info += `   메모: ${f.notes.slice(0, 100)}\n`;
    }
  });

  return info;
}

// ============================================
// 갈등 정보 생성
// ============================================

function generateConflictInfo(conflicts: Conflict[]): string {
  if (conflicts.length === 0) return '';

  // 강도별 정렬
  const sorted = [...conflicts].sort((a, b) => b.intensity - a.intensity);

  let info = '## 갈등 구조\n';

  const typeMap: Record<string, string> = {
    'internal': '내적 갈등',
    'interpersonal': '대인 갈등',
    'societal': '사회적 갈등',
    'environmental': '환경적 갈등',
    'supernatural': '초자연적 갈등',
    'technological': '기술적 갈등',
  };

  const statusMap: Record<string, string> = {
    'brewing': '잠복',
    'active': '진행 중',
    'escalating': '격화 중',
    'climax': '절정',
    'resolved': '해결됨',
    'abandoned': '포기됨',
  };

  sorted.forEach((c, i) => {
    info += `\n${i + 1}. [${typeMap[c.type] || c.type}] ${c.title} (강도: ${c.intensity}/10, ${statusMap[c.status]})\n`;
    info += `   ${c.description}\n`;
    info += `   위험 요소: ${c.stakes}\n`;

    // 주요 캐릭터 (누락되었던 필드 추가)
    if (c.primaryCharacter) {
      info += `   주요 대상: ${c.primaryCharacter}\n`;
    }

    if (c.involvedCharacters && c.involvedCharacters.length > 0) {
      info += `   관련 캐릭터: ${c.involvedCharacters.join(', ')}\n`;
    }

    // 도입 위치 (누락되었던 필드 추가)
    if (c.introducedIn) {
      info += `   도입 위치: ${c.introducedIn}\n`;
    }

    // 에스컬레이션 상세 정보 (누락되었던 필드 - 상세 내용 추가)
    if (c.escalations && c.escalations.length > 0) {
      info += `   에스컬레이션 (${c.escalations.length}단계):\n`;
      c.escalations.forEach((e, idx) => {
        info += `     ${idx + 1}. ${e.description}`;
        if (e.intensityChange) {
          info += ` (강도 ${e.intensityChange > 0 ? '+' : ''}${e.intensityChange})`;
        }
        if (e.sceneId) {
          info += ` [${e.sceneId}]`;
        }
        info += '\n';
      });
    }

    // 절정 위치 (누락되었던 필드 추가)
    if (c.climaxIn) {
      info += `   절정 위치: ${c.climaxIn}\n`;
    }

    // 해결 위치 (누락되었던 필드 추가)
    if (c.resolvedIn) {
      info += `   해결 위치: ${c.resolvedIn}\n`;
    }

    // 해결 방법 (누락되었던 필드 추가)
    if (c.resolution) {
      info += `   해결 방법: ${c.resolution}\n`;
    }
  });

  return info;
}

// ============================================
// 시스템 프롬프트 생성
// ============================================

export function generateSystemPrompt(
  project: Project,
  style: WritingStyle,
  options?: {
    storyAnalysis?: StoryAnalysisResult;
    researchSummary?: ResearchSummary;
    writingGuidelines?: WritingGuidelines;
    emotionalArc?: EmotionalArc;
    characterNames?: string[]; // 역사 검증용 캐릭터 이름들
  }
): string {
  const perspectiveMap = {
    'first': '1인칭 시점',
    'third-limited': '3인칭 제한 시점',
    'omniscient': '전지적 작가 시점',
    'second': '2인칭 시점',
  };

  const tenseMap = {
    'past': '과거형',
    'present': '현재형',
  };

  const pacingMap = {
    'slow': '느리고 묘사가 풍부한',
    'moderate': '적절한 균형의',
    'fast': '빠르고 긴박한',
  };

  let systemPrompt = `당신은 한국의 베스트셀러 소설가입니다. 아래 규칙을 철저히 따라 소설을 집필하세요.

## 작품 정보
- 작품명: ${project.title}${project.subtitle ? ` - ${project.subtitle}` : ''}
- 장르: ${project.genre.join(', ')}${project.subGenre && project.subGenre.length > 0 ? ` (서브: ${project.subGenre.join(', ')})` : ''}
- 컨셉: ${project.concept}
- 로그라인: ${project.logline}
${project.synopsis ? `- 시놉시스: ${project.synopsis}` : ''}
${project.detailedSynopsis ? `- 상세 시놉시스: ${project.detailedSynopsis.slice(0, 300)}` : ''}
${project.targetAudience ? `- 타겟 독자: ${project.targetAudience}` : ''}
${project.ageRating ? `- 연령 등급: ${project.ageRating === 'all' ? '전체' : project.ageRating === 'teen' ? '청소년' : '성인'}` : ''}
${project.keywords && project.keywords.length > 0 ? `- 키워드: ${project.keywords.join(', ')}` : ''}
${project.similarWorks && project.similarWorks.length > 0 ? `- 유사 작품: ${project.similarWorks.join(', ')}` : ''}

## 문체 설정
- 시점: ${perspectiveMap[style.perspective]}
- 시제: ${tenseMap[style.tense]}
- 대사 비율: ${style.dialogueRatio}%
- 묘사 상세도: ${style.descriptionDetail}/10
- 페이싱: ${pacingMap[style.pacing]}
- 감정 강도: ${style.emotionIntensity}/10
${style.additionalInstructions ? `- 추가 지시: ${style.additionalInstructions}` : ''}`;

  // 집필 가이드라인 추가 (v2.0)
  if (options?.writingGuidelines) {
    const wg = options.writingGuidelines;
    systemPrompt += `

## 📝 집필 가이드라인 (기획 반영)
### 문체
${wg.style.toneDescriptions.map(t => `- ${t}`).join('\n')}
- 문장 길이: ${wg.style.sentenceLength}
- 대화 스타일: ${wg.style.dialogueStyle}
- 묘사 깊이: ${wg.style.descriptionDepth}
- 페이싱: ${wg.style.pacingGuidelines}

### 씬 작성 규칙
- 오프닝 훅: ${wg.sceneGuidelines.openingHook}
- 긴장감 구축: ${wg.sceneGuidelines.tensionBuilding}
- 대화 비율: ${wg.sceneGuidelines.dialogueBalance}
- 클로징 훅: ${wg.sceneGuidelines.closingHook}

### 금지 사항
${wg.avoidList.map(a => `- ❌ ${a}`).join('\n')}

### 필수 사항
${wg.mustIncludeList.map(m => `- ✅ ${m}`).join('\n')}`;
  }

  // 감정선 가이드 추가
  if (options?.emotionalArc) {
    const ea = options.emotionalArc;
    systemPrompt += `

## 🎭 이 권의 감정선
- 테마: ${ea.emotionalTheme}
- 시작 분위기: ${ea.startingMood}
- 종료 분위기: ${ea.endingMood}
- 독자 경험 목표: ${ea.readerExperience}`;
  }

  // 역사 자료 검증 결과 추가
  if (options?.researchSummary) {
    systemPrompt += `

## 📚 역사적 사실 (교차검증 완료)
${generateResearchSummaryForPrompt(options.researchSummary)}`;
  }

  // 역사물인 경우 캐릭터 교차검증 규칙 추가
  const isHistoricalFiction = project.genre.some(g =>
    g.includes('역사') || g.includes('사극') || g.includes('시대물') ||
    g.includes('퓨전사극') || g.includes('대체역사')
  );

  if (isHistoricalFiction && options?.characterNames && options.characterNames.length > 0) {
    systemPrompt += `

${generateHistoricalValidationRules(options.characterNames)}`;
  }

  // 스토리 분석 결과 추가
  if (options?.storyAnalysis) {
    // 사망/감금 캐릭터 명시
    const deadChars = options.storyAnalysis.characterStates.filter(c => c.status === 'dead');
    const imprisonedChars = options.storyAnalysis.characterStates.filter(c => c.status === 'imprisoned');

    if (deadChars.length > 0 || imprisonedChars.length > 0) {
      systemPrompt += `

## 🚨 캐릭터 상태 경고
`;
      if (deadChars.length > 0) {
        systemPrompt += `### 💀 사망한 캐릭터 (절대 현재 시점에서 활동 불가!)
${deadChars.map(c => `- ${c.characterName}: 사망 (${c.lastSeenVolume}권 ${c.lastSeenScene}씬) - 회상/언급만 가능`).join('\n')}
`;
      }
      if (imprisonedChars.length > 0) {
        systemPrompt += `### 🔒 감금/제한된 캐릭터
${imprisonedChars.map(c => `- ${c.characterName}: ${c.lastSeenLocation}에서만 등장 가능`).join('\n')}
`;
      }
    }
  }

  systemPrompt += `

## 🚨 절대 규칙 (위반 = 실패)

1. **씬 범위 준수**: 지정된 시작점~종료점 사이만 작성
2. **등장인물 제한**: 지정된 인물만 등장 가능
3. **장소 고정**: 지정된 장소에서만 진행
4. **시간 점프 금지**: "며칠 후", "다음 날" 등 사용 금지
5. **종료점 이후 금지**: 종료 조건 도달 후 즉시 멈춤

## ⛔ 금지 표현
"며칠 후", "다음 날", "시간이 흘러", "얼마 후", "결국", "마침내", "드디어", "한편", "그때"

## ✅ 분량 부족 시
새 사건 추가 ❌ → 현재 장면의 감정/분위기/디테일 묘사 ✅

## 🔴 중요 규칙
- 종료 조건 도달 시 즉시 멈춤
- 각성/깨달음/결심 장면 반복 금지
- 캐릭터 성격/말투 일관성 유지
- 빈 괄호 "()" 사용 금지
- 사망 캐릭터 등장 금지 (회상만)`;

  return systemPrompt;
}

// ============================================
// 권(Volume) 단위 프롬프트 생성 (완전 개선)
// ============================================

export function generateVolumePrompt(
  project: Project,
  volume: VolumeStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[],
  plotStructure: PlotStructure | null,
  foreshadowings: Foreshadowing[],
  conflicts: Conflict[],
  previousVolumeSummary?: string,
  consistencyContext?: CharacterConsistencyContext,
  // 강화된 옵션 (v2.0)
  enhancedOptions?: {
    storyAnalysis?: StoryAnalysisResult;
    researchSummary?: ResearchSummary;
    deepCharacterProfiles?: DeepCharacterProfile[];
    setupPayoffs?: SetupPayoff[];
    emotionalArc?: EmotionalArc;
    writingGuidelines?: WritingGuidelines;
  }
): GeneratedPrompt {
  // 캐릭터 이름 목록 추출 (역사 검증용)
  const characterNames = characters.map(c => c.name);

  const systemPrompt = generateSystemPrompt(project, style, {
    storyAnalysis: enhancedOptions?.storyAnalysis,
    researchSummary: enhancedOptions?.researchSummary,
    writingGuidelines: enhancedOptions?.writingGuidelines,
    emotionalArc: enhancedOptions?.emotionalArc,
    characterNames,
  });

  // 캐릭터 정보 (심화)
  const characterInfo = generateCharacterInfo(characters, true);

  // 세계관 정보 (중요도 기반)
  const worldInfo = generateWorldInfo(worldSettings);

  // 플롯 정보
  const plotInfo = generatePlotInfo(plotStructure);

  // 복선 정보
  const foreshadowingInfo = generateForeshadowingInfo(foreshadowings);

  // 갈등 정보
  const conflictInfo = generateConflictInfo(conflicts);

  // 씬 목록 (강화된 정보 포함)
  const sceneList = volume.scenes
    .map((s, i) => {
      let sceneInfo = `${i + 1}. ${s.title} (${s.targetWordCount.toLocaleString()}자)`;
      if (s.pov) sceneInfo += ` [POV: ${s.pov}]`;
      if (s.povType) {
        const povTypeMap: Record<string, string> = { 'first': '1인칭', 'third-limited': '3인칭 제한', 'omniscient': '전지적' };
        sceneInfo += ` (${povTypeMap[s.povType] || s.povType})`;
      }
      if (s.location) sceneInfo += ` @ ${s.location}`;
      if (s.timeframe) sceneInfo += ` [${s.timeframe}]`;
      if (s.participants && s.participants.length > 0) {
        sceneInfo += `\n   등장: ${s.participants.join(', ')}`;
      }
      if (s.startCondition) {
        sceneInfo += `\n   시작: ${s.startCondition}`;
      }
      if (s.mustInclude && s.mustInclude.length > 0) {
        sceneInfo += `\n   필수: ${s.mustInclude.join(', ')}`;
      }
      if (s.endCondition) {
        sceneInfo += `\n   종료: ${s.endCondition}`;
        if (s.endConditionType) {
          const endTypeMap: Record<string, string> = { 'dialogue': '대사', 'action': '행동', 'narration': '서술', 'scene': '장면' };
          sceneInfo += ` (${endTypeMap[s.endConditionType] || s.endConditionType})`;
        }
      }
      return sceneInfo;
    })
    .join('\n');

  // 캐릭터 일관성 정보 생성
  const consistencyInfo = consistencyContext
    ? generateCharacterStatusSummary(consistencyContext, characters) +
      generateConsistencyInstructions(consistencyContext)
    : '';

  // 스토리 분석 결과 추가 (v2.0)
  const storyAnalysisInfo = enhancedOptions?.storyAnalysis
    ? generateAnalysisSummaryForPrompt(
        enhancedOptions.storyAnalysis,
        volume.volumeNumber,
        1
      )
    : '';

  // 심층 캐릭터 프로필 정보 추가 (v2.0)
  let deepProfileInfo = '';
  if (enhancedOptions?.deepCharacterProfiles && enhancedOptions.deepCharacterProfiles.length > 0) {
    deepProfileInfo = `\n## 🎭 캐릭터 심층 프로필\n`;
    for (const profile of enhancedOptions.deepCharacterProfiles.slice(0, 5)) {
      deepProfileInfo += `### ${profile.name} (${profile.role})
- 핵심 상처: ${profile.psychology.coreWound}
- 믿는 거짓: ${profile.psychology.lie}
- 깨달을 진실: ${profile.psychology.truth}
- 외적 목표(want): ${profile.psychology.want}
- 내적 필요(need): ${profile.psychology.need}
- 가장 큰 두려움: ${profile.psychology.fear}
- 말투: ${profile.voice.speechPatterns.slice(0, 3).join(', ')}
- 입버릇: ${profile.voice.catchPhrases.slice(0, 2).join(', ')}

`;
    }
  }

  // 복선/페이백 추적 정보 (v2.0)
  let setupPayoffInfo = '';
  if (enhancedOptions?.setupPayoffs && enhancedOptions.setupPayoffs.length > 0) {
    const relevantPayoffs = enhancedOptions.setupPayoffs.filter(
      sp => sp.setup.volume <= volume.volumeNumber &&
            (!sp.payoff.completed || sp.payoff.plannedVolume === volume.volumeNumber)
    );
    if (relevantPayoffs.length > 0) {
      setupPayoffInfo = `\n## 🎯 복선/페이백 관리\n`;
      setupPayoffInfo += `### 이번 권에서 심어야 할 복선\n`;
      const toPlant = relevantPayoffs.filter(sp => sp.setup.volume === volume.volumeNumber);
      for (const sp of toPlant) {
        setupPayoffInfo += `- ${sp.setup.description} (방법: ${sp.setup.method}, 미묘함: ${sp.setup.subtlety}/10)\n`;
      }
      setupPayoffInfo += `\n### 이번 권에서 해소할 복선\n`;
      const toResolve = relevantPayoffs.filter(sp => sp.payoff.plannedVolume === volume.volumeNumber && !sp.payoff.completed);
      for (const sp of toResolve) {
        setupPayoffInfo += `- ${sp.payoff.description} (감정적 임팩트: ${sp.payoff.emotionalImpact})\n`;
      }
    }
  }

  const userPrompt = `## 현재 집필: ${volume.volumeNumber}권 "${volume.title}"
목표 글자수: ${volume.targetWordCount.toLocaleString()}자

${consistencyInfo}
${storyAnalysisInfo}

## 🚨🚨🚨 종료점 (최우선 준수!) 🚨🚨🚨
이 권은 반드시 다음 조건에서 끝나야 합니다:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 종료점: "${volume.endPoint}"
🛑 종료 유형: ${volume.endPointType === 'dialogue' ? '대사' : volume.endPointType === 'action' ? '행동' : '서술'}
🛑 정확한 종료: "${volume.endPointExact}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🚫 절대 금지:
1. 종료점 이후 내용 작성 금지
2. 다음 권 내용 작성 금지
3. 임진왜란 등 주요 사건 급하게 마무리 금지
4. 시간 점프로 사건 건너뛰기 금지

### ✅ 종료점 도달 시:
1. 위 종료점에 해당하는 장면/대사 작성
2. "--- ${volume.volumeNumber}권 끝 ---" 작성
3. 즉시 멈춤 (이후 아무것도 쓰지 않음)

### ⏱️ 페이싱 주의:
- 각 씬별 목표 분량을 지키세요
- 급하게 진행하지 마세요 (디테일하게!)
- 하나의 씬 = 하나의 상황

${previousVolumeSummary ? `## 이전 권 요약\n${previousVolumeSummary}\n` : ''}

## 이 권의 스토리
- 시작: ${volume.startPoint}
- 핵심 사건: ${volume.coreEvent}
- 종료: ${volume.endPoint}

## 씬 구성 (순서대로 집필)
${sceneList}

---

## 등장인물 정보
${characterInfo}
${deepProfileInfo}

---

## 세계관 설정
${worldInfo}

---

${plotInfo}

---

${foreshadowingInfo}
${setupPayoffInfo}

---

${conflictInfo}

---

${volume.nextVolumePreview ? `## 다음 권 예고 (참고만, 절대 쓰지 말 것!)\n${volume.nextVolumePreview}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 필수 체크리스트 (집필 전 확인!)

### 페이싱 (가장 중요!)
- [ ] 이 권은 "${volume.endPoint}"에서 끝나야 함
- [ ] 각 씬은 하나의 상황만 다루기
- [ ] 시간 점프 금지 (며칠 후, 몇 달 후 등)
- [ ] 급하게 진행하지 않기 (디테일하게!)

### 내용
- [ ] 위 모든 설정(캐릭터 프로필, 복선, 갈등) 반영
- [ ] 사망/감금된 캐릭터 상태 준수
- [ ] 이전 씬과 중복되는 내용 금지
- [ ] 역사물인 경우 검증된 사실만 사용
- [ ] 캐릭터별 말투와 입버릇 유지

### 반복 방지
- [ ] 각성/깨달음 장면 반복 금지
- [ ] 힘을 얻는 장면 반복 금지
- [ ] 결심하는 장면 반복 금지
- [ ] 유사한 대화/묘사 반복 금지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 핵심 지시:
1. 씬별 목표 분량 준수 (급하게 진행 금지!)
2. 종료점: "${volume.endPointExact}" 도달 시 즉시 멈춤
3. 디테일하게 천천히 진행 (요약하지 말 것!)

${volume.volumeNumber}권을 집필하세요.
첫 번째 씬부터 시작합니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      volumeNumber: volume.volumeNumber,
      targetWordCount: volume.targetWordCount,
      endCondition: volume.endPointExact,
      mode: 'volume',
    },
  };
}

// ============================================
// 씬(Scene) 단위 프롬프트 생성 (완전 개선)
// ============================================

export function generateScenePrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[],
  plotStructure: PlotStructure | null,
  foreshadowings: Foreshadowing[],
  conflicts: Conflict[],
  previousSceneSummary?: string,
  consistencyContext?: CharacterConsistencyContext,
  // 강화된 옵션 (v2.0)
  enhancedOptions?: {
    storyAnalysis?: StoryAnalysisResult;
    researchSummary?: ResearchSummary;
    deepCharacterProfiles?: DeepCharacterProfile[];
    sceneDesign?: SceneDesign;
    setupPayoffs?: SetupPayoff[];
    emotionalArc?: EmotionalArc;
    writingGuidelines?: WritingGuidelines;
    // v7.0: 세계 최고 수준 문학 시스템 옵션
    previousSceneText?: string;
    totalScenesInVolume?: number;
  }
): GeneratedPrompt {
  // 캐릭터 이름 목록 추출 (역사 검증용)
  const characterNames = characters.map(c => c.name);

  const systemPrompt = generateSystemPrompt(project, style, {
    storyAnalysis: enhancedOptions?.storyAnalysis,
    researchSummary: enhancedOptions?.researchSummary,
    writingGuidelines: enhancedOptions?.writingGuidelines,
    emotionalArc: enhancedOptions?.emotionalArc,
    characterNames,
  });

  // 🔒 해당 씬 등장인물만 필터 (씬에 없는 캐릭터는 절대 전달 안 함!)
  const sceneCharacters = characters.filter(c =>
    scene.participants.includes(c.id) || scene.participants.includes(c.name)
  );

  // ⚠️ 씬에 participants가 설정되어 있지 않으면 경고 + 빈 배열
  // 절대로 다른 캐릭터를 대신 전달하지 않음!
  if (sceneCharacters.length === 0 && scene.participants.length > 0) {
    console.warn('[promptGenerator] ⚠️ 씬에 설정된 participants와 매칭되는 캐릭터가 없습니다!');
    console.warn('[promptGenerator] 씬 participants:', scene.participants);
    console.warn('[promptGenerator] 사용 가능한 캐릭터:', characters.map(c => ({ id: c.id, name: c.name })));
  }

  // 씬에 등장하는 캐릭터만 전달 (없으면 빈 정보)
  const characterInfo = sceneCharacters.length > 0
    ? generateCharacterInfo(sceneCharacters, true)
    : `⚠️ 이 씬에 등장하는 캐릭터: ${scene.participants.join(', ')}\n(상세 정보 없음 - 씬 설정의 등장인물만 사용하세요)`;

  // 세계관 정보 (핵심만)
  const coreWorldSettings = worldSettings.filter(w => w.importance === 'core' || w.importance === 'major');
  const worldInfo = generateWorldInfo(coreWorldSettings.length > 0 ? coreWorldSettings : worldSettings.slice(0, 5));

  // 🔒 복선/갈등은 이 씬에 관련된 것만 + 1씬이면 아예 전달 안 함
  // (1씬에서 복선/갈등 정보를 주면 AI가 미래 이야기를 써버림)
  let foreshadowingInfo = '';
  let conflictInfo = '';

  if (scene.sceneNumber > 1) {
    // 이 씬 등장인물과 관련된 복선만 필터
    const relatedForeshadowings = foreshadowings.filter(f =>
      (f.status === 'planted' || f.status === 'reinforced') &&
      // 복선이 이 씬 등장인물과 관련 있는 경우만
      (f.relatedCharacters?.some(charId =>
        scene.participants.includes(charId) ||
        sceneCharacters.some(c => c.id === charId || c.name === charId)
      ) || false)
    );
    foreshadowingInfo = relatedForeshadowings.length > 0
      ? generateForeshadowingInfo(relatedForeshadowings)
      : '';

    // 이 씬 등장인물과 관련된 갈등만 필터
    const relatedConflicts = conflicts.filter(c =>
      (c.status === 'active' || c.status === 'escalating' || c.status === 'climax') &&
      // 갈등 당사자가 이 씬 등장인물인 경우만
      (scene.participants.some(p =>
        c.involvedCharacters?.includes(p) ||
        c.primaryCharacter === p ||
        c.title?.includes(p) ||
        c.description?.includes(p)
      ) || false)
    );
    conflictInfo = relatedConflicts.length > 0
      ? generateConflictInfo(relatedConflicts)
      : '';
  }
  // 1씬이면 복선/갈등 정보 없음 (빈 문자열)

  // 필수 포함 내용
  const mustIncludeList = scene.mustInclude
    .map((item, i) => `${i + 1}. ${item}`)
    .join('\n');

  const povTypeMap = {
    'first': '1인칭',
    'third-limited': '3인칭 제한',
    'omniscient': '전지적',
  };

  // 캐릭터 일관성 정보 생성
  const consistencyInfo = consistencyContext
    ? generateConsistencyInstructions(consistencyContext)
    : '';

  // 스토리 분석 결과 추가 (v2.0)
  const storyAnalysisInfo = enhancedOptions?.storyAnalysis
    ? generateAnalysisSummaryForPrompt(
        enhancedOptions.storyAnalysis,
        volume.volumeNumber,
        scene.sceneNumber
      )
    : '';

  // 씬 비트 설계 정보 추가 (v2.0)
  let sceneDesignInfo = '';
  if (enhancedOptions?.sceneDesign) {
    const sd = enhancedOptions.sceneDesign;
    sceneDesignInfo = `\n## 🎬 씬 비트 설계
- 목적: ${sd.purpose}
- 감정 목표: ${sd.emotionalGoal}
- 긴장 곡선: ${sd.tensionCurve.join(' → ')}

### 비트 구성
${sd.beats.slice(0, 10).map(b => `${b.beatNumber}. [${b.type}] ${b.description} (긴장: ${b.tension}/10)
   ${b.dialogueSample ? `   대사 예시: "${b.dialogueSample}"` : ''}`).join('\n')}

### 필수 대사
${sd.mustInclude.dialogues.map(d => `- ${d.speaker}: "${d.essence}"`).join('\n')}

### 필수 행동
${sd.mustInclude.actions.map(a => `- ${a}`).join('\n')}

### 이번 씬의 복선
${sd.mustInclude.foreshadowings.map(f => `- ${f}`).join('\n')}

### 금지 사항
${sd.avoid.map(a => `- ❌ ${a}`).join('\n')}

### 훅
- 이전 씬에서 넘어오는 훅: ${sd.hookFromPrevious}
- 다음 씬으로 이어지는 훅: ${sd.hookToNext}
`;
  }

  // 심층 캐릭터 프로필 정보 (이 씬 등장인물만)
  let deepProfileInfo = '';
  if (enhancedOptions?.deepCharacterProfiles && enhancedOptions.deepCharacterProfiles.length > 0) {
    const sceneProfiles = enhancedOptions.deepCharacterProfiles.filter(
      p => scene.participants.includes(p.name) || sceneCharacters.some(c => c.name === p.name)
    );
    if (sceneProfiles.length > 0) {
      deepProfileInfo = `\n### 🎭 등장인물 심층 프로필\n`;
      for (const profile of sceneProfiles) {
        deepProfileInfo += `**${profile.name}**
- 이 씬에서의 내면: ${profile.psychology.lie} → ${profile.psychology.truth}로 향하는 여정 중
- 말투: ${profile.voice.speechPatterns.slice(0, 2).join(', ')}
- 입버릇: "${profile.voice.catchPhrases[0] || ''}"
- 주의: ${profile.voice.avoidWords.slice(0, 2).join(', ')} 표현 금지

`;
      }
    }
  }

  // 🔒 씬 검증 규칙 (코드 강제) - sceneValidator.ts에서 동적 생성
  const sceneValidationRules = generateValidationRulesForPrompt(scene);

  // ============================================
  // 🔒 새로운 프롬프트 시스템 v4.0 - 종료조건 최우선!
  // 분량보다 종료조건이 훨씬 더 중요함을 명확히 전달
  // ============================================

  // 🔴 NEW v5.0: 다음 씬 정보 추출 (미리 쓰면 안 되는 내용)
  const allScenes = volume.scenes || [];
  const currentSceneIndex = allScenes.findIndex(s => s.id === scene.id || s.sceneNumber === scene.sceneNumber);
  const nextScene = currentSceneIndex >= 0 && currentSceneIndex < allScenes.length - 1
    ? allScenes[currentSceneIndex + 1]
    : null;

  // 🔴 v3.0: forbiddenInThisScene 우선 사용, 없으면 자동 추출
  const sceneForbidden = scene.forbiddenInThisScene || [];
  const nextSceneForbiddenKeywords = [
    ...sceneForbidden, // 씬에 명시된 금지 키워드
    ...(nextScene
      ? [
          nextScene.title,
          ...(nextScene.mustInclude || []).slice(0, 3).map(m => m.split(' ').slice(0, 3).join(' ')),
          nextScene.location !== scene.location ? nextScene.location : null,
          ...(nextScene.participants || []).filter(p => !scene.participants.includes(p)),
        ]
      : []),
  ].filter(Boolean) as string[];

  const userPrompt = `# 🛑🛑🛑 최우선 명령: 종료조건 준수! 🛑🛑🛑

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ 이 씬은 "${scene.endCondition}" 에서 끝나야 합니다!
⛔ 종료조건에 도달하면 즉시 멈추세요!
⛔ 분량이 부족해도 상관없습니다 - 종료조건이 최우선!
⛔ 목표 분량의 50~60%만 채워도 충분합니다!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 이 씬의 범위 (벗어나면 즉시 실패!)

| 항목 | 값 |
|------|-----|
| 🏠 장소 | **${scene.location || '미정'}** (다른 장소 이동 금지!) |
| 👥 등장인물 | **${scene.participants.join(', ') || '미정'}** (다른 인물 등장 금지!) |
| ⏰ 시간대 | **${scene.timeframe || '연속된 한 순간'}** (시간점프 금지!) |
| 🚀 시작 | "${scene.startCondition || '이전 씬에서 이어짐'}" |
| 🛑 종료 | **"${scene.endCondition}"** ← 여기서 멈춤! |

## ⛔ 절대 금지 (위반 = 즉시 실패!)

1. **시간 점프 금지**: "며칠 후", "다음 날", "시간이 흘러", "얼마 후", "그 후", "결국", "마침내", "드디어", "이윽고", "그리하여" 등
2. **장소 이동 금지**: ${scene.location || '현재 장소'} 외 다른 장소 묘사 금지
3. **인물 제한**: ${scene.participants.join(', ') || '지정된 인물'} 외 등장 금지
4. **종료 이후 금지**: "${scene.endCondition}" 이후 어떤 내용도 작성 금지
5. **미래 이야기 금지**: 시간여행, 훈련, 수련, 전쟁, 전투 등 (mustInclude에 없으면)
${nextSceneForbiddenKeywords.length > 0 ? `
## 🚫🚫🚫 다음 씬 내용 미리 쓰기 금지! 🚫🚫🚫
아래 키워드가 나오면 당신은 다음 씬을 미리 쓰고 있는 것입니다:
${nextSceneForbiddenKeywords.map(k => `- ❌ "${k}"`).join('\n')}
→ 이 키워드들은 다음 씬(${nextScene?.sceneNumber}번 씬)에서 다룹니다. 절대 미리 쓰지 마세요!
` : ''}

## ✅ 이 씬에서 쓸 내용 (이것만 쓰세요!)
${mustIncludeList || '- 씬 시작점에서 종료점까지 자연스럽게 진행'}

## 📝 등장인물 정보
${characterInfo}
${deepProfileInfo}

## 🌍 세계관 (참고만)
${worldInfo.slice(0, 800)}

---

# 🎯 집필 지시

**작품**: "${project.title}" ${volume.volumeNumber}권 ${scene.sceneNumber}번 씬
**시점**: ${scene.pov} (${povTypeMap[scene.povType] || '3인칭 제한'})
${previousSceneSummary ? `**직전 씬**: ${previousSceneSummary.slice(0, 150)}...` : ''}

## 🔴 핵심 규칙 (반드시 지켜야 함!)

1. **시작**: "${scene.startCondition || '이전 씬에서 이어짐'}"
2. **종료**: "${scene.endCondition}" ← 이 장면 쓰면 즉시 멈춤!
3. **분량 규칙 (매우 중요!):**
   - 목표: ${scene.targetWordCount.toLocaleString()}자
   - 실제로는 **${Math.round(scene.targetWordCount * 0.5).toLocaleString()}~${Math.round(scene.targetWordCount * 0.6).toLocaleString()}자**만 써도 충분합니다
   - 종료조건에 도달하면 분량 상관없이 즉시 끝내세요
   - **절대로** 분량 채우려고 새 사건/인물/장소를 추가하지 마세요

## 📝 분량이 부족하다고 느껴질 때:
- ❌ 새 사건 추가 금지
- ❌ 새 인물 등장 금지
- ❌ 시간 점프 금지
- ✅ 현재 장면의 감정/분위기 더 깊이 묘사
- ✅ 등장인물의 표정/동작 디테일 추가
- ✅ 배경 묘사 (${scene.location})를 더 세밀하게

${generateLiteraryEnhancementGuide(scene, project, characters, style, {
  project,
  characters,
  worldSettings,
  plotStructure,
  foreshadowings,
  conflicts,
  consistencyContext,
  previousSceneText: enhancedOptions?.previousSceneText,
  totalScenesInVolume: enhancedOptions?.totalScenesInVolume,
})}

이제 소설을 시작하세요. "${scene.endCondition}" 장면을 쓴 후 바로 멈추세요!
(${Math.round(scene.targetWordCount * 0.5).toLocaleString()}자 정도만 써도 충분합니다)`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      volumeNumber: volume.volumeNumber,
      sceneNumber: scene.sceneNumber,
      targetWordCount: scene.targetWordCount,
      endCondition: scene.endCondition,
      mode: 'scene',
    },
  };
}

// ============================================
// 이어쓰기 프롬프트 생성 (개선)
// ============================================

export function generateContinuePrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  characters: Character[],
  lastContent: string,
  currentWordCount: number,
  remainingMustInclude: string[],
  foreshadowings?: Foreshadowing[],
  conflicts?: Conflict[]
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style);

  // 씬 등장인물 (간략)
  const sceneCharacters = characters.filter(c =>
    scene.participants.includes(c.id) || scene.participants.includes(c.name)
  );
  const characterInfo = sceneCharacters
    .map(c => `- ${c.name}: ${c.personality.slice(0, 100)}${c.speechPattern?.tone ? `, 말투: ${c.speechPattern.tone}` : ''}`)
    .join('\n');

  // 활성 복선
  const activeForeshadowings = foreshadowings?.filter(f => f.status === 'planted' || f.status === 'reinforced') || [];
  const foreshadowingHints = activeForeshadowings.length > 0
    ? '\n## 심어야 할 복선\n' + activeForeshadowings.slice(0, 3).map(f => `- ${f.title}: ${f.plantedMethod}`).join('\n')
    : '';

  // 활성 갈등
  const activeConflicts = conflicts?.filter(c => c.status === 'active' || c.status === 'escalating') || [];
  const conflictHints = activeConflicts.length > 0
    ? '\n## 진행 중인 갈등\n' + activeConflicts.slice(0, 3).map(c => `- ${c.title} (강도 ${c.intensity}/10)`).join('\n')
    : '';

  const userPrompt = `## 이어쓰기 정보
- 작품: ${project.title} ${volume.volumeNumber}권
- 현재 씬: ${scene.sceneNumber}번 "${scene.title}"
- 진행: ${currentWordCount.toLocaleString()}자 / 목표 ${scene.targetWordCount.toLocaleString()}자 (${Math.round(currentWordCount / scene.targetWordCount * 100)}%)

## 등장인물
${characterInfo || '정보 없음'}

## 마지막으로 쓴 내용 (최근 500자)
"""
${lastContent.slice(-500)}
"""

## 아직 포함하지 않은 필수 내용
${remainingMustInclude.length > 0 ? remainingMustInclude.map((item, i) => `${i + 1}. ${item}`).join('\n') : '모두 포함됨'}
${foreshadowingHints}
${conflictHints}

## 🚨🚨🚨 종료 조건 (최우선!) 🚨🚨🚨
이 씬은 반드시 다음에서 끝나야 합니다:
"${scene.endCondition}"

### 🛑 절대 금지:
1. 종료 조건 이후 내용 작성 금지
2. 다음 씬 내용 작성 금지
3. 시간 점프 금지 (며칠 후, 몇 달 후 등)
4. 급하게 마무리 짓기 금지

### 🔄 반복 금지:
- 각성/깨달음 장면 반복 X
- 힘 획득 장면 반복 X
- 결심/다짐 장면 반복 X
- 유사 대사/묘사 반복 X

### ✅ 종료 조건 도달 시:
1. 종료 조건에 해당하는 장면/대사 작성
2. "---"를 쓰고 즉시 멈춤
3. 이후 아무것도 쓰지 않음

## 주의사항
- 위 내용에서 자연스럽게 이어서 쓴다
- 디테일하게 천천히 (요약하지 말 것!)
- 캐릭터 말투와 성격 유지
- 하나의 상황만 다루기

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이어서 집필하세요.
종료 조건: "${scene.endCondition}" 도달 시 즉시 멈춤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      volumeNumber: volume.volumeNumber,
      sceneNumber: scene.sceneNumber,
      targetWordCount: scene.targetWordCount - currentWordCount,
      endCondition: scene.endCondition,
      mode: 'continue',
    },
  };
}

// ============================================
// 빠른 생성용 프롬프트 (Quick Mode)
// ============================================

export function generateQuickPrompt(
  project: Project,
  characters: Character[],
  worldSettings: WorldSetting[],
  plotStructure: PlotStructure | null,
  foreshadowings: Foreshadowing[],
  conflicts: Conflict[],
  options: {
    generationType: 'continue' | 'dialogue' | 'description' | 'action' | 'rewrite' | 'expand';
    tone: string;
    targetLength: number;
    currentContent: string;
    customPrompt?: string;
    selectedCharacterIds?: string[];
    sceneSetting?: { title: string; location: string; timeframe: string };
  },
  // 강화된 옵션 (v2.0)
  enhancedOptions?: {
    storyAnalysis?: StoryAnalysisResult;
    deepCharacterProfiles?: DeepCharacterProfile[];
    writingGuidelines?: WritingGuidelines;
  }
): string {
  // 선택된 캐릭터 또는 주요 캐릭터 (더 많이 포함)
  const selectedCharacters = options.selectedCharacterIds
    ? characters.filter(c => options.selectedCharacterIds!.includes(c.id))
    : characters.filter(c => c.role === 'protagonist' || c.role === 'antagonist' || c.role === 'deuteragonist').slice(0, 5);

  // 캐릭터 정보를 상세하게 (true로 변경)
  const characterInfo = generateCharacterInfo(selectedCharacters, true);

  // 핵심 세계관만
  const coreWorld = worldSettings.filter(w => w.importance === 'core').slice(0, 3);
  const worldInfo = coreWorld.length > 0
    ? coreWorld.map(w => `- ${w.title}: ${w.description.slice(0, 80)}`).join('\n')
    : '세계관 정보 없음';

  // 현재 컨텍스트에서 마지막 부분 추출
  const lastContent = options.currentContent
    .replace(/<[^>]*>/g, '')
    .trim()
    .split('\n')
    .slice(-5)
    .join('\n');

  // 활성 갈등 힌트 (강화)
  const activeConflicts = conflicts.filter(c => c.status === 'active' || c.status === 'escalating');
  const conflictHint = activeConflicts.length > 0
    ? `\n## 🔥 진행 중인 갈등 (반드시 반영!)
${activeConflicts.slice(0, 3).map(c => `- **${c.title}** (강도: ${c.intensity}/10): ${c.description.slice(0, 100)}`).join('\n')}`
    : '';

  // 활성 복선 힌트 (추가)
  const activeForeshadowings = foreshadowings.filter(f => f.status === 'planted' || f.status === 'reinforced');
  const foreshadowingHint = activeForeshadowings.length > 0
    ? `\n## 🎯 심어진 복선 (자연스럽게 언급 가능)
${activeForeshadowings.slice(0, 3).map(f => `- ${f.title}: ${f.plantedMethod}`).join('\n')}`
    : '';

  // 플롯 포인트 힌트 (추가)
  const currentPlotPoints = plotStructure?.plotPoints?.filter(p => !p.completed).slice(0, 2) || [];
  const plotHint = currentPlotPoints.length > 0
    ? `\n## 📖 현재 진행 중인 플롯
${currentPlotPoints.map(p => `- [${p.type}] ${p.title}: ${p.description.slice(0, 80)}`).join('\n')}`
    : '';

  // 생성 유형별 지시
  const typeInstructions: Record<string, string> = {
    continue: '위 내용에서 자연스럽게 이어서 작성하세요.',
    dialogue: '캐릭터들의 대화를 생성하세요. 각 캐릭터의 말투와 성격을 반영하세요.',
    description: '장면이나 분위기에 대한 묘사를 작성하세요.',
    action: '행동과 움직임 중심의 장면을 작성하세요.',
    rewrite: '위 내용을 더 나은 문체로 다시 작성하세요.',
    expand: '위 내용을 더 자세하게 확장하세요.',
  };

  // 스토리 분석 기반 경고 (v2.0)
  let storyWarnings = '';
  if (enhancedOptions?.storyAnalysis) {
    const deadChars = enhancedOptions.storyAnalysis.characterStates.filter(c => c.status === 'dead');
    const imprisonedChars = enhancedOptions.storyAnalysis.characterStates.filter(c => c.status === 'imprisoned');

    if (deadChars.length > 0) {
      storyWarnings += `\n### 💀 사망한 캐릭터 (절대 등장 금지!)
${deadChars.map(c => `- ${c.characterName}`).join('\n')}
`;
    }
    if (imprisonedChars.length > 0) {
      storyWarnings += `\n### 🔒 감금/제한된 캐릭터
${imprisonedChars.map(c => `- ${c.characterName}: ${c.lastSeenLocation}에서만`).join('\n')}
`;
    }
  }

  // 심층 캐릭터 정보 (v2.0)
  let deepCharInfo = '';
  if (enhancedOptions?.deepCharacterProfiles) {
    const relevantProfiles = enhancedOptions.deepCharacterProfiles.filter(
      p => selectedCharacters.some(c => c.name === p.name)
    );
    if (relevantProfiles.length > 0) {
      deepCharInfo = `\n### 캐릭터 심층 정보
${relevantProfiles.map(p => `**${p.name}**
- 말투: ${p.voice.speechPatterns.slice(0, 2).join(', ')}
- 입버릇: "${p.voice.catchPhrases[0] || ''}"
- 주의: ${p.voice.avoidWords.slice(0, 2).join(', ')} 표현 금지`).join('\n\n')}
`;
    }
  }

  // 집필 가이드라인 힌트 (v2.0)
  let guidelinesHint = '';
  if (enhancedOptions?.writingGuidelines) {
    const wg = enhancedOptions.writingGuidelines;
    guidelinesHint = `\n### 문체 가이드
- ${wg.style.toneDescriptions[0] || ''}
- 대화: ${wg.style.dialogueStyle}
- 금지: ${wg.avoidList.slice(0, 2).join(', ')}
`;
  }

  return `당신은 한국의 베스트셀러 소설가입니다.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genre.join(', ')}
- 컨셉: ${project.concept}
${options.sceneSetting ? `
## 현재 씬
- 제목: ${options.sceneSetting.title}
- 장소: ${options.sceneSetting.location}
- 시간: ${options.sceneSetting.timeframe}
` : ''}

## 등장인물
${characterInfo}
${deepCharInfo}

## 세계관
${worldInfo}
${plotHint}
${conflictHint}
${foreshadowingHint}
${storyWarnings}
${guidelinesHint}

## 현재 내용
"""
${lastContent || '(시작 부분)'}
"""

## 요청
- 유형: ${options.generationType}
- 분위기: ${options.tone}
- 분량: ${options.targetLength}자 이상
${options.customPrompt ? `- 추가 지시: ${options.customPrompt}` : ''}

## 지시사항
${typeInstructions[options.generationType]}

## 🚨🚨🚨 절대 규칙 (최우선!) 🚨🚨🚨

### 🔴 1. 슬로우 페이싱 (가장 중요!!!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ 이 요청에서는 "하나의 순간"만 묘사합니다!
⛔ 1000자 = 현실에서 30초~1분 분량만 묘사!
⛔ 여러 사건을 압축하지 마세요!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**올바른 예시:**
✅ "철수가 문을 열고 들어왔다. 그의 얼굴에는 피로가 가득했다.
   방 안의 공기가 차가웠다. 창문 밖으로 해가 지고 있었다.
   철수는 의자에 털썩 주저앉았다. 한숨이 절로 나왔다.
   '힘들었어.' 그가 말했다."
→ 이것이 한 "순간"입니다. 약 30초 분량.

**잘못된 예시:**
❌ "철수가 들어왔다. 저녁을 먹고 잠을 잤다. 다음 날 아침..."
→ 이것은 시간 압축! 절대 금지!

### 🔴 2. 스토리 점프 완전 차단!
- ❌ "며칠 후", "몇 달이 흘러", "시간이 지나" 절대 금지
- ❌ "다음 날", "이튿날", "그 후로", "어느덧" 금지
- ❌ "결국", "마침내", "드디어" 등 요약 표현 금지
- ❌ "그렇게 해서", "이렇게 해서" 등 마무리 표현 금지
- ❌ 갑자기 장소가 바뀌는 것 금지
- ❌ 갑자기 새로운 인물이 등장하는 것 금지
- ✅ 현재 순간, 현재 장소, 연속된 시간만 묘사
- ✅ 하나의 장면 = 하나의 연속된 상황 (30초~2분)

### 🔴 3. 분량 채우기 = 디테일 (새 사건 금지!)
분량이 부족하면:
- ✅ 인물의 표정, 눈빛, 손짓을 더 묘사
- ✅ 주변 환경과 분위기를 더 묘사
- ✅ 인물의 내면 심리를 더 깊게 표현
- ✅ 대화 중 침묵, 망설임, 미묘한 뉘앙스 추가
- ❌ 새로운 사건 추가 절대 금지
- ❌ 새로운 인물 등장 금지
- ❌ 장소 이동 금지

### 🔴 4. 씬 범위 엄격 준수
- ❌ **현재 씬에 정의된 내용만 작성**
- ❌ **다음 씬 내용 미리 작성 절대 금지**
- ❌ **씬의 종료점을 넘어서 작성 금지**
- ✅ 현재 씬의 장소, 시간, 등장인물만 사용

### 🔴 5. 반복 완전 차단!
- ❌ **이전에 나온 장면/상황 다시 쓰기 금지**
- ❌ **이전에 나온 대사와 유사한 대사 금지**
- ❌ **각성/깨달음 장면 반복 금지** (한 작품에 1번만!)
- ❌ **힘 획득/능력 각성 장면 반복 금지** (한 작품에 1번만!)
- ❌ **결심/다짐 장면 반복 금지** (한 작품에 1번만!)
- ❌ **"주먹을 불끈", "눈빛이 변하다", "전율이" 등 클리셰 금지**
- ✅ 모든 장면은 완전히 새로운 상황이어야 함

### 🔴 6. 스토리 일관성!
- ❌ 이미 발생한 사건 다시 발생시키기 금지
- ❌ 이미 해결된 갈등 다시 해결하기 금지
- ❌ 캐릭터 성격이 갑자기 변하는 것 금지
- 💀 사망 캐릭터: 현재 시점에서 절대 등장 불가 (회상만)
- 🔒 감금 캐릭터: 해당 장소에서만 등장
- ✅ 캐릭터별 고유 말투 반드시 유지

## 한국 소설책 형식
- 문단 첫 줄 들여쓰기 (전각 공백)
- 대화는 따옴표(" ") 사용
- 마침표로 문장 마무리`;
}

// ============================================
// 유틸리티 함수
// ============================================

export function createDefaultVolumeStructure(
  projectId: string,
  volumeNumber: number
): VolumeStructure {
  return {
    id: crypto.randomUUID(),
    projectId,
    volumeNumber,
    title: `${volumeNumber}권`,
    targetWordCount: 150000,
    startPoint: '',
    endPoint: '',
    endPointType: 'scene',
    endPointExact: '',
    coreEvent: '',
    scenes: [],
    status: 'planning',
    actualWordCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createDefaultSceneStructure(
  volumeId: string,
  sceneNumber: number
): SceneStructure {
  return {
    id: crypto.randomUUID(),
    volumeId,
    sceneNumber,
    title: `씬 ${sceneNumber}`,
    targetWordCount: 15000,
    pov: '',
    povType: 'third-limited',
    location: '',
    timeframe: '',
    participants: [],
    mustInclude: [],
    startCondition: '',
    endCondition: '',
    endConditionType: 'scene',
    status: 'pending',
    actualWordCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function autoSplitVolumeIntoScenes(
  volume: VolumeStructure,
  sceneCount: number = 10
): SceneStructure[] {
  const targetPerScene = Math.floor(volume.targetWordCount / sceneCount);
  const scenes: SceneStructure[] = [];

  for (let i = 1; i <= sceneCount; i++) {
    scenes.push({
      ...createDefaultSceneStructure(volume.id, i),
      targetWordCount: targetPerScene,
      title: `${volume.volumeNumber}-${i}`,
    });
  }

  return scenes;
}

export function checkWordCount(
  currentCount: number,
  targetCount: number,
  content: string,
  endCondition: string
): {
  percentage: number;
  status: 'under' | 'on_target' | 'over';
  endConditionReached: boolean;
} {
  const percentage = Math.round((currentCount / targetCount) * 100);
  const status = percentage < 90 ? 'under' : percentage > 110 ? 'over' : 'on_target';
  const endConditionReached = content.includes(endCondition) ||
    content.includes('--- ') && content.includes('권 끝 ---');

  return { percentage, status, endConditionReached };
}

export function calculateProjectProgress(
  volumes: VolumeStructure[]
): {
  totalVolumes: number;
  completedVolumes: number;
  totalTargetWordCount: number;
  totalActualWordCount: number;
  overallPercentage: number;
} {
  const totalVolumes = volumes.length;
  const completedVolumes = volumes.filter(v => v.status === 'completed').length;
  const totalTargetWordCount = volumes.reduce((sum, v) => sum + v.targetWordCount, 0);
  const totalActualWordCount = volumes.reduce((sum, v) => sum + v.actualWordCount, 0);
  const overallPercentage = totalTargetWordCount > 0
    ? Math.round((totalActualWordCount / totalTargetWordCount) * 100)
    : 0;

  return {
    totalVolumes,
    completedVolumes,
    totalTargetWordCount,
    totalActualWordCount,
    overallPercentage,
  };
}

export function validateEndPoint(endPoint: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!endPoint || endPoint.trim().length === 0) {
    issues.push('종료점이 비어있습니다');
  }

  if (endPoint.length < 10) {
    issues.push('종료점이 너무 짧습니다. 구체적인 대사나 행동을 명시하세요');
  }

  const vagueTerms = ['성장한다', '변화한다', '깨닫는다', '결심한다', '시작한다'];
  for (const term of vagueTerms) {
    if (endPoint.includes(term)) {
      issues.push(`"${term}"는 모호합니다. 구체적인 대사나 행동으로 바꾸세요`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function generateVolumeTemplate(
  projectTitle: string,
  totalVolumes: number,
  volumeSummaries: { title: string; startPoint: string; endPoint: string; coreEvent: string }[]
): string {
  let template = `# ${projectTitle} 권별 구조\n\n`;
  template += `| 권 | 제목 | 시작점 | 종료점 | 핵심 사건 |\n`;
  template += `|----|------|--------|--------|----------|\n`;

  for (let i = 0; i < totalVolumes; i++) {
    const v = volumeSummaries[i] || { title: '', startPoint: '', endPoint: '', coreEvent: '' };
    template += `| ${i + 1}권 | ${v.title} | ${v.startPoint} | ${v.endPoint} | ${v.coreEvent} |\n`;
  }

  return template;
}


// ============================================
// v7.0: 세계 최고 수준 문학적 강화 가이드 생성
// ============================================

function generateLiteraryEnhancementGuide(
  scene: SceneStructure,
  project: Project,
  characters: Character[],
  style: WritingStyle,
  context?: FullContext,
): string {
  let guide = '';

  // --- v6.0 시스템 ---
  // 1. 문체 일관성 가이드
  guide += generateStyleGuideForScene(project, style);

  // 2. 감정 깊이 가이드
  guide += generateEmotionGuideForScene(scene);

  // 3. 캐릭터 음성 가이드
  guide += generateCharacterVoiceGuideForScene(scene, characters);

  // --- v7.0 시스템 ---
  // 4. 문장 품질 가이드 (클리셰/반복/필터단어 금지)
  guide += generateProseQualityGuideForScene();

  // 5. 문학적 깊이 가이드 (은유/상징/서브텍스트/아이러니)
  guide += generateLiteraryDepthGuideForScene(scene, project);

  // 6. 감각 몰입 가이드 (오감 레이어링)
  guide += generateSensoryGuideForScene(scene, project);

  // 7. 대화 마스터 가이드 (서브텍스트 있는 대화)
  guide += generateDialogueGuideForScene(scene);

  // 8. 서사 아크 위치 가이드 (현재 씬의 구조적 역할)
  guide += generateNarrativeArcGuideForScene(scene, context);

  // 9. 씬 간 일관성 가이드 (이전 씬과의 연속성)
  guide += generateCoherenceGuideForScene(context);

  // 10. 퇴고 내장 지침 (작성하면서 자체 검토)
  guide += generateInlineRevisionGuide();

  return guide;
}

/**
 * 문체 일관성 가이드 생성
 */
function generateStyleGuideForScene(project: Project, style: WritingStyle): string {
  // 프로젝트 장르에 따라 적합한 스타일 프로필 선택
  const genreArr = Array.isArray(project.genre) ? project.genre : [];
  const genreStr = genreArr.join(' ');
  let profileKey = 'literary-fiction';

  if (genreStr.includes('역사') || genreStr.includes('사극') || genreStr.includes('대하')) {
    profileKey = 'historical-epic';
  } else if (genreStr.includes('로맨스') || genreStr.includes('연애')) {
    profileKey = 'romance';
  } else if (genreStr.includes('액션') || genreStr.includes('판타지') || genreStr.includes('무협')) {
    profileKey = 'web-novel-action';
  }

  const profile = STYLE_PROFILES[profileKey];
  if (!profile) return '';

  const manager = new StyleConsistencyManager(profile);
  return `
---
${manager.generateStyleGuidelines()}
`;
}

/**
 * 감정 깊이 가이드 생성
 */
function generateEmotionGuideForScene(scene: SceneStructure): string {
  const engine = new EmotionDepthEngine();

  // 씬의 감정 목표를 EmotionState로 변환
  const emotionGoal = scene.emotionalGoal || '';
  const emotionMap: Record<string, PrimaryEmotion> = {
    '기쁨': 'joy', '슬픔': 'sadness', '분노': 'anger', '두려움': 'fear',
    '놀라움': 'surprise', '놀람': 'surprise', '혐오': 'disgust',
    '사랑': 'love', '신뢰': 'trust', '기대': 'anticipation',
    '수치심': 'shame', '수치': 'shame', '죄책감': 'guilt',
    '자부심': 'pride', '질투': 'envy', '외로움': 'loneliness',
    '향수': 'nostalgia', '희망': 'hope', '절망': 'despair',
    '혼란': 'confusion', '안도': 'relief', '긴장': 'tension',
    '열정': 'anticipation', '흥분': 'joy', '공포': 'fear',
    '당혹': 'confusion', '경악': 'surprise', '결의': 'pride',
    '호기심': 'anticipation', '적응': 'relief', '고뇌': 'sadness',
    '정의감': 'anger', '유대감': 'love', '만족감': 'joy',
    '피로': 'sadness', '충격': 'surprise', '수용': 'relief',
    '각성': 'surprise',
  };

  const primaryEmotion = emotionMap[emotionGoal] || 'tension';

  // 씬 타입에 따른 강도 결정
  let intensity: 1 | 2 | 3 | 4 | 5 = 3;
  if (scene.sceneType === 'climax') intensity = 5;
  else if (scene.sceneType === 'important') intensity = 4;
  else if (scene.sceneType === 'mini') intensity = 2;

  const emotionState: EmotionState = {
    primary: primaryEmotion,
    intensity,
  };

  return engine.generateEmotionGuidelines(emotionState);
}

/**
 * 캐릭터 음성 가이드 생성
 */
function generateCharacterVoiceGuideForScene(scene: SceneStructure, characters: Character[]): string {
  const voiceManager = new CharacterVoiceManager();

  // 사전 정의된 음성 프로필 등록
  for (const [, voice] of Object.entries(PREDEFINED_VOICES)) {
    voiceManager.registerVoice(voice);
  }

  // 씬 참여자에 대한 음성 가이드 생성
  const participantIds = scene.participants;

  // 사전 정의된 프로필이 있는 참여자만 필터
  const matchedIds: string[] = [];
  for (const pid of participantIds) {
    const matchedVoice = Object.values(PREDEFINED_VOICES).find(v =>
      v.characterName === pid ||
      v.characterName.includes(pid) ||
      pid.includes(v.characterName.split('(')[0].trim())
    );
    if (matchedVoice) {
      matchedIds.push(matchedVoice.characterId);
    }
  }

  if (matchedIds.length > 0) {
    return voiceManager.generateVoiceGuide(matchedIds);
  }

  // 사전 정의된 프로필이 없으면, characters 데이터에서 동적 생성
  if (characters.length > 0) {
    return generateDynamicVoiceGuide(scene, characters);
  }

  return '';
}

/**
 * 캐릭터 데이터에서 동적 음성 가이드 생성
 */
function generateDynamicVoiceGuide(scene: SceneStructure, characters: Character[]): string {
  const sceneCharacters = characters.filter(c =>
    scene.participants.includes(c.id) || scene.participants.includes(c.name)
  );

  if (sceneCharacters.length === 0) return '';

  let guide = `
---
## 🗣️ 캐릭터 음성 일관성 지침

### ⛔ 핵심 원칙
- 대사만 봐도 누구인지 알 수 있어야 합니다
- 각 캐릭터의 말투, 어휘, 리듬이 달라야 합니다
- "~라고 말했다" 서술태그를 최소화하세요

`;

  for (const c of sceneCharacters) {
    guide += `### 👤 ${c.name}
- 성격: ${c.personality || '미정'}
${c.speechStyle ? `- 말투: ${c.speechStyle}` : ''}
${c.habits ? `- 습관: ${c.habits.join(', ')}` : ''}

`;
  }

  guide += `### 대사 서술 다양화
- ❌ 반복 금지: "~라고 말했다" 연속 사용
- ✅ 행동+대사: "검을 들며 말했다"
- ✅ 대사만: 들여쓰기로 구분
- ✅ 반응+대사: 눈이 커졌다. "정말?"
- ✅ 대사+내면: "그래." 하지만 속으로는 달랐다.
`;

  return guide;
}

// ============================================
// v7.0: 세계 최고 수준 문학 시스템 함수들
// ============================================

/**
 * 문장 품질 가이드 (ProseQualityAnalyzer 연동)
 */
function generateProseQualityGuideForScene(): string {
  const analyzer = new ProseQualityAnalyzer();
  return analyzer.generateQualityGuide();
}

/**
 * 문학적 깊이 가이드 (LiteraryDepthEngine 연동)
 */
function generateLiteraryDepthGuideForScene(scene: SceneStructure, project: Project): string {
  const engine = new LiteraryDepthEngine();
  const themes = Array.isArray(project.genre) ? project.genre : (project.genre ? [project.genre] : []);
  return engine.generateMasterLiteraryGuide({
    sceneNumber: scene.sceneNumber,
    sceneType: scene.sceneType || 'normal',
    emotionalGoal: scene.emotionalGoal || '',
    participants: scene.participants || [],
    themes,
  });
}

/**
 * 감각 몰입 가이드 (SensoryImmersionSystem 연동)
 */
function generateSensoryGuideForScene(scene: SceneStructure, project: Project): string {
  const sensory = new SensoryImmersionSystem();
  const genreJoined = Array.isArray(project.genre) ? project.genre.join(' ') : '';
  const isHistorical = genreJoined.includes('역사') || genreJoined.includes('사극') || genreJoined.includes('대하');
  return sensory.generateSensoryGuide({
    location: scene.location || '',
    timeframe: scene.timeframe || '',
    emotionalGoal: scene.emotionalGoal || '',
    sceneType: scene.sceneType || 'normal',
    era: isHistorical ? '조선' : '현대',
  });
}

/**
 * 대화 마스터 가이드 (DialogueMasterSystem 연동)
 */
function generateDialogueGuideForScene(scene: SceneStructure): string {
  const dialogue = new DialogueMasterSystem();
  return dialogue.generateDialogueGuide({
    participants: scene.participants || [],
    emotionalGoal: scene.emotionalGoal || '',
    sceneType: scene.sceneType || 'normal',
    hasConflict: !!(scene.plotFunction && (
      scene.plotFunction.includes('갈등') ||
      scene.plotFunction.includes('대립') ||
      scene.plotFunction.includes('충돌') ||
      scene.plotFunction.includes('싸움') ||
      scene.plotFunction.includes('전투')
    )),
  });
}

/**
 * 서사 아크 위치 가이드 (NarrativeArcValidator 연동)
 */
function generateNarrativeArcGuideForScene(scene: SceneStructure, context?: FullContext): string {
  const validator = new NarrativeArcValidator();
  const totalScenes = context?.totalScenesInVolume || 27;
  const volumeNumber = 1; // 기본값
  return validator.generateArcPositionGuide(
    scene.sceneNumber,
    totalScenes,
    volumeNumber,
  );
}

/**
 * 씬 간 일관성 가이드 (SceneCoherenceValidator 연동)
 */
function generateCoherenceGuideForScene(context?: FullContext): string {
  if (!context?.previousSceneText) return '';
  const validator = new SceneCoherenceValidator();
  return validator.generateContinuityGuide(null, context.previousSceneText);
}

/**
 * 퇴고 내장 지침 (RevisionEngine 연동)
 */
function generateInlineRevisionGuide(): string {
  const revision = new RevisionEngine();
  return revision.generateInlineRevisionGuide();
}
