export default function ({ Vue, LocalStorage, filterHandler, newMessagesInterseptor }) {
  function getFromTo (val) {
    let now = val || Date.now(),
      from = new Date(now).setHours(0, 0, 0, 0),
      to = from + 86400000
    return { from, to }
  }

  function setMessages (state, data) {
    if (data && data.length) {
      if (state.reverse) {
        data.reverse()
        if (state.mode === 1) {
          data[data.length - 1].delimiter = true
        }
      }
      if (state.mode === 1) {
        Vue.set(state, 'from', Math.floor((data[data.length - 1].timestamp + 1) * 1000))
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
    } else {
      if (state.mode === 1) {
        Vue.set(state, 'from', state.to + 1000)
      }
      Vue.set(state, 'messages', [])
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
        state.newMessagesCount = 0
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

  function setDate (state, date) {
    let timeObj = getFromTo(date)
    state.from = timeObj.from
    state.to = timeObj.to
  }

  function dateNext (state) {
    let timeObj = getFromTo(state.from + 86400000)
    state.from = timeObj.from
    state.to = timeObj.to
  }

  function datePrev (state) {
    let timeObj = getFromTo(state.from - 86400000)
    state.from = timeObj.from
    state.to = timeObj.to
  }

  function paginationPrev (state, firstTimestamp) {
    state.reverse = true
    setSysFilter(state, `timestamp>=${getFromTo(state.from).from / 1000}`)
    if (firstTimestamp) {
      state.from = getFromTo(firstTimestamp).from
      state.to = firstTimestamp - 1000
    }
  }

  function paginationNext (state, lastTimestamp) {
    setSysFilter(state, `timestamp<=${state.to / 1000}`)
    if (lastTimestamp) {
      state.to = getFromTo(lastTimestamp).to
      state.from = lastTimestamp + 1000
    }
  }

  function postaction (state) {
    let timeObj = getFromTo(state.from)
    setFrom(state, state.from || timeObj.from)
    setTo(state, timeObj.to)
    if (state.reverse) {
      setReverse(state, false)
    }
    let timestampIndex = state.sysFilter.indexOf('timestamp'),
      sliceFromTo = (start, end) => string => `${start ? string.slice(0, start) : ''}${end ? string.slice(end) : ''}`
    if (timestampIndex === 0) {
      let commaIndex = state.sysFilter.indexOf(',', timestampIndex)
      commaIndex !== -1
        ? state.sysFilter = sliceFromTo(0, commaIndex + 1)(state.sysFilter)
        : state.sysFilter = ''
    } else if (timestampIndex > 0) {
      let commaIndex = state.sysFilter.indexOf(',', timestampIndex)
      commaIndex !== -1
        ? state.sysFilter = sliceFromTo(timestampIndex, commaIndex + 1)(state.sysFilter)
        : state.sysFilter = sliceFromTo(timestampIndex - 1)(state.sysFilter)
    }
  }

  function setSysFilter (state, filter) {
    if (state.sysFilter) {
      state.sysFilter += `,${filter}`
    } else {
      state.sysFilter = filter
    }
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
    state.newMessagesCount = 0
    Vue.set(state, 'origin', origin)
  }

  function setCols (state, cols) {
    let colsFromStorage = LocalStorage.get.item(state.name)
    if (!colsFromStorage) {
      colsFromStorage = {}
    }
    colsFromStorage[state.origin] = cols
    LocalStorage.set(state.name, colsFromStorage)
    Vue.set(state, 'cols', cols)
  }

  let updateCols = setCols

  function setNewMessagesCount (state, count) {
    Vue.set(state, 'newMessagesCount', count)
  }

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
    clearMessages,
    setLimit,
    setFilter,
    setMode,
    setFrom,
    setTo,
    reqStart,
    setReverse,
    dateNext,
    datePrev,
    paginationPrev,
    paginationNext,
    setDate,
    postaction,
    clear,
    setOrigin,
    setSysFilter,
    setCols,
    updateCols,
    setNewMessagesCount,
    setMissingMessages,
    setSelected,
    clearSelected,
    setItemDeletedStatus,
    setCid
  }
}
