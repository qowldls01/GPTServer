
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
출제 대상은 고등학교 1~3학년 학생입니다.

모든 문제는 고등학교 정보 교과 수준으로 출제하세요.
대학교 컴퓨터공학 전공 시험 수준은 금지합니다.

다음 영역에서 골고루 출제하세요.

1. 프로그래밍
- 변수, 자료형, 연산자
- 조건문과 반복문
- 배열과 함수의 기초
- 짧은 코드의 실행 결과

2. 알고리즘
- 순차 탐색과 이진 탐색
- 버블 정렬, 선택 정렬, 삽입 정렬
- 알고리즘의 효율성
- 간단한 순서도와 의사코드

3. 자료구조
- 배열, 스택, 큐의 개념
- 스택과 큐의 삽입·삭제 과정

4. 컴퓨터 시스템
- CPU, 메모리, 저장장치
- 운영체제의 역할
- 프로세스와 스레드의 기초

5. 네트워크 및 ICT
- IP 주소
- 인터넷과 데이터 통신
- TCP와 UDP의 기초
- IoT와 클라우드

6. 인공지능 및 데이터
- 지도학습과 비지도학습
- 학습 데이터
- 인공지능 활용과 한계

7. 정보 보안과 윤리
- 개인정보 보호
- 암호화의 기초
- 저작권과 정보 윤리

10문제에서 프로그래밍, 알고리즘, 자료구조,
컴퓨터 시스템, 네트워크를 각각 최소 1문제 포함하세요.

동일 영역에 지나치게 집중하지 마세요.

다음 내용은 출제하지 마세요.
- C언어 포인터 연산
- 세마포어와 교착 상태
- 가상 메모리와 페이지 교체
- 캐시 미스의 종류
- 데이터베이스 정규화
- 복잡한 SQL
- 복잡한 시간 복잡도 계산

단, 지나치게 쉬운 생활 상식 문제도 피하세요.

학습자가 수업에서 배운 개념을 이해하고
간단한 상황에 적용할 수 있는지 평가하세요.
`;
}


function getEmotionInstruction(emotion) {

    if (emotion === "angry") {
        return `
현재 감정: 화남

빠르게 읽고 판단할 수 있는 게임형 문제를 출제하세요.

- 문제와 선택지를 짧게 작성하세요.
- 긴 계산이나 복잡한 코드 분석은 피하세요.
- 단순 생활 상식 문제가 아닌 전공 핵심 개념을 활용하세요.
- 빠르게 정답을 선택할 수 있도록 구성하세요.
`;
    }

    if (emotion === "sad") {
        return `
현재 감정: 슬픔

학습 부담을 줄이면서 전공 기초 개념을 학습할 수 있도록
문제를 구성하세요.

- 비교적 쉬운 전공 기초 문제를 출제하세요.
- 질문을 명확하고 친절하게 작성하세요.
- 복잡한 계산이나 여러 단계의 추론은 줄이세요.
- 지나치게 쉬운 생활 상식 문제는 출제하지 마세요.
`;
    }

    if (emotion === "good") {
        return `
현재 감정: 좋음

학습자가 적극적으로 사고할 수 있도록
심화 및 응용 문제를 활용하세요.

- 코드 분석
- 실행 결과 예측
- 개념 비교
- 상황에 적합한 알고리즘 선택
- 자료구조 동작 원리
- 운영체제 상황 판단

위와 같은 문제 유형을 적극 활용하세요.

단, 선택된 난이도와 이전 학습 성취도에 따른
난이도 보정도 함께 적용하세요.
`;
    }

    return `
현재 감정: 보통

사용자가 선택한 기본 또는 심화 난이도에 맞춰
전공 분야를 균형 있게 출제하세요.
`;
}

// =====================================================
// 3. 기본 난이도
// =====================================================


function getDifficultyInstruction(difficulty) {

    if (difficulty === "easy") {
        return `
난이도: 쉬움

고등학교 정보 교과의 기초 수준입니다.

기본 개념을 이해했는지 확인하세요.
문장은 간결하게 작성하세요.

