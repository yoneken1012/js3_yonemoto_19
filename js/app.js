// 画面切り替え設定
const historyBtn = document.getElementById("history_btn");
const historyScreen = document.getElementById("history_screen");
const historyList = document.getElementById("history_list");
const backBtn = document.getElementById("back_btn");
const mainScreen = document.getElementById("main_screen");

historyBtn.onclick = () => {
    showHistory();
    mainScreen.style.display = "none";  // メイン画面を隠す
    historyScreen.style.display = "block";  // 履歴画面を表示
};

backBtn.onclick = () => {
    historyScreen.style.display = "none";  // 履歴画面を閉じる
    mainScreen.style.display = "block";  // メイン画面を再表示
};

// 単語データ(仮) ※後でlocalStorageから読み込む形に変更可能
// const wordList = [
    // { en: "business", ja: "ビジネス"},
    // { en: "meeting", ja: "会議"},
    // { en: "analysis", ja: "分析"},
    // { en: "discuss", ja: "議論する"},
    // { en: "project", ja: "プロジェクト"}
// ];

// 日毎の成績を保存するための設定
const STORAGE_KEY = "quizDailyStats"

// 現在の単語を保持する変数
let currentWord = null;

// ランダムな単語を1つ取得する関数
function getRondomWord() {
    const index = Math.floor(Math.random() * wordList.length);
    return wordList[index];
}

// 画面に単語を表示する関数
function showRandomWord() {    
    // ランダム単語を取得
    currentWord = getRondomWord();
    // htmlのen_wordに英単語を表示する
    document.getElementById("en_word").textContent = currentWord.en;
    //4択表示
    showChoices();
}

// ページ読み込み時に1単語表示
window.onload = function () {
    showRandomWord();
    showTodayStats();

// 更新ボタンをクリックしたら新しい単語を表示
const updateBtn = document.getElementById("update_btn");
if (updateBtn) {
    updateBtn.addEventListener("click", () => {
        showRandomWord();
        document.getElementById("result").style.display = "none";
        document.querySelectorAll(".choice_btn").forEach(b => b.disabled = false)
    });
    }
};

// 配列をシャッフルする関数
function shuffle(array) { 
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
 }

// 正解以外の日本語訳を3つ取る
function getDummyChoices(correctWord) {
    const dummy = wordList
    .filter(w => w.en !== correctWord.en) // 正解以外を残す
    .map(w => w.ja);

    // ランダムで3つ取り出す
    const shuffled = shuffle(dummy);
    return shuffled.slice(0, 3);
}

// 4択表示
function showChoices() {
    const correctJA = currentWord.ja; // 正しい日本語訳

    // ダミー3つを取得
    const dummies = getDummyChoices(currentWord);

    // 正解1つ + ダミー3つの計４つ
    let choices = [correctJA, ...dummies];

    // 順番をシャッフル
    choices = shuffle(choices);

    // htmlへ流し込む
    document.getElementById("choice1").textContent = choices[0]
    document.getElementById("choice2").textContent = choices[1]
    document.getElementById("choice3").textContent = choices[2]
    document.getElementById("choice4").textContent = choices[3]

    const resultDiv = document.getElementById("result");
    resultDiv.style.display = "none"; // 新しい問題の時は非表示

    // まず全ボタンを有効化＆既存のイベント解除
    document.querySelectorAll(".choice_btn").forEach(btn => {
        btn.disabled = false;
        btn.onclick = null;
    });

// タイマー開始
startTimer();

    // 各ボタンに「クリックで判定」イベント追加
    document.querySelectorAll(".choice_btn").forEach(btn => {
        btn.onclick = function () {
            // すでに回答済みなら無視
            if (btn.disabled) return;

            clearInterval(timer);

            const isCorrect = (btn.textContent === correctJA);

            const resultDiv = document.getElementById("result");

            if (btn.textContent === correctJA) {
                resultDiv.textContent = "正解!"
            }
            else {
                resultDiv.textContent = "不正解..."
            }

            resultDiv.style.display = "block";

            // 今日の成績を更新
            updateDailyStats(isCorrect);

            // 一度答えたら全ボタンを無効化
            document.querySelectorAll(".choice_btn").forEach(b => b.disabled = true);

            // 自動で次の問題へ
            goNextQuestion();            
        };
    });
}

