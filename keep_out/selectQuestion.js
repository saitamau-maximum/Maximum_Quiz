const RANKING_KEY = window.quizConfig.RANKING_KEY;
let questions = window.quizConfig.questions;
const selectionPageUrl = window.quizConfig.selectionPageUrl;

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

  const bgmToggleBtn = document.getElementById("bgm-toggle");
  const bgm = document.getElementById("bgm");

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
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function escapeHTMLExceptBR(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/&lt;pre&gt;/g, "<pre>")
    .replace(/&lt;\/pre&gt;/g, "</pre>");
}

let current = 0;
let score = 0;
let backClickCount = 0;

const homeEl = document.getElementById("home");
const quizEl = document.getElementById("quiz");

function startQuiz() {
  const startButton = homeEl.querySelector("button");
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
    if (count > 0) {
      countdownText.textContent = count;
    } else {
      countdownText.textContent = 'START!';
    }
  }, 1000);

  setTimeout(() => {
    clearInterval(countdownTimer);
    countdownOverlay.style.display = 'none';

    if (document.getElementById('bgm-toggle').textContent == "▶️ BGMを再生") {
      document.getElementById('bgm').play();
      document.getElementById('bgm-toggle').textContent = '⏸️ BGMを停止';
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
  quizEl.innerHTML = "";
  const q = questions[index];

  const originalAnswerText = q.options[q.answer];

  let shuffledOptionsWithOriginalIndex = q.options.map((option, idx) => ({ option, originalIdx: idx }));
  shuffle(shuffledOptionsWithOriginalIndex);

  const shuffledOptions = shuffledOptionsWithOriginalIndex.map(item => item.option);

  let newAnswerIndex = -1;
  for (let i = 0; i < shuffledOptionsWithOriginalIndex.length; i++) {
    if (shuffledOptionsWithOriginalIndex[i].originalIdx === q.answer) {
      newAnswerIndex = i;
      break;
    }
  }

  const currentQuestionOptions = shuffledOptions;
  const currentQuestionCorrectAnswerIndex = newAnswerIndex;

  const container = document.createElement("div");
  container.className = "question";

  const title = document.createElement("div");
  title.innerHTML = `<strong>Q${index + 1}:</strong> ${escapeHTMLExceptBR(q.q)}`;
  container.appendChild(title);

  const options = document.createElement("div");
  options.className = "options";

  currentQuestionOptions.forEach((opt, i) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `q${index}`;
    input.value = i;
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + opt));
    options.appendChild(label);
  });

  container.appendChild(options);

  const button = document.createElement("button");
  button.textContent = "解答";

  const result = document.createElement("div");
  result.className = "result";

  const explanation = document.createElement("div");
  explanation.className = "explanation";

  const backButton = document.createElement("a");
  backButton.href = selectionPageUrl;
  backButton.className = "home-button";
  backButton.textContent = "問題選択に戻る";
  backButton.addEventListener("click", function (e) {
    e.preventDefault();
    if (backClickCount === 0) {
      alert("本当に戻りますか？もう一度クリックすると戻ります。");
      backClickCount++;
    } else {
      window.location.href = selectionPageUrl;
    }
  });

  const nextButton = document.createElement("button");
  nextButton.textContent = "次へ";
  nextButton.style.display = "none";
  nextButton.style.margin = "20px auto";

  nextButton.onclick = () => {
    setTimeout(() => {
      current++;
      backClickCount = 0;
      if (current < questions.length) {
        showQuestion(current);
      } else {
        const seEnd = document.getElementById('se-end');
        seEnd.currentTime = 0;
        seEnd.play();
        backClickCount = 1;
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
        retryBtn.onclick = () => {
          startQuiz();
        };

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

        const container = document.createElement("div");
        container.appendChild(retryBtn);
        container.appendChild(rankingList);
        container.appendChild(resetBtn);

        quizEl.appendChild(backButton);
        quizEl.appendChild(container);
      }
    }, 100);
  };

  button.onclick = () => {
    const selected = container.querySelector("input:checked");
    if (!selected) {
      result.textContent = "選択肢を選んでください。";
      result.style.color = "black";
      return;
    }

    const isCorrect = parseInt(selected.value) === currentQuestionCorrectAnswerIndex;
    const seCorrect = document.getElementById("se-correct");
    const seWrong = document.getElementById("se-wrong");

    if (isCorrect) {
      result.classList.add("correct");
      score++;
      seCorrect.currentTime = 0;
      seCorrect.play();
    } else {
      result.classList.add("wrong");
      seWrong.currentTime = 0;
      seWrong.play();
    }

    result.textContent = isCorrect ? "○ 正解です！" : `× 不正解です。正解：${currentQuestionOptions[currentQuestionCorrectAnswerIndex]}`;
    result.style.color = isCorrect ? "green" : "red";
    explanation.innerHTML = escapeHTMLExceptBR(q.explanation);

    const labels = container.querySelectorAll("label");
    labels.forEach(label => label.classList.add("disabled"));

    button.style.display = "none";
    nextButton.style.display = "inline-block";
  };
  const nextButtonWrapper = document.createElement("div");
  nextButtonWrapper.style.textAlign = "center";
  nextButtonWrapper.appendChild(nextButton);

  container.appendChild(button);
  container.appendChild(result);
  container.appendChild(explanation);
  container.appendChild(nextButtonWrapper);
  container.appendChild(backButton);

  quizEl.appendChild(container);
}

window.startQuiz = startQuiz;
