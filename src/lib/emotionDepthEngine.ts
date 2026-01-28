/**
 * 감정 깊이 강화 엔진 (EmotionDepthEngine)
 *
 * 상업 출판 수준의 감정 묘사를 위한 시스템
 * - "보여주기(Show)" 원칙 강제
 * - 감정의 물리적 표현 매핑
 * - 감정 곡선 관리
 * - 서브텍스트 생성
 * - 감정적 공명 패턴
 */

// ============================================
// 감정 타입 정의
// ============================================

export type PrimaryEmotion =
  | 'joy'        // 기쁨
  | 'sadness'    // 슬픔
  | 'anger'      // 분노
  | 'fear'       // 두려움
  | 'surprise'   // 놀람
  | 'disgust'    // 혐오
  | 'love'       // 사랑
  | 'trust'      // 신뢰
  | 'anticipation' // 기대
  | 'shame'      // 수치심
  | 'guilt'      // 죄책감
  | 'pride'      // 자부심
  | 'envy'       // 질투
  | 'loneliness' // 외로움
  | 'nostalgia'  // 향수
  | 'hope'       // 희망
  | 'despair'    // 절망
  | 'confusion'  // 혼란
  | 'relief'     // 안도
  | 'tension';   // 긴장

export interface EmotionState {
  primary: PrimaryEmotion;
  intensity: 1 | 2 | 3 | 4 | 5;  // 감정 강도
  secondary?: PrimaryEmotion;    // 복합 감정
  conflicting?: PrimaryEmotion;  // 갈등하는 감정
  suppressed?: boolean;          // 억압된 감정 여부
  building?: boolean;            // 고조되는 중인지
  fading?: boolean;              // 약해지는 중인지
}

// ============================================
// 감정의 물리적 표현 매핑
// ============================================

export interface PhysicalManifestation {
  bodyLanguage: string[];      // 몸짓
  facialExpression: string[];  // 표정
  voice: string[];             // 목소리 변화
  breathing: string[];         // 호흡
  physicalSensation: string[]; // 신체 감각
  involuntary: string[];       // 무의식적 반응
  micro: string[];             // 미세한 표현 (숙련된 관찰자만 알아챔)
}

