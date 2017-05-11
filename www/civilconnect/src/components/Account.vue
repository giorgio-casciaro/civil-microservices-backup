<template>
<section class="Account">
  <header>
    <h3>Account</h3>
  </header>
  <div class="profile container">
    <div class="pic"></div>
    <h4 class="pic">Marco De Masi</h4>
    <p>Segui <a>5</a> mappe | Gestisci <a>2</a> mappe</p>
  </div>
  <div class="notifications container">
    <ul>
      <li><a href="https://vuejs.org" target="_blank">Chi siamo</a></li>
      <li><a href="https://forum.vuejs.org" target="_blank">Supporto</a></li>
      <li><a href="http://vuejs-templates.github.io/webpack/" target="_blank">Docs for This Template</a></li>
    </ul>
  </div>
</section>
</template>
<script>
export default {
  name: 'Account',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
