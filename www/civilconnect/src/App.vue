<template>
<div id="app">
  <div class="main viewportView" v-bind:class="'viewport_'+$store.state.viewport">
    <header>
      <div class="left">
        <a id="menuBtn" class="menu button" v-on:click="openCloseViewport('menu')">Menu</a>
      </div>
      <div class="center">
        <h1>Civil Connect</h1>
        <img src="./assets/CivilStyle/Images/LogoText.png" v-on:click="openCloseViewport('main')">
      </div>
      <div class="right">
        <a id="accountBtn" class="account button" v-on:click="openCloseViewport('map')">Map</a>
        <a id="accountBtn" class="account button" v-on:click="openCloseViewport('account')">Account</a>
      </div>
    </header>
    <!-- <img src="./assets/logo.png"> -->
    <router-view></router-view>
  </div>
  <router-view class="menu viewportView" name="menu" v-bind:class="$store.state.viewport==='menu' ? 'active' : 'notActive'"></router-view>
  <router-view class="map viewportView  hide" name="map" v-bind:class="$store.state.viewport==='map' ? 'active' : 'notActive'"></router-view>
  <router-view class="account viewportView  hide" name="account" v-bind:class="$store.state.viewport==='account' ? 'active' : 'notActive'"></router-view>
</div>
</template>

<script >
export default {
  name: 'app',
  methods: {
    openCloseViewport(viewport) {
      if (viewport === this.$store.state.viewport === 'main') return false;
      if (viewport === this.$store.state.viewport) return this.$store.commit("APP_CLOSE_VIEWPORT", viewport)
      this.$store.commit("APP_OPEN_VIEWPORT", viewport)
    }
  }
}
</script>

<style scoped>
/* HEADER */
header {
  background: #444;
  display: flex;
}
header>.button {
  display: inline-block;
}
header>.left {
  flex-basis: 20%
}
header>.center {
  flex-grow: 1;
  text-align: center;
}
header>.right {
  text-align: right;
  flex-basis: 20%
}

/* VIEWPORT */
.viewportView {
  background: #ccc;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  transition: left .5s, right .5s
}

/* VIEWPORT MENU */
.menu.viewportView {
  width: 90vw;
  left: -90vw
}

.menu.viewportView.active {
  left: 0
}

.main.viewportView.viewport_menu {
  left: 90vw;
  right: -90vw;
}


/* ACCOUNT */

.account.viewportView {
  width: 90vw;
  right: -90vw;
  left: auto
}

.account.viewportView.active {
  right: 0
}

.main.viewportView.viewport_account {
  right: 90vw;
  left: -90vw;
}
</style>
<style src="./assets/reset.css"></style>
<style>

/*TRANSITIONS*/
a{ text-decoration: underline; cursor: pointer;}
a.button{ position: relative;text-decoration: none;background-color: rgba(255,255,255,1); display: inline-block; border-radius: 3px; box-shadow: inset 0 0 1px rgba(0,0,0,0.5); padding: 0.3em 0.5em}
a.button:hover{background-color: rgba(255,255,255,0.8)}

/*TRANSITIONS*/
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-to {
  opacity: 0
}

/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active for <2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}


</style>