export const EMOTION_PHYSICAL_MAP: Record<PrimaryEmotion, PhysicalManifestation> = {
  joy: {
    bodyLanguage: [
      '어깨가 펴졌다',
      '걸음이 가벼워졌다',
      '몸이 저절로 흔들렸다',
      '손이 활짝 펴졌다',
      '발끝이 들썩거렸다',
    ],
    facialExpression: [
      '입꼬리가 올라갔다',
      '눈가에 주름이 잡혔다',
      '눈이 반달처럼 휘어졌다',
      '볼이 발그레해졌다',
      '눈동자가 빛났다',
    ],
    voice: [
      '목소리가 한 톤 높아졌다',
      '말이 빨라졌다',
      '웃음이 섞인 말투',
      '톤이 밝아졌다',
    ],
    breathing: [
      '깊게 숨을 들이쉬었다',
      '후- 하고 숨을 내쉬었다',
      '가슴이 벅차올랐다',
    ],
    physicalSensation: [
      '가슴 안에서 뭔가 부풀어 오르는 느낌',
      '온몸에 에너지가 도는 것 같았다',
      '몸이 가벼워진 것 같았다',
    ],
    involuntary: [
      '웃음이 터져 나왔다',
      '눈물이 핑 돌았다 (기쁨의)',
      '손뼉을 쳤다',
    ],
    micro: [
      '홍채가 미세하게 확장되었다',
      '손끝이 미세하게 떨렸다',
      '목젖이 움직였다',
    ],
  },

  sadness: {
    bodyLanguage: [
      '어깨가 축 처졌다',
      '고개가 떨어졌다',
      '등이 굽어졌다',
      '손에서 힘이 빠졌다',
      '발걸음이 무거워졌다',
    ],
    facialExpression: [
      '입꼬리가 내려갔다',
      '눈가가 붉어졌다',
      '눈동자가 흐려졌다',
      '표정이 굳었다',
      '시선이 아래로 떨어졌다',
    ],
    voice: [
      '목소리가 가라앉았다',
      '말끝이 흐려졌다',
      '말이 느려졌다',
      '목이 잠겼다',
    ],
    breathing: [
      '깊은 한숨이 나왔다',
      '호흡이 무거워졌다',
      '숨이 막히는 것 같았다',
    ],
    physicalSensation: [
      '가슴에 무거운 돌이 얹힌 것 같았다',
      '목 안에 무언가 걸린 것 같았다',
      '온몸이 납덩이처럼 무거웠다',
      '뼛속까지 시린 것 같았다',
    ],
    involuntary: [
      '눈물이 볼을 타고 흘러내렸다',
      '코끝이 찡했다',
      '입술이 떨렸다',
    ],
    micro: [
      '동공이 미세하게 수축했다',
      '아랫입술이 미세하게 떨렸다',
      '눈가 근육이 경직되었다',
    ],
  },

  anger: {
    bodyLanguage: [
      '주먹을 불끈 쥐었다',
      '어깨가 잔뜩 굳었다',
      '턱에 힘이 들어갔다',
      '자세가 경직되었다',
      '앞으로 상체가 기울었다',
    ],
    facialExpression: [
      '미간에 주름이 잡혔다',
      '눈에 불꽃이 일었다',
      '콧구멍이 벌름거렸다',
      '입술이 일자로 굳었다',
      '턱선이 날카로워졌다',
    ],
    voice: [
      '목소리가 낮아졌다',
      '말투가 딱딱해졌다',
      '이를 악물고 말했다',
      '성량이 커졌다',
      '차갑게 내뱉었다',
    ],
    breathing: [
      '숨이 거칠어졌다',
      '콧김을 내쉬었다',
      '호흡이 가빠졌다',
    ],
    physicalSensation: [
      '머리끝까지 열이 올랐다',
      '핏줄이 불끈 섰다',
      '가슴이 부글부글 끓어올랐다',
      '관자놀이가 욱신거렸다',
    ],
    involuntary: [
      '얼굴이 붉으락푸르락했다',
      '눈이 충혈되었다',
      '손이 벌벌 떨렸다',
    ],
    micro: [
      '목의 핏줄이 튀어나왔다',
      '안면 근육이 미세하게 경련했다',
      '눈꺼풀이 가늘어졌다',
    ],
  },

  fear: {
    bodyLanguage: [
      '몸이 움츠러들었다',
      '한 발 뒤로 물러섰다',
      '손이 방어적으로 올라왔다',
      '몸이 경직되었다',
      '고개가 움찔 돌아갔다',
    ],
    facialExpression: [
      '눈이 커졌다',
      '얼굴에서 핏기가 빠졌다',
      '입이 반쯤 벌어졌다',
      '눈동자가 흔들렸다',
      '눈썹이 치켜 올라갔다',
    ],
    voice: [
      '목소리가 떨렸다',
      '말이 끊겼다',
      '소리가 새어나오지 않았다',
      '속삭이듯 말했다',
    ],
    breathing: [
      '숨이 멎는 것 같았다',
      '호흡이 얕아졌다',
      '헐떡거렸다',
      '숨을 죽였다',
    ],
    physicalSensation: [
      '등골이 서늘해졌다',
      '심장이 미친 듯이 뛰었다',
      '손바닥에 땀이 배었다',
      '무릎에 힘이 풀렸다',
      '온몸에 소름이 돋았다',
    ],
    involuntary: [
      '얼굴이 창백해졌다',
      '입술이 파랗게 질렸다',
      '몸이 부들부들 떨렸다',
    ],
    micro: [
      '동공이 확대되었다',
      '눈꺼풀이 빠르게 깜빡였다',
      '미세하게 뒤로 기울었다',
    ],
  },

  surprise: {
    bodyLanguage: [
      '몸이 움찔했다',
      '뒤로 물러섰다',
      '손이 가슴으로 갔다',
      '동작이 멈췄다',
    ],
    facialExpression: [
      '눈이 휘둥그레졌다',
      '입이 벌어졌다',
      '눈썹이 치켜올라갔다',
      '표정이 굳었다',
    ],
    voice: [
      '"어?" 하는 소리가 나왔다',
      '말문이 막혔다',
      '목소리가 높아졌다',
    ],
    breathing: [
      '숨이 멎었다',
      '급하게 숨을 들이켰다',
      '헉, 하고 숨을 삼켰다',
    ],
    physicalSensation: [
      '머리가 하얘졌다',
      '시간이 멈춘 것 같았다',
      '심장이 한 박자 멈춘 것 같았다',
    ],
    involuntary: [
      '눈을 크게 떴다',
      '소리를 질렀다',
      '뒷걸음질 쳤다',
    ],
    micro: [
      '동공이 급격히 확장되었다',
      '눈썹 안쪽이 올라갔다',
    ],
  },

  disgust: {
    bodyLanguage: [
      '몸을 돌렸다',
      '한 발짝 물러났다',
      '고개를 저었다',
      '손으로 막았다',
    ],
    facialExpression: [
      '얼굴을 찡그렸다',
      '코가 찌푸려졌다',
      '입꼬리가 내려갔다',
      '윗입술이 올라갔다',
    ],
    voice: [
      '역겨움이 묻어났다',
      '툭 뱉듯 말했다',
      '콧방귀를 뀌었다',
    ],
    breathing: [
      '킁, 하고 콧숨을 내쉬었다',
      '숨을 참았다',
    ],
    physicalSensation: [
      '속이 울렁거렸다',
      '입안에 쓴 맛이 돌았다',
      '온몸에 거부감이 일었다',
    ],
    involuntary: [
      '얼굴을 돌렸다',
      '구역질이 올라왔다',
    ],
    micro: [
      '윗입술이 미세하게 올라갔다',
      '코 주름이 잡혔다',
    ],
  },

  love: {
    bodyLanguage: [
      '상대 쪽으로 기울었다',
      '무의식적으로 손이 뻗어나갔다',
      '거리가 좁혀졌다',
      '몸이 열린 자세가 되었다',
    ],
    facialExpression: [
      '눈가가 부드러워졌다',
      '온화한 미소가 번졌다',
      '눈동자에 빛이 담겼다',
      '표정이 풀어졌다',
    ],
    voice: [
      '목소리가 부드러워졌다',
      '낮게 속삭였다',
      '말투에 애정이 묻어났다',
    ],
    breathing: [
      '호흡이 깊어졌다',
      '가슴이 따뜻해졌다',
      '숨결이 고요해졌다',
    ],
    physicalSensation: [
      '가슴 안이 따스해졌다',
      '온몸이 나른해졌다',
      '마음이 충만해졌다',
      '심장이 포근하게 뛰었다',
    ],
    involuntary: [
      '얼굴이 붉어졌다',
      '미소가 번졌다',
      '손이 상대에게 닿았다',
    ],
    micro: [
      '동공이 확장되었다',
      '입술이 미세하게 열렸다',
      '눈꺼풀이 내려왔다',
    ],
  },

  trust: {
    bodyLanguage: [
      '긴장이 풀렸다',
      '어깨가 내려왔다',
      '상대를 향해 열린 자세',
      '고개를 끄덕였다',
    ],
    facialExpression: [
      '눈빛이 안정되었다',
      '부드러운 표정',
      '미소가 자연스러워졌다',
    ],
    voice: [
      '목소리가 안정되었다',
      '확신을 담아 말했다',
      '편안한 어조로',
    ],
    breathing: [
      '호흡이 고르게 되었다',
      '안도의 숨을 내쉬었다',
    ],
    physicalSensation: [
      '마음이 놓였다',
      '긴장이 녹아내렸다',
      '안정감이 퍼져나갔다',
    ],
    involuntary: [
      '경계가 풀렸다',
      '몸이 이완되었다',
    ],
    micro: [
      '눈가 근육이 이완되었다',
      '어깨 근육이 풀렸다',
    ],
  },

  anticipation: {
    bodyLanguage: [
      '몸이 앞으로 기울었다',
      '손이 바쁘게 움직였다',
      '발이 까딱거렸다',
      '안절부절못했다',
    ],
    facialExpression: [
      '눈이 빛났다',
      '입꼬리가 올라갔다',
      '눈썹이 들렸다',
      '시선이 집중되었다',
    ],
    voice: [
      '목소리가 들떴다',
      '말이 빨라졌다',
      '기대가 묻어났다',
    ],
    breathing: [
      '숨을 들이켰다',
      '호흡이 빨라졌다',
    ],
    physicalSensation: [
      '가슴이 두근거렸다',
      '온몸이 긴장되었다',
      '에너지가 흘렀다',
    ],
    involuntary: [
      '손이 떨렸다',
      '입술을 핥았다',
    ],
    micro: [
      '동공이 확대되었다',
      '손가락이 바삐 움직였다',
    ],
  },

  shame: {
    bodyLanguage: [
      '고개를 숙였다',
      '몸을 웅크렸다',
      '눈을 피했다',
      '한쪽으로 몸을 돌렸다',
    ],
    facialExpression: [
      '얼굴이 붉어졌다',
      '시선이 바닥으로 떨어졌다',
      '눈을 내리깔았다',
      '입술을 깨물었다',
    ],
    voice: [
      '목소리가 작아졌다',
      '중얼거렸다',
      '말끝이 흐려졌다',
    ],
    breathing: [
      '숨을 삼켰다',
      '가슴이 답답해졌다',
    ],
    physicalSensation: [
      '얼굴이 화끈거렸다',
      '몸을 숨기고 싶었다',
      '땅이 꺼졌으면 싶었다',
    ],
    involuntary: [
      '얼굴이 새빨개졌다',
      '귀까지 붉어졌다',
      '손으로 얼굴을 가렸다',
    ],
    micro: [
      '시선이 지속적으로 회피',
      '목이 붉어졌다',
    ],
  },

  guilt: {
    bodyLanguage: [
      '어깨가 움츠러들었다',
      '손을 비볐다',
      '눈을 마주치지 못했다',
      '안절부절못했다',
    ],
    facialExpression: [
      '표정이 어두워졌다',
      '눈가가 처졌다',
      '시선이 흔들렸다',
      '입술을 깨물었다',
    ],
    voice: [
      '목소리가 가라앉았다',
      '말을 더듬었다',
      '변명처럼 들렸다',
    ],
    breathing: [
      '무거운 한숨',
      '가슴이 눌린 것 같았다',
    ],
    physicalSensation: [
      '가슴이 무거웠다',
      '속이 뒤틀렸다',
      '마음이 찔렸다',
    ],
    involuntary: [
      '눈을 피했다',
      '손이 떨렸다',
    ],
    micro: [
      '시선이 자주 아래로 떨어졌다',
      '손가락이 무의식적으로 움직였다',
    ],
  },

  pride: {
    bodyLanguage: [
      '가슴을 폈다',
      '어깨가 올라갔다',
      '턱이 들렸다',
      '당당한 걸음',
    ],
    facialExpression: [
      '눈에 자신감이 넘쳤다',
      '입꼬리가 올라갔다',
      '표정이 밝아졌다',
    ],
    voice: [
      '목소리에 힘이 들어갔다',
      '또렷하게 말했다',
      '당당한 어조',
    ],
    breathing: [
      '깊게 숨을 들이쉬었다',
      '가슴이 부풀어 올랐다',
    ],
    physicalSensation: [
      '온몸에 자신감이 넘쳤다',
      '마음이 충만해졌다',
    ],
    involuntary: [
      '미소가 번졌다',
      '자세가 곧아졌다',
    ],
    micro: [
      '턱이 미세하게 들렸다',
      '눈썹이 살짝 올라갔다',
    ],
  },

  envy: {
    bodyLanguage: [
      '몸이 경직되었다',
      '팔짱을 꼈다',
      '시선이 쫓아갔다',
    ],
    facialExpression: [
      '표정이 굳었다',
      '눈이 가늘어졌다',
      '입술이 일자가 되었다',
    ],
    voice: [
      '말투가 딱딱해졌다',
      '비꼬는 듯한 어조',
      '차가워진 목소리',
    ],
    breathing: [
      '숨을 삼켰다',
      '깊이 숨을 내쉬었다',
    ],
    physicalSensation: [
      '가슴이 쓰렸다',
      '속이 쓰라렸다',
      '마음이 타들어갔다',
    ],
    involuntary: [
      '주먹을 쥐었다',
      '입술을 깨물었다',
    ],
    micro: [
      '눈꺼풀이 가늘어졌다',
      '입꼬리가 내려갔다',
    ],
  },

  loneliness: {
    bodyLanguage: [
      '몸이 웅크러들었다',
      '팔로 자신을 감쌌다',
      '창밖을 바라보았다',
      '구석에 기대어 섰다',
    ],
    facialExpression: [
      '눈빛이 멀어졌다',
      '표정이 공허해졌다',
      '시선이 먼 곳을 향했다',
    ],
    voice: [
      '목소리가 공허했다',
      '혼잣말이 늘었다',
      '말수가 줄었다',
    ],
    breathing: [
      '깊은 한숨',
      '호흡이 쓸쓸해졌다',
    ],
    physicalSensation: [
      '가슴에 구멍이 뚫린 것 같았다',
      '몸이 텅 빈 것 같았다',
      '온기가 사라진 것 같았다',
    ],
    involuntary: [
      '시선이 공허해졌다',
      '무의식적으로 뭔가를 만지작거렸다',
    ],
    micro: [
      '눈빛이 초점을 잃었다',
      '입꼬리가 내려갔다',
    ],
  },

  nostalgia: {
    bodyLanguage: [
      '먼 곳을 바라보았다',
      '동작이 느려졌다',
      '오래된 물건을 만졌다',
    ],
    facialExpression: [
      '눈가에 온기가 돌았다',
      '쓸쓸한 미소',
      '그리움이 서린 눈빛',
    ],
    voice: [
      '목소리가 부드러워졌다',
      '느린 말투',
      '그리움이 묻어났다',
    ],
    breathing: [
      '깊은 숨을 내쉬었다',
      '가슴이 먹먹해졌다',
    ],
    physicalSensation: [
      '가슴이 저렸다',
      '마음이 아련해졌다',
      '과거의 온기가 스며드는 것 같았다',
    ],
    involuntary: [
      '눈시울이 붉어졌다',
      '미소가 스쳤다',
    ],
    micro: [
      '시선이 과거를 향했다',
      '입꼬리가 미세하게 떨렸다',
    ],
  },

  hope: {
    bodyLanguage: [
      '고개가 들렸다',
      '어깨가 펴졌다',
      '앞을 바라보았다',
    ],
    facialExpression: [
      '눈이 빛났다',
      '입꼬리가 올라갔다',
      '표정이 밝아졌다',
    ],
    voice: [
      '목소리에 힘이 들어갔다',
      '말투가 밝아졌다',
    ],
    breathing: [
      '깊게 숨을 들이쉬었다',
      '가슴이 트이는 것 같았다',
    ],
    physicalSensation: [
      '가슴에 빛이 스며드는 것 같았다',
      '몸이 가벼워졌다',
      '에너지가 솟았다',
    ],
    involuntary: [
      '미소가 번졌다',
      '눈이 빛났다',
    ],
    micro: [
      '동공이 확대되었다',
      '표정이 이완되었다',
    ],
  },

  despair: {
    bodyLanguage: [
      '무릎이 꺾였다',
      '벽에 기대어 쓰러졌다',
      '머리를 감싸 쥐었다',
      '몸이 주저앉았다',
    ],
    facialExpression: [
      '눈에서 생기가 빠져나갔다',
      '표정이 무너졌다',
      '눈빛이 죽었다',
      '입이 반쯤 벌어졌다',
    ],
    voice: [
      '목소리가 끊겼다',
      '신음이 새어나왔다',
      '말을 잃었다',
    ],
    breathing: [
      '숨이 막혔다',
      '호흡이 끊겼다',
      '헐떡거렸다',
    ],
    physicalSensation: [
      '온몸에서 힘이 빠져나갔다',
      '심장이 얼어붙는 것 같았다',
      '머리가 하얘졌다',
      '세상이 무너지는 것 같았다',
    ],
    involuntary: [
      '눈물이 쏟아졌다',
      '몸이 떨렸다',
      '주저앉았다',
    ],
    micro: [
      '동공이 수축했다',
      '모든 근육이 이완되었다',
    ],
  },

  confusion: {
    bodyLanguage: [
      '머리를 긁적였다',
      '이리저리 두리번거렸다',
      '손동작이 어수선해졌다',
    ],
    facialExpression: [
      '미간에 주름이 잡혔다',
      '눈이 왔다 갔다 했다',
      '고개를 갸웃거렸다',
    ],
    voice: [
      '목소리가 불안정했다',
      '말이 끊겼다',
      '물음표가 달렸다',
    ],
    breathing: [
      '숨이 고르지 않았다',
      '깊이 숨을 쉬었다',
    ],
    physicalSensation: [
      '머릿속이 복잡해졌다',
      '생각이 정리되지 않았다',
      '어지러웠다',
    ],
    involuntary: [
      '눈을 깜빡거렸다',
      '고개를 저었다',
    ],
    micro: [
      '시선이 흔들렸다',
      '눈썹이 움직였다',
    ],
  },

  relief: {
    bodyLanguage: [
      '어깨가 축 내려왔다',
      '몸의 긴장이 풀렸다',
      '뒤로 기대었다',
      '손이 풀렸다',
    ],
    facialExpression: [
      '표정이 풀렸다',
      '눈을 감았다',
      '미소가 번졌다',
    ],
    voice: [
      '휴, 하고 숨을 내쉬었다',
      '목소리가 부드러워졌다',
    ],
    breathing: [
      '깊게 숨을 내쉬었다',
      '안도의 한숨',
      '호흡이 고요해졌다',
    ],
    physicalSensation: [
      '몸 전체의 긴장이 녹아내렸다',
      '심장이 진정되었다',
      '몸이 가벼워졌다',
    ],
    involuntary: [
      '눈물이 핑 돌았다',
      '웃음이 터졌다',
    ],
    micro: [
      '모든 근육이 이완되었다',
      '호흡이 깊어졌다',
    ],
  },

  tension: {
    bodyLanguage: [
      '몸이 굳었다',
      '손에 힘이 들어갔다',
      '어깨가 올라갔다',
      '정지했다',
    ],
    facialExpression: [
      '표정이 굳었다',
      '눈이 날카로워졌다',
      '입을 꾹 다물었다',
    ],
    voice: [
      '목소리가 낮아졌다',
      '말이 짧아졌다',
      '긴장이 묻어났다',
    ],
    breathing: [
      '숨을 죽였다',
      '호흡이 얕아졌다',
    ],
    physicalSensation: [
      '온몸이 팽팽해졌다',
      '모든 감각이 날카로워졌다',
      '심장이 빨리 뛰었다',
    ],
    involuntary: [
      '땀이 배었다',
      '침을 삼켰다',
    ],
    micro: [
      '동공이 확대되었다',
      '근육이 미세하게 떨렸다',
    ],
  },
};

