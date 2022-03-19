import applyMixin from './mixin'
import {forEach} from './util'
import ModuleCollection from './module/module-collection'
let Vue;

function getState(store, path){
    return path.reduce((newState, current) => {
        return newState[current];
    }, store.state)
}

function installModule(store, rootState, path, module){
    // 注册事件时 需要注册到对应的命名空间中 path就是所有空间 根据path算出空间来
    let namespace = store._modules.getNamespace(path);

    if(path.length > 0){    // 如果是子模块，需要将子模块的状态定义到根模块上
        let parent = path.slice(0, -1).reduce((memo, current) => {
            return memo[current];
        }, rootState);
        Vue.set(parent, path[path.length - 1], module.state)
    }

    module.forEachMutation((mutation, type) => {
        // {changeAge: [fn, fn, fn]}

        store._mutations[namespace + type] ||= [];
        store._mutations[namespace + type].push((payload) => {
            // 做持久化数据的时候 内部可能会替换状态 这里如果一直用module.state 可能就是老的状态
            // mutation.call(store, module.state, payload)     // 更改状态
            mutation.call(store, getState(store, path), payload)
            store._subscribers.forEach(sub => sub({mutation, type}, store.state))   // 调用订阅的事件，重新执行
        })
    });

    module.forEachAction((action, type) => {
        store._actions[namespace + type] ||= [];
        store._actions[namespace + type].push((payload) => {
            action.call(store, getState(store, path), payload)
        })
    });

    module.forEachGetter((getter, key) => {
        // 如果getters重名会覆盖，所有模块的getter都会定义到根模块上
        store._wrappedGetters[namespace + key] = function(params){
            return getter(getState(store, path));
        }
    });

    module.forEachChild((child, key) => {
        installModule(store, rootState, path.concat(key), child)
    });
}

function resetStoreVm(store, state){
    const wrappedGetters = store._wrappedGetters;
    let oldVm = store._vm;
    let computed = {};
    store.getters = {};
    forEach(wrappedGetters, (fn, key) => {
        computed[key] = function(){
            return fn();
        }
        Object.defineProperty(store.getters, key, {
            get(){ 
                return store._vm[key]
            },
        })
    })
    store._vm = new Vue({
        data: {
            $$state: state,
        },
        computed,
    })
    if(oldVm){
        Vue.nextTick(() => {
            oldVm.$destroy();
        })
    }
}

class Store{
    constructor(options){

        // 格式化用户传入的参数
        // 1、收集模块转换成一棵树
        this._modules = new ModuleCollection(options);
        console.log(this._modules)

        // 2、安装模块 将模块上的属性 定义在我们store中
        let state = this._modules.root.state;
        this._mutations = {};       // 存放所有模块中的mutations
        this._actions = {};         // 存放所有模块中的actions
        this._wrappedGetters = {};  // 存放所有模块中的getters
        this._subscribers = [];
        installModule(this, state, [], this._modules.root);
        
        // 将状态放到vue实例上
        resetStoreVm(this, state);

        // 插件的实现
        options.plugins.forEach(plugin => plugin(this))


        /**
         * vue-router 和 vuex 实现响应式更新的区别
         * vue-router 是使用了vur.utils.defineReactive对当前路由$route添加了响应式，当$route发生改变就会触发视图更新
         * vuex则是在内部直接创建了一个vue实例，将state状态数据放在vue的data中，然后对Store类添加类属性访问器，在属性访问器里面代理访问存储data的state状态数据，从而实现依赖收集，当依赖发生改变就会去通知渲染watcher更新页面
         */
        // let state = options.state;
        // this.getters = {};
        // const computed = {};
        // 把getters转移到计算属性里来实现
        // forEach(options.getters, (fn, key) =>{
        //     computed[key] = () => {         // 借用计算属性来实现懒加载
        //         return fn(this.state);
        //     }
        //     Object.defineProperty(this.getters, key, {
        //         get: () => this._vm[key],
        //     })
        // })
        // vue中的定义的数据，如果属性名是类似'$xxx'，那么它不会被代理到vue的实例上
        // this._vm = new Vue({
        //     data: {
        //         $$state: state,
        //     },
        //     computed,
        // })


        // 发布订阅模式，将用户定义的mutation和action先保存起来，稍后调用commit时 就找订阅的mutation方法，
        // 调用dispatch就找对应的action方法
        // this._mutations = {};
        // forEach(options.mutations, (fn, type) => {
        //     this._mutations[type] = (payload) => fn.call(this, this.state, payload)
        // })

        // this._actions = {};
        // forEach(options.actions, (fn, type) => {
        //     this._actions[type] = (payload) => fn.call(this, this, payload)
        // })
    }

    // 类的属性访问器，当用户去这个实例上访问state属性时会触发这个方法
    get state(){
        // console.log(this._vm)
        return this._vm._data.$$state;
    }

    commit = (type, payload) => {
        // this._mutations[type](payload);
        this._mutations[type].forEach(fn => fn(payload));
    }

    dispatch = (type, payload) => {
        // this._actions[type](payload);
        this._actions[type].forEach(fn => fn(payload));
    }

    // 动态注册模块
    registerModule(path, rawModule){
        if(typeof path == "string") path = [path];
        // 模块注册
        this._modules.register(path, rawModule);

        // 安装模块
        installModule(this, this.state, path, rawModule.rawModule);
        // 重新定义getters
        resetStoreVm(this, this.state);
    }

    subscribe(fn){
        this._subscribers.push(fn);
    }

    replaceState(newState){
        this._vm._data.$$state = newState;
    }
}

const install = (_Vue) => {
    Vue = _Vue;
    applyMixin(Vue);
}

export {
    Store,
    install,
}