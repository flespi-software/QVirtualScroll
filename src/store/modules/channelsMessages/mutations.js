export default function (Vue) {
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
                state.from = 0
                state.messages = []
                state.limit = 1000
                break
            }
            case 1: {
                let now = Date.now()
                state.from = Math.ceil((now - 4000 - 1000) / 1000)
                state.limit = 1000
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

    function clear (state) {
        clearMessages(state)
        state.filter = ''
        state.mode = null
        state.from = 0
        state.limit = 1000
    }

    function setCols (state, cols) {
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
        setCols
    }
}