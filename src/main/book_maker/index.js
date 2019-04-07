import UUBook from './resource/uuBook'
import CK101Book from './resource/ck101Book'

export default class BookMaker {
  constructor(targetPageUrl, bookName, author) {
    const Resource = matchResource(targetPageUrl)
    return new Resource(targetPageUrl, bookName, author)
  }

  static async fetch(targetPageUrl) {
    let Resource;
    try {
      Resource = matchResource(targetPageUrl)
    } catch(err) {
      throw err;
    }
    return Resource.fetch(targetPageUrl)
  }
}

function getHost(targetPageUrl) {
  const url = new URL(targetPageUrl)
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

function matchResource(targetPageUrl) {
  const host = getHost(targetPageUrl)
  const site = getSite(host)
  switch(site)
  {
    case 'UUkanshu':
      return UUBook;
    case 'ck101':
      return CK101Book;
    default:
      throw new Error('不支援的網站')
  }
}