// ============================================
// 감정 깊이 엔진 클래스
// ============================================

export class EmotionDepthEngine {
  private characterEmotionHistory: Map<string, EmotionState[]> = new Map();
  private sceneEmotionCurve: EmotionState[] = [];

  /**
   * 감정 표현 프롬프트 지침 생성
   */
  generateEmotionGuidelines(emotion: EmotionState, characterId?: string): string {
    const physical = EMOTION_PHYSICAL_MAP[emotion.primary];
    const intensity = emotion.intensity;

    // 강도에 따른 표현 선택
    const expressions = this.selectExpressionsByIntensity(physical, intensity);

    let guidelines = `
## 🎭 감정 표현 지침

### 핵심 원칙: "말하지 말고 보여주세요" (Show, Don't Tell)

❌ 금지: "${this.getEmotionKorean(emotion.primary)}했다", "${this.getEmotionKorean(emotion.primary)}을 느꼈다"
✅ 권장: 아래의 물리적 표현을 통해 감정을 전달하세요

### 현재 감정: ${this.getEmotionKorean(emotion.primary)} (강도: ${'★'.repeat(intensity)}${'☆'.repeat(5 - intensity)})
${emotion.secondary ? `복합 감정: ${this.getEmotionKorean(emotion.secondary)}` : ''}
${emotion.conflicting ? `내면의 갈등: ${this.getEmotionKorean(emotion.conflicting)}과 충돌` : ''}
${emotion.suppressed ? '⚠️ 억압된 감정 - 표면에는 드러나지 않지만 미세한 표현으로 암시' : ''}
${emotion.building ? '📈 고조되는 감정 - 점점 강해지는 표현 사용' : ''}
${emotion.fading ? '📉 약해지는 감정 - 점점 약해지는 표현 사용' : ''}

### 물리적 표현 (이 중에서 2-3개를 자연스럽게 녹이세요)

**몸짓:**
${expressions.bodyLanguage.map(e => `- ${e}`).join('\n')}

**표정:**
${expressions.facialExpression.map(e => `- ${e}`).join('\n')}

**목소리:**
${expressions.voice.map(e => `- ${e}`).join('\n')}

**호흡:**
${expressions.breathing.map(e => `- ${e}`).join('\n')}

**신체 감각 (내면 묘사):**
${expressions.physicalSensation.map(e => `- ${e}`).join('\n')}

${intensity >= 4 ? `
**무의식적 반응 (강렬한 감정):**
${expressions.involuntary.map(e => `- ${e}`).join('\n')}
` : ''}

${emotion.suppressed ? `
**미세한 표현 (억압된 감정의 누출):**
${expressions.micro.map(e => `- ${e}`).join('\n')}
` : ''}

### 감정 전달 기법

1. **레이어링**: 표면 감정 아래 숨겨진 감정을 암시
   - 예: 웃으면서도 손을 꽉 쥐고 있다 (표면: 평온, 내면: 긴장)

2. **대비**: 환경과 감정의 대비
   - 예: 화창한 날씨에 무거운 발걸음

3. **전이**: 감정을 사물/환경에 투영
   - 예: 창밖의 비가 그의 마음처럼 거세게 내리쳤다

4. **지연**: 감정의 지연된 반응
   - 예: 그녀가 떠나고 한참이 지나서야 눈물이 흘렀다

5. **서브텍스트**: 말과 행동 사이의 불일치
   - 예: "괜찮아"라고 말하면서 시선을 피했다
`;

    return guidelines;
  }

