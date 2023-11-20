const modal = document.getElementById("modal");

// Получим DOM-элемент содержимого модального окна
const modalContent = modal.getElementsByClassName("modal-content")[0];

// Получим заголовок модального окна
const h2 = modalContent.children[0];
// Получим форму модального окна
const form = modalContent.children[1];

// получим DOM-элемент списка игроков
const listPlayers = document.getElementsByClassName('players')[0];

// Поле для определения выбора размера сетки (3x3, 4x4 и 5x5)
let selectGrid = null;


// Содержимое самой игры
let game = {
    grid: null, //размер сетки
    rows: null, // кол-во строк
    columns: null, // кол-во столбцов

    ctx: null, // контекст канваса
    players: [], 
    blocks: [], // блоки будут содержать "пустой блок", "x" или "0"
    
    activePlayer: null, // текущий активный игрок
    
    isSecondPlayer: false,

    cellSize: null,
    coordinates: [],
    running: null,
    
    sprites: {
        block: null,
    },
    sounds: {
        win: null,
        click: null,
    },

    init() {
        this.ctx = document.getElementById("mycanvas").getContext("2d");
            
        //Запустим игру
        this.running = true;

        this.players.forEach((player, i) => {
            listPlayers.children[i].innerText = `Игрок N${i+1}: "${player.name}".\nХодит знаком ${player.symbol === 1 ? "X" : "O"}`
        })

        this.loadCoordinates();

        this.ctx.canvas.addEventListener("click", (event) => {
            if(this.running) {
                this.reloadCoordinates(event);
            }
        });
    
    },


    // Метод загрузит координаты расположения каждого блока в сетке
    // чтобы отлавливать события клика по определенному блоку
    loadCoordinates(e) {
    
        if(this.grid) {
            // Заново обнулим массив координат
            this.coordinates = []; 
    
            // Ширина и высота канваса будет зависеть от размера сетки 
            this.ctx.canvas.width = this.grid * 60 + (8 * (this.grid - 1));
            this.ctx.canvas.height = this.grid * 60 + (8 * (this.grid - 1));
            
            this.rows = this.grid;
            this.columns = this.grid;

            // Определим ширину каждого квадрата в канвасе
            this.cellSize = Math.floor(this.ctx.canvas.getBoundingClientRect().width / this.grid);
            
            // Ширина каждой ячейки в сетке
            // 17 - это расстояние между блоками
            let cellWidth = Math.floor(this.cellSize-17);
            

            // Заполним массив координат
            for(let i = 0; i < this.grid; i++) {
                
                let coordinatesRows = [];

                for(let j = 0; j < this.grid; j++) {

                    coordinatesRows.push(
                        {
                            xStart: cellWidth * j,
                            xEnd: (cellWidth *  (j+1)) - 8,
                            yStart: cellWidth * i,
                            yEnd: (cellWidth * (i+1)) - 8
                        }
                    )
                }

                this.coordinates.push(coordinatesRows);
            }//for(i)
            
        }
    },

    // Методы для чередования ходов между игроками
    changeActivePlayer() {
        if(this.activePlayer.name === this.players[0].name) {
            this.activePlayer = this.players[1] 
            
            listPlayers.children[0].classList.remove('players__item--active');
            listPlayers.children[1].classList.add('players__item--active');

            return true;
        } 
        else {
            this.activePlayer = this.players[0]
            
            listPlayers.children[1].classList.remove('players__item--active');
            listPlayers.children[0].classList.add('players__item--active');

            return true;
        }
    },

    // Данный метод срабатывает при клике игрока на пустой блок
    reloadCoordinates(e) {

        // Если событие было "кликом"
        if(e.type === "click") {
            
            // Определим координаты блока на который кликнули
            // по осям X и Y
            let pointX = e.offsetX-30; // Указываем 30, т.к. у канваса свойство "padding" равно 30
            let pointY = e.offsetY-30;
    
            // Переменная найдет кликнутый блок
            let blockFind = null;

            // Найдем соответствующий блок по координатам
            this.coordinates.forEach((coord, i) => {

                // Если объект blockFind пустой, то найдем нужный нам элемент из сетки 
                if(!blockFind) {
                      
                    coord.forEach((item, j) => {
                        // Найдем элемент из подмассива по расположению клика
                        if(
                            (pointX >= item.xStart && item.xEnd >= pointX) 
                                && 
                            (pointY >= item.yStart && pointY < item.yEnd)
                        ) {
                            // Если кликнутый блок был найден, то определим 
                            // его номер строки и столбца в сетке 
                            blockFind = {row: i, col: j};
                        }
                    })
                }
            })

            // Если блок был найден, то пометим его соответствующим символом
            if(blockFind) {

                // Если поле "frame" кликнутого блока, не помечено X 
                // или 0, то значит блок свободный и его можно отметить
                if(this.blocks[blockFind.row][blockFind.col].frame === 0) {

                    this.blocks[blockFind.row][blockFind.col].frame = this.activePlayer.symbol;

                    // Издадим звук клика
                    this.sounds.click.play();

                    let symbol = this.activePlayer.symbol;
                    
                    // После клика на свободный блок проверим совпадении линий по всем осям
                    // чтобы узнать появился ли победитель в игре
                    if(this.checkWin(symbol)) {

                        
                        // Если победитель определился, 
                        // то выведем модальное окно с инфой
                        setTimeout(() => { 
                            h2.innerText = `Игрок "${this.activePlayer.name}" победил!`
                            h2.style.color = "#3774ff";
                            h2.style.fontSize = "28px";
                            modal.classList.add('modal-open');

                            let btn = document.createElement('button');
                            btn.type = "button";
                            btn.classList.add('form__button');
                            btn.classList.add('button');
                            btn.style.backgroundColor = "#00ad1d";
                            btn.innerText = "Начать заново";
                            
                            btn.addEventListener("click", () => {
                                // Перезагрузим страницу
                                window.location.reload();
                            })

                            form.append(btn);

                            // Остановим игру
                            this.end();
                        }, 300);

                        // Издадим звук победы
                        this.sounds.win.play();
                    }
                    else {
                        
                        // Проверим есть ли свободные поля в сетке, если нет 
                        // и победитель не определился, то выставим ничью
                        if(this.isDraw()) {
                            h2.innerText = `Никто не выиграл, итог: ничья!`
                            h2.style.color = "rgb(167 161 42)";
                            h2.style.fontSize = "28px";
                            modal.classList.add('modal-open');

                            let btn = document.createElement('button');
                            btn.type = "button";
                            btn.classList.add('form__button');
                            btn.classList.add('button');
                            btn.style.backgroundColor = "#00ad1d";
                            btn.innerText = "Начать заново";
                            btn.addEventListener("click", () => {
                                // Перезагрузим страницу
                                window.location.reload();
                            })

                            form.append(btn);

                            this.end();
                        }

                        // Если победитель  не определился и блоки не пустые, 
                        // то сменим активного игрока на другого
                        this.changeActivePlayer();
                    }
                }
            }


        }
    },

    // Метод для проверки ничьи
    isDraw() {
        
        for(let row = 0; row < this.grid; row++) {
            for(let col = 0; col < this.blocks[row].length; col++) {
                
                // Если есть свободная ячейка, то игра не завершена
                if(this.blocks[row][col].frame === 0) {
                    return false;
                }
            }
        }

        return true;
    },


    // Проверка на победу одного из игроков
    checkWin(symbol) {
        if(this.checkHorizontalWin(symbol)) {
            return true;
        }
        else if(this.checkVerticalWin(symbol)) {
            return true;
        }
        else if(this.checkDiagonalWin(symbol)) {
            return true;
        }
    },


    // Проверим есть ли выигрышная линия по горизонтали
    checkHorizontalWin(symbol) {
      
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col <= this.columns - this.grid; col++) {
            let isWin = true;
            
            for (let i = 0; i < this.grid; i++) {
              if (this.blocks[row][col + i].frame !== symbol) {
                isWin = false;
                break;
              }
            }
            if (isWin) {
              return true;
            }
          }
        }
      
        return false;
    },
    
    // Проверим есть ли выигрышная линия по вертикали
    checkVerticalWin(symbol) {
      
        for (let col = 0; col < this.columns; col++) {
          for (let row = 0; row <= this.rows - this.grid; row++) {
            let isWin = true;

            for (let i = 0; i < this.grid; i++) {
              if (this.blocks[row + i][col].frame !== symbol) {
                isWin = false;
                break;
              }
            }
            if (isWin) {
              return true;
            }
          }
        }
      
        return false;
    },
    
    // Проверим есть ли выигрышная линия по диагоналям
    checkDiagonalWin(symbol) {

        // Проверка диагоналей справа сверху влево снизу
        for (let row = 0; row <= this.rows - this.grid; row++) {
          for (let col = 0; col <= this.columns - this.grid; col++) {

            let isWin = true;
            
            for (let i = 0; i < this.grid; i++) {
              if (this.blocks[row + i][col + i].frame !== symbol) {
                isWin = false;
                break;
              }
            }
            if (isWin) {
              return true;
            }
          }
        }
      
        // Проверка диагоналей слева сверху вправо снизу
        for (let row = 0; row <= this.rows - this.grid; row++) {
          for (let col = this.grid - 1; col < this.columns; col++) {
            let isWin = true;

            for (let i = 0; i < this.grid; i++) {
              if (this.blocks[row + i][col - i].frame !== symbol) {
                isWin = false;
                break;
              }
            }
            if (isWin) {
              return true;
            }
          }
        }
      
        return false;
    
    },


    // Загрузим во время инициализации игры все медиа-файлы
    preload(callback) {
        let loaded = 0;
        let required = Object.keys(this.sprites).length;
        required += Object.keys(this.sounds).length;

        let onBlobLoad = () => {
            ++loaded;

            if(loaded >= required) {
                callback();
            }
        }

        this.preloadSprites(onBlobLoad);
        this.preloadSounds(onBlobLoad);        
    },

    // Метод для предзагрузки спрайтов (изображений)
    preloadSprites(onBlobLoad) {
        for(let key in this.sprites) {
            this.sprites[key] = new Image();
            this.sprites[key].src = `./images/block.png`;
            this.sprites[key].addEventListener("load", onBlobLoad);
        }
    },

    // Метод для предзагрузки звуков
    preloadSounds(onBlobLoad) {
        for(let key in this.sounds) {
            this.sounds[key] = new Audio(`./sounds/${key}.wav`);
            this.sounds[key].addEventListener("canplaythrough", onBlobLoad, {once: true});
        }
    },

    
    // Метод для создания блоков внутри сетки
    create() {
        for(let row = 0; row < this.grid; row++) {

            let blocksRows = [];
            
            for(let col = 0; col < this.grid; col++) {
                
                // Установим расположение каждого блока в сетке
                let block = {
                    x: 60 * col + 8*col,
                    y: 60 * row + 8*row,
                    width: 60,
                    height: 60,
                    frame: 0, // "frame" означает номер кадра 
                              // в спрайте изображения "block.png", где 0 - пустой блок, 1 - X, 2 - O 
                }

                blocksRows.push(block);
            }

            this.blocks.push(blocksRows);
        }
    },
    
    // Метод для отрисовки блоков сетки внутри канваса
    renderBlocks() {
        for(let block of this.blocks) {

            for(let col = 0; col < block.length; col++) {
                this.ctx.drawImage(
                    this.sprites.block, 
                    block[col].frame * 60, 0, 
                    60, 60, 
                    block[col].x, 
                    block[col].y, 
                    60, 60
                );
            }
        }
    },

    run() {
        // Если игра запущена, то запустим рекурсию покадровой анимации
        if(this.running) {
            window.requestAnimationFrame(() => {
                this.renderBlocks();
                this.run();
            });
        }
    },
    
    // Конец игры
    end() {
        // Остановим игру
        this.running = false;
    },

    start() {
        this.init();
        this.preload(() => {
            this.create(),
            this.run()
        })
    }    
}



