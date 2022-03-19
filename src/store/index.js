import Vue from 'vue'
import Vuex from '../vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {          // 存放状态  相当于new Vue({data}) 并且这里存放的数据时响应式的
    age: 18,
  },
  mutations: {      // 从规范上来说，这是唯一能够修改state中数据的地方（主要是为了方便跟踪state的改变），并且只能书写同步代码
    changeAge(state, payload){
        state.age += payload;
    }
  },
  actions: {        // 通过mutations间接修改state中的数据，可以书写异步代码
    asyncChangeAge(store, payload){
        setTimeout(() => {
            store.commit("changeAge", payload);
        }, 1000);
    }
  },
  modules: {        // 将臃肿的store进行模块化
    index: {
        state: {
            num: 1,
        },
        mutations: {
            changeNum(state){
                state.num++;
            },
        },
        modules: {
            a: {
                state: {
                    num: 2,
                }
            }
        }
    }
  },
  getters: {        // VueX的计算属性   相当于new Vue({computes}) 具有懒惰性，与compute不同的是，getters可以作用于多个组件
      otherAge(state){
          return state.age + 10;
      }
  }
})
