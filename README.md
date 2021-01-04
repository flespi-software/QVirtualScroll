# QVirtualScroll

> Simple Quasar component based on [VueVirtualScrollList](https://github.com/tangbc/vue-virtual-scroll-list) that displays any data in virtual scroll list and Vuex modules that get and process data from flespi.io

## Install
````bash
$ npm install git+https://github.com/flespi-software/QVirtualScroll.git --save
````

## [Component API and structures](docs/ComponentAPI.md)

## Vuex Modules
All modules depend on the availability of the server field and the token in the global state
### [Logs Module](docs/LogsModule.md)
Module for processing and storing log messages from the channel

### [Channels Messages Module](docs/ChannelsMessagesSerialModule.md)
Module for processing and storing messages poll from the channel in serial mode

### [Devices Messages Module](docs/DeviceMessagesModule.md)
Module for processing and storing messages from the device

### [Intervals Module](docs/IntervalsModule.md)
Module for processing and storing intervals

## Requirements:

- [Node.js](https://nodejs.org/en/) (>=9.x)
- npm version 3+ and [Git](https://git-scm.com/).

## [Usage example](docs/Example.md)

## Demo
[Demo](https://flespi-software.github.io/QVirtualScroll/)

## License
[MIT](https://github.com/flespi-software/QVirtualScroll/blob/master/LICENSE) license.
