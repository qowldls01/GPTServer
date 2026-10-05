
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =====================================================
// 이전에 출제된 문제 저장
// 서버를 재시작하면 초기화됨
// =====================================================

const previousQuestions = {};

// =====================================================
// 1. 출제 범위
// =====================================================



function getSubjectInstruction() {
    return `
당신은 중학교 정보 교과를 가르치는 교사입니다.

[출제 대상]
중학교 1~3학년 학생

모든 문제는 중학교 정보 교과 수준으로 출제하세요.
고등학교 심화 또는 대학교 전공 수준은 금지합니다.

[출제 영역]

1. 정보와 자료
- 자료와 정보의 차이
- 디지털 자료의 표현
- 정보의 수집, 처리, 활용

2. 컴퓨터 시스템
- 하드웨어와 소프트웨어
- CPU, 메모리, 저장장치
- 입력장치와 출력장치
- 운영체제의 기본 역할

3. 알고리즘
- 알고리즘의 개념과 조건
- 순차, 선택, 반복 구조
- 순서도
- 순차 탐색과 이진 탐색
- 간단한 정렬 과정

4. 프로그래밍
- 변수와 자료형
- 산술 및 비교 연산자
- 조건문과 반복문
- 간단한 프로그램의 실행 결과

5. 네트워크 및 ICT
- 인터넷의 기본 원리
- 유무선 네트워크
- IP 주소의 기본 역할
- 사물인터넷(IoT)
- 클라우드 서비스

6. 인공지능
- 인공지능의 기본 개념
- 인공지능 활용 사례
- 학습 데이터의 중요성
- 인공지능의 한계

7. 정보 보안 및 윤리
- 개인정보 보호
- 저작권
- 악성코드와 피싱
- 디지털 시민성

[문제 구성]

10문제에서 다음 영역을 각각 최소 1문제 포함하세요.

- 컴퓨터 시스템
- 알고리즘
- 프로그래밍
- 네트워크 및 ICT
- 인공지능

나머지 문제는 다른 영역에서 골고루 선정하세요.
동일한 영역에서는 최대 2문제만 출제하세요.

[출제 제한]

다음 내용은 출제하지 마세요.

- C언어 포인터
- 세마포어와 프로세스 동기화
- 운영체제 스케줄링 알고리즘
- 자료구조의 복잡한 구현
- 빅오 표기법을 이용한 시간 복잡도 계산
- TCP와 UDP의 세부 동작
- 데이터베이스 정규화
- 복잡한 인공지능 수학

'컴퓨터의 두뇌는 무엇인가?'처럼
너무 단순한 암기 문제만 반복하지 마세요.

중학생이 학교 수업에서 배운 개념을
이해하고 간단하게 적용할 수 있는 문제를 출제하세요.
`;
}




function getEmotionInstruction(emotion) {

    if (emotion === "angry") {
        return `
현재 감정: 화남

중학교 정보 교과의 게임형 문제를 출제하세요.

짧은 질문과 선택지를 사용하세요.
복잡한 계산이나 긴 코드는 피하세요.
빠르게 읽고 답할 수 있도록 구성하세요.
`;
    }

    if (emotion === "sad") {
        return `
현재 감정: 슬픔

중학교 정보 교과의 쉬운 문제를 출제하세요.

핵심 개념을 확인하는 문제를 중심으로 구성하세요.
문장을 간결하고 친절하게 작성하세요.
학습 부담을 줄이되 지나친 상식 문제는 피하세요.
`;
    }

    if (emotion === "good") {
        return `
현재 감정: 좋음

중학교 정보 교과의 심화 문제를 출제하세요.

단순 암기보다 개념을 활용하는 문제를 포함하세요.
간단한 코드 분석이나 알고리즘 실행 과정을 활용하세요.

고등학교 또는 대학교 전공 수준으로
어렵게 만들지 마세요.
`;
    }

    return `
현재 감정: 보통

선택된 난이도에 맞춰
중학교 정보 교과 문제를 균형 있게 출제하세요.
`;
}




