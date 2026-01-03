// Модуль для работы с данными

// Получение списка доступных файлов вопросов из questions.json
async function getAvailableQuestionFiles() {
    try {
        // Загружаем файл конфигурации с списком баз вопросов
        const response = await fetch('data/questions.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить конфигурацию вопросов');
        }
        
        const config = await response.json();
        
        if (!config.bases || !Array.isArray(config.bases)) {
            throw new Error('Некорректный формат конфигурации вопросов');
        }
        
        // Загружаем каждый файл для получения информации о предмете
        const fileInfo = [];
        for (const base of config.bases) {
            try {
                const resp = await fetch(`data/${base.file}`);
                if (resp.ok) {
                    const data = await resp.json();
                    // Проверяем корректность данных
                    if (isValidQuestionsFormat(data)) {
                        fileInfo.push({
                            name: base.file,
                            path: `data/${base.file}`,
                            subject: data.subject || base.name
                        });
                    } else {
                        console.warn(`Файл ${base.file} имеет некорректный формат и будет пропущен`);
                    }
                }
            } catch (e) {
                console.warn(`Не удалось загрузить ${base.file}:`, e);
            }
        }
        
        return fileInfo;
    } catch (error) {
        console.error('Ошибка получения списка файлов вопросов:', error);
        return [];
    }
}

