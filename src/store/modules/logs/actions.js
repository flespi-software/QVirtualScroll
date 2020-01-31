import _get from 'lodash/get'
import defaultCols from './defaultCols'
export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    let params = { filter: [] }
    if (state.origin.indexOf('platform') !== -1 || state.isItemDeleted) {
      params.filter.push(`event_origin=${state.origin}`)
    }
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter) {
      if (state.mode === 0) {
        params.filter.push(`${state.filter}`)
      }
    }
    if (state.from && (!state.reverse || state.mode === 1)) {
      if (!state.reverse) {
        params.from = Math.floor(state.from / 1000)
      } else if (state.mode === 1) {
        params.from = Math.floor((Date.now() / 1000) - 172800)
      }
    }
    if (state.to) {
      if (state.mode === 1) {
        state.to = Date.now()
      }
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
    let headers = {}
    if (state.cid) {
      headers['x-flespi-cid'] = state.cid
    }
    return headers
  }

  function getCols ({ state, commit, rootState }, initCols) {
    let cols = initCols || defaultCols,
      colsFromStorage = LocalStorage.getItem(state.name)
    if (colsFromStorage && colsFromStorage[state.origin] && colsFromStorage[state.origin].length) {
      /* remove after sometime 12.07.19 */
      colsFromStorage[state.origin].forEach((col) => {
        if (col.name === 'timestamp') {
          let locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
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
        let errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    }
  }

  function getLogsEntries (origin, deletedStatus) {
    let parts = origin.split('/'),
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
    let now = val || Date.now(),
      from = new Date(now).setHours(0, 0, 0, 0),
      to = from + 86399999
    return { from, to }
  }

  async function initTime ({ state, commit, rootState }) {
    if (rootState.token && state.origin) {
      try {
        Vue.set(state, 'isLoading', true)
        let params = {
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
        let resp = await getLogsEntries(state.origin, state.isItemDeleted)(params)
        let data = resp.data
        errorsCheck(data)
        let date = Date.now()
        if (data.result.length) {
          date = Math.round(data.result[0].timestamp * 1000)
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

  async function getLogs ({ state, commit, rootState }, params) {
    commit('reqStart')
    if (rootState.token && state.origin) {
      try {
        Vue.set(state, 'isLoading', true)
        let currentMode = JSON.parse(JSON.stringify(state.mode))
        let resp = await getLogsEntries(state.origin, state.isItemDeleted)({ data: params, headers: getHeaders(state) })
        /* if mode changed in time request */
        if (currentMode !== state.mode) { return false }
        let data = resp.data
        errorsCheck(data)
        Vue.set(state, 'isLoading', false)
        return data.result
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function get ({ state, commit, rootState }) {
    let messages = await getLogs({ state, commit, rootState }, getParams(state))
    commit('setMessages', messages)
  }

  async function getHistory ({ state, commit, rootState }, count) {
    let limit = state.limit,
      filter = state.filter
    commit('setReverse', true)
    commit('setLimit', count)
    commit('setFilter', '')
    await get({ state, commit, rootState })
    commit('setReverse', false)
    commit('setLimit', limit)
    commit('setFilter', filter)
  }

  async function getPrevPage ({ state, commit, rootState }) {
    if (!state.isLoading) {
      let to = Math.floor(_get(state, 'messages[0].timestamp', state.to) - 1)
      let params = getParams(state)
      params.to = to
      params.reverse = true
      let messages = await getLogs({ state, commit, rootState }, params)
      commit('prependMessages', messages)
      return messages.length
    }
  }

  async function getNextPage ({ state, commit, rootState }) {
    if (!state.isLoading) {
      let from = Math.floor(_get(state, `messages[${state.messages.length - 1}].timestamp`, state.from) + 1)
      let params = getParams(state)
      params.from = from
      let messages = await getLogs({ state, commit, rootState }, params)
      commit('appendMessages', messages)
      return messages.length
    }
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
    let api = state.origin.split('/')[0].replace(/\*/g, '+'),
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')

    loopId = initRenderLoop(state, commit)
    let properties = {}
    if (state.cid) {
      properties = { userProperties: { cid: state.cid } }
    }
    await Vue.connector.subscribeLogs(api, origin, '#', (message) => {
      if (state.mode === 1) {
        messagesBuffer.push(JSON.parse(message))
      }
    }, { rh: 2, properties })
  }

  /* getting missed messages after offline */
  async function getMissedMessages ({ state, commit, rootState }) {
    if (rootState.token && state.origin) {
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
          data: {
            from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1].timestamp) + 1,
            to: Math.floor(state.messages[lastIndexOffline + 1].timestamp)
          },
          headers: getHeaders(state)
        }
        if (state.origin.indexOf('platform') !== -1) {
          params.data.filter = `event_origin=${state.origin}`
        }
        let resp = await getLogsEntries(state.origin, state.isItemDeleted)(params)
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

  /* unsubscribe from current active topic */
  async function unsubscribePooling ({ state }) {
    let api = state.origin.split('/')[0].replace(/\*/g, '+'),
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
    if (loopId) { clearInterval(loopId) }
    let properties = {}
    if (state.cid) {
      properties = { userProperties: { cid: state.cid } }
    }
    await Vue.connector.unsubscribeLogs(api, origin, '#', undefined, { properties })
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
