import getActions from './actions'
import getMutations from './mutations'

export default function (Store, Vue) {
    let actions = getActions(Vue),
        mutations = getMutations(Vue)

    const state = {
        active: 0,
        messages: [],
        filter: '',
        mode: null,
        from: 0,
        limit: 1000,
        cols: []
    }

    return {
        namespaced: true,
        state,
        actions,
        mutations
    }
}
