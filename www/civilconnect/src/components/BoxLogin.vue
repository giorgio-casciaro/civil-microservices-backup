<template>
<form class="BoxLogin">
  <input name="email" placeholder="email@esempio.com" v-model="email" />
  <input name="password" placeholder="password" type="password" v-model="password" />
  <a class="login button" @click="login()">Accedi</a>
  <div class="rememberMe">
    <label><input type="checkbox" />Ricordami</label>
  </div>
  <div class="lostPassword">
    <a>Password Dimenticata?</a>
  </div>
</form>
</template>


<script>
export default {
  name: 'BoxLogin',
  methods: {
    login() {
      this.$store.dispatch('login', {
        amount: 10
      })
    }
  },
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
      password: '',
      email: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.BoxLogin {
  max-height: 10rem
}
</style>
