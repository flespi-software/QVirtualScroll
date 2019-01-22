export default function ({Vue, LocalStorage, errorHandler}) {
  function getParams(state) {
    let params = {}
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter && state.sysFilter) {
      if (state.mode === 1) {
        params.filter = `${state.sysFilter}`
      }
      else {
        params.filter = `${state.sysFilter},${state.filter}`
      }
    }
    else if (state.sysFilter && !state.filter) {
      params.filter = `${state.sysFilter}`
    }
    else if (!state.sysFilter && state.filter) {
      if (state.mode === 0) {
        params.filter = `${state.filter}`
      }
    }
    //uncomment after release get cols by protocol
    // if (state.cols.length) {
    //     params.fields = state.cols.filter(col => {
    //         if (col.name === 'timestamp') { return true }
    //         return col.display
    //     }).reduce((acc, col, index, arr) => {
    //         return `${acc}${col.name}${index !== arr.length - 1 ? ',' : ''}`
    //     }, '')
    // }
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

  async function getCols({state, commit, rootState}) {
    commit('reqStart')
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let cols = [],
          colsFromStorage = LocalStorage.get.item(state.name)
        if (colsFromStorage && colsFromStorage[state.active] && colsFromStorage[state.active].length) {
          cols = colsFromStorage[state.active]
        } else {
          let deviceResp = await Vue.connector.gw.getDevicesTelemetry(state.active)
          let deviceData = deviceResp.data
          errorsCheck(deviceData)
          let colNames = deviceData.result && deviceData.result[0] && deviceData.result[0].telemetry ? Object.keys(deviceData.result[0].telemetry) : []
          /* remove position object */
          if (colNames.includes('position')) {
            colNames.splice(colNames.indexOf('position'), 1)
          }
          if (colNames.length) {
            cols = colNames.reduce((acc, col) => {
              if (col === 'timestamp') { // todo remove after get configure for cols
                acc.unshift({
                  name: col,
                  width: 190,
                  display: true
                })
                return acc
              }
              acc.push({
                name: col,
                width: 150,
                display: true
              })
              return acc
            }, [])
          }
        }

        commit('setCols', cols)
        Vue.set(state, 'isLoading', false)
      }
      catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
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
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let params = {
          reverse: true,
          count: 1,
          fields: 'timestamp'
        }
        let resp = await Vue.connector.gw.getDevicesMessages(state.active, {data: JSON.stringify(params)})
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
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let currentMode = JSON.parse(JSON.stringify(state.mode))
        let resp = await Vue.connector.gw.getDevicesMessages(state.active, {data: JSON.stringify(getParams(state))})
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
    await Vue.connector.subscribeMessagesDevices(state.active, (message) => {
      if (state.mode === 1) {
        commit('setMessages', [JSON.parse(message)])
      }
      else {
        commit('setNewMessagesCount', state.newMessagesCount + 1)
      }
    }, { rh: 2 })
  }

  /* unsubscribe from current active topic */
  async function unsubscribePooling({state}) {
    await Vue.connector.unsubscribeMessagesDevices(state.active)
  }

  /* getting missed messages after offline */
  async function getMissedMessages({state, commit, rootState}) {
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
          from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1].timestamp) + 1,
          to: Math.floor(state.messages[lastIndexOffline + 1].timestamp)
        }
        let resp = await Vue.connector.gw.getDevicesMessages(state.active, {data: JSON.stringify(params)})
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

  return {
    get,
    pollingGet,
    getCols,
    getHistory,
    initTime,
    unsubscribePooling,
    getMissedMessages
  }

}
