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
     * @param {String} id_div_element
     * @constructor
     */
    function Saper(id_div_element,params){

        this.params = {
            "rows": params.rows?parseInt(params.rows,10):9, // кол-во строк
            "cols": params.cols?parseInt(params.cols,10):9, // кол-во столбцов
            "padding": params.padding?parseInt(params.padding,10):10, // отступ поля
            "mine_count": params.mine_count?parseInt(params.mine_count,10):10, // кол-во мин
            "width": params.width?parseInt(params.width,10):320,
            "height": params.height?parseInt(params.height,10):320
        };

        this.canvas = document.getElementById(id_div_element);

        this.canvas.width = 320;
        this.canvas.height = 320;

        this.canvas.parentNode.insertBefore(this.createDivInfo(),this.canvas);

        this.context = canvas.getContext("2d");

        // закрашиваем холст
        this.context.fillStyle = "#DCDCDC";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // закрашиваем поле ячеек
        this.context.fillStyle = "#E9E9E9";
        this.context.fillRect(5,5,this.canvas.width-10, this.canvas.height-10);

        // список ячеек которые содержат мины
        this._arNumbersCeilOnMine = [];

        // рассчет мин
        this.createMine();

        // заполняем поле
        this.beginPole();

        // общее число ячеек
        this.count_ceil = this.params.cols * this.params.rows;

        this.ceil_width = (this.params.width - this.params.padding) / this.params.cols; // находим ширину ячейки
        this.ceil_height = (this.params.height - this.params.padding) / this.params.rows; // находим высоту ячейки

        this.all_mines = {}; // объект рандомных мин
        this.select_mines = {}; // объект расставленных пользовательских мин

        this.count_selected_mine = 0; // число проставленных мин пользователя

        this.timer_id = false; //  ID интервала таймера
        this.time_begin = 1; // начало с 1й секунды

        this._arCeilForMine = [];


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
     * Создание дива с информацией
     **/
    Saper.prototype.createDivInfo = function(divId,background){
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
     * заполняем холст ячейками
     **/
    Saper.prototype.beginPole = function(){
        for(var i=0; i < this.params.cols; i++){
            for(var j=0; j < this.params.rows; j++){
                this._drawRect(
                    (this.params.padding / 2) + i * this.ceil_width,
                    (this.params.padding / 2) + j * this.ceil_height,
                    this.ceil_width,
                    this.ceil_height
                );
            }
        }

    };

    Saper.prototype._drawRect = function(x,y,w,h){
        this.context.strokeRect(x,y,w,h);
        this.context.strokeStyle="#000";
    };

    Saper.prototype._randMineArray = function(){
        "use strict";
        for(var i = 0; i < this.params.mine_count; i++){
            this._arCeilForMine.push(this._randNumberCeilOnMine());
        }
    };

    Saper.prototype._randNumberCeilOnMine = function(){
        "use strict";
        var rand = Math.floor(Math.random() * this.count_ceil);
        var isFindElement = this._arCeilForMine.some(function(element){
            return element === rand;
        });

        if(rand === 0 || rand > this.count_ceil || isFindElement){
            return this._randNumberCeilOnMine();
        }else{
            return true;
        }
    };

    /**
     *  Создание поля случайных мин
     **/
    Saper.prototype.createMine = function(){
        // формируем случайные мины на поле
        for(var i = 0; i < this.params.mine_count; i++){
            this._arNumbersCeilOnMine.push(this.randNumberMine());
        }

        function mineX(index){
            if(mine.some(function(el){
                    return el == index})
            ){
                return "X";
            }else{
                return "#";
            }
        }


        var col=1, x=0; // по-умолчанию столбец первый, строка нулевая

        // пробегаем по всему полю, расставляем мины и рассортировываем по столбцам и строкам
        for(var el = 1; el <= this.count_ceil; el++){

            // высчитываем позицию в столбце по x
            x = el - (this.params.cols * (col-1));

            // если столбец не задан, создаем его как объект
            if(typeof this.all_mines[col] === undefined){
                this.all_mines[col] = {};
                this.select_mines[col] = {};
            }
            this.all_mines[col][x] = mineX(el); // расставляем мины или нет
            this.select_mines[col][x] = 0; // заполняем пустой объёкт пользовательских мин

            // если конец столбца, начинаем новый
            if(el % this.params.cols === 0){
                col++;
            }
        }

        // перебираем все ячейки и заполняем цифры
        for(var y in this.all_mines){
            for(var x in this.all_mines[y]){

                // если находим мину, заполняем цифры
                if(this.all_mines[y][x] == "X"){
                    // если не крайняя
                    if(y != 1){
                        this.all_mines[y-1][x] = Plus(this.all_mines[y-1][x]);
                        if(x != 1){
                            this.all_mines[y-1][x-1] = Plus(this.all_mines[y-1][x-1]);
                        }
                        if(x != this.params.rows){
                            this.all_mines[y-1][parseInt(x,10)+1] = Plus(this.all_mines[y-1][parseInt(x,10)+1]);
                        }
                    }

                    if(y != this.params.cols){
                        this.all_mines[parseInt(y,10)+1][x] = Plus(this.all_mines[parseInt(y,10)+1][x]);
                        if(x != 1){
                            this.all_mines[parseInt(y,10)+1][x-1] = Plus(this.all_mines[parseInt(y,10)+1][x-1]);
                        }
                        if(x != this.params.rows){
                            this.all_mines[parseInt(y,10)+1][parseInt(x,10)+1] = Plus(this.all_mines[parseInt(y,10)+1][parseInt(x,10)+1]);
                        }
                    }

                    if(x != 1){
                        this.all_mines[y][x-1] = Plus(this.all_mines[y][x-1]);
                    }
                    if(x != this.params.rows){
                        this.all_mines[y][parseInt(x,10)+1] = Plus(this.all_mines[y][parseInt(x,10)+1]);
                    }
                }
            }
        }


        // Внутренний метод +1
        function Plus(obj){
            if(obj == "#"){
                return 1;
            }else if(obj=="X"){
                return obj;
            }else if(typeof obj == "number"){
                return parseInt(obj,10)+1;
            }else{
                return obj;
            }
        };
    };

    Saper.prototype.randNumberMine = function(){
        var rand = Math.floor(Math.random()*this.count_ceil); // случайная ячейка

        // если такая ячейка уже была, ноль или даже больше общего числа ячеек, повторяем цикл
        if(rand === 0 || rand > this.count_ceil || mine.some(function(number_element){
                return number_element === rand;
            })
        ){
            return this.randNumberMine();
        }else{
            return rand;
        }
    };

    /**
     *  Обработка действий при нажатии левой клавиши, открытие полей
     **/
    Saper.prototype.openCl = function(y,x){

        this.timer("on");

        // при нажатии где уже стоит мина
        if(this.select_mines[y][x] == "X"){
            return;
        }

        // если вдруг....
        if(this.all_mines[y][x] == "X"){
            GameOver(); // :(
        }

        // если путое место вообще
        if(this.all_mines[y][x] == "#"){
            this.all_mines[y][x] = "@"; // отмечаем что открыто
            this.select_mines[y][x] = "1"; // отмечаем что открыто и на пользовательской карте

            // закрашиваем белый что открыто
            this.context.clearRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);
            this.context.fillStyle="#fff"; // белый
            this.context.fillRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);
            this.context.strokeStyle="#000";
            this.context.strokeRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);

            // находим соседние пустые и открываем их то же, рекусия функции
            if(y != 1){
                this.openCl(y-1,x);
                if(x != 1){
                    if(typeof this.all_mines[y-1][x-1] == "number"){
                        this.openCl(y-1,x-1);
                    }
                }
                if(x != this.params.rows){
                    if(typeof this.all_mines[y-1][parseInt(x,10)+1]=="number"){
                        this.openCl(y-1,parseInt(x,10)+1);
                    }
                }

            }

            if(y != this.params.cols){
                this.openCl(parseInt(y,10)+1,x);
                if(x!=1){
                    if(typeof this.all_mines[parseInt(y,10)+1][x-1]=="number"){
                        this.openCl(parseInt(y,10)+1,x-1);
                    }
                }
                if(x!=this.params.rows){
                    if(typeof this.all_mines[parseInt(y,10)+1][parseInt(x,10)+1]=="number"){
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
        if(typeof this.all_mines[y][x]=="number"){

            // Закрашимваем в белый
            this.context.clearRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);
            this.context.fillStyle="#fff";
            this.context.fillRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);
            this.context.strokeStyle="#000";
            this.context.strokeRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);

            // закрашиваем цифры
            this.context.font = "bold 13px Sans";
            this.context.textAlign = "center";
            this.context.textBaseline = "middle";

            switch(this.all_mines[y][x]){
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
            this.context.fillText(this.all_mines[y][x], (this.params.padding/2)+(x-1)*this.ceil_width+this.ceil_width/2, (this.params.padding/2)+(y-1)*this.ceil_height+this.ceil_height/2);
            this.select_mines[y][x]="1"; // в пользовательском тоже ставим что открыл
        }
    };

    /**
     *  Ставим мины на поле
     **/
    Saper.prototype.setMine=function (y,x){

        // ставит минут
        if((typeof this.all_mines[y][x]=="number" || this.all_mines[y][x]=="#" || this.all_mines[y][x]=="X") && this.select_mines[y][x]==0){
            this.select_mines[y][x]="X";
            this.context.beginPath();
            this.context.fillStyle = "red";
            this.context.arc((this.params.padding/2)+(x-1)*this.ceil_width+this.ceil_width/2, (this.params.padding/2)+(y-1)*this.ceil_height+this.ceil_height/2,this.ceil_height/3,0,Math.PI*2,true);
            this.context.fill();
            this.mine_pole("+");
            // убираем мину
        }else if(this.select_mines[y][x]=="X" && this.all_mines[y][x]!="@"){
            this.select_mines[y][x]=0;
            this.context.clearRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);
            this.context.fillStyle="#E9E9E9";
            this.context.fillRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);
            this.context.strokeStyle="#000";
            this.context.strokeRect((this.params.padding/2)+(x-1)*this.ceil_width,(this.params.padding/2)+(y-1)*this.ceil_height,this.ceil_width,this.ceil_height);
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
            "x": (Math.ceil(x/this.ceil_width) > this.params.cols? 0 : Math.ceil(x/this.ceil_width)),
            "y": (Math.ceil(y/this.ceil_height) > this.params.rows? 0 :Math.ceil(y/this.ceil_height))
        };
    };

    /**
     *  учитывает число проставленных мин,Ю для победы
     **/
    Saper.prototype.mine_pole = function(pm){
        if(pm == "+"){
            this.count_selected_mine++;
            this.document.getElementById("mine_pole").value = ((this.count_selected_mine < this.params.mine_count)?"0":"") + this.count_selected_mine+"/"+this.params.mine_count;
        }
        if(pm == "-"){
            this.count_selected_mine--;
            this.document.getElementById("mine_pole").value=((this.count_selected_mine < this.params.mine_count)?"0":"") + this.count_selected_mine+"/"+this.params.mine_count;
        }

        // проверям кол-во проставленных и всего и проверяем на правильность
        if(this.count_selected_mine == this.params.mine_count){
            var n=0;
            for(var y in this.select_mines){
                for(var x in this.select_mines[y]){
                    if(this.select_mines[y][x]=="X" && this.all_mines[y][x]=="X"){
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

    function Ceil(){

    }
})(window);