function getDifficultyInstruction(difficulty) {

    if (difficulty === "easy") {
        return `
난이도: 쉬움

중학교 정보 교과의 기초 수준입니다.

- 핵심 개념을 확인하세요.
- 질문과 선택지를 짧게 작성하세요.
- 한 가지 개념만 이해하면 풀 수 있도록 하세요.
- 복잡한 계산이나 코드 분석은 피하세요.

너무 쉬운 생활 상식 문제는 피하세요.
`;
    }

    if (difficulty === "hard") {
        return `
난이도: 심화

중학교 정보 교과의 심화 수준입니다.

고등학교 또는 대학교 전공 지식은
절대 요구하지 마세요.

다음 유형을 활용하세요.

- 짧은 반복문 실행 결과
- 조건문에 따른 출력 결과
- 간단한 순서도 분석
- 순차 탐색과 이진 탐색의 비교
- 정렬 과정에서 숫자의 순서 변화
- 컴퓨터 시스템의 구성 요소 비교
- 생활 속 정보 기술 활용 상황 판단

중학생이 배운 개념을 활용하여
1~2단계의 사고로 풀 수 있도록 출제하세요.

복잡한 코드나 어려운 전문 용어는 피하세요.
`;
    }

    return `
난이도: 기본

중학교 정보 교과의 일반적인 수준입니다.

- 기본 개념 이해 문제
- 간단한 응용 문제
- 쉬운 상황 판단 문제

위 유형을 골고루 활용하세요.

너무 쉬운 상식 문제와
고등학교 이상의 전문 문제는 피하세요.
`;
}



function getAdaptiveInstruction(adaptiveLevel) {

    if (adaptiveLevel === "easier") {
        return `
이전 학습 성취도 보정: 조금 쉽게

이전 학습에서 정답률이 낮았습니다.

현재 감정과 선택된 기본 난이도를 유지하면서
문제의 난이도를 조금 낮추세요.

- 핵심 개념을 직접적으로 묻는 문제를 늘리세요.
- 여러 단계의 추론이 필요한 문제를 줄이세요.
- 선택지를 명확하게 작성하세요.
- 단순 생활 상식 문제로 바꾸지는 마세요.

문제 유형과 O/X 문제 위치는 변경하지 마세요.
`;
    }

    if (adaptiveLevel === "harder") {
        return `
이전 학습 성취도 보정: 조금 어렵게

이전 학습에서 높은 정답률을 기록했습니다.

현재 감정과 선택된 기본 난이도를 유지하면서
문제의 난이도를 조금 높이세요.

- 단순 암기 문제의 비중을 줄이세요.
- 코드 분석 문제를 활용하세요.
- 개념 비교 문제를 활용하세요.
- 상황 판단 문제를 활용하세요.
- 응용 문제의 비중을 높이세요.

문제 유형과 O/X 문제 위치는 변경하지 마세요.
`;
    }

    return `
이전 학습 성취도 보정: 유지

추가적인 난이도 보정 없이
현재 감정과 선택된 난이도에 맞춰 출제하세요.

문제 유형과 O/X 문제 위치는 변경하지 마세요.
`;
}

// =====================================================
// 5. 문제 유형 규칙
// 기존 Unity 설정 유지
// =====================================================

function getQuestionTypeRules(emotion, difficulty) {

    // 화남: 전부 객관식
    if (emotion === "angry") {
        return `
문제 유형:

1번: multiple
2번: multiple
3번: multiple
4번: multiple
5번: multiple
6번: multiple
7번: multiple
8번: multiple
9번: multiple
10번: multiple

O/X 문제를 만들지 마세요.
`;
    }

    // 좋음: 짝수 번호 O/X
    if (emotion === "good") {
        return `
문제 유형:

1번: multiple
2번: ox
3번: multiple
4번: ox
5번: multiple
6번: ox
7번: multiple
8번: ox
9번: multiple
10번: ox
`;
    }

    // 슬픔: 2번 O/X
    if (emotion === "sad") {
        return `
문제 유형:

1번: multiple
2번: ox
3번: multiple
4번: multiple
5번: multiple
6번: multiple
7번: multiple
8번: multiple
9번: multiple
10번: multiple
`;
    }

    // 보통 + 기본: 6번 O/X
    if (
        emotion === "normal" &&
        difficulty === "basic"
    ) {
        return `
문제 유형:

1번: multiple
2번: multiple
3번: multiple
4번: multiple
5번: multiple
6번: ox
7번: multiple
8번: multiple
9번: multiple
10번: multiple
`;
    }

    // 보통 + 심화: 2번 O/X
    if (
        emotion === "normal" &&
        difficulty === "hard"
    ) {
        return `
문제 유형:

1번: multiple
2번: ox
3번: multiple
4번: multiple
5번: multiple
6번: multiple
7번: multiple
8번: multiple
9번: multiple
10번: multiple
`;
    }

    return `
모든 문제는 multiple 유형으로 작성하세요.
`;
}

