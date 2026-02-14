/**
 * Literary Masters System - 세계적 거장들의 창작 기법 라이브러리
 *
 * 도스토예프스키, 톨스토이, 무라카미 하루키, 스티븐 킹, J.K. 롤링, 브랜든 샌더슨의
 * 핵심 창작 기법을 코드화하여 AI 소설 생성에 적용
 */

// ============================================
// 거장별 스타일 정의
// ============================================

export type MasterStyle =
  | 'dostoevsky'    // 도스토예프스키 - 심리 묘사
  | 'tolstoy'       // 톨스토이 - 서사 구조
  | 'murakami'      // 무라카미 하루키 - 분위기/감정
  | 'king'          // 스티븐 킹 - 플롯/서스펜스
  | 'rowling'       // J.K. 롤링 - 세계관/복선
  | 'sanderson';    // 브랜든 샌더슨 - 마법 시스템/규칙

export interface MasterTechnique {
  name: string;
  description: string;
  when_to_use: string[];
  how_to_apply: string[];
  example?: string;
  avoid?: string[];
}

export interface MasterProfile {
  name: string;
  koreanName: string;
  specialty: string;
  keyTechniques: MasterTechnique[];
  writingPrinciples: string[];
  emotionApproach: string;
  structureApproach: string;
  dialogueStyle: string;
  promptGuidelines: string;
}

// ============================================
// 거장 프로필 데이터베이스
// ============================================

