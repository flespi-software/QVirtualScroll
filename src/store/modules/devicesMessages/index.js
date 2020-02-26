import getActions from './actions'
import getMutations from './mutations'

export default function ({ Vue, LocalStorage, name, errorHandler, filterHandler, newMessagesInterseptor }) {
  const actions = getActions({ Vue, LocalStorage, errorHandler }),
    mutations = getMutations({ Vue, LocalStorage, filterHandler, newMessagesInterseptor })

  const state = {
    name: name,
    isLoading: false,
    active: 0,
    messages: [],
    pages: [],
    filter: '',
    settings: {},
    realtimeEnabled: false,
    from: 0,
    to: 0,
    limit: 1000,
    reverse: false,
    cols: [],
    defaultColsNames: ['timestamp', 'server.timestamp', 'ident', 'position.latitude', 'position.longitude', 'position.altitude', 'position.speed'],
    offline: false,
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
