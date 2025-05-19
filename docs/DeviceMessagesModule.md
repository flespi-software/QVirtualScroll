# Device messages module
Module for processing and storing messages from the device

## Pinia store params
|Name| Description | Value |
| :-- | :---: | :-- |
| deviceId | flespi device ID | Number |
| lsNamespace | Local storage namespace | String |
| errorHandler | Custom error handler | function |

#### State
| Name  |  Description  | Init Value |
|---|---|---|
| cols | Columns schemas for device type | [] |
| device | Device json | {} |
| filter | Messages filter | '' |
| isLoading | Module async processing flag | false |
| limit | Limit count of messages| 1000 |
| loopId |  Polling loop Id | 0 |
| offline | Socket status flag | false |
| messages | Array of messages of device | [] |
| messagesBuffer | Buffer to collect yet unrendered messages for realtime tracking | [] |
| pages | Array of messages pages | [] |
| realtimeEnabled | Messages polling is enabled | false |
| reverse | Reverse messages order | false |
| selected | Selected messages array | [] |
| sortBy | Message field name filtering by | '' |
| timestampFrom | 'from' time limit | 0 |
| timestampTo | 'to' time limit | 0 |

#### Actions
| Name  |  Description  | Payload |
|---|---|---|
| getCols | Retrieving and saving a list of all message fields | *Empty*|
|get| Retrieving and saving a list of all message| preaction: { name: preactionName, payload: preactionPayload }|
|pollingGet| Retrieving and saving a list of all messages | *Empty*|
|unsubscribePooling| Remove polling | *Empty* |
|getMessages| Getting messages by current settings in limit | Number count |
|getMissedMessages| Getting messages from start/finish offline time | *Empty* |
