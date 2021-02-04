import _get from 'lodash/get'
import { getColsLS, setColsLS } from '../ls'

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
  async function migrateCols (active, cols) {
    const schema = {
      activeSchema: '_default',
      schemas: {
        _default: {
          name: '_default',
          cols: cols.reduce((res, col) => {
            if ((defaultCols.includes(col.name) || (!!col.__dest && col.display))) {
              res.push({ name: col.name, width: col.width })
            }
            return res
          }, [])
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
      const processedSchemaByCols = cols.reduce((res, col) => {
        const isColDefault = defaultCols.includes(col.name)
        res.isDefault = res.isDefault && ((!col.display && !isColDefault) || (col.display && (isColDefault || !!col.__dest)))
        res.isProtocol = res.isProtocol && !col.custom
        if (col.display) {
          res.schema.push({ name: col.name, width: col.width })
        }
        res.enum[col.name] = { ...col }
        delete res.enum[col.name].display
        delete res.enum[col.name].width
        return res
      }, {
        schema: [],
        enum: {},
        isDefault: true,
        isProtocol: true
      })
      if (!processedSchemaByCols.isDefault || !processedSchemaByCols.isProtocol) {
        const channelResp = await Vue.connector.gw.getChannels(active, { fields: 'name' })
        const channelData = channelResp.data
        errorsCheck(channelData)
        let name = _get(channelData, 'result[0].name', `Channel-${active}`)
        name = `${name}[${active}]`
        schema.activeSchema = name
        schema.schemas[name] = {
          name,
          cols: processedSchemaByCols.schema
        }
      }
      schema.enum = processedSchemaByCols.enum
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

  async function getCols ({ state, commit, rootState }, sysColsNeedInitFlags) {
    commit('reqStart')
    const needEtc = sysColsNeedInitFlags.etc
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let colsFromStorage = getColsLS(LocalStorage, state.lsNamespace, state.name)
        colsFromStorage = (colsFromStorage && colsFromStorage[state.active])
        let colsSchema = colsFromStorage || getDefaultColsSchema()
        const customColsSchemas = (colsFromStorage && colsFromStorage['custom-cols-schemas'])
          ? colsFromStorage['custom-cols-schemas'] : {}
        colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
        if (Array.isArray(colsSchema)) {
          colsSchema = await migrateCols(state.active, colsSchema)
          colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
          setColsLS(LocalStorage, state.lsNamespace, state.name, state.active, colsSchema)
        }
        const needMigration = !colsFromStorage || (
          _get(colsSchema.enum, 'timestamp.unit', undefined) === undefined
        ) // type and unit adding 02.09.20

        /* adding sys cols after migration. 12.11.20 */
        if (_get(colsSchema.enum, 'action.__dest', undefined) === 'action') {
          delete colsSchema.enum.action
        }
        /* adding locale to all timestamps 26.01.21 */
        const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
        Object.keys(colsSchema.enum).forEach(name => {
          if (name.match(/timestamp$/)) {
            const col = colsSchema.enum[name]
            col.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
            col.type = ''
            col.unit = ''
          }
        })
        /* adding locale to all timestamps end */

        if (needMigration) {
          const protocolIdResp = await Vue.connector.gw.getChannels(state.active, { fields: 'protocol_id' })
          const protocolIdData = protocolIdResp.data
          errorsCheck(protocolIdData)
          if (protocolIdData.result && protocolIdData.result.length && protocolIdData.result[0].protocol_id) {
            const colsResp = await Vue.connector.gw.getChannelProtocols(protocolIdData.result[0].protocol_id, { fields: 'message_parameters' })
            const colsData = colsResp.data
            errorsCheck(colsData)
            const messageParams = colsData.result[0].message_parameters
            /* initing columns by message parameters */
            colsSchema.schemas._protocol = {
              name: '_protocol',
              cols: []
            }
            const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
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
              if (name.match(/timestamp$/)) {
                enumCol.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
                enumCol.type = ''
                enumCol.unit = ''
                schemaCol.width = 190
                if (name === 'timestamp') {
                  colsSchema.schemas._protocol.cols.unshift(schemaCol)
                  colsSchema.enum.timestamp = enumCol
                  return
                }
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
