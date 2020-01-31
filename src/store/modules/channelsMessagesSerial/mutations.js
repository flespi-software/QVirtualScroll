export default function ({ Vue, LocalStorage, filterHandler, newMessagesInterseptor }) {
  function getFromTo (val) {
    let now = val || Date.now(),
      from = new Date(now).setHours(0, 0, 0, 0),
      to = from + 86400000
    return { from, to }
  }

  function setRTMessages (state, data) {
    if (data && data.length) {
      if (state.reverse) {
        data.reverse()
        data[data.length - 1].delimiter = true
      }
      Vue.set(state, 'from', Math.floor((data[data.length - 1].timestamp + 1) * 1000))
      if (state.filter && filterHandler) {
        data = filterHandler(state.filter, data)
      }
      let messages = state.messages
      if (state.sortBy) {
        if (data.length > 1) {
          /* write history for rt mode */
          messages = messages.concat(data)
        } else {
          /* write by sorted field */
          let message = data[0],
            fieldName = state.sortBy,
            length = state.messages.length - 1,
            index = null,
            escapeFlag = true
          if (length > 0) {
            for (let i = length; i !== 0 || escapeFlag; i--) {
              if (messages[i][fieldName] > message[fieldName]) {
                index = i
                if (i === 0) {
                  escapeFlag = false
                }
              } else {
                escapeFlag = false
              }
            }
          }
          if (index) {
            messages.splice(index, 0, message)
          } else {
            messages.push(message)
          }
        }
      } else {
        messages = messages.concat(data)
      }
      newMessagesInterseptor && newMessagesInterseptor(data)
      if (state.limit && messages.length >= state.limit + (state.limit * 0.1)) { // rt limiting
        let count = (messages.length - 1) - (state.limit - 1)
        messages = messages.slice(count)
        Vue.set(state, 'selected', state.selected.map((index) => index - count))
      }
      Vue.set(state, 'messages', messages)
    } else {
      Vue.set(state, 'from', state.to + 1000)
    }
  }

  function prependMessages (state, data) {
    if (data && data.length) {
      data.reverse()
      let messages = state.messages
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages.splice(0, 0, ...data)
      if (state.limit && (state.limit * 3) < messages.length) {
        let limit = state.limit * 3 // 3 pages in memory
        let overCount = messages.length - limit
        messages.splice(messages.length - overCount, overCount)
      }
    }
  }

  function appendMessages (state, data) {
    if (data && data.length) {
      let messages = state.messages
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages.splice(messages.length, 0, ...data)
      if (state.limit && (state.limit * 3) < messages.length) {
        let limit = state.limit * 3 // 3 pages in memory
        messages.splice(0, messages.length - limit)
      }
    }
  }

  function setHistoryMessages (state, data) {
    if (data && data.length) {
      if (state.reverse) {
        data.reverse()
      }
      let messages = state.messages
      messages = messages.concat(data)
      newMessagesInterseptor && newMessagesInterseptor(data)
      Vue.set(state, 'messages', messages)
    } else {
      Vue.set(state, 'messages', [])
    }
  }

  function setMessages (state, data) {
    if (state.mode === 1) {
      setRTMessages(state, data)
    } else {
      setHistoryMessages(state, data)
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
      if (state.mode === 1) {
        if (state.filter) {
          state.messages.push({ 'x-flespi-filter-prev': state.filter })
        }
        if (value) {
          state.messages.push({ 'x-flespi-filter-next': value })
        }
      }
      Vue.set(state, 'filter', value)
    }
  }

  function setMode (state, mode) {
    switch (mode) {
      case 0: {
        let timeObj = state.from ? getFromTo(state.from) : getFromTo()
        state.from = timeObj.from
        state.to = timeObj.to
        clearMessages(state)
        break
      }
      case 1: {
        let now = Date.now() - 4000
        state.from = now - 1000
        state.to = now
        break
      }
    }
    Vue.set(state, 'mode', mode)
  }

  function setFrom (state, from) {
    Vue.set(state, 'from', from)
  }

  function setTo (state, to) {
    Vue.set(state, 'to', to)
  }

  function reqStart () {
    if (DEV) {
      console.log('Start Request Channels messages')
    }
  }

  function setActive (state, id) {
    Vue.set(state, 'active', id)
  }

  function setReverse (state, val) {
    Vue.set(state, 'reverse', val)
  }

  async function clear (state) {
    clearMessages(state)
    state.filter = ''
    state.mode = null
    state.from = 0
    state.to = 0
    state.limit = 1000
    state.reverse = false
    await Vue.connector.unsubscribeMessagesChannels(state.active)
  }

  function setCols (state, cols) {
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
      if (state.defaultColsNames.includes(col.name)) {
        Vue.set(state.cols[index], 'display', true)
      } else {
        Vue.set(state.cols[index], 'display', false)
      }
    })
    updateCols(state, state.cols)
  }

  function setSettings (state, channel) {
    Vue.set(state, 'settings', channel)
  }

  let updateCols = setCols

  function setOffline (state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      setMessages(state, [{ __connectionStatus: 'offline', timestamp: Date.now() / 1000 }])
    }
    state.offline = true
  }

  function setReconnected (state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      setMessages(state, [{ __connectionStatus: 'reconnected', timestamp: Date.now() / 1000 }])
    }
    state.offline = false
  }

  function setMissingMessages (state, { data, index }) {
    data.forEach((val) => {
      val.__status = 'missed'
    })
    state.messages.splice(index + 1, 0, ...data)
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

  return {
    setOffline,
    setReconnected,
    setMissingMessages,
    setMessages,
    prependMessages,
    appendMessages,
    clearMessages,
    setLimit,
    setFilter,
    setMode,
    setFrom,
    setTo,
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
    setSettings
  }
}