// Загрузка вопросов из указанного JSON файла или из загруженных данных
async function loadQuestions(filename = 'data/questions.json', gameState = null) {
    try {
        // Если передан gameState и есть загруженные данные, используем их
        if (gameState && gameState.uploadedQuestions && gameState.questionsFile === 'uploaded') {
            const uploadedData = gameState.uploadedQuestions;
            if (isValidQuestionsFormat(uploadedData)) {
                console.log('Используем загруженные данные вопросов:', uploadedData.subject || 'Без названия');
                return uploadedData;
            } else {
                console.warn('Загруженные данные имеют некорректный формат, используем данные по умолчанию');
            }
        }
        
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить вопросы из ${filename}`);
        }
        const data = await response.json();
        
        // Проверяем наличие обязательных полей
        if (!data.categories || !Array.isArray(data.categories)) {
            throw new Error('Некорректный формат данных вопросов');
        }
        
        return data;
    } catch (error) {
        console.error('Ошибка загрузки вопросов:', error);
        // Возвращаем тестовые данные в случае ошибки
        return getDefaultQuestions();
    }
}

// Проверка корректности формата данных вопросов (упрощенная версия)
function isValidQuestionsFormat(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    if (!data.categories || !Array.isArray(data.categories)) {
        return false;
    }
    
    if (data.categories.length === 0) {
        return false;
    }
    
    for (let i = 0; i < data.categories.length; i++) {
        const category = data.categories[i];
        if (!category.id || !category.name || !category.questions) {
            return false;
        }
        
        if (!Array.isArray(category.questions) || category.questions.length === 0) {
            return false;
        }
        
        for (let j = 0; j < category.questions.length; j++) {
            const question = category.questions[j];
            if (!question.text || !Array.isArray(question.options) || 
                typeof question.correctAnswer !== 'number' || typeof question.points !== 'number') {
                return false;
            }
            
            if (question.options.length < 2) {
                return false;
            }
            
            if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
                return false;
            }
        }
    }
    
    return true;
}

// Валидация данных вопросов (дублируем функцию для совместимости)
function validateQuestionsData(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    if (!data.subject || typeof data.subject !== 'string') {
        return false;
    }
    
    if (!data.categories || !Array.isArray(data.categories)) {
        return false;
    }
    
    if (data.categories.length === 0) {
        return false;
    }
    
    for (let i = 0; i < data.categories.length; i++) {
        const category = data.categories[i];
        if (!category.id || !category.name || !category.questions) {
            return false;
        }
        
        if (!Array.isArray(category.questions) || category.questions.length === 0) {
            return false;
        }
        
        for (let j = 0; j < category.questions.length; j++) {
            const question = category.questions[j];
            if (!question.text || !Array.isArray(question.options) || 
                typeof question.correctAnswer !== 'number' || typeof question.points !== 'number') {
                return false;
            }
            
            if (question.options.length < 2) {
                return false;
            }
            
            if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
                return false;
            }
        }
    }
    
    return true;
}

// Тестовые данные по умолчанию
function getDefaultQuestions() {
    return {
        subject: "Общие вопросы",
        categories: [
            {
                id: 1,
                name: "История",
                questions: [
                    {
                        id: 1,
                        text: "В каком году началась Великая Отечественная война?",
                        options: ["1939", "1941", "1942", "1945"],
                        correctAnswer: 1,
                        points: 100
                    },
                    {
                        id: 2,
                        text: "Кто был первым президентом России?",
                        options: ["Михаил Горбачев", "Борис Ельцин", "Владимир Путин", "Дмитрий Медведев"],
                        correctAnswer: 1,
                        points: 200
                    },
                    {
                        id: 3,
                        text: "В каком году был основан Санкт-Петербург?",
                        options: ["1703", "1712", "1725", "1800"],
                        correctAnswer: 0,
                        points: 300
                    }
                ]
            },
            {
                id: 2,
                name: "География",
                questions: [
                    {
                        id: 4,
                        text: "Какая самая длинная река в мире?",
                        options: ["Нил", "Амазонка", "Янцзы", "Миссисипи"],
                        correctAnswer: 1,
                        points: 100
                    },
                    {
                        id: 5,
                        text: "Столица Австралии?",
                        options: ["Сидней", "Мельбурн", "Канберра", "Брисбен"],
                        correctAnswer: 2,
                        points: 200
                    },
                    {
                        id: 6,
                        text: "Самая высокая гора в мире?",
                        options: ["К2", "Эверест", "Канченджанга", "Лхоцзе"],
                        correctAnswer: 1,
                        points: 300
                    }
                ]
            },
            {
                id: 3,
                name: "Наука",
                questions: [
                    {
                        id: 7,
                        text: "Какой элемент имеет химический символ 'O'?",
                        options: ["Осмий", "Кислород", "Золото", "Олово"],
                        correctAnswer: 1,
                        points: 100
                    },
                    {
                        id: 8,
                        text: "Сколько планет в Солнечной системе?",
                        options: ["7", "8", "9", "10"],
                        correctAnswer: 1,
                        points: 200
                    },
                    {
                        id: 9,
                        text: "Кто открыл закон всемирного тяготения?",
                        options: ["Альберт Эйнштейн", "Исаак Ньютон", "Галилео Галилей", "Николай Коперник"],
                        correctAnswer: 1,
                        points: 300
                    }
                ]
            },
            {
                id: 4,
                name: "Литература",
                questions: [
                    {
                        id: 10,
                        text: "Кто написал 'Войну и мир'?",
                        options: ["Федор Достоевский", "Лев Толстой", "Антон Чехов", "Иван Тургенев"],
                        correctAnswer: 1,
                        points: 100
                    },
                    {
                        id: 11,
                        text: "В каком году родился Александр Пушкин?",
                        options: ["1799", "1800", "1801", "1802"],
                        correctAnswer: 0,
                        points: 200
                    },
                    {
                        id: 12,
                        text: "Кто автор романа 'Мастер и Маргарита'?",
                        options: ["Михаил Булгаков", "Борис Пастернак", "Владимир Набоков", "Максим Горький"],
                        correctAnswer: 0,
                        points: 300
                    }
                ]
            }
        ]
    };
}

// Сохранение состояния игры в localStorage
function saveGameState(gameState) {
    try {
        localStorage.setItem('gameState', JSON.stringify(gameState));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения состояния игры:', error);
        return false;
    }
}

// Загрузка состояния игры из localStorage
function loadGameState() {
    try {
        const data = localStorage.getItem('gameState');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Ошибка загрузки состояния игры:', error);
        return null;
    }
}

// Очистка состояния игры
function clearGameState() {
    try {
        localStorage.removeItem('gameState');
        return true;
    } catch (error) {
        console.error('Ошибка очистки состояния игры:', error);
        return false;
    }
}

// Проверка, отвечен ли вопрос
function isQuestionAnswered(gameState, questionId) {
    return gameState.answeredQuestions.includes(questionId);
}

// Добавление отвеченного вопроса
function markQuestionAsAnswered(gameState, questionId) {
    if (!isQuestionAnswered(gameState, questionId)) {
        gameState.answeredQuestions.push(questionId);
    }
}

// Обновление счета игрока
function updatePlayerScore(gameState, playerId, points) {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.score += points;
    }
}

// Переход к следующему игроку
function nextPlayer(gameState) {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
}

// Получение текущего игрока
function getCurrentPlayer(gameState) {
    return gameState.players[gameState.currentPlayer];
}

// Проверка завершения игры
function isGameFinished(gameState, totalQuestions) {
    return gameState.answeredQuestions.length >= totalQuestions;
}
