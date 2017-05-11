import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import FormGenerator from '@/components/FormGenerator'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'FormGenerator',
      component: FormGenerator
    },
    {
      path: '/Hello',
      name: 'Hello',
      component: Hello
    }
  ]
})