// =====================================================
// 6. 문제 길이 제한
// =====================================================

function getLengthRules(emotion) {

    // =====================================================
    // 화남 - 빠르게 풀 수 있는 게임형 문제
    // =====================================================
    if (emotion === "angry") {

        return `
=====================================================
모바일 화면 문제 길이 제한
=====================================================

이 문제는 세로형 스마트폰의
작은 문제 표시 영역에 출력됩니다.

화면을 벗어나지 않도록
반드시 짧고 간결하게 작성하세요.

[문제]

- 문제는 반드시 35자 이내로 작성하세요.
- 최대 2줄 정도의 길이로 작성하세요.
- 불필요한 상황 설명은 넣지 마세요.
- 핵심 내용만 바로 질문하세요.

[프로그래밍 문제]

- 가능하면 긴 코드를 사용하지 마세요.
- 코드가 필요한 경우 최대 2줄까지만 사용하세요.
- 중첩된 조건문은 사용하지 마세요.
- 긴 반복문은 사용하지 마세요.
- 여러 줄의 프로그램 전체를 제시하지 마세요.

좋은 예:

x = 4
print(x + 2)

나쁜 예:

x = 4
if x > 3:
    print(x + 2)
else:
    print(x - 2)

[선택지]

- 각 선택지는 10자 이내로 작성하세요.
- 숫자로 답할 수 있다면 숫자만 작성하세요.
- 불필요하게 긴 문장을 사용하지 마세요.

[해설]

- 해설은 60자 이내로 작성하세요.
- 핵심 이유만 간단하게 설명하세요.

중요:

문제의 난이도를 높이기 위해
문장이나 코드를 길게 만들지 마세요.
`;
    }


    // =====================================================
    // 나머지 감정
    // =====================================================
    return `
=====================================================
모바일 화면 문제 길이 제한
=====================================================

모든 문제는 세로형 스마트폰의
제한된 문제 표시 영역에 출력됩니다.

따라서 문제를 짧고 간결하게 작성하는 것이
매우 중요합니다.

=====================================================
문제 길이
=====================================================

- 문제는 반드시 45자 이내로 작성하세요.
- 최대 3줄 정도의 길이로 작성하세요.
- 불필요한 배경 설명은 넣지 마세요.
- 긴 상황 설명은 사용하지 마세요.
- 같은 내용을 반복해서 설명하지 마세요.
- 가능한 경우 한 문장으로 질문하세요.

문제의 핵심 개념만 제시하세요.

=====================================================
프로그래밍 문제
=====================================================

프로그래밍 문제 역시
화면을 벗어나지 않도록 매우 짧게 작성하세요.

- 코드는 최대 2줄까지만 사용하세요.
- 한 줄에 하나의 간단한 명령만 사용하세요.
- 긴 프로그램 전체를 제시하지 마세요.
- 중첩된 조건문은 사용하지 마세요.
- 중첩된 반복문은 사용하지 마세요.
- 여러 조건을 동시에 판단하는 긴 코드는 피하세요.
- 코드 없이 개념을 물을 수 있다면 코드를 사용하지 마세요.

좋은 예:

x = 4
print(x + 2)

좋은 예:

for i in range(3):
    print(i)

나쁜 예:

x = 4
if x > 3:
    print(x + 2)
else:
    print(x - 2)

=====================================================
선택지
=====================================================

- 각 선택지는 반드시 15자 이내로 작성하세요.
- 가능한 한 짧은 단어나 숫자를 사용하세요.
- 세 선택지의 길이를 비슷하게 작성하세요.
- 정답만 지나치게 길게 작성하지 마세요.

=====================================================
해설
=====================================================

- 해설은 100자 이내로 작성하세요.
- 최대 2문장으로 작성하세요.
- 정답의 이유만 간결하게 설명하세요.

=====================================================
가장 중요한 규칙
=====================================================

문제의 난이도를 높이기 위해
문제 문장이나 코드를 길게 만들지 마세요.

난이도는 글의 길이가 아니라
학생이 개념을 이해하고 생각해야 하는 정도로
조절하세요.

모든 문제는 스마트폰 화면에서
한눈에 읽을 수 있는 길이로 작성하세요.
`;
}