// Функция отрисует форму для выбора размера сетки
selectionGrid = () => {
    
    setTimeout(() => {
        h2.innerText = "Выберите размер сетки для игры";
        fadeInElement(h2);

        // Удалим старые элементы из формы
        form.children[0].remove();
        document.getElementById("player").remove();

        // Создадим новые элементы для формы
        const div = document.createElement('div');
        div.style.display = "flex";
        div.style.flexDirection = "row";
        div.style.justifyContent = "center";

        const btn = document.createElement('button');
        btn.type = "button";
        btn.classList.add('form__button');
        btn.classList.add('button');
        btn.innerText = "Подтвердить";
        
        btn.addEventListener('click', () => {
            
            // Если выбор сетки был сделан, то определим рандомом
            // какой именно игрок будет ходить первым
            if(selectGrid !== null) {
                // Установим размер сетки
                game.grid = selectGrid;
                
                // Если метод [randomPlayer] вернул 1, то начинает игру первый игрок
                if(randomPlayer() === 1) {
                    
                    // 1 - значит символ X
                    game.players[0].symbol = 1;
                    
                    // 2 - значит символ 0
                    game.players[1].symbol = 2;

                    game.activePlayer = game.players[0];

                    h2.innerText = `Игрок №1 под ником "${game.players[0].name}" начинает игру и ходит знаком X`;
                    fadeInElement(h2);

                    listPlayers.children[0].classList.add('players__item--active');

                    // Удалим не нужные элементы из формы
                    div.remove();
                    btn.remove();
                }
                
                // Если выпал 2, то начинает игру второй игрок
                else {
                    // 1 - значит символ X
                    game.players[1].symbol = 1;

                    // 2 - значит символ 0
                    game.players[0].symbol = 2;
                    
                    game.activePlayer = game.players[1];
                    
                    h2.innerText = `Игрок №2 под ником "${game.players[1].name}" начинает игру и ходит знаком X`;
                    fadeInElement(h2);

                    listPlayers.children[1].classList.add('players__item--active');
                    
                    // Удалим не нужные элементы из формы
                    div.remove();
                    btn.remove();
                }

                
                setTimeout(() => {
                    let count = 3;

                    const intervalId = setInterval(() => {
                        h2.innerText = `Игра начнется через ${count}...`
                        count -= 1;                        
                    }, 1000);
                    

                    setTimeout(() => {
                        // Закроем модальное окно                        
                        modal.classList.remove('modal-open');
                        
                        clearInterval(intervalId);
                        
                        // Запустим игру
                        game.start();
                    }, 3200);

                }, 2000)


            }
        });

        // Варианты размеров сеток
        const grids = [3, 4, 5];
        
        grids.forEach((value) => {
            const label = document.createElement('label');
            label.setAttribute('for', value);
            label.innerText = `${value}x${value}`;
            label.classList.add('custom-input');

            // При клике на определенный label 
            label.addEventListener('click', () => {
                selectGrid = value;
            })

            const input = document.createElement('input');
            input.setAttribute('id', value);
            input.setAttribute('name', 'grid');
            input.type = "radio";
            input.value = value;
            input.classList.add('hidden-input');

            // По умолчанию выбор будет на сетке 3x3
            if(value === 3) {
                input.focus();
            }

            div.appendChild(input);
            div.appendChild(label);
        });

        
        form.appendChild(div);
        form.appendChild(btn);

    }, 50);

}




