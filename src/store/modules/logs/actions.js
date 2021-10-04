import _get from 'lodash/get'
import defaultCols from './defaultCols'
import { getColsLS, setColsLS } from '../ls'
export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    const params = { filter: [] }
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter) {
      params.filter.push(`${state.filter}`)
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

  /* migration to new format storing cols 28.12.20 */
  function migrateCols (active, initCols, cols) {
    const defaultColsL = initCols || defaultCols
    const schema = {
      activeSchema: '_default',
      schemas: {
        _default: {
          name: '_default',
          cols: defaultColsL.map(col => ({ ...col }))
        },
        _protocol: {
          name: '_protocol',
          cols: defaultColsL.map(col => ({ ...col }))
        }
      },
      enum: defaultColsL.reduce((res, col) => {
        res[col.name] = { ...col }
        delete res[col.name].display
        delete res[col.name].width
        return res
      }, {})
    }
    if (cols && cols.length && JSON.stringify(defaultColsL) !== JSON.stringify(schema.schemas._default.cols)) {
      const name = `Custom[${active}]`
      schema.activeSchema = name
      schema.schemas[name] = {
        name,
        cols: cols.reduce((res, col) => {
          if (col.display) {
            res.push({ name: col.name, width: col.width })
          }
          return res
        }, [])
      }
    }
    return schema
  }

  function getDefaultColsSchema (cols) {
    return {
      activeSchema: '_default',
      schemas: {
        _default: {
          name: '_default',
          cols: cols.map(col => ({ name: col.name, width: col.width }))
        }
      },
      enum: cols.reduce((res, col) => {
        res[col.name] = { ...col }
        delete res[col.name].width
        return res
      }, {})
    }
  }

  function migrateAll (state, initCols, data) {
    for (const name in data) {
      let colsSchema = data[name]
      if (Array.isArray(colsSchema)) {
        colsSchema = migrateCols(state.origin, initCols, data[state.origin])
        setColsLS(LocalStorage, state.lsNamespace, state.name, name, colsSchema)
        data[name] = colsSchema
      } else if (colsSchema.enum) {
        delete colsSchema.enum
        setColsLS(LocalStorage, state.lsNamespace, state.name, name, colsSchema)
        data[name] = colsSchema
      }
    }
    return data
  }

  function getCols ({ state, commit }, initCols) {
    const colsSchema = getDefaultColsSchema(initCols || defaultCols)
    colsSchema.schemas._default.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
    colsSchema.enum.etc = { name: 'etc', __dest: 'etc' }
    /* LS processing */
    const colsFromStorage = getColsLS(LocalStorage, state.lsNamespace, state.name)
    migrateAll(state, initCols, colsFromStorage)
    const customColsSchemas = (colsFromStorage && colsFromStorage['custom-cols-schemas'])
      ? colsFromStorage['custom-cols-schemas'] : {}
    if (colsFromStorage && colsFromStorage[state.origin]) {
      const colsSchemaLS = colsFromStorage[state.origin]
      colsSchema.activeSchema = colsSchemaLS.activeSchema
      colsSchema.schemas = { ...colsSchema.schemas, ...colsSchemaLS.schemas, ...customColsSchemas }
    }
    commit('setCols', colsSchema)
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
      namespace = deletedStatus
        ? Vue.connector.http.platform.deleted
        : parts.reduce((result, part) => {
          return result[part]
        }, Vue.connector.http)
    if (id === '*') {
      return function (params) {
        return namespace.logs.get({ data: JSON.stringify(params.data) }, { headers: params.headers })
      }
    } else if (deletedStatus) {
      return function (params) {
        return namespace.logs.get(encodeURIComponent(`origin=${origin}`), { data: JSON.stringify(params.data) }, { headers: params.headers })
      }
    } else {
      return function (params) {
        return namespace.logs.get(id, { data: JSON.stringify(params.data) }, { headers: params.headers })
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
      const start = Date.now() / 1000
      const params = getParams(state)
      let messagesCount = 0
      const messages = await getLogs({ state, commit, rootState }, params)
      messagesCount += messages.length
      const now = Date.now() / 1000
      const needRT = (params.to >= now && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        const stop = Date.now() / 1000
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
      const to = _get(state, 'messages[0].timestamp', state.to) - 0.000001
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
      const from = _get(state, `messages[${state.messages.length - 1}].timestamp`, state.from) + 0.000001
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
        params.from = start / 1000
        params.to = stop / 1000
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
    const filter = state.filter ? `$filter/payload=${encodeURIComponent(state.filter)}${state.cid ? `&cid=${state.cid}` : ''}` : undefined
    await Vue.connector.subscribeLogs(api, origin, '#', (message) => {
      messagesBuffer.push(JSON.parse(message))
    }, { rh: 2, prefix: filter })
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
        const { start, end, lastMessageIndex } = state.offline
        const params = {
          data: {
            from: start,
            to: end
          },
          headers: getHeaders(state)
        }
        if (state.filter) { params.data.filter = state.filter }
        const resp = await getLogsEntries(state.origin, state.isItemDeleted)(params)
        const data = resp.data
        errorsCheck(data)
        commit('setMissingMessages', { data: data.result, index: lastMessageIndex })
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
    const filter = state.filter ? `$filter/payload=${encodeURIComponent(state.filter)}${state.cid ? `&cid=${state.cid}` : ''}` : undefined
    await Vue.connector.unsubscribeLogs(api, origin, '#', undefined, { prefix: filter })
    state.realtimeEnabled = false
  }

  async function newMessagesCheck ({ state }) {
    const api = state.origin.split('/')[0].replace(/\*/g, '+'),
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
    let properties = {}
    if (state.cid) {
      properties = { userProperties: { cid: state.cid } }
    }
    state.hasNewMessages = false
    await Vue.connector.subscribeLogs(api, origin, '#', () => {
      state.hasNewMessages = true
      unsubscribePooling({ state })
    }, { rh: 2, properties })
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
