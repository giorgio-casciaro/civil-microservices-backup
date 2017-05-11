<template>
<section class="Home">
  <img src="../assets/CivilStyle/Images/LogoIconWhite.png">
  <h1>Civil Connect</h1>
  <p>Crea e organizza la tua community o segui quella più vicina a te.</p>
  <transition name="slide-fade">
    <BoxLogin v-show="userForm==='BoxLogin'"></BoxLogin>
  </transition>
  <transition name="slide-fade">
    <BoxRegister v-show="userForm==='BoxRegister'"></BoxRegister>
  </transition>
  <transition name="fade">
    <div class="toLogin" v-if="userForm==='BoxRegister'">
      hai già un account? <a class="button" @click="userForm='BoxLogin'">Accedi</a>
    </div>
    <div class="toRegister" v-if="userForm==='BoxLogin'">
      non hai ancora un account? <a class="button" @click="userForm='BoxRegister'">Registrati</a>
    </div>
  </transition>
</section>
</template>

<script>
import BoxLogin from '@/components/BoxLogin'
import BoxRegister from '@/components/BoxRegister'
export default {
  name: 'Home',
  components: {
    BoxLogin: BoxLogin,
    BoxRegister: BoxRegister
  },
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
      userForm: 'BoxLogin'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
