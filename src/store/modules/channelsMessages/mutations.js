export default function (Vue, LocalStorage) {
    function setMessages (state, data) {
        if (data && data.length) {
            if (state.reverse) {
                data.reverse()
            }
            let messages = [...state.messages, ...data]
            if (state.limit && state.mode === 1 && messages.length >= state.limit) { // rt limiting
                messages = messages.slice((messages.length -1) - (state.limit - 1))
            }
            Vue.set(state, 'messages', messages)
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
                Vue.connector.unsubscribeMessagesChannels(state.active, '+')
                    .then(() => { Vue.connector.mqtt.close(true) })
                state.from = 0
                state.messages = []
                break
            }
            case 1: {
                let now = Date.now()
                state.from = Math.ceil((now - 4000 - 1000) / 1000)
                state.messages = []
                break
            }
        }
        Vue.set(state, 'mode', mode)
    }

    function setFrom (state, from) {
        Vue.set(state, 'from', from)
    }

    function reqStart () {
        if (DEV) {
            console.log('Start Request Channels messages')
        }
    }

    function setActive (state, id) {
        Vue.set(state, 'active', id)
    }

    async function clear (state) {
        if (state.mode === 1) {
            await Vue.connector.unsubscribeMessagesChannels(state.active, '+')
        }
        clearMessages(state)
        state.filter = ''
        state.mode = null
        state.from = 0
        state.limit = 1000
    }

    function setCols (state, cols) {
        let colsFromStorage = LocalStorage.get.item(state.name)
        if (colsFromStorage) {
            if (colsFromStorage[state.active] && colsFromStorage[state.active].length) {
              let newCols = cols.reduce((result, col, index) => {
                let newCol = colsFromStorage[state.active].find(colFromStorage => {
                    return colFromStorage.name === col.name
                })
                if (!newCol) {
                  return result.push(col)
                }
                return result
              }, [])
              colsFromStorage[state.active] = [...colsFromStorage[state.active], ...newCols]
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

    return {
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
        updateCols
    }
}