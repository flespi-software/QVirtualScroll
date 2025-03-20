
export const useMixins = (label, errorHandler) => {
  const errorsCheck = (data) => {
    if (data.errors) {
      requestError(data.errors)
      data.errors.forEach((error) => {
        const errObject = new Error(error.reason)
        errorHandler && errorHandler(errObject)
      })
    } else {
      requestFullfiled()
    }
  }

  const requestError = (error) => {
    console.info(`[${label}: request error]: ${JSON.stringify(error)}`)
  }

  const requestStart = (info) => {
    if (process.env.DEV) {
      console.info(`[${label}: request started]: ${JSON.stringify(info)}`)
    }
  }
  const requestFullfiled = () => {
    if (process.env.DEV) {
      console.info(`[${label}: request fullfilled]`)
    }
  }

  return { errorsCheck, requestError, requestStart, requestFullfiled }
}