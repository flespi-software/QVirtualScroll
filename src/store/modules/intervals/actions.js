import _get from 'lodash/get'
import { getColsLS, setColsLS } from '../ls'
const defaultCols = ['begin', 'end', 'duration', 'timestamp', 'id']
export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    const params = {}
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter && state.sysFilter) {
      params.filter = `${state.sysFilter},${state.filter}`
    } else if (state.sysFilter && !state.filter) {
      params.filter = `${state.sysFilter}`
    } else if (!state.sysFilter && state.filter) {
      params.filter = `${state.filter}`
    }
    if (state.begin && !state.reverse) {
      if (!state.reverse) {
        params.begin = Math.floor(state.begin / 1000)
      }
    }
    if (state.end) {
      params.end = Math.floor(state.end / 1000)
    }
    if (state.reverse) {
      params.reverse = state.reverse
    }
    return params
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
        const calcResp = await Vue.connector.gw.getCalcs(active, { fields: 'name' })
        const calcData = calcResp.data
        errorsCheck(calcData)
        let name = _get(calcData, 'result[0].name', `Calc-${active}`)
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

  function getDefaultEnum () {
    const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
    return defaultCols.reduce((res, name) => {
      res[name] = { name }
      if (name.match(/timestamp$/) || name === 'begin' || name === 'end') {
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
        },
        _protocol: {
          name: '_protocol',
          cols: defaultCols.map(name => ({ name, width: 150 }))
        }
      },
      enum: getDefaultEnum()
    }
  }

  async function migrateAll (state, data) {
    for (const name in data) {
      let colsSchema = data[name]
      if (Array.isArray(colsSchema)) {
        colsSchema = await migrateCols(state.active, colsSchema)
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

  async function getCols ({ state, commit }, counters) {
    let colsFromStorage = getColsLS(LocalStorage, state.lsNamespace, state.name)
    migrateAll(colsFromStorage)
    colsFromStorage = colsFromStorage[state.active]
    const colsSchema = colsFromStorage || getDefaultColsSchema()
    const customColsSchemas = (colsFromStorage && colsFromStorage['custom-cols-schemas'])
      ? colsFromStorage['custom-cols-schemas'] : {}
    if (!colsSchema.enum) {
      colsSchema.enum = getDefaultEnum()
    }
    colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
    const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
    counters.forEach(counter => {
      const name = counter.name
      const enumCol = {
        name,
        description: `${counter.name}[${counter.type}]`
      }
      const schemaCol = {
        name,
        width: 100
      }
      if (name.match(/timestamp$/) || name === 'begin' || name === 'end') {
        enumCol.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
        enumCol.type = ''
        enumCol.unit = ''
        schemaCol.width = 190
      }
      colsSchema.schemas._protocol.cols.push(schemaCol)
      colsSchema.enum[name] = enumCol
    })
    colsSchema.schemas._protocol.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
    !colsFromStorage && colsSchema.schemas._default.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
    colsSchema.enum.etc = { name: 'etc', __dest: 'etc' }
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

  async function initTime ({ state, commit, rootState }) {
    if (rootState.token && state.active && state.activeDevice) {
      try {
        Vue.set(state, 'isLoading', true)
        const params = {
          reverse: true,
          count: 1,
          fields: 'end,begin'
        }
        const resp = await Vue.connector.gw.getCalcsDevicesIntervals(state.active, state.activeDevice, 'all', { data: JSON.stringify(params) })
        const data = resp.data
        errorsCheck(data)
        let dateBegin = Date.now(),
          dateEnd = Date.now()
        if (data.result.length) {
          dateBegin = Math.round(data.result[0].begin * 1000)
          dateEnd = Math.round(data.result[0].end * 1000)
        }
        dateBegin = new Date(dateBegin)
        dateBegin.setHours(0, 0, 0, 0)
        dateEnd = new Date(dateEnd)
        dateEnd.setHours(23, 59, 59, 999)
        commit('setBegin', dateBegin.valueOf())
        commit('setEnd', dateEnd.valueOf())
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function getMessages ({ state, commit, rootState }, params) {
    let messages = []
    commit('reqStart')
    if (rootState.token && state.active && state.activeDevice) {
      try {
        Vue.set(state, 'isLoading', true)
        const resp = await Vue.connector.gw.getCalcsDevicesIntervals(state.active, state.activeDevice, 'all', { data: JSON.stringify(params) })
        const data = resp.data
        errorsCheck(data)
        messages = data.result
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
    return messages
  }

  async function get ({ state, commit, rootState }) {
    const messages = await getMessages({ state, commit, rootState }, getParams(state))
    commit('setMessages', messages)
  }

  const messageProcessing = (state, packet) => {
    const message = JSON.parse(packet.payload)
    const topic = packet.topic
    const event = topic.split('/').slice(-1)[0]
    switch (event) {
      case 'created': {
        const begin = state.begin,
          end = state.end,
          endDate = new Date(end),
          intervalBegin = message.begin * 1000,
          intervalEnd = message.end * 1000,
          nowDate = new Date(),
          isCurrentEndInTodayRange = endDate.getDate() === nowDate.getDate() && endDate.getMonth() === nowDate.getMonth() && endDate.getFullYear() === nowDate.getFullYear()
        if ((intervalBegin <= end && intervalEnd >= begin) || isCurrentEndInTodayRange) {
          Vue.set(state.messages, message.id, message)
        }
        break
      }
      case 'updated': {
        if (state.messages[message.id]) {
          Vue.set(state.messages, message.id, message)
        }
        break
      }
      case 'finished': {
        if (state.messages[message.id]) {
          Vue.set(state.messages, message.id, message)
        }
        break
      }
      case 'deleted': {
        if (state.messages[message.id]) {
          Vue.delete(state.messages, message.id)
        }
        break
      }
    }
  }

  let messagesBuffer = [],
    intervalId = 0
  function initRenderLoop (state) {
    return setInterval(() => {
      if (messagesBuffer.length) {
        messagesBuffer.forEach(message => messageProcessing(state, message))
        messagesBuffer = []
      }
    }, 500)
  }
  async function pollingGet ({ state, commit }) {
    intervalId = initRenderLoop(state)
    await Vue.connector.subscribeIntervals(state.active, state.activeDevice, '+', (message, topic, packet) => {
      messagesBuffer.push(packet)
    }, { rh: 2 })
  }

  /* unsubscribe from current active topic */
  async function unsubscribePooling ({ state }) {
    if (intervalId) { clearInterval(intervalId) }
    await Vue.connector.unsubscribeIntervals(state.active, state.activeDevice, '+')
  }

  return {
    getMessages,
    get,
    pollingGet,
    initTime,
    unsubscribePooling,
    getCols
  }
}
