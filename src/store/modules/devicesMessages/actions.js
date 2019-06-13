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
    const DEFAULT_COL_NAMES = ['timestamp', 'position.latitude', 'position.longitude', 'position.altitude', 'position.speed']
    commit('reqStart')
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        /* getting telemetry */
        let deviceTelemetryResp = await Vue.connector.gw.getDevicesTelemetry(state.active)
        let deviceTelemetryData = deviceTelemetryResp.data
        errorsCheck(deviceTelemetryData)
        let telemetry = deviceTelemetryData.result && deviceTelemetryData.result[0] && deviceTelemetryData.result[0].telemetry
        /* getting device info */
        let deviceResp = await Vue.connector.gw.getDevices(state.active)
        let deviceData = deviceResp.data
        errorsCheck(deviceData)
        let device = deviceData.result && deviceData.result[0]
        commit('setSettings', device)
        let cols = [],
          colsFromStorage = LocalStorage.get.item(state.name)
        if (colsFromStorage && colsFromStorage[device.device_type_id] && colsFromStorage[device.device_type_id].length) {
          cols = colsFromStorage[device.device_type_id]
        } else {
          if (device.device_type_id) {
            /* getting protocol id */
            let protocolResp = await Vue.connector.gw.getProtocolsDeviceTypes('all', device.device_type_id, {fields: 'protocol_id'})
            let protocolData = protocolResp.data
            errorsCheck(protocolData)
            let protocolId = protocolData.result && protocolData.result[0] && protocolData.result[0].protocol_id
            /* gettings messages parameters */
            let messageParamsResp = await Vue.connector.gw.getProtocols(protocolId, {fields: 'message_parameters'})
            let messageParamsData = messageParamsResp.data
            errorsCheck(messageParamsData)
            let messageParams = messageParamsData.result && messageParamsData.result[0] && messageParamsData.result[0].message_parameters
            /* initing columns by message parameters */
            cols = messageParams.reduce((cols, param) => {
              let name = param.name
              if (name === 'timestamp') {
                cols.unshift({
                  name,
                  width: 190,
                  display: false
                })
                return cols
              }
              cols.push({
                name,
                width: 150,
                display: false
              })
              return cols
            }, [])
            /* enable cols by active telemetry */
            if (telemetry) {
              /* remove position object */
              if (!!telemetry.position) {
                delete telemetry.position
              }
              let colNames = Object.keys(telemetry)
              if (cols.length && colNames) {
                /* merging existed columns with telemetry for creating actual columns */
                cols.forEach(col => {
                  if (!!telemetry[col.name]) {
                    col.display = true
                  }
                })
              }
            } else { /* enable default cols w/o saving */
              cols = DEFAULT_COL_NAMES.reduce((cols, name) => {
                let index = cols.findIndex((col) => col.name === name)
                if (index === -1) {
                  cols.push({
                    name,
                    width: 150,
                    display: true
                  })
                } else {
                  cols[index].display = true
                }
                return cols
              }, cols)
            }
          }
        }

        if (telemetry) {
          commit('setCols', cols)
        } else {
          Vue.set(state, 'cols', cols)
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