// =====================================================
// 7. 이전 문제 중복 방지
// =====================================================

function getPreviousQuestionInstruction(
    emotion,
    difficulty
) {

    const key = emotion + "_" + difficulty;

    const oldQuestions = previousQuestions[key] || [];

    if (oldQuestions.length === 0) {
        return `
새로운 문제 10개를 만들어 주세요.

동일한 개념이나 질문을 반복하지 마세요.
여러 전공 영역을 골고루 활용하세요.
`;
    }

    const questionList = oldQuestions
        .map(
            (question, index) =>
                `${index + 1}. ${question}`
        )
        .join("\n");

    return `
이전에 출제된 문제:

${questionList}

위 문제와 동일하거나 매우 유사한 문제를 피하세요.

단순히 단어만 바꾼 문제도 피하세요.

이전과 다른 개념, 상황, 코드,
알고리즘 또는 자료구조를 활용하세요.
`;
}

// =====================================================
// 8. 생성 결과 검사
// =====================================================

function validateQuestions(questions, emotion, difficulty) {

    if (!Array.isArray(questions)) {
        throw new Error("questions 배열이 없습니다.");
    }

    if (questions.length !== 10) {
        throw new Error("문제 개수가 10개가 아닙니다.");
    }

    const rules = getExpectedTypes(emotion, difficulty);

    questions.forEach((question, index) => {

        const fields = [
            "type",
            "question",
            "correctAnswer",
            "wrongAnswer1",
            "wrongAnswer2",
            "explanation"
        ];

        for (const field of fields) {
            if (typeof question[field] !== "string") {
                throw new Error(
                    `${index + 1}번 문제의 ${field} 형식이 잘못되었습니다.`
                );
            }
        }

        if (question.type !== rules[index]) {
            throw new Error(
                `${index + 1}번 문제 유형이 잘못되었습니다.`
            );
        }

        if (!question.question.trim()) {
            throw new Error(
                `${index + 1}번 문제 내용이 비어 있습니다.`
            );
        }

        if (!question.explanation.trim()) {
            throw new Error(
                `${index + 1}번 해설이 비어 있습니다.`
            );
        }

        if (question.type === "ox") {

            if (
                question.correctAnswer !== "O" &&
                question.correctAnswer !== "X"
            ) {
                throw new Error(
                    `${index + 1}번 O/X 정답이 잘못되었습니다.`
                );
            }

            const opposite =
                question.correctAnswer === "O" ? "X" : "O";

            if (
                question.wrongAnswer1 !== opposite ||
                question.wrongAnswer2 !== ""
            ) {
                throw new Error(
                    `${index + 1}번 O/X 선택지가 잘못되었습니다.`
                );
            }

        } else {

            const answers = [
                question.correctAnswer.trim(),
                question.wrongAnswer1.trim(),
                question.wrongAnswer2.trim()
            ];

            if (
                answers.some(answer => answer.length === 0) ||
                new Set(answers).size !== 3
            ) {
                throw new Error(
                    `${index + 1}번 객관식 선택지가 비었거나 중복되었습니다.`
                );
            }
        }
    });
}

// =====================================================
// 9. 기대하는 문제 유형
// =====================================================

function getExpectedTypes(emotion, difficulty) {

    const types = Array(10).fill("multiple");

    if (emotion === "angry") {
        return types;
    }

    if (emotion === "good") {
        [1, 3, 5, 7, 9].forEach(
            index => types[index] = "ox"
        );

        return types;
    }

    if (emotion === "sad") {
        types[1] = "ox";
        return types;
    }

    if (emotion === "normal") {

        if (difficulty === "basic") {
            types[5] = "ox";
        }

        if (difficulty === "hard") {
            types[1] = "ox";
        }
    }

    return types;
}

// =====================================================
// 10. GPT 문제 생성
// =====================================================

