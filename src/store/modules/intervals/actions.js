import _get from 'lodash/get'

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
      schema.activeSchema = 'custom preset'
      schema.schemas['custom preset'] = {
        name: 'custom preset',
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
        },
        _protocol: {
          name: '_protocol',
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

  function getCols ({ state, commit }, counters) {
    const colsFromStorage = getColsFromLS(state)
    if (colsFromStorage && colsFromStorage[state.active] && colsFromStorage[state.active].length) {
      let colsSchema = colsFromStorage[state.active]
      const customColsSchemas = (colsFromStorage && colsFromStorage['custom-cols-schemas'])
        ? colsFromStorage['custom-cols-schemas'] : {}
      colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
      if (Array.isArray(colsSchema)) {
        colsSchema = migrateCols(colsSchema)
        commit('setColsToLS', colsSchema)
      }

      /* adding sys cols after migration. 12.11.20 */
      if (_get(colsSchema.enum, 'action.__dest', undefined) === 'action') {
        delete colsSchema.enum.action
      }
      commit('updateCols', colsSchema)
    } else {
      const colsSchema = getDefaultColsSchema()
      counters.forEach(counter => {
        const name = counter.name
        const enumCol = {
          name
        }
        const schemaCol = {
          name,
          width: 100,
          description: `${counter.name}[${counter.type}]`
        }
        colsSchema.schemas._protocol.cols.push(schemaCol)
        colsSchema.enum[name] = enumCol
      })
      colsSchema.schemas._protocol.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
      colsSchema.schemas._default.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
      colsSchema.enum.etc = { name: 'etc', __dest: 'etc' }
      commit('setCols', colsSchema)
    }
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

  async function get ({ state, commit, rootState }) {
    commit('reqStart')
    if (rootState.token && state.active && state.activeDevice) {
      try {
        Vue.set(state, 'isLoading', true)
        const resp = await Vue.connector.gw.getCalcsDevicesIntervals(state.active, state.activeDevice, 'all', { data: JSON.stringify(getParams(state)) })
        const data = resp.data
        errorsCheck(data)
        commit('setMessages', data.result)
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
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
    get,
    pollingGet,
    initTime,
    unsubscribePooling,
    getCols
  }
}
