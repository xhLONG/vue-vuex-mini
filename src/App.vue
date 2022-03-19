<template>
  <div id="app">
      <p>我的年龄：{{$store.state.age}}</p>
      <!-- <p>她的年龄：{{$store.getters.otherAge}}</p> -->
      <button @click="$store.commit('changeAge', 1)">同步修改</button>
      <button @click="$store.dispatch('asyncChangeAge', 2)">异步修改</button>
  </div>
</template>

<script>
export default {
  name: 'App',
  created(){
      console.log(this.$store)
  },
  components: {
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
