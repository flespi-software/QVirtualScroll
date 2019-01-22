export default function ({Vue, LocalStorage, errorHandler}) {
  let defaultCols = [
    {
      name: 'timestamp',
      width: 100,
      display: true,
      description: 'Log event time'
    },
    {
      name: 'event_code',
      title: 'event',
      width: 400,
      display: true,
      description: 'Log event code and description'
    },
    {
      name: 'ident',
      width: 150,
      display: true,
      description: 'Connected device\'s identification string'
    },
    {
      name: 'msgs',
      width: 85,
      display: true,
      description: 'Number of messages received'
    },
    {
      name: 'recv',
      width: 85,
      display: true,
      description: 'Number of bytes received'
    },
    {
      name: 'send',
      width: 85,
      display: true,
      description: 'Number of bytes sent'
    },
    {
      name: 'source',
      width: 150,
      display: true,
      description: 'Connected device\'s address'
    },
    {
      name: 'host',
      width: 150,
      display: true,
      description: 'IP address from which HTTP request was received'
    },
    {
      name: 'duration',
      width: 85,
      display: true,
      description: 'Connection duration in seconds'
    },
    {
      name: 'transport',
      width: 85,
      display: true,
      description: 'Connected device\'s transport: tcp, udp, http etc'
    }
  ]
  function getParams(state) {
    let params = { filter: [] }
    if (state.origin.indexOf('platform') !== -1 || state.isItemDeleted) {
      params.filter.push(`event_origin=${state.origin}`)
    }
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter && state.sysFilter) {
      params.filter.push(`${state.sysFilter}`)
      if (state.mode !== 1) {
        params.filter.push(`${state.filter}`)
      }
    }
    else if (state.sysFilter && !state.filter) {
      params.filter.push(`${state.sysFilter}`)
    }
    else if (!state.sysFilter && state.filter) {
      if (state.mode === 0) {
        params.filter.push(`${state.filter}`)
      }
    }
    if (state.from && (!state.reverse || state.mode === 1)) {
      if (!state.reverse) {
        params.from = Math.floor(state.from / 1000)
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

  function getCols({state, commit, rootState}, initCols) {
    let cols = initCols || defaultCols,
      colsFromStorage = LocalStorage.get.item(state.name)
    if (colsFromStorage && colsFromStorage[state.origin] && colsFromStorage[state.origin].length) {
      cols = colsFromStorage[state.origin]
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

  function getLogs(origin, deletedStatus) {
    let parts = origin.split('/'),
      id = parts.pop(),
      namespace = deletedStatus ?
        Vue.connector.http.platform.customer :
        parts.reduce((result, part) => {
          return result[part]
        }, Vue.connector.http)
    if (id !== '*' && !deletedStatus) {
      return function (params) {
        return namespace.logs.get(id, {data: JSON.stringify(params)})
      }
    } else {
      return function (params) {
        return namespace.logs.get({data: JSON.stringify(params)})
      }
    }
  }

  function getFromTo(val) {
    let now = val || Date.now(),
      from = new Date(now).setHours(0, 0, 0, 0),
      to = from + 86400000
    return {from, to}
  }

  async function initTime({state, commit, rootState}) {
    if (rootState.token && state.origin) {
      try {
        Vue.set(state, 'isLoading', true)
        let params = {
          reverse: true,
          count: 1,
          fields: 'timestamp'
        }
        if (state.origin.indexOf('platform') !== -1 || state.isItemDeleted) {
          params.filter = `event_origin=${state.origin}`
        }
        let resp = await getLogs(state.origin, state.isItemDeleted)(params)
        let data = resp.data
        errorsCheck(data)
        let date = Date.now()
        if (data.result.length) {
          date = Math.round(data.result[0].timestamp * 1000)
        }
        commit('setDate', getFromTo(date).from)
        Vue.set(state, 'isLoading', false)
      }
      catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function get({state, commit, rootState}, preaction) {
    commit('reqStart')
    if (preaction) {
      let {name: preactionName, payload: preactionPayload} = preaction
      commit('clearMessages')
      commit(preactionName, preactionPayload)
    }
    if (rootState.token && state.origin) {
      try {
        Vue.set(state, 'isLoading', true)
        let currentMode = JSON.parse(JSON.stringify(state.mode))
        let resp = await getLogs(state.origin, state.isItemDeleted)(getParams(state))
        /* if mode changed in time request */
        if (currentMode !== state.mode) { return false }
        let data = resp.data
        errorsCheck(data)
        if (preaction) {
          if (data.result.length) {
            commit('setMessages', data.result)
            commit('postaction')
          }
          else {
            commit('postaction')
            switch (preaction.name) { // logic for empty response after pagination scroll
              case 'paginationPrev': {
                commit('datePrev')
                commit('paginationPrev')
                await get({state, commit, rootState})
                commit('postaction')
                break
              }
              case 'paginationNext': {
                get({state, commit, rootState}, {name: 'dateNext'})
                commit('postaction')
                break
              }
              default: {
                commit('setMessages', data.result)
                commit('postaction')
              }
            }
          }
        }
        else {
          commit('setMessages', data.result)
        }
        Vue.set(state, 'isLoading', false)
      }
      catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function getHistory({state, commit, rootState}, count) {
    let limit = state.limit,
      filter = state.filter
    commit('setReverse', true)
    commit('setLimit', count)
    commit('setFilter', '')
    await get({state, commit, rootState})
    commit('setReverse', false)
    commit('setLimit', limit)
    commit('setFilter', filter)
  }

  async function pollingGet({state, commit, rootState}) {
    let api = state.origin.split('/')[0],
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')

    await Vue.connector.subscribeLogs(api, origin, '#', (message) => {
      if (state.mode === 1) {
        commit('setMessages', [JSON.parse(message)])
      }
      else {
        commit('setNewMessagesCount', state.newMessagesCount + 1)
      }
    }, { rh: 2 })
  }

  /* getting missed messages after offline */
  async function getMissedMessages({state, commit, rootState}) {
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
          from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1].timestamp) + 1,
          to: Math.floor(state.messages[lastIndexOffline + 1].timestamp)
        }
        if (state.origin.indexOf('platform') !== -1) {
          params.filter = `event_origin=${state.origin}`
        }
        let resp = await getLogs(state.origin, state.isItemDeleted)(params)
        let data = resp.data
        errorsCheck(data)
        commit('setMissingMessages', {data: data.result, index: lastIndexOffline})
        Vue.set(state, 'isLoading', false)
      }
      catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  /* unsubscribe from current active topic */
  async function unsubscribePooling({state}) {
    let api = state.origin.split('/')[0],
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
    await Vue.connector.unsubscribeLogs(api, origin, '#')
  }

  return {
    get,
    pollingGet,
    getHistory,
    initTime,
    getCols,
    unsubscribePooling,
    getMissedMessages
  }
}