// 今日の成績を保存・更新する処理
// 今日の日付(2025-11-26)をキーとして使う
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

//今日の成績を取得 (無ければ初期値)
function loadTodayStats() { 
    const key = getTodayKey();
    const data = localStorage.getItem(key);

    if (data) {
        return JSON.parse(data);
    } else {
        return { answered:0, correct:0};
    }
 }

// 今日の成績を保存
function saveTodayStats(stats) {
    const key = getTodayKey();
    localStorage.setItem(key, JSON.stringify(stats));
}

// 成績を更新 (1問解答する度に呼ぶ)
function updateDailyStats(isCorrect) {
    let stats = loadTodayStats();

    stats.answered += 1;
    if (isCorrect) stats.correct += 1;

    saveTodayStats(stats);

    showTodayStats();
}

// 画面に今日の成績を表示
function showTodayStats() {
    const stats = loadTodayStats();
    const rate = stats.answered === 0 ? 0 : Math.round((stats.correct / stats.answered) * 100);

    document.getElementById("today_stats").textContent = `今日の成績：${stats.answered}問中${stats.correct}問正解 (正答率${rate}%)`;
}


// グローバル変数
let timer = null;   // setInterval を入れる
let timeLeft = 10;  // 現在の残り秒数

// タイマー開始関数
function startTimer() { 
    // セレクトボックスの秒数を利用
    timeLeft = Number(document.getElementById("timer_select").value);
    document.getElementById("timer_display").textContent = `残り時間：${timeLeft} 秒`;

    // 以前のタイマーが生きていたら消す
    if (timer !== null) {
        clearInterval(timer);
    }

    timer = setInterval(() => {
        if (isPaused) return;  // 一時停止中は何もしない

        timeLeft--;
        document.getElementById("timer_display").textContent = `残り時間：${timeLeft} 秒`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            lockChoices();
            document.getElementById("result").textContent = "時間切れ！不正解...";
            document.getElementById("result").style.display = "block";

            updateDailyStats(false);  // 不正解として記録
            
            goNextQuestion();  // 自動で次の問題へ
        }
    }, 1000);
 }

// 一時停止ボタンのトグル処理
const pauseBtn = document.getElementById("pause_btn");

pauseBtn.addEventListener("click", () => {
    // 一時停止 → 再開
    if (isPaused) {
        isPaused = false;
        unlockChoices();
        pauseBtn.textContent = "⏸️一時停止";
        pauseBtn.style.background = "";
        return;
    }

    // 通常 → 一時停止
    isPaused = true;
    lockChoices();
    pauseBtn.textContent = "▶️再開"
    pauseBtn.style.background = "#ff6666";
});


// ボタンロック関数
function lockChoices () {
    document.querySelectorAll(".choice_btn").forEach(b => b.disabled = true);
}

// 次の問題へ自動で進む関数
function goNextQuestion() {
    setTimeout(() => {
        showRandomWord();
        document.getElementById("result").style.display = "none";
        document.querySelectorAll(".choice_btn").forEach(b => b.disabled = false);
    }, 1250); // 1秒後に次の問題へ
}

// タイマートグル一時停止
let isPaused = false; // 一時停止中か？

// 選択肢をロック/アンロックする関数
function unlockChoices() {
    document.querySelectorAll(".choice_btn").forEach(b => b.disabled = false);    
}

// localStorageから日別の成績一覧を読み込む
function showHistory() {
    historyList.innerHTML = ""; // 一旦クリア

    // localStorageの全キーを取得
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // 日付形式のデータのみ対象
        if (!key.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) continue;

        const data = JSON.parse(localStorage.getItem(key));

        const answered = data.answered;
        const correct = data.correct;
        const rate = answered === 0 ? 0 : Math.round((correct / answered) * 100);

        // 表示用htmlを追加
        const div = document.createElement("div");
        div.textContent = `${key}の成績：${answered}問中${correct}問正解 (正答率${rate}%)`;

        historyList.appendChild(div);
    }
}