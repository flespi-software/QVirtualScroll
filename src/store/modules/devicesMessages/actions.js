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
        const errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    }
  }

  async function getCols ({ state, commit, rootState }, sysColsNeedInitFlags) {
    const DEFAULT_COL_NAMES = state.defaultColsNames
    const needActions = sysColsNeedInitFlags.actions
    const needEtc = sysColsNeedInitFlags.etc
    commit('reqStart')
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        /* getting device info */
        const deviceResp = await Vue.connector.gw.getDevices(state.active)
        const deviceData = deviceResp.data
        errorsCheck(deviceData)
        const device = deviceData.result && deviceData.result[0]
        commit('setSettings', device)
        let cols = []
        const colsFromStorage = LocalStorage.getItem(state.name)
        if (colsFromStorage && colsFromStorage[device.device_type_id] && colsFromStorage[device.device_type_id].length) {
          cols = colsFromStorage[device.device_type_id]
          /* adding sys cols after migration. 30.01.20 */
          if (!cols[0].__dest && !cols[cols.length - 1].__dest) {
            cols.unshift({ name: 'actions', width: 50, display: needActions, __dest: 'action' })
            cols.push({ name: 'etc', width: 150, display: needEtc, __dest: 'etc' })
          }
        } else {
          if (device.device_type_id) {
            /* getting protocol id */
            const protocolResp = await Vue.connector.gw.getProtocolsDeviceTypes('all', device.device_type_id, { fields: 'protocol_id' })
            const protocolData = protocolResp.data
            errorsCheck(protocolData)
            const protocolId = protocolData.result && protocolData.result[0] && protocolData.result[0].protocol_id
            /* gettings messages parameters */
            const messageParamsResp = await Vue.connector.gw.getProtocols(protocolId, { fields: 'message_parameters' })
            const messageParamsData = messageParamsResp.data
            errorsCheck(messageParamsData)
            const messageParams = messageParamsData.result && messageParamsData.result[0] && messageParamsData.result[0].message_parameters
            /* initing columns by message parameters */
            cols = messageParams.reduce((cols, param) => {
              const name = param.name
              if (name === 'timestamp') {
                const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
                cols.unshift({
                  name,
                  width: 190,
                  display: true,
                  addition: `${locale.slice(0, 3)}:${locale.slice(3)}`
                })
                return cols
              }
              cols.push({
                name,
                width: 150,
                display: DEFAULT_COL_NAMES.includes(name)
              })
              return cols
            }, [])
          }
          cols.unshift({ name: 'actions', width: 50, display: needActions, __dest: 'action' })
          cols.push({ name: 'etc', width: 150, display: needEtc, __dest: 'etc' })
        }
        Vue.set(state, 'cols', cols)
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  // async function getCols ({ state, commit, rootState }) {
  //   const DEFAULT_COL_NAMES = state.defaultColsNames
  //   commit('reqStart')
  //   if (rootState.token && state.active) {
  //     try {
  //       Vue.set(state, 'isLoading', true)
  //       /* getting telemetry */
  //       let deviceTelemetryResp = await Vue.connector.gw.getDevicesTelemetry(state.active)
  //       let deviceTelemetryData = deviceTelemetryResp.data
  //       errorsCheck(deviceTelemetryData)
  //       let telemetry = deviceTelemetryData.result && deviceTelemetryData.result[0] && deviceTelemetryData.result[0].telemetry
  //       /* getting device info */
  //       let deviceResp = await Vue.connector.gw.getDevices(state.active)
  //       let deviceData = deviceResp.data
  //       errorsCheck(deviceData)
  //       let device = deviceData.result && deviceData.result[0]
  //       commit('setSettings', device)
  //       let cols = [],
  //         colsFromStorage = LocalStorage.getItem(state.name)
  //       if (colsFromStorage && colsFromStorage[device.device_type_id] && colsFromStorage[device.device_type_id].length) {
  //         /* remove after sometime 12.07.19 */
  //         colsFromStorage[device.device_type_id].forEach((col) => {
  //           if (col.name === 'timestamp') {
  //             let locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
  //             col.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
  //           }
  //         })
  //         cols = colsFromStorage[device.device_type_id]
  //       } else {
  //         if (device.device_type_id) {
  //           /* getting protocol id */
  //           let protocolResp = await Vue.connector.gw.getProtocolsDeviceTypes('all', device.device_type_id, { fields: 'protocol_id' })
  //           let protocolData = protocolResp.data
  //           errorsCheck(protocolData)
  //           let protocolId = protocolData.result && protocolData.result[0] && protocolData.result[0].protocol_id
  //           /* gettings messages parameters */
  //           let messageParamsResp = await Vue.connector.gw.getProtocols(protocolId, { fields: 'message_parameters' })
  //           let messageParamsData = messageParamsResp.data
  //           errorsCheck(messageParamsData)
  //           let messageParams = messageParamsData.result && messageParamsData.result[0] && messageParamsData.result[0].message_parameters
  //           /* initing columns by message parameters */
  //           cols = messageParams.reduce((cols, param) => {
  //             let name = param.name
  //             if (name === 'timestamp') {
  //               let locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
  //               cols.unshift({
  //                 name,
  //                 width: 190,
  //                 display: false,
  //                 addition: `${locale.slice(0, 3)}:${locale.slice(3)}`
  //               })
  //               return cols
  //             }
  //             cols.push({
  //               name,
  //               width: 150,
  //               display: false
  //             })
  //             return cols
  //           }, [])
  //           /* enable cols by active telemetry */
  //           if (telemetry) {
  //             /* remove position object */
  //             if (telemetry.position) {
  //               delete telemetry.position
  //             }
  //             let colNames = Object.keys(telemetry)
  //             if (cols.length && colNames) {
  //               /* merging existed columns with telemetry for creating actual columns */
  //               cols.forEach(col => {
  //                 if (telemetry[col.name]) {
  //                   col.display = true
  //                 }
  //               })
  //             }
  //           } else { /* enable default cols w/o saving */
  //             cols = DEFAULT_COL_NAMES.reduce((cols, name) => {
  //               let index = cols.findIndex((col) => col.name === name)
  //               if (index === -1) {
  //                 cols.push({
  //                   name,
  //                   width: 150,
  //                   display: true
  //                 })
  //               } else {
  //                 cols[index].display = true
  //               }
  //               return cols
  //             }, cols)
  //           }
  //         }
  //       }

  //       if (telemetry) {
  //         commit('setCols', cols)
  //       } else {
  //         Vue.set(state, 'cols', cols)
  //       }
  //       Vue.set(state, 'isLoading', false)
  //     } catch (e) {
  //       errorHandler && errorHandler(e)
  //       if (DEV) { console.log(e) }
  //       Vue.set(state, 'isLoading', false)
  //     }
  //   }
  // }

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
          count: 1,
          fields: 'timestamp'
        }
        const resp = await Vue.connector.gw.getDevicesMessages(state.active, { data: JSON.stringify(params) })
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

  async function getMessages ({ state, commit, rootState }, params) {
    commit('reqStart')
    if (rootState.token && state.active) {
      const isLoadingActive = state.isLoading
      try {
        !isLoadingActive && Vue.set(state, 'isLoading', true)
        const resp = await Vue.connector.gw.getDevicesMessages(state.active, { data: JSON.stringify(params) })
        const data = resp.data
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
      const to = Math.floor(_get(state, 'messages[0].timestamp', state.to) - 1)
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
      const from = Math.floor(_get(state, `messages[${state.messages.length - 1}].timestamp`, state.from) + 1)
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
    const limit = state.limit,
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
    await Vue.connector.subscribeMessagesDevices(state.active, (message) => {
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
    await Vue.connector.unsubscribeMessagesDevices(state.active)
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
          from: !lastIndexOffline ? 0 : Math.floor(state.messages[lastIndexOffline - 1].timestamp) + 1,
          to: Math.floor(state.messages[lastIndexOffline + 1].timestamp)
        }
        const resp = await Vue.connector.gw.getDevicesMessages(state.active, { data: JSON.stringify(params) })
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
