export function createWxAuthRedirectUrl(appId, redirectUri) {
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=snsapi_base#wechat_redirect`;
}

export function isWechat() {
    const userAgent = window.navigator.userAgent.toLocaleLowerCase();
    return /(micromessenger)/.test(userAgent);
}

export function isAlipay() {
    const userAgent = window.navigator.userAgent.toLocaleLowerCase();
    return /alipayclient/.test(userAgent);
}

export function isAndroid() {
    const userAgent = window.navigator.userAgent.toLocaleLowerCase();
    return userAgent.indexOf('android') > -1 || userAgent.indexOf('adr') > -1;
}

export function isIos() {
    const userAgent = window.navigator.userAgent.toLocaleLowerCase();
    return /\(i[^;]+;( u;)? cpu.+mac os x/.test(userAgent);
}

export function getUrlParam(name) {
    const url = window.location.search;
    const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    const result = url.substr(1).match(reg);
    return result ? decodeURIComponent(result[2]) : null;
}

export function delUrlParam(url, paramKey) {
    if (!url) {
        return '';
    }
    const index = url.indexOf('?');
    if (index === -1) {
        return url;
    }
    const urlParam = url.substr(index + 1);
    const beforeUrl = url.substr(0, index);
    let nextUrl = '';
    const arr = [];
    if (urlParam !== '') {
        const urlParamArr = urlParam.split("&");

        for (let i = 0; i < urlParamArr.length; i++) {
            const paramArr = urlParamArr[i].split("=");
            if (paramArr[0] !== paramKey) {
                arr.push(urlParamArr[i]);
            }
        }
    }

    if (arr.length > 0) {
        nextUrl = "?" + arr.join("&");
    }
    return beforeUrl + nextUrl;
}