export const MASTER_PROFILES: Record<MasterStyle, MasterProfile> = {
  dostoevsky: {
    name: 'Fyodor Dostoevsky',
    koreanName: '표도르 도스토예프스키',
    specialty: '심리 묘사의 대가',
    keyTechniques: [
      {
        name: '다성적 서사 (Polyphonic Narrative)',
        description: '각 캐릭터가 독립적이고 동등한 목소리를 가짐',
        when_to_use: [
          '복잡한 도덕적 딜레마를 다룰 때',
          '여러 관점이 충돌하는 장면',
          '캐릭터 간 철학적 토론'
        ],
        how_to_apply: [
          '각 캐릭터에게 고유한 세계관을 부여',
          '작가의 판단을 개입시키지 않음',
          '모든 관점을 동등하게 존중',
          '독자가 스스로 판단하게 함'
        ],
        example: '라스콜니코프의 내면 독백 - 살인의 정당화와 죄책감의 공존'
      },
      {
        name: '의식의 흐름 (Stream of Consciousness)',
        description: '캐릭터의 생각이 자연스럽게 흘러가는 것을 보여줌',
        when_to_use: [
          '강렬한 감정 상태',
          '중요한 결정의 순간',
          '내면 갈등이 폭발할 때'
        ],
        how_to_apply: [
          '문장 구조를 불규칙하게',
          '생각의 점프를 허용',
          '반복과 강박적 사고 패턴',
          '끊어지는 문장, 미완성 사고'
        ]
      },
      {
        name: '극단적 상황 설정',
        description: '도덕적 딜레마를 통해 인간 본성의 극한을 탐구',
        when_to_use: [
          '캐릭터의 진정한 본성을 드러낼 때',
          '가치관의 충돌 장면',
          '인물 성장의 전환점'
        ],
        how_to_apply: [
          '불가능한 선택지만 제시',
          '모든 선택에 대가가 따름',
          '도덕적 회색 지대 탐구',
          '정답이 없는 딜레마'
        ]
      }
    ],
    writingPrinciples: [
      '인간 심리의 모순을 두려워하지 말 것',
      '악인도 자신만의 논리가 있음을 보여줄 것',
      '구원과 타락은 동전의 양면',
      '고통을 통한 정화'
    ],
    emotionApproach: '극단적 감정 상태 직접 묘사, 죄책감/고뇌/회한의 신체화',
    structureApproach: '심리적 긴장을 중심으로 플롯 구성, 고백과 카타르시스',
    dialogueStyle: '철학적 토론, 고백, 광기 어린 독백',
    promptGuidelines: `
## 도스토예프스키 스타일 지침

### 핵심 원칙
- 캐릭터의 내면을 극한까지 파고들 것
- 모순된 감정을 동시에 표현 (사랑하면서 미워함, 원하면서 두려워함)
- 도덕적 판단을 유보하고 모든 관점을 존중

### 심리 묘사 방법
1. 생각의 흐름을 끊지 말고 따라갈 것
2. 반복되는 강박적 사고 패턴 보여주기
3. 신체 반응으로 내면 상태 암시
4. 자기 합리화와 자기 비난의 교차

### 대화 스타일
- 캐릭터 간 철학적 충돌
- 고백과 변명이 뒤섞인 독백
- 말과 행동의 불일치 (서브텍스트)

### 피해야 할 것
- 단순한 선악 구도
- 깨끗하게 해결되는 갈등
- 피상적인 감정 묘사
`
  },

  tolstoy: {
    name: 'Leo Tolstoy',
    koreanName: '레프 톨스토이',
    specialty: '서사 구조의 대가',
    keyTechniques: [
      {
        name: '파노라마 구조',
        description: '개인의 이야기를 사회 전체의 맥락 속에 배치',
        when_to_use: [
          '시대적 배경이 중요한 이야기',
          '여러 계층/집단의 상호작용',
          '역사적 사건과 개인 운명의 교차'
        ],
        how_to_apply: [
          '거시적 시점과 미시적 시점 교차',
          '다양한 사회 계층의 인물 등장',
          '시대의 흐름이 개인에게 미치는 영향',
          '개인의 선택이 역사에 기여하는 방식'
        ]
      },
      {
        name: '세밀한 관찰',
        description: '일상의 디테일을 통해 보편적 진실을 드러냄',
        when_to_use: [
          '캐릭터의 본성을 보여줄 때',
          '시대/환경의 분위기 전달',
          '중요한 순간의 강조'
        ],
        how_to_apply: [
          '구체적인 행동과 습관 묘사',
          '환경 디테일로 분위기 조성',
          '작은 제스처에 의미 부여',
          '반복되는 패턴으로 캐릭터 특성 강화'
        ],
        example: '안나 카레니나가 목걸이를 만지작거리는 습관 - 불안의 표현'
      },
      {
        name: '병렬 플롯',
        description: '여러 이야기 라인을 유기적으로 엮음',
        when_to_use: [
          '복잡한 이야기 구조',
          '대조되는 인물/상황 비교',
          '주제의 다각적 탐구'
        ],
        how_to_apply: [
          '주 플롯과 서브 플롯의 주제적 연결',
          '대조를 통한 의미 강화',
          '플롯 간 인과관계 설정',
          '적절한 타이밍의 교차'
        ]
      }
    ],
    writingPrinciples: [
      '진실에 대한 끊임없는 탐구',
      '모든 인물에게 존엄성 부여',
      '도덕적 교훈을 설교가 아닌 이야기로',
      '삶의 총체성 담기'
    ],
    emotionApproach: '담담한 관찰자 시점으로 감정을 객관적으로 제시, 행동과 디테일로 전달',
    structureApproach: '시간의 흐름에 따른 자연스러운 전개, 여러 플롯의 유기적 결합',
    dialogueStyle: '자연스러운 일상 대화, 계층/배경에 따른 어투 구분',
    promptGuidelines: `
## 톨스토이 스타일 지침

### 핵심 원칙
- 삶을 있는 그대로, 총체적으로 담을 것
- 개인의 이야기 뒤에 사회/시대의 맥락
- 판단보다 관찰, 설명보다 묘사

### 서사 구조
1. 시간의 자연스러운 흐름 존중
2. 여러 캐릭터의 시점 균형있게 배치
3. 작은 에피소드들이 큰 그림을 이룸
4. 결말이 아닌 과정의 의미

### 디테일 묘사
- 행동의 구체적 디테일 (손짓, 표정, 자세)
- 환경과 인물의 상호작용
- 습관과 반복 패턴으로 성격 표현
- 시대상을 반영하는 세부 묘사

### 피해야 할 것
- 작위적인 플롯 장치
- 과도한 우연의 일치
- 설명적인 도덕 교훈
`
  },

  murakami: {
    name: 'Haruki Murakami',
    koreanName: '무라카미 하루키',
    specialty: '분위기와 감정의 대가',
    keyTechniques: [
      {
        name: '리듬과 반복',
        description: '특정 이미지, 문구의 반복으로 몽환적 분위기 조성',
        when_to_use: [
          '꿈과 현실의 경계',
          '시간의 흐름이 느슨해질 때',
          '감정적 여운을 남기고 싶을 때'
        ],
        how_to_apply: [
          '핵심 이미지/모티프의 변주',
          '일상적 행위의 세밀한 묘사',
          '음악적 리듬감 있는 문장',
          '여백과 침묵의 활용'
        ],
        example: '"노르웨이의 숲"에서 반복되는 우물 이미지, 비틀즈 음악'
      },
      {
        name: '일상과 초현실의 경계 흐리기',
        description: '평범한 일상에서 기이한 것으로 자연스러운 이행',
        when_to_use: [
          '미스터리한 요소 도입',
          '내면 세계 탐구',
          '현실의 균열 표현'
        ],
        how_to_apply: [
          '갑작스럽지 않게, 서서히 이상해지기',
          '캐릭터가 기이함을 당연하게 받아들임',
          '설명 없이 존재하는 불가사의',
          '일상의 디테일 속 이질적 요소'
        ]
      },
      {
        name: '고독과 상실의 정서',
        description: '현대인의 소외감을 섬세하게 포착',
        when_to_use: [
          '혼자인 순간의 묘사',
          '상실 후의 일상',
          '관계의 단절/거리감'
        ],
        how_to_apply: [
          '담담한 어조로 깊은 감정 전달',
          '일상의 빈틈에서 느껴지는 공허',
          '연결되지 못하는 관계들',
          '혼자서 보내는 시간의 질감'
        ]
      }
    ],
    writingPrinciples: [
      '설명하지 말고 보여주기',
      '비유와 메타포의 힘',
      '담담함 속의 강렬함',
      '미완결의 여운'
    ],
    emotionApproach: '담담한 서술 속에 감정을 숨기고, 감각적 디테일로 독자가 느끼게 함',
    structureApproach: '느슨한 플롯, 여정과 탐색, 열린 결말',
    dialogueStyle: '짧고 함축적, 말하지 않는 것의 의미, 위트와 아이러니',
    promptGuidelines: `
## 무라카미 하루키 스타일 지침

### 핵심 원칙
- 담담하게, 그러나 깊게
- 설명 대신 감각으로 전달
- 일상의 균열에서 의미 찾기

### 분위기 조성
1. 감각적 디테일 풍부하게 (음식, 음악, 빛, 냄새)
2. 반복되는 모티프와 이미지
3. 시간이 느리게 흐르는 듯한 리듬
4. 여백과 침묵의 의미

### 감정 표현
- 감정을 직접 말하지 않음
- 행동과 환경으로 암시
- 강렬한 감정일수록 더 담담하게
- 독자가 채워 넣을 공간 남기기

### 문체 특징
- 짧은 문장과 긴 문장의 리듬
- 구체적인 고유명사 사용 (브랜드, 음악, 책)
- 비유와 메타포의 신선함
- 일상어의 문학적 사용

### 피해야 할 것
- 과도한 설명
- 감정의 직접적 언급
- 급한 플롯 전개
- 모든 것을 해결하는 결말
`
  },

  king: {
    name: 'Stephen King',
    koreanName: '스티븐 킹',
    specialty: '플롯과 서스펜스의 대가',
    keyTechniques: [
      {
        name: '평범한 상황에서 시작',
        description: '일상에서 공포가 침투하는 구조',
        when_to_use: [
          '서스펜스 구축 초반',
          '독자와의 공감대 형성',
          '현실감 있는 공포/긴장'
        ],
        how_to_apply: [
          '친숙한 환경 묘사로 시작',
          '평범한 인물의 평범한 일상',
          '점진적으로 이상한 요소 삽입',
          '독자가 "나도 저럴 수 있다" 느끼게'
        ]
      },
      {
        name: '페이싱 조절',
        description: '긴장과 이완의 리듬을 정교하게 조정',
        when_to_use: [
          '클라이맥스 준비',
          '독자 지침 방지',
          '감정적 임팩트 극대화'
        ],
        how_to_apply: [
          '긴장 장면 후 숨 돌릴 틈',
          '가짜 해결로 안심시킨 후 더 큰 위기',
          '챕터 엔딩 훅으로 페이지 터너',
          '짧은 챕터/긴 챕터 교대'
        ]
      },
      {
        name: '복선과 회수',
        description: '초반에 뿌린 단서가 후반에 의미 획득',
        when_to_use: [
          '플롯 구성 전반',
          '반전 준비',
          '재독 가치 높이기'
        ],
        how_to_apply: [
          '무의미해 보이는 디테일 심기',
          '3회 반복 법칙 (중요한 것은 3번 언급)',
          '회수 시점 계획',
          '너무 명확하지 않게, 너무 숨기지 않게'
        ]
      },
      {
        name: '캐릭터 중심 공포',
        description: '상황보다 인물의 심리적 반응 강조',
        when_to_use: [
          '공포/서스펜스 장면',
          '위기 상황',
          '캐릭터 성장/변화'
        ],
        how_to_apply: [
          '캐릭터가 두려워하는 것 = 독자가 두려워하는 것',
          '인물의 과거와 현재 위협 연결',
          '내면의 악마 vs 외부의 악마',
          '선택의 순간 강조'
        ]
      }
    ],
    writingPrinciples: [
      '매일 쓸 것 (일관성)',
      '초고는 문 닫고, 퇴고는 문 열고',
      '부사를 피할 것',
      '가장 무서운 것은 일상의 균열'
    ],
    emotionApproach: '두려움과 희망의 교차, 캐릭터 공감을 통한 감정 이입',
    structureApproach: '클래식한 플롯 구조 + 예측 불가능한 반전, 페이지 터너',
    dialogueStyle: '현실적이고 생생한 대화, 캐릭터 개성 드러내기',
    promptGuidelines: `
## 스티븐 킹 스타일 지침

### 핵심 원칙
- 캐릭터를 먼저 사랑하게 만든 후 위험에 빠뜨릴 것
- 일상의 디테일이 현실감의 핵심
- 두려움은 보여주기 전에 암시할 것

### 서스펜스 구축
1. Ticking Clock - 시간 압박 설정
2. 정보 비대칭 - 독자가 캐릭터보다 조금 더 알게
3. 가짜 안도 후 진짜 위기
4. 챕터 끝 훅 - 페이지 넘기게 만들기

### 복선 관리
- 체호프의 총 법칙: 보여준 것은 사용할 것
- 3회 반복: 심을 때, 강화할 때, 회수할 때
- 명확하지 않되 나중에 보면 당연하게
- 회수 시점 미리 계획

### 대화 스타일
- 사람들이 실제로 말하는 방식
- "said" 위주, 화려한 대화 태그 피하기
- 서브텍스트 - 말하지 않는 것의 의미
- 캐릭터마다 고유한 말투

### 피해야 할 것
- 부사 남용 ("그가 화나게 말했다" X)
- 수동태 과다
- 과도한 설명/백스토리 덤프
- 데우스 엑스 마키나
`
  },

  rowling: {
    name: 'J.K. Rowling',
    koreanName: 'J.K. 롤링',
    specialty: '세계관과 복선의 대가',
    keyTechniques: [
      {
        name: '계층적 세계관 구축',
        description: '규칙이 명확한 마법 세계, 층층이 쌓인 설정',
        when_to_use: [
          '판타지/SF 세계관 구축',
          '시리즈물 기획',
          '독자 몰입도 높이기'
        ],
        how_to_apply: [
          '핵심 규칙 확립 (마법의 한계)',
          '사회 구조와 문화 설계',
          '역사와 전설 창조',
          '일상 디테일로 세계 채우기'
        ],
        example: '호그와트 기숙사 시스템, 퀴디치 규칙, 마법 정부 구조'
      },
      {
        name: '장기 복선 설계',
        description: '7권 전체를 관통하는 복선 배치',
        when_to_use: [
          '시리즈 기획 단계',
          '주요 반전 준비',
          '캐릭터 배경 설정'
        ],
        how_to_apply: [
          '결말부터 역산하여 복선 배치',
          '초기에 무의미해 보이는 디테일',
          '캐릭터의 과거가 현재 행동에 영향',
          '재독 시 새로운 발견 가능하게'
        ],
        example: 'R.A.B. 메모 (6권 복선, 7권 회수), 스네이프의 진심'
      },
      {
        name: '캐릭터 아크 설계',
        description: '각 인물의 명확한 성장 곡선',
        when_to_use: [
          '캐릭터 개발 전반',
          '시리즈 전체 기획',
          '서브 캐릭터 깊이 부여'
        ],
        how_to_apply: [
          '캐릭터의 결함과 성장 방향 설정',
          '각 권/장에서의 작은 변화',
          '관계 변화와 캐릭터 성장 연동',
          '최종 상태와 시작 상태의 대비'
        ]
      }
    ],
    writingPrinciples: [
      '세계관의 논리적 일관성',
      '모든 것에는 이유가 있다',
      '독자와 함께 성장하는 이야기',
      '디테일이 마법을 만든다'
    ],
    emotionApproach: '캐릭터 성장과 관계를 통한 감정선, 유머와 감동의 균형',
    structureApproach: '미스터리 구조 + 성장 서사, 각 권 독립적이면서 전체 아크',
    dialogueStyle: '캐릭터 개성 반영, 위트와 유머, 중요 정보 자연스럽게 전달',
    promptGuidelines: `
## J.K. 롤링 스타일 지침

### 핵심 원칙
- 세계관에 규칙이 있고, 그 규칙은 지켜진다
- 복선은 공정하게 - 다시 읽으면 단서가 보인다
- 캐릭터는 성장하고 변화한다

### 세계관 구축
1. 핵심 규칙 (마법의 한계, 기술의 제약)
2. 사회 구조 (계층, 기관, 권력)
3. 문화와 전통 (축제, 관습, 금기)
4. 역사와 전설 (세계의 깊이)
5. 일상 디테일 (음식, 의복, 교통)

### 복선 관리 시스템
- 심기 (Plant): 자연스럽게, 주목받지 않게
- 강화 (Water): 가끔 다시 언급, 중요성 암시 없이
- 회수 (Payoff): 놀랍지만 납득 가능하게

### 캐릭터 개발
- 결함 + 장점 균형
- 원하는 것 vs 필요한 것
- 관계 네트워크 속 위치
- 성장의 단계적 설계

### 피해야 할 것
- 설정 충돌
- 근거 없는 반전
- 성장 없는 캐릭터
- 복선 없는 결말
`
  },

  sanderson: {
    name: 'Brandon Sanderson',
    koreanName: '브랜든 샌더슨',
    specialty: '마법 시스템과 규칙의 대가',
    keyTechniques: [
      {
        name: '샌더슨의 제1법칙',
        description: '마법으로 갈등을 해결하는 만족도 ∝ 독자의 마법 이해도',
        when_to_use: [
          '마법/능력 시스템 설계',
          '클라이맥스 장면',
          '문제 해결 장면'
        ],
        how_to_apply: [
          '마법 규칙을 명확히 설명',
          '제약과 비용 설정',
          '독자가 이해한 규칙 내에서 해결',
          '데우스 엑스 마키나 피하기'
        ],
        example: '미스트본의 알로만시 - 금속 종류별 능력과 한계가 명확'
      },
      {
        name: '샌더슨의 제2법칙',
        description: '약점과 한계가 능력만큼 중요하다',
        when_to_use: [
          '능력 시스템 설계',
          '캐릭터 밸런싱',
          '갈등 구조화'
        ],
        how_to_apply: [
          '모든 능력에 비용/제약',
          '약점이 플롯을 만든다',
          '만능 능력 피하기',
          '약점 극복이 성장'
        ]
      },
      {
        name: '샌더슨의 제3법칙',
        description: '새로운 능력 추가보다 기존 능력 확장',
        when_to_use: [
          '시리즈 진행 중',
          '파워 인플레이션 방지',
          '세계관 일관성 유지'
        ],
        how_to_apply: [
          '초반에 규칙 확립',
          '새 능력보다 기존 능력의 새 용도',
          '조합과 응용의 창의성',
          '독자가 예측 가능한 범위 유지'
        ]
      },
      {
        name: '아웃라이닝',
        description: '철저한 사전 플롯 설계',
        when_to_use: [
          '복잡한 플롯 관리',
          '시리즈 기획',
          '복선 관리'
        ],
        how_to_apply: [
          '결말부터 역산',
          '각 캐릭터의 아크 계획',
          '복선 스프레드시트',
          '장면별 목적 명확화'
        ]
      }
    ],
    writingPrinciples: [
      'MICE 쿼텐트 (Milieu, Idea, Character, Event)',
      '약속과 진행과 보상',
      '피라미드 구조 (거대한 이야기 안의 작은 이야기들)',
      'Yes, But / No, And 원칙'
    ],
    emotionApproach: '캐릭터의 성장과 선택에서 감정 도출, 시스템의 논리가 감정을 지탱',
    structureApproach: '철저한 아웃라인, 여러 겹의 플롯 구조, 만족스러운 해결',
    dialogueStyle: '캐릭터 음성 구분, 유머와 위트, 정보 전달과 캐릭터 개발 병행',
    promptGuidelines: `
## 브랜든 샌더슨 스타일 지침

### 샌더슨의 법칙 적용
**제1법칙**: 마법/능력으로 문제 해결 시, 그 능력의 규칙이 독자에게 알려져 있어야 함
**제2법칙**: 약점과 한계가 이야기를 만든다 - 제약이 창의성을 낳음
**제3법칙**: 새로운 것 추가보다 기존 것 깊이 파기

### 하드 매직 시스템 설계
1. 핵심 규칙 명시 (무엇을 할 수 있는가)
2. 비용/제약 설정 (무엇이 필요한가)
3. 약점 정의 (무엇을 할 수 없는가)
4. 한계 범위 (최대치는 어디까지인가)
5. 예외 최소화 (규칙은 일관되게)

### 플롯 구조
- Promise → Progress → Payoff
- 각 장면의 목적 명확화
- Try-Fail Cycle (시도와 실패의 반복)
- Yes, But / No, And (성공해도 문제, 실패해도 기회)

### 캐릭터 아크
- 결함에서 시작
- 거짓 믿음 (Lie) 설정
- 진실 (Truth) 향한 여정
- 선택의 순간에서 변화

### 피해야 할 것
- 설명 없는 능력으로 해결
- 제약 없는 파워업
- 규칙 모순
- 근거 없는 결말
`
  }
};

