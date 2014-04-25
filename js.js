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
            "width":canvas.width,
            "height":canvas.height
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
         * @type {Row}
         * @private
         */
        this._obRows = {};

        // объект списка ячеек, разделённый на строки и столбцы
        this._obAllCeil = {};

        /**
         * Объект ячеек с расставленными пользователем минами
         * @type {Ceil}
         * @private
         */
        this._selectedMineCeil = {};

        /**
         * Число проставленных мин пользователя
         *
         * @type {number}
         * @private
         */
        this._countSelectetMine = 0;

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

        this.timer_id = false; //  ID интервала таймера
        this.time_begin = 1; // начало с 1й секунды









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
            this._obRows[numberRow] = new Row(numberRow);
            // пробегаем по строкам и создаём объекты ячеек
            for(numberCeil = 0; numberCeil < this.params.cols; numberCeil++){
                obCeil = this._obRows[numberRow].createCeil(numberCeil);
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

        for(var numberRow in this._obRows){
            var _listCeil = this._obRows[numberRow].getListCeil();
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
    Saper.prototype._createEvent = function(){
        "use strict";

        // обработка левого клика
        var this_ = this;
        this.canvas.onclick = function(event){
            var ceil = this_.XY_col(event.pageX,event.pageY); // координаты ячейки
            this_.openCl(ceil.y,ceil.x);
            //timer("on");
            return false;
        };

        // обработка правого клика
        this.canvas.oncontextmenu = function(event){
            var ceil = this_.XY_col(event.pageX,event.pageY); // координаты ячейки
            this_.setMine(ceil.y,ceil.x);
            return false;
        };
    };

    /**
     *  Обработка действий при нажатии левой клавиши, открытие полей
     **/
    Saper.prototype.openCl = function(y,x){

        this.timer("on");

        // при нажатии где уже стоит мина
        if(this._selectedMineCeil[y][x] == "X"){
            return;
        }

        // если вдруг....
        if(this._obAllCeil[y][x] == "X"){
            GameOver(); // :(
        }

        // если путое место вообще
        if(this._obAllCeil[y][x] == "#"){
            this._obAllCeil[y][x] = "@"; // отмечаем что открыто
            this._selectedMineCeil[y][x] = "1"; // отмечаем что открыто и на пользовательской карте

            // закрашиваем белый что открыто
            this.context.clearRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
            this.context.fillStyle="#fff"; // белый
            this.context.fillRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
            this.context.strokeStyle="#000";
            this.context.strokeRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);

            // находим соседние пустые и открываем их то же, рекусия функции
            if(y != 1){
                this.openCl(y-1,x);
                if(x != 1){
                    if(typeof this._obAllCeil[y-1][x-1] == "_numberInRow"){
                        this.openCl(y-1,x-1);
                    }
                }
                if(x != this.params.rows){
                    if(typeof this._obAllCeil[y-1][parseInt(x,10)+1]=="_numberInRow"){
                        this.openCl(y-1,parseInt(x,10)+1);
                    }
                }

            }

            if(y != this.params.cols){
                this.openCl(parseInt(y,10)+1,x);
                if(x!=1){
                    if(typeof this._obAllCeil[parseInt(y,10)+1][x-1]=="_numberInRow"){
                        this.openCl(parseInt(y,10)+1,x-1);
                    }
                }
                if(x!=this.params.rows){
                    if(typeof this._obAllCeil[parseInt(y,10)+1][parseInt(x,10)+1]=="_numberInRow"){
                        this.openCl(parseInt(y,10)+1,parseInt(x,10)+1);
                    }
                }
            }

            if(x!=1){
                this.openCl(y,x-1);
            }
            if(x!=this.params.rows){
                this.openCl(y,parseInt(x,10)+1);
            }
        }

        // если у нас цифра
        if(typeof this._obAllCeil[y][x]=="_numberInRow"){

            // Закрашимваем в белый
            this.context.clearRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
            this.context.fillStyle="#fff";
            this.context.fillRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
            this.context.strokeStyle="#000";
            this.context.strokeRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);

            // закрашиваем цифры
            this.context.font = "bold 13px Sans";
            this.context.textAlign = "center";
            this.context.textBaseline = "middle";

            switch(this._obAllCeil[y][x]){
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
            this.context.fillText(this._obAllCeil[y][x], (this.params.padding/2)+(x-1)*this._ceilWidth+this._ceilWidth/2, (this.params.padding/2)+(y-1)*this._ceilHeight+this._ceilHeight/2);
            this._selectedMineCeil[y][x]="1"; // в пользовательском тоже ставим что открыл
        }
    };

    /**
     *  Ставим мины на поле
     **/
    Saper.prototype.setMine=function (y,x){

        // ставит минут
        if((typeof this._obAllCeil[y][x]=="_numberInRow" || this._obAllCeil[y][x]=="#" || this._obAllCeil[y][x]=="X") && this._selectedMineCeil[y][x]==0){
            this._selectedMineCeil[y][x]="X";
            this.context.beginPath();
            this.context.fillStyle = "red";
            this.context.arc((this.params.padding/2)+(x-1)*this._ceilWidth+this._ceilWidth/2, (this.params.padding/2)+(y-1)*this._ceilHeight+this._ceilHeight/2,this._ceilHeight/3,0,Math.PI*2,true);
            this.context.fill();
            this.mine_pole("+");
            // убираем мину
        }else if(this._selectedMineCeil[y][x]=="X" && this._obAllCeil[y][x]!="@"){
            this._selectedMineCeil[y][x]=0;
            this.context.clearRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
            this.context.fillStyle="#E9E9E9";
            this.context.fillRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
            this.context.strokeStyle="#000";
            this.context.strokeRect((this.params.padding/2)+(x-1)*this._ceilWidth,(this.params.padding/2)+(y-1)*this._ceilHeight,this._ceilWidth,this._ceilHeight);
            this.mine_pole("-");
        }
    };

    /**
     *  возвращает координаты (номера) ячейки по x и y
     **/
    Saper.prototype.XY_col = function (x,y){
        x = x - this.context.canvas.offsetLeft - this.params.padding/2;
        y = y - this.context.canvas.offsetTop - this.params.padding/2;
        return {
            "x": (Math.ceil(x/this._ceilWidth) > this.params.cols? 0 : Math.ceil(x/this._ceilWidth)),
            "y": (Math.ceil(y/this._ceilHeight) > this.params.rows? 0 :Math.ceil(y/this._ceilHeight))
        };
    };

    /**
     *  учитывает число проставленных мин,Ю для победы
     **/
    Saper.prototype.mine_pole = function(pm){
        if(pm == "+"){
            this._countSelectetMine++;
            this.document.getElementById("mine_pole").value = ((this._countSelectetMine < this.params.mine_count)?"0":"") + this._countSelectetMine+"/"+this.params.mine_count;
        }
        if(pm == "-"){
            this._countSelectetMine--;
            this.document.getElementById("mine_pole").value=((this._countSelectetMine < this.params.mine_count)?"0":"") + this._countSelectetMine+"/"+this.params.mine_count;
        }

        // проверям кол-во проставленных и всего и проверяем на правильность
        if(this._countSelectetMine == this.params.mine_count){
            var n=0;
            for(var y in this._selectedMineCeil){
                for(var x in this._selectedMineCeil[y]){
                    if(this._selectedMineCeil[y][x]=="X" && this._obAllCeil[y][x]=="X"){
                        n++;
                    }
                }
            }
            if(n == this.params.mine_count){
                this.winner();
            }
        }
    }

    /* проиграл */
    Saper.prototype.GameOver = function(){
        this.context.fillStyle = "rgba(255,0,0,0.5)";
        this.context.fillRect((this.params.padding/2),(this.params.padding/2),this.context.canvas.width-this.params.padding, this.context.canvas.height-this.params.padding);
        this.context.font = "bold 26px Sans";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#000";
        this.context.fillText("Game Over",this.context.canvas.width/2, this.context.canvas.height/2);
        this.context.canvas.onclick=function(){return false;}
        this.context.canvas.oncontextmenu=function(){return false;}
        this.timer("off");
    };

    /* выграл */
    Saper.prototype.winner = function(){
        this.context.fillStyle = "rgba(0,255,0,0.5)";
        this.context.fillRect((this.params.padding/2),(this.params.padding/2),this.context.canvas.width-this.params.padding, this.context.canvas.height-this.params.padding);
        this.context.font = "bold 26px Sans";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#000";
        this.context.fillText("Победа!!!!",this.context.canvas.width/2, this.context.canvas.height/2);
        this.context.canvas.onclick=function(){return false;}
        this.context.canvas.oncontextmenu=function(){return false;}
        this.timer("off");
    };


    /* включаем и выключаем таймер */
    Saper.prototype.timer = function(onoff){
        var this_ = this;
        if(onoff == "on" && !this.timer_id && this.time_begin==1){
            this.timer_id = setInterval(function(){
                document.getElementById("time").value=(function (){
                    var t = this_.time_begin.toString();
                    // формирует цифры в 000
                    for(var i=0; i < (3-this_.time_begin.toString().length); i++){
                        t="0".concat(t);
                    }
                    return t;
                })().toString();
                this.time_begin++;
            },1000);
        }else if(onoff=="off" && this.timer_id){
            clearInterval(this.timer_id);
        }
    };

    function Row(number_row){
        "use strict";

        /**
         * @type {Number|number}
         */
        this._numberInRow = parseInt(number_row,10) || 0;

        /**
         * @type {Ceil}
         * @private
         */
        this._obCeilList = {};
    }
    Row.prototype.createCeil = function(number_ceil){
        "use strict";
        number_ceil = parseInt(number_ceil,10);
        if(number_ceil<=0){
            return false;
        }

        this._obCeilList[number_ceil] = new Ceil(number_ceil);
        this._obCeilList[number_ceil].setRow(this);
        return this._obCeilList[number_ceil];
    };
    Row.prototype.getCeil = function(number_ceil){
        "use strict";
        number_ceil = parseInt(number_ceil,10) || 0;
        if(this._obCeilList[number_ceil]){
            return this._obCeilList[number_ceil];
        }

        return false;
    };
    Row.prototype.getListCeil = function(){
        "use strict";
        return this._obCeilList;
    };

    function Ceil(number_ceil_in_row){
        "use strict";

        /**
         * @type {Number|number}
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

        this._checkMine = false;

        /**
         * @type {Row}
         * @private
         */
        this._obRow = {};
    }
    Ceil.prototype.setMine = function($is_mine){
        "use strict";
        this._isMine = ($is_mine === true);
    };
    Ceil.prototype.setRow = function(obRow){
        "use strict";
        this._obRow = obRow;
    };
    Ceil.prototype.setNumber = function(number_ceil){
        "use strict";
        this._numberOnAllCeil = parseInt(number_ceil,10) || 0;
    };
    Ceil.prototype.getNumber = function(){
        "use strict";
        return this._numberOnAllCeil;
    };
    Ceil.prototype.getNumberInRow = function(){
        "use strict";
        return this._numberInRow;
    };
    Ceil.prototype.open = function(){
        "use strict";
        this._isOpen = true;
    };
    Ceil.prototype.selectMine = function(is_mine){
        "use strict";
        if(this._isOpen === false){
            this._checkMine = (is_mine === true);
        }
    }
})(window);