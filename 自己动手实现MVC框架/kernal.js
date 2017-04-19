(function (window, undefined) {
    var myj = {};
    myj.each = function (o, fn) {
        // 注意：此处不可以调用isGenericObj方法，因为我们在isGenericObj方法定义前调用了each
        // each里面如果想要调用isGenericObj的话是调不到的，因为还没定义
        // if (myj.isGenericObj(o)) {
        //     for(var attr in o){
        //         if (!fn.call(o[attr], attr, o[attr])) {
        //             break;
        //         }
        //     }
        // } else {
        //     myj.error("each:参数o非法");
        // }

        if (typeof o == "object") {
            if (o.length != undefined && o.length > 0) {
                // 数组
                for (var i = 0, len = o.length; i < len; i++) {
                    // 如果写成直接用!一转，没有写返回值的话默认返回return直接就结束循环了
                    // if (!fn.call(o[i], i, o[i])) {
                    if (fn.call(o[i], i, o[i]) === false) {
                        break;
                    }
                }
            } else {
                // 对象
                for (var attr in o) {
                    // if (!fn.call(o[attr], attr, o[attr])) {
                    if (fn.call(o[attr], attr, o[attr]) === false) {
                        break;
                    }
                }
            }
        } else {
            myj.error("参数o非法");
        }
    };
    myj.map = function (o, fn, context) {
        var res = [];
        if (typeof o == "object") {
            if (o.length != undefined && o.length > 0) {
                // 数组
                for (var i = 0, len = o.length; i < len; i++) {
                    res.push(fn.call(context ? context : o[i], i, o[i]));
                }
            } else {
                // 对象
                for (var attr in o) {
                    res.push(fn.call(context ? context : o[attr], attr, o[attr]));
                }
            }
            return res;
        } else {
            myj.error("参数o非法");
        }
    };
    myj.error = function (eInfo) {
        throw new Error(eInfo);
    };

    // 扩展判断类型的方法
    // 判断类型很常用，所以拿出来，对于工具方法我们放在一个公共的对象中
    var _type2string = [
        "Number",
        "Boolean",
        "String",
        "Function",
        "Object",
        "Array",
        "RegExp",
        "Null",
        "Undefined",
        "Window"
    ];
    function _getToString(o) {
        return Object.prototype.toString.call(o);
    }
    myj.each(_type2string, function (i, s) {
        myj["is" + s] = function(o){
            return _getToString(o) === "[object "  + s + "]";
        };
    });
    myj.isGenericObj = function (o) {
        return myj.isArray(o) || myj.isObject(o);
    };


    myj.toArray = function (oArrayLike) {
        if (myj.isNumber(oArrayLike["length"])) {
            return Array.prototype.slice.call(oArrayLike);
        } else {
            myj.error("不能转为类数组");
        }
    };
    myj.extend = function (isDeep, dst, src){
        var args = myj.toArray(arguments);
        var len = args.length;
        // 没传参的情况
        if (!len){
            return;
        }

        // 只传一个参数的情况：myj.extend({a: xxx}); 给myj本身扩展
        if (len == 1 && myj.isGenericObj(isDeep)) {
            src = isDeep;
            dst = this;
            isDeep = false;
        } else {
            _paramError ();
        }

        // 传了两个参数的情况
        if (len == 2) {
            if (!myj.isBoolean(isDeep) && myj.isGenericObj(isDeep)) {
                isDeep = false;
                src = dst;
                dst = isDeep;
            } else if (myj.isGenericObj(dst)) { // 该分支保证了isDeep是布尔类型，可以专注判断第二个参数
                // 依然是给myj本身添加
                src = dst;
                dst = this;
            } else {
                _paramError ();
            }
        }

        // 传了三个参数的情况
        if (len == 3 && (!myj.isBoolean(isDeep) || !myj.isGenericObj(dst) || !myj.isGenericObj(src))) {
            _paramError();
        }

        // 开始遍历
        var v;
        for(var k in src) {
            v = src[k];

            if (dst[k]) { // 目标中有对应的key
                // 目标和源中如果存在相同的项，如果是基本类型没必要复制，如果是引用类型，会引起死递归
                if(dst[k] === v) {
                    return false;
                }

                if (myj.isGenericObj(v)) { // 如果源和目标都是对象类型，则递归
                    myj.extend(isDeep, dst[k], v);
                } else { // 如果源和目标有任何一项是基础类型，直接覆盖
                    dst[k] = v;
                }
            } else { // 目标中没有对应的key
                dst[k] = v;
            }
        }

        function _paramError () {
            myj.error("参数" + JSON.stringify(args) + "错误");
        }
    };

    window.$ = myj;

    // 写成单体的形式肯定不好，因为我们的scope对象可能会有很多方法，这些方法极其占用内存空间，因此肯定需要构造函数
    function Scope () {
        this.watchList = [];
        this.childrenScope = [];
    }
    Scope.prototype = {
        constructor: Scope,
        watch: function(watchFn, listenerFn, fnCompare){
            this.watchList.push({
                watchFn: watchFn,
                listenerFn: listenerFn,
                last: function () {},
                fnCompare: fnCompare ? fnCompare : function (oldValue, newValue) {
                    if (myj.isArray(newValue)) {
                        // 如果是数组，则直接比较二者长度
                    } else if (myj.isObject(newValue)) {
                        var isDirty = false;
                        // 遍历新的对象，如果值有变化，则不相等
                        for(var attr in newValue){
                            if(newValue[attr] !== oldValue[attr]) {
                                isDirty = true;
                                break;
                            }
                        }
                        // 遍历老的对象，如果值有变化，则不相等
                        for(var attr in oldValue){
                            if(newValue[attr] !== oldValue[attr]) {
                                isDirty = true;
                                break;
                            }
                        }
                        return isDirty;
                    } else if (oldValue !== newValue) {
                        return true;
                    } else {
                        // 如果都不满足，跳过本次检测
                        return false;
                    }
                }
            });
        },
        apply: function(){
            // 如果单次脏检测发现有和上次不一样的属性，则一直循环
            var isDirty = true;
            while(isDirty){
                isDirty = this.applyOnce();
            }
        },
        applyOnce: function(){
            // 需要把上述代码中的window改成this
            var _this = this;
            // 是否有和上次不一样的属性
            var isDirty = false;
            $.each(this.watchList, function(i, o){
                var newValue = o.watchFn(_this);
                var newValueType = Object.prototype.toString.call(newValue);
                // if(o.last !== newValue){
                if(o.fnCompare(o.last, newValue)){
                    o.listenerFn && o.listenerFn(newValue, o.last);
                    // 第一次比较没有任何问题，但是从第二次比较开始，对于对象类型的值由于来回操作的总是一个对象，因此要把对象做一次深拷贝然后赋给last属性
                    if (newValueType == "[object Object]" || newValueType == "[object Array]") {
                        o.last = JSON.parse(JSON.stringify(newValue));
                    } else {
                        o.last = newValue;
                    }
                    // 只要有一个不一样，就代表变脏了
                    isDirty = true;
                }
            });
            if(this.childrenScope.length > 0){
                // 这里虽然遍历的是childrenScope，但是里面每个childScope都指向window，由于childScope并没有childrenScope属性，因此还是会找到window上的childrenScope属性，依然遍历window上的childrenScope，陷入死递归，但同时也不能让childScope和parentScope彻底断掉关系，因为毕竟它们还是父子级关系，因此在createNewScope中采取将watchList和childrenScope两个属性重新赋值的方式
                $.each(this.childrenScope, function(i, scope) {
                    scope.apply();
                });
            }
            return isDirty;
        },
        createNewScope: function() {
            var newScope = Object.create(window);
            newScope.watchList = [];
            newScope.childrenScope = [];
            this.childrenScope.push(newScope);
            return newScope;
        },
        removeScope: function(childScope) {
            var _this = this;
            $.each(this.childrenScope, function (i, scope) {
                if(childScope == scope){
                    _this.splice(i, 1);
                }
            });
        }
    };
})(window, undefined);