// ============================================
// 장르별 거장 조합 추천
// ============================================

export interface GenreStyleRecommendation {
  genre: string;
  primaryMaster: MasterStyle;
  secondaryMasters: MasterStyle[];
  rationale: string;
  blendTips: string[];
}

export const GENRE_RECOMMENDATIONS: GenreStyleRecommendation[] = [
  {
    genre: '심리 스릴러',
    primaryMaster: 'dostoevsky',
    secondaryMasters: ['king'],
    rationale: '깊은 심리 묘사 + 서스펜스 페이싱',
    blendTips: [
      '도스토예프스키의 내면 독백으로 긴장감 조성',
      '스티븐 킹의 페이싱으로 독자 몰입',
      '캐릭터의 내면 갈등이 외부 위협과 연결'
    ]
  },
  {
    genre: '판타지',
    primaryMaster: 'sanderson',
    secondaryMasters: ['rowling', 'tolstoy'],
    rationale: '체계적 마법 시스템 + 세계관 깊이 + 서사적 스케일',
    blendTips: [
      '샌더슨의 마법 법칙으로 시스템 설계',
      '롤링의 복선 기법으로 장기 플롯',
      '톨스토이의 사회 묘사로 세계 깊이'
    ]
  },
  {
    genre: '로맨스',
    primaryMaster: 'murakami',
    secondaryMasters: ['tolstoy'],
    rationale: '분위기와 감정의 섬세함 + 관계의 깊이',
    blendTips: [
      '무라카미의 감각적 묘사로 분위기',
      '톨스토이의 관계 변화 추적',
      '말하지 않는 것의 의미 강조'
    ]
  },
  {
    genre: '미스터리/추리',
    primaryMaster: 'rowling',
    secondaryMasters: ['king', 'dostoevsky'],
    rationale: '정교한 복선 + 페이싱 + 인물 심리',
    blendTips: [
      '롤링의 복선 시스템으로 단서 배치',
      '스티븐 킹의 페이지 터너 기법',
      '도스토예프스키의 범인 심리 묘사'
    ]
  },
  {
    genre: '문학 소설',
    primaryMaster: 'tolstoy',
    secondaryMasters: ['dostoevsky', 'murakami'],
    rationale: '깊은 주제의식 + 인간 탐구 + 문체',
    blendTips: [
      '톨스토이의 사회적 시야',
      '도스토예프스키의 실존적 질문',
      '무라카미의 문체적 세련됨'
    ]
  },
  {
    genre: '호러',
    primaryMaster: 'king',
    secondaryMasters: ['dostoevsky', 'murakami'],
    rationale: '서스펜스 + 심리적 공포 + 불안한 분위기',
    blendTips: [
      '스티븐 킹의 일상 속 공포',
      '도스토예프스키의 내면 공포',
      '무라카미의 초현실적 불안'
    ]
  }
];

