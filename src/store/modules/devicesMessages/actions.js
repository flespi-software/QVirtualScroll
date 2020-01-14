import _get from 'lodash/get'

export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    let params = {}
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter) {
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

  async function getCols ({ state, commit, rootState }) {
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
          colsFromStorage = LocalStorage.getItem(state.name)
        if (colsFromStorage && colsFromStorage[device.device_type_id] && colsFromStorage[device.device_type_id].length) {
          /* remove after sometime 12.07.19 */
          colsFromStorage[device.device_type_id].forEach((col) => {
            if (col.name === 'timestamp') {
              let locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
              col.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
            }
          })
          cols = colsFromStorage[device.device_type_id]
        } else {
          if (device.device_type_id) {
            /* getting protocol id */
            let protocolResp = await Vue.connector.gw.getProtocolsDeviceTypes('all', device.device_type_id, { fields: 'protocol_id' })
            let protocolData = protocolResp.data
            errorsCheck(protocolData)
            let protocolId = protocolData.result && protocolData.result[0] && protocolData.result[0].protocol_id
            /* gettings messages parameters */
            let messageParamsResp = await Vue.connector.gw.getProtocols(protocolId, { fields: 'message_parameters' })
            let messageParamsData = messageParamsResp.data
            errorsCheck(messageParamsData)
            let messageParams = messageParamsData.result && messageParamsData.result[0] && messageParamsData.result[0].message_parameters
            /* initing columns by message parameters */
            cols = messageParams.reduce((cols, param) => {
              let name = param.name
              if (name === 'timestamp') {
                let locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
                cols.unshift({
                  name,
                  width: 190,
                  display: false,
                  addition: `${locale.slice(0, 3)}:${locale.slice(3)}`
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
              if (telemetry.position) {
                delete telemetry.position
              }
              let colNames = Object.keys(telemetry)
              if (cols.length && colNames) {
                /* merging existed columns with telemetry for creating actual columns */
                cols.forEach(col => {
                  if (telemetry[col.name]) {
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
          count: 1,
          fields: 'timestamp'
        }
        let resp = await Vue.connector.gw.getDevicesMessages(state.active, { data: JSON.stringify(params) })
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

  async function getMessages ({ state, commit, rootState }, params) {
    commit('reqStart')
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let currentMode = JSON.parse(JSON.stringify(state.mode))
        let resp = await Vue.connector.gw.getDevicesMessages(state.active, { data: JSON.stringify(params) })
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
    let messages = await getMessages({ state, commit, rootState }, getParams(state))
    commit('setMessages', messages)
  }

  async function getPrevPage ({ state, commit, rootState }) {
    if (!state.isLoading) {
      let to = Math.floor(_get(state, 'messages[0].timestamp', state.to) - 1)
      let params = getParams(state)
      params.to = to
      params.reverse = true
      let messages = await getMessages({ state, commit, rootState }, params)
      commit('prependMessages', messages)
      return messages.length
    }
  }

  async function getNextPage ({ state, commit, rootState }) {
    if (!state.isLoading) {
      let from = Math.floor(_get(state, `messages[${state.messages.length - 1}].timestamp`, state.from) + 1)
      let params = getParams(state)
      params.from = from
      let messages = await getMessages({ state, commit, rootState }, params)
      commit('appendMessages', messages)
      return messages.length
    }
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
    loopId = initRenderLoop(state, commit)
    await Vue.connector.subscribeMessagesDevices(state.active, (message) => {
      if (state.mode === 1) {
        messagesBuffer.push(JSON.parse(message))
      }
    }, { rh: 2 })
  }

  /* unsubscribe from current active topic */
  async function unsubscribePooling ({ state }) {
    if (loopId) { clearInterval(loopId) }
    await Vue.connector.unsubscribeMessagesDevices(state.active)
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
          from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1].timestamp) + 1,
          to: Math.floor(state.messages[lastIndexOffline + 1].timestamp)
        }
        let resp = await Vue.connector.gw.getDevicesMessages(state.active, { data: JSON.stringify(params) })
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
