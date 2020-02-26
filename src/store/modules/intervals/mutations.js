const defaultCols = ['begin', 'end', 'duration', 'timestamp', 'id']
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

  function setCols (state, counters) {
    let cols = [
      {
        name: 'begin',
        title: 'begin',
        width: 170,
        display: true,
        description: 'Begin of interval'
      },
      {
        name: 'end',
        width: 170,
        display: true,
        description: 'End of interval'
      },
      {
        name: 'duration',
        width: 85,
        display: true,
        description: 'Duration of interval'
      },
      {
        name: 'timestamp',
        width: 170,
        display: true,
        description: 'Interval timestamp'
      },
      {
        name: 'id',
        width: 50,
        display: true,
        description: 'ID of interval'
      }
    ]
    const actionsCol = counters.shift()
    const etcCol = counters.pop()
    const colsFromCounters = counters.map(counter => {
      counter.width = 100
      counter.display = true
      counter.description = `${counter.name}[${counter.type}]`
      return counter
    })
    cols = [actionsCol, ...cols, ...colsFromCounters, etcCol]
    let colsFromStorage = LocalStorage.getItem(state.name)
    if (!colsFromStorage) {
      colsFromStorage = {}
    }
    colsFromStorage[state.active] = cols
    LocalStorage.set(state.name, colsFromStorage)
    Vue.set(state, 'cols', cols)
  }

  function updateCols (state, cols) {
    let colsFromStorage = LocalStorage.getItem(state.name)
    if (!colsFromStorage) {
      colsFromStorage = {}
    }
    colsFromStorage[state.active] = cols
    LocalStorage.set(state.name, colsFromStorage)
    Vue.set(state, 'cols', cols)
  }

  function setDefaultCols (state) {
    state.cols.forEach((col, index) => {
      if (col.__dest) { return }
      if (defaultCols.includes(col.name)) {
        Vue.set(state.cols[index], 'display', true)
      } else {
        Vue.set(state.cols[index], 'display', false)
      }
    })
    updateCols(state, state.cols)
  }

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
    updateCols,
    setDefaultCols,
    setSelected,
    clearSelected,
    setSortBy,
    clearSortBy,
    setActiveDevice
  }
}