async function generateQuestions(
    emotion,
    difficulty,
    adaptiveLevel = "normal"
) {

    const subjectInstruction =
        getSubjectInstruction();

    const emotionInstruction =
        getEmotionInstruction(emotion);

    const difficultyInstruction =
        getDifficultyInstruction(difficulty);

    const adaptiveInstruction =
        getAdaptiveInstruction(adaptiveLevel);

    const questionTypeRules =
        getQuestionTypeRules(emotion, difficulty);

    const lengthRules =
        getLengthRules(emotion);

    const previousQuestionInstruction =
        getPreviousQuestionInstruction(
            emotion,
            difficulty
        );

    const generationId =
        Date.now().toString() +
        "-" +
        Math.random().toString(36).substring(2, 8);

const prompt = `
당신은 중학교 정보 교과 문제를 출제하는 교사입니다.

이번 문제 세트 ID:
${generationId}

ID는 문제나 답에 출력하지 마세요.

${subjectInstruction}

${emotionInstruction}

${difficultyInstruction}

${adaptiveInstruction}

${questionTypeRules}

${lengthRules}

${previousQuestionInstruction}

=====================================================
전체 문제 구성 규칙
=====================================================

정확히 10개의 문제를 생성하세요.

모든 문제는 중학교 1~3학년 정보 교과 수준으로 출제하세요.

다음 영역에서 골고루 문제를 출제하세요.

1. 정보와 자료
2. 컴퓨터 시스템
3. 알고리즘
4. 프로그래밍
5. 네트워크 및 ICT
6. 인공지능
7. 정보 보안 및 윤리

특히 다음 영역은 각각 최소 1문제씩 포함하세요.

- 컴퓨터 시스템
- 알고리즘
- 프로그래밍
- 네트워크 및 ICT
- 인공지능

나머지 문제는 다른 영역에서 골고루 출제하세요.

같은 영역에서 지나치게 많은 문제를 출제하지 마세요.

=====================================================
난이도 규칙
=====================================================

중학교 정보 교과에서 배우는 개념만 활용하세요.

쉬움:
기본 개념을 이해했는지 확인하는 문제

기본:
개념 이해와 간단한 응용을 함께 평가하는 문제

심화:
배운 개념을 활용하여 1~2단계의 사고로
해결할 수 있는 문제

심화 난이도라도 고등학교나 대학교 수준의
전문 지식을 요구하지 마세요.

다음과 같은 문제를 적절히 활용하세요.

- 간단한 개념 비교
- 짧은 프로그램의 실행 결과
- 조건문과 반복문의 동작
- 순차 탐색과 이진 탐색
- 간단한 정렬 과정
- 컴퓨터 시스템의 구성 요소
- 생활 속 정보 기술 활용
- 인공지능의 기본 개념과 활용

다음 내용은 출제하지 마세요.

- C언어 포인터 연산
- 세마포어와 교착 상태
- 운영체제 스케줄링 알고리즘
- 복잡한 자료구조 구현
- 빅오 표기법을 이용한 시간 복잡도 계산
- 캐시 미스의 종류
- 데이터베이스 정규화
- 복잡한 네트워크 프로토콜 분석

=====================================================
선택지 품질 규칙
=====================================================

객관식 문제에는 정답 1개와 오답 2개를 작성하세요.

오답은 중학생이 실제로 혼동할 수 있는
그럴듯한 내용이어야 합니다.

정답이 지나치게 길거나 구체적이라는 이유로
쉽게 드러나지 않도록 하세요.

세 선택지의 길이와 표현 방식을
가능하면 비슷하게 맞추세요.

명백하게 엉뚱하거나 우스꽝스러운 오답은 금지합니다.

모든 객관식 문제에는 명확한 정답이
정확히 하나만 존재해야 합니다.

=====================================================
정확성 규칙
=====================================================

프로그래밍 문제는 중학교 수준의
간단한 코드만 사용하세요.

코드의 실행 결과는 명확해야 합니다.

알고리즘 문제는 필요한 조건을
질문에 명확하게 제시하세요.

문제를 생성한 후 정답과 해설이
일치하는지 스스로 검토하세요.

=====================================================
각 문제의 필수 필드
=====================================================

type
question
correctAnswer
wrongAnswer1
wrongAnswer2
explanation

=====================================================
객관식 문제 규칙
=====================================================

type은 "multiple"입니다.

correctAnswer에는 정답을 작성하세요.

wrongAnswer1과 wrongAnswer2에는
서로 다른 오답을 작성하세요.

세 선택지는 서로 중복되면 안 됩니다.

=====================================================
O/X 문제 규칙
=====================================================

type은 "ox"입니다.

correctAnswer에는 "O" 또는 "X"만 사용하세요.

wrongAnswer1에는 정답의 반대 값을 넣으세요.

wrongAnswer2는 반드시 빈 문자열 ""로 작성하세요.

O/X 문제의 위치는 앞에서 지정한
문제 유형 규칙을 정확하게 따르세요.

=====================================================
출력 형식
=====================================================

반드시 유효한 JSON 객체 하나만 출력하세요.

마크다운이나 코드 블록은 사용하지 마세요.

JSON 앞뒤에 설명 문장을 붙이지 마세요.

다음 형식을 사용하세요.

{
  "questions": [
    {
      "type": "multiple",
      "question": "문제 내용",
      "correctAnswer": "정답",
      "wrongAnswer1": "오답 1",
      "wrongAnswer2": "오답 2",
      "explanation": "해설"
    }
  ]
}

questions 배열에는 반드시 정확히
10개의 문제가 있어야 합니다.
`;

    // =================================================
    // GPT API 요청
    // =================================================

    const response = await openai.responses.create({

        model: "gpt-5.6-sol",

        reasoning: {
            effort: "none"
        },

        input: prompt
    });

    let output = response.output_text;

    output = output
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const parsed = JSON.parse(output);

    // =================================================
    // 결과 검사
    // =================================================

    validateQuestions(
        parsed.questions,
        emotion,
        difficulty
    );

    // =================================================
    // 이전 문제 저장
    // =================================================

    const key = emotion + "_" + difficulty;

    if (!previousQuestions[key]) {
        previousQuestions[key] = [];
    }

    for (const question of parsed.questions) {
        previousQuestions[key].push(
            question.question
        );
    }

    // 최근 30문제까지만 기억
    if (previousQuestions[key].length > 30) {
        previousQuestions[key] =
            previousQuestions[key].slice(-30);
    }

    // =================================================
    // 생성 결과 출력
    // =================================================

    console.log("");
    console.log("===== 새로 생성된 정보·ICT 문제 =====");

    parsed.questions.forEach((question, index) => {
        console.log(
            `${index + 1}. [${question.type}] ${question.question}`
        );
    });

    console.log("================================");
    console.log("");

    return parsed.questions;
}