// ============================================
// 프롬프트 생성 함수
// ============================================

/**
 * 선택한 거장 스타일의 프롬프트 가이드라인 생성
 */
export function generateMasterStylePrompt(
  style: MasterStyle,
  sceneType?: string,
  emotionalGoal?: string
): string {
  const master = MASTER_PROFILES[style];

  let prompt = `# ${master.koreanName} 스타일 창작 가이드\n\n`;
  prompt += `**전문 분야**: ${master.specialty}\n\n`;

  // 핵심 원칙
  prompt += `## 핵심 원칙\n`;
  master.writingPrinciples.forEach(p => {
    prompt += `- ${p}\n`;
  });
  prompt += '\n';

  // 감정 접근법
  prompt += `## 감정 표현 방식\n${master.emotionApproach}\n\n`;

  // 구조 접근법
  prompt += `## 서사 구조\n${master.structureApproach}\n\n`;

  // 대화 스타일
  prompt += `## 대화 스타일\n${master.dialogueStyle}\n\n`;

  // 상세 가이드라인
  prompt += master.promptGuidelines;

  // 씬 타입별 추가 가이드
  if (sceneType) {
    const relevantTechniques = master.keyTechniques.filter(t =>
      t.when_to_use.some(u => u.toLowerCase().includes(sceneType.toLowerCase()))
    );

    if (relevantTechniques.length > 0) {
      prompt += `\n## 이 장면 유형에 특히 적용할 기법\n`;
      relevantTechniques.forEach(t => {
        prompt += `\n### ${t.name}\n`;
        prompt += `${t.description}\n`;
        prompt += `**적용 방법:**\n`;
        t.how_to_apply.forEach(h => {
          prompt += `- ${h}\n`;
        });
      });
    }
  }

  // 감정 목표별 추가 가이드
  if (emotionalGoal) {
    prompt += `\n## 감정적 목표: ${emotionalGoal}\n`;
    prompt += `이 장면에서 독자가 "${emotionalGoal}"을(를) 느끼도록 ${master.koreanName} 스타일로 표현하세요.\n`;
  }

  return prompt;
}

