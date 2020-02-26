import _get from 'lodash/get'

export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    let params = {}
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter) {
      params.filter = `${state.filter}`
    }
    if (state.from && !state.reverse) {
      params.from = Math.floor(state.from / 1000)
    }
    if (state.to) {
      params.to = Math.floor(state.to / 1000)
    }
    if (state.reverse) {
      params.reverse = state.reverse
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

  async function getCols ({ state, commit, rootState }, sysColsNeedInitFlags) {
    commit('reqStart')
    const needActions = sysColsNeedInitFlags.actions
    const needEtc = sysColsNeedInitFlags.etc
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let cols = [],
          colsFromStorage = LocalStorage.getItem(state.name)
        if (colsFromStorage && colsFromStorage[state.active] && colsFromStorage[state.active]) {
          /* remove after sometime 12.07.19 */
          colsFromStorage[state.active].forEach((col) => {
            if (col.name === 'timestamp') {
              let locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
              col.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
            }
          })
          cols = colsFromStorage[state.active]
          /* adding sys cols after migration. 30.01.20 */
          if (!cols[0].__dest && !cols[cols.length - 1].__dest) {
            cols.unshift({ name: 'actions', width: 50, display: needActions, __dest: 'action' })
            cols.push({ name: 'etc', width: 150, display: needEtc, __dest: 'etc' })
          }
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
                display: state.defaultColsNames.includes(col.name),
                description: col.info
              }
              if (colItem.name === 'timestamp') {
                let locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
                colItem.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
              }
              cols.push(colItem)
            })
          }
          cols.unshift({ name: 'actions', width: 50, display: needActions, __dest: 'action' })
          cols.push({ name: 'etc', width: 150, display: needEtc, __dest: 'etc' })
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

  function getFromTo (val) {
    let now = val || Date.now(),
      from = new Date(now).setHours(0, 0, 0, 0),
      to = from + 86399999
    return { from, to }
  }

  async function initTime ({ state, commit, rootState }) {
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let params = {
          reverse: true,
          count: 1
        }
        let resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        let data = resp.data
        errorsCheck(data)
        let date = Date.now()
        if (data.result.length) {
          date = Math.round(data.result[0]['server.timestamp'] * 1000)
        }
        let day = getFromTo(date)
        commit('setFrom', day.from)
        commit('setTo', day.to)
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function getMessages ({ state, commit, rootState }, params) {
    commit('reqStart')
    if (rootState.token && state.active) {
      let isLoadingActive = state.isLoading
      try {
        !isLoadingActive && Vue.set(state, 'isLoading', true)
        let resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        let data = resp.data
        errorsCheck(data)
        !isLoadingActive && Vue.set(state, 'isLoading', false)
        return data.result || []
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        !isLoadingActive && Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function get ({ state, commit, rootState }) {
    if (!state.isLoading) {
      Vue.set(state, 'isLoading', true)
      let start = Math.floor(Date.now() / 1000)
      let params = getParams(state)
      let messagesCount = 0
      let messages = await getMessages({ state, commit, rootState }, params)
      messagesCount += messages.length
      let now = Math.floor(Date.now() / 1000)
      let needRT = (params.to >= now && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        let stop = Math.floor(Date.now() / 1000)
        let params = getParams(state)
        params.from = start
        params.to = stop
        let missedMessages = await getMessages({ state, commit, rootState }, params)
        messagesCount += missedMessages.length
        messages.splice(messages.length, 0, ...missedMessages)
      } else if ((params.to < now || (state.limit && messages.length >= state.limit)) && loopId) {
        await unsubscribePooling({ state, commit, rootState })
      }
      commit('limiting', { type: 'init', count: messagesCount })
      commit('setHistoryMessages', messages)
      if (needRT || state.realtimeEnabled) {
        startRTRender()
        commit('limiting', { type: 'rt_init' })
      }
      Vue.set(state, 'isLoading', false)
    }
  }

  async function getPrevPage ({ state, commit, rootState }) {
    if (!state.isLoading) {
      Vue.set(state, 'isLoading', true)
      let to = Math.floor(_get(state, `messages[0]['server.timestamp']`, state.to) - 1)
      let params = getParams(state)
      params.to = to
      params.reverse = true
      if (loopId && state.messages.length > state.limit * 2) {
        await unsubscribePooling({ state, commit, rootState })
        commit('limiting', { type: 'rt_deinit' })
      }
      let messages = await getMessages({ state, commit, rootState }, params)
      if (!messages.length) {
        Vue.set(state, 'isLoading', false)
        return 0
      }
      commit('limiting', { type: 'prev', count: messages.length })
      commit('prependMessages', messages)
      Vue.set(state, 'isLoading', false)
      return messages.length
    }
  }

  async function getNextPage ({ state, commit, rootState }) {
    if (!state.isLoading) {
      if (state.realtimeEnabled) { return }
      Vue.set(state, 'isLoading', true)
      let start = Date.now()
      let from = Math.floor(_get(state, `messages[${state.messages.length - 1}]['server.timestamp']`, state.from) + 1)
      let params = getParams(state)
      let messagesCount = 0
      params.from = from
      let messages = await getMessages({ state, commit, rootState }, params)
      messagesCount += messages.length
      let needRT = (params.to > Math.floor(Date.now() / 1000) && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        let stop = Date.now()
        let params = getParams(state)
        params.from = Math.floor(start / 1000)
        params.to = Math.floor(stop / 1000)
        let missedMessages = await getMessages({ state, commit, rootState }, params)
        messagesCount += missedMessages.length
        messages.splice(messages.length, 0, ...missedMessages)
      }
      commit('limiting', { type: 'next', count: messagesCount })
      commit('appendMessages', messages)
      if (needRT) {
        startRTRender()
        commit('limiting', { type: 'rt_init' })
      }
      Vue.set(state, 'isLoading', false)
      return messagesCount
    }
  }

  async function getHistory ({ state, commit, rootState }, count) {
    let limit = state.limit,
      filter = state.filter
    commit('clearMessages')
    commit('setReverse', true)
    commit('setLimit', count)
    commit('setFilter', '')
    await get({ state, commit, rootState })
    commit('setReverse', false)
    commit('setLimit', limit)
    commit('setFilter', filter)
  }

  let messagesBuffer = [],
    loopId = 0
  function initRenderLoop (state, commit) {
    return setInterval(() => {
      if (messagesBuffer.length) {
        commit('setRTMessages', [...messagesBuffer])
        messagesBuffer = []
      }
    }, 500)
  }

  async function pollingGet ({ state, commit, rootState }) {
    await Vue.connector.subscribeMessagesChannels(state.active, '+', (message) => {
      messagesBuffer.push(JSON.parse(message))
    }, { rh: 2 })
    state.realtimeEnabled = true
    return () => {
      loopId = initRenderLoop(state, commit)
    }
  }

  /* unsubscribe from current active topic */
  async function unsubscribePooling ({ state }) {
    if (loopId) {
      clearInterval(loopId)
      messagesBuffer = []
      loopId = 0
    }
    await Vue.connector.unsubscribeMessagesChannels(state.active, '+')
    state.realtimeEnabled = false
  }

  /* getting missed messages after offline */
  async function getMissedMessages ({ state, commit, rootState }) {
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let lastIndexOffline = state.messages.reduceRight((result, value, index) => {
          if (result) {
            return result
          }
          if (value.__connectionStatus === 'offline') {
            result = index
          }
          return result
        }, 0)
        let params = {
          from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1]['server.timestamp']) + 1,
          to: Math.floor(state.messages[lastIndexOffline + 1]['server.timestamp'])
        }
        let resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        let data = resp.data
        errorsCheck(data)
        commit('setMissingMessages', { data: data.result, index: lastIndexOffline })
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  return {
    getMessages,
    get,
    getPrevPage,
    getNextPage,
    pollingGet,
    getCols,
    getHistory,
    initTime,
    unsubscribePooling,
    getMissedMessages
  }
}