  /**
   * 감정 곡선 관리 - 씬 전체의 감정 흐름 설계
   */
  generateEmotionCurve(
    startEmotion: EmotionState,
    endEmotion: EmotionState,
    keyMoments: { position: number; emotion: EmotionState }[]
  ): string {
    let curveDescription = `
## 📊 씬 감정 곡선

**시작**: ${this.getEmotionKorean(startEmotion.primary)} (강도 ${startEmotion.intensity})
**종료**: ${this.getEmotionKorean(endEmotion.primary)} (강도 ${endEmotion.intensity})

### 감정 변화 포인트
`;

    // 정렬된 키 모먼트
    const sorted = [...keyMoments].sort((a, b) => a.position - b.position);

    for (const moment of sorted) {
      curveDescription += `- **${moment.position}%**: ${this.getEmotionKorean(moment.emotion.primary)} (강도 ${moment.emotion.intensity})\n`;
    }

    curveDescription += `
### 감정 전환 가이드

`;

    // 각 전환 구간에 대한 가이드
    let prevEmotion = startEmotion;
    let prevPosition = 0;

    for (const moment of sorted) {
      curveDescription += this.generateTransitionGuide(prevEmotion, moment.emotion, prevPosition, moment.position);
      prevEmotion = moment.emotion;
      prevPosition = moment.position;
    }

    curveDescription += this.generateTransitionGuide(prevEmotion, endEmotion, prevPosition, 100);

    return curveDescription;
  }

