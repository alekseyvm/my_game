// Game setup module
class GameSetup {
    constructor() {
        // DOM elements
        this.playerCountInput = document.getElementById('playerCount');
        this.playerNamesContainer = document.getElementById('playerNames');
        this.startGameButton = document.getElementById('startGame');
        this.questionBaseSelect = document.getElementById('questionBase');
        this.fileInput = document.getElementById('fileInput');
        this.uploadFileBtn = document.getElementById('uploadFileBtn');
        this.clearUploadedBtn = document.getElementById('clearUploadedBtn');
        this.uploadedFileInfo = document.getElementById('uploadedFileInfo');
        this.useLocalBaseRadio = document.getElementById('useLocalBase');
        this.useFileUploadRadio = document.getElementById('useFileUpload');
        this.localBaseSection = document.getElementById('localBaseSection');
        this.fileUploadSection = document.getElementById('fileUploadSection');
        
        // State
        this.uploadedQuestionsData = null;
        this.uploadedFileName = '';
        
        // Initialize
        this.initEventListeners();
        this.generatePlayerInputs(2);
        this.loadQuestionBases();
        this.toggleSourceMode();
    }
    
    initEventListeners() {
        // File upload listeners
        this.uploadFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.clearUploadedBtn.addEventListener('click', () => this.clearUploadedFile());
        
        // Source mode listeners
        this.useLocalBaseRadio.addEventListener('change', () => this.toggleSourceMode());
        this.useFileUploadRadio.addEventListener('change', () => this.toggleSourceMode());
        
        // Player count listener
        this.playerCountInput.addEventListener('change', (e) => this.handlePlayerCountChange(e));
        
        // Question base listener
        this.questionBaseSelect.addEventListener('change', () => this.validateForm());
        
        // Start game listener
        this.startGameButton.addEventListener('click', () => this.startGame());
    }
    
    toggleSourceMode() {
        const useLocal = this.useLocalBaseRadio.checked;
        if (useLocal) {
            this.localBaseSection.style.display = 'block';
            this.fileUploadSection.style.display = 'none';
            this.clearUploadedFile();
        } else {
            this.localBaseSection.style.display = 'none';
            this.fileUploadSection.style.display = 'block';
            this.questionBaseSelect.selectedIndex = -1;
        }
        this.validateForm();
    }
    
    clearUploadedFile() {
        this.uploadedQuestionsData = null;
        this.uploadedFileName = '';
        this.fileInput.value = '';
        this.clearUploadedBtn.style.display = 'none';
        this.uploadedFileInfo.style.display = 'none';
        this.uploadedFileInfo.className = 'uploaded-file-info';
        this.uploadedFileInfo.textContent = '';
    }
    
    showFileError(message) {
        this.uploadedFileInfo.style.display = 'flex';
        this.uploadedFileInfo.className = 'uploaded-file-info error';
        this.uploadedFileInfo.innerHTML = message;
        this.uploadedQuestionsData = null;
        this.uploadedFileName = '';
        this.clearUploadedBtn.style.display = 'inline-block';
        this.validateForm();
    }
    
    showFileSuccess(fileName, subject) {
        this.uploadedFileInfo.style.display = 'flex';
        this.uploadedFileInfo.className = 'uploaded-file-info success';
        this.uploadedFileInfo.innerHTML = ` ${fileName} (${subject || 'Загруженная база'})`;
        this.clearUploadedBtn.style.display = 'inline-block';
    }
    
