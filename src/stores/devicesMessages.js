import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { useMixins } from '../mixins/mixin'
import { useLS } from '../mixins/ls'
import { shallowRef } from 'vue'

const defaultCols = [
  'timestamp',
  'server.timestamp',
  'ident',
  'position.latitude',
  'position.longitude',
  'position.altitude',
  'position.speed',
]

export const useMessagesStore = (deviceId, lsNamespace, errorHandler) =>
  defineStore(`messages-${deviceId}`, {
    state: () => ({
      cols: undefined, // columns for messages grid (message parameters)
      device: {}, // device json
      filter: '',
      isLoading: false, // some async request is in progress
      limit: 1000,
      loopId: 0,
      offline: false,
      messages: shallowRef([]), // messages of the device
      messagesBuffer: shallowRef([]), // buffer to collect yet unrendered messages for realtime tracking
      pages: [],
      realtimeEnabled: false, // realtime messages pooling enabled flag
      reverse: false,
      selected: [],
      sortBy: null,
      timestampFrom: 0,
      timestampTo: 0,
      mixins: useMixins(`messages-${deviceId}`, deviceId, errorHandler),
    }),
    getters: {
      getColsFromStore: () => {
        return useLS(lsNamespace).getColsFromStore
      },
      setColsToStore: () => {
        return useLS(lsNamespace).setColsToStore
      },
    },
    actions: {
      clearMessages() {
        this.messages.splice(0, this.messages.length)
        this.clearSelected()
      },
      clearSelected() {
        this.selected.splice(0, this.messages.length)
      },
      generateParams() {
        const params = {}
        if (this.limit) {
          params.count = this.limit
        }
        if (this.filter) {
          params.filter = `${this.filter}`
        }
        if (this.timestampFrom) {
          params.from = this.timestampFrom / 1000
        }
        if (this.timestampTo) {
          params.to = this.timestampTo / 1000
        }
        if (this.reverse) {
          params.reverse = this.reverse
        }
        return params
      },
      getDefaultColsSchema() {
        return {
          activeSchema: '_default',
          schemas: {
            _default: {
              name: '_default',
              cols: defaultCols.map((name) => ({ name, width: 150 })),
            },
          },
          enum: this.getDefaultEnum(),
        }
      },
      getDefaultEnum() {
        const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
        return defaultCols.reduce((res, name) => {
          res[name] = { name }
          if (name.match(/timestamp$/)) {
            res[name].addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
            res[name].type = ''
            res[name].unit = ''
          }
          return res
        }, {})
      },
      initRenderLoop() {
        return setInterval(() => {
          if (this.messagesBuffer.length) {
            this.setRealtimeMessages([...this.messagesBuffer])
            this.messagesBuffer = []
          }
        }, 500)
      },
      limiting({ type, count }) {
        if (!this.limit) {
          return false
        }
        const messages = this.messages
        const pages = this.pages
        switch (type) {
          case 'init': {
            this.pages = count ? [count] : []
            break
          }
          case 'prev': {
            if (!count) {
              break
            }
            const pagesCount = pages.length
            if (pagesCount === 3) {
              const removeMessagesCount = pages[2]
              this.pages = [count, ...pages.slice(0, -1)]
              messages.splice(messages.length - removeMessagesCount, removeMessagesCount)
            } else {
              this.pages = [count, ...pages]
            }
            break
          }
          case 'next': {
            if (!count) {
              break
            }
            const pagesCount = pages.length
            if (pagesCount === 3) {
              const removeMessagesCount = pages[0]
              this.pages = [...pages.slice(1, 3), count]
              messages.splice(0, removeMessagesCount)
            } else if (pagesCount < 3) {
              pages.push(count)
            }
            break
          }
          case 'rt_init': {
            pages.push(0)
            break
          }
          case 'rt_deinit': {
            const removeMessagesCount = pages.pop()
            messages.splice(messages.length - removeMessagesCount, removeMessagesCount)
            break
          }
          case 'rt': {
            const pagesCount = pages.length
            const rtCount = pages[pagesCount - 1] || 0
            if (rtCount + count > this.limit) {
              if (pagesCount > 3) {
                const removeMessagesCount = pages[0]
                this.pages = [...pages.slice(1, -1), rtCount + count, 0]
                messages.splice(0, removeMessagesCount)
              } else {
                this.pages = [...pages.slice(0, -1), rtCount + count, 0]
              }
            } else {
              this.pages[pagesCount - 1] = rtCount + count
            }
          }
        }
      },
      messagesIndexing(messages) {
        if (!messages.length) {
          return
        }
        let messageIndex = this.messages.length
        messages.forEach((message) => {
          Object.defineProperty(message, 'x-flespi-message-key', {
            value: messageIndex++,
            enumerable: false,
          })
        })
      },
      setCols(cols) {
        this.setColsToStore(LocalStorage, this.device.device_type_id, cols)
        this.cols = cols
      },
      setDevice(device) {
        this.device = device
      },
      setHistoryMessages(data) {
        if (this.reverse) {
          data.reverse()
        }
        this.messagesIndexing(data)
        this.messages = data
      },
      setLimit(count) {
        this.limit = count
      },
      setMissingMessages({ data, index }) {
        this.messages.splice(index + 1, 0, ...data)
      },
      setOffline() {
        this.offline = {
          start: Date.now() / 1000,
          lastMessageIndex: this.messages.length - 1,
        }
      },
      setRealtimeMessages(data) {
        if (data && data.length) {
          this.messagesIndexing(data)
          const messages = [...this.messages]
          if (this.sortBy) {
            /* write by sorted field */
            const message = data[0],
              fieldName = this.sortBy,
              length = this.messages.length - 1
            let index = null,
              escapeFlag = true
            if (length > 0) {
              for (let i = length; i !== 0 || escapeFlag; i--) {
                if (messages[i][fieldName] > message[fieldName]) {
                  index = i
                  if (i === 0) {
                    escapeFlag = false
                  }
                } else {
                  escapeFlag = false
                }
              }
            }
            if (index) {
              messages.splice(index, 0, ...data)
            } else {
              messages.splice(messages.length, 0, ...data)
            }
          } else {
            messages.splice(messages.length, 0, ...data)
          }
          this.messages = messages
          this.limiting({ type: 'rt', count: data.length })
        }
      },
      setReconnected() {
        this.offline.end = Date.now() / 1000
      },
      setSelected(timestamps) {
        this.selected = timestamps
      },
      setSortBy(field) {
        this.sortBy = field
      },
      setTimestampFrom(from) {
        this.timestampFrom = from
      },
      setTimestampTo(to) {
        this.timestampTo = to
      },
      syncColsFromLS(device_type_id) {
        let colsFromStorage = this.getColsFromStore(LocalStorage)
        if (colsFromStorage && colsFromStorage[device_type_id] && this.cols && this.cols.enum) {
          colsFromStorage[device_type_id].enum = this.cols.enum
          this.setCols(colsFromStorage[device_type_id])
        }
      },
      async clear() {
        this.clearMessages()
        this.filter = ''
        this.timestampFrom = 0
        this.timestampTo = 0
        this.limit = 1000
        this.reverse = false
        if (this.realtimeEnabled) {
          await this.unsubscribePooling()
        } else {
          await this.$connector.unsubscribeMessagesDevices(deviceId)
          console.log('[messages store]: clear: unsubscribeMessagesDevices: ', this.$id, deviceId)
        }
      },
      async get(initTimestamp) {
        if (this.isLoading) {
          return
        }
        this.isLoading = true

        if (this.loopId) {
          await this.unsubscribePooling()
        }
        const start = (Date.now() + 0.000999) / 1000
        let messagesCount = 0
        let messages = []
        const params = this.generateParams()
        if (initTimestamp) {
          messages = await this.getMessagesByInitTimestamp(initTimestamp)
        } else {
          messages = await this.getMessages(params)
        }
        messagesCount += messages.length
        const now = (Date.now() + 0.000999) / 1000
        const needRealtime =
          params.to >= now && this.limit && messages.length < this.limit && !this.loopId
        let startRealtimeRender = () => {}
        if (needRealtime) {
          startRealtimeRender = await this.pollingGet()
          if (initTimestamp) {
            const stop = (Date.now() + 0.000999) / 1000
            const params = this.generateParams()
            params.from = start
            params.to = stop
            const missedMessages = await this.getMessages(params)
            messagesCount += missedMessages.length
            messages.splice(0, 0, ...missedMessages)
          }
        } else if (
          (params.to < now || (this.limit && messages.length >= this.limit)) &&
          this.loopId
        ) {
          await this.unsubscribePooling()
        }
        this.limiting({ type: 'init', count: messagesCount })
        this.setHistoryMessages(messages)
        if (needRealtime || this.realtimeEnabled) {
          startRealtimeRender()
          this.limiting({ type: 'rt_init' })
        }
        this.isLoading = false
      },
      async getCols(sysColsNeedInitFlags) {
        const needEtc = sysColsNeedInitFlags.etc
        try {
          /* getting device info */
          const deviceResp = await this.$connector.gw.getDevices(deviceId)
          const deviceData = deviceResp.data
          this.mixins.errorsCheck(deviceData)
          const device = deviceData.result && deviceData.result[0]
          this.setDevice(device)
          let colsFromStorage = this.getColsFromStore(LocalStorage)
          const customColsSchemas =
            colsFromStorage && colsFromStorage['custom-cols-schemas']
              ? colsFromStorage['custom-cols-schemas']
              : {}
          colsFromStorage = colsFromStorage && colsFromStorage[device.device_type_id]
          const colsSchema = colsFromStorage || this.getDefaultColsSchema()
          colsSchema.schemas = { ...colsSchema.schemas, ...customColsSchemas }
          if (!colsSchema.enum) {
            colsSchema.enum = this.getDefaultEnum()
          }
          if (device.device_type_id) {
            /* getting protocol id */
            const protocolResp = await this.$connector.gw.getChannelProtocolsDeviceTypes(
              'all',
              device.device_type_id,
              { fields: 'protocol_id' },
            )
            this.mixins.requestStart('get channel protocols device types', {
              endpoint: 'getChannelProtocolsDeviceTypes',
              active: device.device_type_id,
              fields: 'protocol_id',
            })
            const protocolData = protocolResp.data
            this.mixins.errorsCheck(protocolData)
            const protocolId =
              protocolData.result && protocolData.result[0] && protocolData.result[0].protocol_id
            /* gettings messages parameters */
            const messageParamsResp = await this.$connector.gw.getChannelProtocols(protocolId, {
              fields: 'message_parameters',
            })
            this.mixins.requestStart('get channel protocol', {
              endpoint: 'getChannelProtocols',
              active: protocolId,
              fields: 'message_parameters',
            })
            const messageParamsData = messageParamsResp.data
            this.mixins.errorsCheck(messageParamsData)
            const messageParams =
              messageParamsData.result &&
              messageParamsData.result[0] &&
              messageParamsData.result[0].message_parameters
            /* initing columns by message parameters */
            colsSchema.schemas._protocol = {
              name: '_protocol',
              cols: [],
            }
            const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
            messageParams.forEach((param) => {
              const name = param.name
              const enumCol = {
                name,
                type: param.type || '',
                unit: param.unit || '',
                description: param.info || '',
              }
              const schemaCol = {
                name,
                width: 150,
              }
              if (name.match(/timestamp$/)) {
                enumCol.addition = `${locale.slice(0, 3)}:${locale.slice(3)}`
                enumCol.type = ''
                enumCol.unit = ''
                schemaCol.width = 190
              }
              if (name === 'timestamp') {
                /* insert timestamp column in the first place */
                colsSchema.schemas._protocol.cols.unshift(schemaCol)
                colsSchema.enum.timestamp = enumCol
              } else {
                colsSchema.schemas._protocol.cols.push(schemaCol)
                colsSchema.enum[name] = enumCol
              }
            })
          }
          if (needEtc) {
            device.device_type_id &&
              colsSchema.schemas._protocol.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
            !colsFromStorage &&
              colsSchema.schemas._default.cols.push({ name: 'etc', width: 150, __dest: 'etc' })
          }
          colsSchema.enum.etc = { name: 'etc', __dest: 'etc' }
          this.setCols(colsSchema)
        } catch (e) {
          errorHandler && errorHandler(e, deviceId)
          if (process.env.DEV) {
            console.log(e)
          }
        }
      },
      async getMessages(params) {
        let result = []
        const isLoadingActive = this.isLoading
        try {
          if (!isLoadingActive) {
            this.isLoading = true
          }
          const resp = await this.$connector.gw.getDevicesMessages(deviceId, {
            data: JSON.stringify(params),
          })
          this.mixins.requestStart('get device messages', {
            endpoint: 'getDevicesMessages',
            active: deviceId,
            data: JSON.stringify(params),
          })
          const data = resp.data
          this.mixins.errorsCheck(data)
          if (!isLoadingActive) {
            this.isLoading = false
          }
          result = data.result || []
        } catch (e) {
          errorHandler && errorHandler(e, deviceId)
          if (process.env.DEV) {
            console.log(e)
          }
          if (!isLoadingActive) {
            this.isLoading = false
          }
        }
        return result
      },
      async getMessagesByInitTimestamp(initTimestamp) {
        const params = this.generateParams()
        const beforeMessagesParams = {
          ...params,
          from: this.timestampFrom / 1000,
          to: initTimestamp,
          reverse: true,
          count: this.limit / 2,
        }
        const beforeMessages = await this.getMessages(beforeMessagesParams)
        const afterMessagesParams = {
          from: initTimestamp + 0.000001,
          to: this.timestampTo / 1000,
          count: this.limit - beforeMessages.length,
        }
        const afterMessages = await this.getMessages(afterMessagesParams)
        const messages = [...beforeMessages.reverse(), ...afterMessages]
        return messages
      },
      async getMissedMessages() {
        /* getting missed messages after offline */
        try {
          this.isLoading = true
          const { start, end, lastMessageIndex } = this.offline
          const params = {
            from: start,
            to: end,
          }
          if (this.filter) {
            params.data.filter = this.filter
          }
          const resp = await this.$connector.gw.getDevicesMessages(deviceId, {
            data: JSON.stringify(params),
          })
          this.mixins.requestStart('get devices messages', {
            endpoint: 'getDevicesMessages',
            active: deviceId,
            data: JSON.stringify(params),
          })
          const data = resp.data
          this.mixins.errorsCheck(data)
          this.setMissingMessages({ data: data.result, index: lastMessageIndex })
          this.isLoading = false
        } catch (e) {
          errorHandler && errorHandler(e, deviceId)
          if (process.env.DEV) {
            console.log(e)
          }
          this.isLoading = false
        }
      },
      async pollingGet() {
        const filter = this.filter
          ? `$filter/payload=${encodeURIComponent(this.filter)}`
          : undefined
        await this.$connector.subscribeMessagesDevices(
          deviceId,
          (message) => {
            this.messagesBuffer.push(JSON.parse(message))
          },
          { rh: 2, prefix: filter },
        )
        this.realtimeEnabled = true
        console.log(
          '[messages store]: pollingGet: subscribed to messagesDevices: ',
          deviceId,
          this.filter || '',
        )
        return () => {
          this.loopId = this.initRenderLoop()
        }
      },
      async unsubscribePooling() {
        if (this.loopId) {
          clearInterval(this.loopId)
          this.messagesBuffer = []
          this.loopId = 0
        }
        const filter = this.filter
          ? `$filter/payload=${encodeURIComponent(this.filter)}`
          : undefined
        await this.$connector.unsubscribeMessagesDevices(deviceId, undefined, { prefix: filter })
        this.realtimeEnabled = false
        console.log(
          '[messages store]: unsubscribePooling: unsubscribed from messages device: ',
          deviceId,
          this.filter || '',
        )
      },
      resetState() {
        if (this.loopId) {
          clearInterval(this.loopId)
          this.messagesBuffer = []
          this.loopId = 0
        }
        this.realtimeEnabled = false
      },
    },
  })()
