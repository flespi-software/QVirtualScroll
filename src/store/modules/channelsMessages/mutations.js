export default function (Vue, LocalStorage) {
  function setMessages(state, data) {
    if (data && data.length) {
      if (state.reverse) {
        data.reverse()
      }
      let messages = state.messages.concat(data)
      if (state.limit && state.mode === 1 && messages.length >= state.limit + (state.limit * 0.1)) { // rt limiting
        let count = (messages.length - 1) - (state.limit - 1)
        messages = messages.slice(count)
        Vue.set(state, 'selected', state.selected - count)
      }
      Vue.set(state, 'messages', messages)
    }
  }

  function clearMessages(state) {
    Vue.set(state, 'messages', [])
    clearSelected(state)
  }

  function setLimit(state, count) {
    Vue.set(state, 'limit', count)
  }

  function setFilter(state, value) {
    if (state.filter !== value) {
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
    if (colsFromStorage) {
      if (colsFromStorage[state.active] && colsFromStorage[state.active].length) {
        /* if cols has been added or modified */
        if (cols.length >= colsFromStorage[state.active].length) {
          let newCols = cols.reduce((result, col, index) => {
            let newCol = colsFromStorage[state.active].find(colFromStorage => {
              return colFromStorage.name === col.name
            })
            if (!newCol) {
              result.push(col)
            }
            return result
          }, [])
          colsFromStorage[state.active] = [...colsFromStorage[state.active], ...newCols]
        }
        /* if cols has been removed */
        else {
          colsFromStorage[state.active] = cols.reduce((result, col) => {
            let newCol = colsFromStorage[state.active].find(colFromStorage => {
              return colFromStorage.name === col.name
            })
            if (newCol) {
              result.push(newCol)
            }
            else {
              result.push(col)
            }

            return result
          }, [])
        }
      }
      else {
        colsFromStorage[state.active] = cols
      }
      LocalStorage.set(state.name, colsFromStorage)
      Vue.set(state, 'cols', colsFromStorage[state.active])
    }
    else {
      LocalStorage.set(state.name, {[state.active]: cols})
      Vue.set(state, 'cols', cols)
    }
  }

  function updateCols(state, cols) {
    let colsFromStorage = LocalStorage.get.item(state.name)
    if (colsFromStorage) {
      colsFromStorage[state.active] = cols
      LocalStorage.set(state.name, colsFromStorage)
    }
    Vue.set(state, 'cols', cols)
  }

  function setNewMessagesCount(state, count) {
    Vue.set(state, 'newMessagesCount', count)
  }

  function setOffline(state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      setMessages(state, [{__connectionStatus: 'offline', timestamp: Date.now()}])
    }
    state.offline = true
  }

  function setReconnected(state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      setMessages(state, [{__connectionStatus: 'reconnected', timestamp: Date.now()}])
    }
    state.offline = false
  }

  function setSelected(state, index) {
    Vue.set(state, 'selected', index)
  }

  function clearSelected(state) {
    Vue.set(state, 'selected', null)
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
    clearSelected
  }
}
