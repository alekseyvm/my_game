// Логика игры

let gameState = null;
let questionsData = null;

// Инициализация игры
async function initGame() {
    // Загрузка состояния игры
    gameState = loadGameState();
    
    if (!gameState) {
        alert('Состояние игры не найдено. Перенаправление на главную страницу.');
        window.location.href = 'index.html';
        return;
    }

    // Загрузка вопросов
    questionsData = await loadQuestions();
    
    // Отображение интерфейса
    renderPlayers();
    renderGameBoard();
    
    // Обработчик кнопки дашборда
    document.getElementById('showDashboard').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

// Отображение игроков
function renderPlayers() {
    const playersPanel = document.getElementById('playersPanel');
    playersPanel.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${index === gameState.currentPlayer ? 'active' : ''}`;
        playerCard.innerHTML = `
            <h3>${player.name}</h3>
            <div class="player-score">${player.score}</div>
        `;
        playersPanel.appendChild(playerCard);
    });
}

// Отображение игрового поля
function renderGameBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    questionsData.categories.forEach(category => {
        const categoryColumn = document.createElement('div');
        categoryColumn.className = 'category-column';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category.name;
        categoryColumn.appendChild(categoryHeader);
        
        const questionsGrid = document.createElement('div');
        questionsGrid.className = 'questions-grid';
        
        category.questions.forEach(question => {
            const questionCell = document.createElement('button');
            questionCell.className = 'question-cell';
            questionCell.textContent = question.points;
            
            if (isQuestionAnswered(gameState, question.id)) {
                questionCell.classList.add('answered');
            } else {
                questionCell.addEventListener('click', () => showQuestion(category, question));
            }
            
            questionsGrid.appendChild(questionCell);
        });
        
        categoryColumn.appendChild(questionsGrid);
        gameBoard.appendChild(categoryColumn);
    });
}

// Показать вопрос
function showQuestion(category, question) {
    const modal = document.getElementById('questionModal');
    const questionCategory = document.getElementById('questionCategory');
    const questionPoints = document.getElementById('questionPoints');
    const questionImage = document.getElementById('questionImage');
    const questionText = document.getElementById('questionText');
    const questionOptions = document.getElementById('questionOptions');
    
    // Заполнение данных
    questionCategory.textContent = category.name;
    questionPoints.textContent = `${question.points} баллов`;
    questionText.textContent = question.text;
    
    // Изображение (если есть)
    if (question.image) {
        questionImage.innerHTML = `<img src="${question.image}" alt="Изображение к вопросу">`;
        questionImage.style.display = 'block';
    } else {
        questionImage.innerHTML = '';
        questionImage.style.display = 'none';
    }
    
    // Варианты ответов
    questionOptions.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'option-button';
        optionButton.textContent = option;
        optionButton.addEventListener('click', () => handleAnswer(question, index, optionButton));
        questionOptions.appendChild(optionButton);
    });
    
    // Показать модальное окно
    modal.classList.add('active');
    
    // Обработчик закрытия
    const closeButton = document.getElementById('closeModal');
    closeButton.onclick = () => {
        modal.classList.remove('active');
    };
}

// Обработка ответа
function handleAnswer(question, selectedIndex, selectedButton) {
    const questionOptions = document.getElementById('questionOptions');
    const allButtons = questionOptions.querySelectorAll('.option-button');
    
    // Отключаем все кнопки
    allButtons.forEach(btn => {
        btn.style.pointerEvents = 'none';
    });
    
    // Показываем правильный ответ
    allButtons[question.correctAnswer].classList.add('correct');
    
    // Проверка ответа
    const currentPlayer = getCurrentPlayer(gameState);
    if (selectedIndex === question.correctAnswer) {
        selectedButton.classList.add('correct');
        updatePlayerScore(gameState, currentPlayer.id, question.points);
        
        setTimeout(() => {
            alert(`Правильно! +${question.points} баллов для ${currentPlayer.name}`);
        }, 300);
    } else {
        selectedButton.classList.add('incorrect');
        updatePlayerScore(gameState, currentPlayer.id, -question.points);
        
        setTimeout(() => {
            alert(`Неправильно! -${question.points} баллов для ${currentPlayer.name}`);
        }, 300);
    }
    
    // Отмечаем вопрос как отвеченный
    markQuestionAsAnswered(gameState, question.id);
    
    // Переход к следующему игроку
    nextPlayer(gameState);
    
    // Сохранение состояния
    saveGameState(gameState);
    
    // Обновление интерфейса через 2 секунды
    setTimeout(() => {
        document.getElementById('questionModal').classList.remove('active');
        renderPlayers();
        renderGameBoard();
        
        // Проверка завершения игры
        const totalQuestions = questionsData.categories.reduce((sum, cat) => sum + cat.questions.length, 0);
        if (isGameFinished(gameState, totalQuestions)) {
            setTimeout(() => {
                if (confirm('Все вопросы отвечены! Перейти к результатам?')) {
                    window.location.href = 'dashboard.html';
                }
            }, 500);
        }
    }, 2000);
}

// Запуск игры при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
