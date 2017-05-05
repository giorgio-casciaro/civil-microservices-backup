module.exports = function (state, data) {
  state.status = 0
  state.emailStatus = 0
  state.id = data.id
  state.email = data.email
  state.emailConfirmationCode = data.emailConfirmationCode
  return state
}
