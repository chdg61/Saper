/*function draw() {
     var canvas = document.getElementById("canvas");
     var ctx = canvas.getContext("2d");

     ctx.fillStyle = "rgb(200,0,0)";
     ctx.fillRect (10, 10, 55, 50);

     ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
     ctx.fillRect (30, 30, 55, 50);
}*/
(function(window){
    window.init = function(){
        "use strict";

        var saper = new Saper("saper",{
            "width":320,
            "height":320
        });
    };

    /**
     * @param {Object} params
     * @param {String} idDivElement
     * @constructor
     */
    function Saper(idDivElement,params){

        /**
         * @type {{rows: Number, cols: Number, padding: Number, mine_count: Number, width: Number, height: Number}}
         */
        this.params = {
            "rows": params.rows?parseInt(params.rows,10):9, // кол-во строк
            "cols": params.cols?parseInt(params.cols,10):9, // кол-во столбцов
            "padding": params.padding?parseInt(params.padding,10):10, // отступ поля
            "mine_count": params.mine_count?parseInt(params.mine_count,10):10, // кол-во мин
            "width": params.width?parseInt(params.width,10):320,
            "height": params.height?parseInt(params.height,10):320
        };

        /**
         * Общее число ячеек
         * @type {number}
         * @private
         */
        this._countСeil = this.params.cols * this.params.rows;

        /**
         * Номера ячеек которые содержат мины
         *
         * @type {Array}
         * @private
         */
        this._arNumbersFieldForMine = [];

        /**
         * Список объектов строк
         *
         * @type {Row[]}
         * @private
         */
        this._arRows = [];

        // объект списка ячеек, разделённый на строки и столбцы
        this._obAllCeil = {};

        /**
         * Объект ячеек с расставленными пользователем минами
         * @type {Ceil[]}
         * @private
         */
        this._selectedMineCeil = [];

        /**
         * Число проставленных мин пользователя
         *
         * @type {number}
         * @private
         */
        this._countSelectetMine = 0;

        /**
         * ID интервала таймера
         *
         * @type {boolean}
         * @private
         */
        this._timerId = false;
        /**
         * начало с 1й секунды
         *
         * @type {number}
         * @private
         */
        this._timeBegin = 1;

        /**
         * Ширина ячейки
         *
         * @type {number}
         * @private
         */
        this._ceilWidth = (this.params.width - this.params.padding) / this.params.cols;

        /**
         * Высота ячейки
         *
         * @type {number}
         * @private
         */
        this._ceilHeight = (this.params.height - this.params.padding) / this.params.rows;

        /**
         * @type {HTMLElement}
         */
        this.canvas = document.getElementById(idDivElement);

        /**
         * @type {CanvasRenderingContext2D}
         */
        this.context = this.canvas.getContext("2d");

        this.canvas.style.width = 320;
        this.canvas.style.height = 320;

        // рассчет мин
        this.createMine();

        // заполняем поле
        this.drawPole();

        this._createEvent();

        /* вспомогательный метод роспечатки объёкта */
        function join_(obj,n){
            if(n!="|"){
                n = "\n";
            }
            var ser = "";

            for (var i in obj){
                if (obj.hasOwnProperty(i)){
                    ser += n + ((typeof obj[i]=="object")?join_(obj[i],"|"):obj[i]);
                }
            }
            return ser.slice(n.length);
        }
    }

    /**
     *  Создание поля случайных мин
     **/
    Saper.prototype.createMine = function(){
        var numberRow,numberCeil, obCeil;

        // формируем случайные мины на поле
        this._createRandomMineArray();

        // создаём объекты строк
        for(numberRow = 0; numberRow < this.params.rows; numberRow++){
            this._arRows[numberRow] = new Row(numberRow);
            // пробегаем по строкам и создаём объекты ячеек
            for(numberCeil = 0; numberCeil < this.params.cols; numberCeil++){
                obCeil = this._arRows[numberRow].createCeil(numberCeil);
                obCeil.setNumber(((numberRow - 1)*this.params.cols) + numberCeil);

                if(this._arNumbersFieldForMine.indexOf(obCeil.getNumber()) !== -1){
                    obCeil.setMine(this);
                }
            }
        }
    };

    /**
     * Зарисовывем полностью холст
     */
    Saper.prototype.drawPole = function(){
        // добавляем к игре панель с информацией
        this.canvas.parentNode.insertBefore(this._createDivInfo(),this.canvas);

        // закрашиваем холст
        this.context.fillStyle = "#DCDCDC";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // закрашиваем поле ячеек
        this.context.fillStyle = "#E9E9E9";
        this.context.fillRect(5,5,this.canvas.width-10, this.canvas.height-10);

        for(var numberRow=0;numberRow < this._arRows.length; numberRow++){
            var _listCeil = this._arRows[numberRow].getListCeil();
            for(var numberCeil in _listCeil){
                this._drawCeil(
                    (this.params.padding / 2) + numberRow * this._ceilWidth,
                    (this.params.padding / 2) + numberCeil * this._ceilHeight,
                    this._ceilWidth,
                    this._ceilHeight
                );
            }
        }
    };

    /**
     * Формируем случайные мины на поле
     *
     * @private
     */
    Saper.prototype._createRandomMineArray = function(){
        "use strict";
        for(var i = 0; i < this.params.mine_count; i++){
            this._arNumbersFieldForMine.push(this._randomNumberCeilOnMine());
        }
    };

    /**
     * Генеририрует случайный номер ячейки где будет располагаться мина
     * С проверкой его не вхождения в общую базу сгенерированных номеров
     *
     * @returns {Number}
     * @private
     */
    Saper.prototype._randomNumberCeilOnMine = function(){
        "use strict";
        var randomNumberCeil = Math.floor(Math.random() * this._countСeil);
        var isFindElement = this._arNumbersFieldForMine.some(function(element){
            return element === randomNumberCeil;
        });

        if(randomNumberCeil === 0 || randomNumberCeil > this._countСeil || isFindElement){
            return this._randomNumberCeilOnMine();
        }else{
            return randomNumberCeil;
        }
    };

    /**
     * Создание дива с информацией
     *
     * @param {String} divId
     * @param {String} background
     * @returns {HTMLElement}
     * @private
     */
    Saper.prototype._createDivInfo = function(divId,background){
        var div_info = document.createElement("div");
        div_info.id = divId || "mess";
        div_info.style.width = this.params.width + "px";
        div_info.style.height = "60px";
        div_info.style.background = background || "#DCDCDC";
        div_info.innerHTML = "<table style='width:100%;height:100%;'>"+
            "<tr><th width='33%'>"+
            "<input value='000' type='text' id='time' style='font-size:33px;width:54px;height:40px;' readonly=true/>"+
            "</th><th width='33%'>"+
            "<a href='#'>NEW</a>"+
            "</th><th width='33%'>"+
            "<input value='00/10' type='text' id='mine_pole' style='font-size:33px;width:88px;height:40px;' readonly=true/>"+
            "</th></tr></table>";

        return div_info;
    };
    /**
     * Отрисовываем ячейку на холсте
     *
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @private
     */
    Saper.prototype._drawCeil = function(x,y,width,height){
        this.context.strokeRect(x,y,width,height);
        this.context.strokeStyle="#000";
    };
    /**
     * Создаём события кликов мышки
     *
     * @private
     */
    Saper.prototype._createEvent = function(){
        "use strict";

        // обработка левого клика
        var this_ = this;
        this.canvas.onclick = function(event){
            var row_and_cols_ceil = this_.getRowAndColsOnCoordinateClick(event.pageX,event.pageY); // координаты ячейки
            this_.openCeil(row_and_cols_ceil.row,row_and_cols_ceil.col);
            //timer("on");
            return false;
        };

        // обработка правого клика
        this.canvas.oncontextmenu = function(event){
            var row_and_cols_ceil = this_.getRowAndColsOnCoordinateClick(event.pageX,event.pageY); // координаты ячейки
            this_.setMine(row_and_cols_ceil.row,row_and_cols_ceil.col);
            return false;
        };
    };

    /**
     * Определяет номер столбца и номер строки ячейки по x и y координатам
     *
     * @param {number} x
     * @param {number} y
     * @returns {{col: number, row: number}}
     */
    Saper.prototype.getRowAndColsOnCoordinateClick = function(x,y){
        x = x - this.context.canvas.offsetLeft - this.params.padding/2;
        y = y - this.context.canvas.offsetTop - this.params.padding/2;
        return {
            "col": (Math.ceil(x/this._ceilWidth) > this.params.cols? 0 : Math.ceil(x/this._ceilWidth)),
            "row": (Math.ceil(y/this._ceilHeight) > this.params.rows? 0 :Math.ceil(y/this._ceilHeight))
        };
    };
    /**
     * Обработка действий при нажатии левой клавиши, открытие полей
     *
     * @param {number} numberRow
     * @param {number} numberCeil
     */
    Saper.prototype.openCeil = function(numberRow,numberCeil){
        var obRow,obCeil,listAroundCeil,countMine;
        var this_ = this;

        numberRow = parseInt(numberRow,10) || 0;
        numberCeil = parseInt(numberCeil,10) || 0;
        if(this._arRows[numberRow]){
            obRow = this._arRows[numberRow];
            obCeil = obRow.getCeil(numberCeil);
            if(obCeil){
                this._timerStart();
                // если на ячейки стоит что мина
                if(obCeil.isUserSelectMine()){
                    return false;
                }
                // если ячейка является миной
                if(obCeil.isMine()){
                    this._gameOver();
                }

                listAroundCeil = this._findAroundCeil(obCeil);
                listAroundCeil.forEach(function(innerCeil,index){
                    "use strict";
                    if(innerCeil.isMine()){
                        countMine++;
                    }
                });

                obCeil.setCountMineAround(countMine);
                obCeil.open();


                // если ноль мин в ячейки
                if(countMine === 0){
                    this._drawOpenCeilEmpty(obCeil);
                    listAroundCeil.forEach(function(innerCeil,index){
                        "use strict";
                        if(!innerCeil.isMine() && !innerCeil.isUserSelectMine() && !innerCeil.isOpen()){
                            this_.openCeil(innerCeil.getRow().getNumber(),innerCeil.getNumberInRow());
                        }
                    });
                }else{
                    this._drawOpenCeil(obCeil);
                }
            }
        }
    };
    /**
     * Находим ячейки рядом с текущей
     *
     * @param {Ceil} obCeil
     * @returns {Ceil[]}
     * @private
     */
    Saper.prototype._findAroundCeil = function(obCeil){
        "use strict";
        var listCeil = [];
        var _ceil,_row, countMine = 0;

        // смотрим левую ячейку
        if(obCeil.getNumberInRow() > 0){
            _ceil = obCeil.getRow().getCeil(obCeil.getNumberInRow() -1);
            if(_ceil){
                listCeil.push(_ceil);
            }
        }
        // смотрим правую ячейку
        _ceil = obCeil.getRow().getCeil(obCeil.getNumberInRow() + 1);
        if(_ceil){
            listCeil.push(_ceil);
        }

        // смотрим верхний ряд
        if(obCeil.getRow().getNumber() > 0){
            _row = this._arRows[obCeil.getRow().getNumber() - 1];
            if(_row){
                // смотрим левую верхнюю ячейку
                if(obCeil.getNumberInRow() > 0){
                    _ceil = _row.getCeil(obCeil.getNumberInRow() - 1);
                    if(_ceil){
                        listCeil.push(_ceil);
                    }
                }
                // смотрим среднюю верхнюю ячейку
                _ceil = _row.getCeil(obCeil.getNumberInRow());
                if(_ceil){
                    listCeil.push(_ceil);
                }
                // смотрим правую верхнюю ячейку
                _ceil = _row.getCeil(obCeil.getNumberInRow() + 1);
                if(_ceil){
                    listCeil.push(_ceil);
                }
            }
        }
        // смотрим нижний ряд
        _row = this._arRows[obCeil.getRow().getNumber() + 1];
        if(_row){
            // смотрим левую нижнюю ячейку
            if(obCeil.getNumberInRow() > 0){
                _ceil = _row.getCeil(obCeil.getNumberInRow() - 1);
                if(_ceil){
                    listCeil.push(_ceil);
                }
            }
            // смотрим среднюю нижнюю ячейку
            _ceil = _row.getCeil(obCeil.getNumberInRow());
            if(_ceil){
                listCeil.push(_ceil);
            }
            // смотрим правую нижнюю ячейку
            _ceil = _row.getCeil(obCeil.getNumberInRow() + 1);
            if(_ceil){
                listCeil.push(_ceil);
            }
        }

        return listCeil;
    };
    /**
     * Закрашиваем пустую ячейку
     *
     * @param {Ceil} obCeil
     * @private
     */
    Saper.prototype._drawOpenCeilEmpty = function(obCeil){
        "use strict";
        // закрашиваем белый что открыто
        this.context.clearRect((this.params.padding/2) + (obCeil.getNumberInRow() - 1)*this._ceilWidth, (this.params.padding/2) + (obCeil.getRow().getNumber() - 1)*this._ceilHeight, this._ceilWidth, this._ceilHeight);
        this.context.fillStyle = "#fff"; // белый
        this.context.fillRect((this.params.padding/2) + (obCeil.getNumberInRow() - 1)*this._ceilWidth, (this.params.padding/2) + (obCeil.getRow().getNumber() - 1)*this._ceilHeight, this._ceilWidth, this._ceilHeight);
        this.context.strokeStyle = "#000";
        this.context.strokeRect((this.params.padding/2) + (obCeil.getNumberInRow() - 1)*this._ceilWidth, (this.params.padding/2) + (obCeil.getRow().getNumber() - 1)*this._ceilHeight, this._ceilWidth, this._ceilHeight);
    };
    /**
     *  Закрашиваем ячейку с цифрой
     *
     * @param {Ceil} obCeil
     * @private
     */
    Saper.prototype._drawOpenCeil = function(obCeil){
        "use strict";
        // Закрашимваем в белый
        this.context.clearRect((this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth,(this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
        this.context.fillStyle="#fff";
        this.context.fillRect((this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth,(this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
        this.context.strokeStyle="#000";
        this.context.strokeRect((this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth,(this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);

        // закрашиваем цифры
        this.context.font = "bold 13px Sans";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        switch(obCeil.getCountMineAround()){
            case 1:
                this.context.fillStyle = "#222";
                break;
            case 2:
                this.context.fillStyle = "#2f2";
                break;
            case 3:
                this.context.fillStyle = "#f22";
                break;
            case 4:
                this.context.fillStyle = "#22f";
                break;
            case 5:
                this.context.fillStyle = "#220";
                break;
            case 6:
                this.context.fillStyle = "#022";
                break;
            case 7:
                this.context.fillStyle = "#202";
                break;
            case 8:
                this.context.fillStyle = "#2H2";
                break;
            default:
                this.context.fillStyle = "#2HH";
                break;
        }
        this.context.fillText(obCeil.getCountMineAround(), (this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth+this._ceilWidth/2, (this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight+this._ceilHeight/2);
    };

    /**
     * Ставим мины на поле
     *
     * @param {number} numberRow
     * @param {number} numberCeil
     */
    Saper.prototype.setMine = function(numberRow,numberCeil){
        var obRow,obCeil;
        var this_ = this;

        numberRow = parseInt(numberRow,10) || 0;
        numberCeil = parseInt(numberCeil,10) || 0;
        if(this._arRows[numberRow]){
            obRow = this._arRows[numberRow];
            obCeil = obRow.getCeil(numberCeil);
            if(obCeil && !obCeil.isOpen()){
                // ставит минут
                if(!obCeil.isUserSelectMine()){
                    obCeil.setUserSelectMine(true);
                    this._drawOnFlagMine(obCeil);
                    this._addSelectedMine(obCeil);
                    this._checkSelectedMine(true);
                // убираем мину
                }else{
                    obCeil.setUserSelectMine(false);
                    this._drawOffFlagMine(obCeil);
                    this._deleteSelectedMine(obCeil);
                    this._checkSelectedMine(false);
                }
            }
        }
    };
    /**
     * Ставим крыюик мины пользователя
     *
     * @param {Ceil} obCeil
     * @private
     */
    Saper.prototype._drawOnFlagMine = function(obCeil){
        "use strict";
        this.context.beginPath();
        this.context.fillStyle = "red";
        this.context.arc((this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth+this._ceilWidth/2, (this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight+this._ceilHeight/2,this._ceilHeight/3,0,Math.PI*2,true);
        this.context.fill();
    };
    /**
     * Убираем крыюик мины пользователя
     *
     * @param {Ceil} obCeil
     * @private
     */
    Saper.prototype._drawOffFlagMine = function(obCeil){
        "use strict";
        this.context.clearRect((this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth,(this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
        this.context.fillStyle="#E9E9E9";
        this.context.fillRect((this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth,(this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
        this.context.strokeStyle="#000";
        this.context.strokeRect((this.params.padding/2)+(obCeil.getNumberInRow()-1)*this._ceilWidth,(this.params.padding/2)+(obCeil.getRow().getNumber()-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
    };
    /**
     * учитывает число проставленных мин, для победы
     *
     * @param {boolean} isMine
     */
    Saper.prototype._checkSelectedMine = function(isMine){
        "use strict";
        var _countRulesMine = 0;

        if(isMine === true){
            this._countSelectetMine++;
            document.getElementById("mine_pole").value = ((this._countSelectetMine < this.params.mine_count)?"0":"") + this._countSelectetMine+"/"+this.params.mine_count;
        }
        if(isMine === false){
            this._countSelectetMine--;
            document.getElementById("mine_pole").value=((this._countSelectetMine < this.params.mine_count)?"0":"") + this._countSelectetMine+"/"+this.params.mine_count;
        }

        // проверям кол-во проставленных и всего и проверяем на правильность
        if(this._countSelectetMine === this.params.mine_count){
            this._selectedMineCeil.forEach(function(obCeil){
                "use strict";
                if(obCeil.isMine() && obCeil.isUserSelectMine()){
                    _countRulesMine++;
                }
            });

            if(_countRulesMine === this.params.mine_count){
                this._winner();
            }
        }
    };
    /**
     * Добавляем ячейку в выбранные пользователем
     *
     * @param {Ceil} obCeil
     * @private
     */
    Saper.prototype._addSelectedMine = function(obCeil){
        "use strict";
        this._selectedMineCeil.push(obCeil);
    };
    /**
     * Удаляем ячейку из выбранных пользователем
     *
     * @param {Ceil} obCeil
     * @private
     */
    Saper.prototype._deleteSelectedMine = function(obCeil){
        "use strict";
        for(var i = 0;i < this._selectedMineCeil.length;i++){
            if(this._selectedMineCeil[i] === obCeil){
                this._selectedMineCeil.slice(0,i).concat(this._selectedMineCeil.slice(i+1))
                return;
            }
        }
    };
    Saper.prototype._gameOver = function(){
        "use strict";
        this.context.fillStyle = "rgba(255,0,0,0.5)";
        this.context.fillRect((this.params.padding/2),(this.params.padding/2),this.context.canvas.width-this.params.padding, this.context.canvas.height-this.params.padding);
        this.context.font = "bold 26px Sans";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#000";
        this.context.fillText("Game Over",this.context.canvas.width/2, this.context.canvas.height/2);
        this.context.canvas.onclick=function(){return false;}
        this.context.canvas.oncontextmenu=function(){return false;}
        this._timerStop();
    };
    Saper.prototype._winner = function(){
        "use strict";
        this.context.fillStyle = "rgba(0,255,0,0.5)";
        this.context.fillRect((this.params.padding/2),(this.params.padding/2),this.context.canvas.width-this.params.padding, this.context.canvas.height-this.params.padding);
        this.context.font = "bold 26px Sans";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#000";
        this.context.fillText("Победа!!!!",this.context.canvas.width/2, this.context.canvas.height/2);
        this.context.canvas.onclick=function(){return false;}
        this.context.canvas.oncontextmenu=function(){return false;}
        this._timerStop();
    };
    /**
     * Включает таймер игры
     *
     * @private
     */
    Saper.prototype._timerStart = function(){
        "use strict";
        if(this._timerId === false && this._timeBegin === 1){
            var this_ = this;
            this._timerId = setInterval(function(){
                document.getElementById("time").value = this_._formatTime();
                this_._timeBegin++;
            },1000);
        }
    };
    /**
     * Выключает таймер игры
     * @private
     */
    Saper.prototype._timerStop = function(){
        "use strict";
        if(this._timerId !== false){
            clearInterval(this._timerId);
        }
    };
    /**
     * Формирует время из числа в строку из 3х символов
     *
     * @returns {string}
     * @private
     */
    Saper.prototype._formatTime = function(){
        "use strict";
        var time = this._timeBegin.toString();
        // формирует цифры в 000
        for(var i = 0; i < (3 - this._timeBegin.toString().length); i++){
            time = "0".concat(time);
        }
        return time.toString();
    };

    /**
     * Класс строки
     *
     * @param {number} number_row
     * @constructor
     */
    function Row(number_row){
        "use strict";

        /**
         * @type {number}
         * @private
         */
        this._number = parseInt(number_row,10) || 0;

        /**
         * @type {Ceil}
         * @private
         */
        this._obCeilList = {};
    }

    /**
     * Создаёт ячейку в строку
     *
     * @param {number} number_ceil
     * @returns {Ceil}
     */
    Row.prototype.createCeil = function(number_ceil){
        "use strict";
        number_ceil = parseInt(number_ceil,10) || 0;
//        if(number_ceil<=0){
//            return false;
//        }

        this._obCeilList[number_ceil] = new Ceil(number_ceil);
        this._obCeilList[number_ceil].setRow(this);
        return this._obCeilList[number_ceil];
    };
    /**
     * Получает объект ячейки в строке
     *
     * @param {number} number_ceil
     * @returns {Ceil}
     */
    Row.prototype.getCeil = function(number_ceil){
        "use strict";
        number_ceil = parseInt(number_ceil,10) || 0;
        if(this._obCeilList[number_ceil]){
            return this._obCeilList[number_ceil];
        }

        return false;
    };
    /**
     * Возвращает объект списка ячеек
     *
     * @returns {Ceil}
     */
    Row.prototype.getListCeil = function(){
        "use strict";
        return this._obCeilList;
    };
    /**
     * @returns {number}
     */
    Row.prototype.getNumber = function(){
        "use strict";
        return (parseInt(this._number,10) || 0);
    };

    /**
     * Объект ячейки
     *
     * @param {number} number_ceil_in_row
     * @constructor
     */
    function Ceil(number_ceil_in_row){
        "use strict";

        /**
         * @type {number}
         * @private
         */
        this._numberInRow = parseInt(number_ceil_in_row,10) || 0;

        /**
         * Номер ячейки по порядку, среди всех ячеек
         *
         * @type {number}
         * @private
         */
        this._numberOnAllCeil = 0;

        /**
         * @type {boolean}
         * @private
         */
        this._isMine = false;

        /**
         * @type {boolean}
         * @private
         */
        this._isOpen = false;

        /**
         * @type {number}
         * @private
         */
        this._numberMineAround = 0;

        /**
         * @type {boolean}
         * @private
         */
        this._userSelectIsMine = false;

        /**
         * @type {Row}
         * @private
         */
        this._obRow = {};
        /**
         * @type {number}
         * @private
         */
        this._counMineAround = 0;
    }
    /**
     * Задаём, что ячефка является миной
     *
     * @param {boolean} $is_mine
     */
    Ceil.prototype.setMine = function($is_mine){
        "use strict";
        this._isMine = ($is_mine === true);
    };
    /**
     * Проверка является ли ячейка миной
     *
     * @returns {boolean}
     */
    Ceil.prototype.isMine = function(){
        "use strict";
        return this._isMine;
    };
    /**
     * Задаём строчку ячейки
     * @param {Row} obRow
     */
    Ceil.prototype.setRow = function(obRow){
        "use strict";
        this._obRow = obRow;
    };
    /**
     * @returns {Row}
     */
    Ceil.prototype.getRow = function(){
        "use strict";
        return this._obRow;
    };
    /**
     * Задать номер ячейки среди всех ячеек вообще
     *
     * @param {number} number_ceil
     */
    Ceil.prototype.setNumber = function(number_ceil){
        "use strict";
        this._numberOnAllCeil = parseInt(number_ceil,10) || 0;
    };
    /**
     * @returns {number}
     */
    Ceil.prototype.getNumber = function(){
        "use strict";
        return this._numberOnAllCeil;
    };
    /**
     * Получить номер ячейки в строке
     *
     * @returns {number}
     */
    Ceil.prototype.getNumberInRow = function(){
        "use strict";
        return this._numberInRow;
    };
    /**
     * Открыть ячейку
     */
    Ceil.prototype.open = function(){
        "use strict";
        this._isOpen = true;
    };
    /**
     * @returns {boolean}
     */
    Ceil.prototype.isOpen = function(){
        "use strict";
        return this._isOpen;
    };
    /**
     * Отметить что пользвоатель поставил сюда мину
     *
     * @param {boolean} is_mine
     */
    Ceil.prototype.setUserSelectMine = function(is_mine){
        "use strict";
        if(this._isOpen === false){
            this._userSelectIsMine = (is_mine === true);
        }
    };
    /**
     * Првоеряка поставил ли пользователь мину сюда или нет
     *
     * @returns {boolean}
     */
    Ceil.prototype.isUserSelectMine = function(){
        "use strict";
        return this._userSelectIsMine;
    };
    /**
     * Задаём кол-во мин в ячейки
     *
     * @param {number} count_mine
     */
    Ceil.prototype.setCountMineAround = function(count_mine){
        "use strict";
        this._counMineAround = parseInt(count_mine,10) || 0;
    };
    /**
     * @returns {number}
     */
    Ceil.prototype.getCountMineAround = function(){
        "use strict";
        return this._counMineAround;
    };
})(window);