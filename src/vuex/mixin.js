const applyMixin = (Vue) => {
    Vue.mixin({
        beforeCreate: vuexInit,
    })
}

/**
 * vue-router 和 vuex初始化的差别：
 * vue-router是把属性定义到了根实例上，所有组件都能访问到这个根，通过根实例访问属性
 * vuex是给每个组价都定义了一个$store属性
 */
function vuexInit(){
    const options = this.$options;
    // 让每个组件都可以访问$store对象
    if(options.store){
        // 根
        this.$store = options.store;
    }else if(options.parent && options.parent.$store){
        // 子组件
        this.$store = options.parent.$store;
    }
}

export default applyMixin