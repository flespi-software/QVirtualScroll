import getActions from './actions'
import getMutations from './mutations'

export default function ({ Vue, LocalStorage, name, errorHandler, filterHandler, newMessagesInterseptor }) {
  const actions = getActions({ Vue, LocalStorage, errorHandler }),
    mutations = getMutations({ Vue, LocalStorage, filterHandler, newMessagesInterseptor })

  const state = {
    name: name,
    isLoading: false,
    origin: '',
    messages: [],
    pages: [],
    filter: '',
    realtimeEnabled: false,
    from: 0,
    to: 0,
    cid: null,
    limit: 1000,
    reverse: false,
    cols: [],
    offline: false,
    selected: [],
    isItemDeleted: false
  }

  return {
    namespaced: true,
    state,
    actions,
    mutations
  }
}