/**
 * 여러 거장 스타일 블렌딩 프롬프트 생성
 */
export function generateBlendedStylePrompt(
  styles: { master: MasterStyle; weight: number }[],
  genre: string
): string {
  // 가중치로 정렬
  const sorted = [...styles].sort((a, b) => b.weight - a.weight);
  const primary = sorted[0];
  const secondaries = sorted.slice(1);

  let prompt = `# 창작 스타일 블렌드 가이드\n\n`;
  prompt += `**장르**: ${genre}\n`;
  prompt += `**주 스타일**: ${MASTER_PROFILES[primary.master].koreanName} (${primary.weight}%)\n`;

  if (secondaries.length > 0) {
    prompt += `**보조 스타일**: `;
    prompt += secondaries.map(s =>
      `${MASTER_PROFILES[s.master].koreanName} (${s.weight}%)`
    ).join(', ');
    prompt += '\n';
  }

  prompt += '\n---\n\n';

  // 주 스타일 상세
  prompt += `## 주 스타일: ${MASTER_PROFILES[primary.master].koreanName}\n`;
  prompt += MASTER_PROFILES[primary.master].promptGuidelines;

  // 보조 스타일에서 차용할 요소
  secondaries.forEach(s => {
    prompt += `\n## ${MASTER_PROFILES[s.master].koreanName}에서 차용할 요소\n`;

    // 가장 대표적인 기법 1-2개만
    const techniques = MASTER_PROFILES[s.master].keyTechniques.slice(0, 2);
    techniques.forEach(t => {
      prompt += `\n### ${t.name}\n`;
      prompt += `${t.description}\n`;
      prompt += `**적용 포인트:**\n`;
      t.how_to_apply.slice(0, 2).forEach(h => {
        prompt += `- ${h}\n`;
      });
    });
  });

  // 장르별 추천 확인
  const genreRec = GENRE_RECOMMENDATIONS.find(r =>
    genre.toLowerCase().includes(r.genre.toLowerCase())
  );

  if (genreRec) {
    prompt += `\n## ${genre} 장르 팁\n`;
    genreRec.blendTips.forEach(tip => {
      prompt += `- ${tip}\n`;
    });
  }

  return prompt;
}