생활 상식만 묻는 문제는 피하세요.
`;
    }

    if (difficulty === "hard") {
        return `
난이도: 심화

고등학교 정보 교과의 심화 수준입니다.

대학교 전공 수준의 전문 지식은 요구하지 마세요.

다음과 같은 문제를 활용하세요.
- 짧은 코드의 실행 결과 예측
- 정렬 과정에서 배열의 변화
- 스택과 큐의 동작 결과
- 탐색 알고리즘 비교
- 네트워크 개념을 상황에 적용

고등학생이 배운 개념을 활용하여
1~2단계의 사고로 풀 수 있도록 출제하세요.
`;
    }

    return `
난이도: 기본

고등학교 정보 교과의 일반적인 수준입니다.

개념 이해와 간단한 응용 문제를
적절히 섞어서 출제하세요.

지나치게 쉽거나 전문적인 문제는 피하세요.
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

    if (emotion === "angry") {
        return `
화남 게임 화면 제한:

- question: 45자 이내
- correctAnswer: 12자 이내
- wrongAnswer1: 12자 이내
- wrongAnswer2: 12자 이내
- explanation: 80자 이내

긴 코드는 출제하지 마세요.
선택지는 짧고 명확하게 작성하세요.
`;
    }

    return `
모바일 퀴즈 화면 제한:

- question: 110자 이내
- correctAnswer: 40자 이내
- wrongAnswer1: 40자 이내
- wrongAnswer2: 40자 이내
- explanation: 160자 이내

해설은 최대 3문장으로 작성하세요.

C언어 코드가 필요한 경우 최대 4줄까지만 사용하세요.

JSON 문자열 안에서 코드 줄바꿈이 필요하면
올바르게 이스케이프된 줄바꿈 문자를 사용하세요.

선택지 세 개의 길이와 표현 방식을 비슷하게 맞추세요.

문제의 정확성과 구분력을 우선하세요.
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
당신은 정보·ICT 및 컴퓨터 전공 기초 문제 출제자입니다.

[난이도 최종 확인]

모든 문제는 고등학생을 대상으로 합니다.

심화 난이도라도 대학교 컴퓨터공학 전공 지식을
알아야만 풀 수 있는 문제는 출제하지 마세요.

문제를 완성한 후 고등학교 정보 교과를
학습한 학생이 풀 수 있는지 다시 검토하세요.

어려운 전문 용어를 사용하기보다
배운 개념을 적용하도록 문제를 구성하세요.


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

C언어, 운영체제, 알고리즘, 자료구조,
네트워크·ICT에서 각각 최소 1문제를 출제하세요.

나머지 문제는 다른 영역에서 골고루 출제하세요.

정보 보안과 정보 윤리는 합쳐서 최대 1문제입니다.

단순 암기 문제에만 집중하지 마세요.

다음 문제 유형을 적절히 활용하세요.

- 개념 비교
- 코드 실행 결과
- 자료구조 동작 결과
- 알고리즘 시간 복잡도
- 운영체제 상황 판단
- 네트워크 기술 적용
- 실제 문제 해결

=====================================================
선택지 품질 규칙
=====================================================

객관식 문제에는 정답 1개와 오답 2개를 작성하세요.

오답은 학습자가 실제로 혼동할 수 있는
그럴듯한 내용이어야 합니다.

정답이 지나치게 길거나 구체적이라는 이유로
쉽게 드러나지 않도록 하세요.

세 선택지의 문장 길이와 표현 방식을
가능하면 비슷하게 맞추세요.

명백하게 엉뚱하거나 우스꽝스러운 오답은 금지합니다.

모든 객관식 문제에는 명확한 정답이
정확히 하나만 존재해야 합니다.

=====================================================
정확성 규칙
=====================================================

C언어 코드 실행 결과 문제는
실제로 유효한 코드만 사용하세요.

정의되지 않은 동작에 의존하는 문제는
출제하지 마세요.

알고리즘 시간 복잡도 문제는
입력 조건과 분석 기준을 명확하게 작성하세요.

운영체제 문제는
주어진 조건에서 답이 하나로 결정되도록 작성하세요.

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
