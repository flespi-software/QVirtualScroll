export default function (Vue, LocalStorage) {
    function getFromTo (val) {
        let now = val || Date.now(),
            from = now - (now % 86400000),
            to = from + 86400000
        return {from, to}
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
            }
            let messages = [...state.messages, ...data]
            if (state.limit && state.mode === 1 && messages.length >= state.limit) { // rt limiting
                messages = messages.slice((messages.length -1) - (state.limit - 1))
            }
            Vue.set(state, 'messages', messages)
        }
        else {
            if (state.mode === 1) {
                Vue.set(state, 'from', state.to + 1000)
            }
        }
    }

    function clearMessages (state) {
        Vue.set(state, 'messages', [])
    }

    function setLimit (state, count) {
        Vue.set(state, 'limit', count)
    }

    function setFilter (state, value) {
        if (state.filter !== value) {
            Vue.set(state, 'filter', value)
        }
    }

    function setMode (state, mode) {
        switch (mode) {
            case 0: {
                let timeObj = state.from ? getFromTo(state.from) : getFromTo()
                state.from = timeObj.from
                state.to = timeObj.to
                state.messages = []
                break
            }
            case 1: {
                let now = Date.now() - 4000
                state.from = now - 1000
                state.to = now
                state.messages = []
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
            console.log('Start Request Devices messages')
        }
    }

    function setActive (state, id) {
        Vue.set(state, 'active', id)
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
        state.sysFilter += `timestamp>=${state.from / 1000}`
        if (firstTimestamp) {
            state.from = getFromTo(firstTimestamp).from
            state.to = firstTimestamp - 1000
        }
    }

    function paginationNext (state, lastTimestamp) {
        state.sysFilter += `timestamp<=${state.to / 1000}`
        if (lastTimestamp) {
            state.to = getFromTo(lastTimestamp).to
            state.from = lastTimestamp + 1000
        }
    }

    function postaction (state) {
        let timeObj = getFromTo(state.from)
        setFrom(state, timeObj.from)
        setTo(state, timeObj.to)
        if (state.reverse) { setReverse(state, false) }
        state.sysFilter = ''
    }

    async function clear (state) {
        if (state.mode === 1) {
            await Vue.connector.unsubscribeMessagesDevices(state.active)
        }
        clearMessages(state)
        state.filter = ''
        state.mode = null
        state.from = 0
        state.to = 0
        state.limit = 1000
        state.reverse = false
    }

    function setCols (state, cols) {
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
                        if (newCol) { result.push(newCol) }
                        else { result.push(col) }

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

    function updateCols (state, cols) {
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

    return {
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
        setNewMessagesCount
    }

}