/**
 * 특정 기법 프롬프트 생성
 */
export function generateTechniquePrompt(
  master: MasterStyle,
  techniqueName: string
): string | null {
  const profile = MASTER_PROFILES[master];
  const technique = profile.keyTechniques.find(t =>
    t.name.toLowerCase().includes(techniqueName.toLowerCase())
  );

  if (!technique) return null;

  let prompt = `# ${technique.name}\n`;
  prompt += `**출처**: ${profile.koreanName}\n\n`;
  prompt += `## 설명\n${technique.description}\n\n`;

  prompt += `## 언제 사용하는가\n`;
  technique.when_to_use.forEach(u => {
    prompt += `- ${u}\n`;
  });

  prompt += `\n## 적용 방법\n`;
  technique.how_to_apply.forEach(h => {
    prompt += `- ${h}\n`;
  });

  if (technique.example) {
    prompt += `\n## 예시\n${technique.example}\n`;
  }

  if (technique.avoid) {
    prompt += `\n## 피해야 할 것\n`;
    technique.avoid.forEach(a => {
      prompt += `- ${a}\n`;
    });
  }

  return prompt;
}

// ============================================
// 씬 타입별 추천 기법
// ============================================

export type SceneType =
  | 'action'      // 액션/전투
  | 'dialogue'    // 대화
  | 'romance'     // 로맨스
  | 'suspense'    // 서스펜스
  | 'revelation'  // 반전/폭로
  | 'emotional'   // 감정적 클라이맥스
  | 'worldbuild'  // 세계관 설명
  | 'internal'    // 내면 독백
  | 'transition'; // 전환 장면

