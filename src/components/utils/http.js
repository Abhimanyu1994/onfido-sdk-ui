import { events } from 'onfido-sdk-core'
import Tracker from '../../Tracker'
const SDK_SERVER_URL = 'https://sdk.onfido.com'

const reduceObj = (object, callback, initialValue) =>
  Object.keys(object).reduce(
    (accumulator, key) => callback(accumulator, object[key], key, object),
    initialValue)

const objectToFormData = (object) =>
  reduceObj(object, (formData, value, key) => {
    formData.append(key, value)
    return formData;
  }, new FormData())

const errorMessage = (status) => {
  if (status === 401 || status === 403) return 'unauthorized'
  if (status >= 500) {
    'server error' }
  else {
    'request error'
  }
}

const handleError = (status, callback) => {
  const message = errorMessage(status)
  Tracker.sendError(message)
  callback()
}

export const postToServer = (payload, serverUrl, token, onSuccess, onError) => {
  const request = new XMLHttpRequest()
  const url = serverUrl ? serverUrl : SDK_SERVER_URL
  request.open('POST', `${url}/validate_document`)
  request.setRequestHeader('Content-Type', 'application/json')
  request.setRequestHeader('Authorization', token)

  request.onload = () => {
    if (request.status === 200) {
      onSuccess(JSON.parse(request.response))}
    else {
      handleError(request.status, onError)
    }
  }

  request.onerror = () => handleError(request.status, onError)

  request.send(payload)
}
