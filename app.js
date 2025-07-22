// Cleaned Quiz App Code - Minting logic removed

// --- Contract Details ---
const YOUR_SOMNIA_CHAIN_ID = 50312;
const SOMNIA_NETWORK_RPC_URL = "https://dream-rpc.somnia.network";
const SOMNIA_EXPLORER_URL = "https://shannon-explorer.somnia.network";

// --- DOM Elements ---
const walletConnectSection = document.getElementById('walletConnectSection');
const startQuizSection = document.getElementById('startQuizSection');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const startQuizBtn = document.getElementById('startQuizBtn');
const messageDisplay = document.getElementById('messageDisplay');
const quizContainer = document.getElementById('quizContainer');
const quizResultsSection = document.getElementById('quizResultsSection');
const finalScoreDisplay = document.getElementById('finalScoreDisplay');
const takeQuizAgainBtn = document.getElementById('takeQuizAgainBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// --- Ethers.js Variables ---
let provider, signer, userAddress;

// --- Quiz Variables ---
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 30;

const questions = [
    {
        question: "What is Somnia's main goal for real-time applications on the web?",
        answers: [
            { text: "To make them exclusive to large corporations", correct: false },
            { text: "To create a more open, equitable internet", correct: true },
            { text: "To reduce their performance", correct: false },
            { text: "To limit access to certain users", correct: false }
        ]
    },
    {
        question: "What does Somnia's MultiStream Consensus help validators do?",
        answers: [
            { text: "Only process data from a single blockchain", correct: false },
            { text: "Publish their own blockchain and data chain", correct: true },
            { text: "Share data chains with specific individuals", correct: false },
            { text: "Eliminate the need for any data chains", correct: false }
        ]
    },
    {
        question: "How does Somnia aim to improve the internet's censorship resistance?",
        answers: [
            { text: "By centralizing data storage", correct: false },
            { text: "By using censorship-resistant systems accessible to anyone with access to the internet", correct: true },
            { text: "By limiting who can access the network", correct: false },
            { text: "By relying on a single, powerful server", correct: false }
        ]
    },
    {
        question: "What is a key benefit of Somnia's Advanced Compression Techniques?",
        answers: [
            { text: "They reduce the speed of transactions", correct: false },
            { text: "They allow for extremely high compression ratios", correct: true },
            { text: "They increase bandwidth requirements", correct: false },
            { text: "They are only for specific types of data", correct: false }
        ]
    },
    {
        question: "How does Somnia achieve fast transaction execution?",
        answers: [
            { text: "By using traditional EVM without optimizations", correct: false },
            { text: "By requiring manual review of every smart contract", correct: false },
            { text: "Translating EVM bytecode to highly optimized native code", correct: true },
            { text: "Slowing down execution for better security", correct: false }
        ]
    },
    {
        question: "What is the primary function of Somnia's Consensus Chain?",
        answers: [
            { text: "To generate random data", correct: false },
            { text: "To aggregate the heads of all data chains", correct: true },
            { text: "To isolate individual data chains", correct: false },
            { text: "To manage user accounts only", correct: false }
        ]
    },
    {
        question: "How does Somnia achieve fast transaction execution?",
        answers: [
            { text: "By using traditional EVM without optimizations", correct: false },
            { text: "By requiring manual review of every smart contract", correct: false },
            { text: "Translating EVM bytecode to highly optimized native code", correct: true },
            { text: "Slowing down execution for better security", correct: false }
        ]
    },
    {
        question: "What is a key objective regarding 'Composability' in Somnia?",
        answers: [
            { text: "To limit the ability to combine applications", correct: false },
            { text: "To restrict data sharing between different applications", correct: false },
            { text: "To enable applications to be built and combined as parts of a greater whole", correct: true },
            { text: "To prevent applications from interacting with each other", correct: false }
        ]
    },
    {
        question: "What is a key innovation in Somnia's consensus mechanism?",
        answers: [
            { text: "Using only one blockchain for all data", correct: false },
            { text: "Requiring validators to manually approve every transaction", correct: false },
            { text: "Separating data production (data chains) from consensus (consensus chain)", correct: true },
            { text: "Eliminating all validators for complete decentralization", correct: false }
        ]
    },
    {
        question: "What is the goal of Somnia regarding 'Accessibility For All'?",
        answers: [
            { text: "To limit virtual reality experiences to a select few", correct: false },
            { text: "To create an internet connection that only supports certain devices", correct: false },
            { text: "To ensure the potential of the virtual is accessible for everyone", correct: true },
            { text: "To develop specialized hardware for internet access", correct: false }
        ]
    }
]

function showSection(sectionElement) {
  document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
  sectionElement.classList.remove('hidden');
  sectionElement.classList.remove('fade-in');
  void sectionElement.offsetWidth;
  sectionElement.classList.add('fade-in');
}

function applyTheme(theme) {
  document.body.classList.remove('light-theme', 'dark-theme');
  document.body.classList.add(theme);
  themeToggleBtn.innerHTML = theme === 'dark-theme' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light-theme';
  const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
}

if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(localStorage.getItem('theme') || 'dark-theme');
  connectWalletBtn?.addEventListener('click', connectWallet);
  startQuizBtn?.addEventListener('click', startQuiz);
  takeQuizAgainBtn?.addEventListener('click', startQuiz);
});