export function getRecommendedTechniques(sceneType: SceneType): {
  master: MasterStyle;
  technique: MasterTechnique;
  reason: string;
}[] {
  const recommendations: Record<SceneType, { master: MasterStyle; techniqueIndex: number; reason: string }[]> = {
    action: [
      { master: 'king', techniqueIndex: 1, reason: '긴장감 있는 페이싱' },
      { master: 'sanderson', techniqueIndex: 0, reason: '능력 사용의 논리성' }
    ],
    dialogue: [
      { master: 'dostoevsky', techniqueIndex: 0, reason: '깊이 있는 철학적 대화' },
      { master: 'king', techniqueIndex: 3, reason: '자연스러운 캐릭터 음성' }
    ],
    romance: [
      { master: 'murakami', techniqueIndex: 0, reason: '분위기와 감각' },
      { master: 'tolstoy', techniqueIndex: 1, reason: '섬세한 감정 관찰' }
    ],
    suspense: [
      { master: 'king', techniqueIndex: 1, reason: '페이싱 조절' },
      { master: 'king', techniqueIndex: 2, reason: '복선과 암시' }
    ],
    revelation: [
      { master: 'rowling', techniqueIndex: 1, reason: '장기 복선 회수' },
      { master: 'dostoevsky', techniqueIndex: 1, reason: '심리적 충격' }
    ],
    emotional: [
      { master: 'dostoevsky', techniqueIndex: 1, reason: '의식의 흐름' },
      { master: 'murakami', techniqueIndex: 2, reason: '담담한 슬픔' }
    ],
    worldbuild: [
      { master: 'rowling', techniqueIndex: 0, reason: '계층적 세계관' },
      { master: 'sanderson', techniqueIndex: 0, reason: '체계적 시스템' }
    ],
    internal: [
      { master: 'dostoevsky', techniqueIndex: 1, reason: '의식의 흐름' },
      { master: 'murakami', techniqueIndex: 2, reason: '고독의 정서' }
    ],
    transition: [
      { master: 'tolstoy', techniqueIndex: 1, reason: '관찰적 묘사' },
      { master: 'murakami', techniqueIndex: 0, reason: '리듬과 여백' }
    ]
  };

  return recommendations[sceneType].map(rec => ({
    master: rec.master,
    technique: MASTER_PROFILES[rec.master].keyTechniques[rec.techniqueIndex],
    reason: rec.reason
  }));
}

export const literaryMasters = {
  MASTER_PROFILES,
  GENRE_RECOMMENDATIONS,
  generateMasterStylePrompt,
  generateBlendedStylePrompt,
  generateTechniquePrompt,
  getRecommendedTechniques,
};

export default literaryMasters;
