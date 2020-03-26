import _get from 'lodash/get'

export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    const params = {}
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter) {
      params.filter = `${state.filter}`
    }
    if (state.from) {
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
        const errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    }
  }

  function getColsFromLS (state) {
    let colsFromStorage = {}
    if (state.lsNamespace) {
      /* removing old store 12.03.20 */
      const oldStore = LocalStorage.getItem(state.name)
      if (oldStore) {
        colsFromStorage = oldStore
        LocalStorage.remove(state.name)
      }
      const lsPath = state.lsNamespace.split('.'),
        lsItemName = lsPath.shift(),
        lsRouteToItem = `${lsPath.join('.')}.${state.name}`,
        appStorage = LocalStorage.getItem(lsItemName)
      colsFromStorage = _get(appStorage, lsRouteToItem, colsFromStorage)
    } else {
      colsFromStorage = LocalStorage.getItem(state.name) || colsFromStorage
    }
    return colsFromStorage
  }

  async function getCols ({ state, commit, rootState }, sysColsNeedInitFlags) {
    commit('reqStart')
    const needActions = sysColsNeedInitFlags.actions
    const needEtc = sysColsNeedInitFlags.etc
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let cols = []
        const colsFromStorage = getColsFromLS(state)
        if (colsFromStorage && colsFromStorage[state.active] && colsFromStorage[state.active]) {
          /* remove after sometime 12.07.19 */
          colsFromStorage[state.active].forEach((col) => {
            if (col.name === 'timestamp') {
              const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
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
          const protocolIdResp = await Vue.connector.gw.getChannels(state.active, { fields: 'protocol_id' })
          const protocolIdData = protocolIdResp.data
          errorsCheck(protocolIdData)
          if (protocolIdData.result && protocolIdData.result.length && protocolIdData.result[0].protocol_id) {
            const colsResp = await Vue.connector.gw.getProtocols(protocolIdData.result[0].protocol_id, { fields: 'message_parameters' })
            const colsData = colsResp.data
            errorsCheck(colsData)
            colsData.result[0].message_parameters.forEach(col => {
              const colItem = {
                name: col.name,
                width: 160,
                display: state.defaultColsNames.includes(col.name),
                description: col.info
              }
              if (colItem.name === 'timestamp') {
                const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
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
    const now = val || Date.now(),
      from = new Date(now).setHours(0, 0, 0, 0),
      to = from + 86399999
    return { from, to }
  }

  async function initTime ({ state, commit, rootState }) {
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        const params = {
          reverse: true,
          count: 1
        }
        const resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        const data = resp.data
        errorsCheck(data)
        let date = Date.now()
        if (data.result.length) {
          date = Math.round(data.result[0]['server.timestamp'] * 1000)
        }
        const day = getFromTo(date)
        commit('setFrom', day.from)
        commit('setTo', day.to)
        if (day.to < Date.now()) {
          await newMessagesCheck({ state })
        }
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
    let result = []
    if (rootState.token && state.active) {
      const isLoadingActive = state.isLoading
      try {
        !isLoadingActive && Vue.set(state, 'isLoading', true)
        const resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        const data = resp.data
        errorsCheck(data)
        !isLoadingActive && Vue.set(state, 'isLoading', false)
        result = data.result || []
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        !isLoadingActive && Vue.set(state, 'isLoading', false)
      }
    }
    return result
  }

  async function get ({ state, commit, rootState }) {
    if (!state.isLoading) {
      Vue.set(state, 'isLoading', true)
      const start = Math.floor(Date.now() / 1000)
      const params = getParams(state)
      let messagesCount = 0
      const messages = await getMessages({ state, commit, rootState }, params)
      messagesCount += messages.length
      const now = Math.floor(Date.now() / 1000)
      const needRT = (params.to >= now && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        const stop = Math.floor(Date.now() / 1000)
        const params = getParams(state)
        params.from = start
        params.to = stop
        const missedMessages = await getMessages({ state, commit, rootState }, params)
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
      const to = Math.floor(_get(state, 'messages[0]["server.timestamp"]', state.to) - 1)
      const params = getParams(state)
      params.to = to
      params.reverse = true
      if (loopId && state.messages.length > state.limit * 2) {
        await unsubscribePooling({ state, commit, rootState })
        commit('limiting', { type: 'rt_deinit' })
      }
      const messages = await getMessages({ state, commit, rootState }, params)
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
      const start = Date.now()
      const from = Math.floor(_get(state, `messages[${state.messages.length - 1}]['server.timestamp']`, state.from) + 1)
      const params = getParams(state)
      let messagesCount = 0
      params.from = from
      const messages = await getMessages({ state, commit, rootState }, params)
      messagesCount += messages.length
      const needRT = (params.to > Math.floor(Date.now() / 1000) && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        const stop = Date.now()
        const params = getParams(state)
        params.from = Math.floor(start / 1000)
        params.to = Math.floor(stop / 1000)
        const missedMessages = await getMessages({ state, commit, rootState }, params)
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
    const limit = state.limit
    commit('clearMessages')
    commit('setReverse', true)
    commit('setLimit', count)
    await get({ state, commit, rootState })
    commit('setReverse', false)
    commit('setLimit', limit)
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
        const lastIndexOffline = state.messages.reduceRight((result, value, index) => {
          if (result) {
            return result
          }
          if (value.__connectionStatus === 'offline') {
            result = index
          }
          return result
        }, 0)
        const params = {
          from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1]['server.timestamp']) + 1,
          to: Math.floor(state.messages[lastIndexOffline + 1]['server.timestamp'])
        }
        const resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        const data = resp.data
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

  async function newMessagesCheck ({ state }) {
    state.hasNewMessages = false
    await Vue.connector.subscribeMessagesChannels(state.active, '+', () => {
      state.hasNewMessages = true
      unsubscribePooling({ state })
    }, { rh: 2 })
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
