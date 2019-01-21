export default function ({Vue, LocalStorage, filterHandler, newMessagesInterseptor}) {
  function setMessages(state, data) {
    if (data && data.length) {
      if (state.reverse) {
        data.reverse()
      }
      if (state.mode === 1) {
        if (state.filter && filterHandler) {
          data = filterHandler(state.filter, data)
        }
      }
      newMessagesInterseptor && newMessagesInterseptor(data)
      let messages = state.messages.concat(data)
      if (state.limit && state.mode === 1 && messages.length >= state.limit + (state.limit * 0.1)) { // rt limiting
        let count = (messages.length - 1) - (state.limit - 1)
        messages = messages.slice(count)
        Vue.set(state, 'selected', state.selected.map((index) => index - count))
      }
      Vue.set(state, 'messages', messages)
    }
  }

  function clearMessages(state) {
    Vue.set(state, 'messages', [])
    newMessagesInterseptor && newMessagesInterseptor([])
    clearSelected(state)
  }

  function setLimit(state, count) {
    Vue.set(state, 'limit', count)
  }

  function setFilter(state, value) {
    if (state.filter !== value) {
      if (state.mode === 1) {
        if (state.filter) {
          state.messages.push({'x-flespi-filter-prev': state.filter})
        }
        if (value) {
          state.messages.push({'x-flespi-filter-next': value})
        }
      }
      Vue.set(state, 'filter', value)
    }
  }

  function setMode(state, mode) {
    switch (mode) {
      case 0: {
        state.from = 0
        clearMessages(state)
        break
      }
      case 1: {
        let now = Date.now()
        state.from = Math.ceil((now - 4000 - 1000) / 1000)
        clearMessages(state)
        state.newMessagesCount = 0
        Vue.set(state, 'messages', state.rtMessagesBuff)
        clearRtMessagesBuff(state)
        break
      }
    }
    Vue.set(state, 'mode', mode)
  }

  function setFrom(state, from) {
    Vue.set(state, 'from', from)
  }

  function reqStart() {
    if (DEV) {
      console.log('Start Request Channels messages')
    }
  }

  function setActive(state, id) {
    state.newMessagesCount = 0
    Vue.set(state, 'active', id)
  }

  async function clear(state) {
    clearMessages(state)
    state.filter = ''
    state.mode = null
    state.from = 0
    state.limit = 1000
    await Vue.connector.unsubscribeMessagesChannels(state.active, '+')
  }

  function setCols(state, cols) {
    let colsFromStorage = LocalStorage.get.item(state.name)
    if (!colsFromStorage) {
      colsFromStorage = {}
    }
    colsFromStorage[state.active] = cols
    LocalStorage.set(state.name, colsFromStorage)
    Vue.set(state, 'cols', cols)
  }

  let updateCols = setCols

  function setNewMessagesCount(state, count) {
    Vue.set(state, 'newMessagesCount', count)
  }

  function setOffline(state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      setMessages(state, [{__connectionStatus: 'offline', timestamp: Date.now()/ 1000}])
    }
    state.offline = true
  }

  function setReconnected(state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      setMessages(state, [{__connectionStatus: 'reconnected', timestamp: Date.now() / 1000}])
    }
    state.offline = false
  }

  function setSelected(state, indexes) {
    Vue.set(state, 'selected', indexes)
  }

  function clearSelected(state) {
    Vue.set(state, 'selected', [])
  }

  function setRtMessagesBuff (state, message) {
    if (state.rtMessagesBuff.length >= 100) {
      state.rtMessagesBuff.splice(0, 1)
    }
    state.rtMessagesBuff.push(message)
  }

  function clearRtMessagesBuff (state) {
    Vue.set(state, 'rtMessagesBuff', [])
  }

  return {
    setOffline,
    setReconnected,
    setMessages,
    clearMessages,
    setLimit,
    setFilter,
    setMode,
    setFrom,
    reqStart,
    clear,
    setActive,
    setCols,
    updateCols,
    setNewMessagesCount,
    setSelected,
    clearSelected,
    setRtMessagesBuff,
    clearRtMessagesBuff
  }
}
