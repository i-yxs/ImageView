/*
    移动端图像查看器，具有分页浏览、多选删除、图像截取功能
    作者：yxs
    项目地址：https://github.com/qq597392321/ImageView
*/
(function () {
    /*
        兼容处理
    */
    var isAndroid = navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Adr') > -1; //android终端
    var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    //数据类型判断
    function isType(obj, name) {
        return Object.prototype.toString.call(obj).toLowerCase() == '[object ' + name.toLowerCase() + ']';
    };
    //判断是否具有指定样式类
    HTMLElement.prototype.hasClass = function (name) {
        var c = this.className.split(' ');
        for (var i = c.length - 1; i >= 0; i--) {
            if (c[i].toLowerCase() == name.toLowerCase()) {
                return true;
            }
        }
        return false;
    };
    //添加样式类
    HTMLElement.prototype.addClass = function (name) {
        var list1 = name.split(' ');
        var list2 = this.className.split(' ');
        list1.forEach(function (item, i) {
            var index = list2.indexOf(item);
            if (index === -1) {
                list2.push(item);
            }
        });
        this.className = list2.join(' ');
        return this;
    };
    //删除样式类
    HTMLElement.prototype.removeClass = function (name) {
        var list1 = name.split(' ');
        var list2 = this.className.split(' ');
        list1.forEach(function (item) {
            var index = list2.indexOf(item);
            if (index > -1) {
                list2.splice(index, 1);
            }
        });
        this.className = list2.join(' ');
        return this;
    };
    //删除自己
    HTMLElement.prototype.remove = function () {
        this.parentNode.removeChild(this);
        return this;
    };
    //获取指定样式值，数值只会返回数字
    HTMLElement.prototype.getComputedStyle = function (name, pseudoElt) {
        var res;
        var style = getComputedStyle(this, pseudoElt);
        if (res = /^([0-9.%]+)[^0-9.%]+$/.exec(style[name])) {
            return Number(res[1]);
        }
        return style[name];
    };
    //设置指定样式值
    var browsersCompatible = ['transform', 'transition', 'animation', 'clipPath'];
    HTMLElement.prototype.css = function (json) {
        for (var name in json) {
            var index = browsersCompatible.indexOf(name);
            if (index > -1) {
                var n = name.replace(/^([a-z])/, name[0].toUpperCase());
                this.style['webkit' + n] = json[name];
            }
            this.style[name] = json[name];
        }
        return this;
    };
    //indexOf增强版，可以指定多级属性
    Array.prototype.indexOf2 = function (value, property) {
        var list = property && property.split('.');
        var length = (list && list.length) || 0;
        var index = -1;
        var temporary;
        for (var i = 0; i < this.length; i++) {
            var temporary = this[i];
            for (var z = 0; z < length; z++) {
                if (typeof temporary === 'object' || typeof temporary === 'function') {
                    if (list[z] !== '') {
                        temporary = temporary[list[z]];
                    }
                } else {
                    temporary = null;
                    break;
                }
            }
            if (temporary === value) {
                return i;
            }
        }
        return index;
    };
    //绘制圆角矩形
    CanvasRenderingContext2D.prototype.radiusRect = function (width, height, r1, r2, r3, r4) {
        var s = this;
        s.beginPath();
        s.moveTo(0, height - r1);
        s.arcTo(0, 0, width, 0, r1);
        s.arcTo(width, 0, width, height, r2);
        s.arcTo(width, height, 0, height, r4);
        s.arcTo(0, height, 0, 0, r3);
        s.closePath();
        return s;
    };
    /*
        监听器
    */
    var Listeners = function () {
        var s = this;
        //公用变量名
        s.publicName1 = '__ListenersisRegistered__';
        s.publicName2 = '__ListenersCallbackList__';
    };
    //注册监听器
    Listeners.prototype.register = function (obj) {
        var s = this;
        if (!obj[s.publicName1]) {
            obj[s.publicName1] = true;
            obj[s.publicName2] = obj[s.publicName2] || {};
            obj.dispatchEvent = s.dispatchEvent.bind(obj);
            obj.on = obj.addEventListener = s.addEventListener.bind(obj);
            obj.off = obj.removeEventListener = s.removeEventListener.bind(obj);
        }
    };
    //删除监听器
    Listeners.prototype.remove = function (obj) {
        var s = this;
        obj[s.publicName1] = false;
        obj[s.publicName2] = null;
        obj.dispatchEvent = null;
        obj.on = obj.addEventListener = null;
        obj.off = obj.removeEventListener = null;
    };
    //事件派送
    Listeners.prototype.dispatchEvent = function (type, data, phase) {
        var s = this;
        phase = phase || 1;
        type = type.toLowerCase();
        if (s[Listeners.publicName2][phase]) {
            var list = s[Listeners.publicName2][phase][type];
            if (list) {
                list.forEach(function (item) {
                    item.call(s, data);
                });
            }
        }
        var typeName = type.toLowerCase().replace(/^([a-z])/g, type[0].toUpperCase());
        if (s['on' + typeName] && isType(s['on' + typeName], 'function')) {
            s['on' + typeName].call(s, data);
        }
    };
    //添加事件监听
    Listeners.prototype.addEventListener = function (type, callback, phase) {
        var s = this;
        phase = phase || 1;
        type = type.toLowerCase();
        s[Listeners.publicName2][phase] = s[Listeners.publicName2][phase] || {};
        s[Listeners.publicName2][phase][type] = s[Listeners.publicName2][phase][type] || [];
        s[Listeners.publicName2][phase][type].push(callback);
    };
    //删除事件监听
    Listeners.prototype.removeEventListener = function (type, callback, phase) {
        var s = this;
        phase = phase || 1;
        type = type.toLowerCase();
        if (s[Listeners.publicName2][phase] && s[Listeners.publicName2][phase][type]) {
            var list = s[Listeners.publicName2][phase][type];
            if (typeof callback === 'string' && callback.toLowerCase() === 'all') {
                list.length = 0;
            } else {
                var i = list.indexOf(callback);
                if (i !== -1) { list.splice(i, 1); }
            }
        }
    };
    Listeners = new Listeners();
    /*
        速度衰减动画类
    */
    function SpeedDecay(from, speed) {
        var s = this;
        //开始值列表
        s.fromValue = {};
        //当前值列表
        s.currValue = {};
        //速度/100ms
        s.initSpeed = {};
        //摩擦系数
        s.friction = .9;
        //最低速度
        s.minSpeed = .5;
        //状态(pauseing为暂停中,running为播放中,idle为闲置)
        s.state = 'idle';
        //节点时间
        s._nodeTime = 0;
        //节点值
        s._nodeValue = {};
        //节点速度
        s._nodeSpeed = null;
        //暂停时间戳
        s._pauseTimesTamp = 0;
        //数据更新定时器
        s._DataUpdateTimer = null;
        //绑定上下文
        s.start = s.start.bind(s);
        //初始化
        s.init(from);
        //注册监听器
        Listeners.register(s);
    };
    //初始化
    SpeedDecay.prototype.init = function (from) {
        var s = this;
        s.state = 'idle';
        s.fromValue = from || {};
        s._nodeTime = Date.now();
        s._nodeValue = {};
        for (var name in s.fromValue) {
            s._nodeValue[name] = s.fromValue[name];
        }
    };
    //动画更新
    SpeedDecay.prototype.start = function () {
        var s = this;
        if (s.state !== 'pauseing') {
            s.state = 'running';
            s._DataUpdateTimer = requestAnimationFrame(s.start);
            var currSpeed = 0;
            var currValue = {};
            var currTime = Date.now() - s._nodeTime;
            if (s._nodeSpeed === null) {
                s._nodeSpeed = s.initSpeed;
            }
            if (currTime < 100) {
                currSpeed = currTime / 100 * s._nodeSpeed;
            } else {
                for (var name in s.fromValue) {
                    if (s.fromValue.hasOwnProperty(name)) {
                        s._nodeValue[name] += s._nodeSpeed;
                    }
                }
                s._nodeTime += 100;
                s._nodeSpeed *= s.friction;
                currSpeed = (currTime - 100) / 100 * s._nodeSpeed;
            }
            for (var name in s.fromValue) {
                if (s.fromValue.hasOwnProperty(name)) {
                    currValue[name] = s._nodeValue[name] + currSpeed;
                }
            }
            s.dispatchEvent('update', currValue);
            if (Math.abs(s._nodeSpeed) <= s.minSpeed) {
                s.stopTimer();
                s.dispatchEvent('complete');
            }
        }
    };
    //暂停/继续
    SpeedDecay.prototype.pause = function () {
        var s = this;
        if (s.state === 'running') {
            s.stopTimer();
            s.state = 'pauseing';
            s._pauseTimesTamp = Date.now();
        } else if (s.state === 'pauseing') {
            s.state = 'running';
            s._nodeTime += Date.now() - s._pauseTimesTamp;
            s.start();
        }
    };
    //停止计时器
    SpeedDecay.prototype.stopTimer = function () {
        var s = this;
        s.state = 'idle';
        s._nodeSpeed = null;
        cancelAnimationFrame(s._DataUpdateTimer);
    };
    /*
        缓动动画类
    */
    function Animation(from, to) {
        var s = this;
        //开始值列表
        s.fromList = {};
        //结束值列表
        s.toList = {};
        //开始时间
        s.startTime = 0;
        //持续时间
        s.duration = 1000;
        //状态(pauseing为暂停中,running为播放中,idle为闲置)
        s.state = 'idle';
        //记录暂停时间戳
        s._pauseTimesTamp = null;
        //数据更新定时器
        s._DataUpdateTimer = null;
        //绑定上下文
        s.start = s.start.bind(s);
        //初始化
        s.init(from, to);
        //注册监听器
        Listeners.register(s);
    };
    //初始化
    Animation.prototype.init = function (from, to) {
        var s = this;
        s.state = 'idle';
        s.fromList = from || {};
        s.toList = to || {};
        s.startTime = Date.now();
    };
    //动画更新
    Animation.prototype.start = function () {
        var s = this;
        var res = {};
        var currTime = Date.now() - s.startTime;
        if (s.state !== 'pauseing') {
            s.state = 'running';
            s._DataUpdateTimer = requestAnimationFrame(s.start);
            if (currTime < s.duration) {
                for (var name in s.fromList) {
                    if (s.fromList.hasOwnProperty(name)) {
                        res[name] = s.easing(currTime, s.fromList[name], s.toList[name] - s.fromList[name], s.duration);
                    }
                }
                s.dispatchEvent('update', res);
            } else {
                s.stopTimer();
                s.dispatchEvent('update', s.toList);
                s.dispatchEvent('complete');
            }
        }
    };
    //暂停/继续
    Animation.prototype.pause = function () {
        var s = this;
        if (s.state === 'running') {
            s.stopTimer();
            s.state = 'pauseing';
            s._pauseTimesTamp = Date.now();
        } else if (s.state === 'pauseing') {
            s.state = 'running';
            s.startTime += Date.now() - s._pauseTimesTamp;
            s.start();
        }
    };
    //停止计时器
    Animation.prototype.stopTimer = function () {
        var s = this;
        s.state = 'idle';
        cancelAnimationFrame(s._DataUpdateTimer);
    };
    //动画算法
    Animation.prototype.easing = function (t, b, c, d) { return c * ((t = t / d - 1) * t * t + 1) + b; };
    /*
        图像查看器类
    */
    //翻页动画
    var _PageFx = new Animation();
    //还原缩放状态动画
    var _RestoreFx = new Animation();
    _RestoreFx.on('complete', function () {
        _RestoreFx.onUpdate = null;
    });
    //还原图片位置动画
    var _RestoreFx_X = new Animation();
    var _RestoreFx_Y = new Animation();
    //滚屏动画
    var _ScrollFx_X = new SpeedDecay();
    var _ScrollFx_Y = new SpeedDecay();
    /*
        图像类
    */
    function Vimg(json) {
        var s = this;
        //dom元素
        s.image = null;
        //矩形盒子
        s.getClientRects = null;
        //图片地址
        s.src = '';
        //目标元素
        s.target = null;
        //目标元素数据
        s.targetData = {};
        //位置
        s.position = { x: 0, y: 0 };
        //缩放前的位置
        s.firstPosition = { x: 0, y: 0 };
        //缩放后的位置
        s.lastPosition = { x: 0, y: 0 };
        //锚点
        s.anchor = { x: 0, y: 0 };
        //未进行缩放前的锚点
        s.lastAnchor = { x: 0, y: 0 };
        //宽度
        s.width = 0;
        //高度
        s.height = 0;
        //真实宽度
        s.naturalWidth = 0;
        //真实高度
        s.naturalHeight = 0;
        //当前旋转值
        s.rotate = 0;
        //当前缩放值
        s.scale = 1;
        //缩放前的缩放值
        s.lastScale = 1;
        //最大缩放倍数
        s.maxScale = 1;
        //最小缩放倍数
        s.minScale = 1;
        //初始缩放倍数
        s.initScale = 1;
        //位于存放列表下标位置
        s.index = 0;
        //是否被选中
        s.selected = false;
        //标记是否加载完成
        s.isload = false;
        //应用
        for (var name in json) {
            if (s.hasOwnProperty(name) && name in s) {
                s[name] = json[name];
            }
        }
        //注册监听器
        Listeners.register(s);
    };
    //自定义适应
    Vimg.prototype.customAdaption = function () {
        var s = this;
        var displaySize = arguments[0] || ImageView.initDisplaySize;
        var displayPositionX = arguments[1] || ImageView.initDisplayPositionX;
        var displayPositionY = arguments[2] || ImageView.initDisplayPositionY;
        //调整大小
        var width = Math.min(_Private.displayRectBox.width, s.naturalWidth);
        var height = Math.round(width / s.naturalWidth * s.naturalHeight);
        if (height > _Private.displayRectBox.height) {
            height = _Private.displayRectBox.height;
            width = Math.round(height / s.naturalHeight * s.naturalWidth);
        }
        s.width = width;
        s.height = height;
        s.left = (ImageView.width + ImageView.imageMargin) * s.index;
        //裁剪模式
        if (ImageView.pattern === 'clipping') {
            displaySize = 'cover';
            displayPosition = 'center';
        } else {
            s.maxScale = s.naturalWidth / s.width;
            s.initScale = 1;
        }
        //根据真实尺寸调整缩放大小
        switch (displaySize) {
            case 'cover':
                var width = Math.round(_Private.displayRectBox.height / s.naturalHeight * s.naturalWidth);
                var height = Math.round(_Private.displayRectBox.width / s.naturalWidth * s.naturalHeight);
                if (ImageView.pattern === 'clipping') {
                    s.initScale = s.maxScale = s.minScale = Math.max(width / s.width, height / s.height);
                    if (s.width * s.maxScale < s.naturalWidth) {
                        s.maxScale = s.naturalWidth / s.width;
                    }
                    if (width >= _Private.displayRectBox.width) {
                        s.scale = Math.min(s.maxScale, width / s.width);
                    } else if (height >= _Private.displayRectBox.height) {
                        s.scale = Math.min(s.maxScale, height / s.height);
                    }
                } else {
                    if (width >= _Private.displayRectBox.width) {
                        s.scale = Math.min(s.maxScale, width / s.width);
                    } else if (height >= _Private.displayRectBox.height) {
                        s.scale = Math.min(s.maxScale, height / s.height);
                    }
                }
                break;
            case 'contain':
            default:
                s.scale = 1;
                break;
        }
        //调整位置
        var imageWidth = Math.round(s.width * s.scale);
        var imageHeight = Math.round(s.height * s.scale);
        switch (displayPositionX) {
            case 'left':
                s.position.x = 0;
                break;
            case 'rigth':
                s.position.x = ImageView.width - imageWidth;
                break;
            case 'center':
            default:
                s.position.x = Math.round((ImageView.width - imageWidth) / 2);
                break;
        }
        switch (displayPositionY) {
            case 'top':
                s.position.y = 0;
                break;
            case 'bottom':
                s.position.x = ImageView.height - imageHeight;
                break;
            case 'center':
            default:
                s.position.y = Math.round((ImageView.height - imageHeight) / 2);
                break;
        }
    };
    //默认适应
    Vimg.prototype.defaultAdaption = function () {
        this.customAdaption('contain', 'center');
    };
    //应用数据到dom元素
    Vimg.prototype.useDataToImage = function () {
        var s = this;
        if (s.image) {
            s.image.css({
                zIndex: 2,
                top: s.top + 'px',
                left: s.left + 'px',
                width: s.width + 'px',
                height: s.height + 'px',
                transform: 'translate3d(' + s.position.x + 'px, ' + s.position.y + 'px, 0) scale3d(' + s.scale + ',' + s.scale + ',1) rotateZ(' + s.rotate + 'deg)'
            });
        }
    };
    //调整显示位置
    Vimg.prototype.adjustPosition = function () {
        var s = this;
        var x = s.position.x;
        var y = s.position.y;
        var scale = s.scale;
        var rotate = s.rotate;
        if (arguments[0]) {
            scale = s.initScale;
            rotate = 0;
            x = (ImageView.width - s.width) / 2;
            y = (ImageView.height - s.height) / 2;
        } else {
            if (s.scale > s.initScale) {
                if (s.lastScale < s.initScale) {
                    //如果上一次缩放比例小于初始缩放比例，则还原到初始缩放比例
                    scale = s.initScale;
                    x = s.firstPosition.x;
                    y = s.firstPosition.y;
                } else if (s.scale > s.maxScale) {
                    //如果当前缩放比例大于最大放大比例，则还原到最大比例，原点居中
                    scale = s.maxScale;
                    x = _Private.displayRectBox.x + s.lastAnchor.x * (1 - scale);
                    y = _Private.displayRectBox.y + s.lastAnchor.y * (1 - scale);
                }
            } else if (s.scale < s.initScale) {
                if (s.lastScale > s.initScale) {
                    //如果上一次缩放比例大于初始缩放比例，则还原到初始缩放比例
                    scale = s.initScale;
                    x = s.firstPosition.x;
                    y = s.firstPosition.y;
                } else if (s.scale < s.minScale) {
                    //如果当前缩放比例小于最小缩放比例，则还原到最小缩放，原点居中
                    scale = s.minScale;
                }
            }
            var currentWidth = Math.round(s.width * scale);
            var currentHeight = Math.round(s.height * scale);
            if (currentWidth > _Private.displayRectBox.width) {
                var maxX = -(currentWidth - _Private.displayRectBox.width - _Private.displayRectBox.x);
                if (x > _Private.displayRectBox.x) {
                    x = _Private.displayRectBox.x;
                } else if (x < maxX) {
                    x = maxX;
                }
            } else {
                x = (ImageView.width - currentWidth) / 2;
            }
            if (currentHeight > _Private.displayRectBox.height) {
                var maxY = -(currentHeight - _Private.displayRectBox.height - _Private.displayRectBox.y);
                if (y > _Private.displayRectBox.y) {
                    y = _Private.displayRectBox.y;
                } else if (y < maxY) {
                    y = maxY;
                }
            } else {
                y = (ImageView.height - currentHeight) / 2;
            }
        }
        rotate = 0;
        if (s.width * scale >= ImageView.width) {
            s.lastPosition.x = 0;
        } else {
            s.lastPosition.x = x;
        }
        if (s.height * scale >= ImageView.height) {
            s.lastPosition.y = 0;
        } else {
            s.lastPosition.y = y;
        }
        //初始化X轴动画
        if (s.position.x !== x && _ScrollFx_X.state !== 'running') {
            _RestoreFx_X.init({ x: s.position.x, }, { x: x });
            _RestoreFx_X.duration = 300;
            _RestoreFx_X.onUpdate = function (data) {
                s.position.x = data.x;
            };
            _RestoreFx_X.start();
        }
        //初始化Y轴动画
        if (s.position.y !== y && _ScrollFx_Y.state !== 'running') {
            _RestoreFx_Y.init({ y: s.position.y, }, { y: y });
            _RestoreFx_Y.duration = 300;
            _RestoreFx_Y.onUpdate = function (data) {
                s.position.y = data.y;
            };
            _RestoreFx_Y.start();
        }
        //初始化动画
        _RestoreFx.init({ scale: s.scale, rotate: s.rotate }, { scale: scale, rotate: rotate });
        _RestoreFx.duration = 300;
        _RestoreFx.onUpdate = function (data) {
            s.scale = data.scale;
            s.rotate = data.rotate;
            s.useDataToImage();
        };
        _RestoreFx.start();
    };
    //当图片宽高大于容器时，启用滑动滚屏
    Vimg.prototype.scrollScreen = function (speed, touch) {
        var s = this;
        var horDirection = touch.horDirection;
        var verDirection = touch.verDirection;
        //当前宽高
        var imageWidth = Math.round(s.width * s.scale);
        var imageHeight = Math.round(s.height * s.scale);
        //初始位置
        var initViewBoxPositionX = _Private.viewBoxPositionX;
        var initPositionX = s.position.x;
        var initPositionY = s.position.y;
        //阻尼系数
        var damping = .3;
        var friction = .7;
        var reaction = .05;
        //摩擦系数增量
        var incrementX = 1;
        var incrementY = 1;
        //当前页数显示盒子的初始位置
        var ViewBoxInitDataX = -(ImageView.width + ImageView.imageMargin) * (ImageView.page - 1);
        //如果图片宽度小于容器宽度，不进行惯性动画
        if (_Private.displayRectBox.width >= imageWidth) {
            speed.x = 0;
        }
        //x轴动画
        if (Math.abs(speed.x) > _ScrollFx_X.minSpeed) {
            _ScrollFx_X.init({ x: s.position.x });
            _ScrollFx_X.initSpeed = speed.x;
            _ScrollFx_X.friction = friction;
            _ScrollFx_X.onUpdate = function (data) {
                var posX = data.x;
                var pageX = ViewBoxInitDataX;
                //边界外最大左超出量
                var maxBeyond = imageWidth - _Private.displayRectBox.width;
                //当前模式
                if (ImageView.pattern === 'clipping') {
                    var maxPosX = _Private.displayRectBox.x - maxBeyond;
                    //应用x轴
                    if (posX > _Private.displayRectBox.x) {
                        posX = _Private.displayRectBox.x;
                        _ScrollFx_X._nodeSpeed = _ScrollFx_X.minSpeed;
                    } else if (posX < maxPosX) {
                        posX = maxPosX;
                        _ScrollFx_X._nodeSpeed = _ScrollFx_X.minSpeed;
                    }
                } else {
                    //边界外左右超出量
                    var leftBeyond = _Private.displayRectBox.x - posX;
                    var rightBeyond = maxBeyond - leftBeyond;
                    //判断滑动方向
                    if (_ScrollFx_X.initSpeed < 0) {
                        //往左滑动
                        if (rightBeyond <= 0) {
                            //边界内右超出量
                            var rightinBeyond = posX + maxBeyond;
                            if (initViewBoxPositionX < ViewBoxInitDataX) {
                                pageX = ViewBoxInitDataX + ((initViewBoxPositionX - ViewBoxInitDataX) / damping + (posX - _ScrollFx_X.fromValue.x)) * damping;
                            } else {
                                pageX = ViewBoxInitDataX + rightinBeyond * damping;
                            }
                            posX = -maxBeyond;
                            _ScrollFx_X.friction *= incrementX;
                            if (incrementX === 1) {
                                incrementX = _ScrollFx_X.friction * reaction;
                            }
                        } else if (initViewBoxPositionX > ViewBoxInitDataX) {
                            _ScrollFx_X.friction *= incrementX;
                            pageX = initViewBoxPositionX + posX;
                            posX = 0;
                            if (incrementX === 1) {
                                incrementX = _ScrollFx_X.friction * reaction;
                            }
                        }
                    } else {
                        //往右滑动
                        if (leftBeyond <= 0) {
                            //边界内左超出量
                            var leftinBeyond = posX;
                            _ScrollFx_X.friction *= incrementX;
                            if (initViewBoxPositionX > ViewBoxInitDataX) {
                                pageX = ViewBoxInitDataX + ((initViewBoxPositionX - ViewBoxInitDataX) / damping + posX) * damping;
                            } else {
                                pageX = ViewBoxInitDataX + leftinBeyond * damping;
                            }
                            posX = 0;
                            if (incrementX === 1) {
                                incrementX = _ScrollFx_X.friction * reaction;
                            }
                        } else if (initViewBoxPositionX < ViewBoxInitDataX) {
                            _ScrollFx_X.friction *= incrementX;
                            pageX = initViewBoxPositionX - (-maxBeyond - posX);
                            posX = -maxBeyond;
                            if (incrementX === 1) {
                                incrementX = _ScrollFx_X.friction * reaction;
                            }
                        }
                    }
                }
                s.position.x = posX;
                _Private.viewBoxPositionX = pageX;
                s.useDataToImage();
                _Private.setViewBoxPositionX();
            };
            _ScrollFx_X.onComplete = function () {
                ImageView.indexPage(ImageView.page);
            };
            _ScrollFx_X.start();
        }
        //y轴动画
        if (Math.abs(speed.y) > _ScrollFx_Y.minSpeed) {
            //y轴动画
            _ScrollFx_Y.init({ y: s.position.y });
            _ScrollFx_Y.initSpeed = speed.y;
            _ScrollFx_Y.friction = friction;
            _ScrollFx_Y.onUpdate = function (data) {
                var posY = data.y;
                //边界外最大下超出量
                var maxBeyond = imageHeight - _Private.displayRectBox.height;
                //当前模式
                if (ImageView.pattern === 'clipping') {
                    var maxPosY = _Private.displayRectBox.y - maxBeyond;
                    //应用y轴
                    if (posY > _Private.displayRectBox.y) {
                        posY = _Private.displayRectBox.y;
                        _ScrollFx_Y._nodeSpeed = _ScrollFx_Y.minSpeed;
                    } else if (posY < maxPosY) {
                        posY = maxPosY;
                        _ScrollFx_Y._nodeSpeed = _ScrollFx_Y.minSpeed;
                    }
                } else {
                    //边界外上下超出量
                    var topBeyond = _Private.displayRectBox.y - posY;
                    var bottomBeyond = maxBeyond - topBeyond;
                    //判断滑动方向
                    if (verDirection === 'top') {
                        if (bottomBeyond <= 0) {
                            //边界内下超出量
                            var bottominBeyond = posY + maxBeyond - _Private.displayRectBox.y;
                            if (initPositionY < -(maxBeyond - _Private.displayRectBox.y)) {
                                posY = -maxBeyond + ((initPositionY + maxBeyond) / damping + (posY - initPositionY)) * damping;
                            } else {
                                posY = _Private.displayRectBox.y - maxBeyond + bottominBeyond * damping;
                            }
                            _ScrollFx_Y.friction *= incrementY;
                            if (incrementY === 1) {
                                incrementY = _ScrollFx_Y.friction * reaction;
                            }
                        }
                    } else if (verDirection === 'bottom') {
                        if (topBeyond <= 0) {
                            //边界内上超出量
                            var topinBeyond = posY - _Private.displayRectBox.y;
                            if (initPositionY > _Private.displayRectBox.y) {
                                posY = (initPositionY / damping + (posY - initPositionY)) * damping;
                            } else {
                                posY = _Private.displayRectBox.y + topinBeyond * damping;
                            }
                            _ScrollFx_Y.friction *= incrementY;
                            if (incrementY === 1) {
                                incrementY = _ScrollFx_Y.friction * reaction;
                            }
                        }
                    }
                }
                s.position.y = posY;
                s.useDataToImage();
            };
            _ScrollFx_Y.onComplete = function () {
                ImageView.indexPage(ImageView.page);
            };
            _ScrollFx_Y.start();
        }
        if (Math.abs(speed.x) <= _ScrollFx_X.minSpeed &&
            Math.abs(speed.y) <= _ScrollFx_Y.minSpeed) {
            ImageView.indexPage(ImageView.page);
        }
    };
    /*
        图像查看器
    */
    function ImageView() {
        var s = this;
        //容器大小
        s.width = 0;
        s.height = 0;
        //当前页
        s.page = 1;
        //当前状态(close：关闭 show：显示)
        s.state = 'close';
        //图片列表
        s.vImageList = null;
        //选择器
        s.selector = null;
        //当前模式(默认：default 可选：edit(编辑) clipping(剪裁))
        s.pattern = null;
        //图片间距(默认：10)
        s.imageMargin = null;
        /*
            图像的初始显示尺寸(裁剪模式不可用)
                默认：cover
                cover (图像扩展至足够大，使图像完全覆盖显示区域) 
                contain (图像扩展至最大尺寸，使其宽度和高度完全适应显示区域)
        */
        s.initDisplaySize = null;
        /*
            图像的初始水平显示位置(裁剪模式不可用)
                默认：center
                top (仅当initDisplaySize='cover' 时生效)
                center (居中显示)
                bottom (仅当initDisplaySize='cover' 时生效)
        */
        s.initDisplayPositionX = null;
        /*
            图像的初始垂直显示位置(裁剪模式不可用)
                默认：center
                left (仅当initDisplaySize='cover' 时生效)
                center (居中显示)
                rihgt (仅当initDisplaySize='cover' 时生效)
        */
        s.initDisplayPositionY = null;
        //裁剪后输出的图片宽度(默认：容器宽度)
        s.clippingWidth = null;
        //裁剪后输出的图片高度(默认：容器宽度)
        s.clippingHeight = null;
        //裁剪图片的圆角数值(默认：0)
        s.clippingRadius = null;
        //裁剪后输出的图片背景(默认：透明)
        s.clippingBackground = null;
        //裁剪后输出的图片后缀(默认：png 可选：jpge)
        s.clippingImportSuffix = null;
        //手势事件是否能进行旋转(默认：false 可选：true)
        s.isGestureRotate = null;
        //当使用dom事件触发显示时，是否查找目标元素是否存在于图片列表中
        s.isFindTargettoImageList = null;
        //注册监听器
        Listeners.register(s);
    };
    //显示入口
    ImageView.prototype.show = function (json) {
        var s = this;
        _Private.applyOptionParam(json);
        _Private.selectorDispose(s.selector);
        //是否显示
        var isDisplay = false;
        if (s.vImageList.length) {
            if (event) { isDisplay = _Private.isEventTargettovImageList(); }
            else { isDisplay = true; }
        }
        //显示前的准备
        if (isDisplay) {
            s.width = window.innerWidth;
            s.height = window.innerHeight;
            //添加元素到body
            document.body.appendChild(_Element.container);
            _Element.container.removeClass('iv_hide').setAttribute('data-pattern', s.pattern);
            //设置当前页为选中状态
            var pageIndex = s.page - 1;
            var vimg = s.vImageList[pageIndex];
            s.vImageList[pageIndex].selected = true;
            _Private.viewBoxPositionX = -(s.width + s.imageMargin) * pageIndex;
            //更新数据
            _Private.updatePageData();
            _Private.setViewBoxPositionX();
            //当前页图片目标是否为元素
            if (vimg.target.nodeType) {
                _Private.imagesEaseinAnimate();
            } else {
                _Private.notAnimateShow();
            }
            if (s.pattern === 'clipping') {
                _Private.clippingMaskAdaptContainerSize();
            } else {
                _Private.displayRectBox.x = 0;
                _Private.displayRectBox.y = 0;
                _Private.displayRectBox.width = s.width;
                _Private.displayRectBox.height = s.height;
            }
            //加载图片
            _Private.loadImages(s.vImageList);
        }
    };
    //关闭
    ImageView.prototype.close = function () {
        var s = this;
        var pageIndex = s.page - 1;
        var vimg = s.vImageList[pageIndex];
        //当前页图片目标是否为元素
        if (vimg.target.nodeType && vimg.target.parentNode) {
            _Private.imagesEaseoutAnimate();
        } else {
            _Private.notAnimateClose();
        }
    };
    //上一页
    ImageView.prototype.prevPage = function () {
        var s = this;
        var page = s.page;
        if (s.page > 1) {
            page--;
        }
        s.indexPage(page);
    };
    //下一页
    ImageView.prototype.nextPage = function () {
        var s = this;
        var page = s.page;
        if (s.page < s.vImageList.length) {
            page++;
        }
        s.indexPage(page);
    };
    //跳转到指定页
    ImageView.prototype.indexPage = function (index) {
        var s = this;
        var page = s.page;
        if (index >= 1 && index <= s.vImageList.length) {
            s.page = index;
        }
        var end = -s.width * (s.page - 1) - (s.imageMargin * (s.page - 1));
        if (_ScrollFx_X.state != 'running' && _Private.viewBoxPositionX - end) {
            _PageFx.init({ x: _Private.viewBoxPositionX }, { x: end });
            _PageFx.duration = 300;
            _PageFx.onUpdate = function (data) {
                _Private.viewBoxPositionX = data.x;
                _Private.setViewBoxPositionX();
            };
            _PageFx.onComplete = function () {
                s.dispatchEvent('pageend');
                _Interaction.pageingSign = false;
            };
            _PageFx.start();
        }
        if (page !== s.page) {
            s.dispatchEvent('pageing');
            _Interaction.pageingSign = true;
        }
        if (page === s.page) {
            s.vImageList[page - 1].adjustPosition();
        } else {
            s.vImageList[page - 1].adjustPosition(true);
        }
        //更新翻页数据
        _Private.updatePageData();
    };
    //还原初始状态
    ImageView.prototype.restore = function () {
        var s = this;
        s.page = 1;
        s.vImageList = [];
        _Private.viewBoxPositionX = 0;
        _Element.iv_viewBox.innerHTML = '';
        _Element.iv_confbtn.innerText = '完成';
        _Element.iv_confbtn.removeAttribute('disabled');
        _Private.checkboxsEvent();
    };
    //实例化
    ImageView = window.ImageView = new ImageView();
    /*
        交互事件
    */
    var _Interaction = {
        //记录手指触摸轨迹
        touchPath: [],
        //按下的触点列表
        downTouchList: [],
        //记录按下时显示盒子的状态
        viewBoxDataX: null,
        //标记是否正在翻页
        pageingSign: false,
        //记录当前操作
        currentHandle: null,
        //记录上一次手指移动的方向
        lastMoveDirection: null,
        //手指按下
        down: function (e) {
            var touch = {
                clientX: e.changedTouches[0].clientX,
                clientY: e.changedTouches[0].clientY,
                identifier: e.changedTouches[0].identifier,
                timestamp: Date.now()
            };
            //如果当前触点的identifier已经存在按下的触点列表中，则不添加到列表
            var index = _Interaction.downTouchList.indexOf2(touch.identifier, 'identifier');
            if (index > -1) {
                _Interaction.downTouchList[index].clientX = touch.clientX;
                _Interaction.downTouchList[index].clientY = touch.clientY;
                _Interaction.downTouchList[index].timestamp = touch.timestamp;
            } else {
                _Interaction.downTouchList.push(touch);
            }
            //停止所有动画
            _PageFx.stopTimer();
            if (!_Interaction.pageingSign) {
                _RestoreFx.stopTimer();
                _ScrollFx_X.stopTimer();
                _ScrollFx_Y.stopTimer();
                _RestoreFx_X.stopTimer();
                _RestoreFx_Y.stopTimer();
            }
            //还原图片显示深度
            ImageView.vImageList.forEach(function (item) {
                item.image.style.zIndex = '1';
            });
            //判断当前操作
            if (!_Interaction.currentHandle) {
                if (_Interaction.downTouchList.length === 1) {
                    _Interaction.slidestart();
                } else {
                    _Interaction.gesturestart();
                }
            }
            isIOS && e.preventDefault();
        },
        //手指移动中
        move: function (e) {
            if (_Interaction.downTouchList.length) {
                var touch = [];
                for (var i = 0; i < e.touches.length; i++) {
                    touch.push({
                        clientX: e.touches[i].clientX,
                        clientY: e.touches[i].clientY,
                        identifier: e.touches[i].identifier,
                        timestamp: Date.now()
                    });
                }
                //从触点列表删除已经离开屏幕的触点
                _Interaction.downTouchList.forEach(function (item, i) {
                    var index = touch.indexOf2(item.identifier, 'identifier');
                    if (index > -1) {
                        //轴向
                        var disX = Math.abs(touch[index].clientX - item.clientX);
                        var disY = Math.abs(touch[index].clientY - item.clientY);
                        if (disX > disY) {
                            item.axial = 'x';
                        } else if (disX < disY) {
                            item.axial = 'y';
                        }
                        if (!item.initAxial) {
                            if (disX > disY) {
                                item.initAxial = 'x';
                            } else if (disX < disY) {
                                item.initAxial = 'y';
                            }
                        }
                        //触点相对于按下时的水平方向
                        if (touch[index].clientX < item.clientX) {
                            item.horDirection = 'left';
                        } else {
                            item.horDirection = 'right';
                        }
                        if (touch[index].clientY < item.clientY) {
                            item.verDirection = 'top';
                        } else {
                            item.verDirection = 'bottom';
                        }
                        item.isMove = true;
                    } else {
                        _Interaction.downTouchList.splice(i, 1);
                        _Interaction.viewBoxDataX = _Private.viewBoxPositionX;
                    }
                });
                //如果触点列表里的触点数量小于当前屏幕上的触点数量，加入到触点列表
                if (_Interaction.downTouchList.length < touch.length) {
                    touch.forEach(function (item) {
                        var index = _Interaction.downTouchList.indexOf2(item.identifier, 'identifier');
                        if (index === -1) {
                            _Interaction.downTouchList.push(item);
                            _Interaction.gesturestart();
                        }
                    });
                }
                var handle = '';
                if (_Interaction.currentHandle === 'slide' || _Interaction.currentHandle === 'slidescale') {
                    handle = 'slide';
                } else if (_Interaction.currentHandle === 'gesture') {
                    handle = 'gesture';
                } else {
                    if (_Interaction.downTouchList.length === 1) {
                        _Interaction.currentHandle = handle = 'slide';
                    } else {
                        _Interaction.currentHandle = handle = 'gesture';
                    }
                }
                if (handle === 'slide') {
                    _Interaction.slideing(touch[0]);
                } else if (handle === 'gesture' && _Interaction.downTouchList.length > 1) {
                    var touch1, touch2;
                    var identifier1 = _Interaction.downTouchList[0].identifier;
                    var identifier2 = _Interaction.downTouchList[1].identifier;
                    //从当前列表中筛选出第一、二个触点
                    _Interaction.downTouchList.forEach(function (item, i) {
                        item = touch[i];
                        if (item.identifier === identifier1) {
                            touch1 = item;
                        } else if (item.identifier === identifier2) {
                            touch2 = item;
                        }
                    });
                    _Interaction.gesturechange(touch1, touch2);
                }
                e.preventDefault();
            }
        },
        //手指抬起
        up: function (e) {
            if (_Interaction.downTouchList.length) {
                var touch = {
                    clientX: e.changedTouches[0].clientX,
                    clientY: e.changedTouches[0].clientY,
                    identifier: e.changedTouches[0].identifier,
                    timestamp: Date.now()
                };
                //删除跟当前触点identifier相同的按下触点列表中的触点
                var currentTouch;
                var index = _Interaction.downTouchList.indexOf2(touch.identifier, 'identifier');
                if (index > -1) {
                    currentTouch = _Interaction.downTouchList.splice(index, 1)[0];
                }
                if (_Interaction.downTouchList.length === 0) {
                    _Interaction.slideend(currentTouch);
                    _Interaction.currentHandle = null;
                } else {
                    _Interaction.gestureend(currentTouch);
                }
                if (currentTouch.clientX === touch.clientX &&
                    currentTouch.clientY === touch.clientY &&
                    touch.timestamp - currentTouch.timestamp < 300) {
                    //单击隐藏上下工具栏
                    if (_Element.container.hasClass('iv_full')) {
                        _Element.container.removeClass('iv_full');
                    } else {
                        _Element.container.addClass('iv_full');
                    }
                    if (ImageView.pattern === 'default' && !_Interaction.pageingSign) {
                        ImageView.close();
                    }
                }
            }
        },
        /*
            滑动功能
        */
        //滑动开始
        slidestart: function () {
            //当前页的图片对象
            var vimg = ImageView.vImageList[ImageView.page - 1];
            vimg.firstPosition.x = vimg.position.x;
            vimg.firstPosition.y = vimg.position.y;
            _Interaction.viewBoxDataX = _Private.viewBoxPositionX;
        },
        //滑动中
        slideing: function (touch) {
            var s = ImageView;
            var moveX = touch.clientX - _Interaction.downTouchList[0].clientX;
            var moveY = touch.clientY - _Interaction.downTouchList[0].clientY;
            //阻尼系数
            var damping = .3;
            //当前页的图片对象
            var vimg = s.vImageList[s.page - 1];
            //当前宽高
            var imageWidth = Math.round(vimg.width * vimg.scale);
            var imageHeight = Math.round(vimg.height * vimg.scale);
            //当前移动方向
            var direc = _Interaction.downTouchList[0].horDirection;
            //当前页数显示盒子的初始位置
            var vInitX = -(s.width + s.imageMargin) * (s.page - 1);
            //判断滑动模式
            var lockAxial = null;
            if (_Private.displayRectBox.width < imageWidth) {
                _Interaction.currentHandle = 'slidescale';
            } else if (_Private.displayRectBox.height < imageHeight) {
                if (_Interaction.downTouchList[0].initAxial === 'x') {
                    lockAxial = 'y';
                } else if (_Interaction.downTouchList[0].initAxial === 'y') {
                    lockAxial = 'x';
                    _Interaction.currentHandle = 'slidescale';
                }
            }
            //当前位置
            var posX = vimg.firstPosition.x + moveX;
            var posY = vimg.firstPosition.y + moveY;
            //翻页位置
            var pageX = vInitX;
            //边界外最大左超出量
            var maxLeftBeyondX = imageWidth - _Private.displayRectBox.width;
            var maxTopBeyondX = imageHeight - _Private.displayRectBox.height;
            var maxPosX = _Private.displayRectBox.x - maxLeftBeyondX;
            var maxPosY = _Private.displayRectBox.y - maxTopBeyondX;
            //当前模式
            if (s.pattern === 'clipping') {
                //应用x轴
                if (posX > _Private.displayRectBox.x) {
                    posX = _Private.displayRectBox.x
                } else if (posX < maxPosX) {
                    posX = maxPosX;
                }
                if (posY > _Private.displayRectBox.y) {
                    posY = _Private.displayRectBox.y
                } else if (posY < maxPosY) {
                    posY = maxPosY;
                }
            } else {
                if (lockAxial !== 'x') {
                    if (_Private.displayRectBox.width < imageWidth) {
                        //边界外左右超出量
                        var leftBeyond = -posX;
                        var rightBeyond = maxLeftBeyondX - leftBeyond;
                        //判断方向
                        if (direc === 'left') {
                            if (rightBeyond > 0) {
                                pageX = vInitX;
                            } else {
                                if (pageX <= vInitX) {
                                    posX = -maxLeftBeyondX;
                                    pageX = vInitX + rightBeyond;
                                    if (_Interaction.viewBoxDataX < vInitX) {
                                        var beyond = _Interaction.viewBoxDataX - vInitX + moveX;
                                        pageX = vInitX + beyond;
                                    } else {
                                        //如果开始滑动时不处于边界
                                        if (s.page == s.vImageList.length ||
                                            Math.abs(vimg.firstPosition.x) !== imageWidth - s.width) {
                                            //如果超出边界，应用阻尼效果
                                            if (_Interaction.viewBoxDataX < vInitX) {
                                                var beyond = (_Interaction.viewBoxDataX - vInitX) / damping + moveX;
                                                pageX = vInitX + beyond * damping;
                                            } else if (pageX < vInitX) {
                                                pageX = vInitX + rightBeyond * damping;
                                            }
                                        } else {
                                            _Interaction.currentHandle = 'slide';
                                        }
                                    }
                                }
                            }
                        } else if (direc === 'right') {
                            if (leftBeyond > 0) {
                                pageX = vInitX;
                            } else {
                                if (pageX >= vInitX) {
                                    posX = 0;
                                    pageX = vInitX - leftBeyond;
                                    if (_Interaction.viewBoxDataX > vInitX) {
                                        pageX = _Interaction.viewBoxDataX + moveX;
                                    } else {
                                        //如果开始滑动时不处于边界
                                        if (vimg.firstPosition.x !== 0 || s.page == 1) {
                                            //如果超出边界，应用阻尼效果
                                            if (_Interaction.viewBoxDataX > vInitX) {
                                                pageX = (_Interaction.viewBoxDataX / damping + moveX) * damping;
                                            } else if (pageX > vInitX) {
                                                pageX = vInitX + (pageX - vInitX) * damping;
                                            }
                                        } else {
                                            _Interaction.currentHandle = 'slide';
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        //翻页
                        var lastX = -(s.width + s.imageMargin) * (s.vImageList.length - 1);
                        //应用
                        pageX = _Interaction.viewBoxDataX + moveX;
                        //如果超出边界，应用阻尼效果
                        if (pageX > 0) {
                            if (_Interaction.viewBoxDataX > vInitX) {
                                pageX = (_Interaction.viewBoxDataX / damping + moveX) * damping;
                            } else {
                                pageX = pageX * damping;
                            }
                        } else if (pageX < lastX) {
                            if (_Interaction.viewBoxDataX < vInitX) {
                                var beyond = (_Interaction.viewBoxDataX - vInitX) / damping + moveX;
                                pageX = vInitX + beyond * damping;
                            } else {
                                var beyond = pageX - vInitX;
                                pageX = vInitX + beyond * damping;
                            }
                        }
                        posX = vimg.firstPosition.x;
                    }
                } else {
                    posX = vimg.firstPosition.x;
                }
                if (lockAxial !== 'y') {
                    if (imageWidth > _Private.displayRectBox.width || imageHeight > _Private.displayRectBox.height) {
                        //应用y轴
                        if (posY > _Private.displayRectBox.y) {
                            if (vimg.firstPosition.y > _Private.displayRectBox.y) {
                                var beyond = (vimg.firstPosition.y - _Private.displayRectBox.y) / damping + moveY;
                                posY = _Private.displayRectBox.y + beyond * damping;
                            } else {
                                posY = _Private.displayRectBox.y + (posY - _Private.displayRectBox.y) * damping;
                            }
                        } else if (posY < maxPosY) {
                            if (vimg.firstPosition.y < maxPosY) {
                                var beyond = (vimg.firstPosition.y - maxPosY) / damping + moveY;
                                posY = maxPosY + beyond * damping;
                            } else {
                                posY = maxPosY + (posY - maxPosY) * damping;
                            }
                        }
                    } else {
                        posY = vimg.firstPosition.y;
                    }
                } else {
                    posY = vimg.firstPosition.y;
                }
            }
            _Interaction.touchPath.push(touch);
            vimg.position.x = Math.round(posX);
            vimg.position.y = Math.round(posY);
            _Private.viewBoxPositionX = pageX;
            //应用数据
            vimg.useDataToImage();
            _Private.setViewBoxPositionX();
        },
        //滑动结束
        slideend: function (touch) {
            var s = ImageView;
            touch.horDirection = touch.horDirection || _Interaction.lastMoveDirection;
            if (touch.isMove || _Private.viewBoxPositionX % s.width) {
                if (_Interaction.currentHandle === 'slidescale') {
                    var speed = _Interaction.getTouchMoveSpeed(100);
                    //惯性动画
                    s.vImageList[s.page - 1].scrollScreen(speed, touch);
                } else {
                    var speed = _Interaction.getTouchMoveSpeed(10);
                    //翻页
                    if (speed.x >= .2 && touch.horDirection === 'right') {
                        s.prevPage();
                    } else if (speed.x <= -.2 && touch.horDirection === 'left') {
                        s.nextPage();
                    } else {
                        _Interaction.basedSlideXSetPage(touch.horDirection);
                    }
                }
            } else {
                s.indexPage(s.page);
            }
            _Interaction.touchPath = [];
            _Interaction.currentHandle = null;
            _Interaction.lastMoveDirection = touch.horDirection;
        },
        //根据当前滑动位置判断当前页数
        basedSlideXSetPage: function (horDirection) {
            var s = ImageView;
            var viewWidth = s.width;
            var imageMargin = s.imageMargin * (s.page - 1);
            var viewLeft = Math.min(_Private.viewBoxPositionX + imageMargin, 0);
            var index = Math.abs(parseInt(viewLeft / viewWidth));
            if (horDirection === 'right') {
                var moveX = viewWidth - Math.abs(viewLeft % viewWidth);
                if (Math.abs(moveX / viewWidth) >= .2) {
                    s.indexPage(index + 1);
                } else {
                    s.indexPage(s.page);
                }
            } else if (horDirection === 'left') {
                var moveX = viewLeft % viewWidth;
                if (Math.abs(moveX / viewWidth) >= .2) {
                    s.indexPage(index + 2);
                } else {
                    s.indexPage(s.page);
                }
            }
        },
        //获取指定毫秒数内手指移动的速度
        getTouchMoveSpeed: function (time) {
            var isfind;
            var SpeedList = { x: 0, y: 0 };
            var length = _Interaction.touchPath.length;
            if (length > 1) {
                if (Date.now() - _Interaction.touchPath[length - 1].timestamp < 100) {
                    isfind = false;
                    var newTouch = _Interaction.touchPath[length - 1];
                    var timestamp = newTouch.timestamp - time;
                    for (var i = length - 1; i >= 0; i--) {
                        var item = _Interaction.touchPath[i];
                        if (item.timestamp === timestamp) {
                            isfind = true;
                            SpeedList.x = newTouch.clientX - item.clientX;
                            SpeedList.y = newTouch.clientY - item.clientY;
                            break;
                        } else if (item.timestamp < timestamp) {
                            isfind = true;
                            minTouch = item;
                            maxTouch = _Interaction.touchPath[i + 1];
                            ratio = (timestamp - minTouch.timestamp) / (maxTouch.timestamp - minTouch.timestamp);
                            SpeedList.x = newTouch.clientX - ((maxTouch.clientX - minTouch.clientX) * ratio + minTouch.clientX);
                            SpeedList.y = newTouch.clientY - ((maxTouch.clientY - minTouch.clientY) * ratio + minTouch.clientY);
                            break;
                        }
                    }
                    if (!isfind) {
                        ratio = (newTouch.timestamp - _Interaction.touchPath[0].timestamp) / time;
                        SpeedList.x = (newTouch.clientX - _Interaction.touchPath[0].clientX) / ratio;
                        SpeedList.y = (newTouch.clientY - _Interaction.touchPath[0].clientY) / ratio;
                    }
                }
            }
            return SpeedList;
        },
        /*
            缩放功能
        */
        //当有两根或多根手指放到屏幕上的时候触发
        gesturestart: function () {
            //当前页的图片对象
            var vimg = ImageView.vImageList[ImageView.page - 1];
            var ratioX = (_Interaction.downTouchList[0].clientX - vimg.position.x) / (vimg.width * vimg.scale);
            var ratioY = (_Interaction.downTouchList[0].clientY - vimg.position.y) / (vimg.height * vimg.scale);
            vimg.lastScale = vimg.scale;
            vimg.anchor.x = vimg.width * ratioX;
            vimg.anchor.y = vimg.height * ratioY;
            vimg.firstPosition.x = vimg.position.x - (1 - vimg.scale) * vimg.anchor.x;
            vimg.firstPosition.y = vimg.position.y - (1 - vimg.scale) * vimg.anchor.y;
        },
        //当有两根或多根手指在屏幕上，并且有手指移动的时候触发
        gesturechange: function (touch1, touch2) {
            var scale = _Interaction.getDistance(touch1, touch2) / _Interaction.getDistance(_Interaction.downTouchList[0], _Interaction.downTouchList[1]);
            var rotate = 0;
            //当前页的图片对象
            var vimg = ImageView.vImageList[ImageView.page - 1];
            //修正位置
            var a = 1, b = 0, c = 0, d = 1, tx, ty;
            //旋转
            if (ImageView.isGestureRotate && ImageView.pattern !== 'clipping') {
                rotate = _Interaction.getAngle(touch1, touch2) - _Interaction.getAngle(_Interaction.downTouchList[0], _Interaction.downTouchList[1]);
                if (rotate > 180) {
                    rotate = -(360 - rotate);
                }
                var pi = Math.PI / 180;
                var radian = pi * rotate;
                var cos = Math.cos(radian);
                var sin = Math.sin(radian);
                a = cos;
                b = sin;
                c = -sin;
                d = cos;
            }
            //缩放
            scale *= vimg.lastScale;
            a *= scale;
            b *= scale;
            c *= scale;
            d *= scale;
            //应用原点调整位置
            var tx = 0;
            var ty = 0;
            tx = touch1.clientX - (vimg.anchor.x * a + vimg.anchor.y * c);
            ty = touch1.clientY - (vimg.anchor.y * d + vimg.anchor.x * b);
            //计算两根手指的中心点
            var centerX = (touch1.clientX + touch2.clientX) / 2;
            var centerY = (touch1.clientY + touch2.clientY) / 2;
            var ratioX = (centerX - vimg.position.x) / (vimg.width * vimg.scale);
            var ratioY = (centerY - vimg.position.y) / (vimg.height * vimg.scale);
            vimg.lastAnchor.x = vimg.width * ratioX;
            vimg.lastAnchor.y = vimg.height * ratioY;
            //应用
            vimg.scale = scale;
            vimg.rotate = rotate;
            vimg.position.x = tx;
            vimg.position.y = ty;
            vimg.useDataToImage();
        },
        //当倒数第二根手指提起的时候触发，结束gesture
        gestureend: function (touch) {
            _Interaction.currentHandle = null;
            _Interaction.downTouchList = [];
            _Interaction.viewBoxDataX = _Private.viewBoxPositionX;
            ImageView.indexPage(ImageView.page);
        },
        //获取获取两点之间的距离
        getDistance: function (p1, p2) {
            var x = p2.clientX - p1.clientX,
                y = p2.clientY - p1.clientY;
            return Math.sqrt((x * x) + (y * y));
        },
        //获取两点之间的夹角
        getAngle: function (p1, p2) {
            var x = p1.clientX - p2.clientX,
                y = p1.clientY - p2.clientY;
            return Math.atan2(y, x) * 180 / Math.PI;
        }
    };
    //元素
    var _Element = {};
    //私有方法
    var _Private = {
        //显示盒子位置
        viewBoxPositionX: 0,
        //显示区域矩形盒子
        displayRectBox: {},
        //初始化
        init: function () {
            var s = ImageView;
            //插入样式
            document.head.innerHTML = "<style>html{font-size:100px;font-size:31.25vw}body{font-size:14px}.imageViewer{position:fixed;top:0;right:0;bottom:0;left:0;z-index:100000;font-size:.14rem;color:#3f3f3f;-webkit-user-select:none;user-select:none}.imageViewer .iv_hide{display:none!important}.imageViewer .iv_lArrow{position:relative;display:inline-block;width:.16rem;height:.16rem;vertical-align:sub}.imageViewer .iv_lArrow:after{position:absolute;top:50%;left:70%;box-sizing:border-box;width:70%;height:70%;border:2px solid #989898;content:'';-webkit-transform:translate3d(-50%,-50%,0) rotateZ(-45deg);transform:translate3d(-50%,-50%,0) rotateZ(-45deg);border-right-color:transparent!important;border-bottom-color:transparent!important}.imageViewer .iv_checkboxs{position:relative;display:inline-block;width:.16rem;height:.16rem;border:1px solid #bbb;border-radius:.02rem;vertical-align:top}.imageViewer .iv_checkboxs:after{position:absolute;top:40%;left:50%;display:none;box-sizing:border-box;width:70%;height:40%;border:2px solid #fff;content:'';-webkit-transform:translate3d(-50%,-50%,0) rotateZ(-45deg);transform:translate3d(-50%,-50%,0) rotateZ(-45deg);border-top-color:transparent!important;border-right-color:transparent!important}.imageViewer .iv_checkboxs[data-checked=true]{border-color:#1ccda6;background:#1ccda6}.imageViewer .iv_checkboxs[data-checked=true]:after{display:block}.imageViewer .iv_checkalone{float:right}.imageViewer .iv_checkall{float:left}.imageViewer .iv_block{position:absolute;right:0;left:0;top:0;bottom:0;z-index:100}.imageViewer .iv_head{position:absolute;right:0;left:0;top:0;z-index:50;height:.4rem;background:#fff;-webkit-transform:translateY(-100%);transform:translateY(-100%)}.imageViewer .iv_head:after{position:absolute;right:0;bottom:0;left:0;height:1px;background:#b2b2b2;content:'';-webkit-transform:scaleY(.5);transform:scaleY(.5);-webkit-transform-origin:0 100%;transform-origin:0 100%}.imageViewer .iv_head .iv_closebtn{position:relative;z-index:2;float:left;padding:.09rem}.imageViewer .iv_head .iv_closebtn:after{position:absolute;top:50%;right:0;width:0;height:50%;border-right:1px solid #ddd;content:'';-webkit-transform:translateY(-50%);transform:translateY(-50%)}.imageViewer .iv_head .iv_lArrow{width:.22rem;height:.22rem}.imageViewer .iv_head .iv_lArrow:after{border-color:#666}.imageViewer .iv_head .iv_title{position:absolute;top:50%;padding-left:.5rem;-webkit-transform:translateY(-50%);transform:translateY(-50%)}.imageViewer .iv_head .iv_confbtn,.imageViewer .iv_head .iv_delbtn{float:right;margin:.06rem;padding:.06rem .1rem;border-radius:.02rem;background:#f74c48;color:#fff;font-size:.12rem;line-height:.16rem}.imageViewer .iv_head .iv_delbtn:active{background:#e43430}.imageViewer .iv_head .iv_confbtn{padding:.06rem .15rem;background:#48ce55}.imageViewer .iv_head .iv_confbtn:active{background:#2fbf3d}.imageViewer .iv_head .iv_confbtn[disabled],.imageViewer .iv_head .iv_confbtn[disabled]:active,.imageViewer .iv_head .iv_delbtn[disabled],.imageViewer .iv_head .iv_delbtn[disabled]:active{background:#ccc}.imageViewer .iv_bottom{position:absolute;right:0;left:0;bottom:0;z-index:50;height:.4rem;background:#fff;-webkit-transform:translateY(100%);transform:translateY(100%)}.imageViewer .iv_bottom:before{position:absolute;top:0;right:0;left:0;height:1px;background:#b2b2b2;content:'';-webkit-transform:scaleY(.5);transform:scaleY(.5);-webkit-transform-origin:0 0;transform-origin:0 0}.imageViewer .iv_view{position:absolute;top:0;right:0;bottom:0;left:0;z-index:4;overflow:hidden;background:#2b2b2b;color:#fff;opacity:0}.imageViewer .iv_masks{top:50%;left:50%;z-index:20;box-sizing:border-box;border:1px solid #fff;box-shadow:0 0 0 3rem rgba(0,0,0,.6);-webkit-transform:translate3d(-50%,-50%,0);transform:translate3d(-50%,-50%,0);pointer-events:none}.imageViewer .iv_masks,.imageViewer .iv_viewBox{position:absolute;width:100%;height:100%}.imageViewer .iv_view img{position:absolute;top:0;left:0;-webkit-transform-origin:0 0;transform-origin:0 0}.imageViewer .iv_check{padding:.11rem .1rem;line-height:.18rem}.imageViewer .iv_check .iv_checkboxs{margin-right:.05rem;border-color:#bbb}.imageViewer .iv_check .iv_checkboxs[data-checked=true]{border-color:#48ce55;background:#48ce55}.imageViewer .iv_animate{position:absolute;top:0;left:0;z-index:10;-webkit-transform-origin:0 0;transform-origin:0 0}.imageViewer .iv_animate .iv_img{position:absolute;top:0;right:0;bottom:0;left:0;background-size:100% 100%;background-repeat:no-repeat}.imageViewer.iv_fade_in .iv_view{opacity:1;-webkit-transition:opacity .2s ease-out;transition:opacity .2s ease-out}.imageViewer.iv_fade_in .iv_bottom,.imageViewer.iv_fade_in .iv_head{-webkit-transition:-webkit-transform .2s ease-out;transition:transform .2s ease-out;-webkit-transform:translateY(0);transform:translateY(0)}.imageViewer.iv_fade_out .iv_view{opacity:0;-webkit-transition:opacity .2s ease-out;transition:opacity .2s ease-out}.imageViewer.iv_fade_out .iv_head,.imageViewer.iv_full .iv_head{-webkit-transition:-webkit-transform .2s ease-out;transition:transform .2s ease-out;-webkit-transform:translateY(-100%);transform:translateY(-100%)}.imageViewer.iv_fade_out .iv_bottom,.imageViewer.iv_full .iv_bottom{-webkit-transition:-webkit-transform .2s ease-out;transition:transform .2s ease-out;-webkit-transform:translateY(100%);transform:translateY(100%)}.imageViewer.iv_fade_out .iv_view{pointer-events:none}.imageViewer[data-pattern=clipping] .iv_bottom,.imageViewer[data-pattern=clipping] .iv_head .iv_delbtn,.imageViewer[data-pattern=clipping] .iv_head .iv_title,.imageViewer[data-pattern=default] .iv_bottom,.imageViewer[data-pattern=default] .iv_head,.imageViewer[data-pattern=default] .iv_masks,.imageViewer[data-pattern=edit] .iv_head .iv_confbtn,.imageViewer[data-pattern=edit] .iv_masks{display:none}.imageViewer[data-state=in] .iv_animate,.imageViewer[data-state=in] .iv_animate .iv_img{-webkit-transition:all .2s cubic-bezier(0,0,.1,1);transition:all .2s cubic-bezier(0,0,.1,1)}.imageViewer[data-state=in] .iv_masks,.imageViewer[data-state=out] .iv_animate,.imageViewer[data-state=out] .iv_animate .iv_img,.imageViewer[data-state=out] .iv_masks{-webkit-transition:all .2s cubic-bezier(0,0,0,1);transition:all .2s cubic-bezier(0,0,0,1)}.imageViewer[data-state=in] .iv_viewBox,.imageViewer[data-state=out] .iv_viewBox{display:none}</style>" + document.head.innerHTML;
            //插入元素
            _Element.container = document.createElement('div');
            _Element.container.addClass('imageViewer iv_hide');
            _Element.container.innerHTML = '<div class="iv_masks"></div><div class="iv_block"></div><div class="iv_animate"><div class="iv_img"></div></div><div class="iv_head"><div class="iv_closebtn"><div class="iv_lArrow"><i></i></div></div><div class="iv_title">0/0</div><div class="iv_delbtn">删除</div><div class="iv_confbtn">完成</div></div><div class="iv_view"><div class="iv_viewBox"></div></div><div class="iv_bottom"><div class="iv_check iv_checkall"><div class="iv_checkboxs"></div><span class="text">全选</span></div><div class="iv_check iv_checkalone"><div class="iv_checkboxs"></div><span class="text">选择</span></div></div>';
            _Element.iv_masks = _Element.container.querySelector('.iv_masks');
            _Element.iv_view = _Element.container.querySelector('.iv_view');
            _Element.iv_viewBox = _Element.container.querySelector('.iv_viewBox');
            _Element.iv_block = _Element.container.querySelector('.iv_block');
            _Element.iv_animate = _Element.container.querySelector('.iv_animate');
            _Element.iv_img = _Element.iv_animate.querySelector('.iv_img');
            _Element.iv_head = _Element.container.querySelector('.iv_head');
            _Element.iv_closebtn = _Element.iv_head.querySelector('.iv_closebtn');
            _Element.iv_title = _Element.iv_head.querySelector('.iv_title');
            _Element.iv_delbtn = _Element.iv_head.querySelector('.iv_delbtn');
            _Element.iv_confbtn = _Element.iv_head.querySelector('.iv_confbtn');
            _Element.iv_bottom = _Element.container.querySelector('.iv_bottom');
            _Element.iv_checkalone = _Element.iv_bottom.querySelector('.iv_checkalone');
            _Element.iv_checkall = _Element.iv_bottom.querySelector('.iv_checkall');
            _Element.iv_checkboxs = _Element.iv_checkalone.querySelector('.iv_checkboxs');
            _Element.iv_checkboxsAll = _Element.iv_checkall.querySelector('.iv_checkboxs');
            //多选按钮事件
            _Element.iv_checkalone.addEventListener('click', function () {
                _Private.checkboxsEvent();
                if (_Element.iv_checkboxs.getAttribute('data-checked') === 'true') {
                    s.vImageList[s.page - 1].selected = true;
                } else {
                    s.vImageList[s.page - 1].selected = false;
                }
                _Private.updatePageData();
            });
            //全选按钮事件
            _Element.iv_checkall.addEventListener('click', function () {
                _Private.checkboxsEvent();
                if (_Element.iv_checkboxsAll.getAttribute('data-checked') === 'true') {
                    s.vImageList.forEach(function (item) {
                        item.selected = true;
                    });
                } else {
                    s.vImageList.forEach(function (item) {
                        item.selected = false;
                    });
                }
                _Private.updatePageData();
            });
            //删除按钮事件
            _Element.iv_delbtn.addEventListener('click', function () {
                var s = ImageView;
                if (_Element.iv_delbtn.getAttribute('disabled') === null) {
                    var list = _Private.getSelectedImage();
                    list.forEach(function (item, i) {
                        list[i] = {
                            index: item.index,
                            target: item.target
                        };
                    });
                    if (list.length) {
                        s.dispatchEvent('delete', list);
                    }
                    s.close();
                }
            });
            //关闭按钮事件
            _Element.iv_closebtn.addEventListener('click', function () {
                ImageView.close();
            });
            //裁剪完成按钮事件
            _Element.iv_confbtn.addEventListener('click', function () {
                if (_Element.iv_confbtn.getAttribute('disabled') === null) {
                    _Element.iv_confbtn.innerText = '加载中...';
                    _Element.iv_confbtn.setAttribute('disabled', '');
                    setTimeout(function () {
                        var image = _Private.importClippingtoImage();
                        s.close();
                        s.dispatchEvent('clipping', image);
                    });
                }
            });
            //绑定交互事件
            if ('ontouchend' in document) {
                _Element.iv_view.addEventListener('touchstart', _Interaction.down, { passive: false });
                _Element.iv_view.addEventListener('touchmove', _Interaction.move, { passive: false });
                _Element.iv_view.addEventListener('touchend', _Interaction.up, { passive: false });
            } else {
                _Element.iv_view.addEventListener('mousedown', function (e) {
                    e.changedTouches = [{
                        clientX: e.clientX,
                        clientY: e.clientY,
                        identifier: 99999
                    }];
                    _Interaction.down(e);
                }, { passive: false });
                _Element.iv_view.addEventListener('mousemove', function (e) {
                    e.touches = [{
                        clientX: e.clientX,
                        clientY: e.clientY,
                        identifier: 99999
                    }];
                    _Interaction.move(e);
                }, { passive: false });
                _Element.iv_view.addEventListener('mouseup', function (e) {
                    e.changedTouches = [{
                        clientX: e.clientX,
                        clientY: e.clientY,
                        identifier: 99999
                    }];
                    _Interaction.up(e);
                }, { passive: false });
            }
            //显示动画完成回调事件
            s.on('show', function () {
                s.state = 'show';
            });
            //关闭动画完成回调事件
            s.on('close', function () {
                s.state = 'close';
                //还原初始状态
                s.restore();
            });
            //浏览器窗口大小发生改变时调整显示
            window.addEventListener('resize', function () {
                if (s.state === 'show') {
                    s.width = window.innerWidth;
                    s.height = window.innerHeight;
                    if (s.pattern === 'clipping') {
                        _Private.clippingMaskAdaptContainerSize();
                    } else {
                        _Private.displayRectBox.x = 0;
                        _Private.displayRectBox.y = 0;
                        _Private.displayRectBox.width = s.width;
                        _Private.displayRectBox.height = s.height;
                    }
                    s.vImageList.forEach(function (item) {
                        item.defaultAdaption();
                        item.useDataToImage();
                    });
                    //设置当前页为选中状态
                    _Private.viewBoxPositionX = -(s.width + s.imageMargin) * (s.page - 1);
                    _Private.setViewBoxPositionX();
                }
            });
        },
        //无动画显示
        notAnimateShow: function () {
            var s = ImageView;
            _Element.iv_block.removeClass('iv_hide');
            setTimeout(function () {
                _Element.container.setAttribute('data-state', 'default');
                _Element.container.removeClass('iv_fade_out').addClass('iv_fade_in');
                if (s.pattern === 'clipping') {
                    _Element.iv_masks.css({
                        width: _Private.displayRectBox.width + 'px',
                        height: _Private.displayRectBox.height + 'px',
                        borderRadius: _Private.displayRectBox.clippingRadius + 'px'
                    });
                }
                setTimeout(function () {
                    _Element.iv_block.addClass('iv_hide');
                    s.dispatchEvent('show');
                }, 200);
            }, 40);
        },
        //无动画关闭
        notAnimateClose: function () {
            var s = ImageView;
            _Element.iv_block.removeClass('iv_hide');
            setTimeout(function () {
                _Element.container.setAttribute('data-state', 'default');
                _Element.container.removeClass('iv_fade_in').addClass('iv_fade_out');
                if (s.pattern === 'clipping') {
                    _Element.iv_masks.css({ width: '100%', height: '100%', borderRadius: '0' });
                }
                setTimeout(function () {
                    _Element.iv_block.addClass('iv_hide');
                    _Element.container.remove();
                    s.dispatchEvent('close');
                }, 200);
            }, 40);
        },
        //图像渐入动画
        imagesEaseinAnimate: function () {
            var s = ImageView;
            var pageIndex = s.page - 1;
            var vimg = s.vImageList[pageIndex];
            //显示遮挡层
            _Element.iv_block.removeClass('iv_hide');
            //当前页图片加载完成后显示
            vimg.onLoad = function () {
                //当前宽高
                var imageWidth = Math.round(vimg.width * vimg.scale);
                var imageHeight = Math.round(vimg.height * vimg.scale);
                //根据元素类型获取显示数据
                if (vimg.target.nodeName.toLowerCase() === 'img') {
                    var rectbox = _Private.getTargetImagesData();
                } else {
                    var rectbox = _Private.getTargetBackData();
                }
                //动画前的准备
                _Element.iv_animate.css({
                    width: rectbox.displayWidth + 'px',
                    height: rectbox.displayHeight + 'px',
                    transform: 'translate3d(' + rectbox.displayLeft + 'px, ' + rectbox.displayTop + 'px, 0) scale3d(1,1,1)'
                });
                _Element.iv_img.css({
                    backgroundImage: 'url(' + vimg.src + ')',
                    clipPath: 'polygon(' + rectbox.retpos[0][0] + 'px ' + rectbox.retpos[0][1] + 'px, ' + rectbox.retpos[1][0] + 'px ' + rectbox.retpos[1][1] + 'px, ' + rectbox.retpos[2][0] + 'px ' + rectbox.retpos[2][1] + 'px, ' + rectbox.retpos[3][0] + 'px ' + rectbox.retpos[3][1] + 'px)'
                });
                _Element.iv_animate.removeClass('iv_hide');
                //延迟动画
                setTimeout(function () {
                    var scale = imageWidth / rectbox.displayWidth;
                    _Element.container.setAttribute('data-state', 'in');
                    _Element.iv_animate.css({
                        transform: 'translate3d(' + vimg.position.x + 'px, ' + vimg.position.y + 'px, 0) scale3d(' + scale + ',' + scale + ',1)'
                    });
                    _Element.iv_img.css({ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
                    if (s.pattern === 'clipping') {
                        _Element.iv_masks.css({
                            width: _Private.displayRectBox.width + 'px',
                            height: _Private.displayRectBox.height + 'px',
                            borderRadius: _Private.displayRectBox.clippingRadius + 'px'
                        });
                    }
                    _Element.container.removeClass('iv_fade_out').addClass('iv_fade_in');
                    setTimeout(function () {
                        _Element.iv_block.addClass('iv_hide');
                        _Element.iv_animate.addClass('iv_hide').setAttribute('data-state', '');
                        _Element.container.setAttribute('data-state', 'default');
                        s.dispatchEvent('show');
                    }, 200);
                }, 40);
            };
            if (vimg.isload) {
                vimg.onLoad.call(vimg);
            }
        },
        //图像渐出动画
        imagesEaseoutAnimate: function () {
            var s = ImageView;
            var pageIndex = s.page - 1;
            var vimg = s.vImageList[pageIndex];
            //当前宽高
            var imageWidth = Math.round(vimg.width * vimg.scale);
            var imageHeight = Math.round(vimg.height * vimg.scale);
            //根据元素类型获取显示数据
            if (vimg.target.nodeName.toLowerCase() === 'img') {
                var rectbox = _Private.getTargetImagesData();
            } else {
                var rectbox = _Private.getTargetBackData();
            }
            //动画前的准备
            _Element.iv_animate.css({
                width: imageWidth + 'px',
                height: imageHeight + 'px',
                transform: 'translate3d(' + vimg.position.x + 'px, ' + vimg.position.y + 'px, 0) scale3d(1,1,1)'
            });
            _Element.iv_img.css({
                backgroundImage: 'url(' + vimg.src + ')',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            });
            _Element.iv_block.removeClass('iv_hide');
            _Element.iv_animate.removeClass('iv_hide');
            //动画开始
            setTimeout(function () {
                var scale = rectbox.displayWidth / imageWidth;
                _Element.container.setAttribute('data-state', 'out');
                _Element.iv_animate.css({
                    transform: 'translate3d(' + rectbox.displayLeft + 'px, ' + rectbox.displayTop + 'px, 0) scale3d(' + scale + ',' + scale + ',1)'
                });
                _Element.iv_img.css({
                    clipPath: 'polygon(' + rectbox.retpos[0][0] / scale + 'px ' + rectbox.retpos[0][1] / scale + 'px, ' + rectbox.retpos[1][0] / scale + 'px ' + rectbox.retpos[1][1] / scale + 'px, ' + rectbox.retpos[2][0] / scale + 'px ' + rectbox.retpos[2][1] / scale + 'px, ' + rectbox.retpos[3][0] / scale + 'px ' + rectbox.retpos[3][1] / scale + 'px)'
                });
                if (s.pattern === 'clipping') {
                    _Element.iv_masks.css({ width: '100%', height: '100%', borderRadius: '0' });
                }
                _Element.container.removeClass('iv_fade_in').addClass('iv_fade_out');
                setTimeout(function () {
                    _Element.iv_block.addClass('iv_hide');
                    _Element.iv_animate.addClass('iv_hide').setAttribute('data-state', '');
                    _Element.container.setAttribute('data-state', 'default');
                    _Element.container.removeClass('iv_fade_out').remove();
                    s.dispatchEvent('close');
                }, 200);
            }, 40);
        },
        //获取当前页目标元素背景数据
        getTargetBackData: function () {
            var s = ImageView;
            var pageIndex = s.page - 1;
            //当前页的图片对象
            var vimg = s.vImageList[pageIndex];
            //获取当前页目标元素
            var targetElement = s.vImageList[pageIndex].target;
            var targetRectbox = targetElement.getBoundingClientRect();
            var displayRectbox = {};
            var parentNode = targetElement.parentNode;
            var borderTop = targetElement.getComputedStyle('borderTopWidth');
            var borderLeft = targetElement.getComputedStyle('borderLeftWidth');
            var borderRight = targetElement.getComputedStyle('borderRightWidth');
            var borderBottom = targetElement.getComputedStyle('borderBottomWidth');
            //目标图片可见区域
            displayRectbox.visibleTop = targetRectbox.top + borderTop;
            displayRectbox.visibleLeft = targetRectbox.left + borderLeft;
            displayRectbox.visibleWidth = targetRectbox.width - borderRight - borderLeft;
            displayRectbox.visibleHeight = targetRectbox.height - borderBottom - borderTop;
            //目标图片真实区域
            displayRectbox.displayTop = targetRectbox.top;
            displayRectbox.displayLeft = targetRectbox.left;
            displayRectbox.displayWidth = targetRectbox.width;
            displayRectbox.displayHeight = targetRectbox.height;
            //向上遍历dom树
            while (parentNode && parentNode !== document) {
                var isContainer = false;
                if (parentNode.getComputedStyle('width') < targetElement.getComputedStyle('width')) {
                    switch (parentNode.getComputedStyle('overflowX')) {
                        case 'auto':
                        case 'scroll':
                        case 'hidden': isContainer = true; break;
                    }
                } else if (parentNode.getComputedStyle('height') < targetElement.getComputedStyle('height')) {
                    switch (parentNode.getComputedStyle('overflowY')) {
                        case 'auto':
                        case 'scroll':
                        case 'hidden': isContainer = true; break;
                    }
                }
                if (isContainer) {
                    var rectbox = parentNode.getBoundingClientRect();
                    if (rectbox.top > targetRectbox.top) {
                        displayRectbox.visibleTop = rectbox.top + parentNode.getComputedStyle('borderTopWidth');
                        displayRectbox.visibleHeight -= (displayRectbox.visibleTop - targetRectbox.top);
                    }
                    if (rectbox.bottom < targetRectbox.bottom) {
                        displayRectbox.visibleHeight -= (targetRectbox.top + targetRectbox.height) - (rectbox.top + rectbox.height);
                    }
                    if (rectbox.left > targetRectbox.left) {
                        displayRectbox.visibleLeft = rectbox.left + parentNode.getComputedStyle('borderLeftWidth');
                        displayRectbox.visibleWidth -= (displayRectbox.visibleLeft - targetRectbox.left);
                    }
                    if (rectbox.right < targetRectbox.right) {
                        displayRectbox.visibleWidth -= (targetRectbox.left + targetRectbox.width) - (rectbox.left + rectbox.width);
                    }
                    displayRectbox.visibleWidth -= parentNode.getComputedStyle('borderRightWidth');
                    displayRectbox.visibleHeight -= parentNode.getComputedStyle('borderBottomWidth');
                }
                parentNode = parentNode.parentNode;
            }
            //背景大小属性
            var res;
            var backgroundSize = getComputedStyle(targetElement)['backgroundSize'];
            if (res = /^([0-9.]+)([a-z%]+)$/.exec(backgroundSize)) {
                //高度适应宽度
                switch (res[2]) {
                    case 'px': displayRectbox.displayWidth = res[1] * displayRectbox.displayWidth; break;
                    case '%': displayRectbox.displayWidth = res[1] / 100 * displayRectbox.displayWidth; break;
                }
                displayRectbox.displayHeight = displayRectbox.displayWidth / vimg.width * vimg.height;
            } else if (res = /^auto ([0-9.]+)([a-z%]+)$/i.exec(backgroundSize)) {
                //宽度适应高度
                switch (res[2]) {
                    case 'px': displayRectbox.displayHeight = res[1] * displayRectbox.displayHeight; break;
                    case '%': displayRectbox.displayHeight = res[1] / 100 * displayRectbox.displayHeight; break;
                }
                displayRectbox.displayWidth = displayRectbox.displayHeight / vimg.height * vimg.width;
            } else if (res = /^([0-9.]+)([a-z%]+) ([0-9.]+)([a-z%]+)$/.exec(backgroundSize)) {
                //自定义宽高
                switch (res[2]) {
                    case 'px': displayRectbox.displayWidth = Number(res[1]); break;
                    case '%': displayRectbox.displayWidth = res[1] / 100 * displayRectbox.displayWidth; break;
                }
                switch (res[4]) {
                    case 'px': displayRectbox.displayHeight = Number(res[3]); break;
                    case '%': displayRectbox.displayHeight = res[3] / 100 * displayRectbox.displayHeight; break;
                }
            } else if (backgroundSize === 'cover') {
                //缩放到最小宽高
                displayRectbox.displayWidth = displayRectbox.visibleHeight / vimg.height * vimg.width;
                displayRectbox.displayHeight = displayRectbox.visibleWidth / vimg.width * vimg.height;
                if (displayRectbox.displayWidth >= displayRectbox.visibleWidth) {
                    displayRectbox.displayHeight = displayRectbox.displayWidth / vimg.width * vimg.height;
                } else {
                    displayRectbox.displayWidth = displayRectbox.displayHeight / vimg.height * vimg.width;
                }
            } else if (backgroundSize === 'contain') {
                //缩放到最大宽高
                displayRectbox.displayWidth = displayRectbox.visibleHeight / vimg.height * vimg.width;
                displayRectbox.displayHeight = displayRectbox.visibleWidth / vimg.width * vimg.height;
                if (displayRectbox.displayWidth <= displayRectbox.visibleWidth) {
                    displayRectbox.displayHeight = displayRectbox.displayWidth / vimg.width * vimg.height;
                } else {
                    displayRectbox.displayWidth = displayRectbox.displayHeight / vimg.height * vimg.width;
                }
            }
            displayRectbox.displayWidth = Math.round(displayRectbox.displayWidth);
            displayRectbox.displayHeight = Math.round(displayRectbox.displayHeight);
            //背景定位属性
            var ratioX, ratioY;
            var backgroundPositionX = getComputedStyle(targetElement)['backgroundPositionX'] || 0;
            var backgroundPositionY = getComputedStyle(targetElement)['backgroundPositionY'] || 0;
            if (res = /^([0-9.]+)([a-z%]+)$/.exec(backgroundPositionX)) {
                switch (res[2]) {
                    case 'px': displayRectbox.displayLeft = Number(res[1]) + displayRectbox.visibleLeft; break;
                    case '%': ratioX = res[1] / 100; break;
                }
            }
            if (res = /^([0-9.]+)([a-z%]+)$/.exec(backgroundPositionY)) {
                switch (res[2]) {
                    case 'px': displayRectbox.displayTop = Number(res[1]) + displayRectbox.visibleTop; break;
                    case '%': ratioY = res[1] / 100; break;
                }
            }
            if (ratioX !== undefined) {
                displayRectbox.displayLeft = (displayRectbox.visibleWidth - displayRectbox.displayWidth) * ratioX + displayRectbox.visibleLeft;
            }
            if (ratioY !== undefined) {
                displayRectbox.displayTop = (displayRectbox.visibleHeight - displayRectbox.displayHeight) * ratioY + displayRectbox.visibleTop;
            }
            //可见区域相对于真实区域的矩形坐标点
            displayRectbox.retpos = [];
            displayRectbox.retpos[0] = [
                    displayRectbox.visibleLeft - displayRectbox.displayLeft,
                    displayRectbox.visibleTop - displayRectbox.displayTop
            ];
            displayRectbox.retpos[1] = [
                    displayRectbox.retpos[0][0] + displayRectbox.visibleWidth,
                    displayRectbox.retpos[0][1],
            ];
            displayRectbox.retpos[2] = [
                    displayRectbox.retpos[1][0],
                    displayRectbox.retpos[1][1] + displayRectbox.visibleHeight,
            ];
            displayRectbox.retpos[3] = [
                    displayRectbox.retpos[0][0],
                    displayRectbox.retpos[0][1] + displayRectbox.visibleHeight,
            ];
            vimg.targetData.visibleTop = displayRectbox.visibleTop;
            vimg.targetData.visibleLeft = displayRectbox.visibleLeft;
            vimg.targetData.visibleWidth = displayRectbox.visibleWidth;
            vimg.targetData.visibleHeight = displayRectbox.visibleHeight;
            return displayRectbox;
        },
        //获取当前页目标图片数据
        getTargetImagesData: function () {
            var s = ImageView;
            var pageIndex = s.page - 1;
            //当前页的图片对象
            var vimg = s.vImageList[pageIndex];
            //获取当前页目标元素
            var targetElement = s.vImageList[pageIndex].target;
            var targetRectbox = targetElement.getBoundingClientRect();
            var displayRectbox = {};
            var parentNode = targetElement.parentNode;
            //目标图片可见区域
            displayRectbox.visibleTop = targetRectbox.top;
            displayRectbox.visibleLeft = targetRectbox.left;
            displayRectbox.visibleWidth = targetRectbox.width;
            displayRectbox.visibleHeight = targetRectbox.height;
            //目标图片真实区域
            displayRectbox.displayTop = targetRectbox.top;
            displayRectbox.displayLeft = targetRectbox.left;
            displayRectbox.displayWidth = targetRectbox.width;
            displayRectbox.displayHeight = targetRectbox.height;
            //向上遍历dom树
            while (parentNode && parentNode !== document) {
                var isContainer = false;
                if (parentNode.getComputedStyle('width') < targetElement.getComputedStyle('width')) {
                    switch (parentNode.getComputedStyle('overflowX')) {
                        case 'auto':
                        case 'scroll':
                        case 'hidden': isContainer = true; break;
                    }
                } else if (parentNode.getComputedStyle('height') < targetElement.getComputedStyle('height')) {
                    switch (parentNode.getComputedStyle('overflowY')) {
                        case 'auto':
                        case 'scroll':
                        case 'hidden': isContainer = true; break;
                    }
                }
                if (isContainer) {
                    var rectbox = parentNode.getBoundingClientRect();
                    if (rectbox.top > targetRectbox.top) {
                        displayRectbox.visibleTop = rectbox.top + parentNode.getComputedStyle('borderTopWidth');
                        displayRectbox.visibleHeight -= (displayRectbox.visibleTop - targetRectbox.top);
                    }
                    if (rectbox.bottom < targetRectbox.bottom) {
                        displayRectbox.visibleHeight -= (targetRectbox.top + targetRectbox.height) - (rectbox.top + rectbox.height);
                    }
                    if (rectbox.left > targetRectbox.left) {
                        displayRectbox.visibleLeft = rectbox.left + parentNode.getComputedStyle('borderLeftWidth');
                        displayRectbox.visibleWidth -= (displayRectbox.visibleLeft - targetRectbox.left);
                    }
                    if (rectbox.right < targetRectbox.right) {
                        displayRectbox.visibleWidth -= (targetRectbox.left + targetRectbox.width) - (rectbox.left + rectbox.width);
                    }
                    displayRectbox.visibleWidth -= parentNode.getComputedStyle('borderRightWidth');
                    displayRectbox.visibleHeight -= parentNode.getComputedStyle('borderBottomWidth');
                }
                parentNode = parentNode.parentNode;
            }
            //可见区域相对于真实区域的矩形坐标点
            displayRectbox.retpos = [];
            displayRectbox.retpos[0] = [
                    displayRectbox.visibleLeft - displayRectbox.displayLeft,
                    displayRectbox.visibleTop - displayRectbox.displayTop
            ];
            displayRectbox.retpos[1] = [
                    displayRectbox.retpos[0][0] + displayRectbox.visibleWidth,
                    displayRectbox.retpos[0][1],
            ];
            displayRectbox.retpos[2] = [
                    displayRectbox.retpos[1][0],
                    displayRectbox.retpos[1][1] + displayRectbox.visibleHeight,
            ];
            displayRectbox.retpos[3] = [
                    displayRectbox.retpos[0][0],
                    displayRectbox.retpos[0][1] + displayRectbox.visibleHeight,
            ];
            vimg.targetData.visibleTop = displayRectbox.visibleTop;
            vimg.targetData.visibleLeft = displayRectbox.visibleLeft;
            vimg.targetData.visibleWidth = displayRectbox.visibleWidth;
            vimg.targetData.visibleHeight = displayRectbox.visibleHeight;
            return displayRectbox;
        },
        //加载图片
        loadImages: function (list) {
            var index = 0;
            list.forEach(function (item, i) {
                var w, h, left, top, width, height;
                var image = document.createElement('img');
                image.src = item.src;
                image.onload = function () {
                    item.isload = true;
                    item.naturalWidth = image.naturalWidth;
                    item.naturalHeight = image.naturalHeight;
                    if (item.index === ImageView.page - 1) {
                        item.customAdaption();
                    } else {
                        item.defaultAdaption();
                    }
                    item.useDataToImage();
                    item.image.removeClass('iv_hide');
                    item.dispatchEvent('load');
                };
                image.onerror = function () {
                    image.src = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wgARCAB4AHgDAREAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUCAwQBCP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAPZYAAHCguOEjoAAAAEBeZCA/ExA1jAmAABQKgNheXFRnMYDUvACAmLBkAHTgALSsckwFhnGpiOHDaYwOm0VGgZnBEMS8Xm8CZUSMAwKBcPSgUjgBeWmcbGYpKxgAnGxEWjYBebSJeLAKhsApGRIUjgBcRLgNJjKxoAnGxcIhmXCotOHTeYCsaFIsHpIVEBkZQADQZwNQtJjUCsTGo2gBwkcAxGQdFgAZxSXGwuOHSkxlI2NAAAFQuMpI1GUiahiWgAAAAQM504aCYAAH//EADkQAAIBAgMDBwsDBQEAAAAAAAECAwARBBIhMUFRBRATMmFxkSAiIzM0QlJTobHhFJLBFTBygaKy/9oACAEBAAE/APJJAW5NqfGYZDYzLfs1pGV0DqbqdQaeSNCAzqpPE2oEFbg3/syyJEmaRwq8TU2OkfSEZF+I7fCnObzpXLdrG9B1NgmY30FgajULGF4C1Y2dXncnRRoLqbWFRnL50Tle1TaoMdImkwzr8Q2+FQyJKmaNwy8R5WKxCYePM2pOiqNpNSyPK2eU6jYNwHZUEUs/qxlT4z/AqHAwpq3pG4msi3VQFFz9tac2FuNFFO0KalwMLar6NuIqaKWDrjMnxj+RUUjxNniOu/gR21hMQmIjzLoRoynaD5EsixRtI2iqLmppGlkMsmh3DgOFYPDGYiWXSP3E49poAAWGzmjF5b7gNO80zXcjevOQCLHZWMwxhJli1j99OHaKgkaKQSx6neOI4VFIssayJqrC45+U5c0ohHVTVu/dWFh6ebKfVpq/adwpRup8fZiI4WZQbZibXr+oN8j/AL/FJygcwJhsL6nPu8KxBIj6eIZiBs4iv6g3yP8Av8V/UG+R/wB/ik5Q88dJCyqTbMGvaiN1YmHoJso9W+qdh3iuS5csphPVfVe/fzEgAk7BRfNmlb3iWNYCPo8Kt+s3nN3mhtrk0AzuCL2BI8ayr8C+ArKvBfAVD1SN1zSKuQaLs4Csq8F8BXKQAkUAWuNfHmx0efCvbrL5y94oPlyyr7pDClIIBGw1j2KYKUjaRYUVzlY9zOF+vMNtcme0Sf4n/wBVyiXskYYqrk5iN/ZWFUw4hOjLZXNmXdUPVPfUk8cMKmQ6nqqNppOUEv6SF4h8RsR/u1cpEGRCNQU0P++dVyF49yuV+tcnsWwURO0C3hpXKfsT96/cVD7RDf5g/nmG2uTPaJP8T/6qSNZUysLioYI4zmGYtxOtQ7CO29SxFcTJmOZhsv8ADuogEWNSLaMDcvVHC555faJrfMP8VyX7Eve33NcoLmwUttoF/CswR1k3K4b68w21gXWOSWRmsoQ3/dTtNiTnLsi+6im1u/trDYsp6PE7tjjf31BiWfFZ9kXVAPDiax8d1Eg93Q93NN6vw58wZ3k3M5b61ycuXBRX2kX8aZQ6FTsIsaCEAxttW6msHJ0uGUnrDzW7xpQ21EoI14n781ubDnPhhn2WIPdzTer8ObGSdFh3I6x81e81kuBGm1rKKRQiBRsAtzcpxdHOJR1ZND3isHN0MuuiPo3Ydx5jhLE5JbKTexF6/St8xf2/mv0rfMX9v5r9K3zF/b+aVSMIsYNiRa9fpW+Yv7fzQwlyM0t14AWvzYubppdNUTRe07zXJkXSTmU9WPQd/PPEs0LRvsNSI0bGKXrD6jjWDxNrRSnTYjn7HyJOoe3Sn2gbgOfGYm94YTpsdx9hUaNIwii6x2dg41h4lhhWNNg8jGYZcQnB16pqRWRjFKLN9D3Vh8TJD5p9Im5TtHcahxMMugezfC2h5jq6jiftrW0k1LiYYtC92+FdTU+Jkm80ejTeo2nvNRqzMIohdvoO+sFhlw6cXbrHyp4I50yyC9TYKaLWP0qfWmK7GFjwYWpCyereRR2E2rAO95HkkkcItwG11pizdd2I4Em1IV2KLngovUGCml1k9En1rDwRwJljFv7LxRyCzoDT8n4Y65Ld1JgolieIFsr2za0nJ2GGuS/fUcUcYsiAeV//xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAECAQE/AGH/xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAEDAQE/AGH/2Q==';
                };
                item.image = image;
                item.index = index++;
                item.image.addClass('iv_hide');
                _Element.iv_viewBox.appendChild(image);
            });
        },
        //更新翻页数据
        updatePageData: function () {
            var s = ImageView;
            var list = _Private.getSelectedImage();
            if (list.length) {
                _Element.iv_delbtn.removeAttribute('disabled');
            } else {
                _Element.iv_delbtn.setAttribute('disabled', '');
            }
            //是否全部选中
            if (list.length === s.vImageList.length) {
                _Element.iv_checkboxsAll.setAttribute('data-checked', true);
            } else {
                _Element.iv_checkboxsAll.setAttribute('data-checked', false);
            }
            //当前页是否选中
            if (s.vImageList[s.page - 1].selected === true) {
                _Element.iv_checkboxs.setAttribute('data-checked', true);
            } else {
                _Element.iv_checkboxs.setAttribute('data-checked', false);
            }
            if (s.pattern !== 'clipping') {
                _Element.iv_title.innerText = s.page + '/' + s.vImageList.length;
            }
            _Element.iv_delbtn.innerText = '删除' + list.length + '/' + s.vImageList.length;
        },
        //应用参数
        applyOptionParam: function (json) {
            var s = ImageView;
            var defaultOption = {
                pattern: 'default',
                selector: '',
                imageMargin: 10,
                initDisplaySize: 'contain',
                initDisplayPositionX: 'center',
                initDisplayPositionY: 'center',
                clippingWidth: s.width,
                clippingHeight: s.height,
                clippingRadius: 0,
                clippingBackground: '',
                clippingImportSuffix: 'png',
                isGestureRotate: false,
                isFindTargettoImageList: true
            };
            for (var name in json) {
                if (defaultOption.hasOwnProperty(name) && name in defaultOption) {
                    defaultOption[name] = json[name];
                }
            }
            for (var name in defaultOption) {
                if (s.hasOwnProperty(name) && name in s) {
                    s[name] = defaultOption[name];
                }
            }
        },
        //选择器处理
        selectorDispose: function (selector) {
            var list = [];
            var target = event && event.target;
            var currentTarget = event && event.currentTarget;
            if (isType(selector, 'array')) {
                //数组列表
                selector.forEach(function (item) {
                    if (typeof item === 'string') {
                        list.push(new Vimg({ src: item, target: item }));
                    } else if (typeof item === 'object') {
                        if (item.src) {
                            list.push(new Vimg({ src: item.src, target: item }));
                        }
                    }
                });
            } else if (isType(selector, 'string')) {
                if (currentTarget) {
                    currentTarget = currentTarget.querySelectorAll(selector);
                    if (!currentTarget.length) {
                        currentTarget = document.querySelectorAll(selector);
                    }
                } else {
                    currentTarget = document.querySelectorAll(selector);
                }
                var item;
                for (var i = 0; i < currentTarget.length; i++) {
                    item = currentTarget[i];
                    if (item.nodeName.toLowerCase() === 'img') {
                        //img标签
                        list.push(new Vimg({ src: item.src, target: item }));
                    } else {
                        //背景
                        var backImage = window.getComputedStyle(item).backgroundImage;
                        if (/^url/.test(backImage)) {
                            list.push(new Vimg({
                                src: backImage.replace(/^url\(["']|url\(/ig, '').replace(/["\']\)|\)$/g, ''),
                                target: item
                            }));
                        }
                    }
                }
            }
            if (ImageView.pattern === 'clipping' && list.length > 0) {
                if (target) {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].target === target) {
                            list = [list[i]];
                        }
                    }
                } else {
                    list = [list[0]];
                }
            }
            ImageView.vImageList = list;
        },
        //筛选出被选中的图片
        getSelectedImage: function () {
            var selectedList = [];
            ImageView.vImageList.forEach(function (item) {
                if (item.selected) {
                    selectedList.push(item);
                }
            });
            return selectedList;
        },
        //设置显示盒子位置
        setViewBoxPositionX: function () {
            _Element.iv_viewBox.style.webkitTransform = _Element.iv_viewBox.style.transform = 'translateX(' + _Private.viewBoxPositionX + 'px)';
        },
        //输出裁剪后图片
        importClippingtoImage: function () {
            var s = ImageView;
            var vimg = s.vImageList[0];
            //当前图片显示宽度
            var imageWidth = Math.round(vimg.width * vimg.scale);
            //根据图片实际大小计算放大倍数
            var magnify = vimg.naturalWidth / imageWidth;
            //绘制层
            var drawCanvas = document.createElement('canvas');
            var drawContext = drawCanvas.getContext('2d');
            drawCanvas.width = s.width * magnify;
            drawCanvas.height = s.height * magnify;
            //输出层
            var outputCanvas = document.createElement('canvas');
            var outputContext = outputCanvas.getContext('2d');
            outputCanvas.width = s.clippingWidth;
            outputCanvas.height = s.clippingHeight;
            //圆角大小
            var radius = _Private.displayRectBox.width / s.clippingWidth * s.clippingRadius;
            radius = Math.min(Math.min(_Private.displayRectBox.width, _Private.displayRectBox.height) / 2, radius) * magnify;
            //绘制图片
            if (s.clippingBackground) {
                drawContext.fillStyle = s.clippingBackground;
                drawContext.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
            }
            drawContext.save();
            drawContext.setTransform(1, 0, 0, 1,
                _Private.displayRectBox.x * magnify,
                _Private.displayRectBox.y * magnify);
            drawContext.radiusRect(
                _Private.displayRectBox.width * magnify,
                _Private.displayRectBox.height * magnify,
                radius, radius, radius, radius);
            drawContext.clip();
            drawContext.setTransform(1, 0, 0, 1,
                vimg.position.x * magnify,
                vimg.position.y * magnify);
            drawContext.drawImage(vimg.image, 0, 0, vimg.naturalWidth, vimg.naturalHeight);
            drawContext.restore();
            //绘制到输入层
            var zoom = outputCanvas.width / _Private.displayRectBox.width;
            outputContext.drawImage(drawCanvas,
                (outputCanvas.width - s.width * zoom) / 2,
                (outputCanvas.height - s.height * zoom) / 2,
                s.width * zoom,
                s.height * zoom);
            return outputCanvas.toDataURL('image/' + s.clippingImportSuffix);
        },
        //判断事件目标是否在图像列表中
        isEventTargettovImageList: function () {
            var s = ImageView;
            var isDisplay = false;
            var target = event.target;
            var currentTarget = event.currentTarget;
            if (s.vImageList.length > 0) {
                if (isType(s.selector, 'string')) {
                    if (s.isFindTargettoImageList) {
                        s.vImageList.every(function (item, i) {
                            if (item.target === target) {
                                s.page = i + 1;
                                return !(isDisplay = true);
                            }
                            return true;
                        });
                    } else {
                        isDisplay = true;
                    }
                } else {
                    isDisplay = true;
                }
            }
            return isDisplay;
        },
        //裁剪遮罩适应容器大小
        clippingMaskAdaptContainerSize: function () {
            var s = ImageView;
            var zoom = 1;
            var ratio = s.clippingWidth / s.clippingHeight;
            var width = s.width;
            var height = width / ratio;
            if (height > s.height) {
                height = s.height;
                width = height * ratio;
            }
            zoom = width / s.clippingWidth;
            _Private.displayRectBox.x = Math.round((s.width - width) / 2);
            _Private.displayRectBox.y = Math.round((s.height - height) / 2);
            _Private.displayRectBox.width = Math.round(width);
            _Private.displayRectBox.height = Math.round(height);
            _Private.displayRectBox.clippingRadius = s.clippingRadius * zoom;
        },
        //多选按钮事件
        checkboxsEvent: function () {
            var target = event && event.currentTarget;
            if (target) {
                if (target.hasClass('iv_checkboxs')) {
                    var iv_checkboxs = target;
                } else {
                    var iv_checkboxs = target.querySelector('.iv_checkboxs');
                    if (!iv_checkboxs) {
                        return;
                    }
                }
                var checked = iv_checkboxs.getAttribute('data-checked');
                if (checked === 'true') {
                    iv_checkboxs.setAttribute('data-checked', false);
                } else {
                    iv_checkboxs.setAttribute('data-checked', true);
                }
            }
        }
    };
    //初始化
    _Private.init();
})();