    validateForm() {
        const useLocal = this.useLocalBaseRadio.checked;
        let isValid = true;
        if (useLocal) {
            isValid = this.questionBaseSelect.value !== '';
        } else {
            isValid = this.uploadedQuestionsData !== null;
        }
        this.startGameButton.disabled = !isValid;
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            const validation = this.validateQuestionsFile(data);
            
            if (!validation.valid) {
                this.showFileError(`Ошибка валидации: ${validation.error}.<br><br>Загрузите другой файл или выберите базу вопросов из списка.`);
                return;
            }
            
            this.uploadedQuestionsData = data;
            this.uploadedFileName = file.name;
            
            this.showFileSuccess(file.name, data.subject);
            this.validateForm();
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            this.showFileError('Ошибка при чтении файла: некорректный JSON формат');
        }
    }
    
    validateQuestionsFile(data) {
        const errors = [];
        
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Некорректный формат данных: ожидается JSON объект' };
        }
        
        if (!data.categories || !Array.isArray(data.categories)) {
            return { valid: false, error: 'Отсутствует поле "categories" или оно не является массивом' };
        }
        
        if (data.categories.length === 0) {
            return { valid: false, error: 'Массив категорий не может быть пустым' };
        }
        
        for (let i = 0; i < data.categories.length; i++) {
            const category = data.categories[i];
            const catNum = i + 1;
            
            if (!category.id) {
                errors.push(`Категория ${catNum}: отсутствует поле "id"`);
            }
            if (!category.name || typeof category.name !== 'string') {
                errors.push(`Категория ${catNum}: отсутствует или некорректно поле "name"`);
            }
            if (!category.questions || !Array.isArray(category.questions)) {
                errors.push(`Категория ${catNum}: отсутствует или некорректно поле "questions"`);
            } else if (category.questions.length === 0) {
                errors.push(`Категория ${catNum}: массив вопросов не может быть пустым`);
            } else {
                for (let j = 0; j < category.questions.length; j++) {
                    const question = category.questions[j];
                    const qNum = j + 1;
                    
                    if (!question.text || typeof question.text !== 'string') {
                        errors.push(`Категория ${catNum}, вопрос ${qNum}: отсутствует или некорректно поле "text"`);
                    }
                    if (!question.options || !Array.isArray(question.options)) {
                        errors.push(`Категория ${catNum}, вопрос ${qNum}: отсутствует или некорректно поле "options"`);
                    } else if (question.options.length < 2) {
                        errors.push(`Категория ${catNum}, вопрос ${qNum}: должно быть минимум 2 варианта ответа`);
                    }
                    if (typeof question.correctAnswer !== 'number') {
                        errors.push(`Категория ${catNum}, вопрос ${qNum}: отсутствует или некорректно поле "correctAnswer"`);
                    } else if (question.correctAnswer < 0 || question.options && question.correctAnswer >= question.options.length) {
                        errors.push(`Категория ${catNum}, вопрос ${qNum}: индекс правильного ответа выходит за пределы вариантов`);
                    }
                    if (typeof question.points !== 'number' || question.points <= 0) {
                        errors.push(`Категория ${catNum}, вопрос ${qNum}: поле "points" должно быть положительным числом`);
                    }
                }
            }
        }
        
        if (errors.length > 0) {
            return { valid: false, error: errors[0] + (errors.length > 1 ? ` (и еще ${errors.length - 1} ошибок)` : '') };
        }
        
        return { valid: true };
    }
    
    async loadQuestionBases() {
        try {
            let files = await getAvailableQuestionFiles();
            
            if (!files || files.length === 0) {
                files = [
                    { name: 'history1.json', path: 'data/history1.json', subject: 'История' },
                    { name: 'math1.json', path: 'data/math1.json', subject: 'Математика' }
                ];
            }
            
            this.questionBaseSelect.innerHTML = '';
            
            if (!files || files.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Базы вопросов не найдены';
                this.questionBaseSelect.appendChild(option);
                return;
            }
            
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file.path;
                option.textContent = file.subject || file.name;
                this.questionBaseSelect.appendChild(option);
            });
            this.validateForm();
        } catch (e) {
            console.error('Критическая ошибка загрузки баз вопросов:', e);
            this.questionBaseSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    }
    
    generatePlayerInputs(count) {
        this.playerNamesContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label for="player${i}">Имя игрока ${i}:</label>
                <input type="text" id="player${i}" placeholder="Игрок ${i}" value="Игрок ${i}">
            `;
            this.playerNamesContainer.appendChild(div);
        }
    }
    
    handlePlayerCountChange(event) {
        const count = parseInt(event.target.value);
        if (count >= 2 && count <= 6) {
            this.generatePlayerInputs(count);
        }
    }
    
    startGame() {
        const playerCount = parseInt(this.playerCountInput.value);
        const players = [];
        for (let i = 1; i <= playerCount; i++) {
            const name = document.getElementById(`player${i}`).value.trim();
            players.push({ id: i, name: name || `Игрок ${i}`, score: 0 });
        }

        const gameState = {
            players: players,
            currentPlayer: 0,
            currentQuestion: null,
            answeredQuestions: [],
            gameStatus: 'playing'
        };
        
        if (this.useLocalBaseRadio.checked) {
            const selectedBase = this.questionBaseSelect.value;
            if (!selectedBase) {
                alert('Пожалуйста, выберите базу вопросов');
                return;
            }
            gameState.questionsFile = selectedBase;
        } else {
            if (!this.uploadedQuestionsData) {
                alert('Пожалуйста, загрузите корректный файл с вопросами');
                return;
            }
            gameState.uploadedQuestions = this.uploadedQuestionsData;
            gameState.questionsFile = 'uploaded';
        }

        try {
            if (saveGameState(gameState)) {
                console.log('Game state saved:', gameState);
                window.location.href = 'game.html';
            } else {
                alert('Ошибка сохранения состояния игры. Проверьте настройки localStorage.');
            }
        } catch (e) {
            console.error('Ошибка сохранения состояния игры:', e);
            alert('Ошибка сохранения состояния игры. Проверьте настройки localStorage.');
        }
    }
}

// Initialize game setup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GameSetup();
});