import getActions from './actions'
import getMutations from './mutations'

export default function ({Vue, LocalStorage, name, errorHandler, filterHandler, newMessagesInterseptor}) {
  let actions = getActions({Vue, LocalStorage, errorHandler}),
    mutations = getMutations({Vue, LocalStorage, filterHandler, newMessagesInterseptor})

  const state = {
    name: name,
    isLoading: false,
    active: 0,
    activeDevice: 0,
    messages: {},
    filter: '',
    sysFilter: '',
    begin: Date.now() - 86400000,
    end: Date.now(),
    limit: 1000,
    reverse: false,
    cols: [],
    selected: [],
    sortBy: null
  }

  return {
    namespaced: true,
    state,
    actions,
    mutations
  }
}
