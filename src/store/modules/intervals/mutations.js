import get from 'lodash/get'
import set from 'lodash/set'
export default function ({ Vue, LocalStorage, filterHandler, newMessagesInterseptor }) {
  function setMessages (state, data) {
    if (data && data.length) {
      if (state.reverse) {
        data.reverse()
      }
      let messages = state.messages
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages = data.reduce((result, message) => {
        result[message.id] = message
        return result
      }, {})
      Vue.set(state, 'messages', messages)
    } else {
      Vue.set(state, 'messages', [])
    }
  }

  function clearMessages (state) {
    Vue.set(state, 'messages', [])
    newMessagesInterseptor && newMessagesInterseptor([])
    clearSelected(state)
  }

  function setLimit (state, count) {
    Vue.set(state, 'limit', count)
  }

  function setFilter (state, value) {
    if (state.filter !== value) {
      Vue.set(state, 'filter', value)
    }
  }

  function setBegin (state, begin) {
    Vue.set(state, 'begin', begin)
  }

  function setEnd (state, end) {
    Vue.set(state, 'end', end)
  }

  function reqStart () {
    if (DEV) {
      console.log('Start Request intervals messages')
    }
  }

  function setActive (state, id) {
    state.newMessagesCount = 0
    Vue.set(state, 'active', id)
  }

  function setReverse (state, val) {
    Vue.set(state, 'reverse', val)
  }

  async function clear (state) {
    clearMessages(state)
    state.filter = ''
    state.begin = 0
    state.end = 0
    state.limit = 1000
    state.reverse = false
    await Vue.connector.unsubscribeIntervals(state.active)
  }

  function getColsFromLS (state) {
    let colsFromStorage = {}
    if (state.lsNamespace) {
      const lsPath = state.lsNamespace.split('.'),
        lsItemName = lsPath.shift(),
        lsRouteToItem = `${lsPath.join('.')}.${state.name}`,
        appStorage = LocalStorage.getItem(lsItemName)
      colsFromStorage = get(appStorage, lsRouteToItem, colsFromStorage)
    } else {
      colsFromStorage = LocalStorage.getItem(state.name) || colsFromStorage
    }
    return colsFromStorage
  }

  function splitSchemas (cols) {
    const customColsSchema = {
      ...cols.schemas,
      _default: undefined,
      _protocol: undefined
    }
    const defaultColsSchema = {
      activeSchema: cols.activeSchema,
      schemas: {
        _default: cols.schemas._default,
        _protocol: cols.schemas._protocol
      },
      enum: cols.enum
    }
    return { customColsSchema, defaultColsSchema }
  }

  function setColsToLS (state, cols) {
    const colsFromStorage = getColsFromLS(state) || {}
    const { customColsSchema, defaultColsSchema } = splitSchemas(cols)
    colsFromStorage[state.active] = defaultColsSchema
    colsFromStorage['custom-cols-schemas'] = { ...colsFromStorage['custom-cols-schemas'], ...customColsSchema }
    if (state.lsNamespace) {
      const lsPath = state.lsNamespace.split('.'),
        lsItemName = lsPath.shift(),
        lsRouteToItem = `${lsPath.join('.')}.${state.name}`,
        appStorage = LocalStorage.getItem(lsItemName) || {}
      set(appStorage, lsRouteToItem, colsFromStorage)
      LocalStorage.set(lsItemName, appStorage)
    } else {
      LocalStorage.set(state.name, colsFromStorage)
    }
  }

  function setCols (state, cols) {
    setColsToLS(state, cols)
    Vue.set(state, 'cols', cols)
  }

  const updateCols = setCols

  function setSelected (state, indexes) {
    Vue.set(state, 'selected', indexes)
  }

  function clearSelected (state) {
    Vue.set(state, 'selected', [])
  }

  function setSortBy (state, field) {
    Vue.set(state, 'sortBy', field)
  }

  function clearSortBy (state) {
    Vue.set(state, 'sortBy', null)
  }

  function setActiveDevice (state, id) {
    Vue.set(state, 'activeDevice', id)
  }

  return {
    setMessages,
    clearMessages,
    setLimit,
    setFilter,
    setBegin,
    setEnd,
    reqStart,
    setReverse,
    clear,
    setActive,
    setCols,
    setColsToLS,
    updateCols,
    setSelected,
    clearSelected,
    setSortBy,
    clearSortBy,
    setActiveDevice
  }
}
