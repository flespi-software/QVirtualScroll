import { setColsLS } from '../ls'
export default function ({ Vue, LocalStorage, newMessagesInterseptor, logger }) {
  let messagesKeyPointer = 0
  function messagesIndexing (messages) {
    if (!messages.length) { return }
    messages.forEach((message, index) => {
      Object.defineProperty(messages[index], 'x-flespi-message-key', {
        value: messagesKeyPointer++,
        enumerable: false
      })
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
    logger.info(`setRTMessages: length: ${data.length}`)
  }

  function prependMessages (state, data) {
    if (data && data.length) {
      data.reverse()
      const messages = state.messages
      messagesIndexing(data)
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages.splice(0, 0, ...data)
    }
    logger.info(`prependMessages: length: ${data.length}`)
  }

  function appendMessages (state, data) {
    if (data && data.length) {
      const messages = state.messages
      messagesIndexing(data)
      newMessagesInterseptor && newMessagesInterseptor(data)
      messages.splice(messages.length, 0, ...data)
    }
    logger.info(`appendMessages: length: ${data.length}`)
  }

  function setHistoryMessages (state, data) {
    if (state.reverse) {
      data.reverse()
    }
    messagesIndexing(data)
    newMessagesInterseptor && newMessagesInterseptor(data)
    state.messages = data
    logger.info(`setHistoryMessages: length: ${data.length}, reverse:${state.reverse}`)
  }

  function clearMessages (state) {
    state.messages.splice(0, state.messages.length)
    newMessagesInterseptor && newMessagesInterseptor([])
    clearSelected(state)
    logger.info(`clearMessages`)
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
    logger.info(`limiting: ${type} - count: ${count}`)
  }

  function setFilter (state, value) {
    if (state.filter !== value) {
      Vue.set(state, 'filter', value)
    }
    logger.info(`setFilter: ${value}`)
  }

  function setItemtype (state, itemtype) {
    Vue.set(state, 'itemtype', itemtype)
    logger.info(`setItemtype: ${itemtype}`)
  }

  function setFrom (state, from) {
    Vue.set(state, 'from', from)
    logger.info(`setFrom: ${from}`)
  }

  function setTo (state, to) {
    Vue.set(state, 'to', to)
    logger.info(`setTo: ${to}`)
  }

  function reqStart (state, params) {
    logger.info(`reqStart: ${JSON.stringify(params)}`)
  }

  function reqFullfiled () {
    logger.info(`reqFullfiled`)
  }

  function reqError (state, error) {
    logger.info(`reqError: ${JSON.stringify(error)}`)
  }

  function setReverse (state, val) {
    Vue.set(state, 'reverse', val)
    logger.info(`setReverse: ${val}`)
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
    logger.info(`clear module`)
    logger.info(`unsubscribeLogs ${api} ${origin}`)
  }

  function setOrigin (state, origin) {
    Vue.set(state, 'origin', origin)
    logger.info(`setOrigin: ${origin}`)
  }

  function setCols (state, cols) {
    setColsLS(LocalStorage, state.lsNamespace, state.name, state.origin, cols)
    Vue.set(state, 'cols', cols)
  }

  const updateCols = setCols

  function setOffline (state) {
    state.offline = {
      start: Date.now() / 1000,
      lastMessageIndex: state.messages.length - 1
    }
    logger.info(`setOffline`)
  }

  function setReconnected (state) {
    state.offline.end = Date.now() / 1000
    logger.info(`setReconnected`)
  }

  function clearOfflineState (state) {
    state.offline = false
  }

  function setMissingMessages (state, { data, index }) {
    state.messages.splice(index + 1, 0, ...data)
    logger.info(`setMissingMessages: ${data.length}`)
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
    logger.info(`setCid: ${cid}`)
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
    setItemtype,
    setFrom,
    setTo,
    reqStart,
    reqFullfiled,
    reqError,
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
