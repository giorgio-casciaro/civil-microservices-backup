import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
Vue.use(Vuex)
var config = {
  server: 'http://127.0.0.1:10080/civil-connect'
}
const store = new Vuex.Store({
  state: {
    user: {},
    viewport: 'main',
    plugins: [createPersistedState()]
  },
  mutations: {
    APP_OPEN_VIEWPORT (state, viewport) {
      state.viewport = viewport
    },
    APP_CLOSE_VIEWPORT (state) {
      state.viewport = 'main'
    },
    USER_LOGIN (state, login) {
      state.user.login = login
    },
    USER_REGISTER (state, login) {
      state.user.login = login
    },
    APP_ERROR (state, login) {
      state.user.login = login
    }
  },
  actions: {
    login (store, request) {
      httpApiPost('admin', 'getSchema', request, 'USER_LOGIN', (response) => { console.log('response', response); return response })

      httpApiPost('users', 'login', request, 'USER_LOGIN', (response) => { console.log('response', response); return response })
    },
    register (store, request) {
      httpApiPost('users', 'create', request, 'USER_REGISTER', (response) => { console.log('response', response); return response })
    }
  }
})
const httpApiPost = (service, method, request, mutation, filterResponse = (x) => x, errorMutation = 'APP_ERROR') => {
  var url = config.server + '/' + service + '/' + method
  console.log('httpApiPost', url, request)
  Vue.http.post(url, request)
  .then(response => response.error ? store.commit(errorMutation, { type: 'login', error: response }) : store.commit(mutation, filterResponse(response)))
  .catch(error => store.commit(errorMutation, {type: 'httpPost', url, request, error}))
}
export default store
