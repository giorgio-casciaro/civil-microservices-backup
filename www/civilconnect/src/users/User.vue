<template>
<div class="User" >
  <div class="pic"><img v-if="store.pic" :src="store.pic" /><span v-else v-html="icoUnknowUser" /></div>
  <h4 v-html="store.publicName"></h4>
  <p v-html="store.email"></p>
</div>
</template>

<script>
import Vue from 'vue'

import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }

import {icon} from '@/icons'
var i= function(name) { return icon( 'users', name) }

export default {
  name: 'User',
  data () {
    return {
      store: this.$store.state.users
    }
  },
  computed: {
    icoUnknowUser: function () { return i('icoUnknowUser') }
  },
  methods: {
    t,i
  }
}

</script>
