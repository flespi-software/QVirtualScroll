import _get from 'lodash/get'
import { getColsLS, setColsLS } from '../ls'

const defaultCols = ['key', 'etc']
const keyfield = 'key'

export default function ({ Vue, LocalStorage, errorHandler, logger }) {
  function getParams (state) {
    const params = {}
    if (state.limit) {
      params.max_count = state.limit
    }
    if (state.filter) {
      params.filter = `${state.filter}`
    }
    if (state.from) {
      params.left_key = state.from / 1000
    }
    if (state.to) {
      params.right_key = state.to / 1000
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
    const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
    return defaultCols.reduce((res, name) => {
      res[name] = { name }
      if (name.match(/timestamp$/)) {
        res[name].addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
        res[name].type = ''
        res[name].unit = ''
      }
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

  async function getCols ({ state, commit }) {
    let colsFromStorage = getColsLS(LocalStorage, state.lsNamespace, state.name)
    const customColsSchemas = (colsFromStorage && colsFromStorage['custom-cols-schemas'])
      ? colsFromStorage['custom-cols-schemas'] : {}
    colsFromStorage = colsFromStorage[state.active]
    const colsSchema = colsFromStorage || getDefaultColsSchema()
    if (!colsSchema.enum) {
      colsSchema.enum = getDefaultEnum()
    }
    colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
    // const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
    // counters.forEach(counter => {
    //   const name = counter.name
    //   const enumCol = {
    //     name,
    //     description: `${counter.name}[${counter.type}]`
    //   }
    //   const schemaCol = {
    //     name,
    //     width: 100
    //   }
    //   if (name.match(/timestamp$/) || name === 'begin' || name === 'end') {
    //     enumCol.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
    //     enumCol.type = ''
    //     enumCol.unit = ''
    //     schemaCol.width = 190
    //   }
    //   colsSchema.schemas._protocol.cols.push(schemaCol)
    //   colsSchema.enum[name] = enumCol
    // })
    // colsSchema.schemas._protocol.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
    // !colsFromStorage && colsSchema.schemas._default.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
    colsSchema.enum.etc = { name: 'etc', __dest: 'etc' }
    commit('setCols', colsSchema)
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
          max_count: 1,
          fields: keyfield + ''
        }
        const resp = await Vue.connector.storage.getContainersMessages(state.active, { data: JSON.stringify(params) })
        commit('reqStart', { endpoint: 'getContainersMessages-initTime', active: state.active, data: JSON.stringify(params) })
        const data = resp.data
        errorsCheck(commit, data)
        let date = Date.now()
        if (data.result.length) {
          date = Math.round(data.result[0][keyfield] * 1000)
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
        const resp = await Vue.connector.storage.getContainersMessages(state.active, { data: JSON.stringify(params) })
        commit('reqStart', { endpoint: 'getContainersMessages', active: state.active, data: JSON.stringify(params) })
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
      left_key: state.from / 1000,
      right_key: initTimestamp,
      reverse: true,
      max_count: state.limit / 2
    }
    const beforeMessages = await getMessages({ state, commit, rootState }, beforeMessagesParams)
    const afterMessagesParams = {
      left_key: initTimestamp + 0.000001,
      right_key: state.to / 1000,
      max_count: state.limit - beforeMessages.length
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
      const needRT = (params.right_key >= now && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        if (initTimestamp) {
          const stop = (Date.now() + 0.000999) / 1000
          const params = getParams(state)
          params.left_key = start
          params.right_key = stop
          const missedMessages = await getMessages({ state, commit, rootState }, params)
          messagesCount += missedMessages.length
          messages.splice(0, 0, ...missedMessages)
        }
      } else if ((params.right_key < now || (state.limit && messages.length >= state.limit)) && loopId) {
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
      const to = _get(state, 'messages[0].' + keyfield, state.to) - 0.000001
      const params = getParams(state)
      params.right_key = to
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
      const from = _get(state, `messages[${state.messages.length - 1}].${keyfield}`, state.from) + 0.000001
      const params = getParams(state)
      let messagesCount = 0
      params.left_key = from
      const messages = await getMessages({ state, commit, rootState }, params)
      messagesCount += messages.length
      const needRT = (params.right_key > Math.floor(Date.now() / 1000) && (state.limit && messages.length < state.limit) && !loopId)
      let startRTRender = () => {}
      if (needRT) {
        startRTRender = await pollingGet({ state, commit, rootState })
        const stop = Date.now()
        const params = getParams(state)
        params.left_key = start / 1000
        params.right_key = stop / 1000
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
    const filter = state.filter ? `$filter/payload=${encodeURIComponent(state.filter)}` : undefined
    await Vue.connector.subscribeMessagesDevices(state.active, (message) => {
      messagesBuffer.push(JSON.parse(message))
    }, { rh: 2, prefix: filter })
    state.realtimeEnabled = true
    logger.info(`subscribed to messagesDevices ${state.active} ${filter || ''}`)
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
    await Vue.connector.unsubscribeMessagesDevices(state.active, undefined, { prefix: filter })
    state.realtimeEnabled = false
    logger.info(`unsubscribed to messagesDevices ${state.active} ${filter || ''}`)
  }

  /* getting missed messages after offline */
  async function getMissedMessages ({ state, commit, rootState }) {
    if (rootState.token && state.active) {
      try {
        Vue.set(state, 'isLoading', true)
        const { start, end, lastMessageIndex } = state.offline
        const params = {
          left_key: start,
          right_key: end
        }
        if (state.filter) { params.data.filter = state.filter }
        const resp = await Vue.connector.storage.getContainersMessages(state.active, { data: JSON.stringify(params) })
        commit('reqStart', { endpoint: 'getContainersMessages', active: state.active, data: JSON.stringify(params) })
        const data = resp.data
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
    await Vue.connector.subscribeMessagesDevices(state.active, () => {
      state.hasNewMessages = true
      unsubscribePooling({ state })
    }, { rh: 2 })
    logger.info(`newMessagesCheck subscribed to messagesDevice ${state.active}`)
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
