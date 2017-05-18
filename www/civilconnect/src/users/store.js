
  import * as Cookies from 'js-cookie'
  var initState = {
    id: false,
    logged: false,
    email: false,
    token: false,
    emailConfirmed: false,
    passwordAssigned: false,
    rememberMe: false,
    publicName: false
  }
  export default {
    namespaced: true,
    state: Object.assign({}, initState),
    mutations: {
      LOGGEDIN (state, {token, rememberMe, currentState}) {
        Object.assign(state, currentState)
        state.token = token
        state.rememberMe = rememberMe
        state.logged = true
      },
      FROM_STORAGE (state, storageState) {
        Object.assign(state, storageState)
      },
      LOGGEDOUT (state, response) {
        Object.assign(state, initState)
      },
      REGISTERED (state, {email}) {
        state.email = email
      },
      EMAIL_CONFIRMED (state, {email}) {
        state.email = email
        state.emailConfirmed = true
      },
      PASSWORD_ASSIGNED (state) {
        state.passwordAssigned = true
      },
      PUBLICNAME_UPDATED (state, {publicName}) {
        state.publicName = publicName
      }
    },
    actions: {
      login (store, apiResponse) {
        store.commit('LOGGEDIN', apiResponse)
        if (apiResponse.rememberMe)Cookies.set('civil-connect-user', store.state)
      },
      update (store, {mutation, payload}) {
        store.commit(mutation, payload)
        if (store.state.rememberMe)Cookies.set('civil-connect-user', store.state)
      },
      logout (store, apiResponse) {
        store.commit('LOGGEDOUT', apiResponse)
        Cookies.remove('civil-connect-user')
      }
    }
  }
//
// const httpApiPost = (url, request, mutation, filterResponse = (x) => x, errorMutation = 'APP_ERROR') => {
//   console.log('httpApiPost', url, request)
//   // Vue.http.post(url, request)
//   // .then(response => response.error ? store.commit(errorMutation, { type: 'login', error: response }) : store.commit(mutation, filterResponse(response)))
//   // .catch(error => store.commit(errorMutation, {type: 'httpPost', url, request, error}))
// }
// const getUrl = (server, service, method) => server + '/' + service + '/' + method
