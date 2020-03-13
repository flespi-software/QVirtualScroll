import getActions from './actions'
import getMutations from './mutations'
import get from 'lodash/get'

export default function ({ Vue, LocalStorage, name, errorHandler, filterHandler, newMessagesInterseptor }) {
  const lsNamespace = get(name, 'lsNamespace', undefined)
  name = get(name, 'name', name)
  const actions = getActions({ Vue, LocalStorage, errorHandler }),
    mutations = getMutations({ Vue, LocalStorage, filterHandler, newMessagesInterseptor })

  const state = {
    name,
    lsNamespace,
    isLoading: false,
    active: 0,
    messages: [],
    filter: '',
    mode: null,
    from: 0,
    to: 0,
    limit: 1000,
    cols: [],
    defaultColsNames: ['timestamp', 'server.timestamp', 'ident', 'position.latitude', 'position.longitude', 'position.altitude', 'position.speed'],
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
