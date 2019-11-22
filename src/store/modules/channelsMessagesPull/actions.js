export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    let params = {}
    if (state.limit) {
      params.limit_count = state.limit
    }
    if (state.from) {
      params.curr_key = state.from
    }
    return params
  }

  function errorsCheck (data) {
    if (data.errors) {
      data.errors.forEach((error) => {
        let errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    }
  }

  async function getCols ({ state, commit, rootState }) {
    commit('reqStart')
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let cols = [],
          colsFromStorage = LocalStorage.getItem(state.name)
        if (colsFromStorage && colsFromStorage[state.active] && colsFromStorage[state.active]) {
          /* remove after sometime 12.07.19 */
          colsFromStorage[state.active].forEach((col) => {
            if (col.name === 'timestamp') {
              let locale = new Date().toString().match(/([-\+][0-9]+)\s/)[1]
              col.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
            }
          })
          cols = colsFromStorage[state.active]
        } else {
          let protocolIdResp = await Vue.connector.gw.getChannels(state.active, { fields: 'protocol_id' })
          let protocolIdData = protocolIdResp.data
          errorsCheck(protocolIdData)
          if (protocolIdData.result && protocolIdData.result.length && protocolIdData.result[0].protocol_id) {
            let colsResp = await Vue.connector.gw.getProtocols(protocolIdData.result[0].protocol_id, { fields: 'message_parameters' })
            let colsData = colsResp.data
            errorsCheck(colsData)
            colsData.result[0].message_parameters.forEach(col => {
              let colItem = {
                name: col.name,
                width: 160,
                display: true,
                description: col.info
              }
              if (colItem.name === 'timestamp') {
                let locale = new Date().toString().match(/([-\+][0-9]+)\s/)[1]
                colItem.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
              }
              cols.push(colItem)
            })
          }
        }
        commit('setCols', cols)
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function getData ({ state, commit, rootState }) {
    let data = {}
    if (rootState.token && state.active) {
      try {
        let resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(getParams(state)) })
        data = resp.data
        errorsCheck(data)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        data = {
          errors: [e]
        }
      }
    }
    return data
  }

  async function get ({ state, commit, rootState }) {
    commit('reqStart')
    Vue.set(state, 'isLoading', true)
    let data = await getData({ state, commit, rootState })
    if (data.result) {
      commit('setMessages', data.result)
      commit('setTo', data.next_key)
    }
    Vue.set(state, 'isLoading', false)
  }

  let messagesBuffer = [],
    loopId = 0
  function initRenderLoop (state, commit) {
    return setInterval(() => {
      if (messagesBuffer.length) {
        if (state.mode === 1) {
          commit('setMessages', [...messagesBuffer])
        }
        messagesBuffer = []
      }
    }, 500)
  }

  async function pollingGet ({ state, commit, rootState }) {
    commit('reqStart')
    let data = await getData({ state, commit, rootState })
    if (data.result) {
      commit('setMessages', data.result)
      commit('setTo', data.next_key)
    }
    loopId = initRenderLoop(state, commit)
    await Vue.connector.subscribeMessagesChannels(state.active, '+', (message) => {
      if (state.mode === 1) {
        messagesBuffer.push(JSON.parse(message))
      } else {
        commit('setNewMessagesCount', state.newMessagesCount + 1)
        commit('setRtMessagesBuff', JSON.parse(message))
      }
    }, { rh: 2 })
  }

  /* unsubscribe from current active topic */
  async function unsubscribePooling ({ state }) {
    if (loopId) { clearInterval(loopId) }
    await Vue.connector.unsubscribeMessagesChannels(state.active, '+')
  }

  return {
    get,
    pollingGet,
    getCols,
    unsubscribePooling
  }
}
