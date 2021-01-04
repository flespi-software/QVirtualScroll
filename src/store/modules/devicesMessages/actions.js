import _get from 'lodash/get'

const defaultCols = ['timestamp', 'server.timestamp', 'ident', 'position.latitude', 'position.longitude', 'position.altitude', 'position.speed']

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

  /* migration to new format storing cols 28.12.20 */
  function migrateCols (cols) {
    const schema = {
      activeSchema: '_default',
      schemas: {
        _default: {
          name: '_default',
          cols: defaultCols.map(name => ({ name, width: 150 }))
        },
        _protocol: {
          name: '_protocol',
          cols: cols.reduce((res, col) => {
            if (!col.custom) {
              res.push({ name: col.name, width: 150 })
            }
            return res
          }, [])
        }
      },
      enum: {}
    }
    if (cols.length) {
      schema.activeSchema = '_unsaved'
      schema.schemasю_unsaved = {
        name: 'Modified',
        cols: cols.reduce((res, col) => {
          if (col.display) {
            res.push({ name: col.name, width: col.width })
          }
          return res
        }, [])
      }
      schema.enum = cols.reduce((res, col) => {
        res[col.name] = { ...col }
        delete res[col.name].display
        delete res[col.name].width
        return res
      }, {})
    }
    return schema
  }

  function getDefaultColsSchema () {
    return {
      activeSchema: '_default',
      schemas: {
        _default: {
          name: '_default',
          cols: defaultCols.map(name => ({ name, width: 150 }))
        }
      },
      enum: defaultCols.reduce((res, name) => {
        res[name] = { name }
        return res
      }, {})
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
        appStorage = LocalStorage.getItem(lsItemName) || {}
      colsFromStorage = _get(appStorage, lsRouteToItem, colsFromStorage)
    } else {
      colsFromStorage = LocalStorage.getItem(state.name)
      if (!colsFromStorage || colsFromStorage === 'null') {
        colsFromStorage = {}
      }
    }
    return colsFromStorage
  }

  async function getCols ({ state, commit, rootState }, sysColsNeedInitFlags) {
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
        const colsFromStorage = getColsFromLS(state)
        let colsSchema = (colsFromStorage && colsFromStorage[device.device_type_id])
          ? colsFromStorage[device.device_type_id] : getDefaultColsSchema()
        const customColsSchemas = (colsFromStorage && colsFromStorage['custom-cols-schemas'])
          ? colsFromStorage['custom-cols-schemas'] : {}
        colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
        if (Array.isArray(colsSchema)) {
          colsSchema = migrateCols(colsSchema)
          commit('setColsToLS', colsSchema)
        }
        const needMigration = !colsSchema.enum || (
          _get(colsSchema.enum, 'timestamp.unit', undefined) === undefined
        ) // type and unit adding 02.09.20

        /* adding sys cols after migration. 12.11.20 */
        if (_get(colsSchema.enum, 'action.__dest', undefined) === 'action') {
          delete colsSchema.enum.action
        }
        if (needMigration) {
          if (device.device_type_id) {
            /* getting protocol id */
            const protocolResp = await Vue.connector.gw.getChannelProtocolsDeviceTypes('all', device.device_type_id, { fields: 'protocol_id' })
            const protocolData = protocolResp.data
            errorsCheck(protocolData)
            const protocolId = protocolData.result && protocolData.result[0] && protocolData.result[0].protocol_id
            /* gettings messages parameters */
            const messageParamsResp = await Vue.connector.gw.getChannelProtocols(protocolId, { fields: 'message_parameters' })
            const messageParamsData = messageParamsResp.data
            errorsCheck(messageParamsData)
            const messageParams = messageParamsData.result && messageParamsData.result[0] && messageParamsData.result[0].message_parameters
            /* initing columns by message parameters */
            colsSchema.schemas._protocol = {
              name: '_protocol',
              cols: []
            }
            messageParams.forEach((param) => {
              const name = param.name
              const enumCol = {
                name,
                type: param.type || '',
                unit: param.unit || '',
                description: param.info || ''
              }
              const schemaCol = {
                name,
                width: 150
              }
              if (name === 'timestamp') {
                const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
                enumCol.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
                enumCol.type = ''
                enumCol.unit = ''
                schemaCol.width = 190
                colsSchema.schemas._protocol.cols.unshift(schemaCol)
                colsSchema.enum.timestamp = enumCol
                return
              }
              if (name === 'server.timestamp') {
                enumCol.type = ''
                enumCol.unit = ''
                schemaCol.width = 190
              }
              colsSchema.schemas._protocol.cols.push(schemaCol)
              colsSchema.enum[name] = enumCol
            })
          }
          if (needEtc) {
            colsSchema.schemas._protocol.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
            colsSchema.schemas._default.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
          }
          colsSchema.enum.etc = { name: 'etc', __dest: 'etc' }
        }
        commit('setCols', colsSchema)
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
        const resp = await Vue.connector.gw.getDevicesMessages(state.active, { data: JSON.stringify(params) })
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

  async function newMessagesCheck ({ state }) {
    state.hasNewMessages = false
    await Vue.connector.subscribeMessagesDevices(state.active, () => {
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
