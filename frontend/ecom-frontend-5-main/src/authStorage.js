let _token = null;

export const getAccessToken = () => _token;
export const setAccessToken = (t) => { _token = t; };
export const clearAccessToken = () => { _token = null; };
export const hasToken = () => !!_token;
