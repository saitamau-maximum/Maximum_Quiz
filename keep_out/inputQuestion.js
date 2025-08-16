const RANKING_KEY = window.quizConfig.RANKING_KEY;
let questions = window.quizConfig.questions;
const selectionPageUrl = window.quizConfig.selectionPageUrl;

let bgmToggleBtn;
let bgm;
let current = 0;
let score = 0;
let backClickCount = 0;
const homeEl = document.getElementById("home");
const quizEl = document.getElementById("quiz");

document.addEventListener("DOMContentLoaded", () => {
  const questionCountElement = document.getElementById("question-count");
  if(questions.length >= 10){
    questionCountElement.textContent = "全10問です。";
  } else {
    questionCountElement.textContent = `全${questions.length}問です。`;
  }

  const backButtonHome = document.querySelector(".back-button");
  if (backButtonHome) {
    backButtonHome.addEventListener("click", function (e) {
      e.preventDefault();
      if (backClickCount === 0) {
        alert("本当に戻りますか？もう一度クリックすると戻ります。");
        backClickCount++;
      } else {
        window.location.href = selectionPageUrl;
      }
    });
  }

  bgmToggleBtn = document.getElementById("bgm-toggle");
  bgm = document.getElementById("bgm");
  if (bgmToggleBtn && bgm) {
    bgmToggleBtn.addEventListener("click", () => {
      if (!bgm.paused) {
        bgm.pause();
        bgmToggleBtn.textContent = '▶️ BGMを再開';
      } else {
        bgm.play();
        bgmToggleBtn.textContent = '⏸️ BGMを停止';
      }
    });
  }

  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.addEventListener("click", startQuiz);
  }
});

function toHalfWidth(str) {
  return str.replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
}
function normalizeInput(str) {
  return toHalfWidth(str.trim()).replace(/\s+/g, ' ');
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function startQuiz() {
  const startButton = document.getElementById("startButton");
  startButton.disabled = true;

  const seStart = document.getElementById('se-start');
  seStart.currentTime = 0;
  seStart.play();

  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownText = document.getElementById('countdown-text');
  countdownOverlay.style.display = 'flex';

  let count = 3;
  countdownText.textContent = count;

  const countdownTimer = setInterval(() => {
    count--;
    countdownText.textContent = count > 0 ? count : 'START!';
  }, 1000);

  setTimeout(() => {
    clearInterval(countdownTimer);
    countdownOverlay.style.display = 'none';

    if (bgmToggleBtn && bgmToggleBtn.textContent === "▶️ BGMを再生") {
      bgm.play();
      bgmToggleBtn.textContent = '⏸️ BGMを停止';
    }

    shuffle(questions);
    questions = questions.slice(0, 10);
    current = 0;
    score = 0;
    homeEl.style.display = "none";
    quizEl.style.display = "block";
    showQuestion(current);
    startButton.disabled = false;
  }, 3500);
}

function showQuestion(index) {
  const q = questions[index];
  quizEl.innerHTML = "";

  const question = document.createElement("div");
  question.innerHTML = `<strong>Q${index + 1}:</strong> ${q.q}`;
  quizEl.appendChild(question);

  const input = document.createElement("textarea");
  input.placeholder = "ここに入力してください";
  quizEl.appendChild(input);

  const answerButton = document.createElement("button");
  answerButton.textContent = "解答する";
  quizEl.appendChild(answerButton);

  const result = document.createElement("div");
  result.className = "result";
  quizEl.appendChild(result);

  const explanation = document.createElement("div");
  explanation.className = "explanation";
  quizEl.appendChild(explanation);

  const nextButton = document.createElement("button");
  nextButton.textContent = "次へ";
  nextButton.style.display = "none";
  quizEl.appendChild(nextButton);

  const backButton = document.createElement("a");
  backButton.href = selectionPageUrl;
  backButton.textContent = "問題選択に戻る";
  backButton.className = "home-button";
  quizEl.appendChild(backButton);
  backButton.addEventListener("click", function (e) {
    e.preventDefault();
    if (backClickCount === 0) {
      alert("本当に戻りますか？もう一度クリックすると戻ります。");
      backClickCount++;
    } else {
      window.location.href = selectionPageUrl;
    }
  });

  let emptyClickCount = 0;
  answerButton.addEventListener("click", () => {
    const userInput = input.value.trim();
    if (userInput === "") {
      emptyClickCount++;
      if (emptyClickCount === 1) {
        result.textContent = "何も入力されていません。もう一度押すと正解が表示されます。";
        result.style.color = "black";
        return;
      }
    }

    input.disabled = true;
    const seCorrect = document.getElementById("se-correct");
    const seWrong = document.getElementById("se-wrong");

    const normalizedUser = normalizeInput(userInput);
    const normalizedAns = normalizeInput(q.answer);

    if (normalizedUser === normalizedAns) {
      score++;
      seCorrect.currentTime = 0;
      seCorrect.play();
      result.textContent = "○ 正解です！";
      result.classList.add("correct");
      result.style.color = "green";
    } else {
      seWrong.currentTime = 0;
      seWrong.play();
      result.innerHTML = `× 不正解です。<br><strong>正解：</strong><pre>${q.answer}</pre>`;
      result.classList.add("wrong");
      result.style.color = "red";
    }

    explanation.innerHTML = q.explanation;
    answerButton.style.display = "none";
    nextButton.style.display = "block";
  });

  nextButton.addEventListener("click", () => {
    setTimeout(() => {
      current++;
      backClickCount = 0;
      if (current < questions.length) {
        showQuestion(current);
      } else {
        const seEnd = document.getElementById('se-end');
        seEnd.currentTime = 0;
        seEnd.play();
        quizEl.innerHTML = `<h2>お疲れ様でした！全${questions.length}問が終了しました。<br><br>${score}問正解しました！</h2>`;
        const today = new Date().toLocaleString();
        const newRecord = { date: today, score: score };
        let ranking = JSON.parse(localStorage.getItem(RANKING_KEY) || "[]");
        ranking.push(newRecord);
        ranking.sort((a, b) => b.score - a.score);
        ranking = ranking.slice(0, 5);
        localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));

        const rankingList = document.createElement("div");
        rankingList.innerHTML = "<h3>🏆正解数ランキング(ローカル)</h3>";
        ranking.forEach((r, i) => {
          rankingList.innerHTML += `${i + 1}位: ${r.score}点（${r.date}）<br>`;
        });

        const retryBtn = document.createElement("button");
        retryBtn.textContent = "最初からやり直す";
        retryBtn.onclick = () => startQuiz();

        let resetClickCount = 0;
        const resetBtn = document.createElement("button");
        resetBtn.textContent = "ランキングをリセット";
        resetBtn.onclick = () => {
          if (resetClickCount === 0) {
            alert("本当にリセットしますか？もう一度クリックするとリセットされます。");
            resetClickCount++;
          } else {
            localStorage.removeItem(RANKING_KEY);
            location.reload();
          }
        };

        quizEl.appendChild(backButton);
        quizEl.appendChild(retryBtn);
        quizEl.appendChild(rankingList);
        quizEl.appendChild(resetBtn);
      }
    }, 100);
  });
}
