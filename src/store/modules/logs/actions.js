export default function (Vue) {
    function getParams (state) {
        let params = {}
        if (state.limit) { params.count = state.limit }
        if (state.filter && state.sysFilter) {
            if (state.mode === 1) {
                params.filter += `,${state.sysFilter}`
            }
            else {
                params.filter += `,${state.sysFilter},${state.filter}`
            }
        }
        else if (state.sysFilter && !state.filter) { params.filter += `,${state.sysFilter}`}
        else if (!state.sysFilter && state.filter) {
            if (state.mode === 0) {
                params.filter += `,${state.filter}`
            }
        }
        if (state.from && (!state.reverse || state.mode === 1)) {
            if (!state.reverse) {
                params.from = Math.floor(state.from / 1000)
            }
        }
        if (state.to) {
            if (state.mode === 1) {
                state.to = Date.now()
            }
            params.to = Math.floor(state.to / 1000)
        }
        if (state.reverse) { params.reverse = state.reverse }
        return params
    }

    function getCols ({ state, commit, rootState }) {
        commit('setCols')
    }

    function getLogs (origin) {
        let parts = origin.split('/'),
            id = parts.pop(),
            namespace = parts.reduce((result, part) => {
                return result[part]
            }, Vue.connector.http)
        if (id !== '*') {
            return function (params) {
                return namespace.logs.get(id, {data: JSON.stringify(params)})
            }
        } else {
            return function (params) {
                return namespace.logs.get({data: JSON.stringify(params)})
            }
        }
    }

    async function initTime({ state, commit, rootState }) {
        if (rootState.token && state.origin) {
            try {
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = true
                }
                let params = {
                   filter: `event_origin=${state.origin}`,
                   reverse: true,
                   count: 1,
                   fields: 'timestamp'
                }
                let resp = await getLogs(state.origin)(params)
                let data = resp.data
                if (data.result.length) {
                    commit('setDate', Math.round(data.result[0].timestamp * 1000))
                }
                else {
                    commit('setDate', Date.now())
                }
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
            catch (e) {
                console.log(e)
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
        }
    }

    async function get ({ state, commit, rootState }, preaction) {
        commit('reqStart')
        if (preaction) {
            let { name: preactionName, payload: preactionPayload } = preaction
            commit('clearMessages')
            commit(preactionName, preactionPayload)
        }
        if (rootState.token && state.origin) {
            try {
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = true
                }
                let resp = await getLogs(state.origin)(getParams(state))
                let data = resp.data
                if (preaction) {
                    if (data.result.length) {
                        commit('setMessages', data.result)
                        commit('postaction')
                    }
                    else {
                        commit('postaction')
                        switch (preaction.name) { // logic for empty response after pagination scroll
                            case 'paginationPrev': {
                                commit('datePrev')
                                commit('paginationPrev')
                                await get({ state, commit, rootState })
                                commit('postaction')
                                break
                            }
                            case 'paginationNext': {
                                get({ state, commit, rootState }, { name: 'dateNext' })
                                commit('postaction')
                                break
                            }
                            default: {
                                commit('setMessages', data.result)
                                commit('postaction')
                            }
                        }
                    }
                }
                else {
                    commit('setMessages', data.result)
                }
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
            catch (e) {
                console.log(e)
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
        }
    }

    async function getHistory({ state, commit, rootState }, count) {
        let limit = state.limit
        commit('setReverse', true)
        commit('setLimit', count)
        await get({ state, commit, rootState })
        commit('setReverse', false)
        commit('setLimit', limit)
    }

    async function pollingGet ({ state, commit, rootState }) {
        let api = state.origin.split('/')[0],
            origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')

        await Vue.connector.subscribeLogs(api, origin, '#', (message) => {
            if (state.mode === 1) { commit('setMessages', [JSON.parse(message)]) }
            else { commit('setNewMessagesCount', state.newMessagesCount + 1) }
        })
    }

    /* getting missed messages after offline */
    async function getMissedMessages ({ state, commit, rootState }) {
        if (rootState.token && state.origin) {
            try {
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = true
                }
                let lastIndexOffline = state.messages.reduceRight((result, value, index) => {
                    if (result) { return result }
                    if (value.__connectionStatus === 'offline') { result = index }
                    return result
                },0)
                let params = {
                    filter: `event_origin=${state.origin}`,
                    from: Math.floor(state.messages[lastIndexOffline - 1].timestamp) + 1,
                    to: Math.floor(state.messages[lastIndexOffline + 1].timestamp / 1000)
                }
                let resp = await getLogs(state.origin)(params)
                let data = resp.data
                commit('setMissingMessages', {data: data.result, index: lastIndexOffline})
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
            catch (e) {
                console.log(e)
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = false
                }
            }
        }
    }

    /* unsubscribe from current active topic */
    async function unsubscribePooling ({ state }) {
        let api = state.origin.split('/')[0],
            origin = state.origin.replace(`${api}/`, '').replace(/\*/g, '+')
        await Vue.connector.unsubscribeLogs(api, origin, '#')
    }

    return {
        get,
        pollingGet,
        getHistory,
        initTime,
        getCols,
        unsubscribePooling,
        getMissedMessages
    }
}