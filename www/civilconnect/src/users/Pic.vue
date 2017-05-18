<template>
  <form class="Pic" @click="active=true" @submit.prevent="waiting=true;call('users','updatePic',form,succ,err)" @input="validation=validate('users','updatePic',form)" :class="{validForm:validation.valid,activeForm:active}">
    <label class="pic":class="{notValid:validation.errors.pic}"><strong>{{str.pic}}</strong><input v-model="form.pic" :placeholder="strPh.pic" :disabled="waiting" type="text" /></label>
    <input type="submit" class="save button" :disabled="waiting" :class="{error,success,waiting}" :value="str.save">
    <div v-if="success" class="success" v-html="success"></div>
    <div v-if="error" class="error" v-html="error"></div>
    <div v-if="errors" class="errors">
      <div v-for="(fieldErrors,fieldName) in errors" class="fieldErrors">
        <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{t(error)}}</div>
      </div>
    </div>
  </form>
</template>

<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }
import {validate,call} from '@/api'

export default {
  name: 'Pic',
  data () {
    return {
      form:{
        id: this.$store.state.users.id,
        pic: ''
      },
      str:{
        pic: t( 'Immagine'),
        save:t( 'Salva')
      },
      strPh:{
        pic: t( '')
      },
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors:false,
      validation: {
        errors: {}
      }
    }
  },
  methods: {
    validate,
    t,
    call,
    err (msg, extra = false) {
        this.error = this.errors= this.waiting=false
        setTimeout(()=>this.error = t( msg),1)
        setTimeout(()=>this.errors = extra.errors,1)
        this.$emit("error")
    },
    succ (body) {
      this.waiting=false
      this.$store.commit('users/REGISTERED', body)
      this.success = t( 'Password Assegnata')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}
</script>
