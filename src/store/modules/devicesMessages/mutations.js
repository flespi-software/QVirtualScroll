import get from 'lodash/get'
import set from 'lodash/set'
export default function ({ Vue, LocalStorage, filterHandler, newMessagesInterseptor }) {
  let messagesKeyPointer = 0
  function messagesIndexing (messages) {
    if (!messages.length) { return }
    messages.forEach((message, index) => {
      messages[index]['x-flespi-message-key'] = messagesKeyPointer++
    })
  }

  function setRTMessages (state, data) {
    if (data && data.length) {
      if (state.filter && filterHandler) {
        data = filterHandler(state.filter, data)
      }
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
      console.log('Start Request Devices messages')
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
    state.from = 0
    state.to = 0
    state.limit = 1000
    state.reverse = false
    await Vue.connector.unsubscribeMessagesDevices(state.active)
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
    colsFromStorage[state.settings.device_type_id] = defaultColsSchema
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

  function setSettings (state, device) {
    Vue.set(state, 'settings', device)
  }

  const updateCols = setCols

  function setOffline (state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      state.messages.push({ __connectionStatus: 'offline', timestamp: Date.now() / 1000 })
    }
    state.offline = true
  }

  function setReconnected (state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      state.messages.push({ __connectionStatus: 'reconnected', timestamp: Date.now() / 1000 })
    }
    state.offline = false
  }

  function setMissingMessages (state, { data, index }) {
    data.forEach((val) => {
      val['x-flespi-status'] = 'missed'
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
    setHistoryMessages,
    setRTMessages,
    prependMessages,
    appendMessages,
    clearMessages,
    setLimit,
    limiting,
    setFilter,
    setFrom,
    setTo,
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
    setSettings
  }
}
