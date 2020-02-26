const locale = new Date().toString().match(/([-+][0-9]+)\s/)[1]
export default [
  {
    name: 'timestamp',
    width: 100,
    display: true,
    description: 'Log event time',
    addition: `${locale.slice(0, 3)}:${locale.slice(3)}`
  },
  {
    name: 'event_code',
    title: 'event',
    width: 400,
    display: true,
    description: 'Log event code and description'
  },
  {
    name: 'ident',
    width: 150,
    display: true,
    description: 'Connected device\'s identification string'
  },
  {
    name: 'msgs',
    width: 85,
    display: true,
    description: 'Number of messages received'
  },
  {
    name: 'recv',
    width: 85,
    display: true,
    description: 'Number of bytes received'
  },
  {
    name: 'send',
    width: 85,
    display: true,
    description: 'Number of bytes sent'
  },
  {
    name: 'source',
    width: 150,
    display: true,
    description: 'Connected device\'s address'
  },
  {
    name: 'host',
    width: 150,
    display: true,
    description: 'IP address from which HTTP request was received'
  },
  {
    name: 'duration',
    width: 85,
    display: true,
    description: 'Connection duration in seconds'
  },
  {
    name: 'transport',
    width: 85,
    display: true,
    description: 'Connected device\'s transport: tcp, udp, http etc'
  },
  { name: 'etc', width: 150, display: true, __dest: 'etc' }
]
