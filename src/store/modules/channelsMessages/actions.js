export default function (Vue) {
    function getParams (state) {
        let params = {}
        if (state.limit) { params.limit_count = state.limit }
        if (state.from) { params.curr_key = state.from }
        return params
    }

    async function getCols ({ state, commit, rootState }) {
        commit('reqStart')
        if (rootState.token && state.active) {
            try {
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = true
                }
                let protocolIdResp = await Vue.connector.gw.getChannels(state.active, {fields: 'protocol_id'})
                let protocolIdData = protocolIdResp.data
                if (protocolIdData.result && protocolIdData.result.length && protocolIdData.result[0].protocol_id) {
                    let colsResp = await Vue.connector.gw.getProtocols(protocolIdData.result[0].protocol_id, {fields: 'message_parameters'})
                    let colsData = colsResp.data
                    let cols = []
                    colsData.result[0].message_parameters.forEach(col => {
                        cols.push({
                            name: col.name,
                            width: 160,
                            display: true,
                            description: col.info
                        })
                    })
                    commit('setCols', cols)
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

    async function getData({ state, commit, rootState }) {
        let data = {}
        if (rootState.token && state.active) {
            try {
                let resp = await Vue.connector.gw.getChannelsMessages(state.active, {data: JSON.stringify(getParams(state))})
                data = resp.data
            }
            catch (e) {
                console.log(e)
                data = {
                    errors: [e]
                }
            }
        }
        return data
    }

    async function get ({ state, commit, rootState }) {
        commit('reqStart')
        if (typeof rootState.isLoading !== 'undefined') {
            rootState.isLoading = true
        }
        let data = await getData({ state, commit, rootState })
        if (data.result) {
            commit('setMessages', data.result)
            commit('setFrom', data.next_key)
        }
        if (typeof rootState.isLoading !== 'undefined') {
            rootState.isLoading = false
        }
    }

    async function pollingGet ({ state, commit, rootState }) {
        commit('reqStart')
        let data = await getData({ state, commit, rootState })
        if (data.result) {
            commit('setMessages', data.result)
            commit('setFrom', data.next_key)
        }
        if (state.mode === 1) { await Vue.connector.subscribeMessagesChannels(state.active, '+', (message) => { commit('setMessages', [JSON.parse(message)]) }) }
    }

    /* unsubscribe from current active topic */
    async function unsubscribePooling ({ state }) {
        if (state.mode === 1) { await Vue.connector.unsubscribeMessagesChannels(state.active, '+') }
    }

    return {
        get,
        pollingGet,
        getCols,
        unsubscribePooling
    }

}