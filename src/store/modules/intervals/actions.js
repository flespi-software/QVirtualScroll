export default function ({ Vue, LocalStorage, errorHandler }) {
  function getParams (state) {
    let params = {}
    if (state.limit) {
      params.count = state.limit
    }
    if (state.filter && state.sysFilter) {
      params.filter = `${state.sysFilter},${state.filter}`
    } else if (state.sysFilter && !state.filter) {
      params.filter = `${state.sysFilter}`
    } else if (!state.sysFilter && state.filter) {
      params.filter = `${state.filter}`
    }
    if (state.begin && !state.reverse) {
      if (!state.reverse) {
        params.begin = Math.floor(state.begin / 1000)
      }
    }
    if (state.end) {
      params.end = Math.floor(state.end / 1000)
    }
    if (state.reverse) {
      params.reverse = state.reverse
    }
    return params
  }

  function getCols ({ state, commit }, counters) {
    let cols = [],
      colsFromStorage = LocalStorage.getItem(state.name)
    if (colsFromStorage && colsFromStorage[state.active] && colsFromStorage[state.active].length) {
      cols = colsFromStorage[state.active]
      commit('updateCols', cols)
    } else {
      commit('setCols', counters)
    }
  }

  function errorsCheck (data) {
    if (data.errors) {
      data.errors.forEach((error) => {
        let errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    }
  }

  async function initTime ({ state, commit, rootState }) {
    if (rootState.token && state.active && state.activeDevice) {
      try {
        Vue.set(state, 'isLoading', true)
        let params = {
          reverse: true,
          count: 1,
          fields: 'end'
        }
        let resp = await Vue.connector.gw.getCalcsDevicesIntervals(state.active, state.activeDevice, 'all', { data: JSON.stringify(params) })
        let data = resp.data
        errorsCheck(data)
        let date = Date.now()
        if (data.result.length) {
          date = Math.round(data.result[0].end * 1000)
        }
        let dateBegin = new Date(date)
        dateBegin.setHours(0, 0, 0, 0)
        let dateEnd = new Date(date)
        dateEnd.setHours(23, 59, 59, 999)
        commit('setBegin', dateBegin.valueOf())
        commit('setEnd', dateEnd.valueOf())
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  async function get ({ state, commit, rootState }) {
    commit('reqStart')
    if (rootState.token && state.active && state.activeDevice) {
      try {
        Vue.set(state, 'isLoading', true)
        let resp = await Vue.connector.gw.getCalcsDevicesIntervals(state.active, state.activeDevice, 'all', { data: JSON.stringify(getParams(state)) })
        let data = resp.data
        errorsCheck(data)
        commit('setMessages', data.result)
        Vue.set(state, 'isLoading', false)
      } catch (e) {
        errorHandler && errorHandler(e)
        if (DEV) { console.log(e) }
        Vue.set(state, 'isLoading', false)
      }
    }
  }

  let messageProcessing = (state, packet) => {
    let message = JSON.parse(packet.payload)
    let topic = packet.topic
    let event = topic.split('/').slice(-1)[0]
    switch (event) {
      case 'created': {
        let begin = state.begin,
          end = state.end,
          endDate = new Date(end),
          intervalBegin = message.begin * 1000,
          intervalEnd = message.end * 1000,
          nowDate = new Date(),
          isCurrentEndInTodayRange = endDate.getDate() === nowDate.getDate() && endDate.getMonth() === nowDate.getMonth() && endDate.getFullYear() === nowDate.getFullYear()
        if ((intervalBegin <= end && intervalEnd >= begin) || isCurrentEndInTodayRange) {
          Vue.set(state.messages, message.id, message)
        }
        break
      }
      case 'updated': {
        if (state.messages[message.id]) {
          Vue.set(state.messages, message.id, message)
        }
        break
      }
      case 'finished': {
        if (state.messages[message.id]) {
          Vue.set(state.messages, message.id, message)
        }
        break
      }
      case 'deleted': {
        if (state.messages[message.id]) {
          Vue.delete(state.messages, message.id)
        }
        break
      }
    }
  }

  let messagesBuffer = [],
    intervalId = 0
  function initRenderLoop (state) {
    return setInterval(() => {
      if (messagesBuffer.length) {
        messagesBuffer.forEach(message => messageProcessing(state, message))
        messagesBuffer = []
      }
    }, 500)
  }
  async function pollingGet ({ state, commit }) {
    intervalId = initRenderLoop(state)
    await Vue.connector.subscribeIntervals(state.active, state.activeDevice, '+', (message, topic, packet) => {
      messagesBuffer.push(packet)
    }, { rh: 2 })
  }

  /* unsubscribe from current active topic */
  async function unsubscribePooling ({ state }) {
    if (intervalId) { clearInterval(intervalId) }
    await Vue.connector.unsubscribeIntervals(state.active, state.activeDevice, '+')
  }

  return {
    get,
    pollingGet,
    initTime,
    unsubscribePooling,
    getCols
  }
}
