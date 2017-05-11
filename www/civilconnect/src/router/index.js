import Vue from 'vue'
import Router from 'vue-router'
import Menu from '@/components/Menu'
import Home from '@/components/Home'
import Account from '@/components/Account'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      components: {
        default: Home,
        menu: Menu,
        account: Account
      }
    }
  ]
})
