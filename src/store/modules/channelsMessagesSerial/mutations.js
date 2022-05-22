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
      if (state.sortBy) {
        /* write by sorted field */
        const message = data[0],
          fieldName = state.sortBy,
          length = state.messages.length - 1
        let index = null,
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
        newMessagesInterseptor && newMessagesInterseptor(data)
        if (index) {
          messages.splice(index, 0, ...data)
        } else {
          messages.splice(messages.length, 0, ...data)
        }
      } else {
        newMessagesInterseptor && newMessagesInterseptor(data)
        messages.splice(messages.length, 0, ...data)
      }
      limiting(state, { type: 'rt', count: data.length })
      logger.info(`setRTMessages: length: ${data.length}`)
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

  function setActive (state, id) {
    Vue.set(state, 'active', id)
    logger.info(`setActive: ${id}`)
  }

  function setReverse (state, val) {
    Vue.set(state, 'reverse', val)
    logger.info(`setReverse: ${val}`)
  }

  async function clear (state) {
    clearMessages(state)
    state.filter = ''
    state.from = 0
    state.to = 0
    state.limit = 1000
    state.reverse = false
    await Vue.connector.unsubscribeMessagesChannels(state.active)
    logger.info(`clear module`)
    logger.info(`unsubscribeMessagesChannels ${state.active}`)
  }

  function setCols (state, cols) {
    setColsLS(LocalStorage, state.lsNamespace, state.name, state.active, cols)
    Vue.set(state, 'cols', cols)
  }

  function setSettings (state, channel) {
    Vue.set(state, 'settings', channel)
    logger.info(`setSettings: ${channel}`)
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

  function setSortBy (state, field) {
    Vue.set(state, 'sortBy', field)
  }

  function clearSortBy (state) {
    Vue.set(state, 'sortBy', null)
  }

  return {
    setOffline,
    setReconnected,
    clearOfflineState,
    setHistoryMessages,
    setRTMessages,
    setMissingMessages,
    prependMessages,
    appendMessages,
    clearMessages,
    setLimit,
    limiting,
    setFilter,
    setFrom,
    setTo,
    reqStart,
    reqFullfiled,
    reqError,
    setReverse,
    clear,
    setActive,
    setCols,
    updateCols,
    setSelected,
    clearSelected,
    setSortBy,
    clearSortBy,
    setSettings
  }
}
