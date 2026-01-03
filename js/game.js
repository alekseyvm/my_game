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

    // Загрузка вопросов из выбранного файла или загруженных данных
    const questionsFile = gameState.questionsFile || 'data/questions.json';
    questionsData = await loadQuestions(questionsFile, gameState);
    
    // Отображение наименования предмета в заголовке
    const subjectElement = document.getElementById('gameSubject');
    if (subjectElement && questionsData.subject) {
        subjectElement.textContent = questionsData.subject;
        subjectElement.style.display = 'block';
    }
    
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
    const resultElement = document.getElementById('answerResult');
    const closeButton = document.getElementById('closeModal');
    
    // Сбрасываем состояние перед показом нового вопроса
    resultElement.textContent = '';
    resultElement.className = 'answer-result';
    closeButton.style.display = 'inline-block';
    closeButton.textContent = 'Закрыть';
    
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
    closeButton.onclick = () => {
        modal.classList.remove('active');
    };
}

// Обработка ответа
function handleAnswer(question, selectedIndex, selectedButton) {
    const modal = document.getElementById('questionModal');
    const questionOptions = document.getElementById('questionOptions');
    const allButtons = questionOptions.querySelectorAll('.option-button');
    const resultElement = document.getElementById('answerResult');
    const closeButton = document.getElementById('closeModal');
    
    // Отключаем все кнопки вариантов ответов
    allButtons.forEach(btn => {
        btn.style.pointerEvents = 'none';
    });
    
    // Скрываем кнопку закрытия во время показа результата
    closeButton.style.display = 'none';
    
    // Показываем правильный ответ
    allButtons[question.correctAnswer].classList.add('correct');
    
    // Проверка ответа
    const currentPlayer = getCurrentPlayer(gameState);
    if (selectedIndex === question.correctAnswer) {
        selectedButton.classList.add('correct');
        updatePlayerScore(gameState, currentPlayer.id, question.points);
        
        // Показываем результат в модальном окне
        resultElement.textContent = `✓ Правильно! +${question.points} баллов для ${currentPlayer.name}`;
        resultElement.className = 'answer-result correct';
    } else {
        selectedButton.classList.add('incorrect');
        updatePlayerScore(gameState, currentPlayer.id, -question.points);
        
        // Показываем результат в модальном окне
        resultElement.textContent = `✗ Неправильно! -${question.points} баллов для ${currentPlayer.name}`;
        resultElement.className = 'answer-result incorrect';
    }
    
    // Отмечаем вопрос как отвеченный
    markQuestionAsAnswered(gameState, question.id);
    
    // Переход к следующему игроку
    nextPlayer(gameState);
    
    // Сохранение состояния
    saveGameState(gameState);
    
    // Обновляем игровое поле
    renderPlayers();
    renderGameBoard();
    
    // Показываем кнопку закрытия через небольшую паузу
    setTimeout(() => {
        closeButton.style.display = 'inline-block';
        closeButton.textContent = 'Продолжить';
    }, 1000);
    
    // Обновляем обработчик кнопки закрытия
    closeButton.onclick = () => {
        modal.classList.remove('active');
        // Проверка завершения игры
        const totalQuestions = questionsData.categories.reduce((sum, cat) => sum + cat.questions.length, 0);
        if (isGameFinished(gameState, totalQuestions)) {
            setTimeout(() => {
                if (confirm('Все вопросы отвечены! Перейти к результатам?')) {
                    window.location.href = 'dashboard.html';
                }
            }, 500);
        }
    };
}

// Запуск игры при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
