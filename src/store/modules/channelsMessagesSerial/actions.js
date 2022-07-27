import _get from 'lodash/get'
import { getColsLS, setColsLS } from '../ls'

const defaultCols = ['timestamp', 'server.timestamp', 'ident', 'position.latitude', 'position.longitude', 'position.altitude', 'position.speed']
export default function ({ Vue, LocalStorage, errorHandler, logger }) {
  function getParams (state) {
    const params = {}
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter) {
      params.filter = `${state.filter}`
    }
    if (state.from) {
      params.from = state.from / 1000
    }
    if (state.to) {
      params.to = state.to / 1000
    }
    if (state.reverse) {
      params.reverse = state.reverse
    }
    return params
  }

  function errorsCheck (commit, data) {
    if (data.errors) {
      commit('reqError', data.errors)
      data.errors.forEach((error) => {
        const errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    } else {
      commit('reqFullfiled')
    }
  }

  function getDefaultEnum () {
    return defaultCols.reduce((res, name) => {
      res[name] = { name }
      return res
    }, {})
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
      enum: getDefaultEnum()
    }
  }

  async function getCols ({ state, commit, rootState }, sysColsNeedInitFlags) {
    const needEtc = sysColsNeedInitFlags.etc
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        let colsFromStorage = getColsLS(LocalStorage, state.lsNamespace, state.name)
        colsFromStorage = (colsFromStorage && colsFromStorage[state.active])
        const colsSchema = colsFromStorage || getDefaultColsSchema()
        const customColsSchemas = (colsFromStorage && colsFromStorage['custom-cols-schemas'])
          ? colsFromStorage['custom-cols-schemas'] : {}
        colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
        if (!colsSchema.enum) {
          colsSchema.enum = getDefaultEnum()
        }
        const protocolIdResp = await Vue.connector.gw.getChannels(state.active, { fields: 'protocol_id' })
        commit('reqStart', { endpoint: 'getChannels', active: state.active, fields: 'protocol_id' })
        const protocolIdData = protocolIdResp.data
        errorsCheck(commit, protocolIdData)
        if (protocolIdData.result && protocolIdData.result.length && protocolIdData.result[0].protocol_id) {
          const colsResp = await Vue.connector.gw.getChannelProtocols(protocolIdData.result[0].protocol_id, { fields: 'message_parameters' })
          commit('reqStart', { endpoint: 'getChannelProtocols', active: protocolIdData.result[0].protocol_id, fields: 'message_parameters' })
          const colsData = colsResp.data
          errorsCheck(commit, colsData)
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
          !colsFromStorage && colsSchema.schemas._default.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
        }
        colsSchema.enum.etc = { name: 'etc', __dest: 'etc' }
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
      to = from + 86399999.999
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
        commit('reqStart', { endpoint: 'getChannelsMessages-initTime', active: state.active, data: JSON.stringify(params) })
        const data = resp.data
        errorsCheck(commit, data)
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
    let result = []
    if (rootState.token && state.active) {
      const isLoadingActive = state.isLoading
      try {
        !isLoadingActive && Vue.set(state, 'isLoading', true)
        const resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        commit('reqStart', { endpoint: 'getChannelsMessages', active: state.active, data: JSON.stringify(params) })
        const data = resp.data
        errorsCheck(commit, data)
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

  async function getMessagesByInitTimestamp ({ state, commit, rootState }, initTimestamp) {
    const params = getParams(state)
    const beforeMessagesParams = {
      ...params,
      from: state.from / 1000,
      to: initTimestamp,
      reverse: true,
      count: state.limit / 2
    }
    const beforeMessages = await getMessages({ state, commit, rootState }, beforeMessagesParams)
    const afterMessagesParams = {
      from: initTimestamp + 0.000001,
      to: state.to / 1000,
      count: state.limit - beforeMessages.length
    }
    const afterMessages = await getMessages({ state, commit, rootState }, afterMessagesParams)
    const messages = [...beforeMessages.reverse(), ...afterMessages]
    return messages
  }

  async function get ({ state, commit, rootState }, initTimestamp) {
    if (!state.isLoading) {
      Vue.set(state, 'isLoading', true)
      if (loopId) {
        await unsubscribePooling({ state, commit, rootState })
      }
      const start = (Date.now() + 0.000999) / 1000
      let messagesCount = 0
      let messages = []
      const params = getParams(state)
      if (initTimestamp) {
        messages = await getMessagesByInitTimestamp({ state, commit, rootState }, initTimestamp)
      } else {
        messages = await getMessages({ state, commit, rootState }, params)
      }
      messagesCount += messages.length
      const now = (Date.now() + 0.000999) / 1000
      const needRT = (params.to >= now && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        if (initTimestamp) {
          const stop = (Date.now() + 0.000999) / 1000
          const params = getParams(state)
          params.from = start
          params.to = stop
          const missedMessages = await getMessages({ state, commit, rootState }, params)
          messagesCount += missedMessages.length
          messages.splice(0, 0, ...missedMessages)
        }
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
      const to = _get(state, 'messages[0]["server.timestamp"]', state.to) - 0.000001
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
      const from = _get(state, `messages[${state.messages.length - 1}]['server.timestamp']`, state.from) + 0.000001
      const params = getParams(state)
      let messagesCount = 0
      params.from = from
      const messages = await getMessages({ state, commit, rootState }, params)
      messagesCount += messages.length
      const needRT = (params.to + 2 > Math.floor(Date.now() / 1000) && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        const stop = Date.now()
        const params = getParams(state)
        params.from = start / 1000
        params.to = stop / 1000
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

  async function pollingGet ({ state, commit }) {
    const filter = state.filter ? `$filter/payload=${encodeURIComponent(state.filter)}` : undefined
    await Vue.connector.subscribeMessagesChannels(state.active, '+', (message) => {
      messagesBuffer.push(JSON.parse(message))
    }, { rh: 2, prefix: filter })
    state.realtimeEnabled = true
    logger.info(`subscribed to messagesChannels ${state.active} ${filter || ''}`)
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
    const filter = state.filter ? `$filter/payload=${encodeURIComponent(state.filter)}` : undefined
    await Vue.connector.unsubscribeMessagesChannels(state.active, '+', undefined, { prefix: filter })
    state.realtimeEnabled = false
    logger.info(`unsubscribed to messagesChannels ${state.active} ${filter || ''}`)
  }

  /* getting missed messages after offline */
  async function getMissedMessages ({ state, commit, rootState }) {
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        const { start, end, lastMessageIndex } = state.offline
        const params = {
          from: start,
          to: end
        }
        if (state.filter) { params.data.filter = state.filter }
        const resp = await Vue.connector.gw.getChannelsMessages(state.active, { data: JSON.stringify(params) })
        const data = resp.data
        commit('reqStart', { endpoint: 'getChannelsMessages', active: state.active, data: JSON.stringify(params) })
        errorsCheck(commit, data)
        commit('setMissingMessages', { data: data.result, index: lastMessageIndex })
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
    logger.info(`newMessagesCheck subscribed to messagesChannels ${state.active}`)
  }

  return {
    getMessages,
    get,
    getPrevPage,
    getNextPage,
    pollingGet,
    getCols,
    getHistory,
    getMessagesByInitTimestamp,
    initTime,
    unsubscribePooling,
    getMissedMessages
  }
}
