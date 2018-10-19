import getActions from './actions'
import getMutations from './mutations'

export default function ({Vue, LocalStorage, name, errorHandler, filterHandler, newMessagesInterseptor}) {
  let actions = getActions({Vue, errorHandler}),
    mutations = getMutations({Vue, LocalStorage, filterHandler, newMessagesInterseptor})

  const state = {
    name: name,
    isLoading: false,
    active: 0,
    messages: [],
    filter: '',
    mode: null,
    from: 0,
    limit: 1000,
    cols: [],
    newMessagesCount: 0,
    offline: false,
    selected: [],
    rtMessagesBuff: []
  }

  return {
    namespaced: true,
    state,
    actions,
    mutations
  }
}
