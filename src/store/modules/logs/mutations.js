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
      newMessagesInterseptor && newMessagesInterseptor(data)
      let messages = state.messages.concat(data)
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
    newMessagesInterseptor && newMessagesInterseptor([])
    Vue.set(state, 'messages', [])
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
        let now = Date.now() - 6000
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
      console.log('Start Request Logs')
    }
  }

  function setReverse (state, val) {
    Vue.set(state, 'reverse', val)
  }

  async function clear (state) {
    let api = state.origin.split('/')[0],
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
    clearMessages(state)
    state.filter = ''
    state.mode = null
    state.from = 0
    state.to = 0
    state.limit = 1000
    state.reverse = false
    await Vue.connector.unsubscribeLogs(api, origin, '#')
  }

  function setOrigin (state, origin) {
    Vue.set(state, 'origin', origin)
  }

  function setCols (state, cols) {
    let colsFromStorage = LocalStorage.getItem(state.name)
    if (!colsFromStorage) {
      colsFromStorage = {}
    }
    colsFromStorage[state.origin] = cols
    LocalStorage.set(state.name, colsFromStorage)
    Vue.set(state, 'cols', cols)
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

  function setItemDeletedStatus (state, flag) {
    Vue.set(state, 'isItemDeleted', flag)
  }

  function setCid (state, cid) {
    Vue.set(state, 'cid', cid)
  }

  return {
    setOffline,
    setReconnected,
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
    // dateNext,
    // datePrev,
    // paginationPrev,
    // paginationNext,
    // setDate,
    // postaction,
    clear,
    setOrigin,
    // setSysFilter,
    setCols,
    updateCols,
    // setNewMessagesCount,
    setMissingMessages,
    setSelected,
    clearSelected,
    setItemDeletedStatus,
    setCid
  }
}
