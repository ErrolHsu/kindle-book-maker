import UUBook from './source/uuBook'
import CK101Book from './source/ck101Book'

class BookMaker {
  constructor(targetUrl) {
    const host = getHost(targetUrl)
    const site = getSite(host)

    switch(site)
    {
      case 'UUkanshu':
        return new UUBook(targetUrl);
      case 'ck101':
        return new CK101Book(targetUrl);
      default:
        return new CK101Book(targetUrl);
    }
  }
}

function getHost(targetUrl) {
  const url = new URL(targetUrl)
  return url.host
}

function getSite(host) {
  const hostArray = host.split('.')
  if ( isUUkanshu(host) ) {
    return 'UUkanshu'
  }

  if ( isCk101(host) ) {
    return 'ck101'
  }
}

function isUUkanshu(host) {
  const hostArray = host.split('.')
  return hostArray.some(element => element === 'uukanshu')
}

function isCk101(host) {
  const hostArray = host.split('.')
  return hostArray.some(element => element === 'ck101')
}

export default BookMaker;
