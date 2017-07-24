import { performHttpReq } from '../utils/http'
import Tracker from '../../Tracker'
import forEach from 'object-loops/for-each'
import { humanizeField } from '../utils'

const errorType = (key, val) => {
  if (key === 'document_detection') return 'INVALID_CAPTURE'
  // on corrupted PDF
  if (key === 'file') return 'CORRUPTED_FILE'
  // on PDF submission for face detection
  if (key === 'attachment' || key === 'attachment_content_type') return 'INVALID_TYPE'
  if (key === 'face_detection') {
    return val.indexOf('Multiple faces') === -1 ? 'NO_FACE_ERROR' : 'MULTIPLE_FACES_ERROR'
  }
}

const identifyValidationError = (error) => {
  const fields = error.fields
  for (const key of Object.keys(fields)) {
    const val = fields[key]
    console.log(humanizeField(key), val)
    error = errorType(key, val[0])
  }
  return error
}

const serverError = ({status, response}) => {
  Tracker.sendError(`${status} - ${response}`)
  return 'SERVER_ERROR'
}

const handleError = (request, callback) => {
  const response = JSON.parse(request.response)
  console.log(request.status)
  const error = request.status === 422 ?
    identifyValidationError(response.error) :
    serverError(request)
  callback(error)
}

export const postToOnfido = ({blob, documentType, side}, captureType, token, advancedValidation, onSuccess, onError) => {
  if (captureType === 'face') return sendFile({blob}, 'live_photos', token, onSuccess, (request) => handleError(request, onError))
  sendFile({blob, type: documentType, side, advanced_validation: advancedValidation}, 'documents', token, onSuccess, (request) => handleError(request, onError))
}

const objectToFormData = (object) => {
  const formData = new FormData()
  forEach(object, (value, key) => formData.append(key, value))
  return formData
}

const sendFile = ({blob, ...extraOptions}, path, token, onSuccess, onError) => {
  const bodyOptions = {
    file: blob,
    sdk_source: 'onfido_web_sdk',
    sdk_version: process.env.SDK_VERSION,
    ...extraOptions
  }
  const requestParams = {
    payload: objectToFormData(bodyOptions),
    endpoint: `${process.env.ONFIDO_API_URL}/v2/${path}`,
    token: `Bearer ${token}`
  }
  performHttpReq(requestParams, onSuccess, onError)
}