function displayMessage(message, isError = false) {
  messageDisplay.innerHTML = message;
  messageDisplay.classList.remove('hidden', 'success', 'error');
  messageDisplay.classList.add(isError ? 'error' : 'success');
  messageDisplay.style.display = 'block';
}

function hideMessage() {
  messageDisplay.style.display = 'none';
}

async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      userAddress = await signer.getAddress();

      const network = await provider.getNetwork();
      if (network.chainId !== YOUR_SOMNIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${YOUR_SOMNIA_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${YOUR_SOMNIA_CHAIN_ID.toString(16)}`,
                  chainName: 'Somnia Network',
                  rpcUrls: [SOMNIA_NETWORK_RPC_URL],
                  nativeCurrency: { name: 'Somnia', symbol: 'SOM', decimals: 18 },
                  blockExplorerUrls: [SOMNIA_EXPLORER_URL],
                }],
              });
              return connectWallet();
            } catch (addError) {
              console.error("Failed to add Somnia Network:", addError);
              return displayMessage("Failed to add Somnia Network. Please add it manually.", true);
            }
          } else {
            return displayMessage("Failed to switch network.", true);
          }
        }
      }

      displayMessage(`Wallet connected: ${userAddress.substring(0, 6)}...${userAddress.slice(-4)}`);
      showSection(startQuizSection);

    } catch (error) {
      console.error("Wallet connection error:", error);
      displayMessage("Failed to connect wallet. Please try again.", true);
    }
  } else {
    displayMessage("No EVM wallet detected. Install MetaMask.", true);
  }
}

function startQuiz() {
  hideMessage();
  score = 0;
  currentQuestionIndex = 0;
  document.querySelector('.progress-bar .progress').style.width = '0%';
  showSection(quizContainer);
  startTimer();
  displayQuestion();
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  document.getElementById('timerDisplay').textContent = `Time left: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById('timerDisplay').textContent = `Time left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleAnswerSelection(null);
    }
  }, 1000);
}

function displayQuestion() {
  const questionData = questions[currentQuestionIndex];
  if (!questionData) return endQuiz();

  document.getElementById('questionText').textContent = questionData.question;
  const answersContainer = document.getElementById('answersContainer');
  answersContainer.innerHTML = '';

  questionData.answers.forEach(answer => {
    const button = document.createElement('button');
    button.classList.add('btn', 'answer-btn');
    button.textContent = answer.text;
    button.dataset.correct = answer.correct;
    button.addEventListener('click', () => handleAnswerSelection(button));
    answersContainer.appendChild(button);
  });

  updateProgressBar();
  startTimer();
}

function handleAnswerSelection(selectedButton) {
  clearInterval(timer);
  const answersContainer = document.getElementById('answersContainer');
  Array.from(answersContainer.children).forEach(button => {
    button.disabled = true;
    button.classList.add(button.dataset.correct === 'true' ? 'correct' : 'incorrect');
  });
  if (selectedButton && selectedButton.dataset.correct === 'true') score++;
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) displayQuestion();
    else endQuiz();
  }, 1000);
}

function updateProgressBar() {
  const progress = (currentQuestionIndex / questions.length) * 100;
  document.querySelector('.progress-bar .progress').style.width = `${progress}%`;
}

function endQuiz() {
  clearInterval(timer);
  showSection(quizResultsSection);
  if (userAddress) {
    submitScore(userAddress, score);
  }
  finalScoreDisplay.textContent = `You scored ${score} out of ${questions.length}!`;
  takeQuizAgainBtn.classList.remove('hidden');
  if (score < 5) {
    
    displayMessage(
      'Your score is too low. Please <a href="https://docs.somnia.network/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">learn more about Somnia</a> and try again.',
      true
    );
    takeQuizAgainBtn.classList.remove('hidden');
    return;
}
}
function submitScore(walletAddress, score) {
  if (score >= 5) {
    fetch("https://somnia-quiz.vercel.app/api/save-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: walletAddress, score })
    })
    .then(res => res.json())
    .then(data => console.log("Saved to DB:", data))
    .catch(err => console.error("DB error:", err));
  }
}
// Show initial section
showSection(walletConnectSection);