// Функция для анимации всплытия элемента
fadeInElement = (element) => {
    element.classList.remove('fade-out');
    element.classList.add('fade-in');
}

// Функция для анимации скрытия элемента
fadeOutElement = (element) => {
    element.classList.remove('fade-in');
    element.classList.add('fade-out');
}

// Функция отобразит ошибку, если имя игрока будет меньше 3-х символов
// и больше 10 символов или если имена игроков совпадают
showError = (input, form, textError) => {
    
    if (!form.children[0].children[1]) {
        const error = document.createElement('span');
        error.innerText = textError;
        error.classList.add("small-error");
        error.classList.add("fade-in");
        input.after(error);
    }

}


// Функция для обработки событий кликов на кнопку "Подтвердить"
handlePlayerButtonClick = (input, form, h2, game) => {
    return function (e) {
        e.preventDefault();

        // Если имя никнейма игрока не меньше 3 и не больше 10 символов 
        if (input.value.length > 2 && input.value.length <= 10) {

            if (form.children[0].children[1]) {
                form.children[0].children[1].remove();
            }

            fadeOutElement(h2);


            // Если мы вводили имя второго игрока, то проверим его соответствие 
            // с именем первого игрока, если имена не совпадают, то занесем второго игрока
            // в массив game.players
            if(game.isSecondPlayer) {
                
                fadeInElement(h2);

                if(game.players[0].name !== input.value) {
            
                    game.players.push({ name: input.value, symbol: null });

                    // Если мы указали имена для двоих игроков, то выведем
                    // модальное окно с выбором размера сетки 
                    if(game.players.length === 2) {
                        selectionGrid();
                    }

                }

                // Иначе выведем ошибку под полем ввода
                else {
                    let textError = "Никнейм второго игрока совпадает с никнеймом первого игрока";
                    showError(input, form, textError);
                }
            }
            // Если ввели имя первого игрока
            else {
                game.players.push({ name: input.value, symbol: null });
                input.value = "";

                getSecondPlayer();
            }

        } 
        else {
            let textError = "Имя игрока должно быть от 3 до 10 символов";
            showError(input, form, textError);
        }
    };
}




// Определяем рандомом, какой символ будет присвоен каждому игроку
randomPlayer = () => {
    // Если выпадет число 1, то начинает игру 1-ый игрок,
    // если выпадет число 2, то начинает игру 2-ый игрок
    let randomSymbol = Math.floor((Math.random() * (2)) + 1);
    return randomSymbol;
}

getSecondPlayer = () => {
    setTimeout(() => {
        h2.innerText = "Введите никнейм для 2 игрока";
        fadeInElement(h2);
        game.isSecondPlayer = true;
    }, 100);    
}

getFirstPlayer = () => {
    const input = form.children[0].children[0];
    const buttonPlayer = form.children[1];

    fadeInElement(h2);
    h2.innerText = "Введите никнейм для 1 игрока";

    buttonPlayer.addEventListener("click", handlePlayerButtonClick(input, form, h2, game));
}

// Запустим приложение
initApp = () => {
    getFirstPlayer();
}


// После загрузки страницы запустим 
// само приложение
window.addEventListener("load", () => {
    initApp();
});


// В случае изменения размера экрана устройства, 
// то изменим сами координаты блоков сетки, чтобы наши клики срабатывали правильно
window.addEventListener("resize", (e) => {
    game.loadCoordinates(e)
});
