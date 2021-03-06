import { setColsLS } from '../ls'
export default function ({ Vue, LocalStorage, newMessagesInterseptor }) {
  let messagesKeyPointer = 0
  function messagesIndexing (messages) {
    if (!messages.length) { return }
    messages.forEach((message, index) => {
      messages[index]['x-flespi-message-key'] = messagesKeyPointer++
    })
  }

  function setRTMessages (state, data) {
    if (data && data.length) {
      messagesIndexing(data)
      const messages = state.messages
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages.splice(messages.length, 0, ...data)
      limiting(state, { type: 'rt', count: data.length })
    }
  }

  function prependMessages (state, data) {
    if (data && data.length) {
      data.reverse()
      const messages = state.messages
      messagesIndexing(data)
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages.splice(0, 0, ...data)
    }
  }

  function appendMessages (state, data) {
    if (data && data.length) {
      const messages = state.messages
      messagesIndexing(data)
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages.splice(messages.length, 0, ...data)
    }
  }

  function setHistoryMessages (state, data) {
    if (state.reverse) {
      data.reverse()
    }
    messagesIndexing(data)
    newMessagesInterseptor && newMessagesInterseptor(data)
    state.messages = data
  }

  function clearMessages (state) {
    state.messages.splice(0, state.messages.length)
    newMessagesInterseptor && newMessagesInterseptor([])
    clearSelected(state)
  }

  function setLimit (state, count) {
    Vue.set(state, 'limit', count)
  }

  function limiting (state, { type, count }) {
    if (!state.limit) { return false }
    const messages = state.messages
    const pages = state.pages
    switch (type) {
      case 'init': {
        state.pages = count ? [count] : []
        break
      }
      case 'prev': {
        if (!count) { break }
        const pagesCount = pages.length
        if (pagesCount === 3) {
          const removeMessagesCount = pages[2]
          state.pages = [count, ...pages.slice(0, -1)]
          messages.splice(messages.length - removeMessagesCount, removeMessagesCount)
        } else {
          state.pages = [count, ...pages]
        }
        break
      }
      case 'next': {
        if (!count) { break }
        const pagesCount = pages.length
        if (pagesCount === 3) {
          const removeMessagesCount = pages[0]
          state.pages = [...pages.slice(1, 3), count]
          messages.splice(0, removeMessagesCount)
        } else if (pagesCount < 3) {
          pages.push(count)
        }
        break
      }
      case 'rt_init': {
        pages.push(0)
        break
      }
      case 'rt_deinit': {
        const removeMessagesCount = pages.pop()
        messages.splice(messages.length - removeMessagesCount, removeMessagesCount)
        break
      }
      case 'rt': {
        const pagesCount = pages.length
        const rtCount = pages[pagesCount - 1] || 0
        if (rtCount + count > state.limit) {
          if (pagesCount > 3) {
            const removeMessagesCount = pages[0]
            state.pages = [...pages.slice(1, -1), rtCount + count, 0]
            messages.splice(0, removeMessagesCount)
          } else {
            state.pages = [...pages.slice(0, -1), rtCount + count, 0]
          }
        } else {
          state.pages[pagesCount - 1] = rtCount + count
        }
      }
    }
  }

  function setFilter (state, value) {
    if (state.filter !== value) {
      Vue.set(state, 'filter', value)
    }
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
    const api = state.origin.split('/')[0],
      origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
    clearMessages(state)
    state.filter = ''
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
    setColsLS(LocalStorage, state.lsNamespace, state.name, state.origin, cols)
    Vue.set(state, 'cols', cols)
  }

  const updateCols = setCols

  function setOffline (state) {
    state.offline = {
      start: Math.floor(Date.now() / 1000),
      lastMessageIndex: state.messages.length - 1
    }
  }

  function setReconnected (state) {
    state.offline.end = Math.floor(Date.now() / 1000)
  }

  function clearOfflineState (state) {
    state.offline = false
  }

  function setMissingMessages (state, { data, index }) {
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
    clearOfflineState,
    setHistoryMessages,
    setRTMessages,
    prependMessages,
    appendMessages,
    clearMessages,
    setLimit,
    setFilter,
    limiting,
    setFrom,
    setTo,
    reqStart,
    setReverse,
    clear,
    setOrigin,
    setCols,
    updateCols,
    setMissingMessages,
    setSelected,
    clearSelected,
    setItemDeletedStatus,
    setCid
  }
}
