export type Setter<T> = <K extends keyof T>(key: K, value: T[K]) => void;

export function createSetDataImmer<T>(set: (fn: (state: T) => void) => void) {
  return <K extends keyof T>(key: K, value: T[K]) => {
    set((state) => {
      state[key] = value;
    });
  };
}

export function createSetData<T>(set: (fn: (state: T) => T) => void) {
  return <K extends keyof T>(key: K, value: T[K]) => {
    set((state) => ({
      ...state,
      [key]: value,
    }));
  };
}

export type FormSetter<T> = <K1 extends keyof T, K2 extends keyof T[K1]>(
  key1: K1,
  key2: K2,
  value: T[K1][K2],
) => void;

export function createSetFormDataImmer<T>(set: (fn: (state: T) => void) => void): FormSetter<T> {
  return (key1, key2, value) => {
    set((state) => {
      state[key1][key2] = value;
    });
  };
}

export function createSetFormData<T>(set: (fn: (state: T) => T) => void): FormSetter<T> {
  return (key1, key2, value) => {
    set((state) => ({
      ...state,
      [key1]: {
        ...state[key1],
        [key2]: value,
      },
    }));
  };
}