  /**
   * 캐릭터별 감정 히스토리 추적
   */
  trackCharacterEmotion(characterId: string, emotion: EmotionState): void {
    if (!this.characterEmotionHistory.has(characterId)) {
      this.characterEmotionHistory.set(characterId, []);
    }

    const history = this.characterEmotionHistory.get(characterId)!;
    history.push(emotion);

    // 최근 10개만 유지
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * 캐릭터의 감정 일관성 검증
   */
  validateEmotionalConsistency(characterId: string, newEmotion: EmotionState): {
    valid: boolean;
    warning?: string;
    suggestion?: string;
  } {
    const history = this.characterEmotionHistory.get(characterId);

    if (!history || history.length === 0) {
      return { valid: true };
    }

    const lastEmotion = history[history.length - 1];

    // 급격한 감정 변화 체크
    const emotionDistance = this.calculateEmotionDistance(lastEmotion.primary, newEmotion.primary);
    const intensityJump = Math.abs(lastEmotion.intensity - newEmotion.intensity);

    if (emotionDistance > 3 && intensityJump > 2) {
      return {
        valid: false,
        warning: `급격한 감정 변화 감지: ${this.getEmotionKorean(lastEmotion.primary)}에서 ${this.getEmotionKorean(newEmotion.primary)}로의 전환이 부자연스러울 수 있습니다.`,
        suggestion: '중간 감정 단계를 넣거나, 급격한 변화의 트리거(사건)를 명확히 보여주세요.',
      };
    }

    return { valid: true };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private selectExpressionsByIntensity(physical: PhysicalManifestation, intensity: number): PhysicalManifestation {
    // 강도에 따라 표현 개수 조절
    const count = Math.min(intensity + 1, 3);

    return {
      bodyLanguage: physical.bodyLanguage.slice(0, count),
      facialExpression: physical.facialExpression.slice(0, count),
      voice: physical.voice.slice(0, count),
      breathing: physical.breathing.slice(0, Math.ceil(count / 2)),
      physicalSensation: physical.physicalSensation.slice(0, count),
      involuntary: intensity >= 4 ? physical.involuntary.slice(0, 2) : [],
      micro: physical.micro.slice(0, 2),
    };
  }

  private getEmotionKorean(emotion: PrimaryEmotion): string {
    const map: Record<PrimaryEmotion, string> = {
      joy: '기쁨',
      sadness: '슬픔',
      anger: '분노',
      fear: '두려움',
      surprise: '놀람',
      disgust: '혐오',
      love: '사랑',
      trust: '신뢰',
      anticipation: '기대',
      shame: '수치심',
      guilt: '죄책감',
      pride: '자부심',
      envy: '질투',
      loneliness: '외로움',
      nostalgia: '향수',
      hope: '희망',
      despair: '절망',
      confusion: '혼란',
      relief: '안도',
      tension: '긴장',
    };
    return map[emotion];
  }

  private generateTransitionGuide(
    from: EmotionState,
    to: EmotionState,
    fromPos: number,
    toPos: number
  ): string {
    const fromKorean = this.getEmotionKorean(from.primary);
    const toKorean = this.getEmotionKorean(to.primary);

    return `**${fromPos}% → ${toPos}%**: ${fromKorean} → ${toKorean}
  - 변화 트리거를 명확히 제시하세요
  - 점진적 변화: 먼저 신체 반응, 그 다음 행동, 마지막으로 내면 인식
  - 독자가 변화를 자연스럽게 따라올 수 있도록

`;
  }

  private calculateEmotionDistance(e1: PrimaryEmotion, e2: PrimaryEmotion): number {
    // 간단한 감정 거리 계산 (실제로는 더 정교한 모델 필요)
    const emotionWheel: PrimaryEmotion[] = [
      'joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation',
    ];

    const idx1 = emotionWheel.indexOf(e1);
    const idx2 = emotionWheel.indexOf(e2);

    if (idx1 === -1 || idx2 === -1) return 2; // 기본값

    const diff = Math.abs(idx1 - idx2);
    return Math.min(diff, emotionWheel.length - diff);
  }
}

export default EmotionDepthEngine;
