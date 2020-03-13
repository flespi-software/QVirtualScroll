import _get from 'lodash/get'
import defaultCols from './defaultCols'
export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    const params = { filter: [] }
    if (state.origin.indexOf('platform') !== -1 || state.isItemDeleted) {
      params.filter.push(`event_origin=${state.origin}`)
    }
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter) {
      params.filter.push(`${state.filter}`)
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
    if (params.filter.length) {
      params.filter = params.filter.join(',')
    } else {
      delete params.filter
    }
    return params
  }

  function getHeaders (state) {
    const headers = {}
    if (state.cid) {
      headers['x-flespi-cid'] = state.cid
    }
    return headers
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

  function getCols ({ state, commit, rootState }, initCols) {
    let cols = initCols || defaultCols
    /* LS processing */
    const colsFromStorage = getColsFromLS(state)
    if (colsFromStorage && colsFromStorage[state.origin] && colsFromStorage[state.origin].length) {
      /* remove after sometime 12.07.19 */
      colsFromStorage[state.origin].forEach((col) => {
        if (col.name === 'timestamp') {
          const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
          col.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
        }
      })
      cols = colsFromStorage[state.origin]
    }
    if (!cols[cols.length - 1].__dest) {
      cols.push({ name: 'etc', width: 150, display: true, __dest: 'etc' })
    }
    commit('setCols', cols)
  }

  function errorsCheck (data) {
    if (data.errors) {
      data.errors.forEach((error) => {
        const errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    }
  }

  function getLogsEntries (origin, deletedStatus) {
    const parts = origin.split('/'),
      id = parts.pop(),
      namespace = deletedStatus || origin === '*'
        ? Vue.connector.http.platform.customer
        : parts.reduce((result, part) => {
          return result[part]
        }, Vue.connector.http)
    if (id !== '*' && !deletedStatus) {
      return function (params) {
        return namespace.logs.get(id, { data: JSON.stringify(params.data) }, { headers: params.headers })
      }
    } else {
      return function (params) {
        return namespace.logs.get({ data: JSON.stringify(params.data) }, { headers: params.headers })
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
    if (rootState.token && state.origin) {
      try {
        Vue.set(state, 'isLoading', true)
        const params = {
          data: {
            reverse: true,
            count: 1,
            fields: 'timestamp'
          },
          headers: getHeaders(state)
        }
        if (state.origin.indexOf('platform') !== -1 || state.isItemDeleted) {
          params.data.filter = `event_origin=${state.origin}`
        }
        const resp = await getLogsEntries(state.origin, state.isItemDeleted)(params)
        const data = resp.data
        errorsCheck(data)
        let date = Date.now()
        if (data.result.length) {
          date = Math.round(data.result[0].timestamp * 1000)
        }
        const day = getFromTo(date)
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

  async function getLogs ({ state, commit, rootState }, params) {
    commit('reqStart')
    let result = []
    if (rootState.token && state.origin) {
      const isLoadingActive = state.isLoading
      try {
        !isLoadingActive && Vue.set(state, 'isLoading', true)
        const resp = await getLogsEntries(state.origin, state.isItemDeleted)({ data: params, headers: getHeaders(state) })
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
      const messages = await getLogs({ state, commit, rootState }, params)
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
        const missedMessages = await getLogs({ state, commit, rootState }, params)
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

  async function getHistory ({ state, commit, rootState }, count) {
    const limit = state.limit
    commit('clearMessages')
    commit('setReverse', true)
    commit('setLimit', count)
    await get({ state, commit, rootState })
    commit('setReverse', false)
    commit('setLimit', limit)
  }

  async function getPrevPage ({ state, commit, rootState }) {
    if (!state.isLoading) {
      Vue.set(state, 'isLoading', true)
      const to = Math.floor(_get(state, 'messages[0].timestamp', state.to) - 1)
      const params = getParams(state)
      params.to = to
      params.reverse = true
      if (loopId && state.messages.length > state.limit * 2) {
        await unsubscribePooling({ state, commit, rootState })
        commit('limiting', { type: 'rt_deinit' })
      }
      const messages = await getLogs({ state, commit, rootState }, params)
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
      const from = Math.floor(_get(state, `messages[${state.messages.length - 1}].timestamp`, state.from) + 1)
      const params = getParams(state)
      let messagesCount = 0
      params.from = from
      const messages = await getLogs({ state, commit, rootState }, params)
      messagesCount += messages.length
      const needRT = (params.to > Math.floor(Date.now() / 1000) && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        const stop = Date.now()
        const params = getParams(state)
        params.from = Math.floor(start / 1000)
        params.to = Math.floor(stop / 1000)
        const missedMessages = await getLogs({ state, commit, rootState }, params)
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
    const api = state.origin.split('/')[0].replace(/\*/g, '+'),
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
    let properties = {}
    if (state.cid) {
      properties = { userProperties: { cid: state.cid } }
    }
    await Vue.connector.subscribeLogs(api, origin, '#', (message) => {
      messagesBuffer.push(JSON.parse(message))
    }, { rh: 2, properties })
    state.realtimeEnabled = true
    return () => {
      loopId = initRenderLoop(state, commit)
    }
  }

  /* getting missed messages after offline */
  async function getMissedMessages ({ state, commit, rootState }) {
    if (rootState.token && state.origin) {
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
          data: {
            from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1].timestamp) + 1,
            to: Math.floor(state.messages[lastIndexOffline + 1].timestamp)
          },
          headers: getHeaders(state)
        }
        if (state.origin.indexOf('platform') !== -1) {
          params.data.filter = `event_origin=${state.origin}`
        }
        const resp = await getLogsEntries(state.origin, state.isItemDeleted)(params)
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

  /* unsubscribe from current active topic */
  async function unsubscribePooling ({ state }) {
    const api = state.origin.split('/')[0].replace(/\*/g, '+'),
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
    if (loopId) {
      clearInterval(loopId)
      messagesBuffer = []
      loopId = 0
    }
    let properties = {}
    if (state.cid) {
      properties = { userProperties: { cid: state.cid } }
    }
    await Vue.connector.unsubscribeLogs(api, origin, '#', undefined, { properties })
    state.realtimeEnabled = false
  }

  return {
    getLogs,
    get,
    getPrevPage,
    getNextPage,
    pollingGet,
    getHistory,
    initTime,
    getCols,
    unsubscribePooling,
    getMissedMessages
  }
}
