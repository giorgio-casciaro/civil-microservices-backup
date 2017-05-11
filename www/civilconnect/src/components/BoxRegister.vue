<template>
<form class="BoxRegister">
  <input name="email" placeholder="email@esempio.com" />
  <a class="register button">Registrati gratis</a>
</form>
</template>


<script>
export default {
  name: 'BoxRegister',
  data() {
    return {
      status: 'Welcome to Your Vue.js App',
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.BoxRegister{ max-height:10rem}
</style>
