export default function (Vue) {
    function getParams (state) {
        let params = {}
        if (state.limit) { params.limit_count = state.limit }
        if (state.from) { params.curr_key = state.from }
        if (state.mode === 1) { params.timeout = 20 }
        return params
    }

    async function getCols ({ state, commit, rootState }) {
        commit('reqStart')
        if (rootState.token && state.active) {
            try {
                if (typeof rootState.isLoading !== 'undefined') {
                    rootState.isLoading = true
                }
                let protocolIdResp = await Vue.http.get(`${rootState.server}/gw/channels/${state.active}`, {
                    params: {fields: 'protocol_id'}
                })
                let protocolIdData = await protocolIdResp.json()
                if (protocolIdData.result && protocolIdData.result.length && protocolIdData.result[0].protocol_id) {
                    let colsResp = await Vue.http.get(`${rootState.server}/gw/protocols/${protocolIdData.result[0].protocol_id}`, {
                        params: {fields: 'message_parameters'}
                    })
                    let colsData = await colsResp.json()
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
                let resp = await Vue.http.get(`${rootState.server}/gw/channels/${state.active}/messages`, {
                    params: {data: JSON.stringify(getParams(state))}
                })
                data = await resp.json()
            }
            catch (e) { console.log(e) }
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
            if (data.result.length) { commit('setFrom', data.next_key) }
            else { commit('setFrom', data.last_key) }
        }
        if (typeof rootState.isLoading !== 'undefined') {
            rootState.isLoading = false
        }
    }

    async function pollingGet ({ state, commit, rootState }) {
        commit('reqStart')
        let data = await getData({ state, commit, rootState })
        if (data.errors && data.errors.length) {
            setTimeout(() => {
                pollingGet({ state, commit, rootState })
            }, 4000)
            return false
        }
        if (data.result) {
            commit('setMessages', data.result)
            if (data.result.length) { commit('setFrom', data.next_key) }
            else { commit('setFrom', data.last_key) }
        }
        if (state.mode === 1) { pollingGet({ state, commit, rootState }) }
    }

    return {
        get,
        pollingGet,
        getCols
    }

}