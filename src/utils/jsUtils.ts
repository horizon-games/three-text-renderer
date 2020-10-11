export function boobyTrap<T>(
  obj: any,
  propName: string,
  optionalSetCondition?: (value: T) => boolean,
  onGet = false
) {
  let _prop: T = obj[propName]
  Object.defineProperty(obj, propName, {
    get: () => {
      if (onGet) {
        // tslint:disable-next-line
        debugger
      }
      return _prop
    },
    set: (value: T) => {
      if (optionalSetCondition) {
        if (optionalSetCondition(value)) {
          // tslint:disable-next-line
          debugger
        }
      } else {
        // tslint:disable-next-line
        debugger
      }
      _prop = value
    }
  })
}
Object.defineProperty(window, 'boobyTrap', { value: boobyTrap })

export const decorateMethodBefore = (
  obj: any,
  methodName: string,
  newMethod: () => void
) => {
  const oldMethod = obj[methodName] as () => void
  obj[methodName] = (...args: []) => {
    newMethod.apply(obj, args)
    const result = oldMethod.apply(obj, args)
    return result
  }
}
Object.defineProperty(window, 'decorateMethodBefore', {
  value: decorateMethodBefore
})

export const decorateMethodAfter = (
  obj: any,
  methodName: string,
  newMethod: () => void
) => {
  const oldMethod = obj[methodName] as () => void
  obj[methodName] = (...args: []) => {
    const result = oldMethod.apply(obj, args)
    newMethod.apply(obj, args)
    return result
  }
}
Object.defineProperty(window, 'decorateMethodAfter', {
  value: decorateMethodAfter
})

export const NOOP = () => {
  // do nothing!
}

export const iife = <T extends (...args: any[]) => any>(fn: T) => {
  fn()
  return fn
}

export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined
}

export function copyDefaults(onto: any, from: any) {
  for (const key of Object.keys(from)) {
    if (!onto.hasOwnProperty(key)) {
      onto[key] = from[key]
    }
  }
}

export function defaultNumber(val: number | undefined, defVal: number) {
  return val !== undefined ? val : defVal
}

export function lockProp(target: any, propName: string) {
  const _value = target[propName]
  Object.defineProperty(target, propName, {
    get() {
      return _value
    },
    //@ts-ignore
    set(val) {
      //console.warn(propName + ' change prevented.')
    }
  })
}

export function unlockProp(target: any, propName: string) {
  let _value = target[propName]
  Object.defineProperty(target, propName, {
    get() {
      return _value
    },
    set(val) {
      _value = val
    }
  })
}

export function getRandomProperty(obj: any) {
  const keys = Object.keys(obj)
  return obj[keys[~~(Math.random() * keys.length) % keys.length]]
}