// =====================================================
// 11. 서버 상태 확인
// =====================================================

app.get("/", (req, res) => {

    res.send(
        "Information Education GPT Server Running"
    );

});

// =====================================================
// 12. 브라우저 테스트
// =====================================================

app.get("/generate-test", async (req, res) => {

    try {

        const questions = await generateQuestions(
            "good",
            "hard",
            "normal"
        );

        res.json({

            success: true,

            emotion: "good",

            difficulty: "hard",

            adaptiveLevel: "normal",

            subject: "정보·ICT 및 컴퓨터 전공 기초",

            questions: questions

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
});

// =====================================================
// 13. Unity 실제 요청
// =====================================================

app.post("/generate-questions", async (req, res) => {

    try {

        const {
            emotion,
            difficulty,
            adaptiveLevel = "normal"
        } = req.body;

        console.log("=============================");
        console.log("Unity 요청 받음");
        console.log("감정:", emotion);
        console.log("기본 난이도:", difficulty);
        console.log("성취도 난이도 보정:", adaptiveLevel);
        console.log("주제: 정보·ICT 및 컴퓨터 전공 기초");
        console.log("=============================");

        const questions = await generateQuestions(
            emotion,
            difficulty,
            adaptiveLevel
        );

        res.json({

            success: true,

            emotion: emotion,

            difficulty: difficulty,

            adaptiveLevel: adaptiveLevel,

            subject: "정보·ICT 및 컴퓨터 전공 기초",

            questions: questions

        });

    } catch (error) {

        console.error(
            "문제 생성 오류:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
});

// =====================================================
// 14. 서버 실행
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("정보·ICT GPT 서버 실행 중");
    console.log("PORT:", PORT);

});
