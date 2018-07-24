export default function ({Vue, LocalStorage, filterHandler}) {
  function getFromTo(val) {
    let now = val || Date.now(),
      from = new Date(now).setHours(0, 0, 0, 0),
      to = from + 86400000
    return {from, to}
  }

  function setMessages(state, data) {
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
      let messages = state.messages
      if (state.sortBy && state.mode === 1) {
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
      if (state.limit && state.mode === 1 && messages.length >= state.limit + (state.limit * 0.1)) { // rt limiting
        let count = (messages.length - 1) - (state.limit - 1)
        messages = messages.slice(count)
        Vue.set(state, 'selected', state.selected - count)
      }
      Vue.set(state, 'messages', messages)
    }
    else {
      if (state.mode === 1) {
        Vue.set(state, 'from', state.to + 1000)
      }
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

  function setTo(state, to) {
    Vue.set(state, 'to', to)
  }

  function reqStart() {
    if (DEV) {
      console.log('Start Request Devices messages')
    }
  }

  function setActive(state, id) {
    state.newMessagesCount = 0
    Vue.set(state, 'active', id)
  }

  function setReverse(state, val) {
    Vue.set(state, 'reverse', val)
  }

  function setDate(state, date) {
    let timeObj = getFromTo(date)
    state.from = timeObj.from
    state.to = timeObj.to
  }

  function dateNext(state) {
    let timeObj = getFromTo(state.from + 86400000)
    state.from = timeObj.from
    state.to = timeObj.to
  }

  function datePrev(state) {
    let timeObj = getFromTo(state.from - 86400000)
    state.from = timeObj.from
    state.to = timeObj.to
  }

  function paginationPrev(state, firstTimestamp) {
    state.reverse = true
    state.sysFilter += `timestamp>=${state.from / 1000}`
    if (firstTimestamp) {
      state.from = getFromTo(firstTimestamp).from
      state.to = firstTimestamp - 1000
    }
  }

  function paginationNext(state, lastTimestamp) {
    state.sysFilter += `timestamp<=${state.to / 1000}`
    if (lastTimestamp) {
      state.to = getFromTo(lastTimestamp).to
      state.from = lastTimestamp + 1000
    }
  }

  function postaction(state) {
    let timeObj = getFromTo(state.from)
    setFrom(state, timeObj.from)
    setTo(state, timeObj.to)
    if (state.reverse) {
      setReverse(state, false)
    }
    state.sysFilter = ''
  }

  async function clear(state) {
    clearMessages(state)
    state.filter = ''
    state.mode = null
    state.from = 0
    state.to = 0
    state.limit = 1000
    state.reverse = false
    await Vue.connector.unsubscribeMessagesDevices(state.active)
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
      setMessages(state, [{__connectionStatus: 'offline', timestamp: Date.now() / 1000}])
    }
    state.offline = true
  }

  function setReconnected(state, needPostOfflineMessage) {
    if (needPostOfflineMessage) {
      setMessages(state, [{__connectionStatus: 'reconnected', timestamp: Date.now() / 1000}])
    }
    state.offline = false
  }

  function setMissingMessages(state, {data, index}) {
    data.forEach((val) => {
      val.__status = 'missed'
    })
    state.messages.splice(index + 1, 0, ...data)
  }

  function setSelected(state, index) {
    Vue.set(state, 'selected', index)
  }

  function clearSelected(state) {
    Vue.set(state, 'selected', null)
  }

  function setSortBy(state, field) {
    Vue.set(state, 'sortBy', field)
  }

  function clearSortBy(state) {
    Vue.set(state, 'sortBy', null)
  }

  return {
    setOffline,
    setReconnected,
    setMissingMessages,
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
    setActive,
    setCols,
    updateCols,
    setNewMessagesCount,
    setSelected,
    clearSelected,
    setSortBy,
    clearSortBy